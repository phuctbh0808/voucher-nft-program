import * as anchor from '@project-serum/anchor';
import * as token from '@solana/spl-token';
import * as assert from 'assert';
import { VoucherNftFixture, VoucherNftFixtureBuilder } from '../sdk/src/voucher-nft-fixture';
import { MetadataParams, NetworkType, RepayVoucherInformationParams } from '../sdk/src/types';
import { airdrop } from '../sdk/src/utils';
import { Metadata } from '@renec-foundation/mpl-token-metadata';
import { SendTransactionError } from '@solana/web3.js';
import { addRepayVoucherIx, mintVoucherIx, modifyComputeUnitIx } from '../sdk/src/instructions';
import { Constants } from '../sdk/src/constants';
import { createMasterEdition, createMetadataV2, createNftMint } from './token-utils';
import { BN } from '@project-serum/anchor';

describe('mint-repay-voucher', () => {
    let fixture: VoucherNftFixture;
    let operator: anchor.web3.Keypair;
    let vaultSeed: string;
    let metadataParams: MetadataParams;
    let repayVoucherInformationParams: RepayVoucherInformationParams;

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
        repayVoucherInformationParams = {
            discountPercentage: 100,
            endTime: new BN(2000),
            maximumAmount: 1000,
            startTime: new BN(1000),
        };
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

    it('Mint repay voucher success', async () => {
        const mint = anchor.web3.Keypair.generate();
        const { key: vault } = fixture.pda.vault(vaultSeed);
        const { key: metadata } = await fixture.pda.metadata(mint.publicKey);
        const { key: masterEdition } = await fixture.pda.masterEdition(mint.publicKey);
        const { key: authority } = await fixture.pda.authorator();
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

        assert.equal(metadataData.data.data.creators[1].address, authority.toBase58(), 'Creators 1 must be vault');
        assert.equal(metadataData.data.data.creators[1].verified, true, 'Creators 1 must be verified');
        assert.equal(metadataData.data.data.creators[1].share, 100, 'Creators 1 must be 100 share');

        const vaultTokenAccount = await token.getAssociatedTokenAddress(mint.publicKey, vault, true);
        const tokenAccount = await token.getAccount(fixture.connection, vaultTokenAccount);
        assert.equal(tokenAccount.amount, 1, 'Amount must be 1');
    });

    it('FAILED InvalidAccountArgument: MetadataAccount is not incorrect', async () => {
        const fakeMetadata = anchor.web3.Keypair.generate().publicKey;
        const mint = anchor.web3.Keypair.generate();
        const { key: vault } = fixture.pda.vault(vaultSeed);
        const { key: repayVoucher } = fixture.pda.repayVoucher(mint.publicKey);
        const { key: metadata } = await fixture.pda.metadata(mint.publicKey);
        const { key: masterEdition } = await fixture.pda.masterEdition(mint.publicKey);
        const { key: authorator } = await fixture.pda.authorator();
        const vaultTokenAccount = await token.getAssociatedTokenAddress(mint.publicKey, vault, true);
        const modifyComputationUnit = modifyComputeUnitIx();
        const mintVoucherIns = await mintVoucherIx(fixture.program, {
            authorator,
            masterEdition,
            metadataAccount: metadata,
            mint,
            operator: operator.publicKey,
            params: metadataParams,
            seed: vaultSeed,
            tokenMetadataProgram: Constants.TOKEN_METADATA_PROGRAM,
            vault,
            vaultTokenAccount: vaultTokenAccount,
        });
        const addRepayVoucherIns = await addRepayVoucherIx(fixture.program, {
            authorator,
            masterEdition,
            metadataAccount: fakeMetadata,
            mint,
            operator: operator.publicKey,
            tokenMetadataProgram: Constants.TOKEN_METADATA_PROGRAM,
            vault,
            repayVoucher,
            params: repayVoucherInformationParams,
        });
        const transaction = new anchor.web3.Transaction().add(
            modifyComputationUnit,
            mintVoucherIns,
            addRepayVoucherIns
        );
        try {
            await fixture.provider.sendAndConfirm(transaction, [operator, mint]);
            assert.fail('Perform minting repay voucher should fail');
        } catch (error) {
            assert.ok(error instanceof SendTransactionError);
            assert.ok(error.logs.every((log) => !log.includes('Check metadata success')));
            assert.ok(error.logs.some((log) => log.includes('Custom program error: 0x1772')));
        }
    });

    it('FAILED AccountNotInitialized: MetadataAccount is not initialized', async () => {
        const mint = anchor.web3.Keypair.generate();
        await createNftMint(fixture.provider, mint, operator);
        const { key: vault } = fixture.pda.vault(vaultSeed);
        const { key: repayVoucher } = fixture.pda.repayVoucher(mint.publicKey);
        const { key: metadata } = await fixture.pda.metadata(mint.publicKey);
        const { key: masterEdition } = await fixture.pda.masterEdition(mint.publicKey);
        const { key: authorator } = await fixture.pda.authorator();
        const modifyComputationUnit = modifyComputeUnitIx();
        const addRepayVoucherIns = await addRepayVoucherIx(fixture.program, {
            authorator,
            masterEdition,
            metadataAccount: metadata,
            mint,
            operator: operator.publicKey,
            tokenMetadataProgram: Constants.TOKEN_METADATA_PROGRAM,
            vault,
            repayVoucher,
            params: repayVoucherInformationParams,
        });
        const transaction = new anchor.web3.Transaction().add(modifyComputationUnit, addRepayVoucherIns);
        try {
            await fixture.provider.sendAndConfirm(transaction, [operator]);
            assert.fail('Perform minting repay voucher should fail');
        } catch (error) {
            assert.ok(error instanceof SendTransactionError);
            assert.ok(error.logs.every((log) => !log.includes('Check metadata success')));
            assert.ok(error.logs.some((log) => log.includes('Custom program error: 0x1773')));
        }
    });

    it('FAILED InvalidAccountArgument: MasterEdition is not incorrect', async () => {
        const fakeMasterEdition = anchor.web3.Keypair.generate().publicKey;
        const mint = anchor.web3.Keypair.generate();
        const { key: vault } = fixture.pda.vault(vaultSeed);
        const { key: repayVoucher } = fixture.pda.repayVoucher(mint.publicKey);
        const { key: metadata } = await fixture.pda.metadata(mint.publicKey);
        const { key: masterEdition } = await fixture.pda.masterEdition(mint.publicKey);
        const { key: authorator } = await fixture.pda.authorator();
        const vaultTokenAccount = await token.getAssociatedTokenAddress(mint.publicKey, vault, true);
        const modifyComputationUnit = modifyComputeUnitIx();
        const mintVoucherIns = await mintVoucherIx(fixture.program, {
            authorator,
            masterEdition,
            metadataAccount: metadata,
            mint,
            operator: operator.publicKey,
            params: metadataParams,
            seed: vaultSeed,
            tokenMetadataProgram: Constants.TOKEN_METADATA_PROGRAM,
            vault,
            vaultTokenAccount: vaultTokenAccount,
        });
        const addRepayVoucherIns = await addRepayVoucherIx(fixture.program, {
            authorator,
            masterEdition: fakeMasterEdition,
            metadataAccount: metadata,
            mint,
            operator: operator.publicKey,
            tokenMetadataProgram: Constants.TOKEN_METADATA_PROGRAM,
            vault,
            repayVoucher,
            params: repayVoucherInformationParams,
        });
        const transaction = new anchor.web3.Transaction().add(
            modifyComputationUnit,
            mintVoucherIns,
            addRepayVoucherIns
        );
        try {
            await fixture.provider.sendAndConfirm(transaction, [operator, mint]);
            assert.fail('Perform minting repay voucher should fail');
        } catch (error) {
            assert.ok(error.logs.every((log) => !log.includes('Check master edition success')));
            assert.ok(error instanceof SendTransactionError);
            assert.ok(error.logs.some((log) => log.includes('Custom program error: 0x1772')));
        }
    });

    it('FAILED AccountNotInitialized: MasterEdition is not initialized', async () => {
        const mint = anchor.web3.Keypair.generate();
        await createNftMint(fixture.provider, mint, operator);
        await createMetadataV2(fixture.provider, mint, operator);

        const { key: vault } = fixture.pda.vault(vaultSeed);
        const { key: repayVoucher } = fixture.pda.repayVoucher(mint.publicKey);
        const { key: metadata } = await fixture.pda.metadata(mint.publicKey);
        const { key: masterEdition } = await fixture.pda.masterEdition(mint.publicKey);
        const { key: authorator } = await fixture.pda.authorator();
        const modifyComputationUnit = modifyComputeUnitIx();
        const addRepayVoucherIns = await addRepayVoucherIx(fixture.program, {
            authorator,
            masterEdition,
            metadataAccount: metadata,
            mint,
            operator: operator.publicKey,
            tokenMetadataProgram: Constants.TOKEN_METADATA_PROGRAM,
            vault,
            repayVoucher,
            params: repayVoucherInformationParams,
        });
        const transaction = new anchor.web3.Transaction().add(modifyComputationUnit, addRepayVoucherIns);
        try {
            await fixture.provider.sendAndConfirm(transaction, [operator]);
            assert.fail('Perform minting repay voucher should fail');
        } catch (error) {
            assert.ok(error instanceof SendTransactionError);
            assert.ok(error.logs.every((log) => !log.includes('Check master edition success')));
            assert.ok(error.logs.some((log) => log.includes('Custom program error: 0x1773')));
        }
    });

    it('FAILED AuthoratorNotSigned: Creators is empty', async () => {
        const mint = anchor.web3.Keypair.generate();
        await createNftMint(fixture.provider, mint, operator);
        await createMetadataV2(fixture.provider, mint, operator);
        await createMasterEdition(fixture.provider, mint, operator);

        const { key: vault } = fixture.pda.vault(vaultSeed);
        const { key: repayVoucher } = fixture.pda.repayVoucher(mint.publicKey);
        const { key: metadata } = await fixture.pda.metadata(mint.publicKey);
        const { key: masterEdition } = await fixture.pda.masterEdition(mint.publicKey);
        const { key: authorator } = await fixture.pda.authorator();
        const modifyComputationUnit = modifyComputeUnitIx();
        const addRepayVoucherIns = await addRepayVoucherIx(fixture.program, {
            authorator,
            masterEdition,
            metadataAccount: metadata,
            mint,
            operator: operator.publicKey,
            tokenMetadataProgram: Constants.TOKEN_METADATA_PROGRAM,
            vault,
            repayVoucher,
            params: repayVoucherInformationParams,
        });
        const transaction = new anchor.web3.Transaction().add(modifyComputationUnit, addRepayVoucherIns);
        try {
            await fixture.provider.sendAndConfirm(transaction, [operator]);
            assert.fail('Perform minting repay voucher should fail');
        } catch (error) {
            assert.ok(error instanceof SendTransactionError);
            assert.ok(error.logs.some((log) => log.includes('Creators is empty')));
            assert.ok(error.logs.some((log) => log.includes('Custom program error: 0x1774')));
        }
    });

    it('FAILED AuthoratorNotSigned: Authorator not found', async () => {
        const mint = anchor.web3.Keypair.generate();
        await createNftMint(fixture.provider, mint, operator);
        await createMetadataV2(fixture.provider, mint, operator, operator.publicKey);
        await createMasterEdition(fixture.provider, mint, operator);

        const { key: vault } = fixture.pda.vault(vaultSeed);
        const { key: metadata } = await fixture.pda.metadata(mint.publicKey);
        const { key: repayVoucher } = fixture.pda.repayVoucher(mint.publicKey);
        const { key: masterEdition } = await fixture.pda.masterEdition(mint.publicKey);
        const { key: authorator } = await fixture.pda.authorator();
        const modifyComputationUnit = modifyComputeUnitIx();
        const addRepayVoucherIns = await addRepayVoucherIx(fixture.program, {
            authorator,
            masterEdition,
            metadataAccount: metadata,
            mint,
            operator: operator.publicKey,
            tokenMetadataProgram: Constants.TOKEN_METADATA_PROGRAM,
            vault,
            repayVoucher,
            params: repayVoucherInformationParams,
        });
        const transaction = new anchor.web3.Transaction().add(modifyComputationUnit, addRepayVoucherIns);
        try {
            await fixture.provider.sendAndConfirm(transaction, [operator]);
            assert.fail('Perform minting repay voucher should fail');
        } catch (error) {
            assert.ok(error instanceof SendTransactionError);
            assert.ok(error.logs.some((log) => log.includes('Authorator not found')));
            assert.ok(error.logs.some((log) => log.includes('Custom program error: 0x1774')));
        }
    });

    it('FAILED AuthoratorNotSigned: Authorator not verified', async () => {
        const { key: authorator } = await fixture.pda.authorator();
        const mint = anchor.web3.Keypair.generate();
        await createNftMint(fixture.provider, mint, operator);
        await createMetadataV2(fixture.provider, mint, operator, authorator);
        await createMasterEdition(fixture.provider, mint, operator);

        const { key: vault } = fixture.pda.vault(vaultSeed);
        const { key: repayVoucher } = fixture.pda.repayVoucher(mint.publicKey);
        const { key: metadata } = await fixture.pda.metadata(mint.publicKey);
        const { key: masterEdition } = await fixture.pda.masterEdition(mint.publicKey);
        const modifyComputationUnit = modifyComputeUnitIx();
        const addRepayVoucherIns = await addRepayVoucherIx(fixture.program, {
            authorator,
            masterEdition,
            metadataAccount: metadata,
            mint,
            operator: operator.publicKey,
            tokenMetadataProgram: Constants.TOKEN_METADATA_PROGRAM,
            vault,
            repayVoucher,
            params: repayVoucherInformationParams,
        });
        const transaction = new anchor.web3.Transaction().add(modifyComputationUnit, addRepayVoucherIns);
        try {
            await fixture.provider.sendAndConfirm(transaction, [operator]);
            assert.fail('Perform minting repay voucher should fail');
        } catch (error) {
            assert.ok(error instanceof SendTransactionError);
            assert.ok(error.logs.some((log) => log.includes('Authorator not verified')));
            assert.ok(error.logs.some((log) => log.includes('Custom program error: 0x1774')));
        }
    });
});
