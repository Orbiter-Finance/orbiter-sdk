import dayjs from 'dayjs'
import { utils } from 'ethers'
import config from '../config'

/**
 * @param ms
 * @returns
 */
export async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null)
    }, ms)
  })
}

/**
 * Normal format date: (YYYY-MM-DD HH:mm:ss)
 * @param date Date
 * @returns
 */
export function dateFormatNormal(
  date: string | number | Date | dayjs.Dayjs | null | undefined
): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * String equals ignore case
 * @param value1
 * @param value2
 * @returns
 */
export function equalsIgnoreCase(value1: string, value2: string): boolean {
  if (typeof value1 !== 'string' || typeof value2 !== 'string') {
    return false
  }

  if (value1 == value2) {
    return true
  }
  if (value1.toUpperCase() == value2.toUpperCase()) {
    return true
  }

  return false
}

/**
 *
 * @param tokenAddress when tokenAddress=/^0x0+$/i
 * @returns
 */
export function isEthTokenAddress(tokenAddress: string) {
  return /^0x0+$/i.test(tokenAddress)
}

/**
 * @param networkId MetaMask's networkId
 * @returns
 */
export function getChainInfo(networkId: number | string) {
  const chainInfo = config.chains.find((chain) => chain.chainId.toString() === String(networkId))
  return chainInfo
}

/**
 * @param chainId Orbiter's chainId
 * @param ethereum window.ethereum
 */
export async function ensureMetamaskNetwork(chainId: number, ethereum: any) {
  if (!ethereum) {
    throw new Error('Please install MetaMask or other wallets that support web3 first!')
  }

  const chain = getChainInfo(config.orbiterChainIdToNetworkId[chainId])
  if (!chain) {
    throw new Error(`Orbiter not support this chain: ${chainId}`)
  }

  const switchParams = {
    chainId: utils.hexStripZeros(utils.hexlify(chain.chainId)),
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [switchParams],
    })
  } catch (error: any) {
    if (error.code === 4902) {
      // Add network
      const params = {
        ...switchParams,
        chainName: chain.name,
        nativeCurrency: {
          name: chain.nativeCurrency.name,
          symbol: chain.nativeCurrency.symbol, // 2-6 characters long
          decimals: chain.nativeCurrency.decimals,
        },
        rpcUrls: chain.rpc,
        blockExplorerUrls: [chain.explorers[0]?.['url'] || chain.infoURL],
      }

      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [params],
      })
    } else {
      throw error
    }
  }
}
