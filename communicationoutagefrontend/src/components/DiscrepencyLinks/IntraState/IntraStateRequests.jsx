import  { useEffect, useState } from "react";
import { getIntraStateReq , downloadIntraStateUploads } from "../../../services/djangoService";
import { toast } from "react-toastify";
import loadingGif from "../../../assets/Loading_icon.gif";

function IntraStateRequests() {
  const [allreq, setallreq] = useState({});
  const [isLoading, setIsLoading] = useState(false);
 
  useEffect(() => {
    setIsLoading(true);
    const loadData = async () => {
      try {
        const response = await getIntraStateReq();
        if (!response.data.status) {
          throw new Error("Failed to fetch RTU data");
        }
        // group by utility safely
        const grouped = response.data.data.reduce((acc, row) => {
          if (row && row.utility) {
            if (!acc[row.utility]) acc[row.utility] = [];
            acc[row.utility].push(row);
          }
          return acc;
        }, {});

        setallreq(grouped);
      } catch (error) {
        toast.error(error.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

    const downloadFile = async (fileurl) => {
        try {
            setIsLoading(true);
            const filename = fileurl.split("/").pop(); // "APSLDC_22092025.PNG"

            const response = await downloadIntraStateUploads({ fileurl });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setIsLoading(false);
        toast.success('File downloaded Successfully')
        } catch (error) {
        setIsLoading(false);
        toast.error(error);
        }
    }
 
  if (isLoading) {
    return (
      <div className="text-center mt-4">
        <img src={loadingGif} alt="Loading..." width="100" />
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <h4 className="mb-3 fw-bold text-primary text-uppercase border-bottom pb-2">
        Intra State Requests
      </h4>

      <div className="table-responsive shadow-lg rounded">
        <table className="table table-hover table-bordered align-middle mb-0">
          <thead className="table-primary text-dark">
            <tr>
              <th className="text-center">Utility</th>
              <th className="text-center">Type of Request</th>
              <th>End A Substation</th>
              <th>Remarks</th>
              <th>SLD</th>
              <th>Subtop</th>
              <th>OAG </th>
              <th>Element Type</th>
              <th>Element No</th>
              <th>No of Bays</th>
              <th>Name of Element</th>
              <th>Element SLD</th>
              <th>Element Subtop</th>
              <th>Date of Charging</th>
              <th>End B Substation</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(allreq).map(([utility, rows]) =>
              Array.isArray(rows) && rows.length > 0 ? (
                rows.map((row, index) => (
                  <tr
                    key={`${utility}-${row.element_no}-${index}`}
                    className="align-middle"
                  >
                    {/* Merge Utility cell only once */}
                    {index === 0 && (
                      <td
                        rowSpan={rows.length}
                        className="text-center fw-bold bg-light"
                      >
                        {utility}
                      </td>
                    )}
                    <td className="text-primary fw-semibold">
                      {row.type_of_request}
                    </td>
                    <td>{row.end_a_substation}</td>
                    <td
                      title={row.remarks}
                      className="text-truncate"
                      style={{ maxWidth: "200px" }}
                    >
                      {row.remarks}
                    </td>
                    <td>
                        {row.util_sld ? (
                            <span className="me-2" style={{cursor: 'pointer', color: 'blue'}} onClick={() => downloadFile(row.util_sld)}>
                                <i className="fa fa-download" aria-hidden="true"></i>
                            </span>
                        ) : null}         
                    </td>
                    <td>
                        {row.util_subtop ? (
                            <span className="me-2" style={{cursor: 'pointer', color: 'blue'}} onClick={() => downloadFile(row.util_subtop)}>
                                <i className="fa fa-download" aria-hidden="true"></i>
                            </span>
                        ) : null}
                    </td>
                    <td>
                        {row.util_oag ? (
                            <span className="me-2" style={{cursor: 'pointer', color: 'blue'}} onClick={() => downloadFile(row.util_oag)}>
                                <i className="fa fa-download" aria-hidden="true"></i>
                            </span>
                        ) : null}
                    </td>
                    <td>
                      <span className="badge bg-info text-dark">
                        {row.element_type}
                      </span>
                    </td>
                    <td>{row.element_no}</td>
                    <td>{row.no_of_bays}</td>
                    <td className="fw-medium">{row.name_of_element}</td>
                    <td>
                        {row.element_sld ? (
                            <span className="me-2" style={{cursor: 'pointer', color: 'blue'}} onClick={() => downloadFile(row.element_sld)}>
                                <i className="fa fa-download" aria-hidden="true"></i>
                            </span>
                        ) : null}         
                    </td>
                    <td>
                        {row.element_subtop ? (
                            <span className="me-2" style={{cursor: 'pointer', color: 'blue'}} onClick={() => downloadFile(row.element_subtop)}>
                                <i className="fa fa-download" aria-hidden="true"></i>
                            </span>
                        ) : null}
                    </td>
                    <td>
                      {row.date_of_charging
                        ? new Date(row.date_of_charging).toLocaleDateString()
                        : ""}
                    </td>
                    <td>{row.end_b_substation}</td>
                  </tr>
                ))
              ) : null
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default IntraStateRequests;
