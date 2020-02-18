/**
 * Created by koqiui on 2017-04-09.
 */
var expect = require('chai').expect;
//

var Store = require('../dist/index').Store;

console.log(JSON.stringify(Store));

describe('store', function () {
        it('set', function () {
            Store.set('aaaa', 555);
            expect(Store.get('aaaa')).to.equal(555);
        });

        it('set 2', function () {
            Store.set('c', 'koqiui');
            expect(Store.get('c')).to.equal('koqiui');
        });
    }
);
