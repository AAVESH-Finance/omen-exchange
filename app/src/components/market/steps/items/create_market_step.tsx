import { BigNumber } from 'ethers/utils'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import { useConnectedWeb3Context } from '../../../../hooks/connectedWeb3'
import { BalanceState, fetchAccountBalance } from '../../../../store/reducer'
import { ButtonType } from '../../../../theme/component_styles/button_styling_types'
import { getLogger } from '../../../../util/logger'
import { MarketCreationStatus } from '../../../../util/market_creation_status_data'
import { formatBigNumber, formatDate } from '../../../../util/tools'
import { Arbitrator, Token } from '../../../../util/types'
import { ButtonContainer } from '../../../common/button_container'
import { ButtonLink } from '../../../common/button_link'
import { CreateCard } from '../../../common/create_card'
import { DisplayArbitrator } from '../../../common/display_arbitrator'
import { FormError } from '../../../common/form_error'
import { Button } from '../../../common/index'
import { Loading } from '../../../common/loading'
import { Outcome } from '../../../common/outcomes'
import { Paragraph } from '../../../common/paragraph'
import { SubsectionTitle } from '../../../common/subsection_title'
import { TD, TH, THead, TR, Table } from '../../../common/table'
import { TitleValue } from '../../../common/title_value'
import { Well } from '../../../common/well'

const logger = getLogger('MarketCreationItems::CreateMarketStep')

const OutcomeInfo = styled(Well)`
  margin-bottom: 30px;
`

const ButtonLinkStyled = styled(ButtonLink)`
  margin-right: auto;
`

const ErrorStyled = styled(FormError)`
  margin: 0 0 10px 0;
`

const Grid = styled.div`
  display: grid;
  grid-column-gap: 20px;
  grid-row-gap: 14px;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 14px;
`

const TitleValueStyled = styled(TitleValue)`
  margin-bottom: 14px;
`

const TitleValueFinalStyled = styled(TitleValue)`
  margin-bottom: 25px;
`

const SubsectionTitleNoMargin = styled(SubsectionTitle)`
  margin-bottom: 0;
`

interface Props {
  back: () => void
  submit: () => void
  values: {
    collateral: Token
    question: string
    category: string
    resolution: Date | null
    arbitrator: Arbitrator
    spread: number
    funding: BigNumber
    outcomes: Outcome[]
  }
  marketCreationStatus: MarketCreationStatus
}

const CreateMarketStep = (props: Props) => {
  const context = useConnectedWeb3Context()
  const balance = useSelector((state: BalanceState): Maybe<BigNumber> => state.balance && new BigNumber(state.balance))
  const dispatch = useDispatch()

  const { account, library: provider } = context

  const { marketCreationStatus, values } = props
  const { arbitrator, category, collateral, funding, outcomes, question, resolution, spread } = values

  React.useEffect(() => {
    dispatch(fetchAccountBalance(account, provider, collateral))
  }, [account, provider, collateral, dispatch])

  const back = () => {
    props.back()
  }

  const submit = async () => {
    try {
      props.submit()
    } catch (err) {
      logger.error(err)
    }
  }

  const resolutionDate = resolution && formatDate(resolution)

  const hasEnoughBalance = balance && balance.gte(funding)
  let fundingErrorMessage = ''
  if (balance && !hasEnoughBalance) {
    fundingErrorMessage = `You entered ${formatBigNumber(
      funding,
      collateral.decimals,
    )} DAI of funding but your account only has ${formatBigNumber(balance, collateral.decimals)} DAI`
  }

  return (
    <CreateCard>
      <OutcomeInfo>
        <Paragraph>
          Please <strong>check all the information is correct</strong>. You can go back and edit anything you need.
        </Paragraph>
        <Paragraph>
          <strong>If everything is OK</strong> proceed to create the new market.
        </Paragraph>
      </OutcomeInfo>

      <SubsectionTitle>Details</SubsectionTitle>
      <TitleValueStyled title={'Question'} value={question} />
      <Grid>
        <TitleValue title={'Category'} value={category} />
        <TitleValue title={'Resolution date'} value={resolutionDate} />
        <TitleValue title={'Spread / Fee'} value={`${spread}%`} />
        {collateral && (
          <TitleValue
            title={'Funding'}
            value={[formatBigNumber(funding, collateral.decimals), <strong key="1"> {collateral.symbol}</strong>]}
          />
        )}
      </Grid>
      <TitleValueFinalStyled title={'Arbitrator'} value={<DisplayArbitrator arbitrator={arbitrator} />} />
      <SubsectionTitleNoMargin>Outcomes</SubsectionTitleNoMargin>
      <Table
        head={
          <THead>
            <TR>
              <TH>Outcome</TH>
              <TH textAlign="right">Probabilities</TH>
            </TR>
          </THead>
        }
        maxHeight="130px"
      >
        {outcomes.map((outcome, index) => {
          return (
            <TR key={index}>
              <TD>{outcome.name}</TD>
              <TD textAlign="right">{outcome.probability}%</TD>
            </TR>
          )
        })}
      </Table>
      {!MarketCreationStatus.is.ready(marketCreationStatus) && !MarketCreationStatus.is.error(marketCreationStatus) ? (
        <Loading full={true} message={`${marketCreationStatus._type}...`} />
      ) : null}

      {fundingErrorMessage && <ErrorStyled>{fundingErrorMessage}</ErrorStyled>}
      <ButtonContainer>
        <ButtonLinkStyled
          disabled={
            !MarketCreationStatus.is.ready(marketCreationStatus) && !MarketCreationStatus.is.error(marketCreationStatus)
          }
          onClick={back}
        >
          ‹ Back
        </ButtonLinkStyled>
        {account ? (
          <Button
            buttonType={ButtonType.primary}
            disabled={
              !MarketCreationStatus.is.ready(marketCreationStatus) ||
              MarketCreationStatus.is.error(marketCreationStatus) ||
              !hasEnoughBalance
            }
            onClick={submit}
          >
            Create
          </Button>
        ) : (
          <Button buttonType={ButtonType.primary} onClick={submit}>
            Connect Wallet
          </Button>
        )}
      </ButtonContainer>
    </CreateCard>
  )
}

export { CreateMarketStep }
