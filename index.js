import Poetry from 'poetry';
import Async from 'async';

import {
    queueHandler,
    last
} from './do.js';

var q = Async.queue( queueHandler );

// Add new measurements to the queue
Poetry.on( 'insert:measurements', {}, msg => {
    if ( Array.isArray( msg ) ) {
        msg.forEach( m => q.push( m, () => {} ) );
    } else {
        q.push( msg, () => {} );
    }
} );

// Add new measurements to the queue
Poetry.on( 'save:measurements', {}, msg => {
    if ( Array.isArray( msg ) ) {
        msg.forEach( m => q.push( m, () => {} ) );
    } else {
        q.push( msg, () => {} );
    }
} );

// Add new soap measurements to the queue
Poetry.on( 'update:soapmeasurement', {}, msg => {
    if ( Array.isArray( msg ) ) {
        msg.forEach( m => q.push( m, () => {} ) );
    } else {
        q.push( msg, () => {} );
    }
} );

// Update the last measurements in a device
Poetry.on( 'last:measurements', {}, last );

require( './Cron/noTeamMeasurements.js' );
require( './Cron/testClock.js' );
