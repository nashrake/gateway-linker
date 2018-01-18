import Poetry from 'poetry';

import {
    Devices
} from 'poetry/models';

import {
    errorHandler
} from '../do.js';

// Create a new device in the DB
module.exports = function createNewDevice( data, datalogger ) {
    return new Promise( ( fulfill, reject ) => {
        let device = data.device;
        let newDevice = {
            _id: device.id,
            name: device.name,
            status: "new",
            tags: [],
            timeout: 0,
            notes: "",
            timestamp: new Date( data.timestamp )
        };

        if ( !newDevice.name )
            newDevice.name = newDevice._id;

        // If the device has a datalogger
        if ( datalogger ) {
            newDevice.datalogger = {
                id: datalogger._id,
                team: datalogger.team,
                type: datalogger.type
            };
            newDevice.status = datalogger.status;
            newDevice.team = datalogger.team;
            newDevice.type = data.device.type;
            newDevice.tags = datalogger.tags || [];
            let newtag = 'dataloggers:' + datalogger._id;
            if ( !~newDevice.tags.indexOf( 'dataloggers:' + datalogger._id ) )
                newDevice.tags.push( newtag );
        }

        // Base tags
        newDevice.tags.push( 'devices:' + newDevice._id );

        if ( data.network ) {
            newDevice.network = {
                name: data.network.name,
                protocol: data.network.protocol,
                signal: data.network.signal
            };

            if ( data.network.antenna )
                newDevice.network.antenna = data.network.antenna.id;
        }

        // Active by default if the device is from an agent
        if ( device.fromAgent ) {
            newDevice.status = "active";
            newDevice.team = device.team;
            newDevice.type = device.type;
        }

        Devices.insert( newDevice )
            .then( () => {
                Poetry.log.info( "New device : ", newDevice._id );
                fulfill( newDevice );
            } )
            .catch( errorHandler( reject ) );
    } );
};
