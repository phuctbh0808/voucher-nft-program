use crate::constants::*;
use crate::errors::VoucherNftError::*;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use mpl_token_metadata::state::Metadata;

#[derive(Accounts)]
pub struct AddRepayVoucher<'info> {
    #[account(
        seeds = [Vault::SEED.as_bytes(), vault.seed.as_bytes()],
        bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        mut,
        address = vault.operator @ OnlyOperator,
    )]
    pub operator: Signer<'info>,

    #[account()]
    pub mint: Box<Account<'info, Mint>>,

    /// CHECK: Check this account exist in code
    #[account()]
    pub metadata_account: AccountInfo<'info>,

    /// CHECK: Check this account exist in code
    #[account()]
    pub master_edition: AccountInfo<'info>,

    /// CHECK: THe RENEC token metadata program
    #[account(
        address = TOKEN_METADATA_PROGRAM_ID,
    )]
    pub token_metadata_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AddRepayVoucher>) -> ProgramResult {
    let mint = &ctx.accounts.mint;
    let metadata = &ctx.accounts.metadata_account;
    let master_edition = &ctx.accounts.master_edition;

    msg!("Perform add repay voucher");
    let (calculated_metadata, _) = Pubkey::find_program_address(
        &[
            METADATA_PREFIX.as_bytes(),
            TOKEN_METADATA_PROGRAM_ID.as_ref(),
            mint.key().as_ref(),
        ],
        &TOKEN_METADATA_PROGRAM_ID,
    );

    if metadata.key() != calculated_metadata {
        return Err(InvalidAccountArgument.into());
    }

    if metadata.data_is_empty() {
        return Err(AccountNotInitialized.into());
    }
    msg!("Check metadata success");

    let (calculated_master_edition, _) = Pubkey::find_program_address(
        &[
            METADATA_PREFIX.as_bytes(),
            TOKEN_METADATA_PROGRAM_ID.as_ref(),
            mint.key().as_ref(),
            METADATA_EDITION.as_bytes(),
        ],
        &TOKEN_METADATA_PROGRAM_ID,
    );

    if master_edition.key() != calculated_master_edition {
        return Err(InvalidAccountArgument.into());
    }

    if master_edition.data_is_empty() {
        return Err(AccountNotInitialized.into());
    }
    msg!("Check master edition success");

    let (authorator, _) =
        Pubkey::find_program_address(&[Authorator::SEED.as_bytes()], ctx.program_id);

    let metadata_account_data = &mut Metadata::from_account_info(metadata)?;
    let metadata_creators = metadata_account_data.data.creators.clone();
    match metadata_creators {
        None => {
            msg!("Creators is empty");
            return Err(AuthoratorNotSigned.into());
        }
        Some(creators) => {
            let match_creator = creators.iter().find(|c| c.address == authorator);
            match match_creator {
                None => {
                    msg!("Authorator not found");
                    return Err(AuthoratorNotSigned.into());
                }
                Some(creator) => {
                    if creator.verified == false {
                        msg!("Authorator not verified");
                        return Err(AuthoratorNotSigned.into());
                    }
                    msg!("Verify authorator success");
                }
            }
        }
    }
    Ok(())
}
