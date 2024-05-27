use crate::errors::VoucherNftError::*;
use anchor_lang::prelude::*;

#[account]
pub struct RepayVoucher {
    // Base 10000
    pub discount_percentage: u16,
    pub maximum_amount: u32,
    pub start_time: i64,
    pub end_time: i64,
    pub nft_mint: Pubkey,
    pub authorator: Pubkey,
    pub _reserve: [u128; 6],
}

impl RepayVoucher {
    pub const SPACE: usize = 8 + 2 + 4 + 8 * 2 + 32 * 2 + 16 * 6;
    pub const SEED: &'static str = "REPAY_VOUCHER";

    fn assert_data_is_valid(
        discount_percentage: u16,
        maximum_amount: u32,
        start_time: i64,
        end_time: i64,
    ) -> ProgramResult {
        if discount_percentage > 10000 {
            return Err(InvalidDiscountPercentage.into());
        }

        if maximum_amount == 0 {
            return Err(InvalidMaximumAmount.into());
        }

        if start_time >= end_time {
            return Err(StartTimeAfterEndTime.into());
        }

        let current_time = Clock::get()?.unix_timestamp as i64;
        if start_time < current_time {
            return Err(StartTimeBeforeCurrentTime.into());
        }
        Ok(())
    }

    pub fn initialize(
        &mut self,
        discount_percentage: u16,
        maximum_amount: u32,
        start_time: i64,
        end_time: i64,
        nft_mint: Pubkey,
        authorator: Pubkey,
    ) -> ProgramResult {
        Self::assert_data_is_valid(discount_percentage, maximum_amount, start_time, end_time)?;
        self.discount_percentage = discount_percentage;
        self.maximum_amount = maximum_amount;
        self.start_time = start_time;
        self.end_time = end_time;
        self.nft_mint = nft_mint;
        self.authorator = authorator;
        Ok(())
    }
}
