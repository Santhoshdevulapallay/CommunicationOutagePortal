import React from "react";
import * as Yup from "yup";
import { toast } from "react-toastify";
import CustomSelect from "../../common/Formik/CustomSelect";
import { Formik, Form, Field } from "formik";
import { TextField } from "formik-material-ui";
import DateFnsUtils from "@date-io/date-fns";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import { KeyboardDatePicker } from "formik-material-ui-pickers";
import "../../../modalstyle.css";
import useSubmitStatusRemarksContext from "../../../context/submitStatusRemarks";
import useUserSearchParamsContext from "../../../context/userSearchParams";
// import { postStatesSCADAPointsStatusAndRemarks } from '../../../services/substationService'
import { postStatesSCADAPointsStatusAndRemarks } from '../../../services/djangoService'
import useUserContext from "../../../context/user";
import loadingGif from '../../../assets/Loading_icon.gif';

function SubmitStatusRemarksForm(){

    const {monthyearid, year, monthnum, monthname, indianState, substation } = useUserSearchParamsContext();

    const { selectPointDetails, closeModal } = useSubmitStatusRemarksContext();

    const userContext = useUserContext();

    const date = new Date();
    const minDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const pointStatusEnum = [{ key: 'Pending', value: 'Pending' },
                             { key: 'Dismantled', value: 'Dismantled' },
                             { key: 'Rectified', value: 'Rectified' },
                             { key: 'Future Point', value: 'Future_Point' },
                             { key: 'ICCP Object Name Mismatch', value: 'ICCP_Object_Name_Mismatch' }
                            ]

    const handleSubmit = (values) => {

        setTimeout(async() => {

            const { pointStatus, timeLineInput, remarks } = values;
            let timeLineDate = null;
            if(pointStatus == 'Pending'){
                timeLineDate = `${timeLineInput.getFullYear()}-${String(timeLineInput.getMonth() + 1).padStart(2, '0')}-${String(timeLineInput.getDate()).padStart(2, '0')}`;
            }
            const formDataObj = {
                monthyearid, 
                year, 
                monthnum, 
                monthname, 
                indianState, 
                substationname : substation,
                pointStatusVal : pointStatus, 
                pointTimeLineVal  : timeLineDate,
                pointRemarksVal : remarks,
                selectedAnalogPointDetails: JSON.stringify(selectPointDetails),
                
                user: userContext?.userName,
                isSupervisor : userContext?.hasOwnProperty('isSupervisor') ? userContext.isSupervisor : null

            }
            try {
                await postStatesSCADAPointsStatusAndRemarks(formDataObj);
                toast.success("Point Details Submitted")
                closeModal();
            }
            catch (err) {
                toast.error(`Bad Request to Server `);
                closeModal();
            }
        }, 500);
    }
    return (
        <>
        <div className="container-fluid mt-3">
            <fieldset className="border p-4">
                <legend  className="w-auto">Search Details</legend>
                <Formik
                    initialValues={{
                        pointStatus : pointStatusEnum[0].value,
                        timeLineInput : null,
                        remarks : "",
                    }}
                    validationSchema={Yup.object().shape({
                        pointStatus : Yup.string().oneOf(pointStatusEnum.map((item) => item.value)).required("Required"),
                        timeLineInput: Yup.date().nullable()
                                                 .transform(function (value, originalValue) {
                                                    // Handle invalid or empty values
                                                    if (this.isType(value)) return value;
                                                    const [day, month, year] = [ Number.parseInt(originalValue.getDate() + 1), Number.parseInt(originalValue.getMonth() + 1), originalValue.getFullYear()];
                                                    console.log(day, month, year);
                                                    return new Date(year, month, day);
                                                    })
                                                 .when('pointStatus', {
                                                    is : (status) => status == pointStatusEnum[0].value,
                                                    then : Yup.date()
                                                              .required('TimeLine is Required When Status is Pending')
                                                              .nullable()
                                                              .min(new Date((new Date()).getFullYear(), (new Date()).getMonth(), (new Date()).getDate() - 1), 'Timeline must be a future date'),
                                                    otherwise : Yup.date().nullable(),
                                                 }),
                        remarks : Yup.string().nullable().required("Required")
                    })}

                    onSubmit={handleSubmit}
                >
                {formik => (
                    <>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <Form 
                    onSubmit={formik.handleSubmit}  
                    className="form-group d-flex flex-row gap-4">
                        <div className="col-md-3">
                            <CustomSelect
                                label="Status"
                                name="pointStatus"
                                options={pointStatusEnum}
                                onChange={formik.handleChange}
                                className="form-select"
                                 />  
                        </div>
                        <div className="col-md-3 mt-4">
                            <Field
                                component={KeyboardDatePicker}
                                autoOk
                                ampm={false}
                                minDate={minDate}
                                variant="inline"
                                inputVariant="outlined"
                                format="MM/dd/yyyy"
                                label="TimeLine"
                                name="timeLineInput"
                                fullWidth={true}
                                disabled={formik.values.pointStatus != pointStatusEnum[0].value}
                                error={formik.touched.timeLineInput && Boolean(formik.errors.timeLineInput)}
                                helperText={formik.touched.timeLineInput && formik.errors.timeLineInput}
                                />   
                        </div>
                        <div className="col-md-3 mt-4">
                            <Field
                            component={TextField}
                            label="Remarks"
                            name="remarks"
                            variant="outlined"
                            fullWidth={true}
                            multiline={true}
                            />
                        </div>
                        <div className="col-md-3">
                            <button type="submit" 
                            className="btn btn-outline-primary mt-4" 
                            disabled={formik.isSubmitting}
                            onClick={formik.submitForm}
                            >Submit</button>
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

export default SubmitStatusRemarksForm;