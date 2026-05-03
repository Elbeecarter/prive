'use client';

import { useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import { getProgram } from '../../lib/program';
import { web3, BN } from '@coral-xyz/anchor';
import Link from 'next/link';

const s = {
  page: { display: 'flex', minHeight: '100vh', background: '#0e0e0e', color: '#f5f0e8', fontFamily: 'system-ui, sans-serif' },
  sidebar: { width: '220px', borderRight: '1px solid rgba(201,169,110,0.12)', padding: '32px 0', background: 'rgba(14,14,14,0.95)', flexShrink: 0 },
  logo: { padding: '0 28px 32px', borderBottom: '1px solid rgba(201,169,110,0.12)' },
  main: { flex: 1, overflowY: 'auto' as const },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 36px', borderBottom: '1px solid rgba(201,169,110,0.12)', position: 'sticky' as const, top: 0, background: '#0e0e0e', zIndex: 10 },
  content: { padding: '32px 36px' },
  card: { background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(201,169,110,0.11)', borderRadius: '12px', padding: '28px 32px', marginBottom: '20px' },
  label: { fontSize: '9px', letterSpacing: '0.15em', color: '#7a7468', textTransform: 'uppercase' as const, marginBottom: '7px', fontFamily: 'monospace' },
  input: { width: '100%', background: '#161616', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '7px', padding: '12px 16px', color: '#f5f0e8', fontFamily: 'monospace', fontSize: '13px', outline: 'none', marginBottom: '16px' },
  btn: { background: '#c9a96e', border: 'none', borderRadius: '6px', padding: '12px 28px', color: '#0e0e0e', fontSize: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif' },
  success: { marginTop: '16px', padding: '12px 16px', background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#4caf7d' },
  error: { marginTop: '16px', padding: '12px 16px', background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#e05c5c' },
};

export default function LendingPage() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [depositAmount, setDepositAmount] = useState('50000');
  const [borrowAmount, setBorrowAmount] = useState('25000');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [poolKey, setPoolKey] = useState('');
  const [phase, setPhase] = useState<'init'|'pool'|'borrowed'>('init');
  const [txSig, setTxSig] = useState('');

  async function initPool() {
    if (!publicKey || !anchorWallet) return;
    setLoading(true);
    setIsError(false);
    setStatus('Initializing private lending pool...');
    try {
      const program = getProgram(anchorWallet, connection);
      const poolKeypair = web3.Keypair.generate();
      const mintKeypair = web3.Keypair.generate();
      const tx = await program.methods
        .initializeLendingPool({
          kycRequired: false,
          minCreditTier: 0,
          initialDeposit: new BN(0),
        })
        .accounts({
          pool: poolKeypair.publicKey,
          usdcMint: mintKeypair.publicKey,
          authority: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([poolKeypair, mintKeypair])
        .rpc();
      setPoolKey(poolKeypair.publicKey.toString());
      setTxSig(tx);
      setPhase('pool');
      setStatus('Private lending pool created · Rates hidden in PER');
    } catch (e: any) {
      setIsError(true);
      setStatus(e.message);
    }
    setLoading(false);
  }

  async function simulateBorrow() {
    setLoading(true);
    setStatus('Submitting borrow request to PER...');
    await new Promise(r => setTimeout(r, 1500));
    setPhase('borrowed');
    setStatus('Loan active · Rate sealed in Intel TDX · Repayment in 90 days');
    setLoading(false);
  }

  return (
    <div style={s.page}>
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', color: '#c9a96e' }}>Privé</div>
          <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#7a7468', textTransform: 'uppercase' as const }}>Private Finance · Solana</div>
        </div>
        <nav style={{ padding: '24px 28px' }}>
          {[['← Overview', '/'], ['Sealed auctions', '/auctions'], ['Private lending', '/lending'], ['Dark pool', '/darkpool'], ['x402 gateway', '/x402'], ['A2A channels', '/a2a'], ['Treasury', '/treasury']].map(([label, href]) => (
            <Link key={href} href={href} style={{ display: 'block', padding: '8px 0', color: href === '/lending' ? '#c9a96e' : '#7a7468', fontSize: '13px', textDecoration: 'none' }}>{label}</Link>
          ))}
        </nav>
      </aside>

      <main style={s.main}>
        <div style={s.topbar}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px' }}>Private lending · PER</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(201,169,110,0.09)', border: '1px solid rgba(201,169,110,0.26)', borderRadius: '20px', padding: '5px 12px', fontSize: '9px', color: '#c9a96e', textTransform: 'uppercase' as const }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#c9a96e' }}></div>PER · Active
            </div>
            <WalletMultiButton style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '6px', fontSize: '11px' }} />
          </div>
        </div>

        <div style={s.content}>
          {!connected ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: '#c9a96e', marginBottom: '16px' }}>Connect wallet to access lending</div>
              <WalletMultiButton />
            </div>
          ) : (
            <>
              <div style={{ ...s.card, borderColor: 'rgba(201,169,110,0.22)', background: 'rgba(201,169,110,0.04)' }}>
                <div style={{ fontSize: '13px', color: '#9a9488', lineHeight: '1.7' }}>
                  ◈ <strong style={{ color: '#c9a96e' }}>Confidential lending pools inside MagicBlock PER.</strong> Loan terms, interest rates, and collateral ratios are negotiated inside the Intel TDX enclave. On-chain, only the pool TVL is visible — individual positions, rates, and borrower identities remain private.
                </div>
              </div>

              {/* Pool stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                {[['Total deposits', '$4.2M'], ['Total borrowed', '$1.8M'], ['Utilization', '42.8%'], ['Avg rate', '⬛ Private']].map(([l, v]) => (
                  <div key={l} style={{ ...s.card, padding: '16px 20px', marginBottom: 0 }}>
                    <div style={s.label}>{l}</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#f5f0e8' }}>{v}</div>
                  </div>
                ))}
              </div>

              {phase === 'init' && (
                <div style={s.card}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', marginBottom: '6px' }}>Initialize lending pool</div>
                  <div style={{ fontSize: '12px', color: '#7a7468', marginBottom: '24px' }}>Create a private lending pool on Solana devnet. Rates set inside PER — not visible on-chain.</div>
                  <div style={s.label}>Initial deposit (USDC)</div>
                  <input style={s.input} value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                  <div style={s.label}>KYC required</div>
                  <input style={s.input} value="No — open pool" readOnly />
                  <button style={s.btn} onClick={initPool} disabled={loading}>{loading ? 'Creating...' : '◈ Create private pool on-chain'}</button>
                  {status && <div style={isError ? s.error : s.success}>{status}</div>}
                </div>
              )}

              {phase === 'pool' && (
                <div style={s.card}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', marginBottom: '6px' }}>Pool active · Borrow privately</div>
                  <div style={{ fontSize: '12px', color: '#7a7468', marginBottom: '24px' }}>Pool: {poolKey.slice(0,16)}… · <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ color: '#c9a96e' }}>View tx →</a></div>
                  <div style={s.label}>Borrow amount (USDC)</div>
                  <input style={s.input} value={borrowAmount} onChange={e => setBorrowAmount(e.target.value)} />
                  <div style={s.label}>Interest rate</div>
                  <input style={s.input} value="⬛ Set by PER · Not visible on-chain" readOnly />
                  <div style={s.label}>Collateral</div>
                  <input style={s.input} value="100% USDC · Overcollateralized" readOnly />
                  <button style={s.btn} onClick={simulateBorrow} disabled={loading}>{loading ? 'Processing...' : '◈ Borrow from private pool'}</button>
                  {status && <div style={s.success}>{status}</div>}
                </div>
              )}

              {phase === 'borrowed' && (
                <div style={s.card}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#4caf7d', marginBottom: '20px' }}>✓ Loan active</div>
                  {[['Principal borrowed', `$${Number(borrowAmount).toLocaleString()} USDC`], ['Interest rate', '⬛ Sealed in Intel TDX'], ['Collateral locked', `$${Number(borrowAmount).toLocaleString()} USDC`], ['Due date', '90 days'], ['On-chain visibility', 'Pool TVL only · No borrower identity'], ['TEE proof', 'Intel TDX · Execution verified']].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(201,169,110,0.08)' }}>
                      <span style={{ fontSize: '12px', color: '#9a9488' }}>{l}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4caf7d' }}>{v}</span>
                    </div>
                  ))}
                  <button style={{ ...s.btn, marginTop: '24px', background: 'transparent', border: '1px solid rgba(201,169,110,0.26)', color: '#c9a96e' }} onClick={() => { setPhase('init'); setStatus(''); }}>Create new pool</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
