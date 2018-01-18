import {
    Measurements,
    ObjectID
} from 'poetry/models';

import {
    errorHandler
} from '../do.js';

// Remove a measurement from the DB
module.exports = function removeMeasurement( id ) {
    return new Promise( ( fulfill, reject ) => {
        Measurements.remove( {
                _id: ObjectID( id )
            } )
            .then( fulfill, errorHandler( reject ) );
    } );
};
