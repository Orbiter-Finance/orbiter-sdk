import { Web3Provider } from '@ethersproject/providers'
import {
  AccountInfo,
  ChainId,
  ConnectorNames,
  ExchangeAPI,
  generateKeyPair,
  GlobalAPI,
  UserAPI,
  VALID_UNTIL,
} from '@loopring-web/loopring-sdk'
import Web3 from 'web3'
import { ChainValidator, ChainValidatorTypes } from '../utils/validator'
import { Transaction, TransactionTransferOptions } from './transaction'

export class TransactionLoopring extends Transaction {
  private static accounts: {
    [key: string]: {
      accountInfo?: AccountInfo
      apiKey?: string
      eddsaKey?: {
        sk: string
        [key: string]: any
      }
    }
  } = {}

  private web3: Web3

  constructor(chainId: number, web3: Web3) {
    const signer = new Web3Provider(<any>web3.currentProvider).getSigner()
    super(chainId, signer)
    this.web3 = web3
  }

  /**
   * @param fromAddress
   */
  private async checkLoopringAccountKey(fromAddress: string) {
    const networkId = ChainValidator.loopring(this.chainId) == ChainValidatorTypes.Mainnet ? 1 : 5
    const exchangeApi = new ExchangeAPI({ chainId: networkId })
    const userApi = new UserAPI({ chainId: networkId })

    if (!TransactionLoopring.accounts[fromAddress]) {
      TransactionLoopring.accounts[fromAddress] = {}
    }
    const account = TransactionLoopring.accounts[fromAddress]

    // Init accountInfo
    if (!account.accountInfo) {
      let accountResult = await exchangeApi.getAccount({ owner: fromAddress })

      if (!accountResult.accInfo || !accountResult.raw_data) {
        throw Error('Loopring account unlocked!')
      }

      account.accountInfo = accountResult.accInfo
    }

    if (!account.apiKey) {
      const { exchangeInfo } = await exchangeApi.getExchangeInfo()
      const { accountInfo } = account

      const options = {
        web3: this.web3,
        address: fromAddress,
        keySeed:
          accountInfo.keySeed && accountInfo.keySeed !== ''
            ? accountInfo.keySeed
            : GlobalAPI.KEY_MESSAGE.replace(
                '${exchangeAddress}',
                exchangeInfo.exchangeAddress
              ).replace('${nonce}', (accountInfo.nonce - 1).toString()),
        walletType: ConnectorNames.WalletLink,
        chainId:
          ChainValidator.loopring(this.chainId) == ChainValidatorTypes.Mainnet
            ? ChainId.MAINNET
            : ChainId.GOERLI,
      }
      const eddsaKey = await generateKeyPair(options)

      const { apiKey } = await userApi.getUserApiKey(
        {
          accountId: account.accountInfo.accountId,
        },
        eddsaKey.sk
      )
      if (!apiKey) {
        throw Error('Get Loopring ApiKey Error')
      }
      account.apiKey = apiKey
      account.eddsaKey = eddsaKey
    }
  }

  /**
   * @param options
   */
  public async transfer(
    options: TransactionTransferOptions & { fromAddress: string; memo?: string }
  ) {
    const networkId = ChainValidator.loopring(this.chainId) == ChainValidatorTypes.Mainnet ? 1 : 5
    const exchangeApi = new ExchangeAPI({ chainId: networkId })
    const userApi = new UserAPI({ chainId: networkId })
    const { exchangeInfo } = await exchangeApi.getExchangeInfo()

    // Check & get loopring's account
    await this.checkLoopringAccountKey(options.fromAddress)
    const { accountInfo, apiKey, eddsaKey } = TransactionLoopring.accounts[options.fromAddress]

    // Get storageId
    const GetNextStorageIdRequest = {
      accountId: accountInfo.accountId,
      sellTokenId: 0, // Now only eth
    }
    const storageId = await userApi.getNextStorageId(GetNextStorageIdRequest, apiKey)

    // Transfer
    const OriginTransferRequestV3 = {
      exchange: exchangeInfo.exchangeAddress,
      payerAddr: options.fromAddress,
      payerId: accountInfo.accountId,
      payeeAddr: options.toAddress,
      payeeId: 0,
      storageId: storageId.offchainId,
      token: {
        tokenId: 0,
        volume: options.amount + '',
      },
      maxFee: {
        tokenId: 0,
        volume: '940000000000000',
      },
      validUntil: VALID_UNTIL,
      memo: options.memo,
    }
    return await userApi.submitInternalTransfer({
      request: <any>OriginTransferRequestV3,
      web3: this.web3,
      chainId:
        ChainValidator.loopring(this.chainId) == ChainValidatorTypes.Mainnet
          ? ChainId.MAINNET
          : ChainId.GOERLI,
      walletType: ConnectorNames.WalletLink,
      eddsaKey: eddsaKey.sk,
      apiKey: apiKey,
      isHWAddr: false,
    })
  }
}
