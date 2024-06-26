use crate::constants::*;
use crate::errors::*;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use mpl_token_metadata::instruction::{
    create_master_edition_v3, create_metadata_accounts_v2, sign_metadata, verify_collection,
};
use mpl_token_metadata::state::Collection;
use solana_program::program::invoke_signed;

#[derive(Accounts)]
pub struct MintVoucher<'info> {
    #[account(
        seeds = [Config::SEED.as_bytes()],
        bump,
    )]
    pub config: Box<Account<'info, Config>>,

    #[account(
        seeds = [Vault::SEED.as_bytes(), vault.seed.as_bytes()],
        bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        mut,
        seeds = [Authorator::SEED.as_bytes()],
        bump,
    )]
    pub authorator: Box<Account<'info, Authorator>>,

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

    #[account(
        mut,
        address = config.collection,
    )]
    pub collection_mint: Box<Account<'info, Mint>>,

    /// CHECK: Token_metadata_program will check this
    #[account(mut)]
    pub collection_metadata_account: AccountInfo<'info>,

    /// CHECK: Token_metadata_program will check this
    #[account(mut)]
    pub collection_master_edition: AccountInfo<'info>,

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

#[derive(AnchorSerialize, AnchorDeserialize, PartialEq, Clone)]
pub struct MetadataParams {
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

pub fn handler(ctx: Context<MintVoucher>, params: MetadataParams) -> ProgramResult {
    let vault = &ctx.accounts.vault;
    let mint = &ctx.accounts.mint;
    let authorator = &ctx.accounts.authorator;
    let token_metadata_program = &ctx.accounts.token_metadata_program;
    let metadata_account = &mut ctx.accounts.metadata_account;
    let operator = &mut ctx.accounts.operator;
    msg!(
        "Minting voucher NFT {} with vault {}",
        mint.key(),
        vault.key()
    );

    msg!("Minting NFT to vault");
    let cpi_accounts = MintTo {
        mint: mint.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: vault.to_account_info(),
    };
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            &[&[Vault::SEED.as_bytes(), vault.seed.as_bytes(), &[vault.bump]]],
        ),
        1,
    )?;

    msg!("Creating Metadata account");
    let metadata_account_infos = vec![
        metadata_account.to_account_info(),
        mint.to_account_info(),
        vault.to_account_info(),
        operator.to_account_info(),
        vault.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];
    let creators = vec![
        mpl_token_metadata::state::Creator {
            address: vault.key(),
            verified: true,
            share: 0,
        },
        mpl_token_metadata::state::Creator {
            address: authorator.key(),
            verified: false,
            share: 100,
        },
    ];
    let collection = Collection {
        verified: false,
        key: ctx.accounts.collection_mint.key(),
    };
    invoke_signed(
        &create_metadata_accounts_v2(
            token_metadata_program.key(),
            metadata_account.key(),
            mint.key(),
            vault.key(),
            operator.key(),
            vault.key(),
            params.name.to_string(),
            params.symbol.to_string(),
            params.uri.to_string(),
            Some(creators),
            0,
            true,
            false,
            Some(collection),
            None,
        ),
        metadata_account_infos.as_slice(),
        &[&[Vault::SEED.as_bytes(), vault.seed.as_bytes(), &[vault.bump]]],
    )?;

    msg!("Signing creator with authorator");
    let sign_metadata_infos = vec![
        metadata_account.to_account_info(),
        authorator.to_account_info(),
    ];
    invoke_signed(
        &sign_metadata(
            token_metadata_program.key(),
            metadata_account.key(),
            authorator.key(),
        ),
        sign_metadata_infos.as_slice(),
        &[&[Authorator::SEED.as_bytes(), &[authorator.bump]]],
    )?;

    msg!("Creating master edition");
    let master_edition_infos = vec![
        ctx.accounts.master_edition.to_account_info(),
        mint.to_account_info(),
        vault.to_account_info(),
        operator.to_account_info(),
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
            mint.key(),
            vault.key(),
            vault.key(),
            metadata_account.key(),
            operator.key(),
            Some(0),
        ),
        master_edition_infos.as_slice(),
        &[&[Vault::SEED.as_bytes(), vault.seed.as_bytes(), &[vault.bump]]],
    )?;
    msg!("Master Edition created");

    msg!("Verifying nft inside the collection");
    let verify_collection_infos = vec![
        token_metadata_program.to_account_info(),
        metadata_account.to_account_info(),
        authorator.to_account_info(),
        operator.to_account_info(),
        ctx.accounts.collection_mint.to_account_info(),
        ctx.accounts.collection_metadata_account.to_account_info(),
        ctx.accounts.collection_master_edition.to_account_info(),
    ];
    invoke_signed(
        &verify_collection(
            token_metadata_program.key(),
            metadata_account.key(),
            authorator.key(),
            operator.key(),
            ctx.accounts.collection_mint.key(),
            ctx.accounts.collection_metadata_account.key(),
            ctx.accounts.collection_master_edition.key(),
            None,
        ),
        verify_collection_infos.as_slice(),
        &[&[Authorator::SEED.as_bytes(), &[authorator.bump]]],
    )?;

    msg!("Verifying nft inside collection success");
    Ok(())
}
