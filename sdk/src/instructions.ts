import { Program } from '@project-serum/anchor';
import { AddVaultParams, VoucherNftType } from './types';

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
