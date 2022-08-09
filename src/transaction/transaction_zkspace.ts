import axios from "axios"
import { BigNumberish, Signer, BigNumber, utils } from 'ethers'
import * as zksync from "zksync";
import config from '../config/chains_api'
import { private_key_to_pubkey_hash, sign_musig } from 'zksync-crypto'

import { Transaction, TransactionTransferOptions } from './transaction'
import { ChainValidator, ChainValidatorTypes } from '../utils/validator'
import configGlobal from '../config'

import { 
  getAllZksTokenList,
  getZKSpaceTransferGasFee,
  getL2SigOneAndPK,
  getL2SigTwoAndPK,
  getL1SigAndPriVateKey,
  ZKspaceTokenInfo,
  ZKspaceTransferData,
  ZKspaceAccountInfo,
  getZKSAccountInfo,
  GetZKSpaceUrl,
  getPrivateKey,
} from "../utils/zkspace/zkspace_helper";

export class TranscationZKspace extends Transaction {

  private zkSpaceUrl: string

  constructor(chainId: number, signer: Signer){

    super(chainId, signer)
    this.zkSpaceUrl = GetZKSpaceUrl(this.chainId)
  
  }

  private async getTokenInfo(tokenAddress:string){

    const allTokenInfo = await getAllZksTokenList(this.chainId)
    for(let token of allTokenInfo.tokenList) {
      if (token.address === tokenAddress){
        return token
      }
    }
    return undefined
  }

  /**
   * @param options
   */
  public async transfer(Options: TransactionTransferOptions) {
    
   
    let tokenInfo:ZKspaceTokenInfo = await this.getTokenInfo(Options.tokenAddress)
    let feeTokenId:number = 0 // ETH
    let fromAddress = await this.signer.getAddress()
    let zkAccountInfo:ZKspaceAccountInfo = await getZKSAccountInfo(this.chainId, fromAddress)
    let privateKey = await getPrivateKey(this.signer)
    let fee = (await getZKSpaceTransferGasFee(this.chainId, fromAddress))
    let transferFee = zksync.utils.closestPackableTransactionFee(
      utils.parseUnits(fee.toString(), 18)
    )
    let zksChainId = Number(configGlobal.orbiterChainIdToNetworkId[this.chainId])

    let l2SignatureTwo = await getL2SigTwoAndPK(this.signer, zkAccountInfo, Options.toAddress, Options.amount,
      fee, Number(configGlobal.orbiterChainIdToNetworkId[this.chainId]), tokenInfo)
    let l2SignatureOne = getL2SigOneAndPK(privateKey, zkAccountInfo, fromAddress, Options.toAddress,tokenInfo.id, BigNumber.from(Options.amount),
      feeTokenId, transferFee, zksChainId)
    
    const transferReqData:ZKspaceTransferData = {
      type: 'Transfer',
      accountId: zkAccountInfo.id,
      from: fromAddress ,
      to: Options.toAddress,
      token: tokenInfo.id,
      amount: Options.amount.toString(),
      feeToken: tokenInfo.id,
      fee: transferFee.toString(),
      chainId: zksChainId,
      nonce: zkAccountInfo.nonce,
      // nonce: 10,
      signature: {
        pubKey: l2SignatureOne.pubKey,
        signature: l2SignatureOne.l2SignatureOne,
      }
    }
    const req = {
      signature: {
          type: 'EthereumSignature',
          signature: l2SignatureTwo,
      },
      fastProcessing: false,
      tx: transferReqData
      
    }
    const url = this.zkSpaceUrl + '/tx'
    let response = await axios.post(
      url, {
        signature: req.signature,
        fastProcessing: req.fastProcessing,
        tx: req.tx,
      }
    )
    return response
  }
}