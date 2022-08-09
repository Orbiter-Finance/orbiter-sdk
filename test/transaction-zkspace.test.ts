import { ethers, utils, BigNumber} from 'ethers';
import Web3 from 'web3'
import {
  getAllZksTokenList,
  getZKSAccountInfo,
  getZKSpaceTransferGasFee,
  getPrivateKey,
  getPublicKeyHash,
  getSignMessage,
  changePubKey,
  getL2SigOneAndPK,
} from '../src/utils/zkspace/zkspace_helper'

import {
  TranscationZKspace
} from '../src/transaction/transaction_zkspace'

import {
  TransactionTransferOptions 
} from '../src/transaction/transaction'

import * as zksync from "zksync";

import testconfig from './test-config'

const zkSpaceChainId = 512 // test net 

describe('zkspace_helper', () => {
  jest.setTimeout(60000);
  it('test getAllZksTokenList', async () => {
    const allTokenList = await getAllZksTokenList(zkSpaceChainId)
    expect(allTokenList.chainID).toEqual(zkSpaceChainId)
    expect(allTokenList.tokenList.length > 0).toBeTruthy
  });
  it('test getZKSAccountInfo', async() => {
    const zkAccountInfo = await getZKSAccountInfo(zkSpaceChainId, testconfig.WALLET_ADDRESS)
    expect(typeof zkAccountInfo.id == 'number').toBe(true)
  })
  it('test getZKSpaceTransferGasFee', async() => {
    const gasFee = await getZKSpaceTransferGasFee(zkSpaceChainId, testconfig.WALLET_ADDRESS)
    expect(gasFee >= 0).toBe(true)
  })

  it('test getZKSAccountInfo', async() => {
    let info = await getZKSAccountInfo(zkSpaceChainId, testconfig.WALLET_ADDRESS)
  })

  it('test getPrivateKey', async() => {
    //https://en.wiki.zks.org/interact-with-zkswap/make-transaction#private-key
    const signer = new ethers.Wallet(testconfig.PRIVAT_KEY)
    const privateKey = await getPrivateKey(signer)
    const pubKeyHash:string = getPublicKeyHash(privateKey)

  })

  it('test getSignMessage', async() => {
    const signer = new ethers.Wallet(testconfig.PRIVAT_KEY)
    const privateKey = await getPrivateKey(signer)
    let signMsg = getSignMessage(privateKey, utils.concat([
      zksync.utils.numberToBytesBE(1, 2),
    ]))
  })

  it('test ChangePubKey', async() => {
    const signer = new ethers.Wallet(testconfig.PRIVAT_KEY)
    let info = await getZKSAccountInfo(zkSpaceChainId, testconfig.WALLET_ADDRESS)
    let privateKey = await getPrivateKey(signer)
    let changeResult = await changePubKey(zkSpaceChainId, info, privateKey,testconfig.WALLET_ADDRESS, signer)
  })

  it('test ZKSpaceTransfer', async() => {
      const signer = new ethers.Wallet(testconfig.PRIVAT_KEY)
      // const USDT_ADDRESS = "0xcd96fc9fa8fa04660678386062d4fa70b3e8e1de"
      const ETH_ADDRESS = "0x0000000000000000000000000000000000000000"
      let zkSpaceTransaction = new TranscationZKspace(zkSpaceChainId, signer)
      let options: TransactionTransferOptions = {
        amount: utils.parseEther("0.00002"),
        tokenAddress: ETH_ADDRESS,
        toAddress: testconfig.WALLET_ADDRESS_2,
      }
      let transferResult = await zkSpaceTransaction.transfer(options)
      expect(transferResult['status'] === 200).toBe(true)
      expect(transferResult['data']['success'] === true).toBe(true)
  })

});
