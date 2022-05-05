/**
 * Created by koqiui on 2017-04-09.
 */
var expect = require('chai').expect;
//

var Ajax = require('../dist/ajax');

console.log(JSON.stringify(Ajax));

var baseUrl = 'http://jsonplaceholder.typicode.com';

Ajax.baseUrl(baseUrl);

describe('default ajax', function () {

        it('not null', function () {
            expect(Ajax).to.exist;
        });

        it('get user', function (done) {
            Ajax.debug(true);
            //
            var ajax = Ajax.get('/users/1');
            ajax.header({
                'x-user': 'koqiui'
            });
            ajax.done(function (result) {
                console.log(result);
                done();
            })
            ajax.fail(function (error) {
                console.log(error);
            });
            ajax.go();
        });

        it('get users', function (done) {
            var ajax = Ajax.get('/users');
            ajax.done(function (result) {
                console.log(result);
                done();
            })
            ajax.fail(function (error) {
                console.log(error);
            });
            ajax.go();
        });
    }
);


