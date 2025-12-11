import React, { useState, useMemo , useEffect } from "react";
import styles from "./RTU.module.css";
import { saveRTUMasterTable } from '../../../services/djangoService';
import { toast } from "react-toastify";
import loadingGif from '../../../assets/Loading_icon.gif';

const TableBS = ({ data, maxHeight = "700px", searchable = true, sortable = true, iseditable }) => {
  const [tableData, setTableData] = useState([]);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [editedRows, setEditedRows] = useState({}); // Track edited rows
  const [isLoading, setIsLoading] = useState(false);
  // Dynamically gets all column names from the first object in the data array.
  const headers = tableData && tableData.length > 0 ? Object.keys(tableData[0]) : [];
  const localHeaders = ['Station','Protocol','Responsibility','Mail List','MCC(M)','MCC(S)','BCC(M)','BCC(S)','RTU Type']

  
  useEffect(() => {
    if (data && data.length > 0) {
      setTableData(data);
    }
  }, [data]);

  // ✅ Filtered Data (from tableData, not data)
  const filteredData = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];
    if (!search) return tableData;

    return tableData.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, tableData]);

  // ✅ Sorted Data
  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortConfig, sortable]);

  // ✅ Handle Sorting Click
  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // Handle cell edit
  const handleEdit = (stationId, key, value) => {
    setTableData((prev) => {
      const updated = prev.map((row) =>
        row.Station === stationId ? { ...row, [key]: value } : row
      );
  
      // Track edited rows
      setEditedRows((prevEdited) => ({
        ...prevEdited,
        [stationId]: updated.find((row) => row.Station === stationId),
      }));
  
      return updated;
    });
  };
  // Send only edited rows
  const handleSave = async () => {
    try {
      const rowsToSend = Object.values(editedRows);
      if (rowsToSend.length === 0) {
        toast.success(`No changes Detected`);
        return;
      }
      setIsLoading(true);  // Hide loaderisuploading
      const response = await saveRTUMasterTable(rowsToSend) 
      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to upload file');
      }
      toast.success(`${response.data.message}`);
      setEditedRows({});
      setIsLoading(false);
    } catch (error) {
        setIsLoading(false);
        toast.error(`${error}`);
    } 
  }


  // ✅ Early return AFTER hooks
  if (!tableData || tableData.length === 0) {
    return <p className="text-center mt-3">No data available</p>;
  }

  return (
    <div className={`${styles["container-padding"]} container mt-4`}>
      {isLoading && (
            <div className="container col-2 z-1">
                <img src={loadingGif} alt="Loading" />
            </div>
      )}
      <div className="row">
        <div className="col-md-6">
            {/* 🔍 Optional Search */}
            {searchable && (
              <input
                type="text"
                placeholder="Search..."
                className="form-control mb-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}
        </div>
        {/* upload file which downloaded above by user */}
        <div className="col-md-3">
          <button className="btn btn-success btn-sm mt-2" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
      <div className="table-responsive" style={{ maxHeight }}>
        {iseditable ? <>
          <table className="table table-sm table-bordered table-striped align-middle text-center small">
            <thead className="table-light">
              <tr>
                {localHeaders.map((key) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    style={{ cursor: sortable ? "pointer" : "default" }}
                  >
                    {key}{" "}
                    {sortable && sortConfig.key === key && (
                      sortConfig.direction === "asc" ? "▲" : "▼"
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, idx) => (
                <tr key={idx}>
                  {headers.map((key, colIndex) => (
                    <td key={colIndex}>
                      {key !== "Station" ? (
                        <input
                          type="text"
                          value={row[key] ?? ""}
                          onChange={(e) => handleEdit(row["Station"], key, e.target.value)} 
                          style={{ width: "100%" }}
                        />
                      ) : (
                        row[key]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          
          </> : <>
            <table className="table table-sm table-bordered table-striped align-middle text-center small">
              <thead className="table-light">
                <tr> {headers.map((key) => (<th key={key} onClick={() => handleSort(key)} style={{ cursor: sortable ? "pointer" : "default" }} > {key}{" "}
                  {sortable && sortConfig.key === key && (sortConfig.direction === "asc" ? "▲" : "▼")} </th>))}
                </tr>
              </thead>
              <tbody> {sortedData.map((row, idx) => (<tr key={idx}> {headers.map((key, i) => (<td key={i}>{row[key]}</td>))} </tr>))}
              </tbody>
            </table>
        </>}
        
      </div>
    </div>
  );
};

export default TableBS;
