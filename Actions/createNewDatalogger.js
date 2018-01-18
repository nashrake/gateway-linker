import Poetry from 'poetry';

import {
    Dataloggers
} from 'poetry/models';

import {
    errorHandler
} from '../do.js';

// Create a new datalogger in the DB
module.exports = function createNewDatalogger( data ) {
    Poetry.log.info( 'Creating datalogger' );
    return new Promise( ( fulfill, reject ) => {
        let datalogger = data.device.datalogger;
        let newDatalogger = {
            _id: datalogger.id,
            name: datalogger.name,
            team: datalogger.team,
            status: "new",
            tags: [],
            type: data.device.type,
            model: datalogger.type,
            ipaddr: datalogger.ipaddr,
            timeout: 0,
            notes: datalogger.notes,
            timestamp: new Date( data.timestamp )
        };

        if ( !newDatalogger.name )
            newDatalogger.name = newDatalogger._id;

        // Active by default if the datalogger is from an agent
        if ( datalogger.fromAgent )
            newDatalogger.status = "active";

        // Base tags
        newDatalogger.tags.push( 'dataloggers:' + newDatalogger._id );

        newDatalogger.notes = newDatalogger.name + ' ' + newDatalogger.notes;

        Dataloggers.insert( newDatalogger )
            .then( () => {
                Poetry.log.info( "New datalogger : ", newDatalogger._id );
                fulfill( newDatalogger );
            } )
            .catch( errorHandler( reject ) );
    } );
};
