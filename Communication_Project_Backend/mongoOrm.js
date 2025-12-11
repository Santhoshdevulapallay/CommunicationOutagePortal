const { User } = require("./models/user");
const { Link } = require("./models/link");
const { Equipment } = require("./models/equipment");
require("./startup/db")();

const { LinkOutage, validate } = require("./models/llinkOutage");


const mongoose = require("mongoose");

async function getLinks(){
  x= await (Link.find({}).populate("link"))
  for(var i=0; i<x.length;i++){
    console.log(x[i])
    if(!x[i].linkType || !x[i].pathType){
      continue
    }
    
    try{
      if(["RTU", "ICCP", "DCPC", "PMU", "PDC"].includes(x[i].linkType)){
        x[i].linkTypem = "Data";
        x[i].channelTypem = x[i].linkType;
        try{
          x[i].save()
        }
        catch{

        }
        
      }
      else if(["Voice"].includes(x[i].linkType)){
        x[i].linkTypem = "Voice";
        x[i].channelTypem = x[i].linkType;
        try{
          x[i].save()
        }
        catch{
          
        }
      }
      else if(["TeleProtection", "SPS"].includes(x[i].linkType)){
        x[i].linkTypem = "TeleProtection";
        x[i].channelTypem = x[i].linkType;
        try{
          x[i].save()
        }
        catch{
          
        }
      }
      else if(["VC"].includes(x[i].linkType)){
        x[i].linkTypem = "VC";
        x[i].channelTypem = x[i].linkType;
        try{
          x[i].save()
        }
        catch{
          
        }
      }
    }
    catch(err){
      console.log(err)
    }
    
    // break;
  }
 


}

getLinks()


// var cod1_startDate = new Date(2022, 1, 1);
//   var cod1_endDate = new Date(
//     2022,
//     2,
//     1
//   );

// console.log(cod1_startDate, cod1_endDate)

// async function test() {
//     availedOutages = await LinkOutage.find({ deleteStatus: 0 })
//     .or([
//       {
//         $and: [
//           {
//             approvedStartDate: {
//               $gte: cod1_startDate,
//               $lt: cod1_endDate,
//             },
//           },
//           { Approvalstatus: "Approved" },
//         ],
//       },
//       {
//         $and: [
//           {
//             proposedStartDate: {
//               $gte: cod1_startDate,
//               $lt: cod1_endDate,
//             },
//           },
//           { outageType: "Emergency" },
//         ],
//       },
//       {
//         $and: [
//           {
//             outageStartDate: {
//               $gte: cod1_startDate,
//               $lt: cod1_endDate,
//             },
//           },
//           { outageType: "Forced" },
//         ],
//       },
//     ])
//     .populate("link")
//     .populate("requestingAgency");

//     // console.log(availedOutages);
//     for(var i=0; i<availedOutages.length;i++){
//         // console.log(availedOutages[i].outageType);
//         if(availedOutages[i].outageType=='Planned' && (availedOutages[i].outageStartDate==undefined || availedOutages[i].outageStartDate==null)){
//             console.log(i, availedOutages[i].outageStartDate, availedOutages[i].approvedStartDate);
//         }
//     }
//   }

// test()

  
