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

    #[msg("Vault Not Signed")] // 0x1775
    VaultNotSigned,
    #[msg("Invalid Discount Percentage")]
    InvalidDiscountPercentage,
    #[msg("Invalid Maximum Amount")]
    InvalidMaximumAmount,
    #[msg("StartTime After EndTime")]
    StartTimeAfterEndTime,
    #[msg("StartTime Before CurrentTime")]
    StartTimeBeforeCurrentTime,
}
