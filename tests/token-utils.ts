import { CreateMetadataV2, DataV2, Metadata } from '@renec-foundation/mpl-token-metadata';
import * as anchor from '@project-serum/anchor';
import * as token from '@solana/spl-token';
import { Keypair, PublicKey } from '@solana/web3.js';

export async function createTokenMint(provider: anchor.AnchorProvider, mint: Keypair, operator: Keypair) {
    await token.createMint(provider.connection, operator, operator.publicKey, operator.publicKey, 9, mint);
}

export async function createMetadataV2(provider: anchor.AnchorProvider, mint: Keypair, operator: Keypair) {
    const metadata = await Metadata.getPDA(mint.publicKey);
    const metadataData = new DataV2({
        uri: 'URI',
        name: 'NAME',
        symbol: 'SB',
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
    });
    const tx = new CreateMetadataV2(
        { feePayer: provider.publicKey },
        {
            metadata,
            metadataData: metadataData,
            mint: mint.publicKey,
            mintAuthority: operator.publicKey,
            updateAuthority: operator.publicKey,
        }
    );
    try {
        return await provider.sendAndConfirm(tx, [operator]);
    } catch (error) {
        console.error(error);
        throw error;
    }
}
