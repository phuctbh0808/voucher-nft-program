import * as anchor from '@project-serum/anchor';
import * as token from '@solana/spl-token';
import * as assert from 'assert';
import { VoucherNftFixture, VoucherNftFixtureBuilder } from '../sdk/src/voucher-nft-fixture';
import { MetadataParams, NetworkType } from '../sdk/src/types';
import { airdrop } from '../sdk/src/utils';
import { Metadata } from '@renec-foundation/mpl-token-metadata';
import { Keypair, SendTransactionError } from '@solana/web3.js';

describe('mint-voucher', () => {
    let fixture: VoucherNftFixture;
    let operator: anchor.web3.Keypair;
    let vaultSeed: string;
    let metadataParams: MetadataParams;
    let collectionParams: MetadataParams;
    let relendCollection: Keypair;

    before(async () => {
        const fixtureBuilder = new VoucherNftFixtureBuilder().withNetwork(NetworkType.LocalNet);
        fixture = await fixtureBuilder.build();
        operator = anchor.web3.Keypair.generate();
        vaultSeed = 'Vault1';
        metadataParams = {
            name: 'Voucher',
            symbol: 'VC',
            uri: 'Voucher_URI',
        };
        collectionParams = {
            name: 'Collection',
            symbol: 'COL',
            uri: 'Collection_URI',
        };
        relendCollection = Keypair.generate();
        await airdrop(fixture.provider.connection, operator.publicKey, 100);
    });

    it('Is initialized!', async () => {
        const tx = await fixture.initialize(relendCollection, collectionParams);
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

    it('FAILED OnlyOperator: Mint voucher failed because of wrong operator', async () => {
        const mint = anchor.web3.Keypair.generate();
        const operator2 = anchor.web3.Keypair.generate();
        await airdrop(fixture.provider.connection, operator2.publicKey, 100);
        try {
            await fixture.mintVoucher(vaultSeed, operator2, mint, metadataParams);
            assert.fail('Mint voucher should fail');
        } catch (error) {
            assert.ok(error instanceof SendTransactionError);
            assert.ok(error.logs.some((log) => log.includes('Custom program error: 0x1771')));
        }
    });

    it('Mint voucher success', async () => {
        const mint = anchor.web3.Keypair.generate();
        const { key: vault } = fixture.pda.vault(vaultSeed);
        const { key: metadata } = await fixture.pda.metadata(mint.publicKey);
        const { key: masterEdition } = await fixture.pda.masterEdition(mint.publicKey);
        const { key: authority } = await fixture.pda.authorator();
        const tx = await fixture.mintVoucher(vaultSeed, operator, mint, metadataParams);
        console.log('Add mint success at tx', tx);

        const configData = await fixture.getConfigData();

        const mintData = await token.getMint(fixture.connection, mint.publicKey);
        assert.equal(mintData.decimals, 0, 'Decimal must be zero');
        assert.equal(
            mintData.mintAuthority.toBase58(),
            masterEdition.toBase58(),
            'Mint Authority must be master edition'
        );
        assert.equal(
            mintData.freezeAuthority.toBase58(),
            masterEdition.toBase58(),
            'Freeze Authority must be master edition'
        );
        assert.equal(mintData.isInitialized, true, 'Mint must be initialized');
        assert.equal(Number(mintData.supply), 1, 'Supply must be one');

        const metadataData = await Metadata.findByMint(fixture.connection, mint.publicKey);
        assert.equal(metadataData.data.data.name, metadataParams.name, 'Name must be Voucher');
        assert.equal(metadataData.data.data.symbol, metadataParams.symbol, 'Symbol must be VC');
        assert.equal(metadataData.data.data.uri, metadataParams.uri, 'URI must be VC_URI');
        assert.equal(metadataData.data.updateAuthority, vault.toBase58(), 'Update Authority must be vault');
        assert.equal(metadataData.pubkey.toBase58(), metadata.toBase58(), 'Metadata pubkey must be equal to metadata');
        assert.equal(metadataData.data.mint, mint.publicKey.toBase58(), 'Mint must be mint public key');
        assert.equal(metadataData.data.data.creators.length, 2, 'Creators length must be 2');
        assert.equal(metadataData.data.data.creators[0].address, vault.toBase58(), 'Creators 0 must be vault');
        assert.equal(metadataData.data.data.creators[0].verified, true, 'Creators 0 must be verified');
        assert.equal(metadataData.data.data.creators[0].share, 0, 'Creators 0 must be 0 share');

        assert.equal(metadataData.data.data.creators[1].address, authority.toBase58(), 'Creators 1 must be vault');
        assert.equal(metadataData.data.data.creators[1].verified, true, 'Creators 1 must be verified');
        assert.equal(metadataData.data.data.creators[1].share, 100, 'Creators 1 must be 100 share');

        assert.equal(metadataData.data.isMutable, false, 'Metadata must be immutable');

        assert.equal(
            metadataData.data.collection.key,
            configData.collection,
            'Collection key must be equal to config collection'
        );
        assert.equal(metadataData.data.collection.verified, true, 'Collection must be verified');

        const vaultTokenAccount = await token.getAssociatedTokenAddress(mint.publicKey, vault, true);
        const tokenAccount = await token.getAccount(fixture.connection, vaultTokenAccount);
        assert.equal(tokenAccount.amount, 1, 'Amount must be 1');
    });
});
