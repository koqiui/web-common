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
/**
 * 判断事件是否来自于基准元素或其内部元素
 * @param {Object} evnt 事件对象
 * @param {Object} checkEl 将要判断的基准元素
 * @param {Object} excludeSelf 是否排除基准元素自身
 */
function isEventFromWithin(evnt, checkEl, excludeSelf) {
    var checkEl = $id(checkEl);
    if(checkEl.length < 1) {
        return false;
    }
    //
    excludeSelf = excludeSelf === true;
    if(excludeSelf) {
        var isChild = checkEl.is(function () {
            return $.contains(this, evnt.target);
        });
        if(isChild) {
            return true;
        }
    } else {
        var isSelfOrChild = checkEl.is(function () {
            return this == evnt.target || $.contains(this, evnt.target);
        });
        if(isSelfOrChild) {
            return true;
        }
    }
    //
    return false;
}

//-------------------------------------------
// 借用某一个dom节点
function borrowOrReturnDomNode(targetNode, toBorrow) {
    var jqTarget = $id(targetNode);
    if(jqTarget.length !== 1) {
        return;
    }
    targetNode = jqTarget.get(0);
    if(jqTarget.data("originalParent") == null) {
        jqTarget.data("originalParent", targetNode.parentNode);
    }
    var orignalParent = jqTarget.data("originalParent");
    if(toBorrow == true) {
        if(orignalParent == targetNode.parentNode) {
            targetNode = targetNode.parentNode.removeChild(targetNode);
        }
    } else {
        if(orignalParent != targetNode.parentNode) {
            targetNode = targetNode.parentNode.removeChild(targetNode);
            orignalParent.appendChild(targetNode);
        }
    }
    return targetNode;
}

// 显示图片原图查看box
function showImageViewBox(imgSrc) {
    if (!$.colorbox) {
        utils.setPageUrl(imgSrc, '_blank');
        return;
    }
    var imgHtml = '<img src="{0}"  />'.format(imgSrc);
    var maxWidth = $(window).width() - 40;
    var maxHeight = $(window).height() - 40;
    $.colorbox({
        html : imgHtml,
        maxWidth : maxWidth,
        maxHeight : maxHeight
    });
}

// 隐藏的表单
function HiddenFormCoreFn() {
    var _formDom = null;
    var _formId = "form-" + utils.genUniqueStr();
    var _formName = null;
    var _fromMethod = "post";
    var _formTarget = "_self";
    var _formAction = "";
    var _formVisible = false;
    var _formFields = {};
    //
    this.clear = function () {
        _formFields = {};
        //
        if(_formDom != null) {
            $(_formDom).empty();
        }
    };
    //
    this.id = function (id) {
        if(typeof id == "undefined") {
            return _formId;
        } else {
            _formId = id;
            if(_formName == null) {
                _formName = _formId;
            }
            return this;
        }
    };
    this.name = function (name) {
        if(typeof name == "undefined") {
            return _formName;
        } else {
            _formName = name;
            return this;
        }
    };
    this.method = function (method) {
        if(typeof method == "undefined") {
            return _fromMethod;
        } else {
            _fromMethod = method;
            return this;
        }
    };
    this.target = function (target) {
        if(typeof target == "undefined") {
            return _formTarget;
        } else {
            _formTarget = target;
            return this;
        }
    };
    this.action = function (action) {
        if(typeof action == "undefined") {
            return _formAction;
        } else {
            _formAction = action;
            return this;
        }
    };
    this.field = function (name, value, type) {
        if(value == null) {
            return;
        }
        var fieldInfo = {
            name: name,
            value: value,
            type: type || "text"
        };
        if(fieldInfo.type == "radio") {
            var raw = fieldInfo.value;
            var tmp = null;
            if(utils.isPlainObject(raw)) {
                tmp = {
                    value: raw.value,
                    text: raw.text || raw.value
                };
            } else {
                tmp = {
                    value: raw,
                    text: raw
                };
            }
            fieldInfo.value = tmp;
        } else if(fieldInfo.type == "checkbox") {
            var raw = fieldInfo.value;
            var tmp = [];
            if(utils.isArray(raw)) {
                var raws = raw;
                for(var i = 0; i < raws.length; i++) {
                    raw = raws[i];
                    if(utils.isPlainObject(raw)) {
                        tmp.add({
                            value: raw.value,
                            text: raw.text || raw.value
                        });
                    } else {
                        tmp.add({
                            value: raw,
                            text: raw
                        });
                    }
                }
            } else {
                if(utils.isPlainObject(raw)) {
                    tmp.add({
                        value: raw.value,
                        text: raw.text || raw.value
                    });
                } else {
                    tmp.add({
                        value: raw,
                        text: raw
                    });
                }
            }
            fieldInfo.value = tmp;
        }
        console.log(fieldInfo);
        _formFields[name] = fieldInfo;
        return this;
    };
    this.visible = function (visible) {
        if(typeof visible == "undefined") {
            return _formVisible;
        } else {
            _formVisible = visible;
            if(_formDom != null) {
                _formDom.style.display = _formVisible ? "" : "none";
            }
            return this;
        }
    };
    this.submit = function (beforeCallback) {
        if(_formDom == null) {
            _formDom = document.getElementById(_formId);
            if(_formDom == null) {
                _formDom = document.createElement("FORM");
                document.body.appendChild(_formDom);
            }
        }
        _formDom.id = _formId;
        _formDom.name = _formName || _formId;
        _formDom.method = _fromMethod;
        _formDom.enctype = "application/x-www-form-urlencoded";
        _formDom.target = _formTarget;
        _formDom.action = _formAction;
        _formDom.style.display = _formVisible ? "" : "none";
        //
        $(_formDom).empty();
        //
        var jqForm = $(_formDom);
        for(var fieldName in _formFields) {
            var fieldInfo = _formFields[fieldName];
            var fieldHtml = "";
            if(fieldInfo.type == "radio") {
                fieldHtml = '<input name="{name}" type="{type}" value="{value.value}" checked="checked" /><label>{value.text}</label>'.format(fieldInfo);
            } else if(fieldInfo.type == "checkbox") {
                var values = fieldInfo.value;
                for(var i = 0; i < values.length; i++) {
                    var fieldInfoX = {
                        name: fieldInfo.name,
                        value: values[i],
                        type: fieldInfo.type
                    }
                    fieldHtml += '<input name="{name}" type="{type}" value="{value.value}" checked="checked" /><label>{value.text}</label>'.format(fieldInfoX);
                }
            } else {
                fieldHtml = '<input name="{name}" type="{type}" value="{value}" />'.format(fieldInfo);
            }
            //
            jqForm.append(fieldHtml);
            jqForm.append("<br/>");
        }
        //
        if(typeof beforeCallback == "function") {
            var result = beforeCallback();
            if(result === false) {
                return;
            }
        }
        _formDom.submit();
    };
}

//var _formActionBaseUrl = __ajaxBaseUrl;
var HiddenForm = {
    newOne: function () {
        return new HiddenFormCoreFn();
    }
};

//
module.exports = {
    moduleName: moduleName,
    //
    $: $,
    $id: $id,
    $attr: $attr,
    //
    isEventFromWithin: isEventFromWithin,
    borrowOrReturnDomNode: borrowOrReturnDomNode,
    showImageViewBox : showImageViewBox,
    //
    HiddenForm: HiddenForm
};
