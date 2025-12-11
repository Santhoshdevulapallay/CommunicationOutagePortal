import React, { useState, useEffect } from "react";
import useUserContext from "../../context/user";
import loadingGif from '../../assets/Loading_icon.gif';
import * as Yup from 'yup';
import { toast } from "react-toastify";
import useFormCommonContext from "../../context/formCommon";
import { Formik, Form, Field } from "formik";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import { KeyboardDatePicker } from "formik-material-ui-pickers";
import CustomSelect from "../common/Formik/CustomSelect";
import { generateLetter, getIndianStatesBySystemType } from '../../services/djangoService'; // ✅ import new backend call
import DateFnsUtils from "@date-io/date-fns";

function GenerateLetter() {
    const userContext = useUserContext();
    const [isLoading, setIsLoading] = useState(false);
    const { _, categoryEnum, indianStates } = useFormCommonContext();

    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    // ✅ Let instead of const
    let tempindianStateInitialVal = userContext?.isSupervisor
        ? []
        : [];

    // ✅ Manage Indian States list dynamically
    const [indianStateOptions, setIndianStateOptions] = useState([
        ...tempindianStateInitialVal,
        { key: 'ALL', value: 'ALL' },
    ]);

    const systemTypeOptions = [
        { key: 'Select Option', value: '' },
        { key: 'SCADA', value: 'SCADA' },
        { key: 'REMC', value: 'REMC' },
    ];

    const monthYearFunc = (monthYearInput) => {
        let year = String(monthYearInput?.getFullYear());
        let monthNum = String(Number.parseInt(monthYearInput?.getMonth()) + 1);
        return year + monthNum;
    };

    const checkIndianState = (indianState) => {
        return indianState === undefined ? userContext['SCADA_NAME'] : indianState;
    };

    // ✅ Function to handle system type change and call backend
    const handleSystemTypeChange = async (systemType, formik) => {
        formik.setFieldValue("systemType", systemType);
        console.log(systemType)
        try {
            setIsLoading(true);
            const response = await getIndianStatesBySystemType({ systemType }); // should return [{key:'AP',value:'Andhra Pradesh'},...]
            if (response?.data) {
                let updatedList = [...response.data['statesList'], { key: 'ALL', value: 'ALL' }];
                setIndianStateOptions(updatedList);
                formik.setFieldValue("indianState", updatedList[0]?.value || "");
                toast.success(`${systemType} States loaded`);
            }
        } catch (err) {
            toast.error("Failed to fetch states for selected system type");
        } finally {
            setIsLoading(false);
        }
    };

    const genLetter = async (formvals) => {
        let monthyearid = monthYearFunc(formvals.monthYearInput);
        const indianState = checkIndianState(formvals.indianState);
        const percentageError = formvals.percentageError;
        const systemType = formvals.systemType;

        const bodyObj = { monthyearid, indianState, percentageError, systemType };

        try {
            setIsLoading(true);
            const response = await generateLetter(bodyObj);

            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${systemType}_${indianState}_${monthyearid}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);

            toast.success('File downloaded successfully');
        } catch (err) {
            if (err.response && err.response.status >= 400) {
                toast.error(`Bad Request to Server => ${err.response.data}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {userContext && Object.keys(userContext).length !== 0 && (
                <div className="container-fluid mt-3">
                    {/* Header */}
                    <div className="alert alert-primary text-center" role="alert">
                        <h5>Generate Monthly Letters</h5>
                    </div>

                    <fieldset className="border p-4 rounded">
                        <Formik
                            initialValues={{
                                monthYearInput: previousMonth,
                                category: categoryEnum[0].value,
                                indianState:
                                    indianStateOptions.length > 0
                                        ? indianStateOptions[0].value
                                        : "",
                                percentageError: 80,
                                systemType: "Select Option",
                            }}
                            validationSchema={Yup.object().shape({
                                systemType: Yup.string()
                                    .oneOf(systemTypeOptions.map((item) => item.value))
                                    .required("Required"),
                                category: Yup.string()
                                    .oneOf(categoryEnum.map((item) => item.value))
                                    .required("Required"),
                            })}
                            onSubmit={(values, { setSubmitting }) => {
                                genLetter(values);
                                setSubmitting(false);
                            }}
                        >
                            {(formik) => (
                                <>
                                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                        <Form className="form-group row g-3 align-items-end">
                                            {/* ✅ System Type Dropdown */}
                                            <div className="col-md-3">
                                                <CustomSelect
                                                    label="System Type"
                                                    name="systemType"
                                                    className="form-select"
                                                    options={systemTypeOptions}
                                                    onChange={(e) =>
                                                        handleSystemTypeChange(e.target.value, formik)
                                                    }
                                                />
                                            </div>

                                            {/* Month-Year Picker */}
                                            <div className="col-md-3">
                                                <Field
                                                    component={KeyboardDatePicker}
                                                    autoOk
                                                    ampm={false}
                                                    views={["month"]}
                                                    variant="inline"
                                                    inputVariant="outlined"
                                                    format="MM/yyyy"
                                                    label="Month and Year"
                                                    name="monthYearInput"
                                                    fullWidth={true}
                                                    value={formik.values.monthYearInput || previousMonth}
                                                    error={
                                                        formik.touched.monthYearInput &&
                                                        Boolean(formik.errors.monthYearInput)
                                                    }
                                                    helperText={
                                                        formik.touched.monthYearInput &&
                                                        formik.errors.monthYearInput
                                                    }
                                                />
                                            </div>

                                            {/* ✅ Dynamically updated State dropdown */}
                                            {indianStateOptions?.length > 0 && (
                                                <div className="col-md-3">
                                                    <CustomSelect
                                                        label="State"
                                                        name="indianState"
                                                        className="form-select"
                                                        onChange={formik.handleChange}
                                                        options={indianStateOptions}
                                                        disabled={!formik.values.systemType || formik.values.systemType === ''} // ⬅️ disable if no valid type
                                                    />
                                                </div>
                                            )}

                                            {/* Percentage Error Input */}
                                            <div className="col-md-2">
                                                <label
                                                    htmlFor="percentageError"
                                                    className="form-label fw-semibold"
                                                >
                                                    % Error
                                                </label>
                                                <input
                                                    type="number"
                                                    name="percentageError"
                                                    min="0"
                                                    className="form-control form-control-sm"
                                                    placeholder="Error %"
                                                    value={formik.values.percentageError || 80}
                                                    onChange={formik.handleChange}
                                                />
                                            </div>

                                            {/* Submit Button */}
                                            <div className="col-md-1">
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    type="submit"
                                                    disabled={formik.isSubmitting || isLoading}
                                                >
                                                    Generate
                                                </button>
                                            </div>
                                        </Form>
                                    </MuiPickersUtilsProvider>

                                    {isLoading && (
                                        <div className="container text-center mt-3">
                                            <img
                                                src={loadingGif}
                                                alt="Loading"
                                                style={{ width: "60px" }}
                                            />
                                            <p className="text-muted small mt-1">
                                                Loading, please wait...
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </Formik>
                    </fieldset>
                </div>
            )}
        </>
    );
}

export default GenerateLetter;
