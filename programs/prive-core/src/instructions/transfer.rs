use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};
use crate::state::*;
use crate::errors::PriveError;

pub const POOL_SEED: &[u8] = b"prive_pool";
pub const PROTOCOL_FEE_BPS: u64 = 4;

pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, PriveError::InvalidAmount);
    require!(ctx.accounts.vault.is_delegated, PriveError::NotDelegated);
    let clock = Clock::get()?;
    let cpi_accounts = TransferChecked {
        mint: ctx.accounts.usdc_mint.to_account_info(),
        from: ctx.accounts.user_usdc_ata.to_account_info(),
        to: ctx.accounts.pool_usdc_ata.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };
    token_interface::transfer_checked(
        CpiContext::new(ctx.accounts.token_program.key(), cpi_accounts),
        amount,
        ctx.accounts.usdc_mint.decimals,
    )?;
    let vault = &mut ctx.accounts.vault;
    vault.lifetime_volume = vault.lifetime_volume.saturating_add(amount);
    vault.last_activity = clock.unix_timestamp;
    emit!(DepositEvent { vault: vault.key(), amount, timestamp: clock.unix_timestamp });
    Ok(())
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, has_one = owner)]
    pub vault: Account<'info, VaultAccount>,
    #[account(mut)]
    pub user_usdc_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub pool_usdc_ata: InterfaceAccount<'info, TokenAccount>,
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    pub owner: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn private_transfer(ctx: Context<PrivateTransfer>, amount: u64, encrypted_memo: [u8; 64]) -> Result<()> {
    require!(amount > 0, PriveError::InvalidAmount);
    let clock = Clock::get()?;
    let vault = &mut ctx.accounts.sender_vault;
    require!(vault.is_delegated, PriveError::NotDelegated);
    require!(ctx.accounts.recipient_vault.is_delegated, PriveError::RecipientNotDelegated);
    let fee = amount.checked_mul(PROTOCOL_FEE_BPS).ok_or(PriveError::Overflow)?.checked_div(10_000).ok_or(PriveError::Overflow)?;
    let _ = fee;
    vault.transfer_count = vault.transfer_count.saturating_add(1);
    vault.lifetime_volume = vault.lifetime_volume.saturating_add(amount);
    vault.last_activity = clock.unix_timestamp;
    let mut commitment = [0u8; 32];
    commitment[..8].copy_from_slice(&amount.to_le_bytes());
    commitment[8..16].copy_from_slice(&clock.unix_timestamp.to_le_bytes());
    commitment[16..48].copy_from_slice(&encrypted_memo[..32]);
    emit!(PrivateTransferEvent { commitment, timestamp: clock.unix_timestamp });
    Ok(())
}

#[derive(Accounts)]
pub struct PrivateTransfer<'info> {
    #[account(mut, has_one = owner)]
    pub sender_vault: Account<'info, VaultAccount>,
    #[account(mut)]
    pub recipient_vault: Account<'info, VaultAccount>,
    pub owner: Signer<'info>,
}

pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    require!(amount > 0, PriveError::InvalidAmount);
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;
    require!(vault.is_delegated, PriveError::NotDelegated);
    vault.last_activity = clock.unix_timestamp;
    emit!(WithdrawEvent { vault: vault.key(), amount, timestamp: clock.unix_timestamp });
    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, has_one = owner)]
    pub vault: Account<'info, VaultAccount>,
    #[account(mut)]
    pub user_usdc_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub pool_usdc_ata: InterfaceAccount<'info, TokenAccount>,
    pub owner: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[event]
pub struct DepositEvent { pub vault: Pubkey, pub amount: u64, pub timestamp: i64 }
#[event]
pub struct PrivateTransferEvent { pub commitment: [u8; 32], pub timestamp: i64 }
#[event]
pub struct WithdrawEvent { pub vault: Pubkey, pub amount: u64, pub timestamp: i64 }
