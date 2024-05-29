mod constants;
mod errors;
mod instructions;
mod states;

pub use crate::instructions::*;
pub use crate::states::*;

use anchor_lang::prelude::*;

declare_id!("83Y1RXET7F21aeyLaSSrGxwWrAP7jhXdDNwi1znMGU72");

#[program]
pub mod voucher_nft {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, params: MetadataParams) -> ProgramResult {
        initialize::handler(ctx, params)
    }

    pub fn add_vault(ctx: Context<AddVault>, seed: String, operator: Pubkey) -> ProgramResult {
        add_vault::handler(ctx, seed, operator)
    }

    pub fn mint_voucher(ctx: Context<MintVoucher>, params: MetadataParams) -> ProgramResult {
        mint_voucher::handler(ctx, params)
    }

    pub fn add_voucher_repay_information(
        ctx: Context<AddRepayVoucher>,
        params: AddRepayVoucherParams,
    ) -> ProgramResult {
        add_repay_voucher::handler(ctx, params)
    }

    pub fn operator_airdrop(ctx: Context<OperatorAirdrop>) -> ProgramResult {
        operator_airdrop::handler(ctx)
    }
}
