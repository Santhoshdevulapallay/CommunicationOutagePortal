import React, { useEffect, useState } from 'react';
import {getRTUMasterList } from '../../../services/djangoService';
import { toast } from "react-toastify";
import loadingGif from '../../../assets/Loading_icon.gif';
import RTUNewStation from './RTUNewStation';
import RTUFile from './RTUFile';
import TableBS from './Table_BS'
import Card from './Card';

function RTUMaster() {

    const [rtuMaster, setrtuMaster] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
   
    useEffect(() => {
        setIsLoading(true);
        const loadData = async () => {
          try {
              const response = await getRTUMasterList();
              
               if (!response.data.status) {
                throw new Error('Failed to fetch RTU data');
                }
                setrtuMaster(response.data.data)
          } catch (error) {
            toast.error(error);
          } finally {
            setIsLoading(false);
          } 
        }
        loadData();
    }, []);
    return (
        <>
          {isLoading && (
              <div className="container col-2 z-1">
                  <img src={loadingGif} alt="Loading" width = "100"/>
              </div>
          )}<br></br>

          <Card>
            <RTUNewStation></RTUNewStation>
          </Card>
          <Card>
            <RTUFile></RTUFile>
          </Card>
          <Card>
          <TableBS data={rtuMaster} maxHeight="500px" searchable={true}
            sortable={true} iseditable={true} />
          </Card>
         
        </>
    )
}



export default RTUMaster;