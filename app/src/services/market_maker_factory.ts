import { Contract, ethers, Wallet } from 'ethers'
import { LogDescription } from 'ethers/utils/interface'

import { Market, Log } from '../util/types'
import { FEE } from '../common/constants'

const marketMakerFactoryAbi = [
  `function createFixedProductMarketMaker(address conditionalTokens, address collateralToken, bytes32[] conditionIds, uint64 fee) public returns (address)`,
  `event FixedProductMarketMakerCreation(address indexed creator, address fixedProductMarketMaker, address conditionalTokens, address collateralToken, bytes32[] conditionIds, uint64 fee)`,
]
const marketMakerFactoryCallAbi = [
  `function createFixedProductMarketMaker(address conditionalTokens, address collateralToken, bytes32[] conditionIds, uint64 fee) public constant returns (address)`,
]

class MarketMakerFactoryService {
  contract: Contract
  constantContract: Contract
  signerAddress: string
  provider: any

  constructor(address: string, provider: any, signerAddress: string) {
    const signer: Wallet = provider.getSigner()

    this.contract = new ethers.Contract(address, marketMakerFactoryAbi, provider).connect(signer)
    this.constantContract = new ethers.Contract(address, marketMakerFactoryCallAbi, provider)
    this.signerAddress = signerAddress
    this.provider = provider
  }

  createMarketMaker = async (
    conditionalTokenAddress: string,
    collateralAddress: string,
    conditionId: string,
  ) => {
    const args = [conditionalTokenAddress, collateralAddress, [conditionId], FEE]

    const marketMakerAddress = await this.constantContract.createFixedProductMarketMaker(...args, {
      from: this.signerAddress,
    })

    const transactionObject = await this.contract.createFixedProductMarketMaker(...args)
    await this.provider.waitForTransaction(transactionObject.hash)

    return marketMakerAddress
  }

  getMarkets = async (provider: any): Promise<{ markets: Market[] }> => {
    const filter: any = this.contract.filters.FixedProductMarketMakerCreation()

    const logs = await provider.getLogs({
      fromBlock: 1,
      toBlock: 'latest',
      ...filter,
    })

    if (logs.length === 0) {
      throw new Error(`No FixedProductMarketMakerCreation events found`)
    }

    const interfaceMarketMakerFactory = new ethers.utils.Interface(marketMakerFactoryAbi)
    const markets = logs.map(
      (log: Log): Market => {
        const parsedLog: LogDescription = interfaceMarketMakerFactory.parseLog(log)
        const { fixedProductMarketMaker, creator, collateralToken, conditionIds } = parsedLog.values
        return {
          marketMakerAddress: fixedProductMarketMaker,
          ownerAddress: creator,
          conditionId: conditionIds[0],
          collateralTokenAddress: collateralToken,
        }
      },
    )

    return {
      markets,
    }
  }
}

export { MarketMakerFactoryService }
