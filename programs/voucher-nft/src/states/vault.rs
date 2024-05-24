use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub operator: Pubkey,
    pub bump: u8,
    pub seed: String,
    pub _reserve: [u128; 6],
}

impl Vault {
    pub const SPACE: usize = 8 + 32 + 1 + 4 + 32 + 16 * 6;
    pub const SEED: &'static str = "VAULT";
    pub fn initialize(&mut self, operator: Pubkey, seed: String, bump: u8) -> ProgramResult {
        self.operator = operator;
        self.seed = seed;
        self.bump = bump;

        Ok(())
    }
}
