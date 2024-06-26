import * as anchor from '@project-serum/anchor';
import * as token from '@solana/spl-token';
import { Program } from '@project-serum/anchor';
import {
    configurations,
    MetadataParams,
    NetworkType,
    RepayVoucherInformationParams,
    VoucherNftIDL,
    VoucherNftType,
} from './types';
import { getKeypairFromFile } from '@solana-developers/helpers';
import { PDA } from './pda';
import { addRepayVoucherIx, addVaultIx, airdropToUserIx, mintVoucherIx, modifyComputeUnitIx } from './instructions';
import { Keypair, PublicKey } from '@solana/web3.js';
import { Constants } from './constants';

export class VoucherNftFixture {
    public readonly program: Program<VoucherNftType>;
    public readonly connection: anchor.web3.Connection;
    public readonly provider: anchor.AnchorProvider;
    public readonly programId: anchor.web3.PublicKey;
    public readonly pda: PDA;
    private readonly verbose: boolean;

    constructor(keypair: anchor.web3.Keypair, connectionUrl: string, programId: string, verbose = false) {
        this.connection = new anchor.web3.Connection(connectionUrl, { commitment: 'confirmed' });
        this.provider = new anchor.AnchorProvider(this.connection, new anchor.Wallet(keypair), {
            commitment: 'confirmed',
        });
        this.programId = new anchor.web3.PublicKey(programId);
        this.pda = new PDA(this.programId);
        this.program = new anchor.Program(VoucherNftIDL, this.programId, this.provider) as Program<VoucherNftType>;
        this.verbose = verbose;
    }

    async initialize(relendMint: Keypair, collectionParams: MetadataParams): Promise<string> {
        const { key: config } = this.pda.config();
        const { key: authorator } = this.pda.authorator();
        const { key: metadata } = await this.pda.metadata(relendMint.publicKey);
        const { key: masterEdition } = await this.pda.masterEdition(relendMint.publicKey);
        const authoratorTokenAccount = await token.getAssociatedTokenAddress(relendMint.publicKey, authorator, true);
        try {
            return await this.program.methods
                .initialize(collectionParams)
                .accounts({
                    config,
                    authorator,
                    admin: this.provider.publicKey,
                    relendCollection: relendMint.publicKey,
                    metadataAccount: metadata,
                    authoratorTokenAccount,
                    masterEdition,
                    tokenMetadataProgram: Constants.TOKEN_METADATA_PROGRAM,
                })
                .signers([relendMint])
                .rpc();
        } catch (error) {
            this.verbose && console.error(error);
            throw error;
        }
    }

    async addVault(seed: string, operator: PublicKey): Promise<string> {
        try {
            const { key: config } = this.pda.config();
            const { key: vault } = this.pda.vault(seed);
            const addVaultIns = await addVaultIx(this.program, {
                admin: this.provider.publicKey,
                config,
                operator: operator,
                seed: seed,
                vault: vault,
            });

            const transaction = new anchor.web3.Transaction().add(addVaultIns);
            return await this.provider.sendAndConfirm(transaction);
        } catch (error) {
            this.verbose && console.error(error);
            throw error;
        }
    }

    async mintVoucher(seed: string, operator: Keypair, mint: Keypair, params: MetadataParams): Promise<string> {
        try {
            const { collection: collectionMint } = await this.getConfigData();
            const { key: collectionMetadata } = await this.pda.metadata(collectionMint);
            const { key: collectionMasterEdition } = await this.pda.masterEdition(collectionMint);
            const { key: metadataAccount } = await this.pda.metadata(mint.publicKey);
            const { key: masterEdition } = await this.pda.masterEdition(mint.publicKey);
            const { key: authorator } = this.pda.authorator();
            const { key: vault } = this.pda.vault(seed);
            const { key: config } = this.pda.config();
            const vaultTokenAccount = await token.getAssociatedTokenAddress(mint.publicKey, vault, true);
            const modifyUnitIns = modifyComputeUnitIx();
            const mintVoucherIns = await mintVoucherIx(this.program, {
                config,
                operator: operator.publicKey,
                authorator,
                tokenMetadataProgram: Constants.TOKEN_METADATA_PROGRAM,
                vaultTokenAccount,
                metadataAccount,
                masterEdition,
                vault: vault,
                mint,
                collection: collectionMint,
                collectionMetadata,
                collectionMasterEdition,
                params,
            });
            const transaction = new anchor.web3.Transaction().add(modifyUnitIns, mintVoucherIns);
            return await this.provider.sendAndConfirm(transaction, [operator, mint]);
        } catch (error) {
            this.verbose && console.error(error);
            throw error;
        }
    }

    async mintVoucherRepay(
        seed: string,
        operator: Keypair,
        mint: Keypair,
        metadataParams: MetadataParams,
        repayVoucherInformationParams: RepayVoucherInformationParams
    ): Promise<string> {
        try {
            const { collection: collectionMint } = await this.getConfigData();
            const { key: collectionMetadata } = await this.pda.metadata(collectionMint);
            const { key: collectionMasterEdition } = await this.pda.masterEdition(collectionMint);
            const { key: metadataAccount } = await this.pda.metadata(mint.publicKey);
            const { key: masterEdition } = await this.pda.masterEdition(mint.publicKey);
            const { key: authorator } = this.pda.authorator();
            const { key: vault } = this.pda.vault(seed);
            const { key: config } = this.pda.config();
            const { key: repayVoucher } = this.pda.repayVoucher(mint.publicKey);
            const vaultTokenAccount = await token.getAssociatedTokenAddress(mint.publicKey, vault, true);
            const modifyUnitIns = modifyComputeUnitIx();
            const mintVoucherIns = await mintVoucherIx(this.program, {
                config,
                operator: operator.publicKey,
                authorator,
                tokenMetadataProgram: Constants.TOKEN_METADATA_PROGRAM,
                vaultTokenAccount,
                metadataAccount,
                masterEdition,
                vault,
                mint,
                collection: collectionMint,
                collectionMetadata,
                collectionMasterEdition,
                params: metadataParams,
            });
            const addRepayVoucherIns = await addRepayVoucherIx(this.program, {
                authorator,
                masterEdition,
                metadataAccount,
                mint,
                operator: operator.publicKey,
                tokenMetadataProgram: Constants.TOKEN_METADATA_PROGRAM,
                vault,
                repayVoucher,
                params: repayVoucherInformationParams,
            });
            const transaction = new anchor.web3.Transaction().add(modifyUnitIns, mintVoucherIns, addRepayVoucherIns);
            return await this.provider.sendAndConfirm(transaction, [operator, mint]);
        } catch (error) {
            this.verbose && console.error(error);
            throw error;
        }
    }

    async operatorAirdrop(seed: string, operator: Keypair, mint: PublicKey, user: PublicKey) {
        try {
            const { key: vault } = this.pda.vault(seed);
            const { key: masterEdition } = await this.pda.masterEdition(mint);
            const userTokenAccount = await token.getAssociatedTokenAddress(mint, user, false);
            const vaultTokenAccount = await token.getAssociatedTokenAddress(mint, vault, true);
            const operatorAirdropIns = await airdropToUserIx(this.program, {
                mint: mint,
                masterEdition,
                operator: operator.publicKey,
                user,
                userTokenAccount: userTokenAccount,
                vault: vault,
                vaultTokenAccount: vaultTokenAccount,
            });
            const transaction = new anchor.web3.Transaction().add(operatorAirdropIns);
            return await this.provider.sendAndConfirm(transaction, [operator]);
        } catch (error) {
            this.verbose && console.error(error);
            throw error;
        }
    }

    async getConfigData() {
        const { key: config } = this.pda.config();
        try {
            return await this.program.account.config.fetch(config);
        } catch (error) {
            this.verbose && console.error(error);
            throw error;
        }
    }

    async getAuthoratorData() {
        const { key: authorator } = this.pda.authorator();
        try {
            return await this.program.account.authorator.fetch(authorator);
        } catch (error) {
            this.verbose && console.error(error);
            throw error;
        }
    }

    async getVaultData(seed: string) {
        const { key: vault } = this.pda.vault(seed);
        try {
            return await this.program.account.vault.fetch(vault);
        } catch (error) {
            this.verbose && console.error(error);
            throw error;
        }
    }

    async getRepayVoucherData(mint: PublicKey) {
        const { key: repayVoucher } = this.pda.repayVoucher(mint);
        try {
            return await this.program.account.repayVoucher.fetch(repayVoucher);
        } catch (error) {
            this.verbose && console.error(error);
            throw error;
        }
    }
}

export class VoucherNftFixtureBuilder {
    private keypairPath: string;
    private programId: string;
    private networkType: NetworkType;
    private verbose: boolean;

    withNetwork(network: NetworkType) {
        this.networkType = network;
        return this;
    }

    withKeypair(keypairPath: string) {
        this.keypairPath = keypairPath;
        return this;
    }
    withProgramId(programId: string) {
        this.programId = programId;
        return this;
    }

    withVerbose(verbose: boolean) {
        this.verbose = verbose;
        return this;
    }

    async build(): Promise<VoucherNftFixture> {
        const keypair = await getKeypairFromFile(this.keypairPath || configurations.get(this.networkType).keypairPath);
        const connectionUrl = configurations.get(this.networkType).url;
        const programId = this.programId || configurations.get(this.networkType).programId;
        return new VoucherNftFixture(keypair, connectionUrl, programId, this.verbose);
    }
}
