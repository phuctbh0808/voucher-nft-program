use crate::errors::*;
use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub operator: Pubkey,
    pub seed: String,
    pub _reserve: [u128; 6],
}

impl Vault {
    pub const SPACE: usize = 8 + 32 + 4 + 32 + 16 * 6;
    pub const SEED: &'static str = "VAULT";
    pub fn initialize(&mut self, operator: Pubkey, seed: String) -> ProgramResult {
        if seed.len() > 32 {
            return Err(VoucherNftError::SeedTooLong.into());
        }
        self.operator = operator;
        self.seed = seed;

        Ok(())
    }
}
