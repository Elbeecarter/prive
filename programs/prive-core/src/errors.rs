use anchor_lang::prelude::*;

#[error_code]
pub enum PriveError {
    #[msg("Unauthorized: signer does not own this account")]
    Unauthorized,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Vault is not delegated to MagicBlock PER")]
    NotDelegated,
    #[msg("Vault is already delegated to MagicBlock PER")]
    AlreadyDelegated,
    #[msg("Recipient vault is not delegated to MagicBlock PER")]
    RecipientNotDelegated,
    #[msg("Auction is not currently open for bidding")]
    AuctionNotOpen,
    #[msg("Auction bidding period has expired")]
    AuctionExpired,
    #[msg("Auction close time has not been reached yet")]
    AuctionNotExpired,
    #[msg("Auction has not been settled by TEE yet")]
    AuctionNotSettled,
    #[msg("Signer is not the auction winner")]
    NotAuctionWinner,
    #[msg("Auction has no bids")]
    NoBids,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Invalid duration")]
    InvalidDuration,
    #[msg("Duration exceeds maximum of 7 days")]
    DurationTooLong,
    #[msg("Insufficient balance in PER vault")]
    InsufficientBalance,
    #[msg("KYC attestation required")]
    KycRequired,
    #[msg("KYC attestation has expired")]
    KycExpired,
    #[msg("Credit tier too low for this pool")]
    CreditTierInsufficient,
    #[msg("Loan is not active")]
    LoanNotActive,
    #[msg("Agent spending limit exceeded")]
    AgentLimitExceeded,
    #[msg("Agent is not active")]
    AgentNotActive,
    #[msg("A2A channel is not open")]
    ChannelNotOpen,
    #[msg("Invalid TEE proof")]
    InvalidTeeProof,
    #[msg("Account is sanctioned")]
    AccountSanctioned,
    #[msg("Bid does not meet floor price")]
    BidBelowFloor,
}
