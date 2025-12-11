const { LinkOutage } = require("../models/llinkOutage");
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
  // console.log(RollingWindowStartDate, RollingWindowEndDate);
  var linkOutage = await LinkOutage.aggregate([
    {
      $match: {
        link: ObjectId(id),
        outageStartDate: {
          $gte: RollingWindowStartDate,
          $lt: RollingWindowEndDate,
        },
      },
    },

    {
      $group: {
        _id: { link: id },
        totalMilliSec: {
          $sum: {
            $subtract: ["$outageEndDate", "$outageStartDate"],
          },
        },
      },
    },
  ]);

  if (!linkOutage)
    return ''

  if (linkOutage.length) {
    console.log(linkOutage.length);
  } else {
    linkOutage = [
      {
        _id: {
          link: id,
        },
        totalMilliSec: 0,
      },
    ];
  }

  return linkOutage;
}

const getRollingOutageMillisecDBByType=async function (id, year, month, type)
{
  const RollingWindowStartDate = new Date(
    year,
    month - 12,
    1
  );
  const RollingWindowEndDate = new Date(year, month, 1);
  // console.log(RollingWindowStartDate, RollingWindowEndDate);
  var linkOutage = await LinkOutage.aggregate([
    {
      $match: {
        link: ObjectId(id),
        outageStartDate: {
          $gte: RollingWindowStartDate,
          $lt: RollingWindowEndDate,
        },
        outageType: type
      },
    },

    {
      $group: {
        _id: { link: id },
        totalMilliSec: {
          $sum: {
            $subtract: ["$outageEndDate", "$outageStartDate"],
          },
        },
      },
    },
  ]);

  if (!linkOutage)
    return ''

  if (linkOutage.length) {
    console.log(linkOutage.length);
  } else {
    linkOutage = [
      {
        _id: {
          link: id,
        },
        totalMilliSec: 0,
      },
    ];
  }

  return linkOutage;
}




const print=function(){
    console.log("print");
}

module.exports={getRollingOutageMillisecDB, getRollingOutageMillisecDBByType, print}
