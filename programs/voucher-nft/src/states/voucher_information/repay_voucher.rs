use anchor_lang::prelude::*;

#[account]
pub struct RepayVoucher {
    pub discount_percentage: u8,
    pub maximum_amount: u32,
    pub start_time: i64,
    pub end_time: i64,
    pub nft_mint: Pubkey,
    pub authorator: Pubkey,
    pub _reserve: [u128; 6],
}

impl RepayVoucher {
    pub const SPACE: usize = 8 + 1 + 4 + 8 * 2 + 16 * 6;
    pub const SEED: &'static str = "REPAY_VOUCHER";

    pub fn initialize(
        &mut self,
        discount_percentage: u8,
        maximum_amount: u32,
        start_time: i64,
        end_time: i64,
        nft_mint: Pubkey,
        authorator: Pubkey,
    ) -> ProgramResult {
        self.discount_percentage = discount_percentage;
        self.maximum_amount = maximum_amount;
        self.start_time = start_time;
        self.end_time = end_time;
        self.nft_mint = nft_mint;
        self.authorator = authorator;
        Ok(())
    }
}
