use anchor_lang::prelude::*;

#[account]
pub struct Config {
    pub admin: Pubkey,
    pub _reserve: [u128; 6],
}

impl Config {
    pub const SPACE: usize = 8 + 32 + 16 * 6;
    pub const SEED: &'static str = "CONFIG";

    pub fn initialize(&mut self, admin: Pubkey) -> ProgramResult {
        self.admin = admin;
        Ok(())
    }
}
