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

    pub fn add_vault(
        ctx: Context<AddVault>,
        seed: String,
        bump: u8,
        operator: Pubkey,
    ) -> ProgramResult {
        add_vault::handler(ctx, seed, bump, operator)
    }

    pub fn mint_voucher(ctx: Context<MintVoucher>, seed: String) -> ProgramResult {
        mint_voucher::handler(ctx, seed)
    }
}
