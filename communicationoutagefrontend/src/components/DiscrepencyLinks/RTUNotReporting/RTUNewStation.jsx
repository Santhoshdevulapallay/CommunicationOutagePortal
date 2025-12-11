import React, { useState } from "react";
import { newRTUCreate } from "../../../services/djangoService";
import { toast } from "react-toastify";
import styles from './RTU.module.css'

function RTUNewStation() {

    const [formData, setFormData] = useState({
        station: "",
        protocol: "",
        responsibility: "",
        mailList: "",
        mainChannelMain: "",
        mainChannelStandby: "",
        backupChannelMain: "",
        backupChannelStandby: "",
      });
    
    const options = ["Provided", "Not Provided"];
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
      };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Convert comma-separated emails to array
        const payload = {
          ...formData,
          mailList: formData.mailList.split(",").map((email) => email.trim()),
        };
        
        try {
            const response = await newRTUCreate(payload)
            if (!response.data.status) {
              throw new Error('Failed to fetch RTU data');
            }
            toast.success(`RTU Station ${formData.station} created successfully!`);
            setFormData({
              station: "",
              protocol: "",
              responsibility: "",
              mailList: "",
              mainChannelMain: "",
              mainChannelStandby: "",
              backupChannelMain: "",
              backupChannelStandby: "",
            });
        }
        catch (err){
            if(err.response && err.response.status >= 400){
                toast.error(`Bad Request to Server => ${err.response.data}`);
            }
        }
      };
    return (
        <div className={` ${styles['container-padding']} container mt-4`}>
          <h3>New RTU </h3>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Station</label>
              <input
                type="text"
                className="form-control"
                name="station"
                value={formData.station}
                onChange={handleChange}
                required
              />
            </div>
    
            <div className="col-md-4">
              <label className="form-label">Protocol</label>
              <input
                type="number"
                min="1"
                className="form-control"
                name="protocol"
                value={formData.protocol}
                onChange={handleChange}
                required
              />
            </div>
    
            <div className="col-md-4">
              <label className="form-label">Responsibility</label>
              <input
                type="text"
                className="form-control"
                name="responsibility"
                value={formData.responsibility}
                onChange={handleChange}
                required
              />
            </div>
    
            <div className="col-md-12">
              <label className="form-label">Mail List (comma separated)</label>
              <input
                type="text"
                className="form-control"
                name="mailList"
                value={formData.mailList}
                onChange={handleChange}
                placeholder="email1@example.com, email2@example.com"
                required
              />
            </div>
    
            {/* Main Channel */}
            <div className="col-md-3">
              <label className="form-label">Main Channel - Main</label>
              <select
                className="form-select"
                name="mainChannelMain"
                value={formData.mainChannelMain}
                onChange={handleChange}
                required
              >
                <option value="">Select...</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
    
            <div className="col-md-3">
              <label className="form-label">Main Channel - Standby</label>
              <select
                className="form-select"
                name="mainChannelStandby"
                value={formData.mainChannelStandby}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
    
            {/* Backup Channel */}
            <div className="col-md-3">
              <label className="form-label">Backup Channel - Main</label>
              <select
                className="form-select"
                name="backupChannelMain"
                value={formData.backupChannelMain}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
    
            <div className="col-md-3">
              <label className="form-label">Backup Channel - Standby</label>
              <select
                className="form-select"
                name="backupChannelStandby"
                value={formData.backupChannelStandby}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
    
            <div className="col-12">
              <button type="submit" className="btn btn-sm btn-success">
                Add
              </button>
            </div>
          </form>
        </div>
      );
}



export default RTUNewStation