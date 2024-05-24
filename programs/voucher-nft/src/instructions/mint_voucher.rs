use crate::constants::*;
use crate::errors::*;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use mpl_token_metadata::instruction::{create_master_edition_v3, create_metadata_accounts_v2};
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
    pub mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = operator,
        associated_token::mint = mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: Token_metadata_program will check this
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,

    /// CHECK: Token_metadata_program will check this
    #[account(mut)]
    pub master_edition: AccountInfo<'info>,

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
    msg!(
        "Minting voucher NFT {} with seed {}",
        ctx.accounts.mint.key(),
        seed
    );

    let vault = &ctx.accounts.vault;

    msg!("Minting NFT to vault");
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: vault.to_account_info(),
    };
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            cpi_accounts,
            &[&[Vault::SEED.as_bytes(), seed.as_bytes(), &[vault.bump]]],
        ),
        1,
    )?;

    msg!("Creating Metadata account");
    let metadata_account_infos = vec![
        ctx.accounts.metadata_account.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        vault.to_account_info(),
        ctx.accounts.operator.to_account_info(),
        vault.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];
    let creator = vec![mpl_token_metadata::state::Creator {
        address: vault.key(),
        verified: true,
        share: 100,
    }];
    invoke_signed(
        &create_metadata_accounts_v2(
            ctx.accounts.token_metadata_program.key(),
            ctx.accounts.metadata_account.key(),
            ctx.accounts.mint.key(),
            vault.key(),
            ctx.accounts.operator.key(),
            vault.key(),
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
        &[&[Vault::SEED.as_bytes(), seed.as_bytes(), &[vault.bump]]],
    )?;

    msg!("Creating master edition");
    let master_edition_infos = vec![
        ctx.accounts.master_edition.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.vault.to_account_info(),
        ctx.accounts.operator.to_account_info(),
        ctx.accounts.metadata_account.to_account_info(),
        ctx.accounts.token_metadata_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];

    invoke_signed(
        &create_master_edition_v3(
            ctx.accounts.token_metadata_program.key(),
            ctx.accounts.master_edition.key(),
            ctx.accounts.mint.key(),
            ctx.accounts.vault.key(),
            ctx.accounts.vault.key(),
            ctx.accounts.metadata_account.key(),
            ctx.accounts.operator.key(),
            Some(0),
        ),
        master_edition_infos.as_slice(),
        &[&[Vault::SEED.as_bytes(), seed.as_bytes(), &[vault.bump]]],
    )?;
    msg!("Master Edition created");

    Ok(())
}
