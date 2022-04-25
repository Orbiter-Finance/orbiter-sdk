import { TransactionResponse } from '@ethersproject/abstract-provider'
import { BigNumber, ethers, providers, Signer, utils } from 'ethers'
import config from '../config'

export type CrossAddressExt = {
  type: string
  value: string
}

export const CrossAddressExtTypes = {
  '0x01': 'Cross Ethereum Address',
  '0x02': 'Cross Stark Address',
}

export class CrossAddress {
  private contractAddress: string
  private provider: providers.Web3Provider
  private signer: Signer
  private networkId: string | number

  private providerNetworkId: number

  /**
   * @param signer
   * @param orbiterChainId
   */
  constructor(signer: Signer, orbiterChainId = 5) {
    this.contractAddress = config.contracts.crossAddress[orbiterChainId]
    if (!this.contractAddress) {
      throw new Error('Orbiter cross address constructor failed: miss param [contractAddress]')
    }

    this.signer = signer
    this.provider = <providers.Web3Provider>signer.provider
    this.networkId = config.orbiterChainIdToNetworkId[orbiterChainId]
  }

  async checkNetworkId() {
    if (!this.provider.provider.isMetaMask) {
      return true
    }

    if (!this.providerNetworkId) {
      this.providerNetworkId = (await this.provider.getNetwork()).chainId
    }
    if (this.providerNetworkId != this.networkId) {
      throw new Error(
        `Sorry, currentNetworkId: ${this.providerNetworkId} no equal networkId: ${this.networkId}`
      )
    }

    return true
  }

  /**
   *
   * @param tokenAddress 0x...
   * @param amount
   */
  async approveERC20(tokenAddress: string, amount = ethers.constants.MaxUint256) {
    await this.checkNetworkId()

    const contract = new ethers.Contract(tokenAddress, config.abis.erc20, this.signer)
    await contract.approve(this.contractAddress, amount)
  }

  /**
   * @param to
   * @param amount
   * @param ext
   * @return
   */
  async transfer(
    to: string,
    amount: ethers.BigNumberish,
    ext: CrossAddressExt | undefined = undefined
  ) {
    await this.checkNetworkId()

    if (ext && !CrossAddressExtTypes[ext.type]) {
      throw new Error(`Invalid crossAddressType : ${ext.type}`)
    }

    // Sure amount is bignumber
    if (!(amount instanceof BigNumber)) {
      amount = BigNumber.from(amount)
    }

    const contract = new ethers.Contract(
      this.contractAddress,
      config.abis.crossAddress,
      this.signer
    )

    const extHex = CrossAddress.encodeExt(ext)
    const options = { value: amount.toHexString() }

    return <TransactionResponse>await contract.transfer(to, extHex, options)
  }

  /**
   *
   * @param tokenAddress 0x...
   * @param to
   * @param amount
   * @param ext
   * @return
   */
  async transferERC20(
    tokenAddress: string,
    to: string,
    amount: ethers.BigNumberish,
    ext: CrossAddressExt | undefined = undefined
  ) {
    await this.checkNetworkId()

    if (ext && !CrossAddressExtTypes[ext.type]) {
      throw new Error(`Invalid crossAddressType : ${ext.type}`)
    }

    // Sure amount is bignumber
    if (!(amount instanceof BigNumber)) {
      amount = BigNumber.from(amount)
    }

    // Check and approve erc20 amount
    const contractErc20 = new ethers.Contract(tokenAddress, config.abis.erc20, this.provider)
    const ownerAddress = await this.signer.getAddress()
    const allowance = await contractErc20.allowance(ownerAddress, this.contractAddress)
    if (amount.gt(allowance)) {
      await this.approveERC20(tokenAddress)
    }

    const contract = new ethers.Contract(
      this.contractAddress,
      config.abis.crossAddress,
      this.signer
    )
    const extHex = CrossAddress.encodeExt(ext)
    return <TransactionResponse>(
      await contract.transferERC20(tokenAddress, to, amount.toHexString(), extHex)
    )
  }

  /**
   *
   * @param ext
   * @returns hex
   */
  static encodeExt(ext: CrossAddressExt | undefined) {
    if (!ext || !utils.isHexString(ext.type)) {
      return '0x'
    }
    if (!ext.value) {
      return ext.type
    }
    return utils.hexConcat([ext.type, ext.value])
  }

  /**
   *
   * @param hex
   * @returns
   */
  static decodeExt(hex: string): CrossAddressExt | undefined {
    if (!utils.isHexString(hex)) {
      return undefined
    }

    const type = utils.hexDataSlice(hex, 0, 1)
    const value = utils.hexDataSlice(hex, 1)
    return { type, value }
  }

  /**
   * @param input 0x...
   */
  static parseTransferInput(input: string): {
    to: string
    ext: CrossAddressExt | undefined
  } {
    const [to, ext] = utils.defaultAbiCoder.decode(
      ['address', 'bytes'],
      utils.hexDataSlice(input, 4)
    )
    return { to, ext: CrossAddress.decodeExt(ext) }
  }

  /**
   * @param input 0x...
   */
  static parseTransferERC20Input(input: string): {
    token: string
    to: string
    amount: ethers.BigNumber
    ext: CrossAddressExt | undefined
  } {
    const [token, to, amount, ext] = utils.defaultAbiCoder.decode(
      ['address', 'address', 'uint256', 'bytes'],
      utils.hexDataSlice(input, 4)
    )
    return { token, to, amount, ext: CrossAddress.decodeExt(ext) }
  }
}
