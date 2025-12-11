import React, { useEffect, useState } from 'react';
import { remarksTimelineTableDashboard } from '../../../services/djangoService'


const RemarksTable  = ({ startMonth, endMonth ,systemType ,entityName}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [allTables, setallTables] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const response = await remarksTimelineTableDashboard({
                start_month: startMonth,
                end_month: endMonth,
                system_type: systemType,
                 entity_name : entityName,
                btnType : 'remarks'
            });  // API returns { AP: [x, y1, y2], TS: [...], ... }
            
            const tableDataList = [];
            for (const [state, data] of Object.entries(response.data)) {
                const labels = data[0]; // remarks
                const values = data[1]; // counts
            
                // Pair remarks with counts for the table
                const remarkDetails = labels.map((label, index) => ({
                    key_label: label,
                    count: values[index]
                }));
            
                tableDataList.push({
                    state,
                    remarks: remarkDetails
                });
            }
            
            setallTables(tableDataList);
            setIsLoading(false);
        };
        
        if (startMonth && endMonth) {
            loadData();
          }
    }, [startMonth, endMonth , systemType ,entityName]);

    if (isLoading) return <p>Loading...</p>;
    return (
        <div className="container">
            <div className="row">
            {allTables
                .filter((stateData) => stateData.remarks.length > 0) // ✅ Only if remarks exist
                .map((stateData, idx) => (
                <div className="col-md-6 mb-4" key={idx}>
                    <h5>{stateData.state}</h5>
                    <div
                    style={{
                        maxHeight: '250px',
                        overflowY: 'auto',
                        border: '1px solid #dee2e6',
                    }}
                    >
                    <table className="table table-bordered table-sm mb-0">
                        <thead
                        className="thead-dark"
                        style={{
                            position: 'sticky',
                            top: 0,
                            backgroundColor: '#343a40',
                            color: '#fff',
                        }}
                        >
                        <tr>
                            <th>Remark</th>
                            <th>Count</th>
                        </tr>
                        </thead>
                        <tbody>
                        {stateData.remarks.map((item, i) => (
                            <tr key={i}>
                            <td>{item.key_label}</td>
                            <td>{item.count}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                </div>
                ))}
            </div>
      </div>
      

    );
};

export default RemarksTable;
