import React, { useState } from 'react';
import { toast } from "react-toastify";
import loadingGif from '../../../assets/Loading_icon.gif';
import styles from './RTU.module.css';
import { ScadaPointsFileUpload } from "../../../services/djangoService";

function ScadaPointsFile() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

 
    
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const uploadExcel = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setIsLoading(true);
      const response = await ScadaPointsFileUpload(formData);

      if (!response.data?.status) {
        throw new Error(response.data?.message || 'Failed to upload file');
      }

      toast.success(response.data.message || "File uploaded successfully!");
      setSelectedFile(null);
    } catch (error) {
    console.error(`${error}`);

      toast.error(error.message || "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && (
        <div className="container col-2 z-1">
          <img src={loadingGif} alt="Loading" width="100" />
        </div>
      )}

      <div className={`${styles['container-padding']} container mt-4`}>
        <h3>Scada Points File Upload</h3>
        <div className="row">
          <div className="col-md-3">
            <input
              className="form-control"
              type="file"
              id="fileUpload"
              onChange={handleFileChange}
              accept=".csv, .xlsx"
            />
          </div>
          <div className="col-md-2">
            <button
              type="submit"
              className="btn btn-sm btn-success mt-3"
              onClick={uploadExcel}
              disabled={isLoading}
            >
              Upload
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ScadaPointsFile;
