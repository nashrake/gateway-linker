import Poetry from 'poetry';

import {
    Devices
} from 'poetry/models';

import {
    errorHandler,
    createNewDevice,
    removeMeasurement,
    updateMeasurement
} from '../do.js';

// Check if the device exist in DB, otherwise creates it
module.exports = function linkToDevice( data, dbDatalogger ) {
    return new Promise( ( fulfill, reject ) => {
        Devices.findOne( {
                _id: data.device.id
            } )
            .then( dbDevice => {
                // The device doesn't exist in the DB
                if ( !dbDevice ) {
                    Poetry.log.info( 'Device does not exist yet' );
                    createNewDevice( data, dbDatalogger )
                        .then( ( newDevice ) => {
                            if ( !newDevice )
                                reject( "Device creation return nothing" );
                            // Remove measurement if device isn't active
                            if ( newDevice.status != "active" ) {
                                removeMeasurement( data._id )
                                    .then( fulfill, reject );
                            }
                            // Update things if device is active
                            else {
                                updateMeasurement( data, newDevice, dbDatalogger )
                                    .then( fulfill, reject );
                            }
                        } )
                        .catch( errorHandler( reject ) );
                }
                // The device exist in the DB
                else {
                    // Remove measurement if device isn't active
                    if ( dbDevice.status != "active" ) {
                        removeMeasurement( data._id )
                            .then( fulfill, errorHandler( reject ) );
                    }
                    // Update things if device is active
                    else {
                        updateMeasurement( data, dbDevice, dbDatalogger )
                            .then( fulfill, errorHandler( reject ) );
                    }
                }
            } )
            .catch( errorHandler( reject ) );
    } );
};
