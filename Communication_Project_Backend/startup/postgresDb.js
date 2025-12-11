const { postgresconOptions } = require("../config/customconfig");
const Pool = require('pg').Pool

let pool;

module.exports = function() {
    if(pool == undefined){
        pool = new Pool(postgresconOptions)
    }
    return pool;
}