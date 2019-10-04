import { ethers } from 'ethers'
import { BigNumber } from 'ethers/utils'

import { getContractAddress } from '../util/addresses'
import { Stage } from '../util/types'

const marketMakerAbi = [
  'function pmSystem() external view returns (address)',
  'function collateralToken() external view returns (address)',
  'function stage() external view returns (uint8)',
  'function funding() external view returns (uint256)',
  'function atomicOutcomeSlotCount() external view returns (uint256)',
  'function fee() external view returns (uint64)',
  'function conditionIds(uint256) external view returns (bytes32)',
  'function calcMarginalPrice(uint8 outcomeTokenIndex) view returns (uint price)',
  'function owner() public view returns (address)',
]

const conditionTokenAbi = [
  'function getCollectionId(bytes32 parentCollectionId, bytes32 conditionId, uint indexSet) external view returns (bytes32) ',
  'function getPositionId(address collateralToken, bytes32 collectionId) external pure returns (uint) ',
  'function balanceOf(address owner, uint256 positionId) external view returns (uint256)',
]

class FetchMarketService {
  marketMakerContract: any
  conditionalTokensContract: any
  daiTokenAddress: string

  constructor(marketMakerAddress: string, networkId: number, provider: any) {
    const conditionalTokensAddress = getContractAddress(networkId, 'conditionalTokens')

    this.marketMakerContract = new ethers.Contract(marketMakerAddress, marketMakerAbi, provider)
    this.conditionalTokensContract = new ethers.Contract(
      conditionalTokensAddress,
      conditionTokenAbi,
      provider,
    )
    this.daiTokenAddress = getContractAddress(networkId, 'dai')
  }

  async getFunding(): Promise<any> {
    return await this.marketMakerContract.funding()
  }

  async getFee(): Promise<any> {
    return await this.marketMakerContract.fee()
  }

  async getConditionId() {
    return await this.marketMakerContract.conditionIds(0)
  }

  async getOutcomeSlots(): Promise<any> {
    return await this.marketMakerContract.atomicOutcomeSlotCount()
  }

  async getStage(): Promise<Stage> {
    return await this.marketMakerContract.stage()
  }

  async getCollateralToken(): Promise<any> {
    return await this.marketMakerContract.collateralToken()
  }

  async getOwner(): Promise<string> {
    return await this.marketMakerContract.owner()
  }

  async getConditionalToken(): Promise<any> {
    return await this.marketMakerContract.pmSystem()
  }

  async getCollectionIdForYes(conditionId: string): Promise<any> {
    return await this.conditionalTokensContract.getCollectionId(
      ethers.constants.HashZero,
      conditionId,
      1,
    )
  }

  async getCollectionIdForNo(conditionId: string): Promise<any> {
    return await this.conditionalTokensContract.getCollectionId(
      ethers.constants.HashZero,
      conditionId,
      2,
    )
  }

  async getActualPrice(): Promise<any> {
    let [actualPriceForYes, actualPriceForNo] = await Promise.all([
      this.marketMakerContract.calcMarginalPrice(0),
      this.marketMakerContract.calcMarginalPrice(1),
    ])

    const two = new BigNumber(2)
    const twoPower64 = two.pow(64)

    actualPriceForYes =
      actualPriceForYes
        .mul(new BigNumber(10000))
        .div(twoPower64)
        .toNumber() / 10000
    actualPriceForNo =
      actualPriceForNo
        .mul(new BigNumber(10000))
        .div(twoPower64)
        .toNumber() / 10000

    return {
      actualPriceForYes,
      actualPriceForNo,
    }
  }

  async getPositionId(collectionId: string): Promise<any> {
    return await this.conditionalTokensContract.getPositionId(this.daiTokenAddress, collectionId)
  }

  async getBalanceOf(ownerAddress: string, positionId: string): Promise<any> {
    return await this.conditionalTokensContract.balanceOf(ownerAddress, positionId)
  }

  async getBalanceInformation(ownerAddress: string): Promise<any> {
    const conditionId = await this.getConditionId()
    const [collectionIdForYes, collectionIdForNo] = await Promise.all([
      this.getCollectionIdForYes(conditionId),
      this.getCollectionIdForNo(conditionId),
    ])

    const [positionIdForYes, positionIdForNo] = await Promise.all([
      this.getPositionId(collectionIdForYes),
      this.getPositionId(collectionIdForNo),
    ])

    const [balanceOfForYes, balanceOfForNo] = await Promise.all([
      this.getBalanceOf(ownerAddress, positionIdForYes),
      this.getBalanceOf(ownerAddress, positionIdForNo),
    ])

    return {
      balanceOfForYes,
      balanceOfForNo,
    }
  }

  async getMarketInformation(): Promise<any> {
    const [
      funding,
      fee,
      conditionId,
      outcomeSlots,
      stage,
      collateralToken,
      conditionalToken,
    ] = await Promise.all([
      this.getFunding(),
      this.getFee(),
      this.getConditionId(),
      this.getOutcomeSlots(),
      this.getStage(),
      this.getCollateralToken(),
      this.getConditionalToken(),
    ])

    return {
      funding,
      fee,
      conditionId,
      outcomeSlots,
      stage,
      collateralToken,
      conditionalToken,
    }
  }
}

export { FetchMarketService }
