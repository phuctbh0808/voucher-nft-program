import * as anchor from '@project-serum/anchor';
import * as token from '@solana/spl-token';
import { Program } from '@project-serum/anchor';
import { configurations, MetadataParams, NetworkType, VoucherNftIDL, VoucherNftType } from './types';
import { getKeypairFromFile } from '@solana-developers/helpers';
import { PDA } from './pda';
import { addVaultIx, mintVoucherIx, modifyComputeUnitIx } from './instructions';
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

    async initialize(): Promise<string> {
        const { key: config } = this.pda.config();
        try {
            return await this.program.methods
                .initialize()
                .accounts({
                    config,
                    admin: this.provider.publicKey,
                })
                .rpc();
        } catch (error) {
            this.verbose && console.error(error);
            throw error;
        }
    }

    async addVault(seed: string, operator: PublicKey): Promise<string> {
        try {
            const { key: config } = this.pda.config();
            const { key: vault, bump } = this.pda.vault(seed);
            const addVaultIns = await addVaultIx(this.program, {
                admin: this.provider.publicKey,
                config,
                operator: operator,
                seed: seed,
                vault: vault,
                bump,
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
            const { key: metadataAccount } = await this.pda.metadata(mint.publicKey);
            const { key: masterEdition } = await this.pda.masterEdition(mint.publicKey);
            const { key: vault } = this.pda.vault(seed);
            const vaultTokenAccount = await token.getAssociatedTokenAddress(mint.publicKey, vault, true);
            const modifyUnitIns = modifyComputeUnitIx();
            const mintVoucherIns = await mintVoucherIx(this.program, {
                operator: operator.publicKey,
                seed,
                tokenMetadataProgram: Constants.TOKEN_METADATA_PROGRAM,
                vaultTokenAccount,
                metadataAccount,
                masterEdition,
                vault: vault,
                mint,
                params,
            });
            const transaction = new anchor.web3.Transaction().add(modifyUnitIns, mintVoucherIns);
            return await this.provider.sendAndConfirm(transaction, [operator, mint]);
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

    async getVaultData(seed: string) {
        const { key: vault } = this.pda.vault(seed);
        try {
            return await this.program.account.vault.fetch(vault);
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
