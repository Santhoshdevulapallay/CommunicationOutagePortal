import React, { useEffect, useState } from 'react';
import { toast } from "react-toastify";
import loadingGif from '../../../assets/Loading_icon.gif';
import TableBS from './Table_BS';
import Card from './Card';
import ScadaFile from './ScadaPointsFile';

function ScadaPoints() {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setLoading] = useState(false);

  const fetchRecords = async (pageNo) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5355/backend/getScadaPointMasterList?page=${pageNo}&per_page=100`);
      
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();

      if (json.status) {
        setRecords(json.data);
        setPage(json.page);
        setTotalPages(json.total_pages);
      } else {
        setRecords([]);
        toast.error("No records found");
      }
    } catch (err) {
      console.error("Error fetching records:", err);
      toast.error("Error fetching records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(page);
  }, [page]);

  // -----------------------------
  // DOWNLOAD ALL CSV (direct backend call)
  // -----------------------------
  // const downloadAllCSV = async () => {
  //   try {
  //     toast.info("Preparing CSV download...");
  //     const res = await fetch(`http://localhost:5355/backend/getScadaPointMasterList?format=csv`);
  //     if (!res.ok) throw new Error(`Server returned ${res.status}`);

  //     const blob = await res.blob();
  //     const url = URL.createObjectURL(blob);

  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = `ScadaPoints_All.csv`;
  //     a.click();
  //     URL.revokeObjectURL(url);
  //   } catch (err) {
  //     console.error("Error downloading CSV:", err);
  //     toast.error("CSV download failed");
  //   }
  // };

  // -----------------------------
  // DOWNLOAD ALL EXCEL (direct backend call)
  // -----------------------------
  // const downloadAllExcel = async () => {
  //   try {
  //     toast.info("Preparing Excel download...");
  //     const res = await fetch(`http://localhost:5355/backend/getScadaPointMasterList?format=excel`);
  //     if (!res.ok) throw new Error(`Server returned ${res.status}`);

  //     const blob = await res.blob();
  //     const url = URL.createObjectURL(blob);

  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = `ScadaPoints_All.xlsx`;
  //     a.click();
  //     URL.revokeObjectURL(url);
  //   } catch (err) {
  //     console.error("Error downloading Excel:", err);
  //     toast.error("Excel download failed");
  //   }
  // };

  return (
    <>
      {isLoading && (
        <div className="container col-2 z-1">
          <img src={loadingGif} alt="Loading" width = "100"/>
        </div>
      )}
      <br />

      {/* <Card>
        <div className="flex justify-between items-center mb-3"> 
      <h3>Scada Master Data</h3>
          <Card>
           
            <button
              className="btn btn-sm btn-success"
              onClick={() => downloadAllCSV()}
              disabled={isLoading}
            >
              Download(.csv)
            </button> &emsp;
            <button
              className="btn btn-sm btn-success"
              onClick={() => downloadAllExcel()}
              disabled={isLoading}
            >
              Download(.xlsx)
            </button>
          </Card> */}
        <Card>
            <ScadaFile></ScadaFile>
          </Card>
      <Card>
          <TableBS data={records} maxHeight="600px" searchable={true} sortable={true} iseditable={true} />
      </Card>
         
        {/* </div> */}
      {/* </Card> */}

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setPage((p) => p - 1)}
          disabled={page <= 1 || isLoading}
        >
          Previous
        </button>  &emsp;
        <span>
          Page {page} of {totalPages}
        </span>  &emsp;
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= totalPages || isLoading}
        >
          Next
        </button>
      </div>
    </>
  );
}

export default ScadaPoints;
