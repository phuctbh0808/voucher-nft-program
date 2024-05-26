use anchor_lang::prelude::*;

#[error]
pub enum VoucherNftError {
    #[msg("Only Admin")]
    OnlyAdmin,
    #[msg("Only Operator")]
    OnlyOperator,
    #[msg("Invalid Account Argument")]
    InvalidAccountArgument,
    #[msg("Account Not Initialized")]
    AccountNotInitialized,
}
