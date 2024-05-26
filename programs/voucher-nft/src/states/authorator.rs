use anchor_lang::prelude::*;

#[account]
pub struct Authorator {
    pub bump: u8,
}

impl Authorator {
    pub const SPACE: usize = 8 + 1;
    pub const SEED: &'static str = "AUTHORATOR";
    pub fn initialize(&mut self, bump: u8) -> ProgramResult {
        self.bump = bump;
        Ok(())
    }
}
