'use client';
import { useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import { getProgram, getVaultPda } from '../../lib/program';
import { web3 } from '@coral-xyz/anchor';
import Link from 'next/link';

export default function VaultPage() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [mounted, setMounted] = useState(false);
  const [vault, setVault] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [txSig, setTxSig] = useState('');

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (publicKey && anchorWallet) fetchVault(); }, [publicKey, anchorWallet]);

  async function fetchVault() {
    if (!publicKey || !anchorWallet) return;
    try {
      const program = getProgram(anchorWallet, connection);
      const [vaultPda] = getVaultPda(publicKey);
      const v = await (program.account as any).vaultAccount.fetchNullable(vaultPda);
      setVault(v);
    } catch { setVault(null); }
  }

  async function initVault() {
    if (!publicKey || !anchorWallet) return;
    setLoading(true); setIsError(false);
    setStatus('Creating vault on Solana...');
    try {
      const program = getProgram(anchorWallet, connection);
      const [vaultPda] = getVaultPda(publicKey);
      const tx = await program.methods
        .initializeVault({ user: {} })
        .accounts({ vault: vaultPda, owner: publicKey, systemProgram: web3.SystemProgram.programId })
        .rpc();
      setTxSig(tx);
      await fetchVault();
      setStatus('Vault active · Ready for private operations');
    } catch (e: any) { setIsError(true); setStatus(e.message); }
    setLoading(false);
  }

  async function delegateToPer() {
    if (!publicKey || !anchorWallet) return;
    setLoading(true); setIsError(false);
    setStatus('Delegating vault to MagicBlock PER...');
    try {
      const program = getProgram(anchorWallet, connection);
      const [vaultPda] = getVaultPda(publicKey);
      const tx = await program.methods
        .delegateVaultToPer()
        .accounts({ vault: vaultPda, owner: publicKey, systemProgram: web3.SystemProgram.programId })
        .rpc();
      setTxSig(tx);
      await fetchVault();
      setStatus('Vault delegated · Private execution active');
    } catch (e: any) {
      if (e.message?.includes('already been processed') || e.message?.includes('already in use')) {
        await fetchVault();
        setStatus('Vault already delegated to PER · Private execution active');
        setIsError(false);
      } else {
        setIsError(true);
        setStatus(e.message);
      }
    }
    setLoading(false);
  }

  const nav = [['← Overview','/'],['Vault','/vault'],['Send privately','/send'],['Sealed auctions','/auctions'],['Private lending','/lending'],['Dark pool','/darkpool'],['x402 gateway','/x402'],['A2A channels','/a2a'],['Treasury','/treasury']];
  const card = { background:'rgba(255,255,255,0.028)', border:'1px solid rgba(201,169,110,0.11)', borderRadius:'12px', padding:'28px 32px', marginBottom:'20px' };
  const btn = { background:'#c9a96e', border:'none', borderRadius:'6px', padding:'12px 28px', color:'#0e0e0e', fontSize:'14px', cursor:'pointer', fontFamily:'Georgia,serif' };
  const suc = { marginTop:'16px', padding:'12px 16px', background:'rgba(76,175,125,0.08)', border:'1px solid rgba(76,175,125,0.2)', borderRadius:'6px', fontFamily:'monospace', fontSize:'10px', color:'#4caf7d' };
  const err = { marginTop:'16px', padding:'12px 16px', background:'rgba(224,92,92,0.08)', border:'1px solid rgba(224,92,92,0.2)', borderRadius:'6px', fontFamily:'monospace', fontSize:'10px', color:'#e05c5c' };

  if (!mounted) return null;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0e0e0e', color:'#f5f0e8', fontFamily:'system-ui,sans-serif' }}>
      <aside style={{ width:'220px', borderRight:'1px solid rgba(201,169,110,0.12)', padding:'32px 0', background:'rgba(14,14,14,0.95)', flexShrink:0 }}>
        <div style={{ padding:'0 28px 32px', borderBottom:'1px solid rgba(201,169,110,0.12)' }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'28px', color:'#c9a96e' }}>Privé</div>
          <div style={{ fontSize:'9px', color:'#7a7468', textTransform:'uppercase' as const }}>Private Finance · Solana</div>
        </div>
        <nav style={{ padding:'24px 28px' }}>
          {nav.map(([l,h]) => <Link key={h} href={h} style={{ display:'block', padding:'8px 0', color:h==='/vault'?'#c9a96e':'#7a7468', fontSize:'13px', textDecoration:'none' }}>{l}</Link>)}
        </nav>
      </aside>
      <main style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 36px', borderBottom:'1px solid rgba(201,169,110,0.12)', position:'sticky' as const, top:0, background:'#0e0e0e', zIndex:10 }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'18px' }}>Vault · Account management</div>
          <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(201,169,110,0.09)', border:'1px solid rgba(201,169,110,0.26)', borderRadius:'20px', padding:'5px 12px', fontSize:'9px', color:'#c9a96e', textTransform:'uppercase' as const }}><div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#c9a96e' }}></div>PER · Active</div>
            <WalletMultiButton style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(201,169,110,0.2)', borderRadius:'6px', fontSize:'11px' }} />
          </div>
        </div>
        <div style={{ padding:'32px 36px' }}>
          {!connected ? (
            <div style={{ textAlign:'center', padding:'80px 0' }}><WalletMultiButton /></div>
          ) : vault ? (
            <>
              <div style={{ ...card, borderColor:'rgba(76,175,125,0.3)', background:'rgba(76,175,125,0.04)' }}>
                <div style={{ fontFamily:'Georgia,serif', fontSize:'22px', color:'#4caf7d', marginBottom:'20px' }}>✓ Vault active · On-chain</div>
                {[
                  ['Owner', publicKey?.toString().slice(0,20)+'…'],
                  ['Delegated to PER', vault.isDelegated ? '✓ Yes · Private execution active' : 'Not yet — delegate below'],
                  ['Role', Object.keys(vault.role)[0]],
                  ['Credit tier', String(vault.creditTier)],
                  ['Transfer count', vault.transferCount.toString()],
                  ['KYC attestation', vault.kycAttestation ? '✓ Verified' : 'Not issued'],
                  ['Program', '9VzuKgdog1uRcB4Xjnx2At3d8ZQ6NdwtC5bhFfwz6tBe'],
                ].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(201,169,110,0.08)' }}>
                    <span style={{ fontSize:'12px', color:'#9a9488' }}>{l}</span>
                    <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#4caf7d' }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={card}>
                <div style={{ fontFamily:'Georgia,serif', fontSize:'18px', marginBottom:'8px' }}>Delegate to MagicBlock PER</div>
                <div style={{ fontSize:'12px', color:'#7a7468', marginBottom:'20px' }}>
                  {vault.isDelegated
                    ? '✓ Your vault is delegated — all balance operations execute privately inside Intel TDX.'
                    : 'Once delegated, all balance operations execute inside Intel TDX — private and shielded from on-chain observers.'}
                </div>
                {!vault.isDelegated && (
                  <button style={btn} onClick={delegateToPer} disabled={loading}>
                    {loading ? 'Delegating...' : 'Delegate vault to PER'}
                  </button>
                )}
                {status && <div style={isError ? err : suc}>{status}</div>}
                {txSig && <div style={{ marginTop:'12px', fontSize:'10px', fontFamily:'monospace', color:'#7a7468' }}>Tx: <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ color:'#c9a96e' }}>{txSig.slice(0,20)}… →</a></div>}
              </div>

              <Link href="/send" style={{ ...btn, display:'inline-block', textDecoration:'none' }}>Send privately →</Link>
            </>
          ) : (
            <div style={card}>
              <div style={{ fontFamily:'Georgia,serif', fontSize:'18px', marginBottom:'8px' }}>No vault found</div>
              <div style={{ fontSize:'12px', color:'#7a7468', marginBottom:'20px' }}>Create your Privé vault to start using private payments.</div>
              <button style={btn} onClick={initVault} disabled={loading}>{loading ? 'Creating...' : 'Initialize Privé vault'}</button>
              {status && <div style={isError ? err : suc}>{status}</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
