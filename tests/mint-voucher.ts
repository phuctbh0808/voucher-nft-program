import * as anchor from '@project-serum/anchor';
import * as token from '@solana/spl-token';
import * as assert from 'assert';
import { VoucherNftFixture, VoucherNftFixtureBuilder } from '../sdk/src/voucher-nft-fixture';
import { SendTransactionError } from '@solana/web3.js';
import { NetworkType } from '../sdk/src/types';
import { airdrop } from '../sdk/src/utils';

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
        const tx = await fixture.mintVoucher(vaultSeed, operator, mint);
        console.log('Add mint success at tx', tx);

        const { key: vault } = fixture.pda.vault(vaultSeed);

        const mintData = await token.getMint(fixture.connection, mint.publicKey);
        assert.equal(mintData.decimals, 0, 'Decimal must be zero');
        assert.equal(mintData.mintAuthority.toBase58(), vault.toBase58(), 'Mint Authority must be vault');
        assert.equal(mintData.freezeAuthority.toBase58(), vault.toBase58(), 'Freeze Authority must be vault');
        assert.equal(mintData.isInitialized, true, 'Mint must be initialized');
        assert.equal(Number(mintData.supply), 0, 'Supply must be zero');
    });
});
