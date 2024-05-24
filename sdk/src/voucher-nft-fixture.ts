import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { configurations, NetworkType, VoucherNftIDL, VoucherNftType } from './types';
import { getKeypairFromFile } from '@solana-developers/helpers';
import { PDA } from './pda';
import { addVaultIx } from './instructions';
import { PublicKey } from '@solana/web3.js';

export class VoucherNftFixture {
    public readonly program: Program<VoucherNftType>;
    public readonly connection: anchor.web3.Connection;
    public readonly provider: anchor.AnchorProvider;
    public readonly programId: anchor.web3.PublicKey;
    public readonly pda: PDA;

    constructor(keypair: anchor.web3.Keypair, connectionUrl: string, programId: string) {
        this.connection = new anchor.web3.Connection(connectionUrl, { commitment: 'confirmed' });
        this.provider = new anchor.AnchorProvider(this.connection, new anchor.Wallet(keypair), {
            commitment: 'confirmed',
        });
        this.programId = new anchor.web3.PublicKey(programId);
        this.pda = new PDA(this.programId);
        this.program = new anchor.Program(VoucherNftIDL, this.programId, this.provider) as Program<VoucherNftType>;
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
            console.error(error);
            throw error;
        }
    }

    async addVault(seed: string, operator: PublicKey): Promise<string> {
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
        try {
            return await this.provider.sendAndConfirm(transaction);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getConfigData() {
        const { key: config } = this.pda.config();
        try {
            return await this.program.account.config.fetch(config);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getVaultData(seed: string) {
        const { key: vault } = this.pda.vault(seed);
        try {
            return await this.program.account.vault.fetch(vault);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

export class VoucherNftFixtureBuilder {
    private keypairPath: string;
    private programId: string;
    private networkType: NetworkType;

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

    async build(): Promise<VoucherNftFixture> {
        const keypair = await getKeypairFromFile(this.keypairPath || configurations.get(this.networkType).keypairPath);
        const connectionUrl = configurations.get(this.networkType).url;
        const programId = this.programId || configurations.get(this.networkType).programId;
        return new VoucherNftFixture(keypair, connectionUrl, programId);
    }
}
