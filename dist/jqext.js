/**
 * Created by koqiui on 2017-05-09.
 */
var moduleName = 'Jqext';
//----------------------------------------------
var utils = require('./utils');
var $ = require('jquery');

//$id("abc")  == $("#abc") , $id("a.b.c") == $("[id='a.b.c']")
var __alphaPrefixReg = /^[a-zA-Z0-9_-].*/i;
var __noneAlphaReg = /[^a-zA-Z0-9_-]+/i;
var __classNameReg = /^\.[a-zA-Z0-9_-].*/i;

function $id(selector) {
    if(typeof selector === "string") {
        if(__classNameReg.test(selector)) {
            return $(selector);
        } else if(__alphaPrefixReg.test(selector)) {
            if(__noneAlphaReg.test(selector)) {
                return $('[id="' + selector + '"]');
            } else {
                return $("#" + selector);
            }
        }
    }
    return $(selector);
}

// $attr("a-b", "x.y.z") == $("[a-b='x.y.z']")
// $attr("div[a-b]", "x.y.z") == $("div[a-b='x.y.z']")
// $attr("a-b", "x.y.z" [, arg1, arg2]) == $("[a-b='x.y.z']" [, arg1, arg2])
function $attr(attrName, attrVal) {
    var prefix = "[";
    var suffix = "]";
    if(attrName.indexOf("[") !== -1 && attrName.indexOf("]") !== -1) {
        var xIndex = attrName.indexOf("[");
        var yIndex = attrName.indexOf("]");
        prefix = attrName.substring(0, xIndex + 1);
        suffix = attrName.substring(yIndex);
        attrName = attrName.substring(xIndex + 1, yIndex);
    }
    //
    var newArgs = [prefix + attrName + '="' + attrVal + '"' + suffix];
    if(arguments.length > 2) {
        newArgs = newArgs.concat(Array.prototype.slice.call(arguments, 2));
    }
    return $.apply(window, newArgs);
}

//
module.exports = {
    moduleName: moduleName,
    //
    $: $,
    $id: $id,
    $attr: $attr
};
