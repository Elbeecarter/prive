'use client';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import Link from 'next/link';

export default function DarkPoolPage() {
  const { connected } = useWallet();
  const [inputToken, setInputToken] = useState('USDC');
  const [outputToken, setOutputToken] = useState('SOL');
  const [amount, setAmount] = useState('100000');
  const [phase, setPhase] = useState<'form'|'routing'|'settled'>('form');
  const [loading, setLoading] = useState(false);

  const nav = [['← Overview','/'],['Sealed auctions','/auctions'],['Private lending','/lending'],['Dark pool','/darkpool'],['x402 gateway','/x402'],['A2A channels','/a2a'],['Treasury','/treasury']];

  async function submitOrder() {
    setLoading(true);
    setPhase('routing');
    await new Promise(r => setTimeout(r, 2000));
    setPhase('settled');
    setLoading(false);
  }

  const card = { background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(201,169,110,0.11)', borderRadius: '12px', padding: '28px 32px', marginBottom: '20px' };
  const input = { width: '100%', background: '#161616', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '7px', padding: '12px 16px', color: '#f5f0e8', fontFamily: 'monospace', fontSize: '13px', outline: 'none', marginBottom: '16px' };
  const label = { fontSize: '9px', letterSpacing: '0.15em', color: '#7a7468', textTransform: 'uppercase' as const, marginBottom: '7px', fontFamily: 'monospace', display: 'block' };
  const btn = { background: '#c9a96e', border: 'none', borderRadius: '6px', padding: '12px 28px', color: '#0e0e0e', fontSize: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0e0e0e', color: '#f5f0e8', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: '220px', borderRight: '1px solid rgba(201,169,110,0.12)', padding: '32px 0', background: 'rgba(14,14,14,0.95)', flexShrink: 0 }}>
        <div style={{ padding: '0 28px 32px', borderBottom: '1px solid rgba(201,169,110,0.12)' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', color: '#c9a96e' }}>Privé</div>
          <div style={{ fontSize: '9px', color: '#7a7468', textTransform: 'uppercase' as const }}>Private Finance · Solana</div>
        </div>
        <nav style={{ padding: '24px 28px' }}>
          {nav.map(([l, h]) => <Link key={h} href={h} style={{ display: 'block', padding: '8px 0', color: h === '/darkpool' ? '#c9a96e' : '#7a7468', fontSize: '13px', textDecoration: 'none' }}>{l}</Link>)}
        </nav>
      </aside>
      <main style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 36px', borderBottom: '1px solid rgba(201,169,110,0.12)', position: 'sticky' as const, top: 0, background: '#0e0e0e', zIndex: 10 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px' }}>Dark pool · Shielded AMM</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(201,169,110,0.09)', border: '1px solid rgba(201,169,110,0.26)', borderRadius: '20px', padding: '5px 12px', fontSize: '9px', color: '#c9a96e', textTransform: 'uppercase' as const }}><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#c9a96e' }}></div>PER · Active</div>
            <WalletMultiButton style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '6px', fontSize: '11px' }} />
          </div>
        </div>
        <div style={{ padding: '32px 36px' }}>
          <div style={{ ...card, borderColor: 'rgba(201,169,110,0.22)', background: 'rgba(201,169,110,0.04)', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: '#9a9488', lineHeight: '1.7' }}>◐ <strong style={{ color: '#c9a96e' }}>Shielded AMM inside MagicBlock PER.</strong> Large order flow routes through the PER enclave — order size and identity are shielded until execution. No sandwich attacks. No front-running. Only the final settlement delta commits to Solana L1.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {[['Pool liquidity', '$4.2M'], ['24h volume', '$890K'], ['Avg slippage', '0.00%'], ['MEV saved', '$12,400']].map(([l,v]) => (
              <div key={l} style={{ ...card, padding: '16px 20px', marginBottom: 0 }}>
                <div style={label}>{l}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '20px' }}>{v}</div>
              </div>
            ))}
          </div>

          {!connected ? <div style={{ textAlign: 'center', padding: '40px' }}><WalletMultiButton /></div> : (
            <>
              {phase === 'form' && (
                <div style={card}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', marginBottom: '20px' }}>Submit shielded swap order</div>
                  <span style={label}>Input token</span>
                  <input style={input} value={inputToken} onChange={e => setInputToken(e.target.value)} />
                  <span style={label}>Output token</span>
                  <input style={input} value={outputToken} onChange={e => setOutputToken(e.target.value)} />
                  <span style={label}>Amount</span>
                  <input style={input} value={amount} onChange={e => setAmount(e.target.value)} />
                  <span style={label}>Routing</span>
                  <input style={input} value="⬛ Shielded via PER · Amount hidden until settlement" readOnly />
                  <button style={btn} onClick={submitOrder}>◐ Submit shielded order</button>
                </div>
              )}
              {phase === 'routing' && (
                <div style={{ ...card, textAlign: 'center', padding: '60px' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#c9a96e', marginBottom: '16px' }}>⬛ Routing inside PER enclave</div>
                  <div style={{ fontSize: '12px', color: '#7a7468', lineHeight: '1.7' }}>Order shielded · Finding best execution price<br />Zero MEV exposure · Settling to Solana L1</div>
                </div>
              )}
              {phase === 'settled' && (
                <div style={card}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#4caf7d', marginBottom: '20px' }}>✓ Swap settled privately</div>
                  {[['You sold', `$${Number(amount).toLocaleString()} ${inputToken}`], ['You received', `${(Number(amount)/150).toFixed(2)} ${outputToken}`], ['Slippage', '0.00% — zero market impact'], ['MEV saved', '$0 — order was shielded'], ['On-chain record', 'Pool delta only · No trade details'], ['Settlement', 'Solana L1 · Confirmed']].map(([l,v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(201,169,110,0.08)' }}>
                      <span style={{ fontSize: '12px', color: '#9a9488' }}>{l}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4caf7d' }}>{v}</span>
                    </div>
                  ))}
                  <button style={{ ...btn, marginTop: '24px', background: 'transparent', border: '1px solid rgba(201,169,110,0.26)', color: '#c9a96e' }} onClick={() => setPhase('form')}>New swap</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
