import * as anchor from '@project-serum/anchor';
import { MasterEdition, Metadata } from '@renec-foundation/mpl-token-metadata';
import { Constants } from './constants';
export interface PDAInfo {
    key: anchor.web3.PublicKey;
    bump: number | null;
}

export class PDA {
    readonly programId: anchor.web3.PublicKey;
    readonly tokenMetadataProgram = new anchor.web3.PublicKey('metaXfaoQatFJP9xiuYRsKkHYgS5NqqcfxFbLGS5LdN');

    public constructor(programId?: anchor.web3.PublicKey) {
        this.programId = programId || Constants.VOUCHER_NFT_PROGRAM_ID_TESTNET;
    }

    config = (): PDAInfo => {
        const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(Constants.CONFIG_SEED)],
            this.programId
        );
        return {
            key: pda,
            bump: bump,
        };
    };

    vault = (seed: string): PDAInfo => {
        const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(Constants.VAULT_SEED), Buffer.from(seed)],
            this.programId
        );
        return {
            key: pda,
            bump,
        };
    };

    metadata = async (mint: anchor.web3.PublicKey): Promise<PDAInfo> => {
        const key = await Metadata.getPDA(mint);
        return {
            key,
            bump: null,
        };
    };

    masterEdition = async (mint: anchor.web3.PublicKey): Promise<PDAInfo> => {
        const key = await MasterEdition.getPDA(mint);
        return {
            key,
            bump: null,
        };
    };
}
