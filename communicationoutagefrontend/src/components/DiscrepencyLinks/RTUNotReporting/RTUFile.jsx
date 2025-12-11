import {getRTUMasterList , downloadRTUTemplate ,uploadRTUMaster} from '../../../services/djangoService';
import React, {  useState } from 'react';
import { toast } from "react-toastify";
import loadingGif from '../../../assets/Loading_icon.gif';
import styles from './RTU.module.css'

function RTUFile() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    // const [rtuMaster, setrtuMaster] = useState([]);
    
    // download template for RTU master
    const downloadTemplate = async () => {
        try {
        setIsLoading(true);
        const response = await downloadRTUTemplate();
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "rtu_master.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setIsLoading(false);
        toast.success('File downloaded Successfully')
        } catch (error) {
        setIsLoading(false);
        toast.error(error);
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) setSelectedFile(file);
    };

    // upload excel file
    const uploadExcel = async () => {
      if (!selectedFile) {
          alert("Please select a file to upload.");
          return;
      }
      const formData = new FormData();
      formData.append("file", selectedFile); // Append file to FormData
      try {
          setIsLoading(true);  // Hide loaderisuploading
          const response = await uploadRTUMaster(formData) 
          if (!response.data.status) {
            throw new Error(response.data.message || 'Failed to upload file');
        }
        toast.success(`${response.data.message}`);
        // Reload the RTU master list after successful upload
        const updatedResponse = await getRTUMasterList();
        if (!updatedResponse.data.status) {
          throw new Error('Failed to fetch updated RTU data');
        }
        // setrtuMaster(updatedResponse.data.data);
        setSelectedFile(null); // Clear the selected file after upload
        setIsLoading(false);
      } catch (error) {
          setIsLoading(false);
          toast.error(`${error}`);
      }
    };
    
    return <>
         {isLoading && (
              <div className="container col-2 z-1">
                  <img src={loadingGif} alt="Loading" width = "100"/>
              </div>
        )}
        <div className={` ${styles['container-padding']} container mt-4`}>
            <h3>RTU Master File Upload</h3>
            <div className="row">
                <div className="col-md-2">
                    <button type="button" 
                    className="btn btn-sm btn-primary mt-3" 
                    onClick={() => {downloadTemplate()}} 
                    > Download Template </button>
                </div>
                {/* upload file which downloaded above by user */}
                <div className="col-md-3">
                    <label></label>
                        <input
                        className="form-control"
                        type="file"
                        id="fileUpload"
                        onChange={handleFileChange}
                        accept=".csv"
                        />
                </div>
                <div className="col-md-2">
                        <button type="submit" 
                        className="btn btn-sm btn-success mt-3" 
                        onClick={() => {uploadExcel()}} 
                        > upload</button>
                </div>                
            </div>
        </div>
        
    </>
}


export default RTUFile;