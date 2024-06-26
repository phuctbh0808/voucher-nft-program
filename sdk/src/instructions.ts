import { Program } from '@project-serum/anchor';
import {
    AddVoucherRepayInstructionParams,
    AddVaultInstructionParams,
    MintVoucherInstructionParams,
    VoucherNftType,
    OperatorAirdropToUserInstructionParams,
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
        .mintVoucher({ name: params.params.name, symbol: params.params.symbol, uri: params.params.uri })
        .accounts({
            config: params.config,
            vault: params.vault,
            operator: params.operator,
            authorator: params.authorator,
            vaultTokenAccount: params.vaultTokenAccount,
            metadataAccount: params.metadataAccount,
            masterEdition: params.masterEdition,
            mint: params.mint.publicKey,
            collectionMint: params.collection,
            collectionMetadataAccount: params.collectionMetadata,
            collectionMasterEdition: params.collectionMasterEdition,
            tokenMetadataProgram: params.tokenMetadataProgram,
        })
        .instruction();
}

export async function addRepayVoucherIx(program: Program<VoucherNftType>, params: AddVoucherRepayInstructionParams) {
    return program.methods
        .addVoucherRepayInformation({
            startTime: params.params.startTime,
            endTime: params.params.endTime,
            discountPercentage: params.params.discountPercentage,
            maximumAmount: params.params.maximumAmount,
        })
        .accounts({
            vault: params.vault,
            operator: params.operator,
            mint: params.mint.publicKey,
            metadataAccount: params.metadataAccount,
            masterEdition: params.masterEdition,
            repayVoucher: params.repayVoucher,
            tokenMetadataProgram: params.tokenMetadataProgram,
        })
        .instruction();
}

export async function airdropToUserIx(
    program: Program<VoucherNftType>,
    params: OperatorAirdropToUserInstructionParams
) {
    return program.methods
        .operatorAirdrop()
        .accounts({
            vault: params.vault,
            operator: params.operator,
            user: params.user,
            mint: params.mint,
            masterEdition: params.masterEdition,
            vaultTokenAccount: params.vaultTokenAccount,
            userTokenAccount: params.userTokenAccount,
        })
        .instruction();
}

export function modifyComputeUnitIx(units?: number) {
    return ComputeBudgetProgram.setComputeUnitLimit({
        units: units || 1000000,
    });
}
