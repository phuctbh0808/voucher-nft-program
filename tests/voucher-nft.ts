import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { VoucherNft } from '../target/types/voucher_nft';
import * as assert from 'assert';
import { VoucherNftFixture, VoucherNftFixtureBuilder } from '../sdk/src/voucher-nft-fixture';
import { NetworkType } from '../sdk/src/types';

describe('voucher-nft', () => {
    let fixture: VoucherNftFixture;

    before(async () => {
        const fixtureBuilder = new VoucherNftFixtureBuilder().withNetwork(NetworkType.LocalNet);
        fixture = await fixtureBuilder.build();
    });

    it('Is initialized!', async () => {
        const { key: config } = fixture.pda.config();
        const tx = await fixture.initialize();
        console.log('Initialize success at ', tx);

        const configData = await fixture.getConfigData();
        assert.equal(
            configData.admin.toBase58(),
            fixture.provider.publicKey.toBase58(),
            'expect admin to be provider.publicKey'
        );
    });
});
