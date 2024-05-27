import {
    CreateMasterEditionV3,
    CreateMetadataV2,
    Creator,
    DataV2,
    MasterEdition,
    Metadata,
} from '@renec-foundation/mpl-token-metadata';
import * as anchor from '@project-serum/anchor';
import * as token from '@solana/spl-token';
import { Keypair, PublicKey } from '@solana/web3.js';
import { mintTo } from '@solana/spl-token';

export async function createNftMint(provider: anchor.AnchorProvider, mint: Keypair, operator: Keypair) {
    await token.createMint(provider.connection, operator, operator.publicKey, operator.publicKey, 0, mint);

    const operatorTokenAccount = await token.getOrCreateAssociatedTokenAccount(
        provider.connection,
        operator,
        mint.publicKey,
        operator.publicKey,
        false,
        'confirmed'
    );

    await mintTo(provider.connection, operator, mint.publicKey, operatorTokenAccount.address, operator, 1);
}

export async function createMetadataV2(
    provider: anchor.AnchorProvider,
    mint: Keypair,
    operator: Keypair,
    creator?: PublicKey
) {
    const metadata = await Metadata.getPDA(mint.publicKey);
    let creators = null;
    if (creator) {
        if (creator.equals(operator.publicKey)) {
            creators = [new Creator({ address: operator.publicKey.toBase58(), verified: true, share: 100 })];
        } else {
            creators = [
                new Creator({ address: operator.publicKey.toBase58(), verified: true, share: 0 }),
                new Creator({ address: creator.toBase58(), verified: false, share: 100 }),
            ];
        }
    }
    const metadataData = new DataV2({
        uri: 'URI',
        name: 'NAME',
        symbol: 'SB',
        sellerFeeBasisPoints: 0,
        creators: creators,
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

export async function createMasterEdition(provider: anchor.AnchorProvider, mint: Keypair, operator: Keypair) {
    const metadata = await Metadata.getPDA(mint.publicKey);
    const edition = await MasterEdition.getPDA(mint.publicKey);
    const tx = new CreateMasterEditionV3(
        { feePayer: provider.publicKey },
        {
            metadata,
            edition,
            mint: mint.publicKey,
            mintAuthority: operator.publicKey,
            updateAuthority: operator.publicKey,
            maxSupply: 0,
        }
    );
    try {
        return await provider.sendAndConfirm(tx, [operator]);
    } catch (error) {
        console.error(error);
        throw error;
    }
}
