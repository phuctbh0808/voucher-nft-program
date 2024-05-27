import { Program } from '@project-serum/anchor';
import { Keypair } from '@solana/web3.js';
import {
    AddVoucherRepayInstructionParams,
    AddVaultInstructionParams,
    MintVoucherInstructionParams,
    VoucherNftType,
} from './types';
import { ComputeBudgetProgram } from '@solana/web3.js';

export function addVaultIx(program: Program<VoucherNftType>, params: AddVaultInstructionParams) {
    return program.methods
        .addVault(params.seed, params.operator)
        .accounts({
            config: params.config,
            vault: params.vault,
            admin: params.admin,
        })
        .instruction();
}

export async function mintVoucherIx(program: Program<VoucherNftType>, params: MintVoucherInstructionParams) {
    return program.methods
        .mintVoucher(params.seed, { name: params.params.name, symbol: params.params.symbol, uri: params.params.uri })
        .accounts({
            vault: params.vault,
            operator: params.operator,
            authorator: params.authorator,
            vaultTokenAccount: params.vaultTokenAccount,
            metadataAccount: params.metadataAccount,
            masterEdition: params.masterEdition,
            mint: params.mint.publicKey,
            tokenMetadataProgram: params.tokenMetadataProgram,
        })
        .instruction();
}

export async function addRepayVoucherIx(program: Program<VoucherNftType>, params: AddVoucherRepayInstructionParams) {
    return program.methods
        .addVoucherRepayInformation()
        .accounts({
            vault: params.vault,
            operator: params.operator,
            mint: params.mint.publicKey,
            metadataAccount: params.metadataAccount,
            masterEdition: params.masterEdition,
            tokenMetadataProgram: params.tokenMetadataProgram,
        })
        .instruction();
}

export function modifyComputeUnitIx(units?: number) {
    return ComputeBudgetProgram.setComputeUnitLimit({
        units: units || 1000000,
    });
}
