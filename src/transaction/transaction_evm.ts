import { TransactionResponse } from '@ethersproject/abstract-provider'
import { BigNumberish, ethers } from 'ethers'
import config from '../config'
import { isEthTokenAddress } from '../utils'
import { CrossAddress } from '../utils/cross_address'
import { Transaction, TransactionTransferOptions } from './transaction'

export class TransactionEvm extends Transaction {
  /**
   * @param estimator
   * @param defaultGasLimit
   * @returns
   */
  private async getTransferGasLimit(
    estimator: () => Promise<ethers.BigNumber>,
    defaultGasLimit: BigNumberish = 55000
  ) {
    let gasLimit = ethers.BigNumber.from(defaultGasLimit)
    try {
      gasLimit = await estimator()
    } catch (err) {
      console.error('getTransferGasLimit error: ', err)
    }
    return gasLimit
  }

  /**
   * @param options
   */
  private async transferCrossAddress(options: TransactionTransferOptions) {
    const crossAddress = new CrossAddress(this.signer, this.chainId)
    if (isEthTokenAddress(options.tokenAddress)) {
      return await crossAddress.transfer(options.toAddress, options.amount, options.crossAddressExt)
    } else {
      return await crossAddress.transferERC20(
        options.tokenAddress,
        options.toAddress,
        options.amount,
        options.crossAddressExt
      )
    }
  }

  /**
   *
   * @param options
   * @returns
   */
  public async transfer(options: TransactionTransferOptions) {
    const amountHex = ethers.BigNumber.from(options.amount).toHexString()

    // Cross address transfer
    if (options.crossAddressExt) {
      return await this.transferCrossAddress(options)
    }

    if (isEthTokenAddress(options.tokenAddress)) {
      // When tokenAddress is eth
      const params = {
        to: options.toAddress,
        value: amountHex,
      }
      const gasLimit = await this.getTransferGasLimit(() => {
        return this.signer.estimateGas(params)
      }, options.defaultGasLimit)

      return await this.signer.sendTransaction({
        ...params,
        gasLimit: gasLimit,
      })
    } else {
      // When tokenAddress is erc20
      const contract = new ethers.Contract(options.tokenAddress, config.abis.erc20, this.signer)
      if (!contract) {
        throw new Error('Failed to obtain contract information, please refresh and try again')
      }

      const gasLimit = await this.getTransferGasLimit(() => {
        return contract.estimateGas.transfer(options.toAddress, amountHex)
      }, options.defaultGasLimit)

      return <TransactionResponse>await contract.transfer(options.toAddress, amountHex, {
        gasLimit: gasLimit,
      })
    }
  }
}
