import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { plotlyDataDashboards } from '../../../services/djangoService'

const MyDynamicPlot  = ({ startMonth, endMonth , systemType ,entityName}) => {
    const [allPlots, setAllPlots] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
   
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const response = await plotlyDataDashboards({
                start_month: startMonth,
                end_month: endMonth,
                system_type: systemType,
                entity_name : entityName
            });  // API returns { AP: [x, y1, y2], TS: [...], ... }
            
            const plotList = [];
    
            for (const [state, data] of Object.entries(response.data)) {
                const months = data[0];
                // const totalPoints = data[1];
                const telemetryFailure = data[2];
                const oltcPoints = data[3];
                const highlyIntermittent = data[4];
                const intermittent = data[5];
        
                plotList.push({
                    state,
                    data: [
                        // {
                        //   x: months,
                        //   y: totalPoints,
                        //   type: "bar",
                        //   name: "Total No of Analog Points",
                        //   marker: { color: "rgba(23, 59, 112, 0.86)" },
                        //   yaxis: "y1",
                        // },
                        {
                          x: months,
                          y: telemetryFailure,
                          type: "bar",
                          name: "Telemetry Failure",
                          marker: { color: "rgba(223, 18, 18, 0.7)" },
                          yaxis: "y1",
                        },
                        {
                          x: months,
                          y: oltcPoints,
                          type: "bar",
                          name: "No of OLTC",
                          marker: { color: "rgba(53, 122, 13, 0.7)" },
                          yaxis: "y1",
                        },
                        {
                          x: months,
                          y: highlyIntermittent,
                          type: "bar",
                          name: "Highly Intermittent",
                          marker: { color: "rgba(12, 174, 196, 0.7)" },
                          yaxis: "y1",
                        },
                        {
                          x: months,
                          y: intermittent,
                          type: "bar",
                          name: "Intermittent",
                          marker: { color: "rgba(10, 34, 141, 0.7)" },
                          yaxis: "y1",
                        },
                      ],
                    });
            }
            setAllPlots(plotList);
            setIsLoading(false);
        };
        
        if (startMonth && endMonth) {
            loadData();
          }
    }, [startMonth, endMonth , systemType , entityName]);

    if (isLoading) return <p>Loading...</p>;
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {allPlots.map((plot, index) => (
        <div
            key={index}
            style={{
            flex: "1 1 calc(50% - 20px)", // Half width with spacing
            minWidth: "400px",
            }}>
            <Plot
                data={plot.data.map((trace) => ({
                    ...trace,
                    type: "bar", // Ensure type is 'bar'
                    text: trace.y, // Show y values on the bars
                    textposition: "auto", // Automatically position labels
                    cliponaxis: false,
                }))}
                layout={{
                    barmode: "stack",
                    title: { text: plot.state, x: 0.5, font: { size: 20 } },
                    xaxis: { title: "Month" },
                    yaxis: {
                    title: "Total No of Analog Points",
                    side: "left",
                    showgrid: false,
                    },
                    yaxis2: {
                    title: "Telemetry Failure",
                    overlaying: "y",
                    side: "right",
                    },
                    legend: { orientation: "h", x: 0.3, y: -0.3 },
                    margin: { t: 40, b: 40, r: 40, l: 40 },
                }}
                style={{ width: "100%", height: "350px" }}
            />
        </div>
        ))}
    </div>
    );
};

export default MyDynamicPlot;
