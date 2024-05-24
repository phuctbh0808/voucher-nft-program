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
        {
            name: 'addVault';
            accounts: [
                {
                    name: 'config';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'vault';
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
            args: [
                {
                    name: 'seed';
                    type: 'string';
                },
                {
                    name: 'operator';
                    type: 'publicKey';
                },
            ];
        },
        {
            name: 'mintVoucher';
            accounts: [
                {
                    name: 'vault';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'operator';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'mint';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'metadataAccount';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'tokenMetadataProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'tokenProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'associatedTokenProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'rent';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'seed';
                    type: 'string';
                },
            ];
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
        {
            name: 'vault';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'operator';
                        type: 'publicKey';
                    },
                    {
                        name: 'seed';
                        type: 'string';
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
    types: [
        {
            name: 'VoucherNftError';
            type: {
                kind: 'enum';
                variants: [
                    {
                        name: 'OnlyAdmin';
                    },
                    {
                        name: 'OnlyOperator';
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
        {
            name: 'addVault',
            accounts: [
                {
                    name: 'config',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'vault',
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
            args: [
                {
                    name: 'seed',
                    type: 'string',
                },
                {
                    name: 'operator',
                    type: 'publicKey',
                },
            ],
        },
        {
            name: 'mintVoucher',
            accounts: [
                {
                    name: 'vault',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'operator',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'mint',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'metadataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'tokenMetadataProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'associatedTokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'rent',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'seed',
                    type: 'string',
                },
            ],
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
        {
            name: 'vault',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'operator',
                        type: 'publicKey',
                    },
                    {
                        name: 'seed',
                        type: 'string',
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
    types: [
        {
            name: 'VoucherNftError',
            type: {
                kind: 'enum',
                variants: [
                    {
                        name: 'OnlyAdmin',
                    },
                    {
                        name: 'OnlyOperator',
                    },
                ],
            },
        },
    ],
};
