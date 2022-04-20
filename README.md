# Orbiter-Sdk

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Greenkeeper badge](https://badges.greenkeeper.io/alexjoverm/typescript-library-starter.svg)](https://greenkeeper.io/)
[![Coveralls](https://img.shields.io/coveralls/alexjoverm/typescript-library-starter.svg)](https://github.com/linkdrone/orbiter-sdk)

Orbiter-Sdk is a secure and fast Layer2 cross-platform transfer library

### Usage

```bash
# Use yarn
yarn add orbiter-sdk

# Or use npm
npm install orbiter-sdk --save
```

### Demos

#### TransactionZksync

```TypeScript
const chainId = 33
await utils.ensureMetamaskNetwork(chainId, ethereum)

const provider = new providers.Web3Provider(ethereum)
const transactionZksync = new TransactionZksync(chainId, provider.getSigner())
await transactionZksync.transfer({
  amount: '9900011',
  tokenAddress: '0xeb8f08a975ab53e34d8a0330e0d34de942c95926',
  toAddress: '0xF2BE509057855b055f0515CCD0223BEf84D19ad4',
})
```

#### TransactionImmutablex

```TypeScript
const chainId = 88
await utils.ensureMetamaskNetwork(chainId, ethereum)

const provider = new providers.Web3Provider(ethereum)

const transactionImmutablex = new TransactionImmutablex(chainId, provider.getSigner())
const tr = await transactionImmutablex.transfer({
  amount: ethAmount,
  tokenAddress: '0x0000000000000000000000000000000000000000',
  toAddress: '0xF2BE509057855b055f0515CCD0223BEf84D19ad4',
  decimals: 18,
})
```

#### TransactionEvm

```TypeScript
const chainId = 5
await utils.ensureMetamaskNetwork(chainId, ethereum)

const provider = new providers.Web3Provider(ethereum)

const transactionEvm = new TransactionEvm(chainId, provider.getSigner())
const tr = await transactionEvm.transfer({
  amount: ethAmount,
  tokenAddress: '0x0000000000000000000000000000000000000000',
  toAddress: '0xF2BE509057855b055f0515CCD0223BEf84D19ad4',
})
```

#### TransactionLoopring

```TypeScript
const chainId = 99
const web3 = new Web3(ethereum)

const transactionEvm = new TransactionLoopring(chainId, web3)
const tr = await transactionEvm.transfer({
  amount: ethAmount,
  fromAddress: await web3.eth.getCoinbase(),
  tokenAddress: '0x0000000000000000000000000000000000000000',
  toAddress: '0xF2BE509057855b055f0515CCD0223BEf84D19ad4',
})
```

#### TransactionDydx

```TypeScript
const chainId = 511
await utils.ensureMetamaskNetwork(chainId, ethereum)

const web3 = new Web3(ethereum)

const transactionEvm = new TransactionDydx(chainId, web3)
const tr = await transactionEvm.transfer({
  amount: usdcAmount,
  fromAddress: await web3.eth.getCoinbase(),
  tokenAddress: '0xeb8f08a975ab53e34d8a0330e0d34de942c95926',
  toAddress: '0x694434EC84b7A8Ad8eFc57327ddD0A428e23f8D5',
  receiverPublicKey: '04e69175389829db733f41ae75e7ba59ea2b2849690c734fcd291c94d6ec6017',
  receiverPositionId: '60620',
})
```

#### Util

```TypeScript

```