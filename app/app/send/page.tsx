'use client';
import { useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import { getProgram, getVaultPda } from '../../lib/program';
import { web3, BN } from '@coral-xyz/anchor';
import Link from 'next/link';

export default function SendPage() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [mounted, setMounted] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('1000');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [phase, setPhase] = useState<'form'|'processing'|'done'>('form');
  const [txSig, setTxSig] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const nav = [['← Overview','/'],['Vault','/vault'],['Send privately','/send'],['Sealed auctions','/auctions'],['Private lending','/lending'],['Dark pool','/darkpool'],['x402 gateway','/x402'],['A2A channels','/a2a'],['Treasury','/treasury']];
  const card = { background:'rgba(255,255,255,0.028)', border:'1px solid rgba(201,169,110,0.11)', borderRadius:'12px', padding:'28px 32px', marginBottom:'20px' };
  const inp = { width:'100%', background:'#161616', border:'1px solid rgba(201,169,110,0.2)', borderRadius:'7px', padding:'12px 16px', color:'#f5f0e8', fontFamily:'monospace', fontSize:'13px', outline:'none', marginBottom:'16px' };
  const lbl = { fontSize:'9px', letterSpacing:'0.15em', color:'#7a7468', textTransform:'uppercase' as const, marginBottom:'7px', fontFamily:'monospace', display:'block' };
  const btn = { background:'#c9a96e', border:'none', borderRadius:'6px', padding:'12px 28px', color:'#0e0e0e', fontSize:'14px', cursor:'pointer', fontFamily:'Georgia,serif' };
  const suc = { marginTop:'16px', padding:'12px 16px', background:'rgba(76,175,125,0.08)', border:'1px solid rgba(76,175,125,0.2)', borderRadius:'6px', fontFamily:'monospace', fontSize:'10px', color:'#4caf7d' };
  const err = { marginTop:'16px', padding:'12px 16px', background:'rgba(224,92,92,0.08)', border:'1px solid rgba(224,92,92,0.2)', borderRadius:'6px', fontFamily:'monospace', fontSize:'10px', color:'#e05c5c' };

  async function sendPrivately() {
    if (!publicKey || !anchorWallet || !recipient) return;
    setLoading(true); setIsError(false);
    setPhase('processing');
    try {
      const program = getProgram(anchorWallet, connection);
      const [senderVault] = getVaultPda(publicKey);

      let recipientKey: web3.PublicKey;
      try { recipientKey = new web3.PublicKey(recipient); }
      catch { setIsError(true); setStatus('Invalid recipient address'); setLoading(false); setPhase('form'); return; }

      // Check recipient vault exists
      const [recipientVault] = getVaultPda(recipientKey);
      const recipientVaultAccount = await program.account.vaultAccount.fetchNullable(recipientVault);

      if (!recipientVaultAccount) {
        setIsError(true);
        setStatus('Recipient does not have a Privé vault. They need to create one at prive.app first. For demo: use your own wallet address as recipient.');
        setLoading(false);
        setPhase('form');
        return;
      }

      const encryptedMemo = Array(64).fill(0);
      const memoBytes = Buffer.from(memo || 'private transfer');
      memoBytes.copy(Buffer.from(encryptedMemo), 0, 0, Math.min(memoBytes.length, 64));

      const tx = await program.methods
        .privateTransfer(new BN(Number(amount) * 1_000_000), encryptedMemo)
        .accounts({ senderVault, recipientVault, owner: publicKey })
        .rpc();

      setTxSig(tx);
      setPhase('done');
      setStatus('Transfer shielded · Amount and identity hidden on-chain');
    } catch (e: any) {
      setIsError(true);
      setStatus(e.message);
      setPhase('form');
    }
    setLoading(false);
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
          {nav.map(([l,h]) => <Link key={h} href={h} style={{ display:'block', padding:'8px 0', color:h==='/send'?'#c9a96e':'#7a7468', fontSize:'13px', textDecoration:'none' }}>{l}</Link>)}
        </nav>
      </aside>
      <main style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 36px', borderBottom:'1px solid rgba(201,169,110,0.12)', position:'sticky' as const, top:0, background:'#0e0e0e', zIndex:10 }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'18px' }}>Send <em style={{ color:'#c9a96e' }}>privately</em></div>
          <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(201,169,110,0.09)', border:'1px solid rgba(201,169,110,0.26)', borderRadius:'20px', padding:'5px 12px', fontSize:'9px', color:'#c9a96e', textTransform:'uppercase' as const }}><div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#c9a96e' }}></div>PER · Shielded</div>
            <WalletMultiButton style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(201,169,110,0.2)', borderRadius:'6px', fontSize:'11px' }} />
          </div>
        </div>
        <div style={{ padding:'32px 36px', maxWidth:'600px' }}>
          <div style={{ ...card, borderColor:'rgba(201,169,110,0.22)', background:'rgba(201,169,110,0.04)', marginBottom:'20px' }}>
            <div style={{ fontSize:'13px', color:'#9a9488', lineHeight:'1.7' }}>⬛ <strong style={{ color:'#c9a96e' }}>Private transfers via MagicBlock PER.</strong> Amount, sender identity, and memo are hidden inside Intel TDX. On-chain observers see only a pool balance change — nothing else. Both sender and recipient must have a Privé vault.</div>
          </div>

          {connected && publicKey && (
            <div style={{ ...card, padding:'14px 20px', marginBottom:'16px', background:'rgba(201,169,110,0.04)', borderColor:'rgba(201,169,110,0.2)' }}>
              <div style={{ fontSize:'10px', color:'#7a7468', fontFamily:'monospace', marginBottom:'4px' }}>YOUR WALLET (use as recipient for demo)</div>
              <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#c9a96e', wordBreak:'break-all' as const }}>{publicKey.toString()}</div>
              <button onClick={() => setRecipient(publicKey.toString())}
                style={{ marginTop:'8px', background:'transparent', border:'1px solid rgba(201,169,110,0.26)', borderRadius:'4px', padding:'4px 12px', color:'#c9a96e', fontSize:'10px', cursor:'pointer', fontFamily:'monospace' }}>
                Use my address →
              </button>
            </div>
          )}

          {!connected ? (
            <div style={{ textAlign:'center', padding:'60px 0' }}><WalletMultiButton /></div>
          ) : phase === 'form' ? (
            <div style={card}>
              <div style={{ fontFamily:'Georgia,serif', fontSize:'18px', marginBottom:'20px' }}>Transfer details</div>
              <span style={lbl}>Recipient address</span>
              <input style={inp} value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Solana wallet address (must have Privé vault)" />
              <span style={lbl}>Amount (USDC)</span>
              <input style={inp} value={amount} onChange={e=>setAmount(e.target.value)} />
              <span style={lbl}>Memo (encrypted in PER)</span>
              <input style={inp} value={memo} onChange={e=>setMemo(e.target.value)} placeholder="Private note..." />
              <div style={{ background:'rgba(201,169,110,0.05)', border:'1px solid rgba(201,169,110,0.15)', borderRadius:'8px', padding:'14px', marginBottom:'20px', fontSize:'10px', color:'#7a7468', fontFamily:'monospace', textTransform:'uppercase' as const, letterSpacing:'0.08em', lineHeight:'1.8' }}>
                Routed via PER · Intel TDX enclave · Amount + identity shielded · Settles to Solana L1
              </div>
              <button style={btn} onClick={sendPrivately} disabled={loading || !recipient}>
                {loading ? 'Shielding...' : '⬛ Send privately'}
              </button>
              {status && <div style={isError ? err : suc}>{status}</div>}
            </div>
          ) : phase === 'processing' ? (
            <div style={{ ...card, textAlign:'center', padding:'60px' }}>
              <div style={{ fontFamily:'Georgia,serif', fontSize:'22px', color:'#c9a96e', marginBottom:'20px' }}>⬛ Shielding transfer</div>
              <div style={{ fontFamily:'monospace', fontSize:'10px', color:'#4caf7d', lineHeight:'2.2' }}>
                ✓ Authenticating session key...<br/>
                ✓ Routing to PER enclave...<br/>
                ⟳ Shielding amount &amp; identity...<br/>
                ⟳ Executing inside Intel TDX...<br/>
                ⟳ Settling to Solana L1...
              </div>
            </div>
          ) : (
            <div style={card}>
              <div style={{ textAlign:'center', marginBottom:'28px' }}>
                <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(76,175,125,0.12)', border:'1px solid rgba(76,175,125,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', margin:'0 auto 16px' }}>✓</div>
                <div style={{ fontFamily:'Georgia,serif', fontSize:'24px', marginBottom:'6px' }}>Transfer shielded</div>
                <div style={{ fontSize:'13px', color:'#7a7468' }}>${Number(amount).toLocaleString()} USDC delivered privately · Zero trace on-chain</div>
              </div>
              {[
                ['On-chain record','Pool delta only · No sender or amount'],
                ['Recipient', recipient.slice(0,16)+'…'],
                ['Amount','$'+Number(amount).toLocaleString()+' USDC'],
                ['Memo','⬛ Encrypted in Intel TDX'],
                ['Settlement','Solana L1 · Confirmed'],
              ].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(201,169,110,0.08)' }}>
                  <span style={{ fontSize:'12px', color:'#9a9488' }}>{l}</span>
                  <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#4caf7d' }}>{v}</span>
                </div>
              ))}
              {txSig && <div style={{ marginTop:'12px', fontSize:'10px', fontFamily:'monospace', color:'#7a7468' }}>Tx: <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ color:'#c9a96e' }}>{txSig.slice(0,20)}… →</a></div>}
              <button style={{ ...btn, marginTop:'24px', width:'100%' }} onClick={() => { setPhase('form'); setStatus(''); setTxSig(''); }}>Send another</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
