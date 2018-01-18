import Poetry from 'poetry';
import {
    Measurements,
    ObjectID
  } from 'poetry/models';

import Async from 'async';

import qHandler from '../Actions/queueHandler.js';

Poetry.log.debug("Cron")

const MINUTES = 5
//var next = 10

// test 2017/10/14

setInterval( 

/**
 * Search for measurements:
 * - without device.team, 
 * - timestamp >= 2017/10/9
 * - ordered by timestamp
 */
function noTeamMeasurements(){

  let startFrom = new Date(2017, 9, 9);
  startFrom.setHours(0,0,0,0)

  /*let endAt = new Date(startFrom);
  endAt.setHours(23,59,59,999)*/

  /*if(next < 0)
    next = 10*/

  //startFrom.setDate(startFrom.getDate() - next)

  Measurements.find({
    "device.team": {
      $exists: false
    },
    timestamp: {
      $gte: startFrom
    }
  })
  .sort({
    timestamp: 1
  })
  .then(
    ms => {
      Poetry.log.debug(ms.length)
      if(!ms.length){
        Poetry.log.debug("No measurements")
        //next--;
        return;
      }
      let time = 0;
      Async.forEach(ms, (m, cb) => {
        time++
        setTimeout( () => {
          Poetry.log.info("Re-treat Measurement _id", JSON.stringify(m._id))
          qHandler(m, (err) => {
            if(err){
              Poetry.log.error(err)
            }
          })
          cb()
        }, 500 + (250 * time))
      }, 
      err => {

      })
    })
  .catch(Poetry.log.error)
}, 
MINUTES * 60 * 1000)