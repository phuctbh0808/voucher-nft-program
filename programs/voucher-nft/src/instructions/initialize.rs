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

    #[account(
        init,
        payer = admin,
        space = Authorator::SPACE,
        seeds = [Authorator::SEED.as_bytes()],
        bump,
    )]
    pub authorator: Account<'info, Authorator>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>) -> ProgramResult {
    let config = &mut ctx.accounts.config;
    let (_, bump) = Pubkey::find_program_address(&[Authorator::SEED.as_bytes()], ctx.program_id);
    let authorator = &mut ctx.accounts.authorator;
    authorator.initialize(bump)?;
    config.initialize(ctx.accounts.admin.key())?;
    Ok(())
}
