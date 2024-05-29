import { program } from 'commander';
import { VoucherNftFixtureBuilder } from '../sdk/src/voucher-nft-fixture';
import { convertStringToNetworkType, getKeypairFromFile } from '../sdk/src/utils';
import { Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import { RepayVoucherInformation } from './types';
import { BN } from '@project-serum/anchor';

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
    });
program
    .command('mint-repay-voucher')
    .description('Mint repay voucher')
    .requiredOption('--network <string>', 'Network type: mainnet, testnet, localnet')
    .requiredOption('--source <string>', 'Keypair path of the operator')
    .option('--program_id <string>', 'ProgramId if needed')
    .requiredOption('--seed <string>', 'Seed of the vault')
    .requiredOption('--metadata_path <string>', 'Json path of the repay voucher')
    .action(async (params) => {
        console.log('Params', params);
        let { network, source, program_id, seed, metadata_path } = params;
        const operator = await getKeypairFromFile(source);
        const mint = Keypair.generate();
        const fixture = await buildFixture(network, source, program_id);
        const jsonData = JSON.parse(fs.readFileSync(metadata_path, 'utf-8')) as RepayVoucherInformation;
        console.log(jsonData);
        console.log('JSON data ', jsonData);

        const tx = await fixture.mintVoucherRepay(
            seed,
            operator,
            mint,
            { name: jsonData.name, symbol: jsonData.symbol, uri: jsonData.uri },
            {
                discountPercentage: jsonData.discountPercentage,
                endTime: new BN(convertDateStringToUnixTimeSecond(jsonData.endTime)),
                maximumAmount: 30,
                startTime: new BN(convertDateStringToUnixTimeSecond(jsonData.startTime)),
            }
        );

        console.log(`Create repay voucher mint ${mint.publicKey} success at ${tx}`);
    });

program
    .command('airdrop-voucher')
    .description('Airdrop voucher to the user')
    .requiredOption('--network <string>', 'Network type: mainnet, testnet, localnet')
    .requiredOption('--source <string>', 'Keypair path of the operator')
    .option('--program_id <string>', 'ProgramId if needed')
    .requiredOption('--seed <string>', 'Seed of the vault')
    .requiredOption('--mint <string>', 'Address of the user who receives the airdrop')
    .requiredOption('--user <string>', 'Mint address of the nft')
    .action(async (params) => {
        console.log('Params', params);
        let { network, source, program_id, seed, user, mint } = params;
        const operator = await getKeypairFromFile(source);
        const mintAddress = new PublicKey(mint);
        const userAddress = new PublicKey(user);
        const fixture = await buildFixture(network, source, program_id);
        const tx = await fixture.operatorAirdrop(seed, operator, mintAddress, userAddress);

        console.log(`Airdrop mint ${mint} to user ${user} success at ${tx}`);
    });
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

program
    .command('fetch-repay-voucher')
    .description('Fetch all vault data in the program')
    .requiredOption('--network <string>', 'Network type: mainnet, testnet, localnet')
    .requiredOption('--source <string>', 'Keypair path')
    .option('--program_id <string>', 'ProgramId if needed')
    .action(async (params) => {
        console.log('Params', params);
        let { network, source, program_id } = params;
        const fixture = await buildFixture(network, source, program_id);
        const repayVouchers = await fixture.program.account.repayVoucher.all();
        console.log('Repay voucher is:');
        console.log(repayVouchers);
    });

program.parse();

function convertDateStringToUnixTimeSecond(dateString: string) {
    // date string format: DD/mm/YYYY hh:mm, for example: 01/01/2022 00:00, time will be in UTC
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    const formattedDate = `${month}/${day}/${year} ${hours}:${minutes} UTC`;
    const dateObject = new Date(formattedDate);

    if (isNaN(dateObject.getTime())) {
        throw new Error('Invalid date');
    }
    console.log('Date object ', dateObject);
    const unixTimestamp = Math.floor(dateObject.getTime() / 1000);
    return unixTimestamp;
}
