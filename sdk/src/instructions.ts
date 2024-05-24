import { Program } from '@project-serum/anchor';
import { Keypair } from '@solana/web3.js';
import { AddVaultParams, MintVoucherParams, VoucherNftType } from './types';
import { ComputeBudgetProgram } from '@solana/web3.js';

export function addVaultIx(program: Program<VoucherNftType>, params: AddVaultParams) {
    return program.methods
        .addVault(params.seed, params.operator)
        .accounts({
            config: params.config,
            vault: params.vault,
            admin: params.admin,
        })
        .instruction();
}

export async function mintVoucherIx(program: Program<VoucherNftType>, params: MintVoucherParams) {
    return program.methods
        .mintVoucher(params.seed)
        .accounts({
            vault: params.vault,
            operator: params.operator,
            vaultTokenAccount: params.vaultTokenAccount,
            metadataAccount: params.metadataAccount,
            mint: params.mint.publicKey,
            tokenMetadataProgram: params.tokenMetadataProgram,
        })
        .instruction();
}

export function modifyComputeUnitIx(units?: number) {
    return ComputeBudgetProgram.setComputeUnitLimit({
        units: units || 1000000,
    });
}
