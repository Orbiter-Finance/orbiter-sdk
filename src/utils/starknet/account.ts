import {
  Account,
  number,
  KeyPair,
  ProviderInterface,
  SignerInterface,
  constants,
  transaction,
  Abi, 
  Call, 
  InvocationsDetails, 
  typedData
} from 'starknet'

const { toHex, bigNumberishArrayToDecimalStringArray, toBN } = number
const { fromCallsToExecuteCalldataWithNonce } = transaction
import { BigNumberish } from 'starknet/dist/utils/number'

export interface TransactionActionPayload {
  transactions: Call | Call[]
  abis?: Abi[]
  nonce?: BigNumberish;
  maxFee?: BigNumberish;
  version?: BigNumberish;
}

export class OfflineAccount extends Account {
  constructor(
    provider: ProviderInterface,
    address: string,
    keyPairOrSigner: KeyPair | SignerInterface
  ) {
    super(provider, address, keyPairOrSigner)
  }

  public async sendTransfer(payload: TransactionActionPayload) {

    if (! payload.maxFee) {
      // estimate fee with onchain nonce even tho transaction nonce may be different
      const { suggestedMaxFee } = await this.estimateFee(payload.transactions, {nonce: payload.nonce})
      payload.maxFee = suggestedMaxFee.toString()
    }
    // payload.maxFee = 10*17

    const invocation:InvocationsDetails = {
      nonce: payload.nonce,
      maxFee: payload.maxFee,
      version: payload.version
    }
    const transaction = await this.execute(payload.transactions, payload.abis, invocation)

    return transaction
  }

 
}
