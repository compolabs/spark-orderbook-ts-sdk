import BigNumber from 'bignumber.js';
import { Wallet, Provider, Address, hashMessage, arrayify, Interface, Contract, ContractFactory } from 'fuels';

// src/constants/tokens.ts
var BETA_TOKENS = [
  {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 9,
    assetId: "0x0000000000000000000000000000000000000000000000000000000000000000",
    priceFeed: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
  },
  {
    name: "Bitcoin",
    symbol: "BTC",
    decimals: 8,
    assetId: "0x593b117a05f5ea64b39ba1f9bc3fb7e7a791c9be130e28376ad552eacdb3b746",
    priceFeed: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"
  },
  {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
    assetId: "0x0450e4d385cbd2914f74505f18f01587cc4f4ad1fdef4b80cbde2a8155a86d72",
    priceFeed: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a"
  }
];
BigNumber.config({ EXPONENTIAL_AT: [-100, 100] });
var bigNumberify = (n) => {
  if (n && n.toString) {
    const primitive = n.toString();
    if (typeof primitive !== "object") {
      return primitive;
    }
  }
  return n;
};
var _BN = class _BN extends BigNumber {
  constructor(n, base) {
    super(bigNumberify(n), base);
    this.dividedBy = this.div;
    this.exponentiatedBy = this.pow;
    this.modulo = this.mod;
    this.multipliedBy = this.times;
    this.squareRoot = this.sqrt;
    /**
     * @example
     * new BN('1234.5678').toSignificant(2) === 1,234.56
     * new BN('1234.506').toSignificant(2) === 1,234.5
     * new BN('123.0000').toSignificant(2) === 123
     * new BN('0.001234').toSignificant(2) === 0.0012
     */
    this.toSignificant = (significantDigits, roundingMode = BigNumber.ROUND_DOWN, format) => {
      return this.gte(1) || significantDigits === 0 ? this.toFormat(significantDigits, roundingMode, format).replace(
        /(\.[0-9]*[1-9])0+$|\.0+$/,
        "$1"
      ) : super.precision(significantDigits, roundingMode).toString();
    };
  }
  static clamp(number, min, max) {
    return _BN.min(_BN.max(number, min), max);
  }
  static max(...n) {
    return new _BN(super.max(...n.map(bigNumberify)));
  }
  static min(...n) {
    return new _BN(super.min(...n.map(bigNumberify)));
  }
  static toBN(p) {
    return p.then((v) => new _BN(v));
  }
  static parseUnits(value, decimals = 8) {
    return new _BN(10).pow(decimals).times(bigNumberify(value));
  }
  static formatUnits(value, decimals = 8) {
    return new _BN(value).div(new _BN(10).pow(decimals));
  }
  static percentOf(value, percent) {
    return new _BN(new _BN(value).times(percent).div(100).toFixed(0));
  }
  static ratioOf(valueA, valueB) {
    return new _BN(valueA).div(valueB).times(100);
  }
  abs() {
    return new _BN(super.abs());
  }
  div(n, base) {
    return new _BN(super.div(bigNumberify(n), base));
  }
  pow(n, m) {
    return new _BN(super.pow(bigNumberify(n), bigNumberify(m)));
  }
  minus(n, base) {
    return new _BN(super.minus(bigNumberify(n), base));
  }
  mod(n, base) {
    return new _BN(super.mod(bigNumberify(n), base));
  }
  times(n, base) {
    return new _BN(super.times(bigNumberify(n), base));
  }
  negated() {
    return new _BN(super.negated());
  }
  plus(n, base) {
    return new _BN(super.plus(bigNumberify(n), base));
  }
  sqrt() {
    return new _BN(super.sqrt());
  }
  toDecimalPlaces(decimalPlaces, roundingMode = BigNumber.ROUND_DOWN) {
    return new _BN(super.dp(decimalPlaces, roundingMode));
  }
  toBigFormat(decimalPlaces) {
    if (super.toNumber() > 999 && super.toNumber() < 1e6) {
      return (super.toNumber() / 1e3).toFixed(1) + "K";
    } else if (super.toNumber() > 1e6) {
      return (super.toNumber() / 1e6).toFixed(1) + "M";
    } else if (super.toNumber() < 900) {
      return super.toFormat(decimalPlaces);
    }
    return super.toFormat(decimalPlaces);
  }
  clamp(min, max) {
    return _BN.min(_BN.max(this, min), max);
  }
};
_BN.ZERO = new _BN(0);
_BN.MaxUint256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
var BN = _BN;
var BN_default = BN;

// src/constants/index.ts
var DEFAULT_DECIMALS = 9;
var DEFAULT_GAS_PRICE = "1";
var DEFAULT_GAS_LIMIT_MULTIPLIER = "2";
var BETA_CONTRACT_ADDRESSES = {
  spotMarket: "0x7134802bdefd097f1c9d8ad86ef27081ae609b84de0afc87b58bd4e04afc6a23",
  tokenFactory: "0x6bd9643c9279204b474a778dea7f923226060cb94a4c61c5aae015cf96b5aad2",
  vault: "0xe8beef1c4c94e8732b89c5e783c80e9fb7f80fd43ad0c594ba380e4b5556106a",
  accountBalance: "0xa842702d600b43a3c7be0e36a0e08452b3d6fc36f0d4015fb6a06cb056cd312d",
  clearingHouse: "0xa4801149d4faa6e8421f130708bcd228780353241e2b35697e4e08d0b3672b20",
  perpMarket: "0xd628033650475290e0e8696266d0a0318364ff9c980f9ee5f4a4bb56ee85664a",
  pyth: "0x3cd5005f23321c8ae0ccfa98fb07d9a5ff325c483f21d2d9540d6897007600c9",
  proxy: "0x24c43c6cb3f0898ab46142fefa94a77414d7a6bb2619c41cd8725b161ac50c9d"
};
var EXPLORER_URL = "https://app.fuel.network/";
var BETA_NETWORK = {
  name: "Fuel",
  url: "https://beta-5.fuel.network/graphql"
};
var BETA_INDEXER_URL = "https://orderbook-indexer.spark-defi.com";

// src/utils/NetworkError.ts
var NETWORK_ERROR_MESSAGE = {
  [1 /* INVALID_TOKEN */]: "Invalid token.",
  [3 /* INVALID_WALLET_PROVIDER */]: "Wallet not connected.",
  [2 /* NOT_CONNECTED */]: "Not connected to a wallet.",
  [4 /* UNKNOWN_WALLET */]: "Wallet does not exist.",
  [5 /* UNKNOWN_ACCOUNT */]: "Account is not connected."
};
var NetworkError = class _NetworkError extends Error {
  constructor(code) {
    super(NETWORK_ERROR_MESSAGE[code]);
    this.code = code;
    Object.setPrototypeOf(this, _NetworkError.prototype);
  }
};
var _abi = {
  "types": [
    {
      "typeId": 0,
      "type": "()",
      "components": [],
      "typeParameters": null
    },
    {
      "typeId": 1,
      "type": "(_, _)",
      "components": [
        {
          "name": "__tuple_element",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 11,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 2,
      "type": "(_, _)",
      "components": [
        {
          "name": "__tuple_element",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 19,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 3,
      "type": "(_, _)",
      "components": [
        {
          "name": "__tuple_element",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 15,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 4,
      "type": "(_, _, _, _)",
      "components": [
        {
          "name": "__tuple_element",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 19,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 5,
      "type": "b256",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 6,
      "type": "bool",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 7,
      "type": "enum Error",
      "components": [
        {
          "name": "AccessDenied",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NotEnoughFreeCollateralByImRatio",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NoMarketFound",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 8,
      "type": "generic T",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 9,
      "type": "raw untyped ptr",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 10,
      "type": "str",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 11,
      "type": "struct AccountBalance",
      "components": [
        {
          "name": "taker_position_size",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "taker_open_notional",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "last_tw_premium_growth_global",
          "type": 15,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 12,
      "type": "struct AccountBalanceChangeEvent",
      "components": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "account_balance",
          "type": 11,
          "typeArguments": null
        },
        {
          "name": "timestamp",
          "type": 19,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 13,
      "type": "struct Address",
      "components": [
        {
          "name": "value",
          "type": 5,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 14,
      "type": "struct AssetId",
      "components": [
        {
          "name": "value",
          "type": 5,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 15,
      "type": "struct I64",
      "components": [
        {
          "name": "value",
          "type": 19,
          "typeArguments": null
        },
        {
          "name": "negative",
          "type": 6,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 16,
      "type": "struct OwedRealizedPnlChangeEvent",
      "components": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "owed_realized_pnl",
          "type": 15,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 17,
      "type": "struct RawVec",
      "components": [
        {
          "name": "ptr",
          "type": 9,
          "typeArguments": null
        },
        {
          "name": "cap",
          "type": 19,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        8
      ]
    },
    {
      "typeId": 18,
      "type": "struct Vec",
      "components": [
        {
          "name": "buf",
          "type": 17,
          "typeArguments": [
            {
              "name": "",
              "type": 8,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "len",
          "type": 19,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        8
      ]
    },
    {
      "typeId": 19,
      "type": "u64",
      "components": null,
      "typeParameters": null
    }
  ],
  "functions": [
    {
      "inputs": [
        {
          "name": "sell_trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "buy_trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "trade_amount",
          "type": 19,
          "typeArguments": null
        },
        {
          "name": "trade_value",
          "type": 19,
          "typeArguments": null
        },
        {
          "name": "seller_fee",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "buyer_fee",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "matcher",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "execute_trade",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "amount",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "modify_owed_realized_pnl",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "exchanged_position_size",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "exchanged_position_notional",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "modify_position",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "register_base_token",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "settle_all_funding",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "settle_bad_debt",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "settle_funding",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "settle_owed_realized_pnl",
      "output": {
        "name": "",
        "type": 15,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "settle_position_in_closed_market",
      "output": {
        "name": "",
        "type": 4,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "insurance_fund_fee_share",
          "type": 19,
          "typeArguments": null
        }
      ],
      "name": "update_insurance_fund_fee_share",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "max_funding_rate",
          "type": 19,
          "typeArguments": null
        }
      ],
      "name": "update_max_funding_rate",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "protocol_fee_rate",
          "type": 19,
          "typeArguments": null
        }
      ],
      "name": "update_protocol_fee_rate",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "last_tw_premium_growth_global",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "update_tw_premium_growth_global",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "get_account_balance",
      "output": {
        "name": "",
        "type": 11,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "get_all_pending_funding_payment",
      "output": {
        "name": "",
        "type": 15,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "get_all_trader_positions",
      "output": {
        "name": "",
        "type": 18,
        "typeArguments": [
          {
            "name": "",
            "type": 1,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "get_base_tokens",
      "output": {
        "name": "",
        "type": 18,
        "typeArguments": [
          {
            "name": "",
            "type": 14,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "get_funding",
      "output": {
        "name": "",
        "type": 2,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "market_twap",
          "type": 19,
          "typeArguments": null
        },
        {
          "name": "index_twap",
          "type": 19,
          "typeArguments": null
        }
      ],
      "name": "get_funding_delta",
      "output": {
        "name": "",
        "type": 15,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "get_funding_growth_global",
      "output": {
        "name": "",
        "type": 15,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "get_funding_rate",
      "output": {
        "name": "",
        "type": 15,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "account_value",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "get_liquidatable_position_size",
      "output": {
        "name": "",
        "type": 15,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "get_margin_requirement",
      "output": {
        "name": "",
        "type": 19,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "buffer",
          "type": 19,
          "typeArguments": null
        }
      ],
      "name": "get_margin_requirement_for_liquidation",
      "output": {
        "name": "",
        "type": 19,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "get_pending_funding_payment",
      "output": {
        "name": "",
        "type": 3,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "get_pnl",
      "output": {
        "name": "",
        "type": 3,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "get_protocol_fee_rate",
      "output": {
        "name": "",
        "type": 19,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "get_settlement_token_balance_and_unrealized_pnl",
      "output": {
        "name": "",
        "type": 3,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "settlement_token_collateral",
          "type": 19,
          "typeArguments": null
        }
      ],
      "name": "get_settlement_token_balance_and_unrealized_pnl_by_vault",
      "output": {
        "name": "",
        "type": 3,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "get_taker_open_notional",
      "output": {
        "name": "",
        "type": 15,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "get_taker_position_size",
      "output": {
        "name": "",
        "type": 15,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "get_total_abs_position_value",
      "output": {
        "name": "",
        "type": 19,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "get_total_position_value",
      "output": {
        "name": "",
        "type": 15,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    }
  ],
  "loggedTypes": [
    {
      "logId": 0,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 1,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 2,
      "loggedType": {
        "name": "",
        "type": 12,
        "typeArguments": []
      }
    },
    {
      "logId": 3,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 4,
      "loggedType": {
        "name": "",
        "type": 12,
        "typeArguments": []
      }
    },
    {
      "logId": 5,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 6,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 7,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 8,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 9,
      "loggedType": {
        "name": "",
        "type": 12,
        "typeArguments": []
      }
    },
    {
      "logId": 10,
      "loggedType": {
        "name": "",
        "type": 12,
        "typeArguments": []
      }
    },
    {
      "logId": 11,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 12,
      "loggedType": {
        "name": "",
        "type": 12,
        "typeArguments": []
      }
    },
    {
      "logId": 13,
      "loggedType": {
        "name": "",
        "type": 12,
        "typeArguments": []
      }
    },
    {
      "logId": 14,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 15,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 16,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 17,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 18,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 19,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 20,
      "loggedType": {
        "name": "",
        "type": 12,
        "typeArguments": []
      }
    },
    {
      "logId": 21,
      "loggedType": {
        "name": "",
        "type": 12,
        "typeArguments": []
      }
    },
    {
      "logId": 22,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 23,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 24,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 25,
      "loggedType": {
        "name": "",
        "type": 12,
        "typeArguments": []
      }
    },
    {
      "logId": 26,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 27,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 28,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 29,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 30,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 31,
      "loggedType": {
        "name": "",
        "type": 12,
        "typeArguments": []
      }
    },
    {
      "logId": 32,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 33,
      "loggedType": {
        "name": "",
        "type": 12,
        "typeArguments": []
      }
    },
    {
      "logId": 34,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 35,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 36,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 37,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 38,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 39,
      "loggedType": {
        "name": "",
        "type": 12,
        "typeArguments": []
      }
    },
    {
      "logId": 40,
      "loggedType": {
        "name": "",
        "type": 10,
        "typeArguments": null
      }
    },
    {
      "logId": 41,
      "loggedType": {
        "name": "",
        "type": 10,
        "typeArguments": null
      }
    }
  ],
  "messagesTypes": [],
  "configurables": [
    {
      "name": "DUST",
      "configurableType": {
        "name": "",
        "type": 19,
        "typeArguments": null
      },
      "offset": 260136
    },
    {
      "name": "PROXY_ADDRESS",
      "configurableType": {
        "name": "",
        "type": 13,
        "typeArguments": []
      },
      "offset": 26e4
    },
    {
      "name": "FULLY_CLOSED_RATIO",
      "configurableType": {
        "name": "",
        "type": 19,
        "typeArguments": null
      },
      "offset": 260264
    },
    {
      "name": "SETTLEMENT_TOKEN",
      "configurableType": {
        "name": "",
        "type": 14,
        "typeArguments": []
      },
      "offset": 260352
    }
  ]
};
var _storageSlots = [
  {
    "key": "02dac99c283f16bc91b74f6942db7f012699a2ad51272b15207b9cc14a70dbae",
    "value": "0000000005f5e100000000000000000000000000000000000000000000000000"
  },
  {
    "key": "6294951dcb0a9111a517be5cf4785670ff4e166fb5ab9c33b17e6881b48e964f",
    "value": "0000000000001388000000000000000000000000000000000000000000000000"
  },
  {
    "key": "7f91d1a929dce734e7f930bbb279ccfccdb5474227502ea8845815c74bd930a7",
    "value": "0000000000030d40000000000000000000000000000000000000000000000000"
  },
  {
    "key": "94b2b70d20da552763c7614981b2a4d984380d7ed4e54c01b28c914e79e44bd5",
    "value": "000000000007a120000000000000000000000000000000000000000000000000"
  }
];
var _AccountBalanceAbi__factory = class _AccountBalanceAbi__factory {
  static createInterface() {
    return new Interface(_abi);
  }
  static connect(id, accountOrProvider) {
    return new Contract(id, _abi, accountOrProvider);
  }
  static async deployContract(bytecode, wallet, options = {}) {
    const factory = new ContractFactory(bytecode, _abi, wallet);
    const { storageSlots } = _AccountBalanceAbi__factory;
    const contract = await factory.deployContract({
      storageSlots,
      ...options
    });
    return contract;
  }
};
_AccountBalanceAbi__factory.abi = _abi;
_AccountBalanceAbi__factory.storageSlots = _storageSlots;
var AccountBalanceAbi__factory = _AccountBalanceAbi__factory;
var _abi2 = {
  "types": [
    {
      "typeId": 0,
      "type": "()",
      "components": [],
      "typeParameters": null
    },
    {
      "typeId": 1,
      "type": "(_, _)",
      "components": [
        {
          "name": "__tuple_element",
          "type": 17,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 17,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 2,
      "type": "(_, _)",
      "components": [
        {
          "name": "__tuple_element",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 24,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 3,
      "type": "b256",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 4,
      "type": "bool",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 5,
      "type": "enum Error",
      "components": [
        {
          "name": "PositionSizeIsZero",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "MarketNotFound",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "MarketNotPaused",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "MarketNotOpened",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "MarketAlreadyExists",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "OnlyVaultOrTrader",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "BaseTokenDoesNotExists",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "CannotLiquidateWhenThereIsStillOrder",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "EnoughAccountValue",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "WrongLiquidationDirection",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InsufficientInsuranceFundCapacity",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NotEnoughFreeCollateralByImRatio",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "AccessDenied",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 6,
      "type": "enum Identity",
      "components": [
        {
          "name": "Address",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "ContractId",
          "type": 16,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 7,
      "type": "enum MarketEventIdentifier",
      "components": [
        {
          "name": "MarketCreateEvent",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "MarketCloseEvent",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "MarketPauseEvent",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "MarketUnpauseEvent",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 8,
      "type": "enum MarketStatus",
      "components": [
        {
          "name": "Opened",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "Paused",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "Closed",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 9,
      "type": "enum Option",
      "components": [
        {
          "name": "None",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "Some",
          "type": 11,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        11
      ]
    },
    {
      "typeId": 10,
      "type": "enum ReentrancyError",
      "components": [
        {
          "name": "NonReentrant",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 11,
      "type": "generic T",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 12,
      "type": "raw untyped ptr",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 13,
      "type": "struct Address",
      "components": [
        {
          "name": "value",
          "type": 3,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 14,
      "type": "struct AssetId",
      "components": [
        {
          "name": "value",
          "type": 3,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 15,
      "type": "struct Bytes",
      "components": [
        {
          "name": "buf",
          "type": 20,
          "typeArguments": null
        },
        {
          "name": "len",
          "type": 24,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 16,
      "type": "struct ContractId",
      "components": [
        {
          "name": "value",
          "type": 3,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 17,
      "type": "struct I64",
      "components": [
        {
          "name": "value",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "negative",
          "type": 4,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 18,
      "type": "struct Market",
      "components": [
        {
          "name": "asset_id",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "decimal",
          "type": 23,
          "typeArguments": null
        },
        {
          "name": "price_feed",
          "type": 3,
          "typeArguments": null
        },
        {
          "name": "im_ratio",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "mm_ratio",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "status",
          "type": 8,
          "typeArguments": null
        },
        {
          "name": "paused_index_price",
          "type": 9,
          "typeArguments": [
            {
              "name": "",
              "type": 24,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "paused_timestamp",
          "type": 9,
          "typeArguments": [
            {
              "name": "",
              "type": 24,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "closed_price",
          "type": 9,
          "typeArguments": [
            {
              "name": "",
              "type": 24,
              "typeArguments": null
            }
          ]
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 19,
      "type": "struct MarketEvent",
      "components": [
        {
          "name": "market",
          "type": 18,
          "typeArguments": null
        },
        {
          "name": "sender",
          "type": 6,
          "typeArguments": null
        },
        {
          "name": "timestamp",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "identifier",
          "type": 7,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 20,
      "type": "struct RawBytes",
      "components": [
        {
          "name": "ptr",
          "type": 12,
          "typeArguments": null
        },
        {
          "name": "cap",
          "type": 24,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 21,
      "type": "struct RawVec",
      "components": [
        {
          "name": "ptr",
          "type": 12,
          "typeArguments": null
        },
        {
          "name": "cap",
          "type": 24,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        11
      ]
    },
    {
      "typeId": 22,
      "type": "struct Vec",
      "components": [
        {
          "name": "buf",
          "type": 21,
          "typeArguments": [
            {
              "name": "",
              "type": 11,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "len",
          "type": 24,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        11
      ]
    },
    {
      "typeId": 23,
      "type": "u32",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 24,
      "type": "u64",
      "components": null,
      "typeParameters": null
    }
  ],
  "functions": [
    {
      "inputs": [
        {
          "name": "admin",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "add_admin",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "close_price",
          "type": 24,
          "typeArguments": null
        }
      ],
      "name": "close_market",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "decimal",
          "type": 23,
          "typeArguments": null
        },
        {
          "name": "price_feed",
          "type": 3,
          "typeArguments": null
        },
        {
          "name": "im_ratio",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "mm_ratio",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "initial_price",
          "type": 24,
          "typeArguments": null
        }
      ],
      "name": "create_market",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_size",
          "type": 17,
          "typeArguments": null
        },
        {
          "name": "order_id",
          "type": 3,
          "typeArguments": null
        },
        {
          "name": "price_update_data",
          "type": 22,
          "typeArguments": [
            {
              "name": "",
              "type": 15,
              "typeArguments": null
            }
          ]
        }
      ],
      "name": "fulfill_order",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        },
        {
          "name": "payable",
          "arguments": []
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "position_size_to_be_liquidated",
          "type": 17,
          "typeArguments": null
        },
        {
          "name": "price_update_data",
          "type": 22,
          "typeArguments": [
            {
              "name": "",
              "type": 15,
              "typeArguments": null
            }
          ]
        }
      ],
      "name": "liquidate",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "payable",
          "arguments": []
        },
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "order1_id",
          "type": 3,
          "typeArguments": null
        },
        {
          "name": "order2_id",
          "type": 3,
          "typeArguments": null
        },
        {
          "name": "price_update_data",
          "type": 22,
          "typeArguments": [
            {
              "name": "",
              "type": 15,
              "typeArguments": null
            }
          ]
        }
      ],
      "name": "match_orders",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        },
        {
          "name": "payable",
          "arguments": []
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "base_size",
          "type": 17,
          "typeArguments": null
        },
        {
          "name": "order_price",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "price_update_data",
          "type": 22,
          "typeArguments": [
            {
              "name": "",
              "type": 15,
              "typeArguments": null
            }
          ]
        }
      ],
      "name": "open_order",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "payable",
          "arguments": []
        },
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "update_data",
          "type": 22,
          "typeArguments": [
            {
              "name": "",
              "type": 15,
              "typeArguments": null
            }
          ]
        }
      ],
      "name": "pause_market",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        },
        {
          "name": "payable",
          "arguments": []
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "admin",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "remove_admin",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "remove_all_orders",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "order",
          "type": 3,
          "typeArguments": null
        }
      ],
      "name": "remove_order",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "remove_uncollaterized_orders",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "settle_all_funding",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "unpause_market",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "insurance_fund_fee_share",
          "type": 24,
          "typeArguments": null
        }
      ],
      "name": "update_insurance_fund_fee_share",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "liquidation_penalty_ratio",
          "type": 24,
          "typeArguments": null
        }
      ],
      "name": "update_liquidation_penalty_ratio",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "fee_rate",
          "type": 24,
          "typeArguments": null
        }
      ],
      "name": "update_matcher_fee_rate",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "max_funding_rate",
          "type": 24,
          "typeArguments": null
        }
      ],
      "name": "update_max_funding_rate",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "protocol_fee_rate",
          "type": 24,
          "typeArguments": null
        }
      ],
      "name": "update_protocol_fee_rate",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "fee_rate",
          "type": 24,
          "typeArguments": null
        }
      ],
      "name": "update_taker_fee_rate",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "check_market_open",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "get_account_value",
      "output": {
        "name": "",
        "type": 17,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "account_value",
          "type": 17,
          "typeArguments": null
        },
        {
          "name": "position_size_to_be_liquidated",
          "type": 17,
          "typeArguments": null
        }
      ],
      "name": "get_liquidated_position_size_and_notional",
      "output": {
        "name": "",
        "type": 1,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "get_margin_requirement_for_liquidation",
      "output": {
        "name": "",
        "type": 24,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "get_market",
      "output": {
        "name": "",
        "type": 18,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_asset",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "trade_price",
          "type": 24,
          "typeArguments": null
        }
      ],
      "name": "get_max_abs_position_size",
      "output": {
        "name": "",
        "type": 2,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "get_taker_open_notional",
      "output": {
        "name": "",
        "type": 17,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "get_taker_position",
      "output": {
        "name": "",
        "type": 17,
        "typeArguments": null
      },
      "attributes": null
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "get_taker_position_safe",
      "output": {
        "name": "",
        "type": 17,
        "typeArguments": null
      },
      "attributes": null
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "is_liquidatable",
      "output": {
        "name": "",
        "type": 4,
        "typeArguments": null
      },
      "attributes": null
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "require_enough_free_collateral",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": null
    }
  ],
  "loggedTypes": [
    {
      "logId": 0,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 1,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 2,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 3,
      "loggedType": {
        "name": "",
        "type": 19,
        "typeArguments": []
      }
    },
    {
      "logId": 4,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 5,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 6,
      "loggedType": {
        "name": "",
        "type": 19,
        "typeArguments": []
      }
    },
    {
      "logId": 7,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 8,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 9,
      "loggedType": {
        "name": "",
        "type": 10,
        "typeArguments": []
      }
    },
    {
      "logId": 10,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 11,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 12,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 13,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 14,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 15,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 16,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 17,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 18,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 19,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 20,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 21,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 22,
      "loggedType": {
        "name": "",
        "type": 10,
        "typeArguments": []
      }
    },
    {
      "logId": 23,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 24,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 25,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 26,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 27,
      "loggedType": {
        "name": "",
        "type": 19,
        "typeArguments": []
      }
    },
    {
      "logId": 28,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 29,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 30,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 31,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 32,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 33,
      "loggedType": {
        "name": "",
        "type": 19,
        "typeArguments": []
      }
    },
    {
      "logId": 34,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 35,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 36,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 37,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 38,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 39,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 40,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 41,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 42,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 43,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    }
  ],
  "messagesTypes": [],
  "configurables": [
    {
      "name": "OWNER",
      "configurableType": {
        "name": "",
        "type": 13,
        "typeArguments": []
      },
      "offset": 85572
    },
    {
      "name": "PROXY_ADDRESS",
      "configurableType": {
        "name": "",
        "type": 13,
        "typeArguments": []
      },
      "offset": 85748
    }
  ]
};
var _storageSlots2 = [
  {
    "key": "02dac99c283f16bc91b74f6942db7f012699a2ad51272b15207b9cc14a70dbae",
    "value": "00000000000001f4000000000000000000000000000000000000000000000000"
  },
  {
    "key": "6294951dcb0a9111a517be5cf4785670ff4e166fb5ab9c33b17e6881b48e964f",
    "value": "00000000000003e8000000000000000000000000000000000000000000000000"
  },
  {
    "key": "f383b0ce51358be57daa3b725fe44acdb2d880604e367199080b4379c41bb6ed",
    "value": "0000000000030d40000000000000000000000000000000000000000000000000"
  }
];
var _ClearingHouseAbi__factory = class _ClearingHouseAbi__factory {
  static createInterface() {
    return new Interface(_abi2);
  }
  static connect(id, accountOrProvider) {
    return new Contract(id, _abi2, accountOrProvider);
  }
  static async deployContract(bytecode, wallet, options = {}) {
    const factory = new ContractFactory(bytecode, _abi2, wallet);
    const { storageSlots } = _ClearingHouseAbi__factory;
    const contract = await factory.deployContract({
      storageSlots,
      ...options
    });
    return contract;
  }
};
_ClearingHouseAbi__factory.abi = _abi2;
_ClearingHouseAbi__factory.storageSlots = _storageSlots2;
var ClearingHouseAbi__factory = _ClearingHouseAbi__factory;
var _abi3 = {
  "types": [
    {
      "typeId": 0,
      "type": "()",
      "components": [],
      "typeParameters": null
    },
    {
      "typeId": 1,
      "type": "(_, _)",
      "components": [
        {
          "name": "__tuple_element",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 24,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 2,
      "type": "(_, _)",
      "components": [
        {
          "name": "__tuple_element",
          "type": 9,
          "typeArguments": [
            {
              "name": "",
              "type": 22,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "__tuple_element",
          "type": 9,
          "typeArguments": [
            {
              "name": "",
              "type": 22,
              "typeArguments": null
            }
          ]
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 3,
      "type": "(_, _, _, _)",
      "components": [
        {
          "name": "__tuple_element",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 24,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 4,
      "type": "(_, _, _, _, _, _, _)",
      "components": [
        {
          "name": "__tuple_element",
          "type": 5,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 5,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 24,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 5,
      "type": "b256",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 6,
      "type": "bool",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 7,
      "type": "enum Error",
      "components": [
        {
          "name": "AccessDenied",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "FreeCollateralMoreThanZero",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NoOrdersFound",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NoMarketFound",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "OrdersCantBeMatched",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NoMarketPriceForMarket",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "FirstArgumentShouldBeOrderSellSecondOrderBuy",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 8,
      "type": "enum Identity",
      "components": [
        {
          "name": "Address",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "ContractId",
          "type": 16,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 9,
      "type": "enum Option",
      "components": [
        {
          "name": "None",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "Some",
          "type": 11,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        11
      ]
    },
    {
      "typeId": 10,
      "type": "enum OrderEventIdentifier",
      "components": [
        {
          "name": "OrderOpenEvent",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "OrderRemoveUncollaterizedEvent",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "OrderRemoveEvent",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "OrderRemoveAllEvent",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "OrderMatchEvent",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "OrderFulfillEvent",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 11,
      "type": "generic T",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 12,
      "type": "raw untyped ptr",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 13,
      "type": "str",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 14,
      "type": "struct Address",
      "components": [
        {
          "name": "value",
          "type": 5,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 15,
      "type": "struct AssetId",
      "components": [
        {
          "name": "value",
          "type": 5,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 16,
      "type": "struct ContractId",
      "components": [
        {
          "name": "value",
          "type": 5,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 17,
      "type": "struct I64",
      "components": [
        {
          "name": "value",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "negative",
          "type": 6,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 18,
      "type": "struct Order",
      "components": [
        {
          "name": "id",
          "type": 5,
          "typeArguments": null
        },
        {
          "name": "trader",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "base_size",
          "type": 17,
          "typeArguments": null
        },
        {
          "name": "order_price",
          "type": 24,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 19,
      "type": "struct OrderEvent",
      "components": [
        {
          "name": "order_id",
          "type": 5,
          "typeArguments": null
        },
        {
          "name": "order",
          "type": 9,
          "typeArguments": [
            {
              "name": "",
              "type": 18,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "sender",
          "type": 8,
          "typeArguments": null
        },
        {
          "name": "timestamp",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "identifier",
          "type": 10,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 20,
      "type": "struct RawVec",
      "components": [
        {
          "name": "ptr",
          "type": 12,
          "typeArguments": null
        },
        {
          "name": "cap",
          "type": 24,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        11
      ]
    },
    {
      "typeId": 21,
      "type": "struct TradeEvent",
      "components": [
        {
          "name": "base_token",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "seller",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "buyer",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "trade_size",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "trade_price",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "sell_order_id",
          "type": 5,
          "typeArguments": null
        },
        {
          "name": "buy_order_id",
          "type": 5,
          "typeArguments": null
        },
        {
          "name": "timestamp",
          "type": 24,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 22,
      "type": "struct Twap",
      "components": [
        {
          "name": "base_token",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "span",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "current_twap",
          "type": 24,
          "typeArguments": null
        },
        {
          "name": "last_update",
          "type": 24,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 23,
      "type": "struct Vec",
      "components": [
        {
          "name": "buf",
          "type": 20,
          "typeArguments": [
            {
              "name": "",
              "type": 11,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "len",
          "type": 24,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        11
      ]
    },
    {
      "typeId": 24,
      "type": "u64",
      "components": null,
      "typeParameters": null
    }
  ],
  "functions": [
    {
      "inputs": [
        {
          "name": "base_size",
          "type": 17,
          "typeArguments": null
        },
        {
          "name": "order_id",
          "type": 5,
          "typeArguments": null
        }
      ],
      "name": "fulfill_order",
      "output": {
        "name": "",
        "type": 3,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "payable",
          "arguments": []
        },
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "order1_id",
          "type": 5,
          "typeArguments": null
        },
        {
          "name": "order2_id",
          "type": 5,
          "typeArguments": null
        }
      ],
      "name": "match_orders",
      "output": {
        "name": "",
        "type": 4,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "payable",
          "arguments": []
        },
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "base_size",
          "type": 17,
          "typeArguments": null
        },
        {
          "name": "order_price",
          "type": 24,
          "typeArguments": null
        }
      ],
      "name": "open_order",
      "output": {
        "name": "",
        "type": 5,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "remove_all_orders",
      "output": {
        "name": "",
        "type": 23,
        "typeArguments": [
          {
            "name": "",
            "type": 5,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "order_id",
          "type": 5,
          "typeArguments": null
        }
      ],
      "name": "remove_order",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "remove_uncollaterized_orders",
      "output": {
        "name": "",
        "type": 23,
        "typeArguments": [
          {
            "name": "",
            "type": 5,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_token",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "current_twap",
          "type": 24,
          "typeArguments": null
        }
      ],
      "name": "setup_twap",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "fee_rate",
          "type": 24,
          "typeArguments": null
        }
      ],
      "name": "update_maker_fee_rate",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "mark_span",
          "type": 24,
          "typeArguments": null
        }
      ],
      "name": "update_mark_span",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "market_span",
          "type": 24,
          "typeArguments": null
        }
      ],
      "name": "update_market_span",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_token",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "get_latest_twap",
      "output": {
        "name": "",
        "type": 1,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "token",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "get_mark_price",
      "output": {
        "name": "",
        "type": 24,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "token",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "get_market_price",
      "output": {
        "name": "",
        "type": 24,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "get_total_trader_order_base",
      "output": {
        "name": "",
        "type": 17,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "get_trader_orders",
      "output": {
        "name": "",
        "type": 23,
        "typeArguments": [
          {
            "name": "",
            "type": 18,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_token",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "get_twaps",
      "output": {
        "name": "",
        "type": 2,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 14,
          "typeArguments": null
        }
      ],
      "name": "has_active_orders",
      "output": {
        "name": "",
        "type": 6,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "has_active_orders_by_token",
      "output": {
        "name": "",
        "type": 6,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    }
  ],
  "loggedTypes": [
    {
      "logId": 0,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 1,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 2,
      "loggedType": {
        "name": "",
        "type": 13,
        "typeArguments": null
      }
    },
    {
      "logId": 3,
      "loggedType": {
        "name": "",
        "type": 19,
        "typeArguments": []
      }
    },
    {
      "logId": 4,
      "loggedType": {
        "name": "",
        "type": 21,
        "typeArguments": []
      }
    },
    {
      "logId": 5,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 6,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 7,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 8,
      "loggedType": {
        "name": "",
        "type": 19,
        "typeArguments": []
      }
    },
    {
      "logId": 9,
      "loggedType": {
        "name": "",
        "type": 19,
        "typeArguments": []
      }
    },
    {
      "logId": 10,
      "loggedType": {
        "name": "",
        "type": 21,
        "typeArguments": []
      }
    },
    {
      "logId": 11,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 12,
      "loggedType": {
        "name": "",
        "type": 19,
        "typeArguments": []
      }
    },
    {
      "logId": 13,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 14,
      "loggedType": {
        "name": "",
        "type": 19,
        "typeArguments": []
      }
    },
    {
      "logId": 15,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 16,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 17,
      "loggedType": {
        "name": "",
        "type": 19,
        "typeArguments": []
      }
    },
    {
      "logId": 18,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 19,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 20,
      "loggedType": {
        "name": "",
        "type": 19,
        "typeArguments": []
      }
    },
    {
      "logId": 21,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 22,
      "loggedType": {
        "name": "",
        "type": 13,
        "typeArguments": null
      }
    },
    {
      "logId": 23,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 24,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 25,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    },
    {
      "logId": 26,
      "loggedType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      }
    }
  ],
  "messagesTypes": [],
  "configurables": [
    {
      "name": "OWNER",
      "configurableType": {
        "name": "",
        "type": 14,
        "typeArguments": []
      },
      "offset": 140696
    },
    {
      "name": "PROXY_ADDRESS",
      "configurableType": {
        "name": "",
        "type": 14,
        "typeArguments": []
      },
      "offset": 140264
    },
    {
      "name": "DUST",
      "configurableType": {
        "name": "",
        "type": 24,
        "typeArguments": null
      },
      "offset": 140480
    }
  ]
};
var _storageSlots3 = [
  {
    "key": "7f91d1a929dce734e7f930bbb279ccfccdb5474227502ea8845815c74bd930a7",
    "value": "0000000000000384000000000000000000000000000000000000000000000000"
  },
  {
    "key": "8a89a0cce819e0426e565819a9a98711329087da5a802fb16edd223c47fa44ef",
    "value": "00000000000001f4000000000000000000000000000000000000000000000000"
  },
  {
    "key": "94b2b70d20da552763c7614981b2a4d984380d7ed4e54c01b28c914e79e44bd5",
    "value": "0000000000000e10000000000000000000000000000000000000000000000000"
  },
  {
    "key": "a9203bbb8366ca9d708705dce980acbb54d44fb753370ffe4c7d351b46b2abbc",
    "value": "0000000000000000000000000000000000000000000000000000000000000000"
  }
];
var _PerpMarketAbi__factory = class _PerpMarketAbi__factory {
  static createInterface() {
    return new Interface(_abi3);
  }
  static connect(id, accountOrProvider) {
    return new Contract(id, _abi3, accountOrProvider);
  }
  static async deployContract(bytecode, wallet, options = {}) {
    const factory = new ContractFactory(bytecode, _abi3, wallet);
    const { storageSlots } = _PerpMarketAbi__factory;
    const contract = await factory.deployContract({
      storageSlots,
      ...options
    });
    return contract;
  }
};
_PerpMarketAbi__factory.abi = _abi3;
_PerpMarketAbi__factory.storageSlots = _storageSlots3;
var PerpMarketAbi__factory = _PerpMarketAbi__factory;
var _abi4 = {
  "types": [
    {
      "typeId": 0,
      "type": "()",
      "components": [],
      "typeParameters": null
    },
    {
      "typeId": 1,
      "type": "(_, _)",
      "components": [
        {
          "name": "__tuple_element",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 14,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 2,
      "type": "b256",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 3,
      "type": "bool",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 4,
      "type": "enum Error",
      "components": [
        {
          "name": "TradingIsPaused",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidAsset",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "AccessDenied",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NotEnoughFreeCollateral",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "OnlyClearingHouse",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "AmountExceedsTheBalance",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "V_GTDC",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "V_MSAE",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "V_NL",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "ZeroPrice",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "ZeroAmount",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 5,
      "type": "enum PauseError",
      "components": [
        {
          "name": "Paused",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NotPaused",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 6,
      "type": "enum ReentrancyError",
      "components": [
        {
          "name": "NonReentrant",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 7,
      "type": "generic T",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 8,
      "type": "raw untyped ptr",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 9,
      "type": "str",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 10,
      "type": "struct Address",
      "components": [
        {
          "name": "value",
          "type": 2,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 11,
      "type": "struct AssetId",
      "components": [
        {
          "name": "value",
          "type": 2,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 12,
      "type": "struct Bytes",
      "components": [
        {
          "name": "buf",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "len",
          "type": 18,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 13,
      "type": "struct CollateralConfiguration",
      "components": [
        {
          "name": "deposit_cap",
          "type": 18,
          "typeArguments": null
        },
        {
          "name": "collateral_ratio",
          "type": 18,
          "typeArguments": null
        },
        {
          "name": "collateral_scale",
          "type": 18,
          "typeArguments": null
        },
        {
          "name": "discount_ratio",
          "type": 18,
          "typeArguments": null
        },
        {
          "name": "price_feed",
          "type": 2,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 14,
      "type": "struct I64",
      "components": [
        {
          "name": "value",
          "type": 18,
          "typeArguments": null
        },
        {
          "name": "negative",
          "type": 3,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 15,
      "type": "struct RawBytes",
      "components": [
        {
          "name": "ptr",
          "type": 8,
          "typeArguments": null
        },
        {
          "name": "cap",
          "type": 18,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 16,
      "type": "struct RawVec",
      "components": [
        {
          "name": "ptr",
          "type": 8,
          "typeArguments": null
        },
        {
          "name": "cap",
          "type": 18,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        7
      ]
    },
    {
      "typeId": 17,
      "type": "struct Vec",
      "components": [
        {
          "name": "buf",
          "type": 16,
          "typeArguments": [
            {
              "name": "",
              "type": 7,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "len",
          "type": 18,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        7
      ]
    },
    {
      "typeId": 18,
      "type": "u64",
      "components": null,
      "typeParameters": null
    }
  ],
  "functions": [
    {
      "inputs": [
        {
          "name": "address",
          "type": 10,
          "typeArguments": null
        }
      ],
      "name": "add_admin",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "asset_id",
          "type": 11,
          "typeArguments": null
        },
        {
          "name": "configuration",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "add_collateral_configuration",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "deposit_collateral",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "payable",
          "arguments": []
        },
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 10,
          "typeArguments": null
        },
        {
          "name": "token",
          "type": 11,
          "typeArguments": null
        },
        {
          "name": "settlement_amount",
          "type": 18,
          "typeArguments": null
        },
        {
          "name": "price_update_data",
          "type": 17,
          "typeArguments": [
            {
              "name": "",
              "type": 12,
              "typeArguments": null
            }
          ]
        }
      ],
      "name": "liquidate_collateral",
      "output": {
        "name": "",
        "type": 18,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "payable",
          "arguments": []
        },
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "pause_trading",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "address",
          "type": 10,
          "typeArguments": null
        }
      ],
      "name": "remove_admin",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "resume_trading",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "token",
          "type": 11,
          "typeArguments": null
        },
        {
          "name": "price_update_data",
          "type": 17,
          "typeArguments": [
            {
              "name": "",
              "type": 12,
              "typeArguments": null
            }
          ]
        }
      ],
      "name": "withdraw_all",
      "output": {
        "name": "",
        "type": 18,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "payable",
          "arguments": []
        },
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "amount",
          "type": 18,
          "typeArguments": null
        },
        {
          "name": "token",
          "type": 11,
          "typeArguments": null
        },
        {
          "name": "price_update_data",
          "type": 17,
          "typeArguments": [
            {
              "name": "",
              "type": 12,
              "typeArguments": null
            }
          ]
        }
      ],
      "name": "withdraw_collateral",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "payable",
          "arguments": []
        },
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 10,
          "typeArguments": null
        }
      ],
      "name": "get_account_value_and_total_collateral_value",
      "output": {
        "name": "",
        "type": 1,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 10,
          "typeArguments": null
        },
        {
          "name": "token",
          "type": 11,
          "typeArguments": null
        }
      ],
      "name": "get_collateral_balance",
      "output": {
        "name": "",
        "type": 18,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 10,
          "typeArguments": null
        }
      ],
      "name": "get_free_collateral",
      "output": {
        "name": "",
        "type": 18,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 10,
          "typeArguments": null
        },
        {
          "name": "token",
          "type": 11,
          "typeArguments": null
        }
      ],
      "name": "get_free_collateral_by_token",
      "output": {
        "name": "",
        "type": 18,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 10,
          "typeArguments": null
        }
      ],
      "name": "get_non_settlement_token_balance",
      "output": {
        "name": "",
        "type": 18,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 10,
          "typeArguments": null
        }
      ],
      "name": "has_non_settlement_token",
      "output": {
        "name": "",
        "type": 3,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "token",
          "type": 11,
          "typeArguments": null
        }
      ],
      "name": "is_allowed_collateral",
      "output": {
        "name": "",
        "type": 3,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 10,
          "typeArguments": null
        }
      ],
      "name": "is_liquidatable",
      "output": {
        "name": "",
        "type": 3,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    }
  ],
  "loggedTypes": [
    {
      "logId": 0,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 1,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 2,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 3,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 4,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 5,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 6,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 7,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 8,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 9,
      "loggedType": {
        "name": "",
        "type": 9,
        "typeArguments": null
      }
    },
    {
      "logId": 10,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 11,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 12,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 13,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 14,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 15,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 16,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 17,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 18,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 19,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 20,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 21,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 22,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 23,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 24,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 25,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 26,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 27,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 28,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 29,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 30,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 31,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 32,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 33,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    }
  ],
  "messagesTypes": [],
  "configurables": [
    {
      "name": "OWNER",
      "configurableType": {
        "name": "",
        "type": 10,
        "typeArguments": []
      },
      "offset": 208696
    },
    {
      "name": "PROXY_ADDRESS",
      "configurableType": {
        "name": "",
        "type": 10,
        "typeArguments": []
      },
      "offset": 209032
    },
    {
      "name": "SETTLEMENT_TOKEN",
      "configurableType": {
        "name": "",
        "type": 11,
        "typeArguments": []
      },
      "offset": 208928
    }
  ]
};
var _storageSlots4 = [];
var _VaultAbi__factory = class _VaultAbi__factory {
  static createInterface() {
    return new Interface(_abi4);
  }
  static connect(id, accountOrProvider) {
    return new Contract(id, _abi4, accountOrProvider);
  }
  static async deployContract(bytecode, wallet, options = {}) {
    const factory = new ContractFactory(bytecode, _abi4, wallet);
    const { storageSlots } = _VaultAbi__factory;
    const contract = await factory.deployContract({
      storageSlots,
      ...options
    });
    return contract;
  }
};
_VaultAbi__factory.abi = _abi4;
_VaultAbi__factory.storageSlots = _storageSlots4;
var VaultAbi__factory = _VaultAbi__factory;

// src/utils/convertI64ToBn.ts
var convertI64ToBn = (input) => {
  return new BN_default(input.value.toString()).multipliedBy(input.negative ? -1 : 1);
};

// src/utils/getUnixTime.ts
function getUnixTime(time) {
  const date = new Date(time);
  return Math.floor(date.getTime() / 1e3);
}

// src/utils/Fetch.ts
var Fetch = class {
  constructor(url) {
    this.request = async (endpoint, data) => {
      const response = await fetch(`${this.url}${endpoint}`, data);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    };
    this.post = (endpoint, body, credentials = "same-origin") => {
      return this.request(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
        credentials,
        headers: {
          "Content-Type": "application/json"
        }
      });
    };
    this.get = (endpoint, params = {}) => {
      const validParams = Object.entries(params).filter(
        ([, value]) => Boolean(value)
      );
      const searchParams = new URLSearchParams(validParams);
      return this.request(`${endpoint}?${searchParams.toString()}`, {
        method: "GET"
      });
    };
    this.url = url;
  }
};

// src/IndexerApi.ts
var IndexerApi = class extends Fetch {
  constructor() {
    super(...arguments);
    this.getSpotMarketCreateEvents = async () => {
      return this.get("/spot/marketCreateEvents");
    };
    this.getSpotMarketCreateEventsById = async (id) => {
      return this.get(`/spot/marketCreateEvents/${id}`);
    };
    this.getSpotOrders = async (params) => {
      const paramsCopy = {
        ...params,
        orderType: params.orderType ? params.orderType.toLowerCase() : void 0,
        isOpened: params.isOpened ? String(params.isOpened) : void 0
      };
      return this.get("/spot/orders", paramsCopy);
    };
    this.getSpotOrdersById = async (id) => {
      return this.get(`/spot/orders/${id}`);
    };
    this.getSpotOrderChangeEvents = async () => {
      return this.get("/spot/orderChangeEvents");
    };
    this.getSpotOrderChangeEventsById = async (id) => {
      return this.get(`/spot/ordersChangeEvents/${id}`);
    };
    this.getSpotTradeEvents = async (params) => {
      return this.get("/spot/tradeEvents", params);
    };
    this.getSpotTradeEventsById = async (id) => {
      return this.get(`/spot/tradeEvents/${id}`);
    };
    this.getSpotVolume = async () => {
      return this.get("/spot/statistics");
    };
  }
};

// src/ReadActions.ts
var ReadActions = class {
  constructor(url) {
    this.fetchWalletBalance = async (assetId, options) => {
      const bn = await options.wallet.getBalance(assetId);
      return bn.toString();
    };
    this.fetchSpotMarkets = async (limit) => {
      const data = await this.indexerApi.getSpotMarketCreateEvents();
      const markets = data.map((market) => ({
        id: market.asset_id,
        assetId: market.asset_id,
        decimal: Number(market.asset_decimals)
      }));
      return markets;
    };
    this.fetchSpotMarketPrice = async (baseToken) => {
      console.warn("[fetchMarketPrice] NOT IMPLEMENTED FOR FUEL");
      return BN_default.ZERO;
    };
    this.fetchSpotOrders = async ({
      baseToken,
      type,
      limit,
      trader,
      isActive
    }) => {
      const traderAddress = trader ? new Address(trader).toB256() : void 0;
      const data = await this.indexerApi.getSpotOrders({
        baseToken,
        orderType: type,
        limit,
        trader: traderAddress,
        isOpened: isActive
      });
      const orders = data.map((order) => {
        const baseSize = new BN_default(order.base_size);
        const basePrice = new BN_default(order.base_price);
        return {
          id: order.order_id,
          baseToken: order.base_token,
          trader: order.trader,
          baseSize,
          orderPrice: basePrice,
          blockTimestamp: getUnixTime(order.createdAt)
        };
      });
      return orders;
    };
    this.fetchSpotTrades = async ({
      baseToken,
      limit,
      trader
    }) => {
      const traderAddress = trader ? new Address(trader).toB256() : void 0;
      const data = await this.indexerApi.getSpotTradeEvents({
        limit,
        trader: traderAddress,
        baseToken
      });
      return data.map((trade) => ({
        baseToken: trade.base_token,
        buyer: trade.buyer,
        id: String(trade.id),
        matcher: trade.order_matcher,
        seller: trade.seller,
        tradeAmount: new BN_default(trade.trade_size),
        price: new BN_default(trade.trade_price),
        timestamp: getUnixTime(trade.createdAt)
      }));
    };
    this.fetchSpotVolume = async () => {
      const data = await this.indexerApi.getSpotVolume();
      return {
        volume: new BN_default(data.volume24h),
        high: new BN_default(data.high24h),
        low: new BN_default(data.low24h)
      };
    };
    this.fetchSpotOrderById = async (orderId) => {
      const order = await this.indexerApi.getSpotOrdersById(orderId);
      const baseSize = new BN_default(order.base_size);
      const basePrice = new BN_default(order.base_price);
      return {
        id: order.order_id,
        baseToken: order.base_token,
        trader: order.trader,
        baseSize,
        orderPrice: basePrice
      };
    };
    this.fetchPerpCollateralBalance = async (accountAddress, assetAddress, options) => {
      const vaultFactory = VaultAbi__factory.connect(
        options.contractAddresses.vault,
        options.wallet
      );
      const addressInput = {
        value: new Address(accountAddress).toB256()
      };
      const assetIdInput = {
        value: assetAddress
      };
      const result = await vaultFactory.functions.get_collateral_balance(addressInput, assetIdInput).get();
      const collateralBalance = new BN_default(result.value.toString());
      return collateralBalance;
    };
    this.fetchPerpAllTraderPositions = async (accountAddress, options) => {
      const accountBalanceFactory = AccountBalanceAbi__factory.connect(
        options.contractAddresses.accountBalance,
        options.wallet
      );
      const addressInput = {
        value: new Address(accountAddress).toB256()
      };
      const result = await accountBalanceFactory.functions.get_all_trader_positions(addressInput).get();
      const positions = result.value.map(([assetAddress, accountBalance]) => ({
        baseTokenAddress: assetAddress.value,
        lastTwPremiumGrowthGlobal: convertI64ToBn(
          accountBalance.last_tw_premium_growth_global
        ),
        takerOpenNational: convertI64ToBn(accountBalance.taker_open_notional),
        takerPositionSize: convertI64ToBn(accountBalance.taker_position_size)
      }));
      return positions;
    };
    this.fetchPerpMarketPrice = async (assetAddress, options) => {
      const perpMarketFactory = PerpMarketAbi__factory.connect(
        options.contractAddresses.perpMarket,
        options.wallet
      );
      const assetIdInput = {
        value: assetAddress
      };
      const result = await perpMarketFactory.functions.get_market_price(assetIdInput).get();
      const marketPrice = new BN_default(result.value.toString());
      return marketPrice;
    };
    this.fetchPerpFundingRate = async (assetAddress, options) => {
      const accountBalanceFactory = AccountBalanceAbi__factory.connect(
        options.contractAddresses.accountBalance,
        options.wallet
      );
      const assetIdInput = {
        value: assetAddress
      };
      const result = await accountBalanceFactory.functions.get_funding_rate(assetIdInput).get();
      const fundingRate = convertI64ToBn(result.value);
      return fundingRate;
    };
    this.fetchPerpFreeCollateral = async (accountAddress, options) => {
      const vaultFactory = VaultAbi__factory.connect(
        options.contractAddresses.vault,
        options.wallet
      );
      const addressInput = {
        value: new Address(accountAddress).toB256()
      };
      const result = await vaultFactory.functions.get_free_collateral(addressInput).get();
      const freeCollateral = new BN_default(result.value.toString());
      return freeCollateral;
    };
    this.fetchPerpMarket = async (baseAsset, quoteAsset, options) => {
      const clearingHouseFactory = ClearingHouseAbi__factory.connect(
        options.contractAddresses.clearingHouse,
        options.wallet
      );
      const assetIdInput = {
        value: baseAsset.address
      };
      const result = await clearingHouseFactory.functions.get_market(assetIdInput).get();
      const pausedIndexPrice = result.value.paused_index_price ? new BN_default(result.value.paused_index_price.toString()) : void 0;
      const pausedTimestamp = result.value.paused_timestamp ? new BN_default(result.value.paused_timestamp.toString()).toNumber() : void 0;
      const closedPrice = result.value.closed_price ? new BN_default(result.value.closed_price.toString()) : void 0;
      const perpMarket = {
        baseTokenAddress: result.value.asset_id.value,
        quoteTokenAddress: quoteAsset.address,
        imRatio: new BN_default(result.value.im_ratio.toString()),
        mmRatio: new BN_default(result.value.mm_ratio.toString()),
        status: result.value.status,
        pausedIndexPrice,
        pausedTimestamp,
        closedPrice
      };
      return perpMarket;
    };
    this.fetchPerpAllMarkets = async (assets, quoteAsset, options) => {
      const markets = [];
      for (const token of assets) {
        try {
          const market = await this.fetchPerpMarket(token, quoteAsset, options);
          markets.push(market);
        } catch {
        }
      }
      return markets;
    };
    this.fetchPerpPendingFundingPayment = async (accountAddress, assetAddress, options) => {
      const accountBalanceFactory = AccountBalanceAbi__factory.connect(
        options.contractAddresses.accountBalance,
        options.wallet
      );
      const addressInput = {
        value: new Address(accountAddress).toB256()
      };
      const assetIdInput = {
        value: assetAddress
      };
      const result = await accountBalanceFactory.functions.get_pending_funding_payment(addressInput, assetIdInput).get();
      const fundingPayment = convertI64ToBn(result.value[0]);
      const fundingGrowthPayment = convertI64ToBn(result.value[1]);
      return { fundingPayment, fundingGrowthPayment };
    };
    this.fetchPerpIsAllowedCollateral = async (assetAddress, options) => {
      const vaultFactory = VaultAbi__factory.connect(
        options.contractAddresses.vault,
        options.wallet
      );
      const assetIdInput = {
        value: assetAddress
      };
      const result = await vaultFactory.functions.is_allowed_collateral(assetIdInput).get();
      return result.value;
    };
    this.fetchPerpTraderOrders = async (accountAddress, assetAddress, options) => {
      const vaultFactory = PerpMarketAbi__factory.connect(
        options.contractAddresses.perpMarket,
        options.wallet
      );
      const addressInput = {
        value: new Address(accountAddress).toB256()
      };
      const assetIdInput = {
        value: assetAddress
      };
      const result = await vaultFactory.functions.get_trader_orders(addressInput, assetIdInput).get();
      const orders = result.value.map((order) => ({
        id: order.id,
        baseSize: convertI64ToBn(order.base_size),
        baseTokenAddress: order.base_token.value,
        orderPrice: new BN_default(order.order_price.toString()),
        trader: order.trader.value
      }));
      return orders;
    };
    this.fetchPerpMaxAbsPositionSize = async (accountAddress, assetAddress, tradePrice, options) => {
      const clearingHouseFactory = ClearingHouseAbi__factory.connect(
        options.contractAddresses.clearingHouse,
        options.wallet
      );
      const addressInput = {
        value: new Address(accountAddress).toB256()
      };
      const assetIdInput = {
        value: assetAddress
      };
      const result = await clearingHouseFactory.functions.get_max_abs_position_size(addressInput, assetIdInput, tradePrice).get();
      const shortSize = new BN_default(result.value[0].toString());
      const longSize = new BN_default(result.value[0].toString());
      return { shortSize, longSize };
    };
    this.fetchPerpMarkPrice = async (assetAddress, options) => {
      const vaultFactory = PerpMarketAbi__factory.connect(
        options.contractAddresses.perpMarket,
        options.wallet
      );
      const assetIdInput = {
        value: assetAddress
      };
      const result = await vaultFactory.functions.get_mark_price(assetIdInput).get();
      const markPrice = new BN_default(result.value.toString());
      return markPrice;
    };
    this.indexerApi = new IndexerApi(url);
  }
};
var _abi5 = {
  "types": [
    {
      "typeId": 0,
      "type": "()",
      "components": [],
      "typeParameters": null
    },
    {
      "typeId": 1,
      "type": "(_, _, _)",
      "components": [
        {
          "name": "__tuple_element",
          "type": 12,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 22,
          "typeArguments": null
        },
        {
          "name": "__tuple_element",
          "type": 22,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 2,
      "type": "b256",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 3,
      "type": "bool",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 4,
      "type": "enum Error",
      "components": [
        {
          "name": "AccessDenied",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NoOrdersFound",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NoMarketFound",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "OrdersCantBeMatched",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "FirstArgumentShouldBeOrderSellSecondOrderBuy",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "ZeroAssetAmountToSend",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "MarketAlreadyExists",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "BadAsset",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "BadValue",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "BadPrice",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "BaseSizeIsZero",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "CannotRemoveOrderIndex",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "CannotRemoveOrderByTrader",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "CannotRemoveOrder",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 5,
      "type": "enum Identity",
      "components": [
        {
          "name": "Address",
          "type": 11,
          "typeArguments": null
        },
        {
          "name": "ContractId",
          "type": 13,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 6,
      "type": "enum Option",
      "components": [
        {
          "name": "None",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "Some",
          "type": 9,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        9
      ]
    },
    {
      "typeId": 7,
      "type": "enum OrderChangeEventIdentifier",
      "components": [
        {
          "name": "OrderOpenEvent",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "OrderCancelEvent",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "OrderMatchEvent",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 8,
      "type": "enum ReentrancyError",
      "components": [
        {
          "name": "NonReentrant",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 9,
      "type": "generic T",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 10,
      "type": "raw untyped ptr",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 11,
      "type": "struct Address",
      "components": [
        {
          "name": "value",
          "type": 2,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 12,
      "type": "struct AssetId",
      "components": [
        {
          "name": "value",
          "type": 2,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 13,
      "type": "struct ContractId",
      "components": [
        {
          "name": "value",
          "type": 2,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 14,
      "type": "struct I64",
      "components": [
        {
          "name": "value",
          "type": 23,
          "typeArguments": null
        },
        {
          "name": "negative",
          "type": 3,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 15,
      "type": "struct Market",
      "components": [
        {
          "name": "asset_id",
          "type": 12,
          "typeArguments": null
        },
        {
          "name": "asset_decimals",
          "type": 22,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 16,
      "type": "struct MarketCreateEvent",
      "components": [
        {
          "name": "asset_id",
          "type": 12,
          "typeArguments": null
        },
        {
          "name": "asset_decimals",
          "type": 22,
          "typeArguments": null
        },
        {
          "name": "timestamp",
          "type": 23,
          "typeArguments": null
        },
        {
          "name": "tx_id",
          "type": 2,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 17,
      "type": "struct Order",
      "components": [
        {
          "name": "id",
          "type": 2,
          "typeArguments": null
        },
        {
          "name": "trader",
          "type": 11,
          "typeArguments": null
        },
        {
          "name": "base_token",
          "type": 12,
          "typeArguments": null
        },
        {
          "name": "base_size",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "base_price",
          "type": 23,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 18,
      "type": "struct OrderChangeEvent",
      "components": [
        {
          "name": "order_id",
          "type": 2,
          "typeArguments": null
        },
        {
          "name": "sender",
          "type": 5,
          "typeArguments": null
        },
        {
          "name": "timestamp",
          "type": 23,
          "typeArguments": null
        },
        {
          "name": "identifier",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "tx_id",
          "type": 2,
          "typeArguments": null
        },
        {
          "name": "order",
          "type": 6,
          "typeArguments": [
            {
              "name": "",
              "type": 17,
              "typeArguments": null
            }
          ]
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 19,
      "type": "struct RawVec",
      "components": [
        {
          "name": "ptr",
          "type": 10,
          "typeArguments": null
        },
        {
          "name": "cap",
          "type": 23,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        9
      ]
    },
    {
      "typeId": 20,
      "type": "struct TradeEvent",
      "components": [
        {
          "name": "base_token",
          "type": 12,
          "typeArguments": null
        },
        {
          "name": "order_matcher",
          "type": 11,
          "typeArguments": null
        },
        {
          "name": "seller",
          "type": 11,
          "typeArguments": null
        },
        {
          "name": "buyer",
          "type": 11,
          "typeArguments": null
        },
        {
          "name": "trade_size",
          "type": 23,
          "typeArguments": null
        },
        {
          "name": "trade_price",
          "type": 23,
          "typeArguments": null
        },
        {
          "name": "sell_order_id",
          "type": 2,
          "typeArguments": null
        },
        {
          "name": "buy_order_id",
          "type": 2,
          "typeArguments": null
        },
        {
          "name": "timestamp",
          "type": 23,
          "typeArguments": null
        },
        {
          "name": "tx_id",
          "type": 2,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 21,
      "type": "struct Vec",
      "components": [
        {
          "name": "buf",
          "type": 19,
          "typeArguments": [
            {
              "name": "",
              "type": 9,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "len",
          "type": 23,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        9
      ]
    },
    {
      "typeId": 22,
      "type": "u32",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 23,
      "type": "u64",
      "components": null,
      "typeParameters": null
    }
  ],
  "functions": [
    {
      "inputs": [
        {
          "name": "order_id",
          "type": 2,
          "typeArguments": null
        }
      ],
      "name": "cancel_order",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "asset_id",
          "type": 12,
          "typeArguments": null
        },
        {
          "name": "asset_decimals",
          "type": 22,
          "typeArguments": null
        }
      ],
      "name": "create_market",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "get_configurables",
      "output": {
        "name": "",
        "type": 1,
        "typeArguments": null
      },
      "attributes": null
    },
    {
      "inputs": [
        {
          "name": "asset_id",
          "type": 12,
          "typeArguments": null
        }
      ],
      "name": "get_market_by_id",
      "output": {
        "name": "",
        "type": 15,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "order",
          "type": 2,
          "typeArguments": null
        }
      ],
      "name": "get_order_change_events_by_order",
      "output": {
        "name": "",
        "type": 21,
        "typeArguments": [
          {
            "name": "",
            "type": 18,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "asset_id",
          "type": 12,
          "typeArguments": null
        }
      ],
      "name": "market_exists",
      "output": {
        "name": "",
        "type": 3,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "order_sell_id",
          "type": 2,
          "typeArguments": null
        },
        {
          "name": "order_buy_id",
          "type": 2,
          "typeArguments": null
        }
      ],
      "name": "match_orders",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_token",
          "type": 12,
          "typeArguments": null
        },
        {
          "name": "base_size",
          "type": 14,
          "typeArguments": null
        },
        {
          "name": "base_price",
          "type": 23,
          "typeArguments": null
        }
      ],
      "name": "open_order",
      "output": {
        "name": "",
        "type": 2,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        },
        {
          "name": "payable",
          "arguments": []
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "order",
          "type": 2,
          "typeArguments": null
        }
      ],
      "name": "order_by_id",
      "output": {
        "name": "",
        "type": 6,
        "typeArguments": [
          {
            "name": "",
            "type": 17,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 11,
          "typeArguments": null
        }
      ],
      "name": "orders_by_trader",
      "output": {
        "name": "",
        "type": 21,
        "typeArguments": [
          {
            "name": "",
            "type": 2,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    }
  ],
  "loggedTypes": [
    {
      "logId": 0,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 1,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 2,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 3,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 4,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 5,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 6,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 7,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 8,
      "loggedType": {
        "name": "",
        "type": 18,
        "typeArguments": []
      }
    },
    {
      "logId": 9,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 10,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 11,
      "loggedType": {
        "name": "",
        "type": 16,
        "typeArguments": []
      }
    },
    {
      "logId": 12,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 13,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 14,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 15,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 16,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 17,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 18,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 19,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 20,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 21,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 22,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 23,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 24,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 25,
      "loggedType": {
        "name": "",
        "type": 18,
        "typeArguments": []
      }
    },
    {
      "logId": 26,
      "loggedType": {
        "name": "",
        "type": 18,
        "typeArguments": []
      }
    },
    {
      "logId": 27,
      "loggedType": {
        "name": "",
        "type": 20,
        "typeArguments": []
      }
    },
    {
      "logId": 28,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 29,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 30,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 31,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 32,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 33,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 34,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 35,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 36,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 37,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 38,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 39,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 40,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 41,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 42,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 43,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 44,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 45,
      "loggedType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      }
    },
    {
      "logId": 46,
      "loggedType": {
        "name": "",
        "type": 18,
        "typeArguments": []
      }
    }
  ],
  "messagesTypes": [],
  "configurables": [
    {
      "name": "QUOTE_TOKEN",
      "configurableType": {
        "name": "",
        "type": 12,
        "typeArguments": []
      },
      "offset": 115076
    },
    {
      "name": "QUOTE_TOKEN_DECIMALS",
      "configurableType": {
        "name": "",
        "type": 22,
        "typeArguments": null
      },
      "offset": 115012
    },
    {
      "name": "PRICE_DECIMALS",
      "configurableType": {
        "name": "",
        "type": 22,
        "typeArguments": null
      },
      "offset": 114996
    }
  ]
};
var OrderbookAbi__factory = class {
  static createInterface() {
    return new Interface(_abi5);
  }
  static connect(id, accountOrProvider) {
    return new Contract(id, _abi5, accountOrProvider);
  }
};
OrderbookAbi__factory.abi = _abi5;
var _abi6 = {
  "types": [
    {
      "typeId": 0,
      "type": "()",
      "components": [],
      "typeParameters": null
    },
    {
      "typeId": 1,
      "type": "b256",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 2,
      "type": "bool",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 3,
      "type": "enum Error",
      "components": [
        {
          "name": "AccessDenied",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidPythFeePayment",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "DebugModeRequired",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 4,
      "type": "enum Option",
      "components": [
        {
          "name": "None",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "Some",
          "type": 5,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        5
      ]
    },
    {
      "typeId": 5,
      "type": "generic T",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 6,
      "type": "raw untyped ptr",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 7,
      "type": "struct Address",
      "components": [
        {
          "name": "value",
          "type": 1,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 8,
      "type": "struct AssetId",
      "components": [
        {
          "name": "value",
          "type": 1,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 9,
      "type": "struct Bytes",
      "components": [
        {
          "name": "buf",
          "type": 11,
          "typeArguments": null
        },
        {
          "name": "len",
          "type": 15,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 10,
      "type": "struct I64",
      "components": [
        {
          "name": "value",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "negative",
          "type": 2,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 11,
      "type": "struct RawBytes",
      "components": [
        {
          "name": "ptr",
          "type": 6,
          "typeArguments": null
        },
        {
          "name": "cap",
          "type": 15,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 12,
      "type": "struct RawVec",
      "components": [
        {
          "name": "ptr",
          "type": 6,
          "typeArguments": null
        },
        {
          "name": "cap",
          "type": 15,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        5
      ]
    },
    {
      "typeId": 13,
      "type": "struct SparkContracts",
      "components": [
        {
          "name": "version",
          "type": 15,
          "typeArguments": null
        },
        {
          "name": "account_balance_address",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "clearing_house_address",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "insurance_fund_address",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "treasury_address",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "perp_market_address",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "vault_address",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "pyth_address",
          "type": 7,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 14,
      "type": "struct Vec",
      "components": [
        {
          "name": "buf",
          "type": 12,
          "typeArguments": [
            {
              "name": "",
              "type": 5,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "len",
          "type": 15,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        5
      ]
    },
    {
      "typeId": 15,
      "type": "u64",
      "components": null,
      "typeParameters": null
    }
  ],
  "functions": [
    {
      "inputs": [],
      "name": "debug_increment_timestamp",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "trader",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "amount",
          "type": 10,
          "typeArguments": null
        }
      ],
      "name": "debug_modify_owed_realized_pnl",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "price_feed",
          "type": 1,
          "typeArguments": null
        },
        {
          "name": "price",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "debug_set_price",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "base_token",
          "type": 8,
          "typeArguments": null
        },
        {
          "name": "current_twap",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "debug_setup_twap",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "account_balance_address",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "clearing_house_address",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "insurance_fund_address",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "treasury_address",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "perp_market_address",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "vault_address",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "pyth_address",
          "type": 7,
          "typeArguments": null
        }
      ],
      "name": "publish_new_version",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "get_all_spark_contracts_versions",
      "output": {
        "name": "",
        "type": 14,
        "typeArguments": [
          {
            "name": "",
            "type": 13,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "price_feed",
          "type": 1,
          "typeArguments": null
        }
      ],
      "name": "get_price",
      "output": {
        "name": "",
        "type": 15,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "get_spark_contracts",
      "output": {
        "name": "",
        "type": 13,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "version",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "get_spark_contracts_by_version",
      "output": {
        "name": "",
        "type": 13,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "timestamp",
      "output": {
        "name": "",
        "type": 15,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "price_update_data",
          "type": 14,
          "typeArguments": [
            {
              "name": "",
              "type": 9,
              "typeArguments": null
            }
          ]
        }
      ],
      "name": "update_price",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        },
        {
          "name": "payable",
          "arguments": []
        }
      ]
    },
    {
      "inputs": [],
      "name": "version",
      "output": {
        "name": "",
        "type": 15,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    }
  ],
  "loggedTypes": [
    {
      "logId": 0,
      "loggedType": {
        "name": "",
        "type": 3,
        "typeArguments": []
      }
    },
    {
      "logId": 1,
      "loggedType": {
        "name": "",
        "type": 3,
        "typeArguments": []
      }
    },
    {
      "logId": 2,
      "loggedType": {
        "name": "",
        "type": 3,
        "typeArguments": []
      }
    },
    {
      "logId": 3,
      "loggedType": {
        "name": "",
        "type": 3,
        "typeArguments": []
      }
    },
    {
      "logId": 4,
      "loggedType": {
        "name": "",
        "type": 3,
        "typeArguments": []
      }
    },
    {
      "logId": 5,
      "loggedType": {
        "name": "",
        "type": 3,
        "typeArguments": []
      }
    }
  ],
  "messagesTypes": [],
  "configurables": [
    {
      "name": "OWNER",
      "configurableType": {
        "name": "",
        "type": 7,
        "typeArguments": []
      },
      "offset": 20548
    },
    {
      "name": "DEBUG_STEP",
      "configurableType": {
        "name": "",
        "type": 4,
        "typeArguments": [
          {
            "name": "",
            "type": 15,
            "typeArguments": null
          }
        ]
      },
      "offset": 20300
    }
  ]
};
var _storageSlots5 = [
  {
    "key": "b48b753af346966d0d169c0b2e3234611f65d5cfdb57c7b6e7cd6ca93707bee0",
    "value": "0000000000000000000000000000000000000000000000000000000000000000"
  },
  {
    "key": "f383b0ce51358be57daa3b725fe44acdb2d880604e367199080b4379c41bb6ed",
    "value": "0000000000000000000000000000000000000000000000000000000000000000"
  }
];
var _ProxyAbi__factory = class _ProxyAbi__factory {
  static createInterface() {
    return new Interface(_abi6);
  }
  static connect(id, accountOrProvider) {
    return new Contract(id, _abi6, accountOrProvider);
  }
  static async deployContract(bytecode, wallet, options = {}) {
    const factory = new ContractFactory(bytecode, _abi6, wallet);
    const { storageSlots } = _ProxyAbi__factory;
    const contract = await factory.deployContract({
      storageSlots,
      ...options
    });
    return contract;
  }
};
_ProxyAbi__factory.abi = _abi6;
_ProxyAbi__factory.storageSlots = _storageSlots5;
var ProxyAbi__factory = _ProxyAbi__factory;
var _abi7 = {
  "types": [
    {
      "typeId": 0,
      "type": "()",
      "components": [],
      "typeParameters": null
    },
    {
      "typeId": 1,
      "type": "b256",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 2,
      "type": "bool",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 3,
      "type": "enum AccessError",
      "components": [
        {
          "name": "NotOwner",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 4,
      "type": "enum Identity",
      "components": [
        {
          "name": "Address",
          "type": 11,
          "typeArguments": null
        },
        {
          "name": "ContractId",
          "type": 14,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 5,
      "type": "enum InitializationError",
      "components": [
        {
          "name": "CannotReinitialized",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 6,
      "type": "enum PythError",
      "components": [
        {
          "name": "FeesCanOnlyBePaidInTheBaseAsset",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "GuardianSetNotFound",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "IncorrectMessageType",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InsufficientFee",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidArgument",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidAttestationSize",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidDataSourcesLength",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidExponent",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidHeaderSize",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidMagic",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidMajorVersion",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidMinorVersion",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidPayloadId",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidPayloadLength",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidPriceFeedDataLength",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidProof",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidUpdateData",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidUpdateDataLength",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidUpdateDataSource",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidUpgradeModule",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "LengthOfPriceFeedIdsAndPublishTimesMustMatch",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NewGuardianSetIsEmpty",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NumberOfUpdatesIrretrievable",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "OutdatedPrice",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "PriceFeedNotFound",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "PriceFeedNotFoundWithinRange",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "WormholeGovernanceActionNotFound",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 7,
      "type": "enum State",
      "components": [
        {
          "name": "Uninitialized",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "Initialized",
          "type": 4,
          "typeArguments": null
        },
        {
          "name": "Revoked",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 8,
      "type": "enum WormholeError",
      "components": [
        {
          "name": "ConsistencyLevelIrretrievable",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "GovernanceActionAlreadyConsumed",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "GuardianIndexIrretrievable",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "GuardianSetHasExpired",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "GuardianSetKeyIrretrievable",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "GuardianSetNotFound",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidGovernanceAction",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidGovernanceChain",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidGovernanceContract",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidGuardianSet",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidGuardianSetKeysLength",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidGuardianSetUpgrade",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidGuardianSetUpgradeLength",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidModule",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidPayloadLength",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidSignatureLength",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "InvalidUpdateDataSource",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NewGuardianSetIsEmpty",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NewGuardianSetIndexIsInvalid",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NoQuorum",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "NotSignedByCurrentGuardianSet",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "SignatureInvalid",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "SignatureIndicesNotAscending",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "SignatureVIrretrievable",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "SignersLengthIrretrievable",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "VMSignatureInvalid",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "VMVersionIncompatible",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 9,
      "type": "generic T",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 10,
      "type": "raw untyped ptr",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 11,
      "type": "struct Address",
      "components": [
        {
          "name": "value",
          "type": 1,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 12,
      "type": "struct Bytes",
      "components": [
        {
          "name": "buf",
          "type": 22,
          "typeArguments": null
        },
        {
          "name": "len",
          "type": 28,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 13,
      "type": "struct ConstructedEvent",
      "components": [
        {
          "name": "guardian_set_index",
          "type": 27,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 14,
      "type": "struct ContractId",
      "components": [
        {
          "name": "value",
          "type": 1,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 15,
      "type": "struct DataSource",
      "components": [
        {
          "name": "chain_id",
          "type": 26,
          "typeArguments": null
        },
        {
          "name": "emitter_address",
          "type": 1,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 16,
      "type": "struct GuardianSet",
      "components": [
        {
          "name": "expiration_time",
          "type": 28,
          "typeArguments": null
        },
        {
          "name": "keys",
          "type": 24,
          "typeArguments": [
            {
              "name": "",
              "type": 1,
              "typeArguments": null
            }
          ]
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 17,
      "type": "struct NewGuardianSetEvent",
      "components": [
        {
          "name": "governance_action_hash",
          "type": 1,
          "typeArguments": null
        },
        {
          "name": "new_guardian_set_index",
          "type": 27,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 18,
      "type": "struct OwnershipRenounced",
      "components": [
        {
          "name": "previous_owner",
          "type": 4,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 19,
      "type": "struct OwnershipSet",
      "components": [
        {
          "name": "new_owner",
          "type": 4,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 20,
      "type": "struct Price",
      "components": [
        {
          "name": "confidence",
          "type": 28,
          "typeArguments": null
        },
        {
          "name": "exponent",
          "type": 27,
          "typeArguments": null
        },
        {
          "name": "price",
          "type": 28,
          "typeArguments": null
        },
        {
          "name": "publish_time",
          "type": 28,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 21,
      "type": "struct PriceFeed",
      "components": [
        {
          "name": "ema_price",
          "type": 20,
          "typeArguments": null
        },
        {
          "name": "id",
          "type": 1,
          "typeArguments": null
        },
        {
          "name": "price",
          "type": 20,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 22,
      "type": "struct RawBytes",
      "components": [
        {
          "name": "ptr",
          "type": 10,
          "typeArguments": null
        },
        {
          "name": "cap",
          "type": 28,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 23,
      "type": "struct RawVec",
      "components": [
        {
          "name": "ptr",
          "type": 10,
          "typeArguments": null
        },
        {
          "name": "cap",
          "type": 28,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        9
      ]
    },
    {
      "typeId": 24,
      "type": "struct Vec",
      "components": [
        {
          "name": "buf",
          "type": 23,
          "typeArguments": [
            {
              "name": "",
              "type": 9,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "len",
          "type": 28,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        9
      ]
    },
    {
      "typeId": 25,
      "type": "struct WormholeProvider",
      "components": [
        {
          "name": "governance_chain_id",
          "type": 26,
          "typeArguments": null
        },
        {
          "name": "governance_contract",
          "type": 1,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 26,
      "type": "u16",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 27,
      "type": "u32",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 28,
      "type": "u64",
      "components": null,
      "typeParameters": null
    }
  ],
  "functions": [
    {
      "inputs": [],
      "name": "owner",
      "output": {
        "name": "",
        "type": 7,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "price_feed_id",
          "type": 1,
          "typeArguments": null
        }
      ],
      "name": "ema_price",
      "output": {
        "name": "",
        "type": 20,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "time_period",
          "type": 28,
          "typeArguments": null
        },
        {
          "name": "price_feed_id",
          "type": 1,
          "typeArguments": null
        }
      ],
      "name": "ema_price_no_older_than",
      "output": {
        "name": "",
        "type": 20,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "price_feed_id",
          "type": 1,
          "typeArguments": null
        }
      ],
      "name": "ema_price_unsafe",
      "output": {
        "name": "",
        "type": 20,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "max_publish_time",
          "type": 28,
          "typeArguments": null
        },
        {
          "name": "min_publish_time",
          "type": 28,
          "typeArguments": null
        },
        {
          "name": "target_price_feed_ids",
          "type": 24,
          "typeArguments": [
            {
              "name": "",
              "type": 1,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "update_data",
          "type": 24,
          "typeArguments": [
            {
              "name": "",
              "type": 12,
              "typeArguments": null
            }
          ]
        }
      ],
      "name": "parse_price_feed_updates",
      "output": {
        "name": "",
        "type": 24,
        "typeArguments": [
          {
            "name": "",
            "type": 21,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "payable",
          "arguments": []
        },
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "price_feed_id",
          "type": 1,
          "typeArguments": null
        }
      ],
      "name": "price",
      "output": {
        "name": "",
        "type": 20,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "time_period",
          "type": 28,
          "typeArguments": null
        },
        {
          "name": "price_feed_id",
          "type": 1,
          "typeArguments": null
        }
      ],
      "name": "price_no_older_than",
      "output": {
        "name": "",
        "type": 20,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "price_feed_id",
          "type": 1,
          "typeArguments": null
        }
      ],
      "name": "price_unsafe",
      "output": {
        "name": "",
        "type": 20,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "update_data",
          "type": 24,
          "typeArguments": [
            {
              "name": "",
              "type": 12,
              "typeArguments": null
            }
          ]
        }
      ],
      "name": "update_fee",
      "output": {
        "name": "",
        "type": 28,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "update_data",
          "type": 24,
          "typeArguments": [
            {
              "name": "",
              "type": 12,
              "typeArguments": null
            }
          ]
        }
      ],
      "name": "update_price_feeds",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        },
        {
          "name": "payable",
          "arguments": []
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "price_feed_ids",
          "type": 24,
          "typeArguments": [
            {
              "name": "",
              "type": 1,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "publish_times",
          "type": 24,
          "typeArguments": [
            {
              "name": "",
              "type": 28,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "update_data",
          "type": 24,
          "typeArguments": [
            {
              "name": "",
              "type": 12,
              "typeArguments": null
            }
          ]
        }
      ],
      "name": "update_price_feeds_if_necessary",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "payable",
          "arguments": []
        },
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "valid_time_period",
      "output": {
        "name": "",
        "type": 28,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "data_sources",
          "type": 24,
          "typeArguments": [
            {
              "name": "",
              "type": 15,
              "typeArguments": null
            }
          ]
        },
        {
          "name": "single_update_fee",
          "type": 28,
          "typeArguments": null
        },
        {
          "name": "valid_time_period_seconds",
          "type": 28,
          "typeArguments": null
        },
        {
          "name": "wormhole_guardian_set_upgrade",
          "type": 12,
          "typeArguments": null
        }
      ],
      "name": "constructor",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "price_feed_id",
          "type": 1,
          "typeArguments": null
        }
      ],
      "name": "latest_publish_time",
      "output": {
        "name": "",
        "type": 28,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "price_feed_id",
          "type": 1,
          "typeArguments": null
        }
      ],
      "name": "price_feed_exists",
      "output": {
        "name": "",
        "type": 2,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "price_feed_id",
          "type": 1,
          "typeArguments": null
        }
      ],
      "name": "price_feed_unsafe",
      "output": {
        "name": "",
        "type": 21,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "single_update_fee",
      "output": {
        "name": "",
        "type": 28,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "data_source",
          "type": 15,
          "typeArguments": null
        }
      ],
      "name": "valid_data_source",
      "output": {
        "name": "",
        "type": 2,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "valid_data_sources",
      "output": {
        "name": "",
        "type": 24,
        "typeArguments": [
          {
            "name": "",
            "type": 15,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "current_guardian_set_index",
      "output": {
        "name": "",
        "type": 27,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "current_wormhole_provider",
      "output": {
        "name": "",
        "type": 25,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "governance_action_hash",
          "type": 1,
          "typeArguments": null
        }
      ],
      "name": "governance_action_is_consumed",
      "output": {
        "name": "",
        "type": 2,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "index",
          "type": 27,
          "typeArguments": null
        }
      ],
      "name": "guardian_set",
      "output": {
        "name": "",
        "type": 16,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "encoded_vm",
          "type": 12,
          "typeArguments": null
        }
      ],
      "name": "submit_new_guardian_set",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    }
  ],
  "loggedTypes": [
    {
      "logId": 0,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 1,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 2,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 3,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 4,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 5,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 6,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 7,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 8,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 9,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 10,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 11,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 12,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 13,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 14,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 15,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 16,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 17,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 18,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 19,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 20,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 21,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 22,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 23,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 24,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 25,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 26,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 27,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 28,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 29,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 30,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 31,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 32,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 33,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 34,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 35,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 36,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 37,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 38,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 39,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 40,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 41,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 42,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 43,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 44,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 45,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 46,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 47,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 48,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 49,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 50,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 51,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 52,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 53,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 54,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 55,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 56,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 57,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 58,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 59,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 60,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 61,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 62,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 63,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 64,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 65,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 66,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 67,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 68,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 69,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 70,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 71,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 72,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 73,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 74,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 75,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 76,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 77,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 78,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 79,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 80,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 81,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 82,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 83,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 84,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 85,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 86,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 87,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 88,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 89,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 90,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 91,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 92,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 93,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 94,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 95,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 96,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 97,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 98,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 99,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 100,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 101,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 102,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 103,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 104,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 105,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 106,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 107,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 108,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 109,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 110,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 111,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 112,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 113,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 114,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 115,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 116,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 117,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 118,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 119,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 120,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 121,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 122,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 123,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 124,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 125,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 126,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 127,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 128,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 129,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 130,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 131,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 132,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 133,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 134,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 135,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 136,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 137,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 138,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 139,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 140,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 141,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 142,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 143,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 144,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 145,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 146,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 147,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 148,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 149,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 150,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 151,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 152,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 153,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 154,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 155,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 156,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 157,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 158,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 159,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 160,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 161,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 162,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 163,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 164,
      "loggedType": {
        "name": "",
        "type": 5,
        "typeArguments": []
      }
    },
    {
      "logId": 165,
      "loggedType": {
        "name": "",
        "type": 19,
        "typeArguments": []
      }
    },
    {
      "logId": 166,
      "loggedType": {
        "name": "",
        "type": 3,
        "typeArguments": []
      }
    },
    {
      "logId": 167,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 168,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 169,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 170,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 171,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 172,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 173,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 174,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 175,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 176,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 177,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 178,
      "loggedType": {
        "name": "",
        "type": 3,
        "typeArguments": []
      }
    },
    {
      "logId": 179,
      "loggedType": {
        "name": "",
        "type": 18,
        "typeArguments": []
      }
    },
    {
      "logId": 180,
      "loggedType": {
        "name": "",
        "type": 13,
        "typeArguments": []
      }
    },
    {
      "logId": 181,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 182,
      "loggedType": {
        "name": "",
        "type": 6,
        "typeArguments": []
      }
    },
    {
      "logId": 183,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 184,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 185,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 186,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 187,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 188,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 189,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 190,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 191,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 192,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 193,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 194,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 195,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 196,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 197,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 198,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 199,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 200,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 201,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 202,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 203,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 204,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 205,
      "loggedType": {
        "name": "",
        "type": 8,
        "typeArguments": []
      }
    },
    {
      "logId": 206,
      "loggedType": {
        "name": "",
        "type": 17,
        "typeArguments": []
      }
    }
  ],
  "messagesTypes": [],
  "configurables": [
    {
      "name": "DEPLOYER",
      "configurableType": {
        "name": "",
        "type": 4,
        "typeArguments": []
      },
      "offset": 260776
    }
  ]
};
var _storageSlots6 = [
  {
    "key": "6294951dcb0a9111a517be5cf4785670ff4e166fb5ab9c33b17e6881b48e964f",
    "value": "0000000000000000000000000000000000000000000000000000000000000000"
  },
  {
    "key": "8a89a0cce819e0426e565819a9a98711329087da5a802fb16edd223c47fa44ef",
    "value": "0000000000000000000000000000000000000000000000000000000000000000"
  },
  {
    "key": "a9203bbb8366ca9d708705dce980acbb54d44fb753370ffe4c7d351b46b2abbc",
    "value": "0000000000000000000000000000000000000000000000000000000000000000"
  },
  {
    "key": "a9203bbb8366ca9d708705dce980acbb54d44fb753370ffe4c7d351b46b2abbd",
    "value": "0000000000000000000000000000000000000000000000000000000000000000"
  },
  {
    "key": "b48b753af346966d0d169c0b2e3234611f65d5cfdb57c7b6e7cd6ca93707bee0",
    "value": "0000000000000000000000000000000000000000000000000000000000000000"
  }
];
var _PythContractAbi__factory = class _PythContractAbi__factory {
  static createInterface() {
    return new Interface(_abi7);
  }
  static connect(id, accountOrProvider) {
    return new Contract(id, _abi7, accountOrProvider);
  }
  static async deployContract(bytecode, wallet, options = {}) {
    const factory = new ContractFactory(bytecode, _abi7, wallet);
    const { storageSlots } = _PythContractAbi__factory;
    const contract = await factory.deployContract({
      storageSlots,
      ...options
    });
    return contract;
  }
};
_PythContractAbi__factory.abi = _abi7;
_PythContractAbi__factory.storageSlots = _storageSlots6;
var PythContractAbi__factory = _PythContractAbi__factory;
var _abi8 = {
  "types": [
    {
      "typeId": 0,
      "type": "()",
      "components": [],
      "typeParameters": null
    },
    {
      "typeId": 1,
      "type": "b256",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 2,
      "type": "enum BurnError",
      "components": [
        {
          "name": "NotEnoughCoins",
          "type": 0,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 3,
      "type": "enum Identity",
      "components": [
        {
          "name": "Address",
          "type": 7,
          "typeArguments": null
        },
        {
          "name": "ContractId",
          "type": 10,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 4,
      "type": "enum Option",
      "components": [
        {
          "name": "None",
          "type": 0,
          "typeArguments": null
        },
        {
          "name": "Some",
          "type": 5,
          "typeArguments": null
        }
      ],
      "typeParameters": [
        5
      ]
    },
    {
      "typeId": 5,
      "type": "generic T",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 6,
      "type": "raw untyped ptr",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 7,
      "type": "struct Address",
      "components": [
        {
          "name": "value",
          "type": 1,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 8,
      "type": "struct AssetId",
      "components": [
        {
          "name": "value",
          "type": 1,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 9,
      "type": "struct Bytes",
      "components": [
        {
          "name": "buf",
          "type": 11,
          "typeArguments": null
        },
        {
          "name": "len",
          "type": 13,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 10,
      "type": "struct ContractId",
      "components": [
        {
          "name": "value",
          "type": 1,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 11,
      "type": "struct RawBytes",
      "components": [
        {
          "name": "ptr",
          "type": 6,
          "typeArguments": null
        },
        {
          "name": "cap",
          "type": 13,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 12,
      "type": "struct String",
      "components": [
        {
          "name": "bytes",
          "type": 9,
          "typeArguments": null
        }
      ],
      "typeParameters": null
    },
    {
      "typeId": 13,
      "type": "u64",
      "components": null,
      "typeParameters": null
    },
    {
      "typeId": 14,
      "type": "u8",
      "components": null,
      "typeParameters": null
    }
  ],
  "functions": [
    {
      "inputs": [
        {
          "name": "asset",
          "type": 8,
          "typeArguments": null
        }
      ],
      "name": "decimals",
      "output": {
        "name": "",
        "type": 4,
        "typeArguments": [
          {
            "name": "",
            "type": 14,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "asset",
          "type": 8,
          "typeArguments": null
        }
      ],
      "name": "name",
      "output": {
        "name": "",
        "type": 4,
        "typeArguments": [
          {
            "name": "",
            "type": 12,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "asset",
          "type": 8,
          "typeArguments": null
        }
      ],
      "name": "symbol",
      "output": {
        "name": "",
        "type": 4,
        "typeArguments": [
          {
            "name": "",
            "type": 12,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [],
      "name": "total_assets",
      "output": {
        "name": "",
        "type": 13,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "asset",
          "type": 8,
          "typeArguments": null
        }
      ],
      "name": "total_supply",
      "output": {
        "name": "",
        "type": 4,
        "typeArguments": [
          {
            "name": "",
            "type": 13,
            "typeArguments": null
          }
        ]
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "sub_id",
          "type": 1,
          "typeArguments": null
        },
        {
          "name": "amount",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "burn",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    },
    {
      "inputs": [
        {
          "name": "recipient",
          "type": 3,
          "typeArguments": null
        },
        {
          "name": "sub_id",
          "type": 1,
          "typeArguments": null
        },
        {
          "name": "amount",
          "type": 13,
          "typeArguments": null
        }
      ],
      "name": "mint",
      "output": {
        "name": "",
        "type": 0,
        "typeArguments": null
      },
      "attributes": [
        {
          "name": "storage",
          "arguments": [
            "read",
            "write"
          ]
        }
      ]
    }
  ],
  "loggedTypes": [
    {
      "logId": 0,
      "loggedType": {
        "name": "",
        "type": 2,
        "typeArguments": []
      }
    }
  ],
  "messagesTypes": [],
  "configurables": []
};
var _storageSlots7 = [
  {
    "key": "f383b0ce51358be57daa3b725fe44acdb2d880604e367199080b4379c41bb6ed",
    "value": "0000000000000000000000000000000000000000000000000000000000000000"
  }
];
var _TokenAbi__factory = class _TokenAbi__factory {
  static createInterface() {
    return new Interface(_abi8);
  }
  static connect(id, accountOrProvider) {
    return new Contract(id, _abi8, accountOrProvider);
  }
  static async deployContract(bytecode, wallet, options = {}) {
    const factory = new ContractFactory(bytecode, _abi8, wallet);
    const { storageSlots } = _TokenAbi__factory;
    const contract = await factory.deployContract({
      storageSlots,
      ...options
    });
    return contract;
  }
};
_TokenAbi__factory.abi = _abi8;
_TokenAbi__factory.storageSlots = _storageSlots7;
var TokenAbi__factory = _TokenAbi__factory;

// src/WriteActions.ts
var WriteActions = class {
  constructor() {
    this.createSpotOrder = async (baseToken, quoteToken, size, price, options) => {
      const orderbookFactory = OrderbookAbi__factory.connect(
        options.contractAddresses.spotMarket,
        options.wallet
      );
      const assetId = { value: baseToken.address };
      const isNegative = size.includes("-");
      const absSize = size.replace("-", "");
      const baseSize = { value: absSize, negative: isNegative };
      const amountToSend = new BN_default(absSize).times(price).dividedToIntegerBy(
        new BN_default(10).pow(
          DEFAULT_DECIMALS + baseToken.decimals - quoteToken.decimals
        )
      );
      const forward = {
        amount: isNegative ? absSize : amountToSend.toString(),
        assetId: isNegative ? baseToken.address : quoteToken.address
      };
      const tx = await orderbookFactory.functions.open_order(assetId, baseSize, price).callParams({ forward }).txParams({ gasPrice: options.gasPrice });
      return this.sendTransaction(tx, options);
    };
    this.cancelSpotOrder = async (orderId, options) => {
      const orderbookFactory = OrderbookAbi__factory.connect(
        options.contractAddresses.spotMarket,
        options.wallet
      );
      const tx = await orderbookFactory.functions.cancel_order(orderId).txParams({ gasPrice: options.gasPrice });
      return this.sendTransaction(tx, options);
    };
    this.matchSpotOrders = async (sellOrderId, buyOrderId, options) => {
      const orderbookFactory = OrderbookAbi__factory.connect(
        options.contractAddresses.spotMarket,
        options.wallet
      );
      const tx = orderbookFactory.functions.match_orders(sellOrderId, buyOrderId).txParams({ gasPrice: options.gasPrice });
      return this.sendTransaction(tx, options);
    };
    this.mintToken = async (token, amount, options) => {
      const tokenFactory = options.contractAddresses.tokenFactory;
      const tokenFactoryContract = TokenAbi__factory.connect(
        tokenFactory,
        options.wallet
      );
      const mintAmount = BN_default.parseUnits(amount, token.decimals);
      const hash = hashMessage(token.symbol);
      const identity = {
        Address: {
          value: options.wallet.address.toB256()
        }
      };
      const tx = await tokenFactoryContract.functions.mint(identity, hash, mintAmount.toString()).txParams({ gasPrice: options.gasPrice });
      return this.sendTransaction(tx, options);
    };
    this.depositPerpCollateral = async (assetAddress, amount, options) => {
      const vaultFactory = VaultAbi__factory.connect(
        options.contractAddresses.vault,
        options.wallet
      );
      const forward = {
        assetId: assetAddress,
        amount
      };
      const tx = await vaultFactory.functions.deposit_collateral().callParams({ forward }).txParams({ gasPrice: options.gasPrice });
      return this.sendTransaction(tx, options);
    };
    this.withdrawPerpCollateral = async (baseTokenAddress, gasTokenAddress, amount, updateData, options) => {
      const vaultFactory = VaultAbi__factory.connect(
        options.contractAddresses.vault,
        options.wallet
      );
      const assetIdInput = {
        value: baseTokenAddress
      };
      const parsedUpdateData = updateData.map((v) => Array.from(arrayify(v)));
      const forward = {
        amount: "10",
        assetId: gasTokenAddress
      };
      const tx = await vaultFactory.functions.withdraw_collateral(amount, assetIdInput, parsedUpdateData).callParams({ forward }).txParams({ gasPrice: 1 }).addContracts([
        ProxyAbi__factory.connect(
          options.contractAddresses.proxy,
          options.wallet
        ),
        PerpMarketAbi__factory.connect(
          options.contractAddresses.perpMarket,
          options.wallet
        ),
        AccountBalanceAbi__factory.connect(
          options.contractAddresses.accountBalance,
          options.wallet
        ),
        ClearingHouseAbi__factory.connect(
          options.contractAddresses.clearingHouse,
          options.wallet
        ),
        VaultAbi__factory.connect(
          options.contractAddresses.vault,
          options.wallet
        ),
        PythContractAbi__factory.connect(
          options.contractAddresses.pyth,
          options.wallet
        )
      ]);
      return this.sendTransaction(tx, options);
    };
    this.openPerpOrder = async (baseTokenAddress, gasTokenAddress, amount, price, updateData, options) => {
      const clearingHouseFactory = ClearingHouseAbi__factory.connect(
        options.contractAddresses.clearingHouse,
        options.wallet
      );
      const assetIdInput = {
        value: baseTokenAddress
      };
      const isNegative = amount.includes("-");
      const absSize = amount.replace("-", "");
      const baseSize = { value: absSize, negative: isNegative };
      const parsedUpdateData = updateData.map((v) => Array.from(arrayify(v)));
      const forward = {
        amount: "10",
        assetId: gasTokenAddress
      };
      const tx = await clearingHouseFactory.functions.open_order(assetIdInput, baseSize, price, parsedUpdateData).callParams({ forward }).txParams({ gasPrice: options.gasPrice }).addContracts([
        ProxyAbi__factory.connect(
          options.contractAddresses.proxy,
          options.wallet
        ),
        PerpMarketAbi__factory.connect(
          options.contractAddresses.perpMarket,
          options.wallet
        ),
        AccountBalanceAbi__factory.connect(
          options.contractAddresses.accountBalance,
          options.wallet
        ),
        VaultAbi__factory.connect(
          options.contractAddresses.vault,
          options.wallet
        ),
        PythContractAbi__factory.connect(
          options.contractAddresses.pyth,
          options.wallet
        )
      ]);
      return this.sendTransaction(tx, options);
    };
    this.removePerpOrder = async (orderId, options) => {
      const clearingHouseFactory = ClearingHouseAbi__factory.connect(
        options.contractAddresses.clearingHouse,
        options.wallet
      );
      const tx = await clearingHouseFactory.functions.remove_order(orderId).txParams({ gasPrice: options.gasPrice }).addContracts([
        ProxyAbi__factory.connect(
          options.contractAddresses.proxy,
          options.wallet
        ),
        PerpMarketAbi__factory.connect(
          options.contractAddresses.perpMarket,
          options.wallet
        ),
        ClearingHouseAbi__factory.connect(
          options.contractAddresses.clearingHouse,
          options.wallet
        )
      ]);
      return this.sendTransaction(tx, options);
    };
    this.fulfillPerpOrder = async (gasTokenAddress, orderId, amount, updateData, options) => {
      const clearingHouseFactory = ClearingHouseAbi__factory.connect(
        options.contractAddresses.clearingHouse,
        options.wallet
      );
      const isNegative = amount.includes("-");
      const absSize = amount.replace("-", "");
      const baseSize = { value: absSize, negative: isNegative };
      const parsedUpdateData = updateData.map((v) => Array.from(arrayify(v)));
      const forward = {
        amount: "10",
        assetId: gasTokenAddress
      };
      const tx = await clearingHouseFactory.functions.fulfill_order(baseSize, orderId, parsedUpdateData).callParams({ forward }).txParams({ gasPrice: options.gasPrice }).addContracts([
        ProxyAbi__factory.connect(
          options.contractAddresses.proxy,
          options.wallet
        ),
        PerpMarketAbi__factory.connect(
          options.contractAddresses.perpMarket,
          options.wallet
        ),
        AccountBalanceAbi__factory.connect(
          options.contractAddresses.accountBalance,
          options.wallet
        ),
        ClearingHouseAbi__factory.connect(
          options.contractAddresses.clearingHouse,
          options.wallet
        ),
        VaultAbi__factory.connect(
          options.contractAddresses.vault,
          options.wallet
        ),
        PythContractAbi__factory.connect(
          options.contractAddresses.pyth,
          options.wallet
        )
      ]);
      return this.sendTransaction(tx, options);
    };
    this.sendTransaction = async (tx, options) => {
      const { gasUsed } = await tx.getTransactionCost();
      const gasLimit = gasUsed.mul(options.gasLimitMultiplier).toString();
      const res = await tx.txParams({ gasLimit }).call();
      return res.transactionId;
    };
  }
};

// src/Spark.ts
var Spark = class {
  constructor(params) {
    this.write = new WriteActions();
    this.setActiveWallet = (wallet) => {
      const newOptions = { ...this.options };
      newOptions.wallet = wallet;
      this.options = newOptions;
    };
    this.createSpotOrder = async (baseToken, quoteToken, size, price) => {
      return this.write.createSpotOrder(
        baseToken,
        quoteToken,
        size,
        price,
        this.getApiOptions()
      );
    };
    this.cancelSpotOrder = async (orderId) => {
      return this.write.cancelSpotOrder(orderId, this.getApiOptions());
    };
    this.matchSpotOrders = async (sellOrderId, buyOrderId) => {
      return this.write.matchSpotOrders(
        sellOrderId,
        buyOrderId,
        this.getApiOptions()
      );
    };
    this.mintToken = async (token, amount) => {
      return this.write.mintToken(token, amount, this.getApiOptions());
    };
    this.depositPerpCollateral = async (asset, amount) => {
      return this.write.depositPerpCollateral(
        asset.address,
        amount,
        this.getApiOptions()
      );
    };
    this.withdrawPerpCollateral = async (baseToken, gasToken, amount, oracleUpdateData) => {
      return this.write.withdrawPerpCollateral(
        baseToken.address,
        gasToken.address,
        amount,
        oracleUpdateData,
        this.getApiOptions()
      );
    };
    this.openPerpOrder = async (baseToken, gasToken, amount, price, updateData) => {
      return this.write.openPerpOrder(
        baseToken.address,
        gasToken.address,
        amount,
        price,
        updateData,
        this.getApiOptions()
      );
    };
    this.removePerpOrder = async (assetId) => {
      return this.write.removePerpOrder(assetId, this.getApiOptions());
    };
    this.fulfillPerpOrder = async (gasToken, orderId, amount, updateData) => {
      return this.write.fulfillPerpOrder(
        gasToken.address,
        orderId,
        amount,
        updateData,
        this.getApiOptions()
      );
    };
    this.fetchSpotMarkets = async (limit) => {
      return this.read.fetchSpotMarkets(limit);
    };
    this.fetchSpotMarketPrice = async (baseToken) => {
      return this.read.fetchSpotMarketPrice(baseToken.address);
    };
    this.fetchSpotOrders = async (params) => {
      return this.read.fetchSpotOrders(params);
    };
    this.fetchSpotTrades = async (params) => {
      return this.read.fetchSpotTrades(params);
    };
    this.fetchSpotVolume = async () => {
      return this.read.fetchSpotVolume();
    };
    this.fetchSpotOrderById = async (orderId) => {
      return this.read.fetchSpotOrderById(orderId);
    };
    this.fetchPerpCollateralBalance = async (accountAddress, asset) => {
      const options = await this.getFetchOptions();
      return this.read.fetchPerpCollateralBalance(
        accountAddress,
        asset.address,
        options
      );
    };
    this.fetchPerpAllTraderPositions = async (accountAddress) => {
      const options = await this.getFetchOptions();
      return this.read.fetchPerpAllTraderPositions(accountAddress, options);
    };
    this.fetchPerpIsAllowedCollateral = async (asset) => {
      const options = await this.getFetchOptions();
      return this.read.fetchPerpIsAllowedCollateral(asset.address, options);
    };
    this.fetchPerpTraderOrders = async (accountAddress, asset) => {
      const options = await this.getFetchOptions();
      return this.read.fetchPerpTraderOrders(
        accountAddress,
        asset.address,
        options
      );
    };
    this.fetchPerpAllMarkets = async (assetList, quoteAsset) => {
      const options = await this.getFetchOptions();
      return this.read.fetchPerpAllMarkets(assetList, quoteAsset, options);
    };
    this.fetchPerpFundingRate = async (asset) => {
      const options = await this.getFetchOptions();
      return this.read.fetchPerpFundingRate(asset.address, options);
    };
    this.fetchPerpMaxAbsPositionSize = async (accountAddress, asset, tradePrice) => {
      const options = await this.getFetchOptions();
      return this.read.fetchPerpMaxAbsPositionSize(
        accountAddress,
        asset.address,
        tradePrice,
        options
      );
    };
    this.fetchPerpPendingFundingPayment = async (accountAddress, asset) => {
      const options = await this.getFetchOptions();
      return this.read.fetchPerpPendingFundingPayment(
        accountAddress,
        asset.address,
        options
      );
    };
    this.fetchPerpMarkPrice = async (asset) => {
      const options = await this.getFetchOptions();
      return this.read.fetchPerpMarkPrice(asset.address, options);
    };
    this.fetchWalletBalance = async (asset) => {
      return this.read.fetchWalletBalance(asset.address, this.getApiOptions());
    };
    this.getProviderWallet = async () => {
      const provider = await this.providerPromise;
      return Wallet.generate({ provider });
    };
    this.getProvider = async () => {
      return this.providerPromise;
    };
    this.getFetchOptions = async () => {
      const providerWallet = await this.getProviderWallet();
      const options = { ...this.options, wallet: providerWallet };
      return options;
    };
    this.getApiOptions = () => {
      if (!this.options.wallet) {
        throw new NetworkError(4 /* UNKNOWN_WALLET */);
      }
      return this.options;
    };
    this.options = {
      contractAddresses: params.contractAddresses,
      wallet: params.wallet,
      gasPrice: params.gasPrice ?? DEFAULT_GAS_PRICE,
      gasLimitMultiplier: params.gasLimitMultiplier ?? DEFAULT_GAS_LIMIT_MULTIPLIER
    };
    this.read = new ReadActions(params.indexerApiUrl);
    this.providerPromise = Provider.create(params.networkUrl);
  }
};

// src/index.ts
var src_default = Spark;

export { BETA_CONTRACT_ADDRESSES, BETA_INDEXER_URL, BETA_NETWORK, BETA_TOKENS, BN_default as BN, EXPLORER_URL, src_default as default };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=index.js.map