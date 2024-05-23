import * as anchor from '@project-serum/anchor';
import { Constants } from './constants';
export interface PDAInfo {
    key: anchor.web3.PublicKey;
    bump: number;
}

export class PDA {
    readonly programId: anchor.web3.PublicKey;

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
}
