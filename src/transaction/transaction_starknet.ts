
import { Transaction, TransactionTransferOptions } from './transaction'

import { ethers} from 'ethers';
import {
  Abi,
  ec,
  Provider,
  SequencerProvider,
  Signer,
} from 'starknet'

import { BigNumberish } from 'starknet/dist/utils/number'

import Keyv from 'keyv'
import { max } from 'lodash'

import { compileCalldata } from 'starknet/dist/utils/stark'

import KeyvFile from '../utils/keyvFile'

import {
  GetStarkNetUrl,
  getUint256CalldataFromBN,
} from "../utils/starknet/starknet_helper"

import {
  OfflineAccount,
  TransactionActionPayload
} from "../utils/starknet/account"

import ERC20ABI from "../utils/starknet/ERC20_abi.json" 
import { bnToUint256 } from 'starknet/dist/utils/uint256';

export class TransactionStarkNet extends Transaction {
  private starkNetUrl: string
  private privateKey: string
  private address: string
  public starkNetProvider: SequencerProvider
  private starkNetSigner: Signer
  public starkNetAcc: OfflineAccount
  private cache: Keyv


  constructor (chainId: number, privateKey: string, address: string) {
    const signer = new ethers.Wallet("0xDEADDEADc193e45869feabfc94a306c218f12ad0b2e8ee9deb5314259f3fb408")
    super(chainId, signer)

    
    this.chainId = chainId
    this.privateKey = privateKey
    this.starkNetUrl = GetStarkNetUrl(chainId)
    this.address = address
    // this.starkNetProvider = new Provider({ network: <any>this.starkNetUrl })
    const starkPair = ec.getKeyPair(this.privateKey)
    this.starkNetProvider = new SequencerProvider({ baseUrl: this.starkNetUrl })
    this.starkNetSigner = new Signer(starkPair)
    this.starkNetAcc = new OfflineAccount(this.starkNetProvider, this.address, this.starkNetSigner)
    this.cache = new Keyv({
      store: new KeyvFile({
        filename: `logs/nonce/starknet`, // the file path to store the data
        expiredCheckDelay: 999999 * 24 * 3600 * 1000, // ms, check and remove expired data in each ms
        writeDelay: 100, // ms, batch write to disk in a specific duration, enhance write performance.
        encode: JSON.stringify, // serialize function
        decode: JSON.parse, // deserialize function
      }),
    })
  }

  public async transfer(options: TransactionTransferOptions): Promise<any> {
    const tokenAddress = options.tokenAddress
    const recipient = options.toAddress
    const amount = options.amount
    const nonce = options.nonce
    const maxFee = options.maxFee
    const transferResult = await this.signTransfer(tokenAddress, recipient, amount?amount.toString():"", maxFee?maxFee.toString():"", nonce)
    return transferResult

  }

  public async signTransfer(
    tokenAddress: string,
    recipient: string,
    amount: BigNumberish,
    maxFee: BigNumberish,
    nonce?: number,
  ) {

    if (!nonce) {
      // nonce = (await this.takeOutNonce()).nonce
      nonce = await this.getNetworkNonce()
    }
    const calldata = {
      recipient,
      amount: getUint256CalldataFromBN(amount),
    }

    const payLoad: TransactionActionPayload = {
      transactions: {
        contractAddress: tokenAddress,
        entrypoint: "transfer",
        calldata: compileCalldata(calldata),
      },
      abis: [ERC20ABI as Abi],
      maxFee: maxFee,
      nonce: nonce,
    }
    const result = await this.starkNetAcc.sendTransfer(payLoad)
    return result

  }

  public async takeOutNonce() {
    const nonces = await this.getAvailableNonce()
    const takeNonce = nonces.splice(0, 1)[0]
    const cacheKey = `nonces:${this.address.toLowerCase()}`
    await this.cache.set(cacheKey, nonces)
    return {
      nonce: takeNonce,
      rollback: async () => {
        const nonces = await this.getAvailableNonce()
        nonces.push(takeNonce)
        await this.cache.set(cacheKey, nonces)
      },
    }
  }

  public async getAvailableNonce() {
    const cacheKey = `nonces:${this.address.toLowerCase()}`
    let nonces: any = (await this.cache.get(cacheKey)) || []
    if (nonces && nonces.length <= 5) {
      // render
      let localLastNonce: number = max(nonces) || 0
      const networkLastNonce = await this.getNetworkNonce()
      if (networkLastNonce > localLastNonce) {
        nonces = [networkLastNonce]
        localLastNonce = networkLastNonce
        // clear
      }
      for (let i = nonces.length; i <= 10; i++) {
        localLastNonce++
        nonces.push(localLastNonce)
      }
    }
    nonces.sort((n1, n2) => n1 - n2)
    await this.cache.set(cacheKey, nonces)
    return nonces
  }

  public async getNetworkNonce() {
    let nonceResult = await this.starkNetAcc.getNonce()

    return Number(nonceResult)
  }
}