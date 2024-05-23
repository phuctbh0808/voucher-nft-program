import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { VoucherNft } from '../target/types/voucher_nft';
import * as assert from 'assert';

describe('voucher-nft', () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.VoucherNft as Program<VoucherNft>;
    const [config] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('CONFIG')], program.programId);

    it('Is initialized!', async () => {
        try {
            const tx = await program.methods
                .initialize()
                .accounts({
                    config: config,
                    admin: provider.publicKey,
                })
                .rpc();
            console.log('Initialize success at ', tx);
        } catch (error) {
            console.error(error);
            throw error;
        }

        // Get the new counter value
        const configData = await program.account.config.fetch(config);
        assert.equal(
            configData.admin.toBase58(),
            provider.publicKey.toBase58(),
            'expect admin to be provider.publicKey'
        );
    });
});
