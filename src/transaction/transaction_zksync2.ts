import * as zksync2 from 'zksync-web3'
import Web3 from 'web3'
import { Web3Provider } from '@ethersproject/providers'
import {TransactionResponse} from "zksync-web3/src/types"
import { Transaction, TransactionTransferOptions } from './transaction'
import { ChainValidator, ChainValidatorTypes } from '../utils/validator'
import config from '../config/chains_api'

export class TransactionZksync2 extends Transaction {

  private zksync2wallet: zksync2.Wallet

  constructor(chainId: number, zksync2wallet: zksync2.Wallet) {
    const signer = zksync2wallet.provider.getSigner()
    super(chainId, signer)
    this.zksync2wallet = zksync2wallet
  }
  
  /**
   * @param options
   */
  public async transfer(options: TransactionTransferOptions) {
    
    let zksync2Provider: zksync2.Provider
    if(ChainValidator.zksync2(this.chainId) == ChainValidatorTypes.Testnet){
      zksync2Provider = new zksync2.Provider(config.zkSync2.Testnet)
    } else {
      throw new Error(`not support yet`)
    }

    const tokenAddress = options.tokenAddress;
    if (!await zksync2Provider.isTokenLiquid(tokenAddress)) {
      throw new Error("the token can not be used for fee")
    }
    return <TransactionResponse>await this.zksync2wallet.transfer({
      to: options.toAddress,
      token: tokenAddress,
      amount: options.amount.toString(),
      overrides: { customData: { feeToken: tokenAddress } },
    })
  }
}