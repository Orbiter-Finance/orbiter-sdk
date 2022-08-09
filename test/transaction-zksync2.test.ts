
import { ethers } from 'ethers'
import * as zksync2 from "zksync-web3";

import testconfig from './test-config'
import chainsApi from '../src/config/chains_api'
import { TransactionZksync2 }from '../src/transaction/transaction_zksync2'
import {TransactionTransferOptions} from '../src/transaction/transaction'

describe('test transaction-zksync2',() => {
  jest.setTimeout(30000);
  const zkSpaceTestNetId = 512
  it('test TransactionZksync transfer',async() => {
    const zksync2TestNetid = 514
    const PRIVATE_KEY = testconfig.PRIVAT_KEY;
    const USDC_ADDRESS = "0x54a14D7559BAF2C8e8Fa504E019d32479739018c"
    const zkSync2Provider = new zksync2.Provider(chainsApi.zkSync2.Testnet);
    const ethereumProvider = ethers.getDefaultProvider("goerli");
    const syncWallet = new zksync2.Wallet(PRIVATE_KEY, zkSync2Provider, ethereumProvider);
    let zksycn2Transcation = new TransactionZksync2(zksync2TestNetid, syncWallet)
    
    let options: TransactionTransferOptions = {
      amount: 10000,
      tokenAddress: USDC_ADDRESS,
      toAddress: testconfig.WALLET_ADDRESS,
    }
    
    let transferResult = await zksycn2Transcation.transfer(options)
    expect(transferResult['customData']['feeToken'] === USDC_ADDRESS).toBe(true)
  })


})