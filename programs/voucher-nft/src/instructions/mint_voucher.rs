use crate::constants::*;
use crate::errors::*;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token};
use mpl_token_metadata::instruction::create_metadata_accounts_v2;
use solana_program::program::invoke_signed;

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
        mint::authority = vault.key(),
        mint::freeze_authority = vault.key(),
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: Token_metadata_program will check this
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,

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
    msg!("Minting voucher NFT with seed {}", seed);

    msg!("Creating Metadata account");
    let metadata_account_infos = vec![
        ctx.accounts.metadata_account.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.vault.to_account_info(),
        ctx.accounts.operator.to_account_info(),
        ctx.accounts.vault.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];
    let (_, bump) =
        Pubkey::find_program_address(&[Vault::SEED.as_bytes(), seed.as_bytes()], ctx.program_id);
    let creator = vec![mpl_token_metadata::state::Creator {
        address: ctx.accounts.vault.key(),
        verified: true,
        share: 100,
    }];
    invoke_signed(
        &create_metadata_accounts_v2(
            ctx.accounts.token_metadata_program.key(),
            ctx.accounts.metadata_account.key(),
            ctx.accounts.mint.key(),
            ctx.accounts.vault.key(),
            ctx.accounts.operator.key(),
            ctx.accounts.vault.key(),
            "Voucher".to_string(),
            "VC".to_string(),
            "VC_URI".to_string(),
            Some(creator),
            0,
            true,
            true,
            None,
            None,
        ),
        metadata_account_infos.as_slice(),
        &[&[Vault::SEED.as_bytes(), seed.as_bytes(), &[bump]]],
    )?;

    Ok(())
}
