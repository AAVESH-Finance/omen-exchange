import { Contract, ethers, Wallet } from 'ethers'

import { FEE } from '../common/constants'

const marketMakerFactoryAbi = [
  `function createFixedProductMarketMaker(address conditionalTokens, address collateralToken, bytes32[] conditionIds, uint64 fee) public returns (address)`,
]
const marketMakerFactoryCallAbi = [
  `function createFixedProductMarketMaker(address conditionalTokens, address collateralToken, bytes32[] conditionIds, uint64 fee) public constant returns (address)`,
]

class MarketMakerFactoryService {
  contract: Contract
  constantContract: Contract
  signerAddress: string

  constructor(address: string, provider: any, signerAddress: string) {
    const signer: Wallet = provider.getSigner()

    this.contract = new ethers.Contract(address, marketMakerFactoryAbi, provider).connect(signer)
    this.constantContract = new ethers.Contract(address, marketMakerFactoryCallAbi, provider)
    this.signerAddress = signerAddress
  }

  createMarketMaker = async (
    conditionalTokenAddress: string,
    daiAddress: string,
    conditionId: string,
  ) => {
    const args = [conditionalTokenAddress, daiAddress, [conditionId], FEE]

    const marketMakerAddress = await this.constantContract.createFixedProductMarketMaker(...args, {
      from: this.signerAddress,
    })

    await this.contract.createFixedProductMarketMaker(...args)

    return marketMakerAddress
  }
}

export { MarketMakerFactoryService }
