import {
    Devices
} from 'poetry/models';

import {
    errorHandler
} from '../do.js';

import Poetry from 'poetry'

// Update the last measurement in a device
module.exports = function last( message ) {
    let measurements = message.measurements;
    let update = {};

    if ( !measurements )
        return Poetry.log.debug( "[last] No measurements for", JSON.stringify( measurements ) );

    measurements.forEach( ( data ) => {
        if ( !data.timestamp )
            data.timestamp = new Date( message.timestamp );
    } );

    Devices.findOne( {
            _id: message.device.id
        } )
        .then( device => {

            if ( !device ) return Poetry.log.debug( "[last] device not found" );
            if ( !( measurements instanceof Array ) ) return Poetry.log.debug( "[last] !( measurements instanceof Array )" );
            if ( !( device.last instanceof Array ) )
                device.last = [];

            let update = {
                last: [],
                timestamp: new Date( message.timestamp )
            };

            if ( message.network )
                update.network = message.network;

            // New measurements are saved in device.last. If no new measurement, last data stay in device.last
            measurements.forEach( data => {
                let measurementIndex = device.last.findIndex( ( element, key ) => {
                    return ( element.type === data.type && element.id === data.id );
                } );

                let deviceLastMeasurement = device.last[ measurementIndex ];

                if ( !deviceLastMeasurement ) {
                    update.last.push( data );
                } else {
                    if ( ( new Date( data.timestamp ) )
                        .getTime() >= ( new Date( deviceLastMeasurement.timestamp ) )
                        .getTime() ) {
                        update.last.push( data );
                    } else {
                        update.last.push( deviceLastMeasurement );
                    }
                    device.last.splice( measurementIndex, 1 );
                }
            } );

            update.last = update.last.concat( device.last );

            Poetry.log.debug( "[last] Update device" );
            Poetry.log.debug( JSON.stringify( {
                _id: message.device.id
            } ) );

            // Update device
            Devices.findAndModify( {
                    query: {
                        _id: message.device.id
                    },
                    update: {
                        '$set': update
                    }
                } )
                .then( d => {} )
                .catch( errorHandler() );
        } )
        .catch( errorHandler() );
};
