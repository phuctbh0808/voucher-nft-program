use anchor_lang::prelude::*;

#[error]
pub enum VoucherNftError {
    #[msg("Only Admin")]
    OnlyAdmin,
}
