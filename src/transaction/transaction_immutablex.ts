import { ERC20TokenType, ETHTokenType } from '@imtbl/imx-sdk'
import { isEthTokenAddress } from '../utils'
import { IMXHelper } from '../utils/immutablex/imx_helper'
import { Transaction, TransactionTransferOptions } from './transaction'

export class TransactionImmutablex extends Transaction {
  /**
   * @param options
   */
  public async transfer(
    options: TransactionTransferOptions & { decimals: number; symbol?: string }
  ) {
    const imxHelper = new IMXHelper(this.chainId, this.signer)
    const addressOrIndex = await this.signer.getAddress()
    const imxClient = await imxHelper.getImmutableXClient(addressOrIndex, true)

    const tokenInfo = isEthTokenAddress(options.tokenAddress)
      ? {
          type: ETHTokenType.ETH,
          data: {
            decimals: options.decimals,
          },
        }
      : {
          type: ERC20TokenType.ERC20,
          data: {
            symbol: options.symbol,
            decimals: options.decimals,
            tokenAddress: options.tokenAddress,
          },
        }

    return await imxClient.transfer({
      sender: addressOrIndex,
      token: tokenInfo,
      quantity: options.amount as any,
      receiver: options.toAddress,
    })
  }
}
