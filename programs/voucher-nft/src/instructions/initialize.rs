use crate::states::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = Config::SPACE,
        seeds = [Config::SEED.as_bytes()],
        bump,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>) -> ProgramResult {
    let config = &mut ctx.accounts.config;
    config.admin = *ctx.accounts.admin.key;
    Ok(())
}
