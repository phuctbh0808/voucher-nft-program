use crate::errors::VoucherNftError::*;
use crate::states::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(seed: String, bump: u8)]
pub struct AddVault<'info> {
    #[account(
        seeds = [Config::SEED.as_bytes()],
        bump = bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        seeds = [Vault::SEED.as_bytes(), seed.as_bytes()],
        bump,
        payer = admin,
        space = Vault::SPACE,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        address = config.admin @ OnlyAdmin,
    )]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AddVault>, seed: String, bump: u8, operator: Pubkey) -> ProgramResult {
    let vault = &mut ctx.accounts.vault;
    vault.initialize(operator, seed, bump)
}
