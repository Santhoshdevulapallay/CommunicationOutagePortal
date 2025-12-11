import http from "./httpService";
import axios from "axios";

const apiEndpoint = "/application";




export async function FreezeApplication(typeApplication, year, month) {  
    const body ={typeApplication:typeApplication,year: year, month: month}
    return http.post(apiEndpoint + '/freezeStatus', body);

}

export async function getFreezeStatus(typeApplication, year, month) {  
    return http.get(apiEndpoint + `/freezeStatus/${typeApplication}/${year}/${month}`);

}

export async function DownloadApplication(typeApplication, year, month) {  
    var url = "";
        var downloadFileName="";
        if(typeApplication=="COA1"){
            url=`/application/downloadcoa1/${year}/${month}`;
            downloadFileName="COA1.xlsx";
        }
        else if(typeApplication=="COD1"){
            url=`/application/downloadcod1/${year}/${month}`
            downloadFileName="COD1.xlsx";
        }
        else if(typeApplication=="COD3"){
            url=`/application/downloadcod3/${year}/${month}`
            downloadFileName="COD3.xlsx";
        }
        else if(typeApplication=="COD2"){
            url=`/application/downloadcod2/${year}/${month}`
            downloadFileName="COD2.xlsx";
        }
        else if(typeApplication=="COA2"){
            url=`/application/downloadcoa2/${year}/${month}`;
            downloadFileName="COA2.xlsx";
        }
        else if(typeApplication=="COD4"){
            url=`/application/downloadcod4/${year}/${month}`
            downloadFileName="COD4.xlsx";
        }
        else if (typeApplication == "MonthSummary") {
            month= month-1
            url=`/application/downloadoutageSummary/${year}/${month}`
            downloadFileName="MonthSummary.xlsx";
        }

       await axios({
            method: 'get',
            url: url,
            responseType: 'blob'
          })
        
        .then((response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', downloadFileName);
            document.body.appendChild(link);
            link.click();
        })
            .catch((error) => console.log(error));
    

}