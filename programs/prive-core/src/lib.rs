use anchor_lang::prelude::*;

pub mod errors;
pub mod state;
pub mod instructions;

use instructions::vault::*;
use instructions::transfer::*;
use instructions::auction::*;
use instructions::agent::*;
use instructions::compliance::*;
use state::*;

declare_id!("9VzuKgdog1uRcB4Xjnx2At3d8ZQ6NdwtC5bhFfwz6tBe");

#[program]
pub mod prive_core {
    use super::*;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        role: VaultRole,
    ) -> Result<()> {
        instructions::vault::initialize_vault(ctx, role)
    }

    pub fn delegate_vault_to_per(
        ctx: Context<DelegateVaultToPer>,
    ) -> Result<()> {
        instructions::vault::delegate_vault_to_per(ctx)
    }

    pub fn undelegate_vault(
        ctx: Context<UndelegateVault>,
    ) -> Result<()> {
        instructions::vault::undelegate_vault(ctx)
    }

    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
    ) -> Result<()> {
        instructions::transfer::deposit(ctx, amount)
    }

    pub fn private_transfer(
        ctx: Context<PrivateTransfer>,
        amount: u64,
        encrypted_memo: [u8; 64],
    ) -> Result<()> {
        instructions::transfer::private_transfer(ctx, amount, encrypted_memo)
    }

    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
    ) -> Result<()> {
        instructions::transfer::withdraw(ctx, amount)
    }

    pub fn create_auction(
        ctx: Context<CreateAuction>,
        params: AuctionParams,
    ) -> Result<()> {
        instructions::auction::create_auction(ctx, params)
    }

    pub fn submit_sealed_bid(
        ctx: Context<SubmitSealedBid>,
        encrypted_bid: [u8; 128],
        commitment: [u8; 32],
    ) -> Result<()> {
        instructions::auction::submit_sealed_bid(ctx, encrypted_bid, commitment)
    }

    pub fn close_auction(
        ctx: Context<CloseAuction>,
    ) -> Result<()> {
        instructions::auction::close_auction(ctx)
    }

    pub fn claim_auction_win(
        ctx: Context<ClaimAuctionWin>,
    ) -> Result<()> {
        instructions::auction::claim_auction_win(ctx)
    }

    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        params: AgentParams,
    ) -> Result<()> {
        instructions::agent::register_agent(ctx, params)
    }

    pub fn process_x402_payment(
        ctx: Context<ProcessX402Payment>,
        amount: u64,
        api_endpoint_hash: [u8; 32],
    ) -> Result<()> {
        instructions::agent::process_x402_payment(ctx, amount, api_endpoint_hash)
    }

    pub fn issue_kyc_attestation(
        ctx: Context<IssueKycAttestation>,
        data: KycAttestationData,
    ) -> Result<()> {
        instructions::compliance::issue_kyc_attestation(ctx, data)
    }

    pub fn generate_audit_proof(
        ctx: Context<GenerateAuditProof>,
        request_id: [u8; 32],
    ) -> Result<()> {
        instructions::compliance::generate_audit_proof(ctx, request_id)
    }

    pub fn set_vault_role(
        ctx: Context<SetVaultRole>,
        target: Pubkey,
        role: VaultRole,
        granted: bool,
    ) -> Result<()> {
        instructions::compliance::set_vault_role(ctx, target, role, granted)
    }
}
