/**
 * Created by koqiui on 2017-04-09.
 */
var expect = require('chai').expect;
//

var EventBus = require('../dist/eventbus');

console.log(JSON.stringify(EventBus));

describe('event-bus', function () {
        it('moduleName', function () {
            expect(EventBus.__name__).to.equal('EventBus');
        });

        it('init', function () {
            expect(EventBus.get()).not.to.be.null;
        });

        it('default', function () {
            var def = EventBus.get();
            expect(def.name()).to.equal('default');
        });

        it('demo', function () {
            var demo = EventBus.get('demo');
            expect(demo.name()).to.equal('demo');

            var handler = function (event, data, extra) {
                console.log('event name :' + event);
                console.log('event data :' + JSON.stringify(data));
                console.log('extra :' + extra);
            };
            //
            demo.bind('user:added', handler);
            demo.bind('user:added', handler);

            demo.trigger('user:added', {
                name: 'koqiui',
                age: 23
            }, 'xyz');

        });

    }
);
