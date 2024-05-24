mod errors;
mod instructions;
mod states;

pub use crate::instructions::*;
pub use crate::states::*;

use anchor_lang::prelude::*;

declare_id!("GgYWQNtiG5psgd2ZcVRNBNzCW28wBrhc6ntMMamBuSJU");

#[program]
pub mod voucher_nft {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        initialize::handler(ctx)
    }

    pub fn add_vault(ctx: Context<AddVault>, seed: String, operator: Pubkey) -> ProgramResult {
        add_vault::handler(ctx, seed, operator)
    }
}
