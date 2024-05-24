use crate::constants::*;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use std::str::FromStr;

#[derive(Accounts)]
pub struct MintVoucher<'info> {
    #[account(
        seeds = [Config::SEED.as_bytes()],
        bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        address = config.admin,
    )]
    pub admin: Signer<'info>,

    /// CHECK: The RENEC token metadata program
    #[account(
        address = TOKEN_METADATA_PROGRAM_ID,
    )]
    pub token_metadata_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<MintVoucher>) -> ProgramResult {
    Ok(())
}
