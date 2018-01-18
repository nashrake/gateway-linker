import {
    Dataloggers
} from 'poetry/models';

import {
    errorHandler,
    createNewDatalogger
} from '../do.js';

// Check if the datalogger exist in DB, otherwise creates it
module.exports = function linkToDatalogger( data ) {
    return new Promise( ( fulfill, reject ) => {
        Dataloggers.findOne( {
                _id: data.device.datalogger.id
            } )
            .then( dbDatalogger => {
                // The datalogger doesn't exist in the DB
                if ( !dbDatalogger ) {
                    createNewDatalogger( data )
                        .then( fulfill )
                        .catch( errorHandler( reject ) );
                }
                // The datalogger exist in the DB
                else {
                    fulfill( dbDatalogger );
                }
            } )
            .catch( errorHandler( reject ) );
    } );
};
