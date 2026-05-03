'use client';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import Link from 'next/link';

export default function LendingPage() {
  const { connected } = useWallet();
  const [borrowAmount, setBorrowAmount] = useState('25000');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [phase, setPhase] = useState<'init'|'pool'|'borrowed'>('init');
  const [poolId] = useState(() => Math.random().toString(36).slice(2,10).toUpperCase());

  const nav = [['← Overview','/'],['Sealed auctions','/auctions'],['Private lending','/lending'],['Dark pool','/darkpool'],['x402 gateway','/x402'],['A2A channels','/a2a'],['Treasury','/treasury']];
  const card = { background:'rgba(255,255,255,0.028)', border:'1px solid rgba(201,169,110,0.11)', borderRadius:'12px', padding:'28px 32px', marginBottom:'20px' };
  const inp = { width:'100%', background:'#161616', border:'1px solid rgba(201,169,110,0.2)', borderRadius:'7px', padding:'12px 16px', color:'#f5f0e8', fontFamily:'monospace', fontSize:'13px', outline:'none', marginBottom:'16px' };
  const lbl = { fontSize:'9px', letterSpacing:'0.15em', color:'#7a7468', textTransform:'uppercase' as const, marginBottom:'7px', fontFamily:'monospace', display:'block' };
  const btn = { background:'#c9a96e', border:'none', borderRadius:'6px', padding:'12px 28px', color:'#0e0e0e', fontSize:'14px', cursor:'pointer', fontFamily:'Georgia,serif' };
  const suc = { marginTop:'16px', padding:'12px 16px', background:'rgba(76,175,125,0.08)', border:'1px solid rgba(76,175,125,0.2)', borderRadius:'6px', fontFamily:'monospace', fontSize:'10px', color:'#4caf7d' };

  async function initPool() {
    setLoading(true);
    setStatus('Initializing private lending pool via MagicBlock PER...');
    await new Promise(r => setTimeout(r, 1800));
    setPhase('pool');
    setStatus('Private lending pool active · Rates sealed in Intel TDX');
    setLoading(false);
  }

  async function simulateBorrow() {
    setLoading(true);
    setStatus('Submitting borrow request to PER enclave...');
    await new Promise(r => setTimeout(r, 1500));
    setPhase('borrowed');
    setStatus('Loan active · Interest rate sealed in Intel TDX · Repayment in 90 days');
    setLoading(false);
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0e0e0e', color:'#f5f0e8', fontFamily:'system-ui,sans-serif' }}>
      <aside style={{ width:'220px', borderRight:'1px solid rgba(201,169,110,0.12)', padding:'32px 0', background:'rgba(14,14,14,0.95)', flexShrink:0 }}>
        <div style={{ padding:'0 28px 32px', borderBottom:'1px solid rgba(201,169,110,0.12)' }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'28px', color:'#c9a96e' }}>Privé</div>
          <div style={{ fontSize:'9px', color:'#7a7468', textTransform:'uppercase' as const }}>Private Finance · Solana</div>
        </div>
        <nav style={{ padding:'24px 28px' }}>
          {nav.map(([l,h]) => <Link key={h} href={h} style={{ display:'block', padding:'8px 0', color:h==='/lending'?'#c9a96e':'#7a7468', fontSize:'13px', textDecoration:'none' }}>{l}</Link>)}
        </nav>
      </aside>
      <main style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 36px', borderBottom:'1px solid rgba(201,169,110,0.12)', position:'sticky' as const, top:0, background:'#0e0e0e', zIndex:10 }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'18px' }}>Private lending · PER</div>
          <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(201,169,110,0.09)', border:'1px solid rgba(201,169,110,0.26)', borderRadius:'20px', padding:'5px 12px', fontSize:'9px', color:'#c9a96e', textTransform:'uppercase' as const }}><div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#c9a96e' }}></div>PER · Active</div>
            <WalletMultiButton style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(201,169,110,0.2)', borderRadius:'6px', fontSize:'11px' }} />
          </div>
        </div>
        <div style={{ padding:'32px 36px' }}>
          <div style={{ ...card, borderColor:'rgba(201,169,110,0.22)', background:'rgba(201,169,110,0.04)', marginBottom:'20px' }}>
            <div style={{ fontSize:'13px', color:'#9a9488', lineHeight:'1.7' }}>◈ <strong style={{ color:'#c9a96e' }}>Confidential lending pools inside MagicBlock PER.</strong> Loan terms, rates, and collateral ratios negotiated inside Intel TDX. On-chain: pool TVL only. Individual positions, rates, borrower identities — all private.</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'16px', marginBottom:'20px' }}>
            {[['Total deposits','$4.2M'],['Total borrowed','$1.8M'],['Utilization','42.8%'],['Avg rate','⬛ Private']].map(([l,v])=>(
              <div key={l} style={{ ...card, padding:'16px 20px', marginBottom:0 }}>
                <div style={lbl}>{l}</div>
                <div style={{ fontFamily:'Georgia,serif', fontSize:'20px' }}>{v}</div>
              </div>
            ))}
          </div>
          {!connected ? <div style={{ textAlign:'center', padding:'40px' }}><WalletMultiButton /></div> : (
            <>
              {phase==='init' && (
                <div style={card}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:'18px', marginBottom:'6px' }}>Initialize lending pool</div>
                  <div style={{ fontSize:'12px', color:'#7a7468', marginBottom:'24px' }}>Create a private lending pool via MagicBlock PER. Interest rates negotiated inside Intel TDX — not visible on-chain.</div>
                  {[['Pool type','Open · No KYC required'],['Rate model','Variable · Set by PER · Private'],['Collateral','USDC overcollateralized'],['Privacy','Borrower identity sealed in TEE']].map(([l,v])=>(
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(201,169,110,0.08)' }}>
                      <span style={lbl as any}>{l}</span>
                      <span style={{ fontSize:'12px', color:'#9a9488' }}>{v}</span>
                    </div>
                  ))}
                  <button style={{ ...btn, marginTop:'20px' }} onClick={initPool} disabled={loading}>{loading?'Creating...':'◈ Create private pool'}</button>
                  {status && <div style={suc}>{status}</div>}
                </div>
              )}
              {phase==='pool' && (
                <div style={card}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:'18px', marginBottom:'6px' }}>Pool active · Borrow privately</div>
                  <div style={{ fontSize:'12px', color:'#7a7468', marginBottom:'20px' }}>Pool ID: {poolId} · Rates sealed in Intel TDX · Not visible on-chain</div>
                  <span style={lbl}>Borrow amount (USDC)</span>
                  <input style={inp} value={borrowAmount} onChange={e=>setBorrowAmount(e.target.value)} />
                  <span style={lbl}>Interest rate</span>
                  <input style={inp} value="⬛ Set by PER · Hidden on-chain" readOnly />
                  <span style={lbl}>Collateral</span>
                  <input style={inp} value="100% USDC · Overcollateralized" readOnly />
                  <button style={btn} onClick={simulateBorrow} disabled={loading}>{loading?'Processing...':'◈ Borrow from private pool'}</button>
                  {status && <div style={suc}>{status}</div>}
                </div>
              )}
              {phase==='borrowed' && (
                <div style={card}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:'22px', color:'#4caf7d', marginBottom:'20px' }}>✓ Loan active</div>
                  {[['Principal','$'+Number(borrowAmount).toLocaleString()+' USDC'],['Rate','⬛ Sealed in Intel TDX'],['Collateral','$'+Number(borrowAmount).toLocaleString()+' USDC'],['Due','90 days'],['On-chain visibility','Pool TVL only · No borrower identity'],['TEE proof','Intel TDX · Verified · MagicBlock PER']].map(([l,v])=>(
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(201,169,110,0.08)' }}>
                      <span style={{ fontSize:'12px', color:'#9a9488' }}>{l}</span>
                      <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#4caf7d' }}>{v}</span>
                    </div>
                  ))}
                  <button style={{ ...btn, marginTop:'24px', background:'transparent', border:'1px solid rgba(201,169,110,0.26)', color:'#c9a96e' }} onClick={()=>{setPhase('init');setStatus('');}}>Create new pool</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
