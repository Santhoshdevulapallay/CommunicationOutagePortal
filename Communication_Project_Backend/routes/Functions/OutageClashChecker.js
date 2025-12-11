const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;
const { LinkOutage } = require("../../models/llinkOutage");
const { EquipmentOutage } = require("../../models/equipmentOutage");




const checkLinkOutageTimeClash = async function (linkOutage) {
  // console.log("in check");
  // console.log(linkOutage);
  // var month=((new Date(linkOutage.outageStartDate)).toLocaleString('default', { month: 'numeric' }));
  // var year=((new Date(linkOutage.outageStartDate)).toLocaleString('default', { year: 'numeric' }));

  // var cod1_startDate = new Date(year, month-1, 1);
  // var cod1_endDate = new Date(
  //   year,
  //   month,
  //   1
  // );
  // console.log("in check", cod1_startDate, cod1_endDate);
  const outageStatus = await LinkOutage.find({deleteStatus: 0, _id:{$ne: linkOutage._id},link:{$eq: linkOutage.link}})
  .or(
    [
      {
        $and: [
          {
            outageStartDate: {
              $lte: linkOutage.outageStartDate,
            },
            
          },
          {
            outageEndDate: {
              $gte: linkOutage.outageStartDate
            }
          }
        ]
      },
      {
        $and: [
          {
            outageStartDate: {
              $lte: linkOutage.outageEndDate,
            },
          },
          {
            outageEndDate: {
              $gte: linkOutage.outageEndDate
            }
          }
        ]
      },
      {
        $and: [
          {
            outageStartDate: {
              $gte: linkOutage.outageStartDate,
            },
          },
          {
            outageEndDate: {
              $lte: linkOutage.outageEndDate
            }
          }
        ]
      }
    ]

  )
  console.log(outageStatus);
  if(outageStatus.length>0)
  {
    console.log("Found");
    return "Found";
  }
  else
  {
    console.log("Not Found");
    return "Not Found";
  }

};

const checkEquipmentOutageTimeClash = async function (equipmentOutage) {
    console.log("ok")
    const outageStatus = await EquipmentOutage.find({deleteStatus: 0, equipment:{$eq: equipmentOutage.equipment}, _id:{$ne: equipmentOutage._id}  })
    .or(
      [
        {
          $and: [
            {
              outageStartDate: {
                $lte: equipmentOutage.outageStartDate,
              },
              
            },
            {
              outageEndDate: {
                $gte: equipmentOutage.outageStartDate
              }
            }
          ]
        },
        {
          $and: [
            {
              outageStartDate: {
                $lte: equipmentOutage.outageEndDate,
              },
            },
            {
              outageEndDate: {
                $gte: equipmentOutage.outageEndDate
              }
            }
          ]
        },
        {
          $and: [
            {
              outageStartDate: {
                $gte: equipmentOutage.outageStartDate,
              },
            },
            {
              outageEndDate: {
                $lte: equipmentOutage.outageEndDate
              }
            }
          ]
        }
      ]
  
    )
    // console.log(outageStatus);
    if(outageStatus.length>0)
    {
    //   console.log("Found");
      return "Found";
    }
    else
    {
    //   console.log("Not Found");
      return "Not Found";
    }
  
  };

  



module.exports = {
  checkLinkOutageTimeClash,
  checkEquipmentOutageTimeClash,
};
