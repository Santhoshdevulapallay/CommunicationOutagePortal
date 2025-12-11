import React, { useState , useEffect } from "react";
import { intraStateReq , getSubstationsList } from "../../../services/djangoService";
import { toast } from "react-toastify";
import useUserContext from "../../../context/user";

const elementTypes = ["Bay", "Line", "ICT" ,"Bus" ,"Conductor", "Capacitor", "Bus Reactor", "Transformer", "Other"];
const today = new Date().toISOString().split("T")[0]; // "2025-09-22"


const IntraStateForm = () => {
  
  const userContext = useUserContext();
  const [substations, setsubstations] = useState([]);

  const [requests, setRequests] = useState([
    {
      typeOfRequest: "New",
      endASubstation: "",
      remarks: "",
      sld: null,
      subtop: null,
      elements: [
        {
          elementType: "",
          elementNo: "",
          noOfBays: "",
          nameOfElement: "",
          dateOfCharging: today,
          endBSubstation: "",
          sld: null,
          subtop: null,
        },
      ],
    },
  ]);

  useEffect(() => {
      const loadData = async () => {
        try {
          const response = await getSubstationsList({entityName: userContext?.userName});
          if (!response.data.status) {
            throw new Error("Failed to fetch Substations List");
          }
          setsubstations(response.data.substations || []);
        } catch (error) {
          toast.error(error.message || "Something went wrong");
        } finally {
        }
      };
      loadData();
   }, []);
  
  // Request-level change
  const handleRequestChange = (reqIndex, e) => {
    const { name, value, files } = e.target;
    setRequests((prev) => {
      const newRequests = [...prev];
      newRequests[reqIndex][name] = files ? files[0] : value;
      return newRequests;
    });
  };

  // Element-level change
  const handleElementChange = (reqIndex, elIndex, e) => {
    const { name, value, files } = e.target;
    setRequests((prev) => {
      const newRequests = [...prev];
      newRequests[reqIndex].elements[elIndex][name] = files ? files[0] : value;

      // Enable/disable logic
      if (name === "elementType") {
        if (value === "Line") {
          newRequests[reqIndex].elements[elIndex].endBSubstation = "";
          newRequests[reqIndex].elements[elIndex].sld = null;
          newRequests[reqIndex].elements[elIndex].subtop = null;
        } else if (value === "Bay") {
          newRequests[reqIndex].elements[elIndex].noOfBays = "";
        }
      }
      return newRequests;
    });
  };

  const addRequest = () => {
    setRequests((prev) => [
      ...prev,
      {
        typeOfRequest: "New",
        endASubstation: "",
        remarks: "",
        sld: null,
        subtop: null,
        devicefile: null,
        elements: [],
      },
    ]);
  };

  const deleteRequest = (reqIndex) => {
    setRequests((prev) => prev.filter((_, i) => i !== reqIndex));
  };

  const addElement = (reqIndex) => {
    setRequests((prev) => {
      const newRequests = [...prev];
      newRequests[reqIndex].elements.push({
        elementType: "",
        elementNo: "",
        noOfBays: "",
        nameOfElement: "",
        dateOfCharging: today,
        endBSubstation: "",
        sld: null,
        subtop: null,
      });
      return newRequests;
    });
  };

  const deleteElement = (reqIndex, elIndex) => {
    setRequests((prev) => {
      const newRequests = [...prev];
      newRequests[reqIndex].elements = newRequests[reqIndex].elements.filter((_, i) => i !== elIndex);
      return newRequests;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("user", userContext?.userName || "unknown_user");
    requests.forEach((req, reqIndex) => {
      formData.append(`requests[${reqIndex}][typeOfRequest]`, req.typeOfRequest);
      formData.append(`requests[${reqIndex}][endASubstation]`, req.endASubstation);
      formData.append(`requests[${reqIndex}][remarks]`, req.remarks);
  
      if (req.sld) formData.append(`requests[${reqIndex}][sld]`, req.sld);
      if (req.subtop) formData.append(`requests[${reqIndex}][subtop]`, req.subtop);
      if (req.devicefile) formData.append(`requests[${reqIndex}][devicefile]`, req.devicefile);
  
      req.elements.forEach((el, elIndex) => {
        formData.append(`requests[${reqIndex}][elements][${elIndex}][elementType]`, el.elementType);
        formData.append(`requests[${reqIndex}][elements][${elIndex}][elementNo]`, el.elementNo);
        formData.append(`requests[${reqIndex}][elements][${elIndex}][noOfBays]`, el.noOfBays);
        formData.append(`requests[${reqIndex}][elements][${elIndex}][nameOfElement]`, el.nameOfElement);
        formData.append(`requests[${reqIndex}][elements][${elIndex}][dateOfCharging]`, el.dateOfCharging);
        formData.append(`requests[${reqIndex}][elements][${elIndex}][endBSubstation]`, el.endBSubstation);
  
        if (el.sld) formData.append(`requests[${reqIndex}][elements][${elIndex}][sld]`, el.sld);
        if (el.subtop) formData.append(`requests[${reqIndex}][elements][${elIndex}][subtop]`, el.subtop);
        if (el.devicefile) formData.append(`requests[${reqIndex}][elements][${elIndex}][devicefile]`, el.devicefile);
      });
    });
  
    try {
      const response = await intraStateReq(formData); // Your API call
      if (!response.data.status) throw new Error("Failed to save form data");
      toast.success("Form saved successfully!");
    } catch (err) {
      if (err.response) {
        toast.error(`Server Error: ${err.response.data}`);
      } else {
        toast.error(err.message);
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="alert alert-primary alert-dismissible fade show text-center">
        <strong> Intra State New Element Form </strong>
      </div>
      <form onSubmit={handleSubmit}>
        {requests.map((req, reqIndex) => (
          <div key={reqIndex} className="border rounded p-3 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Request {reqIndex + 1}</h5>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => deleteRequest(reqIndex)}
              >
                Delete Request
              </button>
            </div>
            <div className="row mb-3">
              <div className="col-md-3">
                <label className="form-label">Type of Request</label>
                <select
                  className="form-select"
                  name="typeOfRequest"
                  value={req.typeOfRequest}
                  onChange={(e) => handleRequestChange(reqIndex, e)}
                >
                  <option value="New">New</option>
                  <option value="Modify">Modify</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">End A Substation</label>
                <select
                  className="form-select"
                  name="endASubstation"
                  value={req.endASubstation}
                  onChange={(e) => handleRequestChange(reqIndex, e)}
                >
                  <option value="">Select</option>
                  {substations && substations.length > 0 ? 
                    substations.map((substation, index) => (
                      <option key={index} value={substation}>
                        {substation}
                      </option>
                    ))
                  : null}
                  
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">SLD</label>
                <input
                  type="file"
                  className="form-control"
                  name="sld"
                  accept=".pdf,.png,.jpeg,.docx"
                  onChange={(e) => handleRequestChange(reqIndex, e)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Subtop</label>
                <input
                  type="file"
                  className="form-control"
                  name="subtop"
                  accept=".xlsx,.csv"
                  onChange={(e) => handleRequestChange(reqIndex, e)}
                />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-3">
                <label className="form-label">OAG File</label>
                <input
                  type="file"
                  className="form-control"
                  name="devicefile"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleRequestChange(reqIndex, e)}
                />
              </div>
              <div className="col-md-9">
                <label className="form-label">Remarks</label>
                <input
                  type="text"
                  placeholder="Any remarks .."
                  className="form-control"
                  name="remarks"
                  value={req.remarks}
                  onChange={(e) => handleRequestChange(reqIndex, e)}
                  disabled={req.typeOfRequest === "New"}
                  />
              </div>
            </div>
           
            <h6>Elements</h6>
            {req.elements.map((el, elIndex) => (
              <div key={elIndex} className="border p-3 mb-3 bg-light">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Element {elIndex + 1}</strong>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteElement(reqIndex, elIndex)}
                  >
                    Delete Element
                  </button>
                </div>
                <div className="row mb-3">
                  <div className="col-md-3">
                    <label className="form-label">Element Type</label>
                    <select
                      className="form-select"
                      name="elementType"
                      value={el.elementType}
                      onChange={(e) => handleElementChange(reqIndex, elIndex, e)}
                    >
                      <option value="">Select</option>
                      {elementTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Element No</label>
                    <input
                      type="number"
                      min = '0'
                      className="form-control"
                      name="elementNo"
                      value={el.elementNo}
                      onChange={(e) => handleElementChange(reqIndex, elIndex, e)}
                      disabled={el.elementType === "Bay"}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">No of Bays</label>
                    <input
                      type="number"
                      className="form-control"
                      name="noOfBays"
                      value={el.noOfBays}
                      onChange={(e) => handleElementChange(reqIndex, elIndex, e)}
                      disabled={el.elementType !== "Bay"}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Name of Element</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nameOfElement"
                      value={el.nameOfElement}
                      onChange={(e) => handleElementChange(reqIndex, elIndex, e)}
                      disabled={el.elementType === "Bay"}
                    />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-3">
                    <label className="form-label">Date of Charging</label>
                    <input
                      type="date"
                      className="form-control"
                      name="dateOfCharging"
                      value={el.dateOfCharging}
                      onChange={(e) => handleElementChange(reqIndex, elIndex, e)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">End B Substation</label>
                    <select
                      className="form-select"
                      name="endBSubstation"
                      value={el.endBSubstation}
                      onChange={(e) => handleElementChange(reqIndex, elIndex, e)}
                      disabled={el.elementType !== "Line"}
                    >
                      <option value="">Select</option>
                      <option value="">Select</option>
                      {substations && substations.length > 0 ? 
                        substations.map((substation, index) => (
                          <option key={index} value={substation}>
                            {substation}
                          </option>
                        ))
                      : null}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">SLD</label>
                    <input
                      type="file"
                      className="form-control"
                      name="sld"
                      accept=".pdf,.png,.jpeg,.docx"
                      onChange={(e) => handleElementChange(reqIndex, elIndex, e)}
                      disabled={el.elementType !== "Line"}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Subtop</label>
                    <input
                      type="file"
                      className="form-control"
                      name="subtop"
                      accept=".pdf,.png,.jpeg,.docx"
                      onChange={(e) => handleElementChange(reqIndex, elIndex, e)}
                      disabled={el.elementType !== "Line"}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-sm btn-dark mb-3"
              onClick={() => addElement(reqIndex)}
            >
              + Add Element
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-dark me-2" onClick={addRequest}>
          + Add Request
        </button>
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </form>
    </div>
  );
};

export default IntraStateForm;
