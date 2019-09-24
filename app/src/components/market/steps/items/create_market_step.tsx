import React, { Component } from 'react'
import moment from 'moment'

import { Button } from '../../../common/index'
import { Status } from '../../market_wizard_creator_container'

interface Props {
  back: () => void
  submit: () => void
  values: {
    question: string
    category: string
    resolution: Date | null
    spread: string
    funding: string
    outcomeValueOne: string
    outcomeValueTwo: string
    outcomeProbabilityOne: string
    outcomeProbabilityTwo: string
  }
  status: string
  questionId: string | null
  marketMakerAddress: string | null
}

class CreateMarketStep extends Component<Props> {
  back = () => {
    this.props.back()
  }

  submit = () => {
    this.props.submit()
  }

  render() {
    const { marketMakerAddress, values, status, questionId } = this.props
    const {
      question,
      category,
      resolution,
      spread,
      funding,
      outcomeValueOne,
      outcomeValueTwo,
      outcomeProbabilityOne,
      outcomeProbabilityTwo,
    } = values

    const resolutionDate = resolution && moment(resolution).format('MM-DD-YYYY')

    return (
      <>
        <h6>
          Please check all the information is correct. You can go back and edit anything you need.
          If everything is OK proceed to create the new market.
        </h6>
        <p>
          Question: <i>{question}</i>
        </p>
        <p>
          Oracle:{' '}
          <i>The market is resolved using realit.io oracle using the dxDAO as final arbitrator.</i>
        </p>
        <p>
          Category: <i>{category}</i>
        </p>
        <p>
          Spread/Fee: <i>{spread} %</i>
        </p>
        <p>
          Funding: <i>{funding} DAI</i>
        </p>
        <p>
          Resolution date: <i>{resolutionDate}</i>
        </p>
        <p>Outcomes:</p>
        <p>
          <i>
            {outcomeValueOne} - {outcomeProbabilityOne} %
          </i>
        </p>
        <p>
          <i>
            {outcomeValueTwo} - {outcomeProbabilityTwo} %
          </i>
        </p>
        <p>
          Status: <i>{status}</i>
        </p>
        {questionId ? (
          <p>
            Realitio:{' '}
            <a
              href={`https://realitio.github.io/#!/question/${questionId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              question url
            </a>
          </p>
        ) : (
          ''
        )}
        {marketMakerAddress && <p>Market Maker deployed at {marketMakerAddress}</p>}
        <div className="row">
          <div className="col left">
            <Button onClick={this.back}>Back</Button>
          </div>
          <div className="col right">
            <Button
              disabled={status !== Status.Ready && status !== Status.Error}
              onClick={this.submit}
            >
              Create Market
            </Button>
          </div>
        </div>
      </>
    )
  }
}

export { CreateMarketStep }
