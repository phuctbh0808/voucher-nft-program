use crate::constants::*;
use crate::states::*;
use crate::MetadataParams;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use mpl_token_metadata::instruction::{create_master_edition_v3, create_metadata_accounts_v2};
use solana_program::program::invoke_signed;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = Config::SPACE,
        seeds = [Config::SEED.as_bytes()],
        bump,
    )]
    pub config: Box<Account<'info, Config>>,

    #[account(
        init,
        payer = admin,
        space = Authorator::SPACE,
        seeds = [Authorator::SEED.as_bytes()],
        bump,
    )]
    pub authorator: Box<Account<'info, Authorator>>,

    #[account(
        init,
        payer = admin,
        mint::decimals = 0,
        mint::authority = authorator,
        mint::freeze_authority = authorator,
    )]
    pub relend_collection: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = relend_collection,
        associated_token::authority = authorator,
    )]
    pub authorator_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: Token_metadata_program will check this
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,

    /// CHECK: Token_metadata_program will check this
    #[account(mut)]
    pub master_edition: AccountInfo<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    /// CHECK: The RENEC token metadata program
    #[account(
        address = TOKEN_METADATA_PROGRAM_ID,
    )]
    pub token_metadata_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Initialize>, params: MetadataParams) -> ProgramResult {
    let relend_collection = &ctx.accounts.relend_collection;
    let token_metadata_program = &ctx.accounts.token_metadata_program;
    let metadata_account = &mut ctx.accounts.metadata_account;
    let config = &mut ctx.accounts.config;
    let admin = &mut ctx.accounts.admin;

    msg!("Initializing config account");
    let (_, bump) = Pubkey::find_program_address(&[Authorator::SEED.as_bytes()], ctx.program_id);
    let authorator = &mut ctx.accounts.authorator;
    authorator.initialize(bump)?;
    config.initialize(admin.key(), relend_collection.key())?;

    msg!(
        "Minting relend_nft {} to authorator",
        relend_collection.key()
    );
    let cpi_accounts = MintTo {
        mint: relend_collection.to_account_info(),
        to: ctx.accounts.authorator_token_account.to_account_info(),
        authority: authorator.to_account_info(),
    };

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            &[&[Authorator::SEED.as_bytes(), &[authorator.bump]]],
        ),
        1,
    )?;

    msg!("Creating metadata account");

    let metadata_account_infos = vec![
        metadata_account.to_account_info(),
        relend_collection.to_account_info(),
        authorator.to_account_info(),
        admin.to_account_info(),
        authorator.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];
    let creators = vec![mpl_token_metadata::state::Creator {
        address: authorator.key(),
        verified: true,
        share: 100,
    }];

    invoke_signed(
        &create_metadata_accounts_v2(
            token_metadata_program.key(),
            metadata_account.key(),
            relend_collection.key(),
            authorator.key(),
            admin.key(),
            authorator.key(),
            params.name.to_string(),
            params.symbol.to_string(),
            params.uri.to_string(),
            Some(creators),
            0,
            true,
            true,
            None,
            None,
        ),
        metadata_account_infos.as_slice(),
        &[&[Authorator::SEED.as_bytes(), &[authorator.bump]]],
    )?;

    msg!("Creating master edition");
    let master_edition_infos = vec![
        ctx.accounts.master_edition.to_account_info(),
        relend_collection.to_account_info(),
        authorator.to_account_info(),
        admin.to_account_info(),
        metadata_account.to_account_info(),
        token_metadata_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];

    invoke_signed(
        &create_master_edition_v3(
            token_metadata_program.key(),
            ctx.accounts.master_edition.key(),
            relend_collection.key(),
            authorator.key(),
            authorator.key(),
            metadata_account.key(),
            admin.key(),
            Some(0),
        ),
        master_edition_infos.as_slice(),
        &[&[Authorator::SEED.as_bytes(), &[authorator.bump]]],
    )?;

    Ok(())
}
