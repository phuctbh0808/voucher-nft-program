use anchor_lang::prelude::*;

#[error]
pub enum VoucherNftError {
    #[msg("Only Admin")] // 0x1770
    OnlyAdmin,
    #[msg("Only Operator")]
    OnlyOperator,
    #[msg("Invalid Account Argument")]
    InvalidAccountArgument,
    #[msg("Account Not Initialized")]
    AccountNotInitialized,
    #[msg("Authorator Not Signed")]
    AuthoratorNotSigned,
}
