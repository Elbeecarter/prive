'use client';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AuctionsPage() {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [floorPrice, setFloorPrice] = useState('480000');
  const [duration, setDuration] = useState('3600');
  const [bidAmount, setBidAmount] = useState('495000');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [phase, setPhase] = useState<'create'|'live'|'reveal'|'winner'>('create');
  const [bidCount, setBidCount] = useState(0);
  const [timer, setTimer] = useState('');
  const [auctionId] = useState(() => Math.random().toString(36).slice(2,10).toUpperCase());

  useEffect(() => { setMounted(true); }, []);

  const nav = [['← Overview','/'],['Sealed auctions','/auctions'],['Private lending','/lending'],['Dark pool','/darkpool'],['x402 gateway','/x402'],['A2A channels','/a2a'],['Treasury','/treasury']];
  const card = { background:'rgba(255,255,255,0.028)', border:'1px solid rgba(201,169,110,0.11)', borderRadius:'12px', padding:'28px 32px', marginBottom:'20px' };
  const inp = { width:'100%', background:'#161616', border:'1px solid rgba(201,169,110,0.2)', borderRadius:'7px', padding:'12px 16px', color:'#f5f0e8', fontFamily:'monospace', fontSize:'13px', outline:'none', marginBottom:'16px' };
  const lbl = { fontSize:'9px', letterSpacing:'0.15em', color:'#7a7468', textTransform:'uppercase' as const, marginBottom:'7px', fontFamily:'monospace', display:'block' };
  const btn = { background:'#c9a96e', border:'none', borderRadius:'6px', padding:'12px 28px', color:'#0e0e0e', fontSize:'14px', cursor:'pointer', fontFamily:'Georgia,serif' };
  const suc = { marginTop:'16px', padding:'12px 16px', background:'rgba(76,175,125,0.08)', border:'1px solid rgba(76,175,125,0.2)', borderRadius:'6px', fontFamily:'monospace', fontSize:'10px', color:'#4caf7d' };

  const bidderAddresses = [
    '3nRw…Kp4T', 'Fw9X…2mVb', 'Hs6B…9qNe',
    'Lp2Z…4rMx', 'Qm7Y…8sAc', 'Vk3D…1wPf',
  ];

  async function createAuction() {
    setLoading(true);
    setStatus('Creating sealed auction via MagicBlock PER...');
    await new Promise(r => setTimeout(r, 1800));
    setPhase('live');
    setStatus('Auction created · Accepting sealed bids · All amounts hidden in TEE');
    startTimer(Number(duration));
    setLoading(false);
  }

  function startTimer(secs: number) {
    let r = secs;
    const iv = setInterval(() => {
      r--;
      const h = Math.floor(r/3600), m = Math.floor((r%3600)/60), s = r%60;
      setTimer(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
      if (r <= 0) clearInterval(iv);
    }, 1000);
  }

  function simulateBid() {
    setBidCount(c => c+1);
    setStatus(`Sealed bid #${bidCount+1} submitted · Amount encrypted in TEE · Not visible to anyone`);
  }

  function simulateReveal() {
    setPhase('reveal');
    setStatus('TEE decrypting all bids simultaneously...');
    setTimeout(() => {
      setPhase('winner');
      setStatus('Auction settled · Winner determined by Intel TDX · Vickrey price applied');
    }, 3000);
  }

  if (!mounted) return null;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0e0e0e', color:'#f5f0e8', fontFamily:'system-ui,sans-serif' }}>
      <aside style={{ width:'220px', borderRight:'1px solid rgba(201,169,110,0.12)', padding:'32px 0', background:'rgba(14,14,14,0.95)', flexShrink:0 }}>
        <div style={{ padding:'0 28px 32px', borderBottom:'1px solid rgba(201,169,110,0.12)' }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'28px', color:'#c9a96e' }}>Privé</div>
          <div style={{ fontSize:'9px', color:'#7a7468', textTransform:'uppercase' as const }}>Private Finance · Solana</div>
        </div>
        <nav style={{ padding:'24px 28px' }}>
          {nav.map(([l,h]) => <Link key={h} href={h} style={{ display:'block', padding:'8px 0', color:h==='/auctions'?'#c9a96e':'#7a7468', fontSize:'13px', textDecoration:'none' }}>{l}</Link>)}
        </nav>
      </aside>

      <main style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 36px', borderBottom:'1px solid rgba(201,169,110,0.12)', position:'sticky' as const, top:0, background:'#0e0e0e', zIndex:10 }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'18px' }}>Sealed auctions · TEE</div>
          <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(201,169,110,0.09)', border:'1px solid rgba(201,169,110,0.26)', borderRadius:'20px', padding:'5px 12px', fontSize:'9px', color:'#c9a96e', textTransform:'uppercase' as const }}>
              <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#c9a96e' }}></div>PER · Active
            </div>
            <WalletMultiButton style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(201,169,110,0.2)', borderRadius:'6px', fontSize:'11px' }} />
          </div>
        </div>

        <div style={{ padding:'32px 36px' }}>
          <div style={{ ...card, borderColor:'rgba(201,169,110,0.22)', background:'rgba(201,169,110,0.04)', marginBottom:'20px' }}>
            <div style={{ fontSize:'13px', color:'#9a9488', lineHeight:'1.7' }}>
              ⬛ <strong style={{ color:'#c9a96e' }}>Sealed-bid Vickrey auctions inside MagicBlock PER.</strong> All bids encrypted with TEE public key. No one — including Privé — can see any bid until the auction closes. Intel TDX opens all bids simultaneously, computes the winner, and settles on Solana L1. Winner pays the 2nd-highest price.
            </div>
          </div>

          {!connected ? (
            <div style={{ textAlign:'center', padding:'80px 0' }}>
              <div style={{ fontFamily:'Georgia,serif', fontSize:'20px', color:'#c9a96e', marginBottom:'16px' }}>Connect wallet to use auctions</div>
              <WalletMultiButton />
            </div>
          ) : (
            <>
              {phase==='create' && (
                <div style={card}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:'18px', marginBottom:'6px' }}>Create sealed auction</div>
                  <div style={{ fontSize:'12px', color:'#7a7468', marginBottom:'24px' }}>Deploy a new Vickrey auction via MagicBlock PER. All bid amounts sealed in Intel TDX.</div>
                  <span style={lbl}>Floor price (USDC)</span>
                  <input style={inp} value={floorPrice} onChange={e=>setFloorPrice(e.target.value)} />
                  <span style={lbl}>Duration (seconds)</span>
                  <input style={inp} value={duration} onChange={e=>setDuration(e.target.value)} />
                  <span style={lbl}>Asset type</span>
                  <input style={inp} value="Treasury Bond Tranche A · $480K face value · 6.2% yield" readOnly />
                  <span style={lbl}>Auction type</span>
                  <input style={inp} value="Vickrey (2nd price) · TEE-enforced · Truthful bidding dominant strategy" readOnly />
                  <button style={btn} onClick={createAuction} disabled={loading}>
                    {loading ? 'Creating via PER...' : '⚡ Create auction'}
                  </button>
                  {status && <div style={suc}>{status}</div>}
                </div>
              )}

              {phase==='live' && (
                <div style={card}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:'18px', marginBottom:'20px' }}>
                    Auction {auctionId} · Live · Accepting sealed bids
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'16px', marginBottom:'20px' }}>
                    {[
                      ['Floor price', `$${Number(floorPrice).toLocaleString()}`],
                      ['Sealed bids', String(bidCount)],
                      ['Time remaining', timer || 'Live'],
                      ['Highest bid', '⬛ Hidden'],
                    ].map(([l,v]) => (
                      <div key={l} style={{ background:'#161616', borderRadius:'8px', padding:'14px' }}>
                        <div style={lbl}>{l}</div>
                        <div style={{ fontFamily:'Georgia,serif', fontSize:'18px' }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background:'rgba(201,169,110,0.05)', border:'1px solid rgba(201,169,110,0.15)', borderRadius:'8px', padding:'16px', marginBottom:'20px' }}>
                    <div style={{ fontSize:'10px', color:'#7a7468', fontFamily:'monospace', textTransform:'uppercase' as const, letterSpacing:'0.1em', marginBottom:'12px' }}>Active bidders · All amounts sealed in PER</div>
                    {bidCount === 0 && <div style={{ fontSize:'12px', color:'#7a7468' }}>No bids yet — be the first to submit a sealed bid</div>}
                    {Array.from({length: bidCount}).map((_, i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(201,169,110,0.08)' }}>
                        <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#9a9488' }}>
                          {i === 0 ? `You · ${bidAmount ? '$'+Number(bidAmount).toLocaleString() : ''}` : `Bidder ${i+1} · ${bidderAddresses[i-1] || '…'}`}
                        </span>
                        <span style={{ background:'rgba(201,169,110,0.1)', border:'1px solid rgba(201,169,110,0.26)', borderRadius:'4px', padding:'2px 8px', fontSize:'9px', color:'#c9a96e', fontFamily:'monospace' }}>
                          ⬛ SEALED
                        </span>
                      </div>
                    ))}
                  </div>

                  <span style={lbl}>Your bid amount (USDC)</span>
                  <input style={inp} value={bidAmount} onChange={e=>setBidAmount(e.target.value)} placeholder="Enter your bid" />

                  <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' as const }}>
                    <button style={btn} onClick={simulateBid}>⬛ Submit sealed bid</button>
                    {bidCount >= 2 && (
                      <button style={{ ...btn, background:'transparent', border:'1px solid rgba(201,169,110,0.26)', color:'#c9a96e' }} onClick={simulateReveal}>
                        Close auction &amp; reveal (TEE)
                      </button>
                    )}
                  </div>
                  {status && <div style={suc}>{status}</div>}
                </div>
              )}

              {phase==='reveal' && (
                <div style={{ ...card, textAlign:'center', padding:'60px 32px' }}>
                  <div style={{ fontSize:'36px', marginBottom:'20px' }}>⬛</div>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:'22px', color:'#c9a96e', marginBottom:'16px' }}>TEE opening all bids simultaneously</div>
                  <div style={{ fontSize:'12px', color:'#7a7468', lineHeight:'1.8', marginBottom:'24px' }}>
                    Intel TDX enclave is decrypting all {bidCount} sealed bids simultaneously<br/>
                    Computing Vickrey winner · Generating attestation proof
                  </div>
                  <div style={{ fontFamily:'monospace', fontSize:'10px', color:'#4caf7d', lineHeight:'2' }}>
                    ✓ Decrypting sealed bids...<br/>
                    ✓ Verifying bid commitments...<br/>
                    ⟳ Computing Vickrey winner...<br/>
                    ⟳ Generating Intel TDX attestation...
                  </div>
                </div>
              )}

              {phase==='winner' && (
                <div style={card}>
                  <div style={{ textAlign:'center', padding:'20px 0 28px', borderBottom:'1px solid rgba(201,169,110,0.12)', marginBottom:'24px' }}>
                    <div style={{ fontSize:'48px', marginBottom:'12px' }}>🏆</div>
                    <div style={{ fontFamily:'Georgia,serif', fontSize:'28px', color:'#c9a96e', marginBottom:'4px' }}>You won the auction</div>
                    <div style={{ fontSize:'13px', color:'#7a7468' }}>Highest sealed bid · TEE-verified · Settled on Solana L1</div>
                  </div>

                  <div style={{ textAlign:'center', padding:'20px 0 24px', borderBottom:'1px solid rgba(201,169,110,0.12)', marginBottom:'24px' }}>
                    <div style={{ fontSize:'10px', color:'#7a7468', fontFamily:'monospace', textTransform:'uppercase' as const, letterSpacing:'0.15em', marginBottom:'8px' }}>Settlement price (Vickrey — 2nd highest bid)</div>
                    <div style={{ fontFamily:'Georgia,serif', fontSize:'52px', color:'#f5f0e8', lineHeight:1 }}>$492,000</div>
                    <div style={{ fontSize:'13px', color:'#4caf7d', marginTop:'8px' }}>You bid ${Number(bidAmount).toLocaleString()} · You pay $492,000 · Saved ${(Number(bidAmount)-492000).toLocaleString()}</div>
                  </div>

                  {[
                    ['Your bid', `$${Number(bidAmount).toLocaleString()} USDC`],
                    ['Settlement price (2nd highest)', '$492,000 USDC'],
                    ['Refund to your vault', `$${(Number(bidAmount)-492000).toLocaleString()} USDC`],
                    ['Asset received', 'Treasury Bond Tranche A'],
                    ['TEE attestation', 'Intel TDX · Verified · On-chain proof'],
                    ['Settlement', 'Solana L1 · Confirmed'],
                    ['All bids now revealed', `${bidCount} bids · Losing bids refunded automatically`],
                  ].map(([l,v]) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(201,169,110,0.08)' }}>
                      <span style={{ fontSize:'12px', color:'#9a9488' }}>{l}</span>
                      <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#4caf7d' }}>{v}</span>
                    </div>
                  ))}

                  <button style={{ ...btn, marginTop:'28px', width:'100%' }}
                    onClick={() => { setPhase('create'); setStatus(''); setBidCount(0); setTimer(''); }}>
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
