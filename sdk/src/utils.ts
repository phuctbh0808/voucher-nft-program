import * as anchor from '@project-serum/anchor';
import { NetworkType } from './types';
export { getKeypairFromFile } from '@solana-developers/helpers';
export async function airdrop(connection: anchor.web3.Connection, address: anchor.web3.PublicKey, amount: number) {
    await connection.requestAirdrop(address, amount * 10 ** 9);
    await delay(3000);
}

export async function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getCurrentBlockTime(connection: anchor.web3.Connection): Promise<number> {
    return await connection.getBlockTime(await connection.getSlot('confirmed'));
}

export function convertStringToNetworkType(network: string): NetworkType {
    switch (network.toLowerCase()) {
        case 'mainnet':
            return NetworkType.MainNet;
        case 'testnet':
            return NetworkType.TestNet;
        case 'localnet':
            return NetworkType.LocalNet;
        default:
            throw new Error('Invalid network type');
    }
}
