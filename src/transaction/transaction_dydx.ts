import { SigningMethod } from '@dydxprotocol/v3-client'
import { Web3Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import Web3 from 'web3'
import { DydxHelper } from '../utils/dydx/dydx_helper'
import { Transaction, TransactionTransferOptions } from './transaction'

export class TransactionDydx extends Transaction {
  private web3: Web3

  constructor(chainId: number, web3: Web3) {
    const signer = new Web3Provider(<any>web3.currentProvider).getSigner()
    super(chainId, signer)
    this.web3 = web3
  }

  /**
   * @param options
   */
  public async transfer(options: TransactionTransferOptions) {
    const dydxHelper = new DydxHelper(this.chainId, this.web3, SigningMethod.MetaMask)
    const dydxClient = await dydxHelper.getDydxClient(options.fromAddress, false, true)
    const dydxAccount = await dydxHelper.getAccount(options.fromAddress)

    // Default: clientIdAddress is options.toAddress
    if (!options.clientIdAddress) {
      options.clientIdAddress = options.toAddress
    }

    const params = {
      clientId: dydxHelper.generateClientId(options.clientIdAddress),
      amount: ethers.BigNumber.from(options.amount).toNumber() / 10 ** 6 + '', // Only usdc now!
      expiration: new Date(new Date().getTime() + 86400000 * 30).toISOString(),
      receiverAccountId: dydxHelper.getAccountId(options.toAddress),
      receiverPublicKey: options.receiverPublicKey,
      receiverPositionId: options.receiverPositionId,
    }

    return await dydxClient.private.createTransfer(params, dydxAccount.positionId)
  }
}
