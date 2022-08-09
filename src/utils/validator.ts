export enum ChainValidatorTypes {
  Mainnet = 1,
  Testnet = 2,
}

export class ChainValidator {
  static ethereum(chainId: number) {
    if (chainId == 1) {
      return ChainValidatorTypes.Mainnet
    }
    if (chainId == 5) {
      return ChainValidatorTypes.Testnet
    }
    return undefined
  }

  static arbitrum(chainId: number) {
    if (chainId == 2) {
      return ChainValidatorTypes.Mainnet
    }
    if (chainId == 22) {
      return ChainValidatorTypes.Testnet
    }
    return undefined
  }

  static zksync(chainId: number) {
    if (chainId == 3) {
      return ChainValidatorTypes.Mainnet
    }
    if (chainId == 33) {
      return ChainValidatorTypes.Testnet
    }
    return undefined
  }

  static zksync2(chainId: number) {
    if (chainId == 514) {
      return ChainValidatorTypes.Testnet
    }
    return undefined
  }

  static starknet(chainId: number) {
    if (chainId == 4) {
      return ChainValidatorTypes.Mainnet
    }
    if (chainId == 44) {
      return ChainValidatorTypes.Testnet
    }
    return undefined
  }

  static polygon(chainId: number) {
    if (chainId == 6) {
      return ChainValidatorTypes.Mainnet
    }
    if (chainId == 66) {
      return ChainValidatorTypes.Testnet
    }
    return undefined
  }

  static optimism(chainId: number) {
    if (chainId == 7) {
      return ChainValidatorTypes.Mainnet
    }
    if (chainId == 77) {
      return ChainValidatorTypes.Testnet
    }
    return undefined
  }

  static immutablex(chainId: number) {
    if (chainId == 8) {
      return ChainValidatorTypes.Mainnet
    }
    if (chainId == 88) {
      return ChainValidatorTypes.Testnet
    }
    return undefined
  }

  static loopring(chainId: number) {
    if (chainId == 9) {
      return ChainValidatorTypes.Mainnet
    }
    if (chainId == 99) {
      return ChainValidatorTypes.Testnet
    }
    return undefined
  }

  static metis(chainId: number) {
    if (chainId == 10) {
      return ChainValidatorTypes.Mainnet
    }
    if (chainId == 510) {
      return ChainValidatorTypes.Testnet
    }
    return undefined
  }

  static dydx(chainId: number) {
    if (chainId == 11) {
      return ChainValidatorTypes.Mainnet
    }
    if (chainId == 511) {
      return ChainValidatorTypes.Testnet
    }
    return undefined
  }

  static zkspace(chainId: number) {
    if (chainId == 12) {
      return ChainValidatorTypes.Mainnet
    }
    if (chainId == 512) {
      return ChainValidatorTypes.Testnet
    }
    return undefined
  }
}
