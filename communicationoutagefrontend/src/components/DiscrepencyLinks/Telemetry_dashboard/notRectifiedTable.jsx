import React, { useEffect, useState } from 'react';
import { notRectifiedTableDashboard } from '../../../services/djangoService'


const NotRectifiedTable  = ({ startMonth, endMonth , systemType , entityName}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [allTables, setallTables] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const response = await notRectifiedTableDashboard({
                start_month: startMonth,
                end_month: endMonth,
                system_type: systemType,
                entity_name : entityName
            }); 
            
            const tableDataList = [];
            for (const [state, data] of Object.entries(response.data)) {
                tableDataList.push({
                    state,
                    notrectified: data
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
                .filter((stateData) => stateData.notrectified.length > 0) // ✅ Only if timeline exist
                .map((stateData, idx) => (
                <div className="col-md-6 mb-4" key={idx}>
                    <h5>{stateData.state} - Not Rectified</h5>
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
                        </tr>
                        </thead>
                        <tbody>
                        {stateData.notrectified.map((item, i) => (
                            <tr key={i}>
                                <td>{item[0]}</td>
                                <td>{item[1]}</td>
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

export default NotRectifiedTable;
