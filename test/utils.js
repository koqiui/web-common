/**
 * Created by koqiui on 2017-04-09.
 */
// 如果需要require src/下的es6模块
require('babel-register');
//
var expect = require('chai').expect;
//

var Utils = require('../lib/utils');

console.log(JSON.stringify(Utils));

var StringBuilder = Utils.StringBuilder;

describe('utils>[class] StringBuilder', function () {
        it('moduleName', function () {
            expect(Utils.moduleName).to.equal('Utils');
        });

        it('ctor', function () {
            var sb = new StringBuilder();
            expect(sb.toString()).to.equal('');
        });

        it('ctor + args', function () {
            var sb = new StringBuilder('x', ' ', 'y');
            expect(sb.toString()).to.equal('x y');
        });

        it('append', function () {
            var sb = new StringBuilder();
            sb.append('x');
            sb.append(' ');
            sb.append('y');
            expect(sb.toString()).to.equal('x y');
        });

        it('prepend', function () {
            var sb = new StringBuilder();
            sb.prepend('x');
            sb.prepend(' ');
            sb.prepend('y');
            expect(sb.toString()).to.equal('y x');
        });

        it('clear', function () {
            var sb = new StringBuilder('x', ' ', 'y');
            expect(sb.toString()).to.equal('x y');
            sb.clear();
            expect(sb.toString()).to.equal('');
        });
    }
);

describe('String.[method] builder', function () {
        it('ctor', function () {
            var sb = String.builder();
            expect(sb.toString()).to.equal('');
        });

        it('ctor + args', function () {
            var sb = String.builder('x', ' ', 'y');
            expect(sb.toString()).to.equal('x y');
        });

        it('append', function () {
            var sb = String.builder();
            sb.append('x');
            sb.append(' ');
            sb.append('y');
            expect(sb.toString()).to.equal('x y');
        });

        it('prepend', function () {
            var sb = String.builder();
            sb.prepend('x');
            sb.prepend(' ');
            sb.prepend('y');
            expect(sb.toString()).to.equal('y x');
        });

        it('clear', function () {
            var sb = String.builder('x', ' ', 'y');
            expect(sb.toString()).to.equal('x y');
            sb.clear();
            expect(sb.toString()).to.equal('');
        });
    }
);








