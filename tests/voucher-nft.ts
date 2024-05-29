import * as anchor from '@project-serum/anchor';
import * as assert from 'assert';
import { VoucherNftFixture, VoucherNftFixtureBuilder } from '../sdk/src/voucher-nft-fixture';
import { SendTransactionError } from '@solana/web3.js';
import { MetadataParams, NetworkType } from '../sdk/src/types';
import { airdrop } from '../sdk/src/utils';
import { addVaultIx } from '../sdk/src/instructions';

describe('voucher-nft', () => {
    let fixture: VoucherNftFixture;
    let operator: anchor.web3.Keypair;
    let collectionParams: MetadataParams;

    before(async () => {
        const fixtureBuilder = new VoucherNftFixtureBuilder().withNetwork(NetworkType.LocalNet);
        fixture = await fixtureBuilder.build();
        operator = anchor.web3.Keypair.generate();
        collectionParams = {
            name: 'Collection',
            symbol: 'COL',
            uri: 'Collection_URI',
        };
        await airdrop(fixture.provider.connection, operator.publicKey, 100);
    });

    it('Is initialized!', async () => {
        const relendCollection = anchor.web3.Keypair.generate();
        const tx = await fixture.initialize(relendCollection, collectionParams);
        console.log('Initialize success at ', tx);

        const configData = await fixture.getConfigData();
        assert.equal(
            configData.admin.toBase58(),
            fixture.provider.publicKey.toBase58(),
            'expect admin to be provider.publicKey'
        );

        const { bump } = fixture.pda.authorator();
        const authoratorData = await fixture.getAuthoratorData();
        assert.equal(authoratorData.bump, bump, 'Bump authorator mismatch');
    });

    it('FAILED OnlyAdmin: Add vault failed because not admin', async () => {
        const vaultSeed = 'VAULT1';
        const addVaultIns = await addVaultIx(fixture.program, {
            admin: operator.publicKey,
            config: fixture.pda.config().key,
            operator: operator.publicKey,
            seed: vaultSeed,
            vault: fixture.pda.vault(vaultSeed).key,
        });
        const transaction = new anchor.web3.Transaction().add(addVaultIns);
        try {
            await fixture.provider.sendAndConfirm(transaction, [operator]);
            assert.fail('Add vault should fail');
        } catch (error) {
            assert.ok(error instanceof SendTransactionError);
            assert.ok(error.logs.some((log) => log.includes('Custom program error: 0x1770')));
        }
    });

    it('FAILED SeedTooLong: Add vault failed because seed too long', async () => {
        const vaultSeed = 'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
        try {
            await fixture.addVault(vaultSeed, operator.publicKey);
            assert.fail('Add vault should fail');
        } catch (error) {
            assert.ok(error instanceof TypeError);
            assert.ok(error.message.includes('Max seed length exceeded'));
        }
    });

    it('Add vault success', async () => {
        const vaultSeed = 'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
        const tx = await fixture.addVault(vaultSeed, operator.publicKey);
        console.log('Add vault success at ', tx);
        const { bump } = fixture.pda.vault(vaultSeed);

        const vaultData = await fixture.getVaultData(vaultSeed);
        assert.equal(vaultData.seed, vaultSeed);
        assert.equal(vaultData.operator.toBase58(), operator.publicKey.toBase58());
        assert.equal(vaultData.bump, bump, 'Bump mismatch');
    });
});
