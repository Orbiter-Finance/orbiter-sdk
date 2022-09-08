import { ChainValidator, ChainValidatorTypes } from '../../utils/validator'
import { BigNumberish } from 'starknet/dist/utils/number'
import config from '../../config/chains_api'
import {
  uint256,
} from 'starknet'

export function GetStarkNetUrl(localChainId: number) {
  if(ChainValidator.starknet(localChainId) == ChainValidatorTypes.Testnet){
    return config.starknet.Testnet
  } else if (ChainValidator.starknet(localChainId) == ChainValidatorTypes.Mainnet) {
    return config.starknet.Mainnet
  } else {
    throw new Error(`${localChainId} not support yet`)
  }
}

export function getUint256CalldataFromBN(bn: BigNumberish) {
  return { type: 'struct' as const, ...uint256.bnToUint256(String(bn)) }
}