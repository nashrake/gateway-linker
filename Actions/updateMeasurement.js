import Poetry from 'poetry';

import {
    Measurements,
    ObjectID,
    Debugerrors
} from 'poetry/models';

import {
    errorHandler
} from '../do.js';

// Update the measurement with his device (and datalogger if necessary)
module.exports = function updateMeasurement( data, device, datalogger ) {
    return new Promise( ( fulfill, reject ) => {
        let update = {};
        let $push = {};

        let dataloggerPos;

        let updateDevice = {
            id: device._id,
            team: device.team,
            type: device.type
        };

        if ( device.datalogger ) {
            updateDevice.datalogger = {
                id: device.datalogger.id,
                team: device.datalogger.team,
                type: device.datalogger.type
            };

            if ( datalogger && datalogger.staticPosition && datalogger.staticPosition.lng && datalogger.staticPosition.lat ) {
                dataloggerPos = {
                    lng: datalogger.staticPosition.lng,
                    lat: datalogger.staticPosition.lat
                };
            }
        }

        // let updateNetwork;
        // if ( data.network ) {
        //     updateNetwork = {
        //         name: data.network.name,
        //         protocol: data.network.protocol,
        //         signal: data.network.signal
        //     };
        //
        //     if ( data.network.antenna ) {
        //         updateNetwork.antenna = data.network.antenna.id;
        //     }
        // }

        // if no network but datalogger static position
        if ( !data.network && dataloggerPos ) {
            if ( Array.isArray( data.measurements ) &&
                !data.measurements.some( m => {
                    return m.type == "position" && m.id == "antenna";
                } ) ) {
                $push.measurements = {
                    type: "position",
                    id: "antenna",
                    value: dataloggerPos,
                    timestamp: new Date( data.timestamp )
                };
            }
        }

        update.device = updateDevice;

        // if ( updateNetwork )
        //     update.network = updateNetwork;

        Poetry.log.verbose( "query of _id", JSON.stringify( data ) );

        // FORMAT UPDATE REQUEST
        let updateRequest = {
            '$set': update
        };
        if ( Object.keys( $push )
            .length )
            updateRequest.$push = $push;

        Measurements.findAndModify( {
                query: {
                    _id: ObjectID( data._id )
                },
                update: updateRequest,
                new: true
            } )

            .then( result => {

                if ( data.network && data.network.antenna ) {
                    result.antenna = {
                        lng: data.network.antenna.lng,
                        lat: data.network.antenna.lat
                    };
                }
                // if datalogger has a static position
                else if ( dataloggerPos ) {
                    result.antenna = dataloggerPos;
                }

                // If measurements need to be decoded
                if ( !data.measurements && device.type != 'raw' ) {
                    Poetry.emit( 'decode:' + device.type, result );
                }
                // Update last if measurements are already good
                else {
                    if ( !device.last || new Date( device.timestamp ) <= new Date( data.timestamp ) ) {
                        Poetry.emit( 'last:measurements', result );
                    }
                }

                fulfill( data );
            } )
            .catch( errorHandler( reject ) );
    } );
};
