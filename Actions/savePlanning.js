import Poetry from 'poetry';
import Async from 'async';

import {
    Measurements,
    Plannings,
    Devices,
    Dataloggers,
    ObjectId
} from 'poetry/models';

module.exports = function savePlanning( measurement, cb ) {

    if ( !measurement )
        return cb( null, Poetry.log.info( "No measurement" ) );
    if ( !measurement.device )
        return cb( null, Poetry.log.info( "No device" ) );
    if ( !measurement.device.datalogger )
        return cb( null, Poetry.log.info( "No datalogger" ) );


    Async.parallel( {

        device( cb ) {
            Devices.findOne( {
                    _id: measurement.device.id
                } )
                .then( res => cb( null, res ) )
                .catch( cb );
        },

        datalogger( cb ) {
            Dataloggers.findOne( {
                    _id: measurement.device.datalogger.id
                } )
                .then( res => cb( null, res ) )
                .catch( cb );
        },

        lastPlanning( cb ) {
            Plannings.find( {
                    mainAssetType: "devices",
                    mainAsset: measurement.device.id,
                    subAssetType: "dataloggers",
                    subAsset: measurement.device.datalogger.id,
                } )
                .sort( {
                    timestamp: -1
                } )
                .limit( 1 )
                .then( arr => cb( null, arr[ 0 ] ) )
                .catch( cb );
        }

    }, ( err, results ) => {

        if ( !results.device ||
            !results.device.spentTime ||
            !results.datalogger
        ) return cb();

        Poetry.log.info( 'Planning update' );

        let firstSeen = new Date( measurement.timestamp )
            .getTime(),
            lastSeen = new Date( measurement.timestamp )
            .getTime();

        if ( measurement.starttime )
            firstSeen = new Date( measurement.starttime )
            .getTime();

        // If we have an existing planning
        if ( results.lastPlanning ) {
            Poetry.log.silly( 'Previous planning' );

            let interval = results.datalogger.scaninterval * 2000,
                old = {
                    from: new Date( results.lastPlanning.plannedFrom )
                        .getTime(),
                    to: new Date( results.lastPlanning.plannedTo )
                        .getTime()
                };

            // Last is a STAY
            if ( results.lastPlanning.planningType == 'stay' ) {

                Poetry.log.silly( 'Previous planning: STAY' );

                // Recent STAY, update it and DONE
                if ( firstSeen <= ( old.to + interval ) )
                    return Plannings.update( {
                            _id: ObjectId( results.lastPlanning._id )
                        }, {
                            $set: {
                                plannedTo: new Date( lastSeen ),
                                duration: lastSeen - old.from
                            }
                        } )
                        .then( () => cb(), Poetry.log.error );

                // Otherwise, create a TRIP between the old and new
                if ( old.to && old.to != firstSeen )
                    Plannings.insert( {
                        team: results.device.team,
                        mainAssetType: "devices",
                        mainAsset: measurement.device.id,
                        subAssetType: "dataloggers",
                        subAsset: measurement.device.datalogger.id,

                        plannedFrom: new Date( old.to ),
                        plannedTo: new Date( firstSeen ),
                        planningType: 'trip',

                        duration: firstSeen - old.to
                    } )
                    .then( () => {}, Poetry.log.error );

            }

            // Last is a TRIP
            else {

                Poetry.log.silly( 'Previous planning: TRIP' );

                // Close the TRIP
                Plannings.update( {
                        _id: ObjectId( results.lastPlanning._id )
                    }, {
                        $set: {
                            plannedTo: new Date( firstSeen ),
                            duration: firstSeen - old.from
                        }
                    } )
                    .then( () => {}, Poetry.log.error );
            }

        }

        // Open a new STAY
        Plannings.insert( {
                team: results.device.team,
                mainAssetType: "devices",
                mainAsset: measurement.device.id,

                subAssetType: "dataloggers",
                subAsset: measurement.device.datalogger.id,

                plannedFrom: new Date( firstSeen ),
                plannedTo: new Date( lastSeen ),
                planningType: 'stay',

                duration: lastSeen - firstSeen
            } )
            .then( () => cb(), Poetry.log.error );

    } );

};
