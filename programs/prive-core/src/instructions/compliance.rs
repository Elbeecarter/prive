use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::PriveError;

pub const COMPLIANCE_SEED: &[u8] = b"prive_compliance";

pub fn issue_kyc_attestation(ctx: Context<IssueKycAttestation>, data: KycAttestationData) -> Result<()> {
    let vault_key = ctx.accounts.vault.key();
    let vault = &mut ctx.accounts.vault;
    let compliance = &mut ctx.accounts.compliance;
    let clock = Clock::get()?;
    require!(!compliance.is_sanctioned, PriveError::AccountSanctioned);
    require!(data.expires_at > clock.unix_timestamp, PriveError::KycExpired);
    compliance.vault = vault_key;
    compliance.kyc_hash = data.kyc_hash;
    compliance.kyc_level = data.kyc_level;
    compliance.jurisdiction = data.jurisdiction;
    compliance.is_sanctioned = false;
    compliance.genius_act_compliant = data.genius_act_compliant;
    compliance.issued_at = clock.unix_timestamp;
    compliance.expires_at = data.expires_at;
    compliance._reserved = [0u8; 16];
    vault.kyc_attestation = Some(data.kyc_hash);
    vault.credit_tier = data.kyc_level.min(5);
    emit!(KycIssued { vault: vault_key, kyc_level: data.kyc_level, timestamp: clock.unix_timestamp });
    Ok(())
}

#[derive(Accounts)]
pub struct IssueKycAttestation<'info> {
    #[account(init_if_needed, payer = authority, space = ComplianceAccount::LEN, seeds = [COMPLIANCE_SEED, vault.key().as_ref()], bump)]
    pub compliance: Account<'info, ComplianceAccount>,
    #[account(mut)]
    pub vault: Account<'info, VaultAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn generate_audit_proof(ctx: Context<GenerateAuditProof>, request_id: [u8; 32]) -> Result<()> {
    emit!(AuditProofGenerated { vault: ctx.accounts.vault.key(), request_id, auditor: ctx.accounts.regulator.key(), timestamp: Clock::get()?.unix_timestamp });
    Ok(())
}

#[derive(Accounts)]
pub struct GenerateAuditProof<'info> {
    pub vault: Account<'info, VaultAccount>,
    pub regulator: Signer<'info>,
}

pub fn set_vault_role(ctx: Context<SetVaultRole>, _target: Pubkey, role: VaultRole, _granted: bool) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.role = role;
    Ok(())
}

#[derive(Accounts)]
pub struct SetVaultRole<'info> {
    #[account(mut)]
    pub vault: Account<'info, VaultAccount>,
    pub authority: Signer<'info>,
}

#[event]
pub struct KycIssued { pub vault: Pubkey, pub kyc_level: u8, pub timestamp: i64 }
#[event]
pub struct AuditProofGenerated { pub vault: Pubkey, pub request_id: [u8; 32], pub auditor: Pubkey, pub timestamp: i64 }
