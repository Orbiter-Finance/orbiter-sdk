import axios from 'axios'
import { BigNumber } from 'bignumber.js'
import * as zksync from "zksync";
import { private_key_to_pubkey_hash, sign_musig } from "zksync-crypto"
import { ethers, Signer, BigNumber as EtherBigNumber, utils, BigNumberish} from 'ethers'

import config from '../../config/chains_api'
import { equalsIgnoreCase } from '../index';
import { ChainValidator, ChainValidatorTypes } from '../../utils/validator'


let exchangeRates: { [key: string]: string } | undefined

export type ZKspaceAccountInfo = {
  id: number,
  nonce: number,
  pub_key_hash: string,
  seq_id: number
}

export type ZKspaceTokenInfo = {
  id: number,
  address: string,
  decimals: number,
  symbol: string,
  icon: string,
  approved: boolean
}

export type ZKspaceAllTokenInfo = {
  chainID: string,
  tokenList: Array<ZKspaceTokenInfo>,
}

// https://en.wiki.zks.org/interact-with-zkswap/make-transaction#transfer
export type ZKspaceTransferData = {
  type: string,
  accountId: number,
  from: string,
  to: string,
  token: number,
  amount: string,
  feeToken: number,
  fee: string,
  chainId: number,
  nonce: number,
  signature : {
    pubKey: string
    signature: string
  }
}

export async function getPrivateKey(signer: Signer){
  try {
    const msg =
      'Access ZKSwap account.\n\nOnly sign this message for a trusted client!'
    const signature = await signer.signMessage(msg)
    const seed = ethers.utils.arrayify(signature)
    const privateKey = await zksync.crypto.privateKeyFromSeed(seed)
    return privateKey
  } catch (error) {
    throw new Error(`getL1SigAndPriVateKey error ${error.message}`)
  }
}

export function getPublicKeyHash(privateKey: Uint8Array): string{
  const pubKeyHash = `sync:${utils.hexlify(private_key_to_pubkey_hash(privateKey)).substr(2)}`
  return pubKeyHash
}

export function getSignMessage(privateKey:Uint8Array, msgBytes:Uint8Array) {
  // https://en.wiki.zks.org/interact-with-zkswap/make-transaction#signature
  const signaturePacked = sign_musig(privateKey, msgBytes)  
  const pubKey = utils.hexlify(signaturePacked.slice(0, 32)).substr(2)
  const signature = utils.hexlify(signaturePacked.slice(32)).substr(2)
  
  return {
      pubKey,
      signature
  }
}

export async function changePubKey(
  localChainId: number,
  accountInfo: ZKspaceAccountInfo, 
  privateKey: Uint8Array,
  walletAccount: string,
  signer: ethers.Signer) {
    const pubKeyHash = ethers.utils.hexlify(private_key_to_pubkey_hash(privateKey)).substr(2)
    // const hexlifiedAccountId = ethers.utils.hexlify(accountInfo.id)
    // const hexlifiedNonce = ethers.utils.hexlify(accountInfo.nonce)
    const hexlifiedAccountId = toHex(accountInfo.id, 4)
    const hexlifiedNonce = toHex(accountInfo.nonce, 4)
    let resgiterMsg = `Register ZKSwap pubkey:

${pubKeyHash}
nonce: ${hexlifiedNonce}
account id: ${hexlifiedAccountId}

Only sign this message for a trusted client!`
  const registerSignature = await signer.signMessage(resgiterMsg)
  const url:string = GetZKSpaceUrl(localChainId) + '/tx'
  let transferResult = await axios.post(
    url,
    {
      signature: null,
      fastProcessing: null,
      extraParams: null,
      tx: {
        account: walletAccount,
        accountId: accountInfo.id,
        ethSignature: registerSignature,
        newPkHash: `sync:` + pubKeyHash,
        nonce: 0,
        type: 'ChangePubKey',
      },
    },
    {
      headers: {
        'zk-account': walletAccount,
      },
    }
  )
  return transferResult
  
}

export function GetZKSpaceUrl(localChainId: number) {

  if(ChainValidator.zkspace(localChainId) == ChainValidatorTypes.Testnet){
    return config.zkspace.Testnet
  } else if (ChainValidator.zkspace(localChainId) == ChainValidatorTypes.Mainnet) {
    return config.zkspace.Mainnet
  } else {
    throw new Error(`${localChainId} not support yet`)
  }
}

export function ZksSignMessage(privateKey:Uint8Array, msgBytes:Uint8Array) {
  const signaturePacked = sign_musig(privateKey, msgBytes) 
  const pubKey = utils.hexlify(signaturePacked.slice(0, 32)).substr(2)
  const signature = utils.hexlify(signaturePacked.slice(32)).substr(2)
  return {
      pubKey,
      signature
  }
}

export async function getZKSTokenInfo(localChainID:number, tokenAddress: string): Promise<ZKspaceTokenInfo> {
  const allTokenInfo = await getAllZksTokenList(localChainID)
  for(let token of allTokenInfo.tokenList) {
    if (token.address === tokenAddress){
      return token
    }
  }
  throw new Error(`cant get ${tokenAddress} token info`)
}

export async function getAllZksTokenList(localChainID): Promise<ZKspaceAllTokenInfo>{
  return new Promise(async (resolve, reject) => {
    let isContiue = true
    let startID = 0
    let zksTokenAllList = []
    try {
      while (isContiue) {
        var zksTokenListReq = {
          from: startID,
          limit: 100,
          direction: 'newer',
          localChainID: localChainID,
        }
        let zksList = await getZKSTokenList(zksTokenListReq)
        if (zksList.length !== 100) {
          isContiue = false
        } else {
          startID = zksList[99].id + 1
        }
        zksTokenAllList = zksTokenAllList.concat(zksList)
      }
      let zksTokenResult = {
        chainID: localChainID,
        tokenList: zksTokenAllList,
      }
      resolve(zksTokenResult);
    } catch (error) {
      console.log('zk_TokenListGetError =', error)
      reject(error);
    }
  })
}
async function getZKSTokenList(req) {
  const url = `${req.localChainID === 512 ? config.zkspace.Testnet : config.zkspace.Mainnet
      }/tokens?from=${req.from}&limit=${req.limit}&direction=${req.direction}`
  try {
    const response = await axios.get(url)
    if (response.status === 200) {
      var respData = response.data
      if (respData.success) {
        return respData.data
      } else {
        throw new Error(`respData.status not success`)
      }
    } else {
      throw new Error(`getZKSTokenList NetWorkError`)
    }
  } catch (error) {
    console.error('getZKSTokenList error =', error)
    throw new Error(`getZKSTokenList error = ${error.message}`)
  }
}

export async function getZKSAccountInfo(localChainID: number, walletAccount: string):Promise<ZKspaceAccountInfo>{
  
  return new Promise((resolve, reject) => {
    if (localChainID !== 12 && localChainID !== 512) {
      reject({
        errorCode: 1,
        errMsg: 'getZKSpaceAccountInfoError_wrongChainID',
      })
    }
    const url = GetZKSpaceUrl(localChainID) + '/account/' + walletAccount + '/' + 'info'
    axios.get(url).then(function (response) {
      if (response.status === 200 && response.statusText == 'OK') {
        var respData = response.data
        if (respData.success == true) {
          resolve(respData.data)
        } else {
          reject(respData.data)
        }
      } else {
        reject({
          errorCode: 1,
          errMsg: 'NetWorkError',
        })
      }
    })
    .catch(function (error) {
      reject({
        errorCode: 2,
        errMsg: error,
      })
    })
    })
}

export async function getZKSpaceTransferGasFee(localChainID: number, walletAccount: string) {
  //get usd to eth rat
  const usdRates: any = await getExchangeRates()
  let ethPrice = usdRates && usdRates['ETH'] ? 1 / usdRates['ETH'] : 2000
  //get gasfee width eth
  const url = `${GetZKSpaceUrl(localChainID)}/account/${walletAccount}/fee`
  const response = await axios.get(url)
  if (response.status === 200 && response.statusText == 'OK') {
    var respData = response.data
    if (respData.success == true) {
      const gasFee = new BigNumber(respData.data.transfer).dividedBy(
        new BigNumber(ethPrice)
      )
      let gasFee_fix = gasFee.decimalPlaces(6, BigNumber.ROUND_UP)
      return Number(gasFee_fix)
    } else {
      throw new Error(respData.data)
    }
  } else {
    throw new Error('getZKSTransferGasFee NetWorkError')
  }
}

export async function cacheExchangeRates(currency:string = 'USD'): Promise<any> {
  // cache
  let exchangeRates = await getRates(currency)
  if (exchangeRates) {
    let metisExchangeRates = await getRates('metis')
    if (metisExchangeRates && metisExchangeRates["USD"]) {
      let usdToMetis = 1 / Number(metisExchangeRates["USD"])
      exchangeRates["METIS"] = String(usdToMetis)
    }
    return exchangeRates
  } else {
    return undefined
  }
}

async function getRates(currency:string) {
  const resp = await axios.get(
    `https://api.coinbase.com/v2/exchange-rates?currency=${currency}`
  )
  const data = resp.data?.data
  // check
  if (!data || !equalsIgnoreCase(data.currency, currency) || !data.rates) {
    return undefined
  }
  return data.rates
}

export async function getExchangeRates(currency:string = 'USD') {
  try {
    if (!exchangeRates) {
      exchangeRates = await cacheExchangeRates(currency)
    }
  } catch (error) {
    console.log("err", error);
  }

  return exchangeRates
}


export function getL2SigOneAndPK(
  privateKey: Uint8Array,
  accountInfo: ZKspaceAccountInfo,
  fromAddress: string,
  toAddress: string,
  tokenId: number,
  transferValue: EtherBigNumber,
  feeTokenId: number,
  transferFee: EtherBigNumber,
  zksChainID: number
) {
  const msgBytes = ethers.utils.concat([
    '0x05',
    zksync.utils.numberToBytesBE(accountInfo.id, 4),
    fromAddress,
    toAddress,
    zksync.utils.numberToBytesBE(tokenId, 2),
    zksync.utils.packAmountChecked(transferValue),
    zksync.utils.numberToBytesBE(feeTokenId, 1),
    zksync.utils.packFeeChecked(transferFee),
    zksync.utils.numberToBytesBE(zksChainID, 1),
    zksync.utils.numberToBytesBE(accountInfo.nonce, 4),
  ])
  const signaturePacked = sign_musig(privateKey, msgBytes)
  const pubKey = ethers.utils.hexlify(signaturePacked.slice(0, 32)).substr(2)
  const l2SignatureOne = ethers.utils
    .hexlify(signaturePacked.slice(32))
    .substr(2)
  return { pubKey, l2SignatureOne }
}

export async function getL2SigTwoAndPK(
  signer: Signer,
  accountInfo: ZKspaceAccountInfo,
  toAddress: string,
  transferValue: ethers.BigNumberish,
  fee: number,
  zksChainID: number,
  tokenInfo: ZKspaceTokenInfo
) {
  try {
    const l2MsgParams = {
      accountId: accountInfo.id,
      to: toAddress,
      tokenSymbol: tokenInfo ? tokenInfo.symbol : 'ETH',
      tokenAmount: ethers.utils.formatUnits(
        transferValue,
        tokenInfo.decimals
      ),
      feeSymbol: 'ETH',
      fee: fee.toString(),
      zksChainID,
      nonce: accountInfo.nonce,
    }
    const l2Msg =
      `Transfer ${l2MsgParams.tokenAmount} ${l2MsgParams.tokenSymbol}\n` +
      `To: ${l2MsgParams.to.toLowerCase()}\n` +
      `Chain Id: ${l2MsgParams.zksChainID}\n` +
      `Nonce: ${l2MsgParams.nonce}\n` +
      `Fee: ${l2MsgParams.fee} ${l2MsgParams.feeSymbol}\n` +
      // `Fee: 0.0 ${l2MsgParams.feeSymbol}\n` +
      `Account Id: ${l2MsgParams.accountId}`
    const l2SignatureTwo = await signer.signMessage(l2Msg)
    return l2SignatureTwo
  } catch (error) {
    throw new Error(`getL2SigTwoAndPK error ${error.message}`)
  }
}

export async function getL1SigAndPriVateKey(signer: ethers.Wallet) {
  try {
    const msg =
      'Access ZKSwap account.\n\nOnly sign this message for a trusted client!'
    const signature = await signer.signMessage(msg)
    const seed = ethers.utils.arrayify(signature)
    const privateKey = await zksync.crypto.privateKeyFromSeed(seed)
    return privateKey
  } catch (error) {
    throw new Error(`getL1SigAndPriVateKey error ${error.message}`)
  }
}

export async function getAccountInfo(
  chainId: number,
  privateKey: Uint8Array,
  signer: ethers.providers.JsonRpcSigner,
  walletAccount: string
) {
  try {
    // i am confused by how to declare the type of field "accountInfo"
    const accountInfo: ZKspaceAccountInfo = await getZKSAccountInfo(
      chainId,
      walletAccount
    )
    if (
      accountInfo.pub_key_hash ==
      'sync:0000000000000000000000000000000000000000'
    ) {
      const new_pub_key_hash = await registerAccount(
        accountInfo,
        privateKey,
        chainId,
        signer,
        walletAccount
      )
      accountInfo.pub_key_hash = new_pub_key_hash
      accountInfo.nonce = accountInfo.nonce + 1
    }
    return accountInfo
  } catch (error) {
    throw new Error(`getAccountInfo error ${error.message}`)
  }
}

export async function registerAccount(
  accountInfo: ZKspaceAccountInfo,
  privateKey: Uint8Array,
  fromChainID: number,
  signer: Signer,
  walletAccount: string
) {
  try {
    const pubKeyHash = ethers.utils
      .hexlify(private_key_to_pubkey_hash(privateKey))
      .substr(2)
    const hexlifiedAccountId = toHex(accountInfo.id, 4)
    const hexlifiedNonce = toHex(accountInfo.nonce, 4)
    let resgiterMsg = `Register ZKSwap pubkey: ${pubKeyHash} nonce: ${hexlifiedNonce} account id: ${hexlifiedAccountId} Only sign this message for a trusted client!`

    const registerSignature = await signer.signMessage(resgiterMsg)
    const url = `${
      fromChainID == 512 ? "https://api.zks.app/v3/4" : "https://api.zks.app/v3/1"
    }/tx`
    let transferResult = await axios.post(
      url,
      {
        signature: null,
        fastProcessing: null,
        extraParams: null,
        tx: {
          account: walletAccount,
          accountId: accountInfo.id,
          ethSignature: registerSignature,
          newPkHash: `sync:` + pubKeyHash,
          nonce: 0,
          type: 'ChangePubKey',
        },
      },
      {
        headers: {
          'zk-account': walletAccount,
        },
      }
    )
    if (transferResult.status == 200 && transferResult.data.success) {
      return transferResult.data
    } else {
      throw new Error('registerAccount fail')
    }
  } catch (error) {
    throw new Error(`registerAccount error ${error.message}`)
  }
}


export function toHex(num: number, length: number) {
  var charArray = ['a', 'b', 'c', 'd', 'e', 'f']
  let strArr = Array(length * 2).fill('0')
  var i = length * 2 - 1
  while (num > 15) {
    var yushu = num % 16
    if (yushu >= 10) {
      let index = yushu % 10
      strArr[i--] = charArray[index]
    } else {
      strArr[i--] = yushu.toString()
    }
    num = Math.floor(num / 16)
  }

  if (num != 0) {
    if (num >= 10) {
      let index = num % 10
      strArr[i--] = charArray[index]
    } else {
      strArr[i--] = num.toString()
    }
  }
  strArr.unshift('0x')
  var hex = strArr.join('')
  return hex
}

