import { Program, AnchorProvider, setProvider, web3 } from '@coral-xyz/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import idl from './idl.json';

export const PROGRAM_ID = new web3.PublicKey('9VzuKgdog1uRcB4Xjnx2At3d8ZQ6NdwtC5bhFfwz6tBe');
export const VAULT_SEED = Buffer.from('prive_vault');

export function getProgram(wallet: AnchorWallet, connection: Connection) {
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  setProvider(provider);
  return new Program(idl as any, provider);
}

export function getVaultPda(owner: web3.PublicKey): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [VAULT_SEED, owner.toBuffer()],
    PROGRAM_ID
  );
}
