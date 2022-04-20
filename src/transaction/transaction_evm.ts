import { BigNumberish, ethers, providers, utils } from 'ethers'
import abis from '../config/abis'
import { isEthTokenAddress } from '../utils'
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
  public async transfer(options: TransactionTransferOptions & { defaultGasLimit?: BigNumberish }) {
    const amountHex = ethers.BigNumber.from(options.amount).toHexString()

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
      const contract = new ethers.Contract(options.tokenAddress, abis.erc20, this.signer)
      if (!contract) {
        throw new Error('Failed to obtain contract information, please refresh and try again')
      }

      const gasLimit = await this.getTransferGasLimit(() => {
        return contract.estimateGas.transfer(options.toAddress, amountHex)
      }, options.defaultGasLimit)

      return await contract.transfer(options.toAddress, amountHex, {
        gasLimit: gasLimit,
      })
    }
  }
}
