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

var KeyMap = Utils.KeyMap;

describe('KeyMap', function () {
        it('revert', function () {
            var km = new KeyMap().from({
                TRACE: 0,
                DEBUG: 1,
                INFO: 2,
                WARN: 3,
                ERROR: 4
            });

            console.log(km.toJSON());

            var km2 = km.invert();

            console.log(km2.toJSON());

        });
    }
);

describe('forEachTreeNode', function () {
        it('forEachTreeNode', function () {
            var treeData = [{
                id: 1,
                label: '一级 1',
                children: [{
                    id: 4,
                    label: '二级 1-1',
                    departFlag: false,
                    children: [{
                        departFlag: true,
                        id: 9,
                        label: '三级 1-1-1',
                        departFlag: true
                    }, {
                        id: 10,
                        label: '三级 1-1-2',
                        departFlag: true
                    }]
                }]
            }, {
                id: 2,
                label: '一级 2',
                children: [{
                    id: 5,
                    label: '二级 2-1',
                    departFlag: true
                }, {
                    id: 6,
                    label: '二级 2-2'
                }]
            }, {
                id: 3,
                label: '一级 3',
                children: [{
                    id: 7,
                    label: '二级 3-1'
                }, {
                    id: 8,
                    label: '二级 3-2'
                }]
            }];
            console.log(treeData);
            utils.forEachTreeNode(treeData, function (nodeData) {
                var nodeId = nodeData['id'] || null;
                if(nodeId == null) {
                    nodeId = utils.genUniqueStr();
                }
                //
                var departFlag = nodeData['departFlag'] || false;
                if(departFlag) {
                    nodeData['nodeKey'] = 'depart-' + nodeId;
                }
                else {
                    nodeData['nodeKey'] = 'com-' + nodeId;
                }
            }, 'children');
            //
            console.log('---------------------------------');
            console.log(treeData);

        });
    }
);
