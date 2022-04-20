<template>
  <div class="home">
    <p>
      <button @click="onTransferZksync">TransferZksync</button>
    </p>
    <p>
      <button @click="onTransferImmutablex">TransferImmutablex</button>
    </p>
    <p>
      <button @click="onTransferEthereum">TransferEthereum</button>
    </p>
    <p>
      <button @click="onTransferEthereumUsdc">TransferEthereumUsdc</button>
    </p>
    <p>
      <button @click="onTransferLoopring">TransferLoopring</button>
    </p>
    <!-- <p>
      <button @click="onTransferDydx">TransferDydx</button>
    </p> -->
  </div>
</template>

<script setup lang="ts">
import { ethers, providers } from 'ethers'
import Web3 from 'web3'
import { utils } from '../../../../src/orbiter-sdk'
import {
  TransactionZksync,
  TransactionImmutablex,
  TransactionEvm,
  TransactionLoopring,
  // TransactionDydx,
} from '../../../../src/transaction'

const ethereum = (window as any).ethereum

const ethAmount = ethers.BigNumber.from(10).pow(16)
const usdcAmount = ethers.BigNumber.from(10).pow(6)

const onTransferZksync = async () => {
  const provider = new providers.Web3Provider(ethereum)
  const transactionZksync = new TransactionZksync(33, provider.getSigner())
  const tr = await transactionZksync.transfer({
    amount: usdcAmount,
    tokenAddress: '0xeb8f08a975ab53e34d8a0330e0d34de942c95926',
    toAddress: '0xF2BE509057855b055f0515CCD0223BEf84D19ad4',
  })
  console.warn('onTransferZksync >>> ', tr)
}

const onTransferImmutablex = async () => {
  const provider = new providers.Web3Provider(ethereum)

  const transactionImmutablex = new TransactionImmutablex(88, provider.getSigner())
  const tr = await transactionImmutablex.transfer({
    amount: ethAmount,
    tokenAddress: '0x0000000000000000000000000000000000000000',
    toAddress: '0xF2BE509057855b055f0515CCD0223BEf84D19ad4',
    decimals: 18,
  })
  console.warn('onTransferImmutablex >>> ', tr)
}

const onTransferEthereum = async () => {
  const chainId = 5
  await utils.ensureMetamaskNetwork(chainId, ethereum)

  const provider = new providers.Web3Provider(ethereum)

  const transactionEvm = new TransactionEvm(chainId, provider.getSigner())
  const tr = await transactionEvm.transfer({
    amount: ethAmount,
    tokenAddress: '0x0000000000000000000000000000000000000000',
    toAddress: '0xF2BE509057855b055f0515CCD0223BEf84D19ad4',
  })
  console.warn('onTransferEthereum >>> ', tr)
}
const onTransferEthereumUsdc = async () => {
  const chainId = 5
  await utils.ensureMetamaskNetwork(chainId, ethereum)

  const provider = new providers.Web3Provider(ethereum)

  const transactionEvm = new TransactionEvm(chainId, provider.getSigner())
  const tr = await transactionEvm.transfer({
    amount: usdcAmount,
    tokenAddress: '0xeb8f08a975ab53e34d8a0330e0d34de942c95926',
    toAddress: '0xF2BE509057855b055f0515CCD0223BEf84D19ad4',
  })
  console.warn('onTransferEthereumUsdc >>> ', tr)
}
const onTransferLoopring = async () => {
  const chainId = 99
  const web3 = new Web3(ethereum)

  const transactionEvm = new TransactionLoopring(chainId, web3)
  const tr = await transactionEvm.transfer({
    amount: ethAmount,
    fromAddress: await web3.eth.getCoinbase(),
    tokenAddress: '0x0000000000000000000000000000000000000000',
    toAddress: '0xF2BE509057855b055f0515CCD0223BEf84D19ad4',
  })
  console.warn('onTransferLoopring >>> ', tr)
}
// const onTransferDydx = async () => {
//   const chainId = 511

//   await utils.ensureMetamaskNetwork(chainId, ethereum)

//   const web3 = new Web3(ethereum)

//   const transactionEvm = new TransactionDydx(chainId, web3)
//   const tr = await transactionEvm.transfer({
//     amount: usdcAmount,
//     fromAddress: await web3.eth.getCoinbase(),
//     tokenAddress: '0xeb8f08a975ab53e34d8a0330e0d34de942c95926',
//     toAddress: '0x694434EC84b7A8Ad8eFc57327ddD0A428e23f8D5',
//     receiverPublicKey: '04e69175389829db733f41ae75e7ba59ea2b2849690c734fcd291c94d6ec6017',
//     receiverPositionId: '60620',
//   })
//   console.warn('onTransferDydx >>> ', tr)
// }
</script>
