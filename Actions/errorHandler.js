import Poetry from 'poetry';

module.exports = function errorHandler( cb ) {
    return err => {
        Poetry.log.error( err );
        if ( cb ) cb( err );
    };
};
