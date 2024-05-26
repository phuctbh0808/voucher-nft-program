import * as anchor from '@project-serum/anchor';
import { BorshAccountsCoder, Idl } from '@project-serum/anchor';

import { VoucherNft } from '../artifacts/voucher_nft';
import IDL from '../artifacts/voucher_nft.json';
import { PublicKey, Keypair } from '@solana/web3.js';

export type VoucherNftType = VoucherNft;
export const VoucherNftIDL = IDL as Idl;

export const accountsCoder = new BorshAccountsCoder(VoucherNftIDL);

export enum AccountName {
    Config = 'Config',
}

export enum NetworkType {
    MainNet,
    TestNet,
    LocalNet,
}

export const configurations: Map<NetworkType, Configuration> = new Map<NetworkType, Configuration>([
    [
        NetworkType.MainNet,
        {
            url: 'https://api-mainnet-beta.renec.foundation:8899/',
            programId: '3wFJr8f315BbdARn8dTit9XNxeUedNWD6ioLSjbXz1U3',
            keypairPath: '~/.config/renec/id.json',
        },
    ],
    [
        NetworkType.TestNet,
        {
            url: 'https://api-testnet.renec.foundation:8899/',
            programId: '3wFJr8f315BbdARn8dTit9XNxeUedNWD6ioLSjbXz1U3',
            keypairPath: '~/.config/renec/id.json',
        },
    ],
    [
        NetworkType.LocalNet,
        {
            url: 'http://127.0.0.1:8899',
            programId: '3wFJr8f315BbdARn8dTit9XNxeUedNWD6ioLSjbXz1U3',
            keypairPath: '~/.config/renec/id.json',
        },
    ],
]);

export type Configuration = {
    url: string;
    programId: string;
    keypairPath: string;
};

export type ConfigData = {
    admin: anchor.web3.PublicKey;
};

export type AddVaultInstructionParams = {
    config: PublicKey;
    vault: PublicKey;
    admin: PublicKey;
    operator: PublicKey;
    seed: string;
};

export type MetadataParams = {
    name: string;
    symbol: string;
    uri: string;
};

export type MintVoucherInstructionParams = {
    vault: PublicKey;
    operator: PublicKey;
    authorator: PublicKey;
    vaultTokenAccount: PublicKey;
    mint: Keypair;
    metadataAccount: PublicKey;
    masterEdition: PublicKey;
    tokenMetadataProgram: PublicKey;
    seed: string;
    params: MetadataParams;
};
