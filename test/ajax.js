/**
 * Created by koqiui on 2017-04-09.
 */
// 如果需要require src/下的es6模块
require('babel-register');
//
var expect = require('chai').expect;
//

var Ajax = require('../lib/ajax');

console.log(JSON.stringify(Ajax));

describe('ajax', function () {

        it('moduleName', function () {
            expect(Ajax.moduleName).to.equal('Ajax');
        });
    }
);
