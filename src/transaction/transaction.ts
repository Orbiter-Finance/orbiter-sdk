import { Provider } from '@ethersproject/abstract-provider'
import ethers, { Signer } from 'ethers'

export type TransactionTransferOptions = {
  amount: ethers.BigNumberish
  tokenAddress: string
  toAddress: string
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
