const { User } = require("./models/user");
const { Link } = require("./models/link");
const { Equipment } = require("./models/equipment");
require("./startup/db")();

const mongoose = require("mongoose");
const xlsx = require("xlsx");
const _ = require("lodash");
const bcrypt = require("bcrypt");

const user_data = [
  // { userName: "PGCIL", password: "123456" },
  // { userName: "PGCIL SR 1", password: "123456" },
  // { userName: "PGCIL SR 2", password: "123456" },
  // { userName: "APTRANSCO", password: "123456" },
  // { userName: "KPTCL", password: "123456" },
  // { userName: "KSEBL", password: "123456" },
  // { userName: "TANTRANSCO", password: "123456" },
  // { userName: "TSTRANSCO", password: "123456" },
  // { userName: "PED, Puducherry", password: "123456" },
  // { userName: "SRPC", password: "123456", isAdmin: true },
  // { userName: "CROOM", password: "123456", isOperator: true },
  // { userName: "SRLDC", password: "123456", isSupervisor: true },
  //  { userName: "APTRANSCO", password: "Rest@193", aliasuserName: "APTRANSCO1" },
   // { userName: "PGCIL SR 1", password: "Rest@193", aliasuserName: "PGCIL SR 11" },
    // { userName: "KSEBL", password: "Rest@193", aliasuserName: "KSEBL1" },
    // { userName: "NLCTS2", password: "NLCTS2", aliasuserName: "NLCTS2" },
    // { userName: "NNTPS", password: "NNTPS", aliasuserName: "NNTPS" },
    // { userName: "NLY1E", password: "NLY1E", aliasuserName: "NLY1E" },
    // { userName: "NLY2E", password: "NLY2E", aliasuserName: "NLY2E" },
    // { userName: "SEPC", password: "SEPC@123", aliasuserName: "SEPC" },
    // { userName: "NNTPS", password: "NNTPS", aliasuserName: "NNTPS" },
    // { userName: "Simhadri", password: "Simhadri#$741", aliasuserName: "Simhadri", nominations: [{Name: "Anil P", Mail_Id: "ANILPINNINTI@NTPC.CO.IN"}] },
  // { userName: "TSTPP", password: "TSTPP#$741", aliasuserName: "TSTPP", nominations: [{Name: "Chanakya", Contact_Number: "9403964876", Mail_Id: "VSCGMUKAMALLA@NTPC.CO.IN"}] },
  // { userName: "Kudgi", password: "Kudgi#$741", aliasuserName: "Kudgi", nominations: [{Name: "Trishul", Contact_Number: "7349249767", Mail_Id: "TNWATANE@NTPC.CO.IN"}] },
  //  { userName: "Vallur", password: "Vallur#$741", aliasuserName: "Vallur", nominations: [{Name: "Anupama", Contact_Number: "9425534162", Mail_Id: "ANUPAMAR@NTPC.CO.IN"}] },
  //  { userName: "BHAVINI", password: "BHAVINI#$741", aliasuserName: "BHAVINI", nominations: [{Name: "Ganapathi", Contact_Number: "9445394608", Mail_Id: "ganapathi_bhavini@igcar.gov.in;rramanavasu@igcar.gov.in;balaji_bhavini@igcar.gov.in;puhalendhi_bhavini@igcar.gov.in;crlakshmi_bhavini@igcar.gov.in;prabodh_bhavini@igcar.gov.in;ananth@igcar.gov.in"}] }, 
  // { userName: "KKNPP", password: "KKNPP#$741", aliasuserName: "KKNPP", nominations: [{Name: "Mohan", Contact_Number: "9487439295", Mail_Id: "sadammohan@npcil.co.in"}] },  
  //  { userName: "RMDGM", password: "RMDGM#$741", aliasuserName: "RMDGM", nominations: [{Name: "K Balagopal", Contact_Number: "9493193262", Mail_Id: "KBALAGOPAL@NTPC.CO.IN"}] },   
  // { userName: "SEIL-1", password: "SEIL-1#$741", aliasuserName: "SEIL-1", nominations: [{Name: "Rajesh", Contact_Number: "8978181542", Mail_Id: "yuvaraj.loganathan@seilenergy.com;sceseilp1@seilenergy.com;ramesh.b@seilenergy.com;perumal.jayakrishnan@seilenergy.com;srinivas.bv@seilenergy.com;sanjeevkumar.prasad@seilenergy.com;rajasekhar.sammidi@seilenergy.com;backiyarasu.rajangam@seilenergy.com;jojibabu.mavuri@seilenergy.com"}] },
  //  { userName: "SEIL-2", password: "SEIL-2#$741", aliasuserName: "SEIL-2", nominations: [{Name: "Rajshekar", Contact_Number: "8008400749", Mail_Id: "shamsundar.aswale@seilenergy.com"}] },
  { userName: "SimhaPuri", password: "SimhaPuri#$741", aliasuserName: "SimhaPuri", nominations: [{Name: "Prashant", Contact_Number: "9394653405", Mail_Id: "srinivas.rao@jindalpower.com;harshvardhan@jindalpower.com;sr.reddy@jindalpower.com;dileep.pathak@jindalpower.com;palaparthi.prasanth@jindalpower.com"}] },
   { userName: "MEPL", password: "MEPL#$741", aliasuserName: "MEPL", nominations: [{Name: "Seshagiri Rao", Contact_Number: "9966708282", Mail_Id: "SeshagiriRao.Anantharapu@vedanta.co.in"}] },   
  { userName: "LANCO", password: "LANCO#$741", aliasuserName: "LANCO", nominations: [{Name: "Ramachandar Rao", Contact_Number: "9949906655", Mail_Id: "rao.mr@lancopower.in"}] },  
   { userName: "Orange", password: "Orange#$741", aliasuserName: "Orange", nominations: [{Name: "Balasubramanian", Contact_Number: "9865880013", Mail_Id: "balasubramanian.v@greenkogroup.com"}] },   
  { userName: "Mytrah", password: "Mytrah#$741", aliasuserName: "Mytrah", nominations: [{Name: "Mathanraji", Mail_Id: "mathanraji@jsw.in;arulselvam.d@jsw.in"}] },
   { userName: "Koppal", password: "Koppal#$741", aliasuserName: "Koppal", nominations: [{Name: "Jayant", Contact_Number: "9686666978", Mail_Id: "kntl.ists@renew.com"}] },
  
];

// require("./startup/db")();

// var wb = xlsx.readFile("Book1.xlsx");

// //Links
// const ws = wb.Sheets["Sheet1"];
// var data = xlsx.utils.sheet_to_json(ws);
// var linkData = [];
// for (var i = 0; i < data.length; i++) {
//   if (data[i]["ownership"]) {
//     data[i]["ownership"] = data[i]["ownership"].replace(/\//g, ",");
//     data[i]["ownership"] = data[i]["ownership"].replace("&", ",");
//     data[i]["ownership"] = data[i]["ownership"].replace("and", ",");
//     data[i]["ownership"] = data[i]["ownership"].replace(
//       "PED, Puducherry",
//       "PED_Puducherry"
//     );
//     data[i]["ownership"] = data[i]["ownership"].split(",");
//   } else {
//     data[i]["ownership"] = [];
//   }
//   data[i]["ownership"].push(data[i]["user"].trim());
//   index_ped = data[i]["ownership"].indexOf("PED_Puducherry");
//   if (index_ped >= 0) {
//     data[i]["ownership"][index_ped] = "PED, Puducherry";
//   }
//   if (data[i]["ownership"].indexOf("PGCIL") >= 0) {
//     data[i]["ownership"].push("PGCIL SR 1");
//     data[i]["ownership"].push("PGCIL SR 2");
//   }
//   data[i]["ownership"] = data[i]["ownership"].map((s) => s.trim());
//   data[i]["ownership"] = [...new Set(data[i]["ownership"])];

//   data[i]["user"] = data[i]["user"].trim();
//   data[i]["source"] = data[i]["source"].trim();
//   data[i]["description"] = data[i]["description"].trim();
//   data[i]["destination"] = data[i]["destination"].trim();
//   data[i]["channelRouting"] = data[i]["channelRouting"]
//     ? data[i]["channelRouting"].trim()
//     : data[i]["channelRouting"];

//   linkData.push(data[i]);
// }

// //Equipment
// const ws1 = wb.Sheets["Equipment"];
// var data = xlsx.utils.sheet_to_json(ws1);
// var equipmentData = [];
// for (var i = 0; i < data.length; i++) {
//   if (data[i]["ownership"]) {
//     data[i]["ownership"] = data[i]["ownership"].replace(/\//g, ",");
//     data[i]["ownership"] = data[i]["ownership"].replace("&", ",");
//     data[i]["ownership"] = data[i]["ownership"].replace("and", ",");
//     data[i]["ownership"] = data[i]["ownership"].replace(
//       "PED, Puducherry",
//       "PED_Puducherry"
//     );
//     data[i]["ownership"] = data[i]["ownership"].split(",");
//   } else {
//     data[i]["ownership"] = [];
//   }
//   data[i]["ownership"].push(data[i]["user"]);
//   index_ped = data[i]["ownership"].indexOf("PED_Puducherry");
//   if (index_ped >= 0) {
//     data[i]["ownership"][index_ped] = "PED, Puducherry";
//   }
//   if (data[i]["ownership"].indexOf("PGCIL") >= 0) {
//     data[i]["ownership"].push("PGCIL SR 1");
//     data[i]["ownership"].push("PGCIL SR 2");
//   }
//   data[i]["ownership"] = data[i]["ownership"].map((s) => s.trim());
//   data[i]["ownership"] = [...new Set(data[i]["ownership"])];
//   equipmentData.push(data[i]);
// }

async function insertData() {
  // console.log("in");
  // await User.deleteMany({});
  // console.log(user_data);
  // await Link.deleteMany({});
  // await Equipment.deleteMany({});

  for (let user of user_data) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    const Inserted_User = await new User({
      userName: user.userName,
      aliasuserName: user.aliasuserName,
      password: user.password,
      isAdmin: user.isAdmin,
      isOperator: user.isOperator,
      isSupervisor: user.isSupervisor,
      nominations: user.nominations

    }).save();
    console.log(Inserted_User);
  }
  // for (let link of linkData) {
  //   console.log(link);
  //   const Inserted_link = await new Link(link).save();
  // }
  // for (let equipment of equipmentData) {
  //   console.log(equipment);
  //   const Inserted_equipment = await new Equipment(equipment).save();
  // }

  mongoose.disconnect();

  console.info("Done!");
}

insertData();
