import { TransactionStarkNet } from '../src/transaction/transaction_starknet'
import { TransactionTransferOptions } from '../src/transaction/transaction'
import { utils } from 'ethers'
import testconfig from './test-config'

describe('test transcation_starknet', () => {
  jest.setTimeout(30000);
  it('test getNetworkNonce', async() => {
    const testNetId = 44
    const starkNetTranscation: TransactionStarkNet = new TransactionStarkNet(
      testNetId, 
      testconfig.STARK_NET_ACCOUNT1_KEY,
      testconfig.STARK_NET_ACCOUNT1_ADDRESS
    )

    const nonceResult = await starkNetTranscation.getNetworkNonce()
    console.log(`nonceResult ${JSON.stringify(nonceResult)}`)
    expect(nonceResult).toBeDefined()
  })
  it('test transfer starknet', async() => {
    const testNetId = 44
    const starkNetTranscation: TransactionStarkNet = new TransactionStarkNet(
      testNetId, 
      testconfig.STARK_NET_ACCOUNT1_KEY,
      testconfig.STARK_NET_ACCOUNT1_ADDRESS
    )

    let options: TransactionTransferOptions = {
      amount: utils.parseEther("0.000002"),
      tokenAddress: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", // ETH 
      toAddress: "0x05073ce06Da0165424d8B63ab4e478dbD3Af8d66413aBF950f6771583cCbCC47",
      nonce: 0
    }

    console.log(`starkNet before call`)

    const result = await starkNetTranscation.transfer(options)
    console.log(`starkNet result ${JSON.stringify(result)}`)
    const waitforResult = await starkNetTranscation.starkNetProvider.getTransactionStatus(result.transaction_hash);
    console.log(`tx Result: ${JSON.stringify(waitforResult)}`)
    expect(waitforResult.tx_status === "RECEIVED").toBe(true)
  }) 
})