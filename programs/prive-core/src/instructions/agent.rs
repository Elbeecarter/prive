use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PriveError;

pub const AGENT_SEED: &[u8] = b"prive_agent";

pub fn register_agent(ctx: Context<RegisterAgent>, params: AgentParams) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    let clock = Clock::get()?;
    require!(params.max_payment_per_tx > 0, PriveError::InvalidAmount);
    require!(params.daily_limit >= params.max_payment_per_tx, PriveError::InvalidAmount);
    agent.owner = ctx.accounts.owner.key();
    agent.funding_vault = ctx.accounts.funding_vault.key();
    agent.max_payment_per_tx = params.max_payment_per_tx;
    agent.daily_limit = params.daily_limit;
    agent.spent_today = 0;
    agent.last_reset = clock.unix_timestamp;
    agent.total_spent = 0;
    agent.x402_count = 0;
    agent.a2a_channels = 0;
    agent.is_active = true;
    agent.registered_at = clock.unix_timestamp;
    agent._reserved = [0u8; 16];
    Ok(())
}

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(init, payer = owner, space = AgentAccount::LEN, seeds = [AGENT_SEED, owner.key().as_ref(), funding_vault.key().as_ref()], bump)]
    pub agent: Account<'info, AgentAccount>,
    pub funding_vault: Account<'info, VaultAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_x402_payment(ctx: Context<ProcessX402Payment>, amount: u64, api_endpoint_hash: [u8; 32]) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    let clock = Clock::get()?;
    require!(agent.is_active, PriveError::AgentNotActive);
    require!(amount <= agent.max_payment_per_tx, PriveError::AgentLimitExceeded);
    let seconds_per_day: i64 = 86_400;
    if clock.unix_timestamp - agent.last_reset >= seconds_per_day {
        agent.spent_today = 0;
        agent.last_reset = clock.unix_timestamp;
    }
    let new_spend = agent.spent_today.checked_add(amount).ok_or(PriveError::Overflow)?;
    require!(new_spend <= agent.daily_limit, PriveError::AgentLimitExceeded);
    agent.spent_today = new_spend;
    agent.total_spent = agent.total_spent.saturating_add(amount);
    agent.x402_count = agent.x402_count.saturating_add(1);
    let mut payment_hash = [0u8; 32];
    payment_hash[..8].copy_from_slice(&amount.to_le_bytes());
    payment_hash[8..16].copy_from_slice(&clock.unix_timestamp.to_le_bytes());
    payment_hash[16..].copy_from_slice(&api_endpoint_hash[..16]);
    emit!(X402PaymentProcessed { payment_hash, timestamp: clock.unix_timestamp });
    Ok(())
}

#[derive(Accounts)]
pub struct ProcessX402Payment<'info> {
    #[account(mut, seeds = [AGENT_SEED, owner.key().as_ref(), funding_vault.key().as_ref()], bump, has_one = owner, has_one = funding_vault)]
    pub agent: Account<'info, AgentAccount>,
    pub funding_vault: Account<'info, VaultAccount>,
    pub owner: Signer<'info>,
}

#[event]
pub struct X402PaymentProcessed { pub payment_hash: [u8; 32], pub timestamp: i64 }
