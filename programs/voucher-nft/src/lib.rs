mod instructions;
mod states;

pub use crate::instructions::*;
pub use crate::states::*;

use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod voucher_nft {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        initialize::handler(ctx)
    }
}
