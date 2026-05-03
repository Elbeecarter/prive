'use client';
import { useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import { getProgram, getVaultPda } from '../../lib/program';
import { web3, BN } from '@coral-xyz/anchor';
import Link from 'next/link';

export default function X402Page() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [agentName, setAgentName] = useState('ResearchAgent-01');
  const [maxPayment, setMaxPayment] = useState('1000000');
  const [dailyLimit, setDailyLimit] = useState('10000000');
  const [apiEndpoint, setApiEndpoint] = useState('https://api.dataprovider.com/v1/prices');
  const [paymentAmount, setPaymentAmount] = useState('42000');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [phase, setPhase] = useState<'register'|'pay'|'paid'>('register');
  const [txSig, setTxSig] = useState('');
  const [payCount, setPayCount] = useState(0);

  const nav = [['← Overview','/'],['Sealed auctions','/auctions'],['Private lending','/lending'],['Dark pool','/darkpool'],['x402 gateway','/x402'],['A2A channels','/a2a'],['Treasury','/treasury']];
  const card = { background:'rgba(255,255,255,0.028)', border:'1px solid rgba(201,169,110,0.11)', borderRadius:'12px', padding:'28px 32px', marginBottom:'20px' };
  const inp = { width:'100%', background:'#161616', border:'1px solid rgba(201,169,110,0.2)', borderRadius:'7px', padding:'12px 16px', color:'#f5f0e8', fontFamily:'monospace', fontSize:'13px', outline:'none', marginBottom:'16px' };
  const lbl = { fontSize:'9px', letterSpacing:'0.15em', color:'#7a7468', textTransform:'uppercase' as const, marginBottom:'7px', fontFamily:'monospace', display:'block' };
  const btn = { background:'#c9a96e', border:'none', borderRadius:'6px', padding:'12px 28px', color:'#0e0e0e', fontSize:'14px', cursor:'pointer', fontFamily:'Georgia,serif' };
  const suc = { marginTop:'16px', padding:'12px 16px', background:'rgba(76,175,125,0.08)', border:'1px solid rgba(76,175,125,0.2)', borderRadius:'6px', fontFamily:'monospace', fontSize:'10px', color:'#4caf7d' };
  const err = { marginTop:'16px', padding:'12px 16px', background:'rgba(224,92,92,0.08)', border:'1px solid rgba(224,92,92,0.2)', borderRadius:'6px', fontFamily:'monospace', fontSize:'10px', color:'#e05c5c' };

  async function registerAgent() {
    if (!publicKey || !anchorWallet) return;
    setLoading(true); setIsError(false);
    setStatus('Registering AI agent on Solana...');
    try {
      const program = getProgram(anchorWallet, connection);
      const [vaultPda] = getVaultPda(publicKey);
      const agentSeeds = [Buffer.from('prive_agent'), publicKey.toBuffer(), vaultPda.toBuffer()];
      const [agentPda] = web3.PublicKey.findProgramAddressSync(agentSeeds, program.programId);

      // Check if agent already exists
      const existing = await (program.account as any).agentAccount.fetchNullable(agentPda);
      if (existing) {
        setPhase('pay');
        setStatus('Agent already registered · Ready for x402 payments');
        setLoading(false);
        return;
      }

      const tx = await program.methods
        .registerAgent({ maxPaymentPerTx: new BN(maxPayment), dailyLimit: new BN(dailyLimit) })
        .accounts({ agent: agentPda, fundingVault: vaultPda, owner: publicKey, systemProgram: web3.SystemProgram.programId })
        .rpc();
      setTxSig(tx);
      setPhase('pay');
      setStatus('Agent registered · Ready for x402 payments');
    } catch (e: any) {
      // If already exists error, proceed anyway
      if (e.message.includes('already in use') || e.message.includes('0x0')) {
        setPhase('pay');
        setStatus('Agent already registered · Ready for x402 payments');
        setIsError(false);
      } else {
        setIsError(true);
        setStatus(e.message);
      }
    }
    setLoading(false);
  }

  async function processPayment() {
    if (!publicKey || !anchorWallet) return;
    setLoading(true); setIsError(false);
    setStatus('Processing x402 payment through PER...');
    try {
      const program = getProgram(anchorWallet, connection);
      const [vaultPda] = getVaultPda(publicKey);
      const agentSeeds = [Buffer.from('prive_agent'), publicKey.toBuffer(), vaultPda.toBuffer()];
      const [agentPda] = web3.PublicKey.findProgramAddressSync(agentSeeds, program.programId);
      const hash = Array(32).fill(0);
      const tx = await program.methods
        .processX402Payment(new BN(paymentAmount), hash)
        .accounts({ agent: agentPda, fundingVault: vaultPda, owner: publicKey })
        .rpc();
      setTxSig(tx);
      setPayCount(c => c+1);
      setPhase('paid');
      setStatus('Payment processed · API resource unlocked');
    } catch (e: any) { setIsError(true); setStatus(e.message); }
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
          {nav.map(([l,h]) => <Link key={h} href={h} style={{ display:'block', padding:'8px 0', color:h==='/x402'?'#c9a96e':'#7a7468', fontSize:'13px', textDecoration:'none' }}>{l}</Link>)}
        </nav>
      </aside>
      <main style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 36px', borderBottom:'1px solid rgba(201,169,110,0.12)', position:'sticky' as const, top:0, background:'#0e0e0e', zIndex:10 }}>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'18px' }}>x402 gateway · Private agent payments</div>
          <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(201,169,110,0.09)', border:'1px solid rgba(201,169,110,0.26)', borderRadius:'20px', padding:'5px 12px', fontSize:'9px', color:'#c9a96e', textTransform:'uppercase' as const }}><div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#c9a96e' }}></div>PER · Active</div>
            <WalletMultiButton style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(201,169,110,0.2)', borderRadius:'6px', fontSize:'11px' }} />
          </div>
        </div>
        <div style={{ padding:'32px 36px' }}>
          <div style={{ ...card, borderColor:'rgba(201,169,110,0.22)', background:'rgba(201,169,110,0.04)', marginBottom:'20px' }}>
            <div style={{ fontSize:'13px', color:'#9a9488', lineHeight:'1.7' }}>⬡ <strong style={{ color:'#c9a96e' }}>Private x402 HTTP payments for AI agents.</strong> When an agent encounters HTTP 402, Privé routes the micropayment through MagicBlock PER. Agent identity and API relationships are hidden on-chain. Zero trace linking your agent to specific API calls.</div>
          </div>
          {!connected ? <div style={{ textAlign:'center', padding:'40px' }}><WalletMultiButton /></div> : (
            <>
              {phase==='register' && (
                <div style={card}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:'18px', marginBottom:'6px' }}>Register AI agent</div>
                  <div style={{ fontSize:'12px', color:'#7a7468', marginBottom:'24px' }}>Create an on-chain agent account that can make autonomous x402 payments through PER.</div>
                  <span style={lbl}>Agent name</span>
                  <input style={inp} value={agentName} onChange={e=>setAgentName(e.target.value)} />
                  <span style={lbl}>Max payment per tx (USDC micro)</span>
                  <input style={inp} value={maxPayment} onChange={e=>setMaxPayment(e.target.value)} />
                  <span style={lbl}>Daily spending limit (USDC micro)</span>
                  <input style={inp} value={dailyLimit} onChange={e=>setDailyLimit(e.target.value)} />
                  <button style={btn} onClick={registerAgent} disabled={loading}>{loading?'Registering...':'⬡ Register agent on-chain'}</button>
                  {status && <div style={isError?err:suc}>{status}</div>}
                </div>
              )}
              {(phase==='pay'||phase==='paid') && (
                <div style={card}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:'18px', marginBottom:'6px' }}>{phase==='paid'?'✓ Payment processed':'Simulate x402 API payment'}</div>
                  <div style={{ fontSize:'12px', color:'#7a7468', marginBottom:'20px' }}>Agent: {agentName} · Payments today: {payCount}{txSig && <> · <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ color:'#c9a96e' }}>View tx →</a></>}</div>
                  <div style={{ background:'#161616', border:'1px solid rgba(201,169,110,0.15)', borderRadius:'8px', padding:'16px', marginBottom:'16px', fontFamily:'monospace', fontSize:'11px', color:'#9a9488', lineHeight:'1.8' }}>
                    <span style={{ color:'#4caf7d' }}>GET</span> {apiEndpoint}<br/>
                    {phase==='pay' && <span style={{ color:'#e05c5c' }}>HTTP 402 Payment Required · X-Price: {Number(paymentAmount)/1_000_000} USDC</span>}
                    {phase==='paid' && <><span style={{ color:'#e05c5c' }}>HTTP 402 Payment Required</span><br/><span style={{ color:'#4caf7d' }}>✓ Payment sent via Privé PER · Zero on-chain trace</span><br/><span style={{ color:'#4caf7d' }}>✓ HTTP 200 OK · Resource unlocked</span></>}
                  </div>
                  <span style={lbl}>API endpoint</span>
                  <input style={inp} value={apiEndpoint} onChange={e=>setApiEndpoint(e.target.value)} />
                  <span style={lbl}>Payment amount (USDC micro)</span>
                  <input style={inp} value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} />
                  <div style={{ display:'flex', gap:'12px' }}>
                    <button style={btn} onClick={processPayment} disabled={loading}>{loading?'Processing...':'⬡ Process x402 payment on-chain'}</button>
                    {phase==='paid' && <button style={{ ...btn, background:'transparent', border:'1px solid rgba(201,169,110,0.26)', color:'#c9a96e' }} onClick={()=>setPhase('pay')}>Pay again</button>}
                  </div>
                  {status && <div style={isError?err:suc}>{status}</div>}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
