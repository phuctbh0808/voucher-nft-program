use crate::constants::*;
use crate::errors::*;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
#[instruction(seed: String)]
pub struct MintVoucher<'info> {
    #[account(
        seeds = [Vault::SEED.as_bytes(), seed.as_bytes()],
        bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        mut,
        address = vault.operator @ VoucherNftError::OnlyOperator,
    )]
    pub operator: Signer<'info>,

    #[account(
        init,
        payer = operator,
        mint::decimals = 0,
        mint::authority = vault,
        mint::freeze_authority = vault,
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: The RENEC token metadata program
    #[account(
        address = TOKEN_METADATA_PROGRAM_ID,
    )]
    pub token_metadata_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<MintVoucher>, seed: String) -> ProgramResult {
    Ok(())
}
