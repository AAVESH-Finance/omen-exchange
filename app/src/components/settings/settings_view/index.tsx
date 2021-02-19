import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import styled from 'styled-components'

import { useConnectedWeb3Context } from '../../../hooks'
import { getChainSpecificAlternativeUrls } from '../../../util/networks'
import { ButtonRound } from '../../button'
import { Dropdown, DropdownPosition } from '../../common/form/dropdown/index'
import { ListCard } from '../../market/common/list_card/index'
import imgInfura from '../assets/images/Infura.svg'

const TopContent = styled.div`
  padding: 24px;
`
const MainContent = styled.div`
  padding: 24px;
  border-top: ${props => props.theme.borders.borderLineDisabled};
`

const BottomContent = styled(MainContent as any)`
  display: flex;
  justify-content: space-between;
`

const Column = styled.div``

const Row = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const StatusSection = styled(Row as any)`
  justify-content: flex-start;
  margin-top: 6px;
`

const Text = styled.p`
  color: ${props => props.theme.colors.textColorDark};
  font-size: 16px;
  line-height: 18.75px;
  letter-spacing: 0.4px;
  margin: 0;
`

const TextLighter = styled.p`
  color: ${props => props.theme.colors.textColorLighter};
  font-size: 12px;
  line-height: 14.06px;
  margin: 0;
`

const ButtonRow = styled.div`
  display: flex;

  button:first-child {
    margin-right: 12px;
  }
`

const FiltersControls = styled.div<{ disabled?: boolean }>`
  align-items: center;
  display: flex;
  margin-left: auto;
  margin-right: auto;
  pointer-events: ${props => (props.disabled ? 'none' : 'initial')};

  @media (min-width: ${props => props.theme.themeBreakPoints.sm}) {
    margin-left: 0;
    margin-right: 0;
    padding-left: 10px;
  }
`

const NodeDropdown = styled(Dropdown)`
  min-width: 170px;
`

const CustomDropdownItem = styled.div`
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  font-size: 14px;
  line-height: 16px;
  display: flex;
  align-items: center;
  letter-spacing: 0.4px;
  color: ${props => props.theme.colors.textColorDark};

  img {
    margin-right: 10px;
  }
`

const StatusBage = styled.div<{ status: boolean }>`
  width: 6px;
  height: 6px;
  margin-right: 8px;
  border-radius: 3px;
  // background-color: #55ac68;
  background-color: ${props => (props.status ? props.theme.message.colors.ok : props.theme.message.colors.error)};
`

const Input = styled.input`
  width: 100%;
  margin-top: 20px;
  padding: 12px 20px;
  border: 1px solid ${props => props.theme.colors.tertiary};
  box-sizing: border-box;
  border-radius: 8px;
`
function isValidHttpUrl(data: string) {
  let url

  try {
    url = new URL(data)
  } catch (_) {
    return false
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
}
const SettingsViewContainer = () => {
  const history = useHistory()
  const context = useConnectedWeb3Context()

  const [current, setCurrent] = useState(0)
  const [url, setUrl] = useState<string>('')
  const [onlineStatus, setOnlineStatus] = useState<boolean>(false)

  const urlObject = getChainSpecificAlternativeUrls(context.networkId)

  const dropdownItem = urlObject.map((item, index) => {
    return {
      title: item.name,
      image: item.name === 'Infura' ? imgInfura : undefined,
      onClick: () => {
        setCurrent(index)
        setUrl(item.rpcUrl)
      },
    }
  })

  dropdownItem.push({
    title: 'Custom',
    image: undefined,
    onClick: () => {
      setCurrent(dropdownItem.length - 1)
    },
  })

  const filterItems = dropdownItem.map(item => {
    // console.log(index)
    return {
      content: (
        <CustomDropdownItem onClick={item.onClick}>
          {item.image && <img alt="node" src={item.image} />}
          {item.title}
        </CustomDropdownItem>
      ),
      secondaryText: '',
      onClick: item.onClick,
    }
  })
  const checkRpcStatus = async () => {
    try {
      await axios.post(url, {
        id: +new Date(),
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: ['latest', true],
      })

      setOnlineStatus(true)
      return true
    } catch (e) {
      setOnlineStatus(false)

      return false
    }
  }
  useEffect(() => {
    if (url.length === 0 && current !== dropdownItem.length - 1) {
      setUrl(urlObject[current].rpcUrl)
    }
    if (!isValidHttpUrl(url)) {
      return
    }

    checkRpcStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  return (
    <ListCard style={{ minHeight: 'initial' }}>
      <TopContent>
        <Text>Settings</Text>
      </TopContent>

      <MainContent>
        <Row>
          <Column>
            <Text>RPC Endpoint</Text>
            <StatusSection>
              <StatusBage status={onlineStatus} />
              <TextLighter>Status: {onlineStatus ? 'OK' : 'Unavailable'}</TextLighter>
            </StatusSection>
          </Column>
          <FiltersControls>
            <NodeDropdown currentItem={current} dirty dropdownPosition={DropdownPosition.center} items={filterItems} />
          </FiltersControls>
        </Row>
        {current === dropdownItem.length - 1 && (
          <Input onChange={event => setUrl(event.target.value)} placeholder="Paste your RPC URL"></Input>
        )}
      </MainContent>

      <BottomContent>
        <ButtonRound
          onClick={() => {
            history.push('/')
          }}
        >
          Back
        </ButtonRound>
        <ButtonRow>
          <ButtonRound
            onClick={() => {
              setCurrent(0)
              setUrl(urlObject[0].rpcUrl)
            }}
          >
            Set to Default
          </ButtonRound>
          <ButtonRound
            disabled={!isValidHttpUrl(url)}
            onClick={async () => {
              if (!(await checkRpcStatus())) return

              sessionStorage.setItem(
                'rpcAddress',
                JSON.stringify({
                  url: url,
                  network: context.networkId,
                }),
              )
              history.replace('/')
              window.location.reload()
            }}
          >
            Save
          </ButtonRound>
        </ButtonRow>
      </BottomContent>
    </ListCard>
  )
}

export { SettingsViewContainer }
