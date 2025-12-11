import React, { useState  , useEffect} from 'react';

import {rtuMasterChange , getLatestRTUData , saveRTUNotReporting ,  downloadRTULog} from '../../../services/djangoService';
import { toast } from "react-toastify";
import loadingGif from '../../../assets/Loading_icon.gif';
import TableBS from './Table_BS'
import styles from './RTU.module.css'
import CardContainer from './CardContainer';

const defaultRow = {
  station: "",
 
  mcc_m_status: "",
  mcc_s_status: "",

  bcc_m_status: "",
  bcc_s_status: "",


  mcc_dateTime1: "",
  mcc_dateTime2: "",

  bcc_dateTime1: "",
  bcc_dateTime2: "",

  mccremarks1: "",
  mccremarks2: "",

  bccremarks1: "",
  bccremarks2: "",

  mccactionNeeded1: "",
  mccactionNeeded2: "",

  bccactionNeeded1: "",
  bccactionNeeded2: "",
};

function RowSet({ index, rows, setRows ,stationList  }) {
  
  const reportStatus1 = rows[index].mcc_m_status === 'Not Provided' ? ['Not Provided'] : ['Reporting', 'Not Reporting'];
  const reportStatus2 = rows[index].mcc_s_status === 'Not Provided' ? ['Not Provided'] : ['Reporting', 'Not Reporting'];
  const reportStatus3 = rows[index].bcc_m_status === 'Not Provided' ? ['Not Provided'] : ['Reporting', 'Not Reporting'];
  const reportStatus4 = rows[index].bcc_s_status === 'Not Provided' ? ['Not Provided'] : ['Reporting', 'Not Reporting'];
  
  // const [statusOptionsList, setStatusOptionsList] = useState([ [reportStatus1, reportStatus1],
  //   [reportStatus2, reportStatus2],
  //   [reportStatus3, reportStatus3],
  //   [reportStatus4, reportStatus4]]);
  
  const handleChange = (i, field, value) => {
    // get Station related Data 
    if (field === "station") {
       const updateRNFields = async (value) => {
          try {
              const response = await rtuMasterChange({value})
              const data = response.data.data;
              // const newStatusOptionsList = [];
              // newStatusOptionsList[index] = [data[0], data[1], data[2], data[3]];
              // setStatusOptionsList(newStatusOptionsList);
              rows[index].mcc_m_status = data[0][0] || '';
              rows[index].mcc_s_status = data[1][0] || '';
              rows[index].bcc_m_status = data[2][0] || '';
              rows[index].bcc_s_status = data[3][0] || '';
              rows[index].mccactionNeeded1 = 'Action Needed';
              rows[index].mccactionNeeded2 = 'Action Needed';
              rows[index].bccactionNeeded1 = 'Action Needed';
              rows[index].bccactionNeeded2 = 'Action Needed';

              setRows([...rows]); // Update the rows state with the new status values
              if (!response.data.status) {
                throw new Error('Failed to fetch RTU data');
              }
          }
          catch (err){
              if(err.response && err.response.status >= 400){
                  toast.error(`Bad Request to Server => ${err.response.data}`);
              }
          }
      };
      updateRNFields(value)
    }
    const updatedRows = [...rows];
    updatedRows[i][field] = value;
    setRows(updatedRows);
  };

  const handleDelete = () => {
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };
  
  
  const formatDateForInput = (dateString) => {
    if (!dateString || dateString === "NaT") return ""; // Handle NaT / null / undefined
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; // Invalid date fallback
    
    // Offset the date so toISOString() will reflect local time
    const offset = date.getTimezoneOffset(); // in minutes
    const localDate = new Date(date.getTime() - offset * 60000);
    
    return localDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM in local time
  };
  

  return (
    <div className="border rounded p-3 mb-4 bg-light">
    {/* Separate Row: Station Dropdown (only once per index) */}
    <div className="row g-3 align-items-center mb-2">
      <div className="col-md-2">
        <select
          className="form-select form-select-sm form-select form-select-sm-sm"
          value={rows[index].station}
          onChange={(e) => handleChange(index, "station", e.target.value)}
          >
            {/* option for Select Station */}
            <option value="">Select Station</option>
          {stationList.map((station, subindex) => (
            <option key={subindex} value={station}>
              {station}
            </option>
          ))}
        </select>
      </div>
      <div className="col-md-2 ">
        <button className="btn btn-danger" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>

    {/* MCC */}
    {[0, 1].map((subIndex) => (
      <div
        key={`${index}-${subIndex}`}
        className="row g-3 align-items-center mb-2"
      >
        {/* MCC or BCC Dropdown */}
        { subIndex === 0 ? ( <div className="col-md-2">
          <select
            className="form-select form-select-sm"
            value='MCC'
            disabled={true}
          >
            <option value='MCC'>MCC</option>
          </select>
        </div>) : <div className="col-md-2"></div>}

        {/* Status Dropdown */}
        <div className="col-md-2">
          <select
            className="form-select form-select-sm"
            value={
              subIndex === 0 ? rows[index].mcc_m_status : rows[index].mcc_s_status
            }
            onChange={(e) =>
              handleChange(
                index,
                subIndex === 0 ? "mcc_m_status" : "mcc_s_status",
                e.target.value
              )
            }
          >
            {(
              
              (subIndex === 0 ? reportStatus1 : reportStatus2)
            ).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        {/* Datetime Input */}
        <div className="col-md-3">
          <input
            type="datetime-local"
            className="form-control form-control-sm"
            value={
              subIndex === 0
                ? formatDateForInput(rows[index].mcc_dateTime1) 
                : formatDateForInput(rows[index].mcc_dateTime2)
            }
            onChange={(e) =>
              handleChange(
                index,
                subIndex === 0 ? "mcc_dateTime1" : "mcc_dateTime2",
                e.target.value
              )
            }
          />
        </div>

        {/* Remarks Input */}
        <div className="col-md-3">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Main/Standby Channel Remarks"
            value={
              subIndex === 0
                ? rows[index].mccremarks1
                : rows[index].mccremarks2
            }
            onChange={(e) =>
              handleChange(
                index,
                subIndex === 0 ? "mccremarks1" : "mccremarks2",
                e.target.value
              )
            }
          />
        </div>

        {/* Action Needed */}
        <div className="col-md-2">
          <select
            className="form-select form-select-sm"
            value={
              subIndex === 0
                ? rows[index].mccactionNeeded1
                : rows[index].mccactionNeeded2
            }
            onChange={(e) =>
              handleChange(
                index,
                subIndex === 0 ? "mccactionNeeded1" : "mccactionNeeded2",
                e.target.value
              )
            }
          >
            <option value="Action Needed">Action Needed</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>
    ))}
      
    {[0, 1].map((subIndex) => (
      <div
        key={`${index}-${subIndex}`}
        className="row g-3 align-items-center mb-2"
      >
        {/* MCC or BCC Dropdown */}
        { subIndex === 0 ? ( <div className="col-md-2">
          <select
            className="form-select form-select-sm"
            value='BCC'
            disabled={true}
          >
            <option value='BCC'>BCC</option>
          </select>
        </div> ) : <div className="col-md-2"></div>}
       

        {/* Status Dropdown */}
        <div className="col-md-2">
          <select
            className="form-select form-select-sm"
            value={
              subIndex === 0 ? rows[index].bcc_m_status : rows[index].bcc_s_status
            }
            onChange={(e) =>
              handleChange(
                index,
                subIndex === 0 ? "bcc_m_status" : "bcc_s_status",
                e.target.value
              )
            }
          >
            {((subIndex+2 === 2 ? reportStatus3 : reportStatus4)).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Datetime Input */}
        <div className="col-md-3">
          <input
            type="datetime-local"
            className="form-control form-control-sm"
            value={
              subIndex === 0
                ? formatDateForInput(rows[index].bcc_dateTime1) 
                : formatDateForInput(rows[index].bcc_dateTime2)
            }
            onChange={(e) =>
              handleChange(
                index,
                subIndex === 0 ? "bcc_dateTime1" : "bcc_dateTime2",
                e.target.value
              )
            }
          />
        </div>

        {/* Remarks Input */}
        <div className="col-md-3">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Main/Standby Channel Remarks"
            value={
              subIndex === 0
                ? rows[index].bccremarks1
                : rows[index].bccremarks2
            }
            onChange={(e) =>
              handleChange(
                index,
                subIndex === 0 ? "bccremarks1" : "bccremarks2",
                e.target.value
              )
            }
          />
        </div>

        {/* Action Needed */}
        <div className="col-md-2">
          <select
            className="form-select form-select-sm"
            value={
              subIndex === 0
                ? rows[index].bccactionNeeded1
                : rows[index].bccactionNeeded2
            }
            onChange={(e) =>
              handleChange(
                index,
                subIndex === 0 ? "bccactionNeeded1" : "bccactionNeeded2",
                e.target.value
              )
            }
          >
            <option value="Action Needed">Action Needed</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>
    ))}
     
  </div>

  );
}

export default function StationForm() {
  const [rows, setRows] = useState([]);

  const [stationList, setStationList] = useState([]);
  const [rtuData, setrtuData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateList, setdateList] = useState([])
  
  // const [selectedDate, setSelectedDate] = useState('');
  
  const handleAddRow = () => {
    setRows([...rows, { ...defaultRow }]);
  };

  useEffect(() => {
    setIsLoading(true);
    const loadData = async () => {
      try {
        const response = await getLatestRTUData();
        if (!response.data.status) {
          throw new Error('Failed to fetch RTU data');
        }
        setStationList(response.data.data[0] || []);
        setrtuData(response.data.data[1] || []);
        setdateList(response.data.data[2] || []);
        // setSelectedDate(response.data.data?.[2]?.[0] || ''); // Set default selected date
        
        setRows(response.data.data?.[3])
       
      } catch (error) {
        toast.error(error);
      } finally {
        setIsLoading(false);
      } 
    }
    loadData();
  }, []);

  const handleSave = async () => {
    if (rows.some(row => !row.station )) {
      toast.error('Please fill all required fields (Station , Main Channel and Standby Channel Status)');
      return;
    }
    try {
      setIsLoading(true);
      const response = await saveRTUNotReporting({ selectedrows: rows });
      if (!response.data.status) {
        throw new Error('Failed to save RTU data');
      }
      setrtuData(response.data.data[0] || []);
      setdateList(response.data.data[1] || []);
      toast.success('Data Saved Successfully');
    } catch (error) {
      toast.error('Something went wrong while sending data.');
    } finally {
      setIsLoading(false);
    } 
  }
 
 

  const downloadLogFile = async () => {
    try {
      setIsLoading(true);
      const response = await downloadRTULog();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "logfile.txt");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setIsLoading(false);
      toast.success('File downloaded Successfully')
    } catch (error) {
      alert("Could not download log file.");
    }
  };


  return (
    <div className={` ${styles['container-padding']} container mt-4`}>
      {isLoading && (
            <div className="container col-2 z-1">
                <img src={loadingGif} alt="Loading" width = "100"/>
            </div>
      )}
      <div className="alert alert-primary text-center" role="alert">
        <h5>Daily Report of Non-Reporting RTUs of MCC/BCC of SRLDC</h5>
      </div>
      {/* User Entry Point */}
      <CardContainer title="Station">
        <div style={{ maxHeight: "600px", overflowY: "auto" }}>
          {rows.map((_, index) => (
            <RowSet
              key={index}
              index={index}
              rows={rows}
              setRows={setRows}
              stationList={stationList}
            />
          ))}
        </div>
        <div className="d-flex gap-3 mt-2">
          <button className="btn btn-sm btn-primary" onClick={handleAddRow}>
            Add Row
          </button>
          <button className="btn btn-sm btn-success" onClick={handleSave}>
            Save
          </button>
        </div>
      </CardContainer>
      {/* Letter Send Part */}
      <CardContainer title="Generate and Send Mail">
        
        <div className="d-flex align-items-center gap-4">
          <mark> “Mails will be sent automatically every day at 12 PM onwards.” ✅ </mark> <br></br>
            <select className="form-select form-select-sm flex-grow-1 me-2"  style={{ maxWidth: "300px" }}
            
              >
                {dateList.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            {/* <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={previewFile}
            >
             Preview
            </button> */}
            {/* <button
              type="submit"
              className="btn btn-sm btn-primary"
              onClick={sendMail}
            >
              Send Mail
          </button> */}
          <button
            type="button"
            className="btn btn-sm btn-warning"
            onClick={downloadLogFile}
          >
            Download Log
          </button>
        </div>
      </CardContainer>
      {/* Display RTU Data */}
      <CardContainer title="Telemetry Not Reporting Points(Latest 50 records)">
        <TableBS data={rtuData} maxHeight="500px" searchable={true}
          sortable={true} iseditable={ false} />
      </CardContainer>
    </div>
  );
}