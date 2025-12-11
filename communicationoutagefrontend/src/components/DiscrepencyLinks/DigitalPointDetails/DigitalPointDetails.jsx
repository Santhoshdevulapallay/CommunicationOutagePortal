import { useLocation } from "react-router-dom";
import { digitalPointDetailsSummary , updateDigitalPoint } from "../../../services/djangoService"; // Ensure you have an update function here if needed
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

// HEADER DICTIONARY
const headerMapping = {
    Non_Availability_Percentage: "Non Availability (%)",
    Non_Availability_Percentage_PrevMonth: "Non Availability Prev Month (%)",
    telemetry_failure: "Telemetry Failure",
    field_replaced_bad_quality: "Field Replaced - Bad Quality",
    reporting_open_close: "Reporting Open/Close",
    reporting_between_invalid: "Reporting Invalid",
    ELEMENT_DESCRIPTION: "Element Description",
    ELEMENT_CATEGORY: "Element Category",
    Metric_Type: "Metric Type"
};

// Auto-format header if not in dictionary
function toCamelCase(label) {
    return label
        .replace(/_/g, " ")
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toUpperCase() : word.toLowerCase()
        )
        .trim();
}

function getHeaderLabel(key) {
    return headerMapping[key] || toCamelCase(key);
}

function DigitalPointSummary() {
    const location = useLocation();
    const params = location?.state;
    const [isLoading, setIsLoading] = useState(false);
    const [pointDetails, setPointDetails] = useState([]);
    const [error, setError] = useState(null);

    // --- NEW STATES FOR MODAL & FORM ---
    const [showModal, setShowModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [formData, setFormData] = useState({
        status: "Pending",
        timeline: "",
        remarks: ""
    });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 15;

    useEffect(() => {
        (async () => {
            try {
                setIsLoading(true);
                const bodyObj = {
                    monthyearid: params?.monthyearid,
                    indianState: params?.indianState,
                    substation: params?.substation,
                    systemType: params?.systemType
                };

                const response = await digitalPointDetailsSummary(bodyObj);
                setPointDetails(response?.data['data'] || []);
            } catch (err) {
                setError("Failed to fetch data");
            } finally {
                setIsLoading(false);
            }
        })();
    }, [location?.state]);

    // Pagination logic
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = pointDetails.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(pointDetails.length / rowsPerPage);

    // --- HANDLERS ---

    // Open Modal when checkbox is clicked
    const handleCheckboxClick = (row) => {
        setSelectedRow(row);
        setFormData({ status: "Pending", timeline: "", remarks: "" }); // Reset form
        setShowModal(true);
    };

    // Handle Input Changes inside Modal
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Submit Data to Backend
    const handleSubmit = async () => {
        // Validation (Optional)
        if (!formData.timeline || !formData.remarks) {
            toast.success("Please fill in Timeline and Remarks")
            return;
        }

        const payload = {
            ...formData,
            selectedRowData: selectedRow , // Sending the row data along with form inputs
            params : params
        };
        try {
            const response = await updateDigitalPoint(payload);
            // TODO: Call your backend API here
            // await submitPointDetails(payload); 
            toast.success("Submitted successfully!")
            setShowModal(false); // Close modal on success
        } catch (error) {
            toast.error("Failed to submit.")
        }
    };

    // Close Modal
    const closeModal = () => {
        setShowModal(false);
        setSelectedRow(null);
    };

    return (
        <div className="container mt-3 position-relative">
            <div className="alert alert-primary">
                <h5 className="mb-3">Digital Point Summary</h5>
            </div>
            {isLoading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {!isLoading && pointDetails.length === 0 && <p>No data available.</p>}

            {!isLoading && pointDetails.length > 0 && (
                <>
                    {/* SCROLLABLE TABLE */}
                    <div className="table-responsive" style={{ maxHeight: "650px", border: "1px solid #ccc" }}>
                        <table className="table table-bordered  table-sm">
                            <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                                <tr>
                                    {/* Checkbox Column Header */}
                                    <th className="text-center">Action</th> 
                                    {Object.keys(pointDetails[0]).map((col, index) => (
                                        <th key={index}>{getHeaderLabel(col)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentRows.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {/* Checkbox Column Cell */}
                                        <td className="text-center">
                                            <input 
                                                type="checkbox" 
                                                className="form-check-input"
                                                style={{cursor: "pointer"}}
                                                checked={selectedRow === row} // Optional: Keep checked if modal is open for this row
                                                onChange={() => handleCheckboxClick(row)}
                                            />
                                        </td>
                                        {Object.keys(row).map((col, colIndex) => (
                                            <td key={colIndex}>
                                                {row[col] !== null ? row[col].toString() : ""}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <button
                            className="btn btn-sm btn-primary"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                        >
                            Previous
                        </button>
                        <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
                        <button
                            className="btn btn-sm btn-primary"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}

            {/* --- CUSTOM MODAL --- */}
            {showModal && (
                <div 
                    className="modal fade show" 
                    style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} 
                    tabIndex="-1"
                >
                    <div className="modal-dialog modal-xl"> {/* Wide modal for inputs */}
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Search Details</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            
                            <div className="modal-body">
                                {/* Details of Selected Row (Optional - displayed for context) */}
                                {selectedRow && (
                                    <div className="mb-3 p-2 bg-light border rounded">
                                        <small><strong>Selected Element:</strong> {selectedRow['ELEMENT_DESCRIPTION'] || selectedRow['element_description'] || "N/A"}</small>
                                    </div>
                                )}

                                {/* Form Inputs based on Image */}
                                <div className="row g-3 align-items-end">
                                    {/* Status Dropdown */}
                                    <div className="col-md-3">
                                        <label className="form-label">Status</label>
                                        <select 
                                            className="form-select" 
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Completed">Completed</option>
                                            <option value="In Progress">In Progress</option>
                                        </select>
                                    </div>

                                    {/* Timeline Date Picker */}
                                    <div className="col-md-3">
                                        <label className="form-label">TimeLine</label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            name="timeline"
                                            value={formData.timeline}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    {/* Remarks Input */}
                                    <div className="col-md-4">
                                        <label className="form-label">Remarks</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Enter remarks"
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <div className="col-md-2">
                                        <button 
                                            className="btn btn-primary w-100" 
                                            onClick={handleSubmit}
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DigitalPointSummary;