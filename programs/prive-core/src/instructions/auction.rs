use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::state::*;
use crate::errors::PriveError;

pub const AUCTION_SEED: &[u8] = b"prive_auction";
pub const BID_SEED: &[u8] = b"prive_bid";
pub const AUCTION_FEE_BPS: u64 = 25;

pub fn create_auction(ctx: Context<CreateAuction>, params: AuctionParams) -> Result<()> {
    let auction_key = ctx.accounts.auction.key();
    let auction = &mut ctx.accounts.auction;
    let clock = Clock::get()?;
    require!(params.floor_price > 0, PriveError::InvalidAmount);
    require!(params.duration_seconds > 0, PriveError::InvalidDuration);
    require!(params.duration_seconds <= 7 * 24 * 3600, PriveError::DurationTooLong);
    auction.creator = ctx.accounts.creator.key();
    auction.asset_mint = ctx.accounts.asset_mint.key();
    auction.floor_price = params.floor_price;
    auction.close_time = clock.unix_timestamp + params.duration_seconds;
    auction.status = AuctionStatus::Open;
    auction.bid_count = 0;
    auction.winner = None;
    auction.settlement_price = None;
    auction.tee_proof = None;
    auction.auction_type = params.auction_type;
    auction.fee_collected = 0;
    auction.created_at = clock.unix_timestamp;
    auction._reserved = [0u8; 32];
    emit!(AuctionCreated { auction: auction_key, creator: auction.creator, floor_price: auction.floor_price, close_time: auction.close_time, timestamp: clock.unix_timestamp });
    Ok(())
}

#[derive(Accounts)]
pub struct CreateAuction<'info> {
    #[account(init, payer = creator, space = AuctionAccount::LEN)]
    pub auction: Account<'info, AuctionAccount>,
    pub asset_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn submit_sealed_bid(ctx: Context<SubmitSealedBid>, encrypted_bid: [u8; 128], commitment: [u8; 32]) -> Result<()> {
    let auction_key = ctx.accounts.auction.key();
    let auction = &mut ctx.accounts.auction;
    let bid = &mut ctx.accounts.bid;
    let clock = Clock::get()?;
    require!(auction.status == AuctionStatus::Open, PriveError::AuctionNotOpen);
    require!(clock.unix_timestamp < auction.close_time, PriveError::AuctionExpired);
    bid.auction = auction_key;
    bid.bidder = ctx.accounts.bidder.key();
    bid.commitment = commitment;
    bid.encrypted_bid = encrypted_bid;
    bid.refunded = false;
    bid.revealed_amount = None;
    bid.submitted_at = clock.unix_timestamp;
    bid._reserved = [0u8; 16];
    auction.bid_count = auction.bid_count.saturating_add(1);
    emit!(BidSubmitted { auction: auction_key, commitment: bid.commitment, bid_count: auction.bid_count, timestamp: clock.unix_timestamp });
    Ok(())
}

#[derive(Accounts)]
pub struct SubmitSealedBid<'info> {
    #[account(mut, constraint = auction.status == AuctionStatus::Open @ PriveError::AuctionNotOpen)]
    pub auction: Account<'info, AuctionAccount>,
    #[account(init, payer = bidder, space = BidAccount::LEN)]
    pub bid: Account<'info, BidAccount>,
    #[account(mut)]
    pub bidder_usdc_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub auction_escrow_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub bidder: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn close_auction(ctx: Context<CloseAuction>) -> Result<()> {
    let auction_key = ctx.accounts.auction.key();
    let auction = &mut ctx.accounts.auction;
    let clock = Clock::get()?;
    require!(auction.status == AuctionStatus::Open, PriveError::AuctionNotOpen);
    require!(clock.unix_timestamp >= auction.close_time, PriveError::AuctionNotExpired);
    require!(auction.bid_count > 0, PriveError::NoBids);
    auction.status = AuctionStatus::Settled;
    emit!(AuctionClosed { auction: auction_key, bid_count: auction.bid_count, timestamp: clock.unix_timestamp });
    Ok(())
}

#[derive(Accounts)]
pub struct CloseAuction<'info> {
    #[account(mut, constraint = auction.status == AuctionStatus::Open @ PriveError::AuctionNotOpen)]
    pub auction: Account<'info, AuctionAccount>,
    pub authority: Signer<'info>,
}

pub fn claim_auction_win(ctx: Context<ClaimAuctionWin>) -> Result<()> {
    let auction = &ctx.accounts.auction;
    require!(auction.status == AuctionStatus::Settled, PriveError::AuctionNotSettled);
    require!(auction.winner == Some(ctx.accounts.winner.key()), PriveError::NotAuctionWinner);
    emit!(AuctionWinClaimed { auction: ctx.accounts.auction.key(), winner: ctx.accounts.winner.key(), timestamp: Clock::get()?.unix_timestamp });
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimAuctionWin<'info> {
    #[account(constraint = auction.status == AuctionStatus::Settled @ PriveError::AuctionNotSettled)]
    pub auction: Account<'info, AuctionAccount>,
    pub winner: Signer<'info>,
}

#[event]
pub struct AuctionCreated { pub auction: Pubkey, pub creator: Pubkey, pub floor_price: u64, pub close_time: i64, pub timestamp: i64 }
#[event]
pub struct BidSubmitted { pub auction: Pubkey, pub commitment: [u8; 32], pub bid_count: u32, pub timestamp: i64 }
#[event]
pub struct AuctionClosed { pub auction: Pubkey, pub bid_count: u32, pub timestamp: i64 }
#[event]
pub struct AuctionWinClaimed { pub auction: Pubkey, pub winner: Pubkey, pub timestamp: i64 }
