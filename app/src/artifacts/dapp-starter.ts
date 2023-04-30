export type DappStarter = {
  version: "0.1.0";
  name: "dapp_starter";
  instructions: [
    {
      name: "initialize";
      accounts: [
        {
          name: "config";
          isMut: true;
          isSigner: true;
        },
        {
          name: "deployer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "counter";
      type: {
        kind: "struct";
        fields: [
          {
            name: "count";
            type: "u64";
          }
        ];
      };
    }
  ];
};

export const IDL: DappStarter = {
  version: "0.1.0",
  name: "dapp_starter",
  instructions: [
    {
      name: "initialize",
      accounts: [
        {
          name: "config",
          isMut: true,
          isSigner: true,
        },
        {
          name: "deployer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "counter",
      type: {
        kind: "struct",
        fields: [
          {
            name: "count",
            type: "u64",
          },
        ],
      },
    },
  ],
};