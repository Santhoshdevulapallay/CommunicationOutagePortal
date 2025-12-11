const { EquipmentOutage } = require("../models/equipmentOutage");
const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;


const getRollingOutageMillisecDB=async function (id, year, month)
{
  const RollingWindowStartDate = new Date(
    year,
    month - 12,
    1
  );
  const RollingWindowEndDate = new Date(year, month, 1);
  console.log(RollingWindowStartDate, RollingWindowEndDate);
  var equipmentOutage = await EquipmentOutage.aggregate([
    {
      $match: {
        equipment: ObjectId(id),
        outageStartDate: {
          $gte: RollingWindowStartDate,
          $lt: RollingWindowEndDate,
        },
      },
    },

    {
      $group: {
        _id: { equipment: id },
        totalMilliSec: {
          $sum: {
            $subtract: ["$outageEndDate", "$outageStartDate"],
          },
        },
      },
    },
  ]);

  if (!equipmentOutage)
    return ''

  if (equipmentOutage.length) {
    console.log(equipmentOutage.length);
  } else {
    equipmentOutage = [
      {
        _id: {
          equipment: id,
        },
        totalMilliSec: 0,
      },
    ];
  }

  return equipmentOutage;
}


const getRollingOutageMillisecDBByType=async function (id, year, month, type)
{
  const RollingWindowStartDate = new Date(
    year,
    month - 12,
    1
  );
  const RollingWindowEndDate = new Date(year, month, 1);
  console.log(RollingWindowStartDate, RollingWindowEndDate);
  var equipmentOutage = await EquipmentOutage.aggregate([
    {
      $match: {
        equipment: ObjectId(id),
        outageStartDate: {
          $gte: RollingWindowStartDate,
          $lt: RollingWindowEndDate,
        },
        outageType: type
      },
    },

    {
      $group: {
        _id: { equipment: id },
        totalMilliSec: {
          $sum: {
            $subtract: ["$outageEndDate", "$outageStartDate"],
          },
        },
      },
    },
  ]);

  if (!equipmentOutage)
    return ''

  if (equipmentOutage.length) {
    console.log(equipmentOutage.length);
  } else {
    equipmentOutage = [
      {
        _id: {
          equipment: id,
        },
        totalMilliSec: 0,
      },
    ];
  }

  return equipmentOutage;
}

const print=function(){
    console.log("print");
}

module.exports={getRollingOutageMillisecDB, getRollingOutageMillisecDBByType, print}
