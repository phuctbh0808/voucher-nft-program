export type VoucherNft = {
    version: '0.1.0';
    name: 'voucher_nft';
    instructions: [
        {
            name: 'initialize';
            accounts: [
                {
                    name: 'config';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'admin';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
    ];
    accounts: [
        {
            name: 'config';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'admin';
                        type: 'publicKey';
                    },
                    {
                        name: 'reserve';
                        type: {
                            array: ['u128', 6];
                        };
                    },
                ];
            };
        },
    ];
};

export const IDL: VoucherNft = {
    version: '0.1.0',
    name: 'voucher_nft',
    instructions: [
        {
            name: 'initialize',
            accounts: [
                {
                    name: 'config',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'admin',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
    ],
    accounts: [
        {
            name: 'config',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'admin',
                        type: 'publicKey',
                    },
                    {
                        name: 'reserve',
                        type: {
                            array: ['u128', 6],
                        },
                    },
                ],
            },
        },
    ],
};
