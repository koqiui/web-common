/**
 * Created by koqiui on 2017-04-09.
 */
var expect = require('chai').expect;
//

var Routes = require('../dist/routes');

console.log(JSON.stringify(Routes));

describe('routes', function () {
        it('moduleName', function () {
            expect(Routes.__name__).to.equal('Routes');
        });

        it('init', function () {
            expect(Routes.all()).to.be.lengthOf(0);
        });

        it('add 1', function () {
            Routes.add({
                path: "/",
                component: {}
            })
            expect(Routes.all()).to.be.lengthOf(1);
        });

        it('add 2', function () {
            Routes.add({
                path: "/x",
                component: {}
            }, {
                path: "/y",
                component: {
                    name: 'test-comp-1',
                    desc: '测试常规注册组件',
                    //
                    data: {}
                }
            }, {
                name: 'test-comp',
                desc: '测试直接注册组件',
                path: '/y',
                //
                data: {}
            })
            expect(Routes.all()).to.be.lengthOf(3);
        });

        it('clear', function () {
            Routes.clear();

            expect(Routes.all()).to.be.lengthOf(0);
        });
    }
);
