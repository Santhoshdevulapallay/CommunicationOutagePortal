const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;
const { LinkOutage } = require("../../models/llinkOutage");
const { EquipmentOutage } = require("../../models/equipmentOutage");
const winston = require("winston");


const freezeUnknownLinkOutages = async function (cod1_startDate, cod1_endDate) {
    try{
        availedOutages = await LinkOutage.find({ deleteStatus: 0 })
        .or([
        {
            $and: [
            {
                approvedStartDate: {
                $gte: cod1_startDate,
                $lt: cod1_endDate,
                },
            },
            { Approvalstatus: "Approved" },
            ],
        },
        {
            $and: [
            {
                proposedStartDate: {
                $gte: cod1_startDate,
                $lt: cod1_endDate,
                },
            },
            { outageType: "Emergency" },
            ],
        },
        {
            $and: [
            {
                outageStartDate: {
                $gte: cod1_startDate,
                $lt: cod1_endDate,
                },
            },
            { outageType: "Forced" },
            ],
        },
        ])
        .populate("link")
        .populate("requestingAgency");
        // winston.info("came to point");
        // console.log(availedOutages);
        for(var i=0; i<availedOutages.length;i++){
            if(availedOutages[i].outageType=='Planned' && (availedOutages[i].outageStartDate==undefined || availedOutages[i].outageStartDate==null) && availedOutages[i].availedStatus!=2){
                console.log("Into");
                console.log(i, availedOutages[i].outageStartDate, availedOutages[i].approvedStartDate);
                availedOutages[i].outageStartDate = availedOutages[i].approvedStartDate
                availedOutages[i].outageEndDate = availedOutages[i].approvedEndDate
                availedOutages[i].save();
                // winston.info( availedOutages[i].outageStartDate);
            }
        }
        return true;
    }
    catch(err){
        console.log(err)
        return false;
    }
}

const freezeUnknownEquipmentOutages = async function (cod1_startDate, cod1_endDate) {
    try{
        availedOutages = await EquipmentOutage.find({ deleteStatus: 0 })
        .or([
        {
            $and: [
            { Approvalstatus: "Approved" },
            {
                approvedStartDate: {
                $gte: cod2_startDate,
                $lt: cod2_endDate,
                },
            },
            ],
        },
        {
            $and: [
            { outageType: "Emergency" },
            {
                proposedStartDate: {
                $gte: cod2_startDate,
                $lt: cod2_endDate,
                },
            },
            ],
        },
        {
            $and: [
            { outageType: "Forced" },
            {
                outageStartDate: {
                $gte: cod2_startDate,
                $lt: cod2_endDate,
                },
            },
            ],
        },
        ])
        .populate("equipment")
        .populate("linksAffected")
        .populate("requestingAgency");
        // winston.info("came to point");
        // console.log(availedOutages);
        for(var i=0; i<availedOutages.length;i++){
            if(availedOutages[i].outageType=='Planned' && (availedOutages[i].outageStartDate==undefined || availedOutages[i].outageStartDate==null) && availedOutages[i].availedStatus!=2){
                // console.log("Into");
                // console.log(i, availedOutages[i].outageStartDate, availedOutages[i].approvedStartDate);
                availedOutages[i].outageStartDate = availedOutages[i].approvedStartDate
                availedOutages[i].outageEndDate = availedOutages[i].approvedEndDate
                availedOutages[i].save();
                // winston.info( availedOutages[i].outageStartDate);
            }
        }
        return true;
    }
    catch(err){
        console.log(err)
        return false;
    }
}


module.exports = {
    freezeUnknownLinkOutages,
    freezeUnknownEquipmentOutages,
  };
  