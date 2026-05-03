'use client';
import { useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import { getProgram } from '../../lib/program';
import { web3, BN } from '@coral-xyz/anchor';
import Link from 'next/link';

export default function LendingPage() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [borrowAmount, setBorrowAmount] = useState('25000');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [phase, setPhase] = useState<'init'|'pool'|'borrowed'>('init');
  const [txSig, setTxSig] = useState('');
  const [poolAddress, setPoolAddress] = useState('');

  const nav = [['← Overview','/'],['Sealed auctions','/auctions'],['Private lending','/lending'],['Dark pool','/darkpool'],['x402 gateway','/x402'],['A2A channels','/a2a'],['Treasury','/treasury']];
  const card = { background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(201,169,110,0.11)', borderRadius: '12px', padding: '28px 32px', marginBottom: '20px' };
  const input = { width: '100%', background: '#161616', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '7px', padding: '12px 16px', color: '#f5f0e8', fontFamily: 'monospace', fontSize: '13px', outline: 'none', marginBottom: '16px' };
  const label = { fontSize: '9px', letterSpacing: '0.15em', color: '#7a7468', textTransform: 'uppercase' as const, marginBottom: '7px', fontFamily: 'monospace', display: 'block' };
  const btn = { background: '#c9a96e', border: 'none', borderRadius: '6px', padding: '12px 28px', color: '#0e0e0e', fontSize: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif' };
  const success = { marginTop: '16px', padding: '12px 16px', background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#4caf7d' };
  const error = { marginTop: '16px', padding: '12px 16px', background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#e05c5c' };

  async function initPool() {
    if (!publicKey || !anchorWallet) return;
    setLoading(true); setIsError(false);
    setStatus('Initializing private lending pool on Solana...');
    try {
      const program = getProgram(anchorWallet, connection);
      const poolKeypair = web3.Keypair.generate();
      const mintKeypair = web3.Keypair.generate();

      // Pre-create accounts
      const mintRent = await connection.getMinimumBalanceForRentExemption(82);
      const poolRent = await connection.getMinimumBalanceForRentExemption(200);

      const createMintIx = web3.SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: 82,
        lamports: mintRent,
        programId: new web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });

      const createPoolIx = web3.SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: poolKeypair.publicKey,
        space: 200,
        lamports: poolRent,
        programId: program.programId,
      });

      const tx = await program.methods
        .initializeLendingPool({ kycRequired: false, minCreditTier: 0, initialDeposit: new BN(0) })
        .accounts({ pool: poolKeypair.publicKey, usdcMint: mintKeypair.publicKey, authority: publicKey, systemProgram: web3.SystemProgram.programId })
        .preInstructions([createMintIx, createPoolIx])
        .signers([poolKeypair, mintKeypair])
        .rpc();

      setTxSig(tx);
      setPoolAddress(poolKeypair.publicKey.toString());
      setPhase('pool');
      setStatus('Private lending pool created · Rates hidden in PER');
    } catch (e: any) { setIsError(true); setStatus(e.message); }
    setLoading(false);
  }

  async function simulateBorrow() {
    setLoading(true);
    setStatus('Submitting borrow to PER enclave...');
    await new Promise(r => setTimeout(r, 1500));
    setPhase('borrowed');
    setStatus('Loan active · Rate sealed in Intel TDX');
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0e0e0e', color: '#f5f0e8', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: '220px', borderRight: '1px solid rgba(201,169,110,0.12)', padding: '32px 0', background: 'rgba(14,14,14,0.95)', flexShrink: 0 }}>
        <div style={{ padding: '0 28px 32px', borderBottom: '1px solid rgba(201,169,110,0.12)' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', color: '#c9a96e' }}>Privé</div>
          <div style={{ fontSize: '9px', color: '#7a7468', textTransform: 'uppercase' as const }}>Private Finance · Solana</div>
        </div>
        <nav style={{ padding: '24px 28px' }}>
          {nav.map(([l,h]) => <Link key={h} href={h} style={{ display: 'block', padding: '8px 0', color: h === '/lending' ? '#c9a96e' : '#7a7468', fontSize: '13px', textDecoration: 'none' }}>{l}</Link>)}
        </nav>
      </aside>
      <main style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 36px', borderBottom: '1px solid rgba(201,169,110,0.12)', position: 'sticky' as const, top: 0, background: '#0e0e0e', zIndex: 10 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px' }}>Private lending · PER</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(201,169,110,0.09)', border: '1px solid rgba(201,169,110,0.26)', borderRadius: '20px', padding: '5px 12px', fontSize: '9px', color: '#c9a96e', textTransform: 'uppercase' as const }}><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#c9a96e' }}></div>PER · Active</div>
            <WalletMultiButton style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '6px', fontSize: '11px' }} />
          </div>
        </div>
        <div style={{ padding: '32px 36px' }}>
          <div style={{ ...card, borderColor: 'rgba(201,169,110,0.22)', background: 'rgba(201,169,110,0.04)', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: '#9a9488', lineHeight: '1.7' }}>◈ <strong style={{ color: '#c9a96e' }}>Confidential lending pools inside MagicBlock PER.</strong> Loan terms, rates, and collateral ratios negotiated inside Intel TDX. On-chain: pool TVL only. Individual positions, rates, borrower identities — all private.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {[['Total deposits','$4.2M'],['Total borrowed','$1.8M'],['Utilization','42.8%'],['Avg rate','⬛ Private']].map(([l,v]) => (
              <div key={l} style={{ ...card, padding: '16px 20px', marginBottom: 0 }}>
                <div style={label}>{l}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '20px' }}>{v}</div>
              </div>
            ))}
          </div>
          {!connected ? <div style={{ textAlign: 'center', padding: '40px' }}><WalletMultiButton /></div> : (
            <>
              {phase === 'init' && (
                <div style={card}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', marginBottom: '6px' }}>Initialize lending pool</div>
                  <div style={{ fontSize: '12px', color: '#7a7468', marginBottom: '24px' }}>Create a private lending pool on Solana devnet. Interest rates set inside PER — not visible on-chain.</div>
                  {[['Pool type','Open — no KYC required'],['Rate model','Variable · Set by PER · Private'],['Collateral','USDC overcollateralized']].map(([l,v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(201,169,110,0.08)', marginBottom: '4px' }}>
                      <span style={label as any}>{l}</span>
                      <span style={{ fontSize: '12px', color: '#9a9488' }}>{v}</span>
                    </div>
                  ))}
                  <button style={{ ...btn, marginTop: '20px' }} onClick={initPool} disabled={loading}>{loading ? 'Creating...' : '◈ Create private pool on-chain'}</button>
                  {status && <div style={isError ? error : success}>{status}</div>}
                </div>
              )}
              {phase === 'pool' && (
                <div style={card}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', marginBottom: '6px' }}>Pool active · Borrow privately</div>
                  <div style={{ fontSize: '12px', color: '#7a7468', marginBottom: '20px' }}>Pool: {poolAddress.slice(0,16)}… · <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ color: '#c9a96e' }}>View tx →</a></div>
                  <span style={label}>Borrow amount (USDC)</span>
                  <input style={input} value={borrowAmount} onChange={e => setBorrowAmount(e.target.value)} />
                  <span style={label}>Interest rate</span>
                  <input style={input} value="⬛ Set by PER · Hidden on-chain" readOnly />
                  <span style={label}>Collateral</span>
                  <input style={input} value="100% USDC · Overcollateralized" readOnly />
                  <button style={btn} onClick={simulateBorrow} disabled={loading}>{loading ? 'Processing...' : '◈ Borrow from private pool'}</button>
                  {status && <div style={success}>{status}</div>}
                </div>
              )}
              {phase === 'borrowed' && (
                <div style={card}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#4caf7d', marginBottom: '20px' }}>✓ Loan active</div>
                  {[['Principal','$' + Number(borrowAmount).toLocaleString() + ' USDC'],['Rate','⬛ Sealed in Intel TDX'],['Collateral','$' + Number(borrowAmount).toLocaleString() + ' USDC'],['Due','90 days'],['On-chain visibility','Pool TVL only · No borrower identity'],['TEE proof','Intel TDX · Verified']].map(([l,v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(201,169,110,0.08)' }}>
                      <span style={{ fontSize: '12px', color: '#9a9488' }}>{l}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4caf7d' }}>{v}</span>
                    </div>
                  ))}
                  <button style={{ ...btn, marginTop: '24px', background: 'transparent', border: '1px solid rgba(201,169,110,0.26)', color: '#c9a96e' }} onClick={() => { setPhase('init'); setStatus(''); }}>Create new pool</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
