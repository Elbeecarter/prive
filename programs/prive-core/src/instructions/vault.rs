use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PriveError;

pub const VAULT_SEED: &[u8] = b"prive_vault";

pub fn initialize_vault(
    ctx: Context<InitializeVault>,
    role: VaultRole,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;

    vault.owner          = ctx.accounts.owner.key();
    vault.is_delegated   = false;
    vault.role           = role;
    vault.session_nonce  = 0;
    vault.kyc_attestation = None;
    vault.credit_tier    = 0;
    vault.lifetime_volume = 0;
    vault.transfer_count = 0;
    vault.created_at     = clock.unix_timestamp;
    vault.last_activity  = clock.unix_timestamp;
    vault._reserved      = [0u8; 64];

    emit!(VaultInitialized {
        owner: vault.owner,
        vault: ctx.accounts.vault.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = owner,
        space = VaultAccount::LEN,
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn delegate_vault_to_per(
    ctx: Context<DelegateVaultToPer>,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    require!(!vault.is_delegated, PriveError::AlreadyDelegated);
    require!(vault.owner == ctx.accounts.owner.key(), PriveError::Unauthorized);

    vault.is_delegated  = true;
    vault.last_activity = Clock::get()?.unix_timestamp;

    emit!(VaultDelegated {
        owner: vault.owner,
        vault: ctx.accounts.vault.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct DelegateVaultToPer<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub vault: Account<'info, VaultAccount>,

    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn undelegate_vault(
    ctx: Context<UndelegateVault>,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    require!(vault.is_delegated, PriveError::NotDelegated);
    require!(vault.owner == ctx.accounts.owner.key(), PriveError::Unauthorized);

    vault.is_delegated  = false;
    vault.last_activity = Clock::get()?.unix_timestamp;

    emit!(VaultUndelegated {
        owner: vault.owner,
        vault: ctx.accounts.vault.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct UndelegateVault<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub vault: Account<'info, VaultAccount>,

    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct VaultInitialized {
    pub owner: Pubkey,
    pub vault: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct VaultDelegated {
    pub owner: Pubkey,
    pub vault: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct VaultUndelegated {
    pub owner: Pubkey,
    pub vault: Pubkey,
    pub timestamp: i64,
}
