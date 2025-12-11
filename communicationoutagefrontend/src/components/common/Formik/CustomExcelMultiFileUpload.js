import React from 'react';
import { ErrorMessage, useField } from 'formik';
import TextError from './TextError';

function CustomExcelMultiFileUpload(props) {
  const { label, name, ...rest } = props;
  const [ field, meta, helpers ] = useField(name); // Destructure helpers to manage file value

  const handleFileChange = (event) => {
    
    const file = event.currentTarget.files;
    helpers.setValue(file); // Update Formik's field value with the file
  };

  return (
    <div className=''>
      <label htmlFor={name}>{label}</label>
      <input 
        type="file"
        id={name}
        name={name}
        multiple
        onChange={handleFileChange}
        {...rest}
      />
      <ErrorMessage component={TextError} name={name} />
    </div>
  );
}

export default CustomExcelMultiFileUpload;
