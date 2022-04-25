import { Provider } from '@ethersproject/abstract-provider'
import ethers, { BigNumberish, Signer } from 'ethers'
import { CrossAddressExt } from '../utils/cross_address'

export type TransactionTransferOptions = {
  amount: ethers.BigNumberish
  tokenAddress: string
  toAddress: string

  defaultGasLimit?: BigNumberish // For evm, default value is 55000
  fromAddress?: string
  decimals?: number // For immutableX, docs: https://docs.x.immutable.com/docs/linktransfer
  symbol?: string // For immutableX
  memo?: string // For loopring
  receiverPublicKey?: string // For dydx, docs: https://docs.dydx.exchange/#create-transfer
  receiverPositionId?: string // For dydx
  clientIdAddress?: string // For dydx, default is toAddress
  
  crossAddressExt?: CrossAddressExt // Cross address transfer data
}

export abstract class Transaction {
  protected chainId: number
  protected signer: Signer
  protected provider?: Provider

  constructor(chainId: number, signer: Signer) {
    this.chainId = chainId
    this.signer = signer
    this.provider = signer && signer.provider
  }

  /**
   * @param options
   */
  public abstract transfer(options: TransactionTransferOptions): Promise<any>
}
