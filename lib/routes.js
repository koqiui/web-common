'use strict';exports.__esModule = true;exports.







add = add;exports.





all = all;exports.



clear = clear; /**
                * Created by koqiui on 2017-04-09.
                */var moduleName = exports.moduleName = 'Routes'; //
var __routeMaps = [];function add() {for (var _len = arguments.length, routeMaps = Array(_len), _key = 0; _key < _len; _key++) {routeMaps[_key] = arguments[_key];}for (var i = 0; i < routeMaps.length; i++) {__routeMaps.push(routeMaps[i]);}}function all() {return __routeMaps;}function clear() {__routeMaps.length = 0;}exports.default =
{
    moduleName: moduleName };