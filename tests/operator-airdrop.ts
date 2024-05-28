import * as anchor from '@project-serum/anchor';
import * as token from '@solana/spl-token';
import * as assert from 'assert';
import { VoucherNftFixture, VoucherNftFixtureBuilder } from '../sdk/src/voucher-nft-fixture';
import { MetadataParams, NetworkType, RepayVoucherInformationParams } from '../sdk/src/types';
import { airdrop, getCurrentBlockTime } from '../sdk/src/utils';
import { Metadata } from '@renec-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

describe('operator-airdrop', () => {
    let fixture: VoucherNftFixture;
    let operator: anchor.web3.Keypair;
    let vaultSeed: string;
    let metadataParams: MetadataParams;
    let mint: anchor.web3.Keypair;

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
        await airdrop(fixture.provider.connection, operator.publicKey, 100);
        mint = Keypair.generate();
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

    it('Mint repay voucher success', async () => {
        const { key: vault } = fixture.pda.vault(vaultSeed);
        const { key: metadata } = await fixture.pda.metadata(mint.publicKey);
        const { key: masterEdition } = await fixture.pda.masterEdition(mint.publicKey);
        const { key: authorator } = await fixture.pda.authorator();
        const repayVoucherInformationParams = await createRepayVoucherInformationParams();
        const tx = await fixture.mintVoucherRepay(
            vaultSeed,
            operator,
            mint,
            metadataParams,
            repayVoucherInformationParams
        );
        console.log('Mint repay voucher success at tx', tx);

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

        assert.equal(metadataData.data.data.creators[1].address, authorator.toBase58(), 'Creators 1 must be vault');
        assert.equal(metadataData.data.data.creators[1].verified, true, 'Creators 1 must be verified');
        assert.equal(metadataData.data.data.creators[1].share, 100, 'Creators 1 must be 100 share');

        const vaultTokenAccount = await token.getAssociatedTokenAddress(mint.publicKey, vault, true);
        const tokenAccount = await token.getAccount(fixture.connection, vaultTokenAccount);
        assert.equal(tokenAccount.amount, 1, 'Amount must be 1');

        const repayVoucherData = await fixture.getRepayVoucherData(mint.publicKey);
        assert.equal(
            repayVoucherData.startTime.toString(),
            repayVoucherInformationParams.startTime.toString(),
            'Repay voucher startTime mismatch'
        );
        assert.equal(
            repayVoucherData.endTime.toString(),
            repayVoucherInformationParams.endTime.toString(),
            'Repay voucher endTime mismatch'
        );
        assert.equal(
            repayVoucherData.discountPercentage,
            repayVoucherInformationParams.discountPercentage,
            'Repay voucher discountPercentage mismatch'
        );
        assert.equal(
            repayVoucherData.maximumAmount,
            repayVoucherInformationParams.maximumAmount,
            'Repay voucher maximumAmount mismatch'
        );
        assert.equal(
            repayVoucherData.authorator.toBase58(),
            authorator.toBase58(),
            'Repay voucher authorator mismatch'
        );
        assert.equal(repayVoucherData.nftMint.toBase58(), mint.publicKey.toBase58(), 'Repay voucher mint mismatch');
    });

    it('Airdrop to user success', async () => {
        const { key: vault } = fixture.pda.vault(vaultSeed);
        const user = anchor.web3.Keypair.generate();
        try {
            await fixture.operatorAirdrop(vaultSeed, operator, mint.publicKey, user.publicKey);
        } catch (error) {
            console.log(error);
            throw error;
        }

        const userTokenAccount = await token.getAssociatedTokenAddress(mint.publicKey, user.publicKey, false);
        const userTokenAccountData = await token.getAccount(fixture.connection, userTokenAccount);
        assert.equal(userTokenAccountData.amount, 1, 'Amount must be 1');
        const vaultTokenAccount = await token.getAssociatedTokenAddress(mint.publicKey, vault, true);
        const vaultTokenAccountData = await token.getAccount(fixture.connection, vaultTokenAccount);
        assert.equal(vaultTokenAccountData.amount, 0, 'Amount must be 0');
    });

    async function createRepayVoucherInformationParams(): Promise<RepayVoucherInformationParams> {
        const currentTime = await getCurrentBlockTime(fixture.provider.connection);
        return {
            discountPercentage: 100,
            startTime: new BN(currentTime + 100),
            endTime: new BN(currentTime + 1000),
            maximumAmount: 1000,
        };
    }
});
