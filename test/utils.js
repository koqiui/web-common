/**
 * Created by koqiui on 2017-04-09.
 */
var expect = require('chai').expect;
//

var Utils = require('../dist/utils');

console.log(JSON.stringify(Utils));

var StringBuilder = Utils.StringBuilder;

describe('utils>[class] StringBuilder', function () {
        it('moduleName', function () {
            expect(Utils.moduleName).to.equal('Utils');
        });

        it('ctor', function () {
            var sb = new StringBuilder();
            expect(sb.value).to.equal('');
        });

        it('ctor + args', function () {
            var sb = new StringBuilder('x', ' ', 'y');
            expect(sb.value).to.equal('x y');
        });

        it('append', function () {
            var sb = new StringBuilder();
            sb.append('x');
            sb.append(' ');
            sb.append('y');
            expect(sb.value).to.equal('x y');
        });

        it('prepend', function () {
            var sb = new StringBuilder();
            sb.prepend('x');
            sb.prepend(' ');
            sb.prepend('y');
            expect(sb.value).to.equal('y x');
        });

        it('clear', function () {
            var sb = new StringBuilder('x', ' ', 'y');
            expect(sb.value).to.equal('x y');
            sb.clear();
            expect(sb.value).to.equal('');
        });
    }
);

describe('String.[method] builder', function () {
        it('ctor', function () {
            var sb = String.builder();
            console.log(sb);
            expect(sb.value).to.equal('');
        });

        it('ctor + args', function () {
            var sb = String.builder('x', ' ', 'y');
            expect(sb.value).to.equal('x y');
        });

        it('append', function () {
            var sb = String.builder();
            sb.append('x');
            sb.append(' ');
            sb.append('y');
            expect(sb.value).to.equal('x y');
        });

        it('prepend', function () {
            var sb = String.builder();
            sb.prepend('x');
            sb.prepend(' ');
            sb.prepend('y');
            expect(sb.value).to.equal('y x');
        });

        it('clear', function () {
            var sb = String.builder('x', ' ', 'y');
            expect(sb.value).to.equal('x y');
            sb.clear();
            expect(sb.value).to.equal('');
        });
    }
);








