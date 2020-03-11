import React, { useEffect, useState } from 'react'

import { useMarketMakerData } from '../../hooks'
import { useConnectedWeb3Context } from '../../hooks/connectedWeb3'
import { Loading } from '../common'

import { MarketView } from './market_view'
import gql from 'graphql-tag'
import { useQuery } from '@apollo/react-hooks'
import { BigNumber } from 'ethers/utils'

interface Props {
  marketMakerAddress: string
}

const GET_COLLATERAL_VOLUME_NOW = gql`
  query Current($id: String) {
    fixedProductMarketMakers(where: { id: $id }) {
      collateralVolume
    }
  }
`

const buildQuery24hsEarlier = (hash: Maybe<string>) => {
  return gql`
  query AfterHash($id: String) {
    fixedProductMarketMakers(where: { id: $id }, block: { hash: "${hash}" }) {
      collateralVolume
    }
  }
`
}

const MarketViewContainer: React.FC<Props> = (props: Props) => {
  const context = useConnectedWeb3Context()

  const { marketMakerAddress } = props

  const [hash, setHash] = useState<Maybe<String>>(null)
  const { marketMakerData, status } = useMarketMakerData(marketMakerAddress, context)
  const { library: provider } = context

  const [lastDayVolume, setLastDayVolume] = useState<Maybe<BigNumber>>(null)

  const { data: volumeNow } = useQuery(GET_COLLATERAL_VOLUME_NOW, {
    skip: !!lastDayVolume,
    variables: { id: marketMakerAddress.toLowerCase() },
  })

  const { data: volumeBefore } = useQuery(buildQuery24hsEarlier(hash && hash.toLowerCase()), {
    skip: !!lastDayVolume,
    variables: { id: marketMakerAddress.toLowerCase() },
  })

  if (volumeNow && volumeBefore) {
    const now = new BigNumber(volumeNow.fixedProductMarketMakers[0].collateralVolume)
    const before = new BigNumber(volumeBefore.fixedProductMarketMakers[0].collateralVolume)

    setLastDayVolume(now.sub(before))
  }

  console.log('lastDayVolume', lastDayVolume && lastDayVolume.toString())
  console.log('skipquery', !!lastDayVolume)

  const {
    arbitrator,
    balances,
    category,
    collateral,
    isConditionResolved,
    isQuestionFinalized,
    marketMakerFunding,
    question,
    questionId,
    resolution,
  } = marketMakerData

  useEffect(() => {
    const get24hsVolume = async () => {
      const BLOCKS_PER_SECOND = 15
      const OFFSET = (60 * 60 * 24) / BLOCKS_PER_SECOND
      const lastBlock = await provider.getBlockNumber()
      const { hash } = await provider.getBlock(lastBlock - OFFSET)
      setHash(hash)
    }

    get24hsVolume()
  }, [provider])

  if (!collateral) {
    return <Loading full={true} />
  }

  return (
    <MarketView
      account={context.account}
      arbitrator={arbitrator}
      balances={balances}
      category={category || ''}
      collateral={collateral}
      funding={marketMakerFunding}
      isConditionResolved={isConditionResolved}
      isQuestionFinalized={isQuestionFinalized}
      marketMakerAddress={marketMakerAddress}
      question={question || ''}
      questionId={questionId}
      resolution={resolution}
      status={status}
    />
  )
}

export { MarketViewContainer }
