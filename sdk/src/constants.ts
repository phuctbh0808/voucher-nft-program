import { PublicKey } from '@solana/web3.js';

export class Constants {
    static readonly CONFIG_SEED = 'CONFIG';
    static readonly VAULT_SEED = 'VAULT';
    static readonly AUTHORATOR_SEED = 'AUTHORATOR';
    static readonly VOUCHER_NFT_PROGRAM_ID_TESTNET = new PublicKey('GgYWQNtiG5psgd2ZcVRNBNzCW28wBrhc6ntMMamBuSJU');
    static readonly TOKEN_METADATA_PROGRAM = new PublicKey('metaXfaoQatFJP9xiuYRsKkHYgS5NqqcfxFbLGS5LdN');
}
