mod constants;
mod errors;
mod instructions;
mod states;

pub use crate::instructions::*;
pub use crate::states::*;

use anchor_lang::prelude::*;

declare_id!("3wFJr8f315BbdARn8dTit9XNxeUedNWD6ioLSjbXz1U3");

#[program]
pub mod voucher_nft {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        initialize::handler(ctx)
    }

    pub fn add_vault(ctx: Context<AddVault>, seed: String, operator: Pubkey) -> ProgramResult {
        add_vault::handler(ctx, seed, operator)
    }

    pub fn mint_voucher(
        ctx: Context<MintVoucher>,
        seed: String,
        params: MetadataParams,
    ) -> ProgramResult {
        mint_voucher::handler(ctx, seed, params)
    }

    pub fn add_voucher_repay_information(
        ctx: Context<AddRepayVoucher>,
        params: AddRepayVoucherParams,
    ) -> ProgramResult {
        add_repay_voucher::handler(ctx, params)
    }
}
