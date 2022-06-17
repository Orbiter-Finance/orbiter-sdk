import axios from "axios"
import  * as ethers from "ethers";
import * as zksync from "zksync";
import { BigNumber } from "bignumber.js";
import { private_key_to_pubkey_hash, sign_musig } from 'zksync-crypto'


import { CHAIN_ID_TYPE } from "../utils/core";
import { equalsIgnoreCase } from "../utils";
import { 
    Transaction,
    TransactionTransferOptions
 } from "./transaction";
import { getAllZksTokenList } from "../utils/zkspace/zkspace_helper";


export default class TransactionZkSpace extends Transaction {
    static rinkeby = "https://api.zks.app/v3/4"
    static mainnet = "https://api.zks.app/v3/1"
    public async transfer(transactionOptions: TransactionTransferOptions) {
        const zkspaceProvier = new ethers.providers.Web3Provider((window as (typeof window & { ethereum: any })).ethereum);
        const signer = zkspaceProvier.getSigner();
        const walletAccount = transactionOptions.fromAddress;
        const allTokenList = (await getAllZksTokenList(this.chainId) as { chainId: string; tokenList: Array<any> })
        const privateKey = await TransactionZkSpace.getL1SigAndPriVateKey(signer);
        const accountInfo = await TransactionZkSpace.getAccountInfo(
            (this.chainId as CHAIN_ID_TYPE),
            privateKey,
            signer,
            walletAccount
        )

        const feeTokenId = 0;
        const zksNetWorkID =
          this.chainId === 512
            ? 133
            : "512";
        const tokenAddress = transactionOptions.tokenAddress;  
        let fee = await TransactionZkSpace.getZKSpaceTransferGasFee(
            this.chainId,
            walletAccount
          )
  
        const transferFee = zksync.utils.closestPackableTransactionFee(
        ethers.utils.parseUnits(fee.toString(), 18)
        )

        const tokenInfo = allTokenList.tokenList.find(
            (item) => item.address == tokenAddress
          )
        
        const transferValue = zksync.utils.closestPackableTransactionAmount(
            transactionOptions.amount
        )
        
        const { pubKey, l2SignatureOne } = await TransactionZkSpace.getL2SigOneAndPK(
            privateKey,
            accountInfo,
            walletAccount,
            transactionOptions.toAddress,
            tokenInfo ? tokenInfo.id : 0,
            transferValue,
            feeTokenId,
            transferFee,
            zksNetWorkID
          )
          const l2SignatureTwo = await TransactionZkSpace.getL2SigTwoAndPK(
            signer,
            accountInfo,
            transactionOptions.toAddress,
            transferValue,
            fee,
            zksNetWorkID,
            tokenInfo
          )
        
        const req = {
            signature: {
                type: 'EthereumSignature',
                signature: l2SignatureTwo,
            },
            fastProcessing: false,
            tx: {
                type: 'Transfer',
                accountId: accountInfo.id,
                from: walletAccount,
                to: transactionOptions.toAddress,
                token: tokenInfo ? tokenInfo.id : 0,
                amount: transferValue.toString(),
                feeToken: feeTokenId,
                fee: transferFee.toString(),
                chainId: zksNetWorkID,
                nonce: accountInfo.nonce,
                signature: {
                pubKey: pubKey,
                signature: l2SignatureOne,
                },
        }}

        let response = await axios.post(
            (this.chainId === 512 ? TransactionZkSpace.rinkeby : TransactionZkSpace.mainnet) +
              '/tx',
            {
              signature: req.signature,
              fastProcessing: req.fastProcessing,
              tx: req.tx,
            }
        )

        return response;
    }

    static async getL2SigTwoAndPK(
        signer,
        accountInfo,
        makerAddress,
        transferValue,
        fee,
        zksChainID,
        tokenInfo
      ) {
        try {
          const l2MsgParams = {
            accountId: accountInfo.id,
            to: makerAddress,
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
            `Account Id: ${l2MsgParams.accountId}`
          const l2SignatureTwo = await signer.signMessage(l2Msg)
          return l2SignatureTwo
        } catch (error) {
          throw new Error(`getL2SigTwoAndPK error ${error.message}`)
        }
      }

    static async getZKSpaceTransferGasFee(
        localChainID,
        account
      ): Promise<Number> {
        //get usd to eth rat
        const usdRates: any = await getExchangeRates()
        let ethPrice = usdRates && usdRates['ETH'] ? 1 / usdRates['ETH'] : 2000
    
        //get gasfee width eth
        const url = `${localChainID === 512
          ? TransactionZkSpace.rinkeby
          : TransactionZkSpace.mainnet
          }/account/${account}/fee`
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

    static async  getL2SigOneAndPK(
        privateKey,
        accountInfo,
        walletAccount,
        makerAddress,
        tokenId,
        transferValue,
        feeTokenId,
        transferFee,
        zksChainID
    ) {
        const msgBytes = ethers.utils.concat([
            '0x05',
            zksync.utils.numberToBytesBE(accountInfo.id, 4),
            walletAccount,
            makerAddress,
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

    static async getZKAccountInfo(localChainID: CHAIN_ID_TYPE, walletAccount: string) {
        return new Promise((resolve, reject) => {
            if (localChainID !== 12 && localChainID !== 512) {
              reject({
                errorCode: 1,
                errMsg: 'getZKSpaceAccountInfoError_wrongChainID',
              })
            }
            const url =
              (localChainID === 512
                ? "https://api.zks.app/v3/4"
                : "https://api.zks.app/v3/1") +
              '/account/' +
              walletAccount +
              '/' +
              'info'
            axios
              .get(url)
              .then(function (response) {
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

    static async registerAccount(
        accountInfo,
        privateKey,
        fromChainID,
        signer,
        walletAccount
      ) {
        try {
          const pubKeyHash = ethers.utils
            .hexlify(private_key_to_pubkey_hash(privateKey))
            .substr(2)
          const hexlifiedAccountId = TransactionZkSpace.toHex(accountInfo.id, 4)
          const hexlifiedNonce = TransactionZkSpace.toHex(accountInfo.nonce, 4)
          // Don't move here any way and don't format it anyway!!!
          // Don't move here any way and don't format it anyway!!!
          // Don't move here any way and don't format it anyway!!!
          // Don't move here any way and don't format it anyway!!!
          // Don't move here any way and don't format it anyway!!!
          let resgiterMsg = `Register ZKSwap pubkey:
    
    ${pubKeyHash}
    nonce: ${hexlifiedNonce}
    account id: ${hexlifiedAccountId}
    
    Only sign this message for a trusted client!`
    
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
    static toHex(num, length) {
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

    static async getAccountInfo(
        chainId: CHAIN_ID_TYPE,
        privateKey: Uint8Array,
        signer: ethers.ethers.providers.JsonRpcSigner,
        walletAccount: string
    ) {
        try {
            // i am confused by how to declare the type of field "accountInfo"
            const accountInfo: any = await TransactionZkSpace.getZKAccountInfo(
              chainId,
              walletAccount
            )
            if (
              accountInfo.pub_key_hash ==
              'sync:0000000000000000000000000000000000000000'
            ) {
              const new_pub_key_hash = await TransactionZkSpace.registerAccount(
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

    static async getL1SigAndPriVateKey(signer: ethers.ethers.providers.JsonRpcSigner) {
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
}

let exchangeRates: { [key: string]: string } | undefined

/**
 * @param sourceCurrency
 * @returns
 */
export async function getExchangeToUsdRate(
  sourceCurrency = 'ETH'
): Promise<BigNumber> {
  // toUpperCase
  sourceCurrency = sourceCurrency.toUpperCase()

  const currency = 'USD'

  let rate = -1
  try {
    if (!exchangeRates) {
      exchangeRates = await cacheExchangeRates(currency)
    }
    if (exchangeRates?.[sourceCurrency]) {
      rate = Number(exchangeRates[sourceCurrency])
    }
  } catch (error) {
      console.log("error", error);
  }

  return new BigNumber(rate)
}

/**
 * @param value
 * @param sourceCurrency
 * @returns
 */
export async function exchangeToUsd(
  value: string | number | BigNumber,
  sourceCurrency: string
): Promise<BigNumber> {
  if (!(value instanceof BigNumber)) {
    value = new BigNumber(value)
  }

  const rate = await getExchangeToUsdRate(sourceCurrency)
  if (rate.comparedTo(0) !== 1) {
    return new BigNumber(0)
  }

  return value.dividedBy(rate)
}

/**
 *
 * @param currency
 * @returns
 */
export async function cacheExchangeRates(currency = 'USD'): Promise<any> {
  // cache
  exchangeRates = await getRates(currency)
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
async function getRates(currency) {
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
/**
 *
 * @param currency
 * @returns
 */
export async function getExchangeRates(currency = 'USD') {
  try {
    if (!exchangeRates) {
      exchangeRates = await cacheExchangeRates(currency)
    }
  } catch (error) {
    console.log("err", error);
  }

  return exchangeRates
}
