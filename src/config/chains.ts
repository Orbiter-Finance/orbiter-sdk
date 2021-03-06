export default [
  {
    name: 'Ethereum',
    chainId: 1,
    shortName: 'eth',
    networkId: 1,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpc: [
      'https://mainnet.infura.io/v3/${INFURA_API_KEY}',
      'wss://mainnet.infura.io/ws/v3/${INFURA_API_KEY}',
      'https://api.mycryptoapi.com/eth',
      'https://cloudflare-eth.com',
    ],
    faucets: [],
    explorers: [],
    infoURL: 'https://etherscan.io/',
  },
  {
    name: 'Rinkeby',
    chainId: 4,
    shortName: 'rin',
    networkId: 4,
    nativeCurrency: {
      name: 'Rinkeby Ether',
      symbol: 'RIN',
      decimals: 18,
    },
    rpc: [
      'https://rinkeby.infura.io/v3/${INFURA_API_KEY}',
      'wss://rinkeby.infura.io/ws/v3/${INFURA_API_KEY}',
    ],
    faucets: ['https://faucet.rinkeby.io'],
    explorers: [],
    infoURL: 'https://rinkeby.etherscan.io/',
  },
  {
    name: 'Ropsten',
    chainId: 3,
    shortName: 'rop',
    networkId: 3,
    nativeCurrency: {
      name: 'Ropsten Ether',
      symbol: 'ROP',
      decimals: 18,
    },
    rpc: [
      'https://ropsten.infura.io/v3/${INFURA_API_KEY}',
      'wss://ropsten.infura.io/ws/v3/${INFURA_API_KEY}',
    ],
    faucets: ['https://faucet.ropsten.be?${ADDRESS}'],
    explorers: [],
    infoURL: 'https://ropsten.etherscan.io/',
  },
  {
    name: 'Görli',
    chainId: 5,
    shortName: 'gor',
    networkId: 5,
    nativeCurrency: {
      name: 'Görli Ether',
      symbol: 'GOR',
      decimals: 18,
    },
    rpc: [
      'https://rpc.goerli.mudit.blog/',
      'https://rpc.slock.it/goerli ',
      'https://goerli.prylabs.net/',
    ],
    faucets: [
      'https://goerli-faucet.slock.it/?address=${ADDRESS}',
      'https://faucet.goerli.mudit.blog',
    ],
    explorers: [],
    infoURL: 'https://goerli.net/#about',
  },
  {
    name: 'Arbitrum',
    chainId: 42161,
    shortName: 'arb1',
    networkId: 42161,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'AETH',
      decimals: 18,
    },
    rpc: [
      'https://mainnet.infura.io/v3/${INFURA_API_KEY}',
      'https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
      'https://arb1.arbitrum.io/rpc',
      'wss://arb1.arbitrum.io/ws',
    ],
    faucets: [],
    explorers: [],
    infoURL: 'https://arbiscan.io/',
  },
  {
    name: 'Arbitrum(R)',
    chainId: 421611,
    shortName: 'arb-rinkeby',
    networkId: 421611,
    nativeCurrency: {
      name: 'Arbitrum Rinkeby Ether',
      symbol: 'ARETH',
      decimals: 18,
    },
    rpc: ['https://rinkeby.arbitrum.io/rpc', 'wss://rinkeby.arbitrum.io/ws'],
    faucets: [],
    explorers: [],
    infoURL: 'https://testnet.arbiscan.io/',
  },
  {
    name: 'Polygon',
    chainId: 137,
    shortName: 'matic',
    networkId: 137,
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpc: [
      'https://rpc-mainnet.matic.network',
      'wss://ws-mainnet.matic.network',
      'https://rpc-mainnet.matic.quiknode.pro',
      'https://matic-mainnet.chainstacklabs.com',
    ],
    faucets: [],
    explorers: [],
    infoURL: 'https://matic.network/',
  },
  {
    name: 'Polygon(R)',
    chainId: 80001,
    shortName: 'maticmum',
    networkId: 80001,
    nativeCurrency: {
      name: 'Matic',
      symbol: 'tMATIC',
      decimals: 18,
    },
    rpc: ['https://rpc-mumbai.matic.today', 'wss://ws-mumbai.matic.today'],
    faucets: ['https://faucet.matic.network/'],
    explorers: [],
    infoURL: 'https://matic.network/',
  },
  {
    name: 'Optimism',
    chainId: 10,
    shortName: 'oeth',
    networkId: 10,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'OETH',
      decimals: 18,
    },
    rpc: ['https://mainnet.optimism.io/'],
    faucets: [],
    explorers: [],
    infoURL: 'https://optimistic.etherscan.io/',
  },
  {
    name: 'Optimism(K)',
    chainId: 69,
    shortName: 'okov',
    networkId: 69,
    nativeCurrency: {
      name: 'Kovan Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpc: ['https://kovan.optimism.io/'],
    faucets: [],
    explorers: [],
    infoURL: 'https://kovan-optimistic.etherscan.io/',
  },
  {
    name: 'Metis',
    chainId: 1088,
    shortName: 'andromeda-metis',
    networkId: 1088,
    nativeCurrency: {
      name: 'METIS',
      symbol: 'METIS',
      decimals: 18,
    },
    rpc: ['https://andromeda.metis.io/?owner=1088'],
    faucets: [],
    explorers: [],
    infoURL: 'https://andromeda-explorer.metis.io',
  },
  {
    name: 'Metis(R)',
    chainId: 588,
    shortName: 'stardust-metis',
    networkId: 588,
    nativeCurrency: {
      name: 'METIS',
      symbol: 'tMETIS',
      decimals: 18,
    },

    rpc: ['https://stardust.metis.io/?owner=588', 'wss://stardust-ws.metis.io/'],
    faucets: [],
    explorers: [],
    infoURL: 'https://stardust-explorer.metis.io',
  },
]
