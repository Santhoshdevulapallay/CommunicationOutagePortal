import { useState, useEffect } from "react";
import * as Yup from "yup";
import { useLocation } from "react-router-dom"; // ✅ Import this
import CustomSelect from "../../common/Formik/CustomSelect";
import { toast } from "react-toastify";
import DateFnsUtils from "@date-io/date-fns";
import { Formik, Form, Field } from "formik";
import useUserContext from "../../../context/user";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import { KeyboardDatePicker } from "formik-material-ui-pickers";
import useUserSearchParamsContext from "../../../context/userSearchParams";
import useFormCommonContext from "../../../context/formCommon";
import useStationContext from "../../../context/stationSummary";
import {
  postStatesSCADAStationMonthSummary,
  stateDownloadExcel,
  stateUploadExcel,
  getIndianStatesBySystemType
} from "../../../services/djangoService";
import loadingGif from "../../../assets/Loading_icon.gif";
import CustomExcelFileUpload from "../../common/Formik/CustomExcelFileUpload";


function StationSearchForm() {
  const { monthNames, categoryEnum } = useFormCommonContext();
  const userContext = useUserContext();
  
  // ✅ 1. Get location to access the data passed from PointDetails
  const location = useLocation();
  const { setUserSearchParams, userSearchParams } = useUserSearchParamsContext();
  const [stationSummaryList, setStationSummaryList] = useStationContext();

  // ✅ 2. Define "activeParams": Prefer incoming navigation state, fallback to Context
  const activeParams = location.state || userSearchParams;

  const [indianStateOptions, setIndianStateOptions] = useState([]);

  // ✅ 3. Initialize local state using activeParams
  const [currentSystemType, setCurrentSystemType] = useState(activeParams?.systemType || "");

  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);

    const systemTypeOptions = [
        { key: 'Select Option', value: '' },
        { key: 'SCADA', value: 'SCADA' },
        { key: 'REMC', value: 'REMC' },
    ];

  const [isLoading, setIsLoading] = useState(false);
  const [isuploading, setIsuploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // ✅ 4. One Main Effect to Restore Everything
  useEffect(() => {
    const initializePage = async () => {
      
      // If we found data in location.state but Context is empty, sync it!
      if (location.state && (!userSearchParams || !userSearchParams.monthyearid)) {
          setUserSearchParams(location.state);
      }

      if (activeParams?.monthyearid) {
        
        // --- Restore Dropdown Options ---
        // We check if we have a systemType but NO options loaded yet
        if (activeParams?.systemType && indianStateOptions.length === 0) {
          
          if (userContext?.isSupervisor) {
            try {
              // Fetch options
              const response = await getIndianStatesBySystemType({
                systemType: activeParams.systemType,
              });
              if (response?.data) {
                setIndianStateOptions(response.data["statesList"]);
              }
            } catch (err) {
              console.error("Failed to restore states", err);
            }
          } else {
             // Normal User
             setIndianStateOptions([{ 
                key: userContext?.SCADA_NAME, 
                value: userContext?.SCADA_NAME 
             }]);
          }
        }

        // --- Auto-Fetch Table Data ---
        // Only fetch if table is empty
        if (!stationSummaryList || stationSummaryList.length === 0) {
          const bodyObj = {
            monthyearid: activeParams.monthyearid,
            year: activeParams.year,
            monthnum: activeParams.monthnum,
            monthname: activeParams.monthname,
            category: activeParams.category,
            indianState: activeParams.indianState,
            systemType: activeParams.systemType,
          };

          try {
            setIsLoading(true);
            let response = await postStatesSCADAStationMonthSummary(bodyObj);
            const total_point_details = response?.data[0];
            setStationSummaryList(total_point_details || []);
          } catch (error) {
            console.error("Auto-fetch failed", error);
          } finally {
            setIsLoading(false);
          }
        }
      }
    };

    initializePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSubmit = async (values, actions) => {
    const { monthYearInput, category, indianState, systemType } = values;

    let year = String(monthYearInput?.getFullYear());
    let monthNum = String(Number.parseInt(monthYearInput?.getMonth()) + 1);
    let monthyearid = year + monthNum;
    let monthName = monthNames[monthNum - 1];

    const bodyObj = {
      monthyearid,
      year,
      monthnum: monthNum,
      monthname: monthName,
      category,
      indianState,
      systemType, 
    };

    setUserSearchParams(bodyObj);

    try {
      setIsLoading(true);
      let response = await postStatesSCADAStationMonthSummary(bodyObj);
      const total_point_details = response?.data[0];

      const isEmpty =
        total_point_details === null ||
        total_point_details === undefined ||
        total_point_details.length <= 0;

      setStationSummaryList(isEmpty ? [] : total_point_details);

      if (isEmpty) toast.info("No Station Summary List for given Search Parameters");
      else toast.success("Retrieved Station Summary List");
    } catch (error) {
      const errMsg =
        error?.response?.data?.error || error.message || "Something went wrong";
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemTypeChange = async (systemType, formik) => {
    formik.setFieldValue("systemType", systemType);
    setCurrentSystemType(systemType); // Keep local state in sync

    if (userContext?.isSupervisor) {
      try {
        setIsLoading(true);
        const response = await getIndianStatesBySystemType({ systemType }); 
        if (response?.data) {
          let updatedList = [...response.data['statesList'] ];
          setIndianStateOptions(updatedList);
          formik.setFieldValue("indianState", updatedList[0]?.value || "");
          toast.success(`${systemType} entity list loaded`);
        }
      } catch (err) {
        toast.error("Failed to fetch states for selected system type");
      } finally {
        setIsLoading(false);
      }
    } else {
      formik.setFieldValue("indianState",  userContext?.SCADA_NAME || "")
      let updatedList = [{ key: userContext?.SCADA_NAME, value: userContext?.SCADA_NAME }];
      setIndianStateOptions(updatedList);
    }
  };
    
  const monthYearFunc = (monthYearInput) => {
    let year = String(monthYearInput?.getFullYear());
    let monthNum = String(Number.parseInt(monthYearInput?.getMonth()) + 1);
    return year + monthNum;
  };

  const checkIndianState = (indianState) => {
    return indianState === undefined ? userContext["SCADA_NAME"] : indianState;
  };

  const downloadExcel = async (formvals) => {
    let monthyearid = monthYearFunc(formvals["monthYearInput"]);
    const indianState = checkIndianState(formvals["indianState"]);
    const { systemType } = formvals;

    const bodyObj = {
      monthyearid,
      indianState,
      systemType, 
    };

    try {
      setIsLoading(true);
      const response = await stateDownloadExcel(bodyObj);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${indianState}_${monthyearid}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("File downloaded Successfully");
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      const errMsg =
        error?.response?.data?.error || error.message || "Something went wrong";
      toast.error(errMsg);
    }
  };

  const handleFileChange = (file) => {
    setSelectedFile(file);
  };

  const uploadExcel = async (formvals) => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    let monthyearid = monthYearFunc(formvals["monthYearInput"]);
    const indianState = checkIndianState(formvals["indianState"]);
    const { systemType } = formvals;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("monthyearid", monthyearid);
    formData.append("indianState", indianState);
    formData.append("systemType", systemType); 

    try {
      setIsuploading(true);
      await stateUploadExcel(formData);
      toast.success("File Uploaded Successfully");
      setIsuploading(false);
    } catch (error) {
      setIsuploading(false);
      toast.error("Error uploading file.", error);
    }
  };

  return (
    <>
      {userContext && Object.keys(userContext).length !== 0 && (
        <div className="container-fluid mt-4">
          <div className="card shadow-sm rounded-3">
            <div className="card-header text-black">
              <h5>Search Details</h5>
            </div>
            <div className="card-body">
              <Formik
                enableReinitialize={true} 
                initialValues={{
                   // ✅ 5. CRITICAL: Use activeParams here. This ensures form fills immediately.
                   monthYearInput: activeParams?.year 
                        ? new Date(parseInt(activeParams.year), parseInt(activeParams.monthnum) - 1) 
                        : previousMonth,
                   category: activeParams?.category || categoryEnum[0].value,
                   
                   systemType: currentSystemType,

                   indianState: activeParams?.indianState || (indianStateOptions.length > 0 ? indianStateOptions[0].value : ""),
                }}
                validationSchema={Yup.object().shape({
                  category: Yup.string()
                    .oneOf(categoryEnum.map((item) => item.value))
                    .required("Required"),
                  systemType: Yup.string().required("System Type is required"),
                })}
                onSubmit={handleSubmit}
              >
                {(formik) => (
                  <>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                      <Form onSubmit={formik.handleSubmit}>
                        <div className="row g-3 align-items-end">
                          {/* Month & Year */}
                          <div className="col-md-2 col-sm-3">
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
                            />
                          </div>

                          {/* Category */}
                          <div className="col-md-2 col-sm-3">
                            <CustomSelect
                              label="Category"
                              name="category"
                              options={categoryEnum}
                              onChange={formik.handleChange}
                              className="form-select"
                            />
                          </div>

                          {/* System Type Dropdown */}
                          <div className="col-md-2 col-sm-3">
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

                           {/* State Dropdown */}
                            {indianStateOptions?.length > 0 && (
                                <div className="col-md-2 col-sm-3">
                                    <CustomSelect
                                        label="State"
                                        name="indianState"
                                        className="form-select"
                                        onChange={formik.handleChange}
                                        options={indianStateOptions}
                                        disabled={!formik.values.systemType || formik.values.systemType === ''}
                                    />
                                </div>
                            )}

                          {/* Buttons */}
                          <div className="col-md-2 d-flex gap-2 mt-2">
                            <button
                              type="submit"
                              className="btn btn-outline-primary"
                              disabled={formik.isSubmitting}
                            >
                              {formik.isSubmitting
                                ? "Getting..."
                                : "Get Details"}
                            </button>
                          </div>
                        </div>
                      </Form>
                    </MuiPickersUtilsProvider>
                    
                    <br></br>
                    <h3> File upload </h3>
                    <div className="row g-3 mt-4">
                      <div className="col-md-2">
                        <label>Download</label>
                        <button
                          type="button"
                          className="btn btn-outline-primary w-100"
                          onClick={() => downloadExcel(formik.values)}
                        >
                          {isLoading ? "Downloading..." : "Download Excel"}
                        </button>
                      </div>
                      <div className="col-md-2">
                        <CustomExcelFileUpload
                          label="Choose File (.csv)"
                          name="excelFile"
                          className="form-control"
                          accept=".csv"
                          onChange={(e) =>
                            handleFileChange(e.target.files[0])
                          }
                        />
                      </div>
                      <div className="col-md-2">
                        <label>Upload</label>
                        <button
                          type="button"
                          className="btn btn-outline-success w-100"
                          onClick={() => uploadExcel(formik.values)}
                        >
                          {isuploading ? "Uploading..." : "Upload Excel"}
                        </button>
                      </div>
                    </div>

                    {(isLoading || isuploading) && (
                      <div className="text-center my-3">
                        <img
                          src={loadingGif}
                          alt={isuploading ? "Uploading..." : "Loading..."}
                          width="80"
                        />
                      </div>
                    )}
                  </>
                )}
              </Formik>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default StationSearchForm;