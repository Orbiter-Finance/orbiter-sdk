import { SigningMethod } from '@dydxprotocol/v3-client'
import { Web3Provider } from '@ethersproject/providers'
import { ethers, Signer, utils, Wallet } from 'ethers'
import Web3 from 'web3'
import config from '../config'
import { core, DydxHelper, IMXHelper } from '../orbiter-sdk'
import {
  TransactionEvm,
  TransactionImmutablex,
  TransactionLoopring,
  TransactionZksync,
} from '../transaction'
import { TransactionTransferOptions } from '../transaction/transaction'
import { ensureMetamaskNetwork, equalsIgnoreCase } from '../utils'
import { ChainValidator } from '../utils/validator'
import { makerList as makerList_mainnet } from './maker_list.mainnet'
import { makerList as makerList_testnet } from './maker_list.testnet'

export type BridgeToken = {
  chainId: number // The tokens on different chains are different, but the names are the same
  name: string
  address: string
  precision: number
  makerAddress: string
  icon?: string
}
export type BridgeChain = {
  id: number // Orbiter's chainId
  name: string
  networkId: number | string
  icon?: string
}
export type BridgeNetwork = 'Mainnet' | 'Testnet'

export class Bridge {
  private network: BridgeNetwork = 'Testnet'
  private makerList: typeof makerList_mainnet | typeof makerList_testnet

  constructor(network: BridgeNetwork) {
    this.network = network
  }

  /**
   * @param makerListItem
   * @returns
   */
  private expandMakerInfo(
    makerListItem: typeof makerList_mainnet[0] | typeof makerList_testnet[0]
  ) {
    return [
      {
        makerAddress: makerListItem.makerAddress,
        fromChainId: makerListItem.c1ID,
        toChainId: makerListItem.c2ID,
        fromChainName: makerListItem.c1Name,
        toChainName: makerListItem.c2Name,
        fromTokenAddress: makerListItem.t1Address,
        toTokenAddress: makerListItem.t2Address,
        tokenName: makerListItem.tName,
        minPrice: makerListItem.c1MinPrice,
        maxPrice: makerListItem.c1MaxPrice,
        precision: makerListItem.precision,
        avalibleDeposit: makerListItem.c1AvalibleDeposit,
        tradingFee: makerListItem.c1TradingFee,
        gasFee: makerListItem.c1GasFee,
        avalibleTimes: makerListItem.c1AvalibleTimes,
      },
      {
        makerAddress: makerListItem.makerAddress,
        fromChainId: makerListItem.c2ID,
        toChainId: makerListItem.c1ID,
        fromChainName: makerListItem.c2Name,
        toChainName: makerListItem.c1Name,
        fromTokenAddress: makerListItem.t2Address,
        toTokenAddress: makerListItem.t1Address,
        tokenName: makerListItem.tName,
        minPrice: makerListItem.c2MinPrice,
        maxPrice: makerListItem.c2MaxPrice,
        precision: makerListItem.precision,
        avalibleDeposit: makerListItem.c2AvalibleDeposit,
        tradingFee: makerListItem.c2TradingFee,
        gasFee: makerListItem.c2GasFee,
        avalibleTimes: makerListItem.c2AvalibleTimes,
      },
    ]
  }

  /**
   * @param accountAddress
   * @param signer
   * @param fromChain
   * @param toChain
   */
  private async ensureStarkAccount(
    accountAddress: string,
    signer: Signer,
    fromChain: BridgeChain,
    toChain: BridgeChain
  ) {
    const web3Provider = <Web3Provider>signer.provider

    // immutablex
    let immutablexChainId = 0
    if (
      ChainValidator.immutablex((immutablexChainId = fromChain.id)) ||
      ChainValidator.immutablex((immutablexChainId = toChain.id))
    ) {
      const imxHelper = new IMXHelper(immutablexChainId, signer)
      await imxHelper.ensureUser(accountAddress)
    }

    // dYdX
    let dydxChainId = 0
    if (
      ChainValidator.dydx((dydxChainId = fromChain.id)) ||
      ChainValidator.dydx((dydxChainId = toChain.id))
    ) {
      const dydxHelper = new DydxHelper(
        dydxChainId,
        new Web3(<any>web3Provider.provider),
        web3Provider.provider.isMetaMask ? SigningMethod.MetaMask : SigningMethod.TypedData
      )
      await dydxHelper.getAccount(accountAddress)
    }
  }

  public async getMakerList() {
    if (this.makerList) {
      return this.makerList
    }

    // In the future, it will be obtained from the Internet
    if (this.network == 'Mainnet') {
      return (this.makerList = makerList_mainnet)
    } else {
      return (this.makerList = makerList_testnet)
    }
  }

  public async supports(fromChain?: BridgeChain, toChain?: BridgeChain) {
    const tokens: BridgeToken[] = []
    const fromChains: BridgeChain[] = []
    const toChains: BridgeChain[] = []

    const makerList = await this.getMakerList()
    for (const item of makerList) {
      this.expandMakerInfo(item).forEach((makerInfo) => {
        // Push tokens
        const findIndexToken = tokens.findIndex(
          (_token) =>
            equalsIgnoreCase(_token.address, makerInfo.fromTokenAddress) &&
            _token.chainId == makerInfo.fromChainId
        )
        if (findIndexToken === -1 && (!toChain || toChain.id == makerInfo.toChainId)) {
          tokens.push({
            chainId: makerInfo.fromChainId,
            address: makerInfo.fromTokenAddress,
            name: makerInfo.tokenName,
            precision: makerInfo.precision,
            makerAddress: makerInfo.makerAddress,
          })
        }

        // Push fromChains.
        // Warnning: starknet cannot transfer out now!, dYdX cannot transfer out now!
        if (
          (!toChain || toChain.id == makerInfo.toChainId) &&
          ChainValidator.starknet(makerInfo.fromChainId) === undefined &&
          ChainValidator.dydx(makerInfo.fromChainId) === undefined
        ) {
          const findIndexFromChain = fromChains.findIndex(
            (_chain) => _chain.id == makerInfo.fromChainId
          )
          if (findIndexFromChain === -1) {
            fromChains.push({
              id: makerInfo.fromChainId,
              name: makerInfo.fromChainName,
              networkId: config.orbiterChainIdToNetworkId[makerInfo.fromChainId],
            })
          }
        }

        // Push toChains
        // Warnning: starknet cannot transfer in now!
        if (
          (!fromChain || fromChain.id == makerInfo.fromChainId) &&
          ChainValidator.starknet(makerInfo.toChainId) === undefined
        ) {
          const findIndexToChain = toChains.findIndex((_chain) => _chain.id == makerInfo.toChainId)
          if (findIndexToChain === -1) {
            toChains.push({
              id: makerInfo.toChainId,
              name: makerInfo.toChainName,
              networkId: config.orbiterChainIdToNetworkId[makerInfo.toChainId],
            })
          }
        }
      })
    }

    return { tokens, fromChains, toChains }
  }

  /**
   * @param token
   * @param fromChain
   * @param toChain
   * @returns
   */
  public async getTargetMakerInfo(
    token: BridgeToken,
    fromChain: BridgeChain,
    toChain: BridgeChain
  ) {
    const makerList = await this.getMakerList()

    // Use map to maintain type deduction
    const targets = makerList
      .map((item) => {
        const expand = this.expandMakerInfo(item)

        // Normal
        if (
          expand[0].fromChainId == fromChain.id &&
          expand[0].toChainId == toChain.id &&
          equalsIgnoreCase(expand[0].fromTokenAddress, token.address)
        ) {
          return expand[0]
        }

        // Reverse
        if (
          expand[1].fromChainId == fromChain.id &&
          expand[1].toChainId == toChain.id &&
          equalsIgnoreCase(expand[1].fromTokenAddress, token.address)
        ) {
          return expand[1]
        }

        return undefined
      })
      .filter((item) => item !== undefined)

    if (targets.length < 1) {
      throw new Error('Orbiter cannot find target maker info!')
    }

    // Only return first. Normally there is only one record here
    return targets[0]
  }

  /**
   * @param token
   * @param fromChain
   * @param toChain
   * @param amountHm Human readable amount
   */
  public async getAmounts(
    token: BridgeToken,
    fromChain: BridgeChain,
    toChain: BridgeChain,
    amountHm: string | number
  ) {
    const targetMakerInfo = await this.getTargetMakerInfo(token, fromChain, toChain)
    const { tradingFee, precision, minPrice, maxPrice } = targetMakerInfo

    // Check minPrice, maxPrice
    if (amountHm < String(minPrice)) {
      throw new Error(
        `Orbiter get amounts failed: amount less than minPrice(${minPrice}), token: ${token.name}, fromChain: ${fromChain.name}, toChain: ${toChain.name}`
      )
    }
    if (amountHm > String(maxPrice)) {
      throw new Error(
        `Orbiter get amounts failed: amount greater than maxPrice(${maxPrice}), token: ${token.name}, fromChain: ${fromChain.name}, toChain: ${toChain.name}`
      )
    }

    const amount = utils.parseUnits(Number(amountHm).toFixed(precision), precision)
    const userAmount = amount.add(utils.parseUnits(tradingFee + '', precision))

    const receiveAmountHm = core
      .getToAmountFromUserAmount(utils.formatUnits(userAmount, precision), targetMakerInfo, false)
      .toString()

    const payText = 9000 + Number(toChain.id) + ''
    const result = core.getTAmountFromRAmount(fromChain.id, Number(userAmount), payText)
    if (!result.state) {
      throw new Error(
        'Obirter get total amount failed! Please check if the amount matches the rules!'
      )
    }
    const payAmount = ethers.BigNumber.from(result.tAmount + '')
    const payAmountHm = utils.formatUnits(payAmount, precision)

    return { payText, payAmount, payAmountHm, receiveAmountHm }
  }

  /**
   * @param signer
   * @param token
   * @param fromChain
   * @param toChain
   * @param amountHm
   */
  public async transfer(
    signer: Signer,
    token: BridgeToken,
    fromChain: BridgeChain,
    toChain: BridgeChain,
    amountHm: string | number
  ) {
    if (!signer) {
      throw new Error('Orbiter bridge transfer miss params [signer]')
    }

    // Get web3Provider
    let web3Provider = <Web3Provider>signer.provider
    if (!web3Provider) {
      throw new Error('Orbiter bridge transfer failed: Invalid signer.provider')
    }

    const amounts = await this.getAmounts(token, fromChain, toChain, amountHm)
    const transferOptions: TransactionTransferOptions = {
      amount: amounts.payAmount,
      tokenAddress: token.address,
      toAddress: token.makerAddress,
    }

    const accountAddress = await signer.getAddress()
    if (!accountAddress) {
      throw new Error('Orbiter bridge failed: Empty fromAddress')
    }

    // Ensure StarkAccount(imx, dydx...)
    await this.ensureStarkAccount(accountAddress, signer, fromChain, toChain)

    // When provider is metamask, switch network
    if (web3Provider.provider.isMetaMask === true) {
      await ensureMetamaskNetwork(fromChain.id, web3Provider.provider)

      // Reset web3Provider, signer
      web3Provider = new Web3Provider(web3Provider.provider)
      signer = web3Provider.getSigner()
    }

    // To dydx is cross address transfer
    // It will cache dydxAccount in ensureStarkAccount
    if (ChainValidator.dydx(toChain.id)) {
      const dydxHelper = new DydxHelper(toChain.id)
      const dydxAccount = await dydxHelper.getAccount(accountAddress)
      transferOptions.crossAddressExt = {
        type: '0x02',
        value: dydxHelper.conactStarkKeyPositionId(
          '0x' + dydxAccount.starkKey,
          dydxAccount.positionId
        ),
      }
    }

    // Web3
    if (ChainValidator.loopring(fromChain.id)) {
      const web3 = new Web3(<any>web3Provider.provider)
      if (signer instanceof Wallet && signer.privateKey) {
        web3.eth.accounts.wallet.add(signer.privateKey)
      }

      const tLoopring = new TransactionLoopring(fromChain.id, web3)
      return await tLoopring.transfer({
        ...transferOptions,
        fromAddress: accountAddress,
        memo: amounts.payText,
      })
    }
    if (ChainValidator.dydx(fromChain.id)) {
      // dYdx cannot transfer out now
      return undefined
    }

    // Signer
    if (ChainValidator.zksync(fromChain.id)) {
      const tZksync = new TransactionZksync(fromChain.id, signer)
      return await tZksync.transfer(transferOptions)
    }
    if (ChainValidator.immutablex(fromChain.id)) {
      const tImx = new TransactionImmutablex(fromChain.id, signer)
      return await tImx.transfer({
        ...transferOptions,
        decimals: token.precision,
        symbol: token.name,
      })
    }

    // Evm transaction
    const tEvm = new TransactionEvm(fromChain.id, signer)
    return await tEvm.transfer(transferOptions)
  }
}
