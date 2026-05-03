use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VaultRole {
    User,
    Merchant,
    InternalOps,
    Regulator,
    Auditor,
}

#[account]
pub struct VaultAccount {
    pub owner: Pubkey,
    pub is_delegated: bool,
    pub role: VaultRole,
    pub session_nonce: u64,
    pub kyc_attestation: Option<[u8; 32]>,
    pub credit_tier: u8,
    pub lifetime_volume: u64,
    pub transfer_count: u64,
    pub created_at: i64,
    pub last_activity: i64,
    pub _reserved: [u8; 64],
}

impl VaultAccount {
    pub const LEN: usize = 8 + 32 + 1 + 1 + 8 + 33 + 1 + 8 + 8 + 8 + 8 + 64;
}

#[account]
pub struct AuctionAccount {
    pub creator: Pubkey,
    pub asset_mint: Pubkey,
    pub floor_price: u64,
    pub close_time: i64,
    pub status: AuctionStatus,
    pub bid_count: u32,
    pub winner: Option<Pubkey>,
    pub settlement_price: Option<u64>,
    pub tee_proof: Option<[u8; 64]>,
    pub auction_type: AuctionType,
    pub fee_collected: u64,
    pub created_at: i64,
    pub _reserved: [u8; 32],
}

impl AuctionAccount {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1 + 4 + 33 + 9 + 65 + 1 + 8 + 8 + 32;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AuctionStatus {
    Open,
    Closed,
    Settled,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AuctionType {
    Vickrey,
    FirstPrice,
}

#[account]
pub struct BidAccount {
    pub auction: Pubkey,
    pub bidder: Pubkey,
    pub commitment: [u8; 32],
    pub encrypted_bid: [u8; 128],
    pub refunded: bool,
    pub revealed_amount: Option<u64>,
    pub submitted_at: i64,
    pub _reserved: [u8; 16],
}

impl BidAccount {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 128 + 1 + 9 + 8 + 16;
}

#[account]
pub struct AgentAccount {
    pub owner: Pubkey,
    pub funding_vault: Pubkey,
    pub max_payment_per_tx: u64,
    pub daily_limit: u64,
    pub spent_today: u64,
    pub last_reset: i64,
    pub total_spent: u64,
    pub x402_count: u64,
    pub a2a_channels: u32,
    pub is_active: bool,
    pub registered_at: i64,
    pub _reserved: [u8; 16],
}

impl AgentAccount {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 4 + 1 + 8 + 16;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ChannelStatus {
    Open,
    Settling,
    Settled,
}

#[account]
pub struct ComplianceAccount {
    pub vault: Pubkey,
    pub kyc_hash: [u8; 32],
    pub kyc_level: u8,
    pub jurisdiction: u16,
    pub is_sanctioned: bool,
    pub genius_act_compliant: bool,
    pub issued_at: i64,
    pub expires_at: i64,
    pub _reserved: [u8; 16],
}

impl ComplianceAccount {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 2 + 1 + 1 + 8 + 8 + 16;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AuctionParams {
    pub floor_price: u64,
    pub duration_seconds: i64,
    pub auction_type: AuctionType,
    pub asset_description: [u8; 64],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AgentParams {
    pub max_payment_per_tx: u64,
    pub daily_limit: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct KycAttestationData {
    pub kyc_hash: [u8; 32],
    pub kyc_level: u8,
    pub jurisdiction: u16,
    pub genius_act_compliant: bool,
    pub expires_at: i64,
}
