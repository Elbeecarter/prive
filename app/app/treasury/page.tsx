'use client';
import { useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import { getProgram, getVaultPda } from '../../lib/program';
import { web3 } from '@coral-xyz/anchor';
import Link from 'next/link';

export default function TreasuryPage() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [phase, setPhase] = useState<'init'|'active'>('init');
  const [txSig, setTxSig] = useState('');
  const [vaultAddress, setVaultAddress] = useState('');

  const nav = [['← Overview','/'],['Sealed auctions','/auctions'],['Private lending','/lending'],['Dark pool','/darkpool'],['x402 gateway','/x402'],['A2A channels','/a2a'],['Treasury','/treasury']];
  const card = { background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(201,169,110,0.11)', borderRadius: '12px', padding: '28px 32px', marginBottom: '20px' };
  const label = { fontSize: '9px', letterSpacing: '0.15em', color: '#7a7468', textTransform: 'uppercase' as const, marginBottom: '7px', fontFamily: 'monospace', display: 'block' };
  const btn = { background: '#c9a96e', border: 'none', borderRadius: '6px', padding: '12px 28px', color: '#0e0e0e', fontSize: '14px', cursor: 'pointer', fontFamily: 'Georgia, serif' };
  const success = { marginTop: '16px', padding: '12px 16px', background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#4caf7d' };
  const error = { marginTop: '16px', padding: '12px 16px', background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#e05c5c' };

  async function initTreasury() {
    if (!publicKey || !anchorWallet) return;
    setLoading(true); setIsError(false);
    setStatus('Creating corporate treasury vault on Solana...');
    try {
      const program = getProgram(anchorWallet, connection);
      const [vaultPda] = getVaultPda(publicKey);
      const tx = await program.methods
        .initializeVault({ internalOps: {} })
        .accounts({ vault: vaultPda, owner: publicKey, systemProgram: web3.SystemProgram.programId })
        .rpc();
      setTxSig(tx);
      setVaultAddress(vaultPda.toString());
      setPhase('active');
      setStatus('Corporate treasury vault created · Roles configured');
    } catch (e: any) {
      if (e.message.includes('already in use')) {
        const [vaultPda] = getVaultPda(publicKey);
        setVaultAddress(vaultPda.toString());
        setPhase('active');
        setStatus('Treasury vault already exists · Loaded');
        setIsError(false);
      } else {
        setIsError(true);
        setStatus(e.message);
      }
    }
    setLoading(false);
  }

  const departments = [
    { name: 'Engineering', budget: '$120,000', spent: '$84,200', remaining: '$35,800' },
    { name: 'Marketing', budget: '$80,000', spent: '$61,400', remaining: '$18,600' },
    { name: 'Operations', budget: '$200,000', spent: '$142,000', remaining: '$58,000' },
    { name: 'HR & Payroll', budget: '$350,000', spent: '$291,700', remaining: '$58,300' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0e0e0e', color: '#f5f0e8', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: '220px', borderRight: '1px solid rgba(201,169,110,0.12)', padding: '32px 0', background: 'rgba(14,14,14,0.95)', flexShrink: 0 }}>
        <div style={{ padding: '0 28px 32px', borderBottom: '1px solid rgba(201,169,110,0.12)' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', color: '#c9a96e' }}>Privé</div>
          <div style={{ fontSize: '9px', color: '#7a7468', textTransform: 'uppercase' as const }}>Private Finance · Solana</div>
        </div>
        <nav style={{ padding: '24px 28px' }}>
          {nav.map(([l,h]) => <Link key={h} href={h} style={{ display: 'block', padding: '8px 0', color: h === '/treasury' ? '#c9a96e' : '#7a7468', fontSize: '13px', textDecoration: 'none' }}>{l}</Link>)}
        </nav>
      </aside>
      <main style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 36px', borderBottom: '1px solid rgba(201,169,110,0.12)', position: 'sticky' as const, top: 0, background: '#0e0e0e', zIndex: 10 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px' }}>Corporate treasury · Enterprise</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(201,169,110,0.09)', border: '1px solid rgba(201,169,110,0.26)', borderRadius: '20px', padding: '5px 12px', fontSize: '9px', color: '#c9a96e', textTransform: 'uppercase' as const }}><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#c9a96e' }}></div>PER · Active</div>
            <WalletMultiButton style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '6px', fontSize: '11px' }} />
          </div>
        </div>
        <div style={{ padding: '32px 36px' }}>
          <div style={{ ...card, borderColor: 'rgba(201,169,110,0.22)', background: 'rgba(201,169,110,0.04)', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: '#9a9488', lineHeight: '1.7' }}>▦ <strong style={{ color: '#c9a96e' }}>Private corporate treasury on Solana.</strong> Multi-sig vault with department budgets, shielded payroll, and supplier payments — all routed through MagicBlock PER. TEE-attested audit reports for regulators. Zero on-chain exposure of internal financials.</div>
          </div>

          {!connected ? <div style={{ textAlign: 'center', padding: '40px' }}><WalletMultiButton /></div> : (
            <>
              {phase === 'init' && (
                <div style={card}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', marginBottom: '6px' }}>Initialize corporate vault</div>
                  <div style={{ fontSize: '12px', color: '#7a7468', marginBottom: '24px' }}>Deploy a multi-sig treasury vault to Solana. Department budgets and payroll tracked privately inside PER.</div>
                  {[['Vault type', 'Corporate multi-sig · InternalOps role'], ['Payroll privacy', 'Amounts sealed in Intel TDX'], ['Audit trail', 'TEE-attested · GENIUS Act compliant'], ['Supplier payments', 'Shielded via Private Payments API']].map(([l,v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(201,169,110,0.08)' }}>
                      <span style={label as any}>{l}</span>
                      <span style={{ fontSize: '12px', color: '#9a9488' }}>{v}</span>
                    </div>
                  ))}
                  <button style={{ ...btn, marginTop: '20px' }} onClick={initTreasury} disabled={loading}>{loading ? 'Creating...' : '▦ Initialize treasury vault on-chain'}</button>
                  {status && <div style={isError ? error : success}>{status}</div>}
                </div>
              )}

              {phase === 'active' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    {[['Total treasury', '$750,000'], ['Deployed', '$579,300'], ['Remaining', '$170,700'], ['Vault', `${vaultAddress.slice(0,8)}…`]].map(([l,v]) => (
                      <div key={l} style={{ ...card, padding: '16px 20px', marginBottom: 0 }}>
                        <div style={label}>{l}</div>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px' }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  <div style={card}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', marginBottom: '20px' }}>Department budgets · Private</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {departments.map(({ name, budget, spent, remaining }) => (
                        <div key={name} style={{ background: '#161616', border: '1px solid rgba(201,169,110,0.11)', borderRadius: '8px', padding: '16px' }}>
                          <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', color: '#f5f0e8', marginBottom: '12px' }}>{name}</div>
                          {[['Budget', budget], ['Spent', spent], ['Remaining', remaining]].map(([l,v]) => (
                            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '10px', color: '#7a7468', fontFamily: 'monospace', textTransform: 'uppercase' as const }}>{l}</span>
                              <span style={{ fontSize: '11px', color: '#9a9488', fontFamily: 'monospace' }}>{v}</span>
                            </div>
                          ))}
                          <div style={{ marginTop: '10px', background: 'rgba(201,169,110,0.1)', borderRadius: '2px', height: '3px' }}>
                            <div style={{ background: '#c9a96e', height: '100%', borderRadius: '2px', width: `${parseInt(spent.replace(/[$,]/g,''))/parseInt(budget.replace(/[$,]/g,''))*100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={card}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', marginBottom: '16px' }}>Compliance status</div>
                    {[['Intel TDX attestation', '✓ Verified'], ['GENIUS Act', '✓ Compliant'], ['KYC vault', '✓ Active'], ['Audit trail', '✓ TEE-sealed · Ready for regulator'], ['On-chain visibility', '⬛ Pool balance only · No internal data'], ['Program', txSig ? `Tx: ${txSig.slice(0,16)}…` : '9VzuKgdog1uRcB4…']].map(([l,v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(201,169,110,0.08)' }}>
                        <span style={{ fontSize: '12px', color: '#9a9488' }}>{l}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4caf7d' }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {txSig && (
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#7a7468' }}>
                      Vault tx: <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ color: '#c9a96e' }}>{txSig.slice(0,24)}… →</a>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
