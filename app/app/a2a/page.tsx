'use client';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import Link from 'next/link';

export default function A2APage() {
  const { connected } = useWallet();
  const [deposit, setDeposit] = useState('5');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [phase, setPhase] = useState<'open'|'active'|'settled'>('open');
  const [paymentCount, setPaymentCount] = useState(0);
  const [channelId] = useState(() => Math.random().toString(36).slice(2,10).toUpperCase());

  const nav = [['← Overview','/'],['Sealed auctions','/auctions'],['Private lending','/lending'],['Dark pool','/darkpool'],['x402 gateway','/x402'],['A2A channels','/a2a'],['Treasury','/treasury']];
  const card = { background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(201,169,110,0.11)', borderRadius: '12px', padding: '28px 32px', marginBottom: '20px' };
  const input = { width: '100%', background: '#161616', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '7px', padding: '12px 16px', color: '#f5f0e8', fontFamily: 'monospace', fontSize: '13px', outline: 'none', marginBottom: '16px' };
  const label = { fontSize: '9px', letterSpacing: '0.15em', color: '#7a7468', textTransform: 'uppercase' as const, marginBottom: '7px', fontFamily: 'monospace', display: 'block' };
  const btn = { background: '#c9a96e', border: 'none', borderRadius: '6px', padding: '12px 28px', color: '#0e0e0e', fontSize: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif' };
  const success = { marginTop: '16px', padding: '12px 16px', background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#4caf7d' };

  async function openChannel() {
    setLoading(true);
    setStatus('Opening A2A channel inside PER...');
    await new Promise(r => setTimeout(r, 1500));
    setPhase('active');
    setStatus('Channel open · Payments settling inside PER enclave');
    setLoading(false);
  }

  function simulatePayment() {
    setPaymentCount(c => c + 1);
    setStatus(`Payment #${paymentCount + 1} settled inside PER · Zero L1 trace`);
  }

  function settleChannel() {
    setPhase('settled');
    setStatus('Channel closed · Net balance settled to Solana L1');
  }

  const agentA = `PRIV-${channelId}-A`;
  const agentB = `PRIV-${channelId}-B`;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0e0e0e', color: '#f5f0e8', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: '220px', borderRight: '1px solid rgba(201,169,110,0.12)', padding: '32px 0', background: 'rgba(14,14,14,0.95)', flexShrink: 0 }}>
        <div style={{ padding: '0 28px 32px', borderBottom: '1px solid rgba(201,169,110,0.12)' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', color: '#c9a96e' }}>Privé</div>
          <div style={{ fontSize: '9px', color: '#7a7468', textTransform: 'uppercase' as const }}>Private Finance · Solana</div>
        </div>
        <nav style={{ padding: '24px 28px' }}>
          {nav.map(([l,h]) => <Link key={h} href={h} style={{ display: 'block', padding: '8px 0', color: h === '/a2a' ? '#c9a96e' : '#7a7468', fontSize: '13px', textDecoration: 'none' }}>{l}</Link>)}
        </nav>
      </aside>
      <main style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 36px', borderBottom: '1px solid rgba(201,169,110,0.12)', position: 'sticky' as const, top: 0, background: '#0e0e0e', zIndex: 10 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px' }}>A2A channels · Agent-to-agent</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(201,169,110,0.09)', border: '1px solid rgba(201,169,110,0.26)', borderRadius: '20px', padding: '5px 12px', fontSize: '9px', color: '#c9a96e', textTransform: 'uppercase' as const }}><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#c9a96e' }}></div>PER · Active</div>
            <WalletMultiButton style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '6px', fontSize: '11px' }} />
          </div>
        </div>
        <div style={{ padding: '32px 36px' }}>
          <div style={{ ...card, borderColor: 'rgba(201,169,110,0.22)', background: 'rgba(201,169,110,0.04)', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: '#9a9488', lineHeight: '1.7' }}>⟳ <strong style={{ color: '#c9a96e' }}>Agent-to-agent payment channels inside MagicBlock PER.</strong> Open a channel, settle hundreds of payments privately inside the TEE, then close with a single L1 transaction. Competitors cannot observe your agent payment graph.</div>
          </div>

          {!connected ? <div style={{ textAlign: 'center', padding: '40px' }}><WalletMultiButton /></div> : (
            <>
              {phase === 'open' && (
                <div style={card}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', marginBottom: '6px' }}>Open A2A channel</div>
                  <div style={{ fontSize: '12px', color: '#7a7468', marginBottom: '24px' }}>Create a payment channel between two AI agents. All payments inside settle in PER — only final net balance hits L1.</div>
                  <span style={label}>Agent A (you)</span>
                  <input style={input} value={agentA} readOnly />
                  <span style={label}>Agent B (counterparty)</span>
                  <input style={input} value={agentB} readOnly />
                  <span style={label}>Channel deposit (USDC)</span>
                  <input style={input} value={deposit} onChange={e => setDeposit(e.target.value)} />
                  <span style={label}>Settlement model</span>
                  <input style={input} value="Net balance on close · Only 2 L1 transactions total" readOnly />
                  <button style={btn} onClick={openChannel} disabled={loading}>{loading ? 'Opening...' : '⟳ Open A2A channel'}</button>
                  {status && <div style={success}>{status}</div>}
                </div>
              )}

              {phase === 'active' && (
                <div style={card}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', marginBottom: '6px' }}>Channel active · {paymentCount} payments settled in PER</div>
                  <div style={{ background: '#161616', border: '1px solid rgba(201,169,110,0.15)', borderRadius: '8px', padding: '16px', marginBottom: '20px', fontFamily: 'monospace', fontSize: '11px', color: '#9a9488', lineHeight: '1.8' }}>
                    Channel ID: {channelId} (inside PER · not visible on-chain)<br />
                    Agent A balance: ${(Number(deposit) - paymentCount * 0.042).toFixed(3)} USDC<br />
                    Agent B balance: ${(paymentCount * 0.042).toFixed(3)} USDC<br />
                    Payments settled inside PER: {paymentCount}<br />
                    Solana L1 transactions used: 1 (channel open)
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={btn} onClick={simulatePayment}>⟳ Settle payment in PER</button>
                    {paymentCount >= 3 && <button style={{ ...btn, background: 'transparent', border: '1px solid rgba(201,169,110,0.26)', color: '#c9a96e' }} onClick={settleChannel}>Close channel → L1</button>}
                  </div>
                  {status && <div style={success}>{status}</div>}
                </div>
              )}

              {phase === 'settled' && (
                <div style={card}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#4caf7d', marginBottom: '20px' }}>✓ Channel settled on Solana L1</div>
                  {[['Total PER payments', String(paymentCount)], ['L1 transactions', '2 (open + close)'], ['Net to Agent A', `$${(Number(deposit) - paymentCount * 0.042).toFixed(3)} USDC`], ['Net to Agent B', `$${(paymentCount * 0.042).toFixed(3)} USDC`], ['On-chain visibility', 'Open + close only · No individual payments'], ['Efficiency', `${paymentCount} payments → 1 L1 settlement`]].map(([l,v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(201,169,110,0.08)' }}>
                      <span style={{ fontSize: '12px', color: '#9a9488' }}>{l}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4caf7d' }}>{v}</span>
                    </div>
                  ))}
                  <button style={{ ...btn, marginTop: '24px', background: 'transparent', border: '1px solid rgba(201,169,110,0.26)', color: '#c9a96e' }} onClick={() => { setPhase('open'); setStatus(''); setPaymentCount(0); }}>Open new channel</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
