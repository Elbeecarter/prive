'use client';

import { useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import { getProgram, getVaultPda } from '../lib/program';
import { web3 } from '@coral-xyz/anchor';
import Link from 'next/link';

export default function Home() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [mounted, setMounted] = useState(false);
  const [activeNav, setActiveNav] = useState('Overview');
  const [vaultExists, setVaultExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txSig, setTxSig] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const navItems = [
    { section: 'Accounts', items: ['Overview', 'Vault', 'Send privately'] },
    { section: 'Private DeFi', items: ['Auctions', 'Lending', 'Dark pool'] },
    { section: 'Agentic', items: ['AI agents', 'x402 gateway', 'A2A channels'] },
    { section: 'Enterprise', items: ['Treasury', 'Compliance', 'RWA rails'] },
  ];

  const moduleLinks: Record<string, string> = {
    'Auctions': '/auctions', 'Lending': '/lending', 'Dark pool': '/darkpool',
    'x402 gateway': '/x402', 'A2A channels': '/a2a', 'Treasury': '/treasury',
  };

  useEffect(() => {
    if (!publicKey || !anchorWallet) return;
    checkVault();
  }, [publicKey, anchorWallet]);

  async function checkVault() {
    if (!publicKey || !anchorWallet) return;
    try {
      const program = getProgram(anchorWallet, connection);
      const [vaultPda] = getVaultPda(publicKey);
      const vault = await program.account.vaultAccount.fetchNullable(vaultPda);
      setVaultExists(!!vault);
      if (vault) setStatus('Vault active · PER ready');
    } catch { setVaultExists(false); }
  }

  async function initializeVault() {
    if (!publicKey || !anchorWallet) return;
    setLoading(true);
    setStatus('Creating vault on Solana devnet...');
    try {
      const program = getProgram(anchorWallet, connection);
      const [vaultPda] = getVaultPda(publicKey);
      const tx = await program.methods
        .initializeVault({ user: {} })
        .accounts({ vault: vaultPda, owner: publicKey, systemProgram: web3.SystemProgram.programId })
        .rpc();
      setTxSig(tx);
      setVaultExists(true);
      setStatus('Vault created successfully');
    } catch (e: any) { setStatus('Error: ' + e.message); }
    setLoading(false);
  }

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0e0e0e', color: '#f5f0e8', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: '220px', borderRight: '1px solid rgba(201,169,110,0.12)', display: 'flex', flexDirection: 'column', padding: '32px 0', background: 'rgba(14,14,14,0.95)' }}>
        <div style={{ padding: '0 28px 32px', borderBottom: '1px solid rgba(201,169,110,0.12)' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', color: '#c9a96e' }}>Privé</div>
          <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#7a7468', textTransform: 'uppercase' }}>Private Finance · Solana</div>
        </div>
        <nav style={{ padding: '24px 0', flex: 1 }}>
          {navItems.map(({ section, items }) => (
            <div key={section} style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#7a7468', textTransform: 'uppercase', padding: '0 28px 10px' }}>{section}</div>
              {items.map(item => {
                const href = moduleLinks[item];
                const style = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 28px', cursor: 'pointer', color: activeNav === item ? '#c9a96e' : '#7a7468', borderLeft: activeNav === item ? '2px solid #c9a96e' : '2px solid transparent', background: activeNav === item ? 'rgba(201,169,110,0.1)' : 'transparent', fontSize: '13px', textDecoration: 'none' as const };
                const inner = (<><div style={{ width: '6px', height: '6px', borderRadius: '50%', border: '1px solid currentColor', background: activeNav === item ? '#c9a96e' : 'transparent' }}></div>{item}</>);
                return href ? (
                  <Link key={item} href={href} style={style} onClick={() => setActiveNav(item)}>{inner}</Link>
                ) : (
                  <div key={item} style={style} onClick={() => setActiveNav(item)}>{inner}</div>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ padding: '20px 28px', borderTop: '1px solid rgba(201,169,110,0.12)' }}>
          <WalletMultiButton style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '6px', fontSize: '10px', color: '#9a9488' }} />
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 36px', borderBottom: '1px solid rgba(201,169,110,0.12)', position: 'sticky', top: 0, background: '#0e0e0e', zIndex: 10 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px' }}>Overview</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(201,169,110,0.09)', border: '1px solid rgba(201,169,110,0.26)', borderRadius: '20px', padding: '5px 12px', fontSize: '9px', color: '#c9a96e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#c9a96e' }}></div>
            PER · {connected ? 'Active' : 'Connect wallet'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', padding: '10px 36px', borderBottom: '1px solid rgba(201,169,110,0.11)', fontSize: '9px', color: '#7a7468', textTransform: 'uppercase', fontFamily: 'monospace' }}>
          <span>Latency <span style={{ color: '#c9a96e' }}>18ms</span></span>
          <span>· TEE <span style={{ color: '#c9a96e' }}>Intel TDX · Verified</span></span>
          <span>· Network <span style={{ color: '#c9a96e' }}>Solana Devnet</span></span>
          <span>· Program <span style={{ color: '#c9a96e' }}>9VzuKg…z6tBe</span></span>
        </div>

        <div style={{ padding: '32px 36px' }}>
          {!connected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '24px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '48px', color: '#c9a96e' }}>Privé</div>
              <div style={{ fontSize: '16px', color: '#7a7468', maxWidth: '400px', lineHeight: '1.6' }}>Private banking, reimagined on Solana. Connect your wallet to access your shielded vault.</div>
              <WalletMultiButton />
            </div>
          ) : (
            <>
              <div style={{ background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(201,169,110,0.11)', borderRadius: '12px', padding: '32px 36px', marginBottom: '28px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#7a7468', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'monospace' }}>Shielded balance · PER</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '52px', color: '#f5f0e8', lineHeight: 1 }}>
                  <span style={{ fontSize: '24px', color: '#7a7468' }}>$</span>0.00
                </div>
                <div style={{ fontSize: '12px', color: '#7a7468', marginTop: '10px' }}>Balance visible only to you · hidden on-chain</div>
                <div style={{ display: 'flex', gap: '32px', marginTop: '20px', flexWrap: 'wrap' }}>
                  {[['Wallet', publicKey?.toString().slice(0,8) + '...'], ['Network', 'Devnet'], ['Vault', vaultExists ? 'Active' : 'Not created'], ['Status', status || 'Ready']].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: '9px', color: '#7a7468', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'monospace' }}>{label}</div>
                      <div style={{ fontSize: '14px', color: vaultExists && label === 'Vault' ? '#4caf7d' : '#ede8de' }}>{val}</div>
                    </div>
                  ))}
                </div>
                {!vaultExists && (
                  <button onClick={initializeVault} disabled={loading}
                    style={{ marginTop: '24px', background: '#c9a96e', border: 'none', borderRadius: '6px', padding: '12px 28px', color: '#0e0e0e', fontSize: '14px', cursor: loading ? 'wait' : 'pointer', fontFamily: 'Georgia, serif' }}>
                    {loading ? 'Creating vault...' : 'Initialize Privé vault'}
                  </button>
                )}
                {txSig && (
                  <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#4caf7d' }}>
                    ✓ Vault created · <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ color: '#c9a96e' }}>View on Solana Explorer →</a>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                {[
                  ['⚡', 'Sealed auctions', 'Bid without revealing price. TEE-verified Vickrey mechanism.', '/auctions'],
                  ['◈', 'Private lending', 'Borrow at confidential rates. Terms sealed in Intel TDX.', '/lending'],
                  ['◐', 'Dark pool', 'Zero price impact swaps. No MEV, no front-running.', '/darkpool'],
                  ['⬡', 'x402 gateway', 'Private AI agent payments. Per-request micropayments.', '/x402'],
                  ['⟳', 'A2A channels', 'Agent-to-agent settlements inside PER. Single L1 close.', '/a2a'],
                  ['▦', 'Treasury', 'Corporate multi-sig vault. Shielded payroll and budgets.', '/treasury'],
                ].map(([icon, name, desc, href]) => (
                  <Link key={name} href={href} style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(201,169,110,0.11)', borderRadius: '10px', padding: '20px 22px', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.11)')}>
                      <div style={{ fontSize: '20px', marginBottom: '12px' }}>{icon}</div>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', color: '#f5f0e8', marginBottom: '6px' }}>{name}</div>
                      <div style={{ fontSize: '11px', color: '#7a7468', lineHeight: '1.5', marginBottom: '12px' }}>{desc}</div>
                      <div style={{ fontSize: '9px', color: '#c9a96e', fontFamily: 'monospace' }}>Open module →</div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
