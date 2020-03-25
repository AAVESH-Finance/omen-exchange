import React from 'react'
import styled from 'styled-components'

import { CATEGORIES } from '../../../common/constants'
import { Select } from '../../common/select'

interface Props {
  autoFocus?: boolean
  customValues: string[]
  disabled?: boolean
  name: string
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => any
  onClick?: (event: React.MouseEvent<HTMLSelectElement>) => any
  readOnly?: boolean
  value: string
}

const FormOption = styled.option``

export const Categories = (props: Props) => {
  const { customValues, ...restProps } = props

  const allCategories = CATEGORIES.concat(customValues.filter(item => CATEGORIES.indexOf(item) < 0))
  const options = allCategories.map(category => ({
    label: category,
    value: category,
  }))

  return (
    <Select {...restProps}>
      <FormOption value="">Select a category</FormOption>
      {options.map(option => {
        return (
          <FormOption key={option.value} value={option.value}>
            {option.label}
          </FormOption>
        )
      })}
    </Select>
  )
}
