import React, { useState } from "react";
import * as Yup from 'yup';
import { toast } from "react-toastify";
import DateFnsUtils from "@date-io/date-fns";
import { Formik, Form, Field } from "formik";
import CustomSelect from "../../common/Formik/CustomSelect";
import useFormCommonContext from "../../../context/formCommon";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import { KeyboardDatePicker } from "formik-material-ui-pickers";

import CustomExcelMultiFileUpload from "../../common/Formik/CustomExcelMultiFileUpload";

import { postadminFileUpload } from "../../../services/djangoService"
import loadingGif from '../../../assets/Loading_icon.gif';

function FileUploadForm() {
    
    const SUPPORTED_FORMATS = [
                                // .xlsx , 
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                // .xls 
                                'application/vnd.ms-excel', 
                              ];
    
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const [ isLoading, setIsLoading ] = useState(false);

    const { monthNames, categoryEnum, _ } = useFormCommonContext();

    const handleSubmit = async (values, actions) => {

        const { monthYearInput, category, excelFile } = values;

        let year = String(monthYearInput?.getFullYear());
        let monthNum = String(Number.parseInt(monthYearInput?.getMonth()) + 1);
        let monthyearid = year + monthNum;
        let monthName = monthNames[monthNum - 1];
        
        const formData = new FormData();
        formData.append('monthyearid', monthyearid);
        formData.append('year', year);
        formData.append('monthnum', monthNum);
        formData.append('monthname', monthName);
        formData.append('category', category);
        
        Array.from(excelFile).forEach((file) => {
            formData.append("files", file); // "files" is the key (backend should accept an array)
        });
        
        try {
            setIsLoading(true);
            const response = await postadminFileUpload(formData , {
                headers: {
                    'Content-Type': 'multipart/form-data', // Required for file uploads
                    }
                });
            actions.resetForm();
            toast.success("Files are uploaded");
        }
        catch (err){
            if(err.response && err.response.status >= 400){
                toast.error(`Bad Request to Server => ${err.response.data}`);
            }
        }
        finally{
            setIsLoading(false);
        }
    }
    
    return (
        <>
            {isLoading && (
                <div className="container col-2 z-1">
                    <img src={loadingGif} alt="Loading" />
                </div>
            )}
            <div className="container-fluid mt-3">
                    <h2>File Upload : </h2>
                    <fieldset className="border p-4">
                        <Formik
                            initialValues={{
                                monthYearInput : previousMonth,
                                category : categoryEnum[0].value,
                                excelFile : null
                            }}
                            validationSchema={Yup.object().shape({
                            category : Yup.string().oneOf(categoryEnum.map((item) => item.value)).required("Required"),
                            excelFile : Yup.mixed()
                                        .required('A file is required')
                                        .test('fileSize', 'File size is too large', (value) => {
                                        return value
                                        })
                                .test('fileType', 'Only Excel files are allowed', (value) => {       
                                    return value && Array.from(value).every((file) => SUPPORTED_FORMATS.includes(file.type))
                                    })
                            })}

                            onSubmit={handleSubmit}
                        >
                        {formik => (
                            <>
                            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                <Form 
                                onSubmit={formik.handleSubmit}  
                                className="d-flex flex-column"
                                encType="multipart/form-data"
                                >
                                    <div className="col-md-3 mt-4 mx-auto">
                                        <Field
                                            component={KeyboardDatePicker}
                                            autoOk
                                            ampm={false}
                                            views={["year", "month"]}
                                            variant="inline"
                                            inputVariant="outlined"
                                            format="MM/yyyy"
                                            label="Month and Year"
                                            name="monthYearInput"
                                            fullWidth={true}
                                            error={formik.touched.monthYearInput && Boolean(formik.errors.monthYearInput)}
                                            helperText={formik.touched.monthYearInput && formik.errors.monthYearInput}
                                            />   
                                    </div>

                                    <div className="col-md-3 mt-3 mx-auto">
                                        <CustomSelect
                                            label="Category"
                                            name="category"
                                            className="form-select"
                                            options={categoryEnum}
                                            onChange={formik.handleChange}
                                            />  
                                    </div>
                                            
                                    <div className="col-md-3 mt-3 mx-auto">
                                        <CustomExcelMultiFileUpload 
                                        label="Upload File" 
                                        name="excelFile"
                                        className="form-control d-inline-block"  
                                        aria-describedby="inputGroupFileAddon04" 
                                        aria-label="Upload" 
                                        />
                                    </div>

                                    <div className="col-md-3 mt-3 mx-auto">
                                        <button type="submit" 
                                        className="btn btn-sm btn-primary mt-4" 
                                        disabled={formik.isSubmitting}
                                        onClick={formik.submitForm}
                                        >Upload</button>
                                    </div>
                                </Form>
                            </MuiPickersUtilsProvider>
                            {formik.isSubmitting && (
                                <div className="container col-2">
                                    <img src={loadingGif} alt="Loading" />
                                </div>
                            )}
                            </>
                        )}
                        </Formik>
                    </fieldset>
            </div>
      
        </>
    )
}

export default FileUploadForm;