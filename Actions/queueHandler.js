import Poetry from 'poetry';

import {
    errorHandler,
    linkToDevice,
    linkToDatalogger,
} from '../do.js';

import savePlanning from './savePlanning.js';

module.exports = function queueHandler( measurement, cb ) {

    // We don't care about measurements without device
    if ( !measurement.device || !measurement.device.id ) {
        Poetry.log.silly( 'No device' );
        return cb();
    }

    // Check for datalogger if there is one
    if ( measurement.device.datalogger ) {
        Poetry.log.silly( 'Datalogger detected' );
        linkToDatalogger( measurement )
            .then( resultDatalogger => {
                linkToDevice( measurement, resultDatalogger )
                    .then( m => savePlanning( m, cb ) )
                    .catch( errorHandler( cb ) );
            } )
            .catch( errorHandler( cb ) );
    }
    // Only work with device if there is no datalogger
    else {
        linkToDevice( measurement )
            .then( m => savePlanning( m, cb ) )
            .catch( errorHandler( cb ) );
    }

};
