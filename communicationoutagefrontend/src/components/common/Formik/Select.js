import React from 'react'
import { Field, ErrorMessage, useField } from 'formik'

import TextError from './TextError'

function Select (props) {
  const { label, name, options, ...rest } = props
  const [ field, meta ] = useField({name, options, ...rest});
  return (
    <div className='form-control'>
      <label htmlFor={name}>{label}</label>
      <Field as='select' id={name} name={name} {...rest}>
        {options.map(option => {
          return (
            <option key={option.value} value={option.value}>
              {option.key}
            </option>
          )
        })}
      </Field>
      <ErrorMessage component={TextError} name={name} />
    </div>
  )
}

export default Select;

