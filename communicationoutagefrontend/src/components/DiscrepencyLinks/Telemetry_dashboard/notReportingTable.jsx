import React, { useEffect, useState } from 'react';
import { notReportingTableDashboard } from '../../../services/djangoService'


const NotReportingTable  = ({ startMonth, endMonth , systemType ,entityName}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [allTables, setallTables] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const response = await notReportingTableDashboard({
                start_month: startMonth,
                end_month: endMonth,
                system_type: systemType,
                entity_name : entityName
            }); 
            const tableDataList = [];
            for (const [state, data] of Object.entries(response.data)) {
                tableDataList.push({
                    state,
                    notreporting: data
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
                .filter((stateData) => stateData.notreporting.length > 0) // ✅ Only if timeline exist
                .map((stateData, idx) => (
                <div className="col-md-6 mb-4" key={idx}>
                    <h5>{stateData.state} Not Reporting</h5>
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
                            <th>Substation</th>
                            <th>ICCP_IOA/IOA</th>
                            <th>Timeline(*old)</th>
                            <th>Timeline(*new)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {stateData.notreporting.map((item, i) => (
                            <tr key={i}>
                            <td>{item[0]}</td>
                            <td>{item[1]}</td>
                            <td>{item[2]}</td>
                            <td>{item[3]}</td>
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

export default NotReportingTable;
