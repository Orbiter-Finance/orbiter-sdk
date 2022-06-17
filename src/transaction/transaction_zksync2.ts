import * as zksync2 from 'zksync-web3'
import { Transaction, TransactionTransferOptions } from './transaction'

export default class TransactionZksync2 extends Transaction {
  /**
   * @param options
   */
  public async transfer(options: TransactionTransferOptions) {
    const zksync2Provider = new zksync2.Provider("https://zksync2-testnet.zksync.dev");
    const tokenAddress = options.tokenAddress;
    if (!await zksync2Provider.isTokenLiquid(tokenAddress)) {
    throw new Error("the token can not be used for fee")
    }
    const provider = new zksync2.Web3Provider((window as (typeof window & { ethereum: any })).ethereum);
    const signer = provider.getSigner();
    const walletAddress = options.fromAddress;
    const transferResult = await signer.transfer({
      to: options.toAddress,
      token: tokenAddress,
      amount: options.amount.toString()
    })
    return transferResult;
  }
}
