export default {
  etherscan: {
    key: process.env.VUE_APP_ETH_KEY,
    Mainnet: 'https://api.etherscan.io/api',
    Testnet:  'https://api-rinkeby.etherscan.io/api',
  },
  arbitrum: {
    key: '',
    Mainnet: 'https://api.arbiscan.io/api',
    Testnet:  'https://api-testnet.arbiscan.io/api',
  },
  zkSync: {
    key: '',
    Mainnet: 'https://api.zksync.io/api/v0.2',
    Testnet:  'https://rinkeby-api.zksync.io/api/v0.2',
  },
  starknet: {
    key: '',
    Mainnet: 'https://voyager.online/api',
    Testnet:  'https://goerli.voyager.online/api',
  },
  polygon: {
    key: process.env.VUE_APP_PO_KEY,
    Mainnet: 'https://api.polygonscan.com/api',
    Testnet:  'https://api-testnet.polygonscan.com/api',
  },
  optimistic: {
    key: process.env.VUE_APP_OP_KEY,
    Mainnet: 'https://api-optimistic.etherscan.io/api',
    Testnet:  'https://api-kovan-optimistic.etherscan.io/api',
  },
  immutableX: {
    key: '',
    Mainnet: 'https://api.x.immutable.com/v1',
    Testnet:  'https://api.ropsten.x.immutable.com/v1',
  },
  loopring: {
    key: '',
    Mainnet: 'https://api3.loopring.io',
    Testnet:  'https://uat2.loopring.io',
  },
  metis: {
    key: '',
    Mainnet: 'https://andromeda-explorer.metis.io/api',
    Testnet:  'https://stardust-explorer.metis.io/api',
  },
  dydx: {
    key: '',
    Mainnet: 'https://api.dydx.exchange',
    Testnet:  'https://api.stage.dydx.exchange',
  },
}
