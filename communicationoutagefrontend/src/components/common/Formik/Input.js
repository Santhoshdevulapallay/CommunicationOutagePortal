import React from 'react'
import { Field, ErrorMessage } from 'formik'
import TextError from './TextError'
import { Form } from 'react-bootstrap';


function Input (props) {
  const { label, name, ...rest } = props
  // return (
  //   <div className='form-control'>
  //     <label htmlFor={name}>{label}</label>
  //     <Field id={name} name={name} {...rest} />
  //     <ErrorMessage component={TextError} name={name} />
  //   </div>
  // )

 

  return (
   
    <Field name={name}>
      {({ field, form }) => (
          <Form.Group  controlId={name}>
          <Form.Label>{label}</Form.Label>
            <Form.Control             
              isInvalid={form.errors[name] && form.touched[name]}
              isValid={!form.errors[name] && form.touched[name]}
              {...rest} {...field}
            />
          {!form.errors[name] && form.touched[name] &&(<Form.Control.Feedback >Looks good!</Form.Control.Feedback>)}
          { form.errors[name] && form.touched[name] &&(<Form.Control.Feedback type="invalid" >{form.errors[name]}</Form.Control.Feedback>)} 
          
          </Form.Group>

      )}
    </Field>

  )
}



          
         
          
export default Input
