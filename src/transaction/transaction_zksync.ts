import * as zksync from 'zksync'
import { Transaction, TransactionTransferOptions } from './transaction'
import { ChainValidator, ChainValidatorTypes } from '../utils/validator'

export class TransactionZksync extends Transaction {
  /**
   * @param options
   */
  public async transfer(options: TransactionTransferOptions) {
    const zksyncProvider =
      ChainValidator.zksync(this.chainId) == ChainValidatorTypes.Mainnet
        ? await zksync.getDefaultProvider('mainnet')
        : await zksync.getDefaultProvider('rinkeby')
    const zksyncWallet = await zksync.Wallet.fromEthSigner(this.signer, zksyncProvider)
    if (!zksyncWallet.signer) {
      throw new Error('Obiter initialization zksync.Wallet.signer failed.')
    }

    const amount = zksync.utils.closestPackableTransactionAmount(options.amount)
    const transferFee = await zksyncProvider.getTransactionFee(
      'Transfer',
      zksyncWallet.address() || '',
      options.tokenAddress
    )

    let transaction: zksync.Transaction | undefined
    if (!(await zksyncWallet.isSigningKeySet())) {
      const nonce = await zksyncWallet.getNonce('committed')
      const batchBuilder = zksyncWallet.batchBuilder(nonce)
      if (zksyncWallet.ethSignerType?.verificationMethod === 'ERC-1271') {
        const isOnchainAuthSigningKeySet = await zksyncWallet.isOnchainAuthSigningKeySet()
        if (!isOnchainAuthSigningKeySet) {
          const onchainAuthTransaction = await zksyncWallet.onchainAuthSigningKey()
          await onchainAuthTransaction?.wait()
        }
      }
      const newPubKeyHash = await zksyncWallet.signer.pubKeyHash()
      const accountID = await zksyncWallet.getAccountId()
      if (typeof accountID !== 'number') {
        throw new TypeError(
          'It is required to have a history of balances on the account to activate it.'
        )
      }
      const changePubKeyMessage = zksync.utils.getChangePubkeyLegacyMessage(
        newPubKeyHash,
        nonce,
        accountID
      )
      const ethSignature = (
        await zksyncWallet.ethMessageSigner().getEthMessageSignature(changePubKeyMessage)
      ).signature
      const keyFee = await zksyncProvider.getTransactionFee(
        {
          ChangePubKey: { onchainPubkeyAuth: false },
        },
        zksyncWallet.address() || '',
        options.tokenAddress
      )

      const changePubKeyTx = await zksyncWallet.signer.signSyncChangePubKey({
        accountId: accountID,
        account: zksyncWallet.address(),
        newPkHash: newPubKeyHash,
        nonce: nonce,
        ethSignature: ethSignature,
        validFrom: 0,
        validUntil: zksync.utils.MAX_TIMESTAMP,
        fee: keyFee.totalFee,
        feeTokenId: zksyncWallet.provider.tokenSet.resolveTokenId(options.tokenAddress),
      })
      batchBuilder.addChangePubKey({
        tx: changePubKeyTx,
        // @ts-ignore
        alreadySigned: true,
      })
      batchBuilder.addTransfer({
        to: options.toAddress,
        token: options.tokenAddress,
        amount: amount,
        fee: transferFee.totalFee,
      })
      const batchTransactionData = await batchBuilder.build()
      const transactions = await zksync.submitSignedTransactionsBatch(
        zksyncWallet.provider,
        batchTransactionData.txs,
        batchTransactionData.signature ? [batchTransactionData.signature] : undefined
      )
      for (const tx of transactions) {
        if (tx.txData.tx.type !== 'ChangePubKey') {
          transaction = tx
          break
        }
      }
    } else {
      transaction = await zksyncWallet.syncTransfer({
        to: options.toAddress,
        token: options.tokenAddress,
        amount: amount,
      })
    }

    return transaction
  }
}
