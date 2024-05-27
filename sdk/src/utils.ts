import * as anchor from '@project-serum/anchor';

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
