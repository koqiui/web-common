'use strict';exports.__esModule = true;exports.StringBuilder = undefined;


var _lodash = require('lodash');var _lodash2 = _interopRequireDefault(_lodash);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}} /**
                                                                                                                                                                                                                                                                                                                                   * Created by koqiui on 2017-04-08.
                                                                                                                                                                                                                                                                                                                                   */var moduleName = 'Utils';
//
var
StringBuilder = exports.StringBuilder = function () {
    function StringBuilder() {_classCallCheck(this, StringBuilder);
        this.value = '';
        //
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}this.append.apply(this, args);
    }StringBuilder.prototype.

    append = function append() {for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {args[_key2] = arguments[_key2];}
        for (var i = 0, c = args.length; i < c; i++) {
            this.value = this.value + args[i];
        }
    };StringBuilder.prototype.

    appendln = function appendln() {for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {args[_key3] = arguments[_key3];}
        this.append.apply(this, args);
        this.append('\n');
    };StringBuilder.prototype.

    prepend = function prepend() {for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {args[_key4] = arguments[_key4];}
        for (var i = 0, c = args.length; i < c; i++) {
            this.value = args[i] + this.value;
        }
    };StringBuilder.prototype.

    clear = function clear() {
        this.value = '';
    };StringBuilder.prototype.

    toString = function toString() {
        return this.value;
    };return StringBuilder;}();


Object.assign(String, {
    builder: function builder() {
        var ret = new StringBuilder();for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {args[_key5] = arguments[_key5];}
        ret.append.apply(ret, args);
        return ret;
    } });exports.default =


{
    moduleName: moduleName,
    //
    StringBuilder: StringBuilder };