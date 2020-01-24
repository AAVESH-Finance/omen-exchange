import { useMemo } from 'react'
import { ConnectedWeb3Context } from './connectedWeb3'
import { getContractAddress } from '../util/networks'
import {
  ConditionalTokenService,
  MarketMakerService,
  MarketMakerFactoryService,
  OracleService,
  RealitioService,
} from '../services'
import { useAsyncDerivedValue } from './useAsyncDerivedValue'
import { CPKService } from '../services/cpk'

export const useContracts = (context: ConnectedWeb3Context) => {
  const { library: provider, networkId, account } = context

  const conditionalTokensAddress = getContractAddress(networkId, 'conditionalTokens')
  const conditionalTokens = useMemo(
    () => new ConditionalTokenService(conditionalTokensAddress, provider, account),
    [conditionalTokensAddress, provider, account],
  )

  const marketMakerFactoryAddress = getContractAddress(networkId, 'marketMakerFactory')
  const marketMakerFactory = useMemo(
    () => new MarketMakerFactoryService(marketMakerFactoryAddress, provider, account),
    [marketMakerFactoryAddress, provider, account],
  )

  const realitioAddress = getContractAddress(networkId, 'realitio')
  const realitio = useMemo(() => new RealitioService(realitioAddress, provider, account), [
    realitioAddress,
    provider,
    account,
  ])

  const oracleAddress = getContractAddress(networkId, 'oracle')
  const oracle = useMemo(() => new OracleService(oracleAddress, provider, account), [
    oracleAddress,
    provider,
    account,
  ])

  const buildMarketMaker = useMemo(
    () => (address: string) =>
      new MarketMakerService(address, conditionalTokens, realitio, provider, account),
    [conditionalTokens, realitio, provider, account],
  )

  const createCPK = useMemo(
    () => async (): Promise<any> => {
      const cpk = await CPKService.create(provider)
      return cpk
    },
    [provider],
  )

  const cpk = useAsyncDerivedValue(null, null, createCPK)

  return useMemo(
    () => ({
      conditionalTokens,
      marketMakerFactory,
      realitio,
      oracle,
      buildMarketMaker,
      cpk,
    }),
    [conditionalTokens, marketMakerFactory, realitio, oracle, buildMarketMaker, cpk],
  )
}

export type Contracts = ReturnType<typeof useContracts>
