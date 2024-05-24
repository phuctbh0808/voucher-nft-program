import * as anchor from '@project-serum/anchor';
import * as assert from 'assert';
import { VoucherNftFixture, VoucherNftFixtureBuilder } from '../sdk/src/voucher-nft-fixture';
import { SendTransactionError } from '@solana/web3.js';
import { NetworkType } from '../sdk/src/types';
import { airdrop } from '../sdk/src/utils';
import { addVaultIx } from '../sdk/src/instructions';

describe('mint-voucher', () => {
    let fixture: VoucherNftFixture;
    let operator: anchor.web3.Keypair;
    let vaultSeed: string;

    before(async () => {
        const fixtureBuilder = new VoucherNftFixtureBuilder().withNetwork(NetworkType.LocalNet);
        fixture = await fixtureBuilder.build();
        operator = anchor.web3.Keypair.generate();
        vaultSeed = 'Vault1';
        await airdrop(fixture.provider.connection, operator.publicKey, 100);
    });

    it('Is initialized!', async () => {
        const tx = await fixture.initialize();
        console.log('Initialize success at ', tx);

        const configData = await fixture.getConfigData();
        assert.equal(
            configData.admin.toBase58(),
            fixture.provider.publicKey.toBase58(),
            'expect admin to be provider.publicKey'
        );
    });

    it('Add vault success', async () => {
        const tx = await fixture.addVault(vaultSeed, operator.publicKey);
        console.log('Add vault success at ', tx);

        const vaultData = await fixture.getVaultData(vaultSeed);
        assert.equal(vaultData.seed, vaultSeed);
        assert.equal(vaultData.operator.toBase58(), operator.publicKey.toBase58());
    });
});
