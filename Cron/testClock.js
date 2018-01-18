import Poetry from 'poetry';

import {
    Measurements
} from 'poetry/models';

// Execute every minute
setInterval( function testClock() {

    let now = new Date(),
        measurement = new Measurement( 'testClock', now );

    measurement.add( 'hour', now.getUTCHours() );
    measurement.add( 'minutes', now.getMinutes() );
    measurement.add( 'seconds', now.getSeconds() );
    measurement.add( 'constant', true );

    measurement.save()
        .then( meas => {
            Poetry.emit( 'update:soapmeasurement', meas );
            Poetry.log.silly( 'TestClock emitted' );
        }, Poetry.log.error );

    Measurement.cleanOlds( 'testClock' )
        .then( () => {
            Poetry.log.silly( 'TestClock cleaned' );
        }, Poetry.log.error );

}, 0xea60 );

class Measurement {

    constructor( device, timestamp ) {
        this.timestamp = timestamp || new Date();
        this.device = {
            id: device
        };
        this.measurements = [];
    }

    add( type, value, unit ) {

        let meas = {
            type: type,
            value: value
        };
        if ( unit ) meas.unit = unit;

        this.measurements.push( meas );

    }

    toObject() {

        return {
            timestamp: this.timestamp,
            device: this.device,
            measurements: this.measurements
        };

    }

    save() {

        return Measurements.update( {
            'device.id': this.device.id,
            'timestamp': this.timestamp
        }, {
            $set: this.toObject()
        }, {
            upsert: true
        } );

    }

    static cleanOlds( device ) {

        let weekAgo = new Date();
        weekAgo.setDate( weekAgo.getDate() - 7 );

        return Measurements.remove( {
            'device.id': device,
            'timestamp': {
                $lte: weekAgo
            }
        }, {
            multi: true
        } );

    }

}
