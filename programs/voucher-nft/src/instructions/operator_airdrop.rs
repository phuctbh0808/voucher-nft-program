use crate::errors::VoucherNftError::*;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct OperatorAirdrop<'info> {
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

    /// CHECK: The user account address
    #[account()]
    pub user: AccountInfo<'info>,

    #[account()]
    pub mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = operator,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<OperatorAirdrop>) -> ProgramResult {
    let mint = &ctx.accounts.mint;
    let vault = &ctx.accounts.vault;

    msg!(
        "Airdrop token {} to user {}",
        mint.key(),
        ctx.accounts.user.key()
    );

    // We just simple check here
    if mint.decimals != 0 || mint.supply != 1 {
        return Err(InvalidNftMint.into());
    }

    msg!("Check nft valid success");

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            &[&[Vault::SEED.as_bytes(), &[vault.bump]]],
        ),
        1,
    )?;

    msg!("Airdrop nft success");

    Ok(())
}
