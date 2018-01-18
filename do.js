require( 'fs' )
    .readdirSync( './Actions' )
    .forEach( action => {
        module.exports[ action.slice( 0, -3 ) ] = require( './Actions/' + action );
    } );
