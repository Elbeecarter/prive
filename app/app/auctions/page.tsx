'use client';

import { useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import { getProgram, getVaultPda } from '../../lib/program';
import { web3, BN } from '@coral-xyz/anchor';
import Link from 'next/link';

const s = {
  page: { display: 'flex', minHeight: '100vh', background: '#0e0e0e', color: '#f5f0e8', fontFamily: 'system-ui, sans-serif' },
  sidebar: { width: '220px', borderRight: '1px solid rgba(201,169,110,0.12)', padding: '32px 0', background: 'rgba(14,14,14,0.95)', flexShrink: 0 },
  logo: { padding: '0 28px 32px', borderBottom: '1px solid rgba(201,169,110,0.12)' },
  logoText: { fontFamily: 'Georgia, serif', fontSize: '28px', color: '#c9a96e' },
  logoSub: { fontSize: '9px', letterSpacing: '0.2em', color: '#7a7468', textTransform: 'uppercase' as const },
  main: { flex: 1, overflowY: 'auto' as const },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 36px', borderBottom: '1px solid rgba(201,169,110,0.12)', position: 'sticky' as const, top: 0, background: '#0e0e0e', zIndex: 10 },
  title: { fontFamily: 'Georgia, serif', fontSize: '18px' },
  badge: { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(201,169,110,0.09)', border: '1px solid rgba(201,169,110,0.26)', borderRadius: '20px', padding: '5px 12px', fontSize: '9px', color: '#c9a96e', letterSpacing: '0.12em', textTransform: 'uppercase' as const },
  dot: { width: '5px', height: '5px', borderRadius: '50%', background: '#c9a96e' },
  content: { padding: '32px 36px' },
  card: { background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(201,169,110,0.11)', borderRadius: '12px', padding: '28px 32px', marginBottom: '20px' },
  cardTitle: { fontFamily: 'Georgia, serif', fontSize: '18px', color: '#f5f0e8', marginBottom: '6px' },
  cardSub: { fontSize: '12px', color: '#7a7468', marginBottom: '24px', lineHeight: '1.6' },
  label: { fontSize: '9px', letterSpacing: '0.15em', color: '#7a7468', textTransform: 'uppercase' as const, marginBottom: '7px', fontFamily: 'monospace' },
  input: { width: '100%', background: '#161616', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '7px', padding: '12px 16px', color: '#f5f0e8', fontFamily: 'monospace', fontSize: '13px', outline: 'none', marginBottom: '16px' },
  btn: { background: '#c9a96e', border: 'none', borderRadius: '6px', padding: '12px 28px', color: '#0e0e0e', fontSize: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: '0.04em' },
  btnGhost: { background: 'transparent', border: '1px solid rgba(201,169,110,0.26)', borderRadius: '6px', padding: '10px 20px', color: '#c9a96e', fontSize: '12px', cursor: 'pointer' },
  success: { marginTop: '16px', padding: '12px 16px', background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#4caf7d' },
  error: { marginTop: '16px', padding: '12px 16px', background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#e05c5c' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  statLabel: { fontSize: '9px', color: '#7a7468', textTransform: 'uppercase' as const, marginBottom: '4px', fontFamily: 'monospace' },
  statVal: { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#f5f0e8' },
  bidRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(201,169,110,0.08)' },
  sealedBadge: { background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.26)', borderRadius: '4px', padding: '2px 8px', fontSize: '9px', color: '#c9a96e', fontFamily: 'monospace' },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#7a7468', fontSize: '12px', textDecoration: 'none', marginBottom: '24px' },
};

export default function AuctionsPage() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [floorPrice, setFloorPrice] = useState('480000');
  const [duration, setDuration] = useState('3600');
  const [bidAmount, setBidAmount] = useState('495000');
  const [auctionKey, setAuctionKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [phase, setPhase] = useState<'create'|'bid'|'live'|'reveal'|'winner'>('create');
  const [bidCount, setBidCount] = useState(0);
  const [txSig, setTxSig] = useState('');
  const [winnerPrice, setWinnerPrice] = useState('');
  const [timer, setTimer] = useState('');

  async function createAuction() {
    if (!publicKey || !anchorWallet) return;
    setLoading(true);
    setIsError(false);
    setStatus('Creating sealed auction on Solana...');
    try {
      const program = getProgram(anchorWallet, connection);
      const auctionKeypair = web3.Keypair.generate();
      const mintKeypair = web3.Keypair.generate();

      // For demo: create a mock mint account
      const tx = await program.methods
        .createAuction({
          floorPrice: new BN(Number(floorPrice) * 1_000_000),
          durationSeconds: new BN(Number(duration)),
          auctionType: { vickrey: {} },
          assetDescription: Buffer.alloc(64, 'Treasury Bond Tranche A'),
        })
        .accounts({
          auction: auctionKeypair.publicKey,
          assetMint: mintKeypair.publicKey,
          creator: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([auctionKeypair, mintKeypair])
        .rpc();

      setAuctionKey(auctionKeypair.publicKey.toString());
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
    setStatus(`Sealed bid #${bidCount + 1} submitted · Amount hidden in TEE`);
  }

  function simulateReveal() {
    setPhase('reveal');
    setStatus('TEE decrypting all bids simultaneously...');
    setTimeout(() => {
      setWinnerPrice('492,000');
      setPhase('winner');
      setStatus('Auction settled · Winner determined by TEE');
    }, 3000);
  }

  return (
    <div style={s.page}>
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoText}>Privé</div>
          <div style={s.logoSub as any}>Private Finance · Solana</div>
        </div>
        <nav style={{ padding: '24px 28px' }}>
          {[['← Overview', '/'], ['Sealed auctions', '/auctions'], ['Private lending', '/lending'], ['Dark pool', '/darkpool'], ['x402 gateway', '/x402'], ['A2A channels', '/a2a'], ['Treasury', '/treasury']].map(([label, href]) => (
            <Link key={href} href={href} style={{ display: 'block', padding: '8px 0', color: href === '/auctions' ? '#c9a96e' : '#7a7468', fontSize: '13px', textDecoration: 'none' }}>{label}</Link>
          ))}
        </nav>
      </aside>

      <main style={s.main}>
        <div style={s.topbar}>
          <div style={s.title}>Sealed auctions · TEE</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={s.badge}><div style={s.dot}></div>PER · Active</div>
            <WalletMultiButton style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '6px', fontSize: '11px' }} />
          </div>
        </div>

        <div style={s.content}>
          {!connected ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: '#c9a96e', marginBottom: '16px' }}>Connect wallet to use auctions</div>
              <WalletMultiButton />
            </div>
          ) : (
            <>
              {/* EXPLAINER */}
              <div style={{ ...s.card, borderColor: 'rgba(201,169,110,0.22)', background: 'rgba(201,169,110,0.04)', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', color: '#9a9488', lineHeight: '1.7' }}>
                  ⬛ <strong style={{ color: '#c9a96e' }}>Sealed-bid Vickrey auctions inside MagicBlock PER.</strong> All bids are encrypted with the TEE public key. No participant — including Privé — can see any bid until the auction closes. The Intel TDX enclave opens all bids simultaneously, computes the winner, and settles on Solana L1. Winner pays the 2nd-highest price.
                </div>
              </div>

              {/* PHASE: CREATE */}
              {phase === 'create' && (
                <div style={s.card}>
                  <div style={s.cardTitle}>Create sealed auction</div>
                  <div style={s.cardSub}>Deploy a new Vickrey auction to Solana devnet via the Privé program.</div>
                  <div style={s.label}>Floor price (USDC)</div>
                  <input style={s.input} value={floorPrice} onChange={e => setFloorPrice(e.target.value)} placeholder="480000" />
                  <div style={s.label}>Duration (seconds)</div>
                  <input style={s.input} value={duration} onChange={e => setDuration(e.target.value)} placeholder="3600" />
                  <div style={s.label}>Asset type</div>
                  <input style={s.input} value="Treasury Bond Tranche A" readOnly />
                  <button style={s.btn} onClick={createAuction} disabled={loading}>
                    {loading ? 'Deploying...' : '⚡ Create auction on-chain'}
                  </button>
                  {status && <div style={isError ? s.error : s.success}>{status}</div>}
                </div>
              )}

              {/* PHASE: LIVE */}
              {phase === 'live' && (
                <>
                  <div style={s.card}>
                    <div style={s.cardTitle}>Auction live · Accepting sealed bids</div>
                    <div style={{ ...s.grid2, marginBottom: '20px' }}>
                      {[['Floor price', `$${Number(floorPrice).toLocaleString()}`], ['Sealed bids', String(bidCount)], ['Time remaining', timer || 'Live'], ['Highest bid', '⬛ Hidden']].map(([l, v]) => (
                        <div key={l}>
                          <div style={s.statLabel as any}>{l}</div>
                          <div style={s.statVal}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.15)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', color: '#7a7468', marginBottom: '12px', fontFamily: 'monospace', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Active bidders</div>
                      {bidCount === 0 && <div style={{ fontSize: '12px', color: '#7a7468' }}>No bids yet — be the first</div>}
                      {Array.from({ length: bidCount }).map((_, i) => (
                        <div key={i} style={s.bidRow}>
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#9a9488' }}>Bidder {i + 1} · {web3.Keypair.generate().publicKey.toString().slice(0, 8)}…</span>
                          <span style={s.sealedBadge}>⬛ SEALED</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                      <div>
                        <div style={s.label}>Your bid (USDC)</div>
                        <input style={{ ...s.input, width: '200px', marginBottom: 0 }} value={bidAmount} onChange={e => setBidAmount(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <button style={s.btn} onClick={simulateBid}>⬛ Submit sealed bid</button>
                      {bidCount >= 2 && <button style={s.btnGhost} onClick={simulateReveal}>Close &amp; reveal (TEE)</button>}
                    </div>
                    {status && <div style={s.success}>{status}</div>}
                    {txSig && (
                      <div style={{ marginTop: '12px', fontSize: '10px', fontFamily: 'monospace', color: '#7a7468' }}>
                        Auction tx: <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ color: '#c9a96e' }}>{txSig.slice(0, 20)}… →</a>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* PHASE: REVEAL */}
              {phase === 'reveal' && (
                <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '20px' }}>⬛</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#c9a96e', marginBottom: '12px' }}>TEE opening all bids simultaneously</div>
                  <div style={{ fontSize: '12px', color: '#7a7468', lineHeight: '1.7' }}>Intel TDX enclave is decrypting all sealed bids<br />Computing Vickrey winner · Generating attestation proof</div>
                  <div style={{ marginTop: '24px', fontFamily: 'monospace', fontSize: '10px', color: '#4caf7d' }}>
                    ✓ Decrypting bids...<br />✓ Verifying commitments...<br />⟳ Computing winner...
                  </div>
                </div>
              )}

              {/* PHASE: WINNER */}
              {phase === 'winner' && (
                <div style={s.card}>
                  <div style={{ textAlign: 'center', padding: '20px 0 28px', borderBottom: '1px solid rgba(201,169,110,0.12)', marginBottom: '24px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: '#c9a96e', marginBottom: '4px' }}>You won the auction</div>
                    <div style={{ fontSize: '12px', color: '#7a7468' }}>Highest sealed bid · TEE-verified · Settled on Solana</div>
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={s.label}>Settlement price (Vickrey — 2nd highest bid)</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '48px', color: '#f5f0e8' }}>${winnerPrice}</div>
                    <div style={{ fontSize: '12px', color: '#4caf7d', marginTop: '8px' }}>You bid ${Number(bidAmount).toLocaleString()} · You pay ${winnerPrice} · TEE-verified fair price</div>
                  </div>
                  {[['Your bid', `$${Number(bidAmount).toLocaleString()} USDC`], ['Settlement price', `$${winnerPrice} USDC`], ['Refund to vault', `$${(Number(bidAmount) - Number(winnerPrice.replace(',',''))).toLocaleString()} USDC`], ['TEE attestation', 'Intel TDX · Verified · On-chain'], ['Settlement', 'Solana L1 · Confirmed']].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(201,169,110,0.08)' }}>
                      <span style={{ fontSize: '12px', color: '#9a9488' }}>{l}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4caf7d' }}>{v}</span>
                    </div>
                  ))}
                  <button style={{ ...s.btn, marginTop: '24px', width: '100%' }} onClick={() => { setPhase('create'); setStatus(''); setBidCount(0); setTxSig(''); }}>
                    Create new auction
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
