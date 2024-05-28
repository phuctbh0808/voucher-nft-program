import { program } from 'commander';
import { VoucherNftFixtureBuilder } from '../sdk/src/voucher-nft-fixture';
import { convertStringToNetworkType } from '../sdk/src/utils';
import { PublicKey } from '@solana/web3.js';
import fs from 'fs';
import { RepayVoucherInformation } from './types';

async function buildFixture(network: string, source: string, program_id?: string) {
    const networkType = convertStringToNetworkType(network);
    let builder = new VoucherNftFixtureBuilder().withNetwork(networkType).withKeypair(source).withVerbose(true);

    if (program_id) builder = builder.withProgramId(program_id);
    return await builder.build();
}

program
    .command('initialize')
    .description('Fetch all vault data in the program')
    .requiredOption('--network <string>', 'Network type: mainnet, testnet, localnet')
    .requiredOption('--source <string>', 'Keypair path of the admin')
    .option('--program_id <string>', 'ProgramId if needed')
    .action(async (params) => {
        console.log('Params', params);
        let { network, source, program_id } = params;
        const fixture = await buildFixture(network, source, program_id);
        const tx = await fixture.initialize();
        console.log('Initialize program success at tx', tx);
    });

program
    .command('add-vault')
    .description('Add a vault to the program')
    .requiredOption('--network <string>', 'Network type: mainnet, testnet, localnet')
    .requiredOption('--source <string>', 'Keypair path of the admin')
    .option('--program_id <string>', 'ProgramId if needed')
    .requiredOption('--seed <string>', 'Seed of the vault')
    .requiredOption('--operator_address <string>', 'Address of the operator of the vault')
    .action(async (params) => {
        console.log('Params', params);
        let { network, source, program_id, seed, operator_address } = params;
        const fixture = await buildFixture(network, source, program_id);
        const operatorAddress = new PublicKey(operator_address);
        const tx = await fixture.addVault(seed, operatorAddress);
        console.log('Add vault success at tx', tx);
    })
program
    .command('mint-repay-voucher')
    .description('Mint repay voucher')
    .requiredOption('--network <string>', 'Network type: mainnet, testnet, localnet')
    .requiredOption('--source <string>', 'Keypair path of the operator')
    .option('--program_id <string>', 'ProgramId if needed')
    .requiredOption('--seed <string>', 'Seed of the vault')
    .requiredOption('--metadata <string>', 'Json path of the repay voucher')
    .action(async (params) => {
        console.log('Params', params);
        let { network, source, program_id, seed, operator_address, metadata } = params;
        const fixture = await buildFixture(network, source, program_id);
        const jsonData = JSON.parse(fs.readFileSync(metadata, 'utf-8')) as RepayVoucherInformation;
        console.log(jsonData);
        console.log("JSON data ", jsonData);
    })
program
    .command('fetch-vault')
    .description('Fetch all vault data in the program')
    .requiredOption('--network <string>', 'Network type: mainnet, testnet, localnet')
    .requiredOption('--source <string>', 'Keypair path')
    .option('--program_id <string>', 'ProgramId if needed')
    .action(async (params) => {
        console.log('Params', params);
        let { network, source, program_id } = params;
        const fixture = await buildFixture(network, source, program_id);
        const vaults = await fixture.program.account.vault.all();
        console.log('Vault is:');
        console.log(vaults);
    });

program.parse();
