
import { sign } from 'crypto';
import { BigNumberish, ethers, utils } from 'ethers'

import testconfig from './test-config'
import chainsApi from '../src/config/chains_api'

import {TransactionEvm} from '../src/transaction/transaction_evm'
import {TransactionTransferOptions} from '../src/transaction/transaction'

describe('test transaction_evm polygon',() => {
  jest.setTimeout(30000);
  it('test transfer polygon', async() => {
    
    const provider = new ethers.providers.JsonRpcProvider(testconfig.POLYGON_RPC)
    const signer = new ethers.Wallet(testconfig.PRIVAT_KEY, provider);
    const polygonId = 6
    let polygonTransaction: TransactionEvm = new TransactionEvm(polygonId, signer)
    let options: TransactionTransferOptions = {
      amount: utils.parseEther("0.000002"),
      tokenAddress: "0x0000000000000000000000000000000000001010", // matic native token
      toAddress: testconfig.WALLET_ADDRESS,
      // defaultGasLimit:10005000
    }
    let transferResult = await polygonTransaction.transfer(options)
    expect(transferResult['from'] === testconfig.WALLET_ADDRESS).toBe(true)
  })

  it('test transfer BSC', async() => {
    const provider = new ethers.providers.JsonRpcProvider(chainsApi.bsc.TestNet)
    const signer = new ethers.Wallet(testconfig.PRIVAT_KEY, provider);
    const bobaId = 6
    let bobaTransaction: TransactionEvm = new TransactionEvm(bobaId, signer)
    let options: TransactionTransferOptions = {
      amount: utils.parseEther("0.000002"),
      tokenAddress: "0x0000000000000000000000000000000000000000",
      toAddress: testconfig.WALLET_ADDRESS,
      // defaultGasLimit:10005000
    }
    let transferResult = await bobaTransaction.transfer(options)
    expect(transferResult['from'] === testconfig.WALLET_ADDRESS).toBe(true)
  })

  it('test transfer Boba', async() => {
    const provider = new ethers.providers.JsonRpcProvider(testconfig.BOBA_RPC)
    const signer = new ethers.Wallet(testconfig.PRIVAT_KEY, provider);
    const bobaId = 6
    let bobaTransaction: TransactionEvm = new TransactionEvm(bobaId, signer)
    let options: TransactionTransferOptions = {
      amount: utils.parseEther("0.000002"),
      tokenAddress: "0x0000000000000000000000000000000000000000",
      toAddress: testconfig.WALLET_ADDRESS,
      // defaultGasLimit:10005000
    }
    let transferResult = await bobaTransaction.transfer(options)
    expect(transferResult['from'] === testconfig.WALLET_ADDRESS).toBe(true)
  })

  it('test transfer Metis', async() => {
    const provider = new ethers.providers.JsonRpcProvider(testconfig.METIS_RPC)
    const signer = new ethers.Wallet(testconfig.PRIVAT_KEY, provider);
    const bobaId = 6
    let bobaTransaction: TransactionEvm = new TransactionEvm(bobaId, signer)
    let options: TransactionTransferOptions = {
      amount: utils.parseEther("0.000002"),
      tokenAddress: "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000",
      toAddress: testconfig.WALLET_ADDRESS,
      // defaultGasLimit:10005000
    }
    let transferResult = await bobaTransaction.transfer(options)
    expect(transferResult['from'] === testconfig.WALLET_ADDRESS).toBe(true)
  })

})