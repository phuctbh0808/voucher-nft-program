import * as anchor from '@project-serum/anchor';
import * as token from '@solana/spl-token';
import * as assert from 'assert';
import { VoucherNftFixture, VoucherNftFixtureBuilder } from '../sdk/src/voucher-nft-fixture';
import { NetworkType } from '../sdk/src/types';
import { airdrop } from '../sdk/src/utils';
import { Metadata } from '@renec-foundation/mpl-token-metadata';

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

    it('Mint voucher success', async () => {
        const mint = anchor.web3.Keypair.generate();
        const { key: vault } = fixture.pda.vault(vaultSeed);
        const { key: metadata } = await fixture.pda.metadata(mint.publicKey);
        const tx = await fixture.mintVoucher(vaultSeed, operator, mint);
        console.log('Add mint success at tx', tx);

        const mintData = await token.getMint(fixture.connection, mint.publicKey);
        assert.equal(mintData.decimals, 0, 'Decimal must be zero');
        assert.equal(mintData.mintAuthority.toBase58(), vault.toBase58(), 'Mint Authority must be vault');
        assert.equal(mintData.freezeAuthority.toBase58(), vault.toBase58(), 'Freeze Authority must be vault');
        assert.equal(mintData.isInitialized, true, 'Mint must be initialized');
        assert.equal(Number(mintData.supply), 1, 'Supply must be zero');

        const metadataData = await Metadata.findByMint(fixture.connection, mint.publicKey);
        assert.equal(metadataData.data.data.name, 'Voucher', 'Name must be Voucher');
        assert.equal(metadataData.data.data.symbol, 'VC', 'Symbol must be VC');
        assert.equal(metadataData.data.data.uri, 'VC_URI', 'URI must be VC_URI');
        assert.equal(metadataData.data.data.creators.length, 1, 'Creators length must be 1');
        assert.equal(metadataData.data.data.creators[0].address, vault.toBase58(), 'Creators must be vault');
        assert.equal(metadataData.data.data.creators[0].verified, true, 'Creators must be verified');
        assert.equal(metadataData.data.data.creators[0].share, 100, 'Creators must be 100 share');
        assert.equal(metadataData.data.updateAuthority, vault.toBase58(), 'Update Authority must be vault');
        assert.equal(metadataData.pubkey.toBase58(), metadata.toBase58(), 'Metadata pubkey must be equal to metadata');
        assert.equal(metadataData.data.mint, mint.publicKey.toBase58(), 'Mint must be mint public key');

        const vaultTokenAccount = await token.getAssociatedTokenAddress(mint.publicKey, vault, true);
        const tokenAccount = await token.getAccount(fixture.connection, vaultTokenAccount);
        assert.equal(tokenAccount.amount, 1, 'Amount must be 1');
    });
});
