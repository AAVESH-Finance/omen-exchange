import { useCallback, useMemo, useState } from 'react'
import { BigNumber } from 'ethers/utils'

import { usePolling } from './usePolling'
import { ConnectedWeb3Context } from './connectedWeb3'
import { MarketMakerService } from '../services'
import { getArbitratorFromAddress, getTokenFromAddress } from '../util/addresses'
import { useContracts } from './useContracts'
import { getLogger } from '../util/logger'
import { BalanceItem, OutcomeSlot, Status, WinnerOutcome, Token, Arbitrator } from '../util/types'

const logger = getLogger('Market::useMarketMakerData')

interface MarketMakerData {
  totalPoolShares: BigNumber
  userPoolShares: BigNumber
  balance: BalanceItem[]
  winnerOutcome: Maybe<WinnerOutcome>
  marketMakerFunding: BigNumber
  marketMakerUserFunding: BigNumber
  collateral: Maybe<Token>
  question: string
  questionId: string
  category: string
  resolution: Maybe<Date>
  arbitrator: Maybe<Arbitrator>
  fee: Maybe<BigNumber>
  isQuestionFinalized: boolean
}

export const useMarketMakerData = (
  marketMakerAddress: string,
  context: ConnectedWeb3Context,
): { marketMakerData: MarketMakerData; status: Status } => {
  const { conditionalTokens, realitio } = useContracts(context)

  const [status, setStatus] = useState(Status.Ready)

  const initialMarketMakerData = useMemo(
    () => ({
      totalPoolShares: new BigNumber(0),
      userPoolShares: new BigNumber(0),
      balance: [],
      winnerOutcome: null,
      marketMakerFunding: new BigNumber(0),
      marketMakerUserFunding: new BigNumber(0),
      collateral: null,
      questionId: '',
      question: '',
      category: '',
      resolution: null,
      arbitrator: null,
      isQuestionFinalized: false,
      fee: null,
    }),
    [],
  )

  const fetchFunc = useCallback(async () => {
    setStatus(status => (status === Status.Ready ? Status.Loading : Status.Refreshing))
    const provider = context.library
    const user = await provider.getSigner().getAddress()

    const marketMaker = new MarketMakerService(
      marketMakerAddress,
      conditionalTokens,
      realitio,
      provider,
    )

    const conditionId = await marketMaker.getConditionId()
    const isConditionResolved = await conditionalTokens.isConditionResolved(conditionId)

    const questionId = await conditionalTokens.getQuestionId(conditionId)
    const { question, resolution, arbitratorAddress, category } = await realitio.getQuestion(
      questionId,
    )

    const arbitrator = getArbitratorFromAddress(context.networkId, arbitratorAddress)

    const winnerOutcome = isConditionResolved
      ? await conditionalTokens.getWinnerOutcome(conditionId)
      : null

    const [
      userShares,
      marketMakerShares,
      marketMakerFunding,
      marketMakerUserFunding,
      collateralAddress,
      totalPoolShares,
      userPoolShares,
      fee,
      isQuestionFinalized,
    ] = await Promise.all([
      marketMaker.getBalanceInformation(user),
      marketMaker.getBalanceInformation(marketMakerAddress),
      marketMaker.getTotalSupply(),
      marketMaker.balanceOf(user),
      marketMaker.getCollateralToken(),
      marketMaker.poolSharesTotalSupply(),
      marketMaker.poolSharesBalanceOf(user),
      marketMaker.getFee(),
      realitio.isFinalized(questionId),
    ])

    const actualPrices = MarketMakerService.getActualPrice(marketMakerShares)

    const collateral = getTokenFromAddress(context.networkId, collateralAddress)

    const probabilityForYes = actualPrices.actualPriceForYes * 100
    const probabilityForNo = actualPrices.actualPriceForNo * 100

    const balance = [
      {
        outcomeName: OutcomeSlot.Yes,
        probability: Math.round((probabilityForYes / 100) * 100),
        currentPrice: actualPrices.actualPriceForYes,
        shares: userShares.balanceOfForYes,
        holdings: marketMakerShares.balanceOfForYes,
        winningOutcome: winnerOutcome === WinnerOutcome.Yes,
      },
      {
        outcomeName: OutcomeSlot.No,
        probability: Math.round((probabilityForNo / 100) * 100),
        currentPrice: actualPrices.actualPriceForNo,
        shares: userShares.balanceOfForNo,
        holdings: marketMakerShares.balanceOfForNo,
        winningOutcome: winnerOutcome === WinnerOutcome.No,
      },
    ]

    setStatus(Status.Done)

    return {
      totalPoolShares,
      userPoolShares,
      balance,
      arbitrator,
      winnerOutcome,
      question,
      questionId,
      resolution,
      category,
      collateral,
      marketMakerFunding,
      marketMakerUserFunding,
      isQuestionFinalized,
      fee,
    }
  }, [conditionalTokens, context.library, context.networkId, marketMakerAddress, realitio])

  const marketMakerData = usePolling<MarketMakerData>({
    fetchFunc,
    initialState: initialMarketMakerData,
    delay: 5000,
    onError: useCallback(error => {
      logger.error('There was an error fetching the market maker data:', error.message)
      setStatus(Status.Error)
    }, []),
  })

  return { marketMakerData, status }
}
