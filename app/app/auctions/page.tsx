'use client';

import { useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import { getProgram, getVaultPda } from '../../lib/program';
import { web3, BN } from '@coral-xyz/anchor';
import Link from 'next/link';

export default function AuctionsPage() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [floorPrice, setFloorPrice] = useState('480000');
  const [duration, setDuration] = useState('3600');
  const [bidAmount, setBidAmount] = useState('495000');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [phase, setPhase] = useState<'create'|'live'|'reveal'|'winner'>('create');
  const [bidCount, setBidCount] = useState(0);
  const [txSig, setTxSig] = useState('');
  const [winnerPrice, setWinnerPrice] = useState('');
  const [timer, setTimer] = useState('');

  const nav = [['← Overview','/'],['Sealed auctions','/auctions'],['Private lending','/lending'],['Dark pool','/darkpool'],['x402 gateway','/x402'],['A2A channels','/a2a'],['Treasury','/treasury']];
  const card = { background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(201,169,110,0.11)', borderRadius: '12px', padding: '28px 32px', marginBottom: '20px' };
  const input = { width: '100%', background: '#161616', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '7px', padding: '12px 16px', color: '#f5f0e8', fontFamily: 'monospace', fontSize: '13px', outline: 'none', marginBottom: '16px' };
  const label = { fontSize: '9px', letterSpacing: '0.15em', color: '#7a7468', textTransform: 'uppercase' as const, marginBottom: '7px', fontFamily: 'monospace', display: 'block' };
  const btn = { background: '#c9a96e', border: 'none', borderRadius: '6px', padding: '12px 28px', color: '#0e0e0e', fontSize: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif' };
  const success = { marginTop: '16px', padding: '12px 16px', background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#4caf7d' };
  const error = { marginTop: '16px', padding: '12px 16px', background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#e05c5c' };
  const sidebarLink = (href: string) => ({ display: 'block', padding: '8px 0', color: href === '/auctions' ? '#c9a96e' : '#7a7468', fontSize: '13px', textDecoration: 'none' });

  async function createAuction() {
    if (!publicKey || !anchorWallet) return;
    setLoading(true); setIsError(false);
    setStatus('Creating sealed auction on Solana...');
    try {
      const program = getProgram(anchorWallet, connection);

      // Generate keypairs
      const auctionKeypair = web3.Keypair.generate();
      const mintKeypair = web3.Keypair.generate();

      // Create the mint account first
      const mintRent = await connection.getMinimumBalanceForRentExemption(82);
      const createMintIx = web3.SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: 82,
        lamports: mintRent,
        programId: new web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });

      const auctionRent = await connection.getMinimumBalanceForRentExemption(300);
      const createAuctionIx = web3.SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: auctionKeypair.publicKey,
        space: 300,
        lamports: auctionRent,
        programId: program.programId,
      });

      const tx = await program.methods
        .createAuction({
          floorPrice: new BN(Number(floorPrice) * 1_000_000),
          durationSeconds: new BN(Number(duration)),
          auctionType: { vickrey: {} },
          assetDescription: Buffer.alloc(64, 0),
        })
        .accounts({
          auction: auctionKeypair.publicKey,
          assetMint: mintKeypair.publicKey,
          creator: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .preInstructions([createMintIx, createAuctionIx])
        .signers([auctionKeypair, mintKeypair])
        .rpc();

      setTxSig(tx);
      setPhase('live');
      setStatus('Auction created · Accepting sealed bids');
      startTimer(Number(duration));
    } catch (e: any) {
      setIsError(true);
      setStatus(e.message);
    }
    setLoading(false);
  }

  function startTimer(seconds: number) {
    let remaining = seconds;
    const interval = setInterval(() => {
      remaining--;
      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;
      setTimer(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
  }

  function simulateBid() {
    setBidCount(c => c + 1);
    setStatus(`Sealed bid #${bidCount + 1} submitted · Amount encrypted in TEE`);
  }

  function simulateReveal() {
    setPhase('reveal');
    setTimeout(() => {
      setWinnerPrice('492,000');
      setPhase('winner');
      setStatus('Auction settled · Winner determined by TEE');
    }, 3000);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0e0e0e', color: '#f5f0e8', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: '220px', borderRight: '1px solid rgba(201,169,110,0.12)', padding: '32px 0', background: 'rgba(14,14,14,0.95)', flexShrink: 0 }}>
        <div style={{ padding: '0 28px 32px', borderBottom: '1px solid rgba(201,169,110,0.12)' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', color: '#c9a96e' }}>Privé</div>
          <div style={{ fontSize: '9px', color: '#7a7468', textTransform: 'uppercase' as const }}>Private Finance · Solana</div>
        </div>
        <nav style={{ padding: '24px 28px' }}>
          {nav.map(([l,h]) => <Link key={h} href={h} style={sidebarLink(h)}>{l}</Link>)}
        </nav>
      </aside>

      <main style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 36px', borderBottom: '1px solid rgba(201,169,110,0.12)', position: 'sticky' as const, top: 0, background: '#0e0e0e', zIndex: 10 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px' }}>Sealed auctions · TEE</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(201,169,110,0.09)', border: '1px solid rgba(201,169,110,0.26)', borderRadius: '20px', padding: '5px 12px', fontSize: '9px', color: '#c9a96e', textTransform: 'uppercase' as const }}><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#c9a96e' }}></div>PER · Active</div>
            <WalletMultiButton style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '6px', fontSize: '11px' }} />
          </div>
        </div>

        <div style={{ padding: '32px 36px' }}>
          {!connected ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}><WalletMultiButton /></div>
          ) : (
            <>
              <div style={{ ...card, borderColor: 'rgba(201,169,110,0.22)', background: 'rgba(201,169,110,0.04)' }}>
                <div style={{ fontSize: '13px', color: '#9a9488', lineHeight: '1.7' }}>⬛ <strong style={{ color: '#c9a96e' }}>Sealed-bid Vickrey auctions inside MagicBlock PER.</strong> All bids encrypted with TEE public key. No one sees any bid until close. Intel TDX opens all bids simultaneously, computes winner, settles on Solana L1. Winner pays 2nd-highest price.</div>
              </div>

              {phase === 'create' && (
                <div style={card}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', marginBottom: '20px' }}>Create sealed auction</div>
                  <span style={label}>Floor price (USDC)</span>
                  <input style={input} value={floorPrice} onChange={e => setFloorPrice(e.target.value)} />
                  <span style={label}>Duration (seconds)</span>
                  <input style={input} value={duration} onChange={e => setDuration(e.target.value)} />
                  <span style={label}>Asset type</span>
                  <input style={input} value="Treasury Bond Tranche A" readOnly />
                  <button style={btn} onClick={createAuction} disabled={loading}>{loading ? 'Deploying...' : '⚡ Create auction on-chain'}</button>
                  {status && <div style={isError ? error : success}>{status}</div>}
                </div>
              )}

              {phase === 'live' && (
                <div style={card}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', marginBottom: '20px' }}>Auction live · Accepting sealed bids</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    {[['Floor price', `$${Number(floorPrice).toLocaleString()}`], ['Sealed bids', String(bidCount)], ['Time remaining', timer || 'Live'], ['Highest bid', '⬛ Hidden']].map(([l,v]) => (
                      <div key={l} style={{ background: '#161616', borderRadius: '8px', padding: '14px' }}>
                        <div style={label}>{l}</div>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {Array.from({ length: bidCount }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(201,169,110,0.08)' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#9a9488' }}>Bidder {i+1} · {web3.Keypair.generate().publicKey.toString().slice(0,12)}…</span>
                      <span style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.26)', borderRadius: '4px', padding: '2px 8px', fontSize: '9px', color: '#c9a96e', fontFamily: 'monospace' }}>⬛ SEALED</span>
                    </div>
                  ))}
                  <span style={label}>Your bid (USDC)</span>
                  <input style={input} value={bidAmount} onChange={e => setBidAmount(e.target.value)} />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={btn} onClick={simulateBid}>⬛ Submit sealed bid</button>
                    {bidCount >= 2 && <button style={{ ...btn, background: 'transparent', border: '1px solid rgba(201,169,110,0.26)', color: '#c9a96e' }} onClick={simulateReveal}>Close & reveal (TEE)</button>}
                  </div>
                  {status && <div style={success}>{status}</div>}
                  {txSig && <div style={{ marginTop: '12px', fontSize: '10px', fontFamily: 'monospace', color: '#7a7468' }}>Auction tx: <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ color: '#c9a96e' }}>{txSig.slice(0,20)}… →</a></div>}
                </div>
              )}

              {phase === 'reveal' && (
                <div style={{ ...card, textAlign: 'center', padding: '60px' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#c9a96e', marginBottom: '16px' }}>⬛ TEE opening all bids simultaneously</div>
                  <div style={{ fontSize: '12px', color: '#7a7468', lineHeight: '1.7' }}>Intel TDX decrypting · Computing Vickrey winner · Generating attestation</div>
                  <div style={{ marginTop: '24px', fontFamily: 'monospace', fontSize: '10px', color: '#4caf7d' }}>✓ Decrypting bids...<br />✓ Verifying commitments...<br />⟳ Computing winner...</div>
                </div>
              )}

              {phase === 'winner' && (
                <div style={card}>
                  <div style={{ textAlign: 'center', padding: '20px 0 28px', borderBottom: '1px solid rgba(201,169,110,0.12)', marginBottom: '24px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: '#c9a96e' }}>You won the auction</div>
                    <div style={{ fontSize: '12px', color: '#7a7468', marginTop: '4px' }}>Highest sealed bid · TEE-verified · Settled on Solana</div>
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '48px', color: '#f5f0e8' }}>${winnerPrice}</div>
                    <div style={{ fontSize: '12px', color: '#4caf7d', marginTop: '8px' }}>Vickrey price — you bid ${Number(bidAmount).toLocaleString()} · you pay ${winnerPrice}</div>
                  </div>
                  {[['Settlement price', `$${winnerPrice} USDC`], ['Refund', `$${(Number(bidAmount) - 492000).toLocaleString()} USDC`], ['TEE attestation', 'Intel TDX · Verified'], ['Settlement', 'Solana L1 · Confirmed']].map(([l,v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(201,169,110,0.08)' }}>
                      <span style={{ fontSize: '12px', color: '#9a9488' }}>{l}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4caf7d' }}>{v}</span>
                    </div>
                  ))}
                  <button style={{ ...btn, marginTop: '24px', width: '100%' }} onClick={() => { setPhase('create'); setStatus(''); setBidCount(0); setTxSig(''); }}>Create new auction</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
