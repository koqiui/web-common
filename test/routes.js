/**
 * Created by koqiui on 2017-04-09.
 */
// 如果需要require src/下的es6模块
require('babel-register');
//
var expect = require('chai').expect;
//

var Routes = require('../lib/routes');

console.log(JSON.stringify(Routes));

describe('routes', function () {
        it('moduleName', function () {
            expect(Routes.moduleName).to.equal('Routes');
        });

        it('init', function () {
            expect(Routes.all()).to.be.lengthOf(0);
        });

        it('add 1', function () {
            Routes.add({
                path: "/"
            })
            expect(Routes.all()).to.be.lengthOf(1);
        });

        it('add 2', function () {
            Routes.add({
                path: "/x"
            }, {
                path: "/y"
            })
            expect(Routes.all()).to.be.lengthOf(3);
        });

        it('clear', function () {
            Routes.clear();

            expect(Routes.all()).to.be.lengthOf(0);
        });
    }
);
