/**
 * Created by koqiui on 2017-04-08.
 */
var moduleName = 'Utils';
//----------------------------------------------

var isInBrowser = (typeof window !== "undefined") && typeof (window.location !== "undefined");

function toStr(obj) {
    return "" + obj;
}

function isNull(obj, strict) {
    strict = strict === true;
    return strict ? obj === null : obj == null;
}

function isInstanceOf(obj, chkClass) {
    return obj != null && obj.constructor === chkClass;
}

function isString(obj) {
    return obj != null && (typeof obj === "string" || obj instanceof String);
}

function isNumber(obj) {
    return obj != null && (typeof obj === "number" || obj instanceof Number);
}

function isNum(obj) {
    return isNumber(obj) && isFinite(obj);
}

function isBoolean(obj) {
    return obj != null && (typeof obj === "boolean" || obj instanceof Boolean);
}

function isFunction(obj) {
    return obj != null && (typeof obj === "function" || obj instanceof Function);
}

function isPrimitive(obj) {
    return obj != null && (isString(obj) || isNumber(obj) || isBoolean(obj));
}

function isDate(obj) {
    return obj != null && Object.prototype.toString.apply(obj) === "[object Date]";
}

function isArray(obj) {
    return obj != null && Object.prototype.toString.apply(obj) === "[object Array]";
}

function isRegExp(obj) {
    return obj != null && Object.prototype.toString.apply(obj) === "[object RegExp]";
}

function isPlainObject(obj, bLooseCheck) {
    if(!obj || Object.prototype.toString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval) {
        return false;
    }

    var hasOwnProperty = Object.prototype.hasOwnProperty;
    //
    if(obj.constructor && !hasOwnProperty.call(obj, "constructor") && !hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
        return false;
    }

    if(bLooseCheck === true) {
        return true;
    } else {
        var key;
        for(key in obj) {
            // just pass
        }
        return key === undefined || hasOwnProperty.call(obj, key);
    }
}

function isEmptyObject(obj, ignorePropertyPrefix) {
    ignorePropertyPrefix = ignorePropertyPrefix || "";
    //
    if(ignorePropertyPrefix) {
        for(var name in obj) {
            if(!name.indexOf(ignorePropertyPrefix) == 0) {
                return false;
            }
        }
    } else {
        for(var name in obj) {
            return false;
        }
    }
    return true;
}

// ------------------------------------------
var ___STRING_LTRIM_REG = /^(\s)+/i;
var ___STRING_RTRIM_REG = /(\s)+$/i;

function trimLeft(str) {
    return str.replace(___STRING_LTRIM_REG, "");
}

function trimRight(str) {
    return str.replace(___STRING_RTRIM_REG, "");
}

function trim(str) {
    return str.replace(___STRING_LTRIM_REG, "").replace(___STRING_RTRIM_REG, "");
}

//
function __strEql(valX, valY) {
    if(valX == null) {
        return valY == null;
    } else if(valY == null) {
        return valX == null;
    } else {
        return toStr(valX) === toStr(valY);
    }
}

function strEql(val /* , chkVal1, chkVal2,... */) {
    var chkCount = arguments.length - 1;
    if(chkCount <= 0) {
        return false;
    }
    var i;
    if(isArray(arguments[1])) {
        var chkArray = arguments[1];
        chkCount = chkArray.length;
        for(i = 0; i < chkCount; i++) {
            if(__strEql(val, chkArray[i])) {
                return true;
            }
        }
    } else {
        chkCount++;
        for(i = 1; i < chkCount; i++) {
            if(__strEql(val, arguments[i])) {
                return true;
            }
        }
    }
    return false;
}

String.prototype.trimLeft = function () {
    return trimLeft(this);
};

String.prototype.trimRight = function () {
    return trimRight(this);
};

String.prototype.trim = function () {
    return trim(this);
};

String.prototype.isEmpty = function () {
    return this === "";
};

String.prototype.isBlank = function () {
    return trim(this) === "";
};

function isNullOrEmpty(chkStr) {
    return chkStr == null || toStr(chkStr).isEmpty();
}

function isNullOrBlank(chkStr) {
    return chkStr == null || toStr(chkStr).isBlank();
}

var isNoE = isNullOrEmpty;
var isNoB = isNullOrBlank;

function replace(srcStr, what, byWhat) {
    if(byWhat == null) {
        byWhat = "";
    }
    var tmpStr = srcStr.split(what);
    return tmpStr.join(byWhat);
}

function left(str, length) {
    if(!isString(str)) {
        return null;
    }
    var strLen = str.length;
    if(length >= strLen) {
        return str;
    } else {
        return str.substring(0, length);
    }
}

function right(str, length) {
    if(!isString(str)) {
        return null;
    }
    var strLen = str.length;
    if(length >= strLen) {
        return str;
    } else {
        return str.substring(strLen - length);
    }
}

function __strPad(srcStr, len, isRight, padStr) {
    srcStr = "" + srcStr;
    var needLen = len - srcStr.length;
    if(needLen <= 0) {
        return srcStr;
    }
    if(padStr == null) {
        padStr = " ";
    }
    if(padStr.length <= 0) {
        throw "padStr 's length must be great than 0 !";
    }
    var appendStr = "";
    do {
        appendStr += padStr;
        if(appendStr.length >= needLen) {
            appendStr = left(appendStr, needLen);
            break;
        }
    } while(true);
    //
    return isRight === true ? srcStr + appendStr : appendStr + srcStr;
}

function padLeft(_srcStr, len, padStr) {
    return __strPad(_srcStr, len, false, padStr);
}

function padRight(_srcStr, len, padStr) {
    return __strPad(_srcStr, len, true, padStr);
}

String.prototype.left = function (length) {
    return left(this, length);
};

String.prototype.right = function (length) {
    return right(this, length);
};

function duplicate(refStr, count) {
    if(!isNum(count)) {
        return null;
    }
    count = Math.floor(count);
    var resultStr = "";
    if(count <= 0) {
        return resultStr;
    }
    resultStr = refStr;
    for(var i = 1; i < count; i++) {
        resultStr += refStr;
    }
    return resultStr;
}

String.prototype.duplicate = function (count) {
    return duplicate(this, count);
};

function startsWith(srcStr, chkStr, bIgnoreCase) {
    if(!isString(srcStr) || !isString(chkStr)) {
        return false;
    }
    bIgnoreCase = bIgnoreCase === true;
    if(bIgnoreCase) {
        srcStr = srcStr.toLowerCase();
        chkStr = chkStr.toLowerCase();
    }
    return (srcStr.indexOf(chkStr) === 0);
}

function endsWith(srcStr, chkStr, bIgnoreCase) {
    if(!isString(srcStr) || !isString(chkStr)) {
        return false;
    }
    bIgnoreCase = bIgnoreCase === true;
    if(bIgnoreCase) {
        srcStr = srcStr.toLowerCase();
        chkStr = chkStr.toLowerCase();
    }
    var lastIndex = srcStr.lastIndexOf(chkStr);
    return (lastIndex != -1) && (lastIndex == srcStr.length - chkStr.length);
}

String.prototype.startsWith = function (chkStr, bIgnoreCase) {
    return startsWith(this, chkStr, bIgnoreCase);
};

String.prototype.endsWith = function (chkStr, bIgnoreCase) {
    return endsWith(this, chkStr, bIgnoreCase);
};

function __strContains(srcStr, chkStr, bIgnoreCase) {
    if(!isString(srcStr) || !isString(chkStr)) {
        return false;
    }
    bIgnoreCase = bIgnoreCase === true;
    if(bIgnoreCase) {
        srcStr = srcStr.toLowerCase();
        chkStr = chkStr.toLowerCase();
    }
    return (srcStr.indexOf(chkStr) != -1);
}

String.prototype.contains = function (chkStr, bIgnoreCase) {
    return __strContains(this, chkStr, bIgnoreCase);
};

// 形如{abc.dedss[0].zzz.(aaa.xxx).aaa}的字符串key路径
// [abc , dedss[0], zzz, aaa.xxx, aaa]
function __extractTemplateHolderParts(holderStr) {
    var holder = holderStr.substring(1, holderStr.length - 1).trim();
    var holderLen = holder.length;
    var holderParts = [];
    var tmpIndex = 0;
    var tmpPart = "";
    var inKh = false;
    while(tmpIndex < holderLen) {
        var tmpChar = holder.charAt(tmpIndex);
        if(tmpChar == '(') {
            if(!inKh) {
                inKh = true;
                tmpPart = tmpPart.trim();
                if(tmpPart !== "") {
                    holderParts.add(tmpPart);
                    tmpPart = "";
                }
            } else {
                tmpPart += tmpChar;
            }
        } else if(tmpChar == ")") {
            if(inKh) {
                tmpPart = tmpPart.trim();
                if(tmpPart !== "") {
                    holderParts.add(tmpPart);
                    tmpPart = "";
                }
                inKh = false;
            } else {
                tmpPart += tmpChar;
            }
        } else if(tmpChar == ".") {
            if(inKh) {
                tmpPart += tmpChar;
            } else {
                tmpPart = tmpPart.trim();
                if(tmpPart !== "") {
                    holderParts.add(tmpPart);
                    tmpPart = "";
                }
            }
        } else {
            tmpPart += tmpChar;
        }
        tmpIndex++;
    }
    tmpPart = tmpPart.trim();
    if(tmpPart !== "") {
        holderParts.add(tmpPart);
        tmpPart = "";
    }
    return holderParts;
}

/**
 * 格式化字符串，形如： {0},{1}..的索引位置，或形如 {pro1}, {prop2.subprop.(a.b).c}, {prop3[0]}的对象式<br/> 对于带key为形如 "a.b"的，可以使用(a.b)标记为原子key
 */
function format(template) {
    if(!isString(template)) {
        return template;
    }
    var params = Array.prototype.slice.call(arguments, 1);
    var paramCount = params.length;
    if(paramCount === 0) {
        return template;
    }
    var nullAs = template.nullAs || "null";
    var resultStr = "";
    var asObject = isPlainObject(params[0]);
    var xReg = null;
    if(asObject) {
        params = params[0];
        xReg = /\{(\(?[a-zA-Z_]+(\.[a-zA-Z_]+)*\)?)+(\.(\(?[a-zA-Z_]+(\.[a-zA-Z_]+)*\)?)|\[\d+\])*\}?/mg;
        resultStr = template.replace(xReg, function (match) {
            var holderParts = __extractTemplateHolderParts(match);
            var param = null;
            var curKey = "";
            for(var i = 0, len = holderParts.length; i < len; i++) {
                var tmpPart = holderParts[i];
                if(tmpPart.indexOf(".") != -1) {
                    curKey += "[\"" + tmpPart + "\"]";
                } else {
                    curKey += "." + tmpPart;
                }
                param = eval("params" + curKey);
                if(param == null) {
                    break;
                }
            }
            // alert(match +" : "+param);
            return "" + (param == null ? nullAs : param);
        });
    } else {
        xReg = /\{\d+}?/mg;
        resultStr = template.replace(xReg, function (m) {
            var holder = m.substring(1, m.length - 1).trim();
            var index = parseInt(holder, 10);
            if(index >= 0 && index < paramCount) {
                var param = params[index];
                // alert(holder +" : "+param);
                return "" + (param == null ? nullAs : param);
            } else {
                return m;
            }
        });
    }
    return resultStr;
}

String.prototype.format = function () {
    var args = [this].concat(Array.prototype.slice.call(arguments, 0));
    return format.apply(window, args);
};

String.prototype.isIn = function () {
    var args = [this].concat(Array.prototype.slice.call(arguments, 0));
    return strEql.apply(window, args);
};
/**
 * @private
 */
var __escapeStrReg = {
    backslash: /\\/ig,
    quote: /'/ig,
    dblquote: /"/ig,
    newline: /\n/ig,
    carriage: /\r/ig,
    carriage2: /\r\n/ig,
    formfeed: /\f/ig,
    hrtab: /\t/ig,
    foreslash: /\//ig
    // not used for json escape
};

/**
 * Escape string by filter special chars(\, ', ", \n, \r, \t etc.)
 *
 * @param {String}
 *            src original string
 * @param {Boolean}
 *            [useSingleQutoe=false] whether to use Single Qutoe
 * @returns {String} escaped string
 * @example __escapeJsonStr("aaaaaa'bbb/ccc\t'ddd",true) => aaaaaa\'bbb/ccc\t\'ddd
 */
function __escapeJsonStr(src, useSingleQutoe) {
    if(src == null || src === "") {
        return src;
    } else {
        useSingleQutoe = useSingleQutoe === true;
        // backslash
        __escapeStrReg.backslash.lastIndex = -1;
        src = src.replace(__escapeStrReg.backslash, "\\\\");
        if(useSingleQutoe) {
            // quote
            __escapeStrReg.quote.lastIndex = -1;
            src = src.replace(__escapeStrReg.quote, "\\'");
        } else {
            // dblquote
            __escapeStrReg.dblquote.lastIndex = -1;
            src = src.replace(__escapeStrReg.dblquote, '\\"');
        }
        // newline
        __escapeStrReg.newline.lastIndex = -1;
        src = src.replace(__escapeStrReg.newline, '\\n');
        // carriage
        __escapeStrReg.carriage.lastIndex = -1;
        src = src.replace(__escapeStrReg.carriage, '\\r');
        // carriage2
        __escapeStrReg.carriage2.lastIndex = -1;
        src = src.replace(__escapeStrReg.carriage2, '\\r\\n');
        // formfeed
        __escapeStrReg.formfeed.lastIndex = -1;
        src = src.replace(__escapeStrReg.formfeed, '\\f');
        // hrtab
        __escapeStrReg.hrtab.lastIndex = -1;
        src = src.replace(__escapeStrReg.hrtab, '\\t');
        return src;
    }
}

function StringBuilder() {
    this.value = "";
    //
    this.append = function () {
        for(var i = 0, c = arguments.length; i < c; i++) {
            this.value = this.value + arguments[i];
        }
        //
        return this;
    };
    this.appendln = function () {
        this.append.apply(this, arguments);
        this.append("\n");
        //
        return this;
    };
    this.prepend = function () {
        for(var i = 0, c = arguments.length; i < c; i++) {
            this.value = arguments[i] + this.value;
        }
        //
        return this;
    };
    this.clear = function () {
        this.value = "";
        //
        return this;
    };

    //初始参数
    if(arguments.length > 0) {
        this.append.apply(this, arguments)
    }
    //
    return this;
}

// 公开方法
String.builder = function () {
    var obj = new StringBuilder();
    obj.append.apply(obj, arguments);
    return obj;
};

/**
 * 解析大小及单位
 *
 * @param dim
 * @returns
 */
function parseDimen(dim) {
    if(dim == null) {
        return null;
    }
    var ret = {};
    if(isNum(dim)) {
        ret.value = dim;
        ret.unit = "px";
    } else if(isString(dim)) {
        var rawNum = ParseFloat(dim);
        if(isNum(rawNum)) {
            ret.value = rawNum;
            var numStr = toStr(ret.value);
            var rawUnit = dim.substring(numStr.length).trim();
            ret.unit = rawUnit === "" ? "px" : rawUnit;
        }
    }
    return ret;
}

//
function ParseInt(x) {
    if(isString(x)) {
        if(x.isBlank()) {
            return null;
        }
    }
    var val = parseInt(x, 10);
    return isNaN(val) ? null : val;
}

function ParseFloat(x) {
    if(isString(x)) {
        if(x.isBlank()) {
            return null;
        }
    }
    var val = parseFloat(x);
    return isNaN(val) ? null : val;
}

Number.prototype.round = function (frgs) {
    if(!isNum(frgs) || frgs < 0) {
        frgs = 0;
    }
    if(frgs === 0) {
        return Math.round(this);
    }
    var numStr = this + "";
    var dotIndex = numStr.indexOf(".");
    if(dotIndex != -1) {
        var intPart = numStr.substring(0, dotIndex);
        var frgPart = dotIndex == numStr.length - 1 ? "" : numStr.substring(dotIndex + 1);
        if(frgPart.length > frgs) {
            var nextDigit = parseInt(frgPart.charAt(frgs), 10);
            frgPart = frgPart.substring(0, frgs);
            if(nextDigit >= 5) {
                var lastDigit = parseInt(frgPart.charAt(frgs - 1), 10);
                frgPart = frgPart.substring(0, frgs - 1) + (lastDigit + 1);
            }
        }
        numStr = frgPart === "" ? intPart : intPart + "." + frgPart;
        return parseFloat(numStr);
    } else {
        return this;
    }
};

/**
 * clear all of the array elements
 */
Array.prototype.clear = function () {
    this.length = 0;
};

/**
 * Appends any number of items onto the end of the array.
 */
Array.prototype.append = function () {
    for(var i = 0, c = arguments.length, len = this.length; i < c; i++) {
        var tmpItem = arguments[i];
        if(isArray(tmpItem)) {
            var tmpItems = tmpItem;
            for(var j = 0, k = tmpItems.length; j < k; j++) {
                this[len++] = tmpItems[j];
            }
        } else {
            this[len++] = tmpItem;
        }
    }
};

/**
 * add one or many at the end of the array
 */
Array.prototype.add = function () {
    Array.prototype.append.apply(this, arguments);
};

/**
 * Prepend any number of items onto the start of the array.
 */
Array.prototype.prepend = function () {
    for(var i = 0, c = arguments.length; i < c; i++) {
        var tmpItem = arguments[i];
        if(isArray(tmpItem)) {
            var tmpItems = tmpItem;
            for(var j = 0, k = tmpItems.length; j < k; j++) {
                this.splice(0, 0, tmpItems[j]);
            }
        } else {
            this.splice(0, 0, tmpItem);
        }
    }
};

/**
 * 循环返回给定元素的下一个元素
 */
Array.prototype.nextCycleElement = function (vItem) {
    if(this.length === 0) {
        return undefined;
    }
    var index = this.indexOf(vItem);
    if(index == -1) {
        index = 0;
    } else {
        index++;
    }
    return this[index % this.length];
};

Array.prototype.first = function () {
    if(this.length > 0) {
        return this[0];
    } else {
        return undefined;
    }
};

Array.prototype.last = function () {
    if(this.length > 0) {
        return this[this.length - 1];
    } else {
        return undefined;
    }
};

// 找到最接近的元素
Array.prototype.nearest = function (vItem, compFunc) {
    var lastMatch = null;
    //
    if(this.length > 0) {
        if(compFunc == null) {
            compFunc = function (elA, elB) {
                return elA == elB ? 0 : (elA < elB ? -1 : 1);
            };
        }
        var tmpArray = this.sort(compFunc);
        for(var i = 0; i < tmpArray.length; i++) {
            var tmpItem = tmpArray[i];
            if(compFunc(vItem, tmpItem) >= 0) {
                lastMatch = tmpItem;
            } else {
                break;
            }
        }
        if(lastMatch == null) {
            lastMatch = tmpArray[0];
        }
    }
    return lastMatch;
};

/*------------------------------------------------------------------------------
 * JavaScript zArray Library
 * Version 1.1
 * by Nicholas C. Zakas, http://www.nczonline.net/
 * Copyright (c) 2004-2005 Nicholas C. Zakas. All Rights Reserved.
 */
var __arrayMethodsToCheck = ["slice", "splice", "shift", "unshift"];

/**
 * Creates a copy of the array and returns it.
 *
 * @return A copy of the array.
 */
if(typeof Array.prototype.clone != "function") {
    Array.prototype.clone = function () /* :Array */ {
        return this.concat();
    };
}

/**
 * Determines if a given item is in the array.
 *
 * @param vItem
 *            The item to insert.
 * @return True if found, false if not.
 */
Array.prototype.contains = function (vItem /* :variant */, isFunc /* : function */) /* :boolean */ {
    return this.indexOf(vItem, null, isFunc) > -1;
};
/**
 * Runs a function on each item in the array and returns a boolean result.
 *
 * @param {Function}
 *            fnTest The function to run on each value.
 * @param {Object}
 *            [context] The object that the function belongs to or null for a global function.
 * @return {Boolean} True if the function evaluates to true for each item in the array, false if even one returns false.
 */
Array.prototype.every = function (fnTest, context) {
    context = context || isInBrowser ? window : null;
    var bResult = true;
    for(var i = 0, len = this.length; i < len && bResult; i++) {
        bResult = bResult && fnTest.call(context, this[i], i, this);
        if(!bResult) {
            break;
        }
    }
    return bResult;
};
/**
 * Runs a function on each item and returns an array.
 *
 * @param {Function}
 *            fnTest The function to run on each item.
 * @param {Object}
 *            context The object that the function belongs to or null for a global function.
 * @return {Array} An array made up of all the items that returned true for the function.
 */
Array.prototype.filter = function (fnTest, context) {
    context = context || isInBrowser ? window : null;
    var aResult = [];
    for(var i = 0, len = this.length; i < len; i++) {
        if(fnTest.call(context, this[i], i, this)) {
            aResult.push(this[i]);
        }
    }
    return aResult;
};
/**
 * Runs a function on each item and returns an array.
 *
 * @param {Function}
 *            fnTest The function to run on each item.
 * @param {Object}
 *            context The object that the function belongs to or null for a global function.
 * @return {Array} An array made up of all the items that returned false for the function.
 */
Array.prototype.reject = function (fnTest, context) {
    context = context || isInBrowser ? window : null;
    var aResult = [];
    for(var i = 0, len = this.length; i < len; i++) {
        if(!fnTest.call(context, this[i], i, this)) {
            aResult.push(this[i]);
        }
    }
    return aResult;
};
/**
 * Runs a function on each item in the array.
 *
 * @param {Function}
 *            fnExec The function to run on each value.
 * @param {Object}
 *            context The object that the function belongs to or null for a global function.
 */
Array.prototype.forEach = function (fnExec, context) {
    context = context || isInBrowser ? window : null;
    for(var i = 0, len = this.length; i < len; i++) {
        fnExec.call(context, this[i], i, this);
    }
};
/**
 * Returns the index of the first occurrance in the array.
 *
 * @param {Object}
 *            vItem The item to locate in the array.
 * @param {Integer}
 *            [iStart] The item to start looking from (optional).
 * @param {Function}
 *            [isFunc] Function used to just the index of vItem.
 * @return {Integer} The index of the item in the array if found or -1 if not found.
 */
Array.prototype.indexOf = function (vItem, iStart, isFunc) {
    if(iStart == null) {
        iStart = 0;
    }
    var i;
    if(typeof isFunc == "function") {
        for(i = iStart, len = this.length; i < len; i++) {
            if(isFunc(this[i], vItem, i)) {
                return i;
            }
        }
    } else {
        for(i = iStart, len = this.length; i < len; i++) {
            if(this[i] == vItem) {
                return i;
            }
        }
    }
    return -1;
};
/**
 * 根据提供的函数的判别结果返回第一个符合条件的元素
 */
Array.prototype.find = function (isFunc) {
    if(typeof isFunc == "function") {
        for(var i = 0, len = this.length; i < len; i++) {
            var elem = this[i];
            if(isFunc(elem, i)) {
                return elem;
            }
        }
    }
    return null;
};
/**
 * Inserts an item into the array at the given position.
 *
 * @param {Object}
 *            vItem The item to insert.
 * @param {Integer}
 *            iIndex The index to insert the item into.
 * @return {Object} inserted
 */
Array.prototype.insertAt = function (vItem, iIndex) {
    this.splice(iIndex, 0, vItem);
    return vItem;
};
/**
 * Inserts an item into the array before the given item.
 *
 * @param {Object}
 *            vItem The item to insert.
 * @param {Object}
 *            vBeforeItem The item to insert before.
 * @return {Object} inserted
 */
Array.prototype.insertBefore = function (vItem, vBeforeItem) {
    return this.insertAt(vItem, this.indexOf(vBeforeItem));
};
/**
 * Returns the last index of the first occurrance in the array.
 *
 * @param {Object}
 *            vItem The item to locate in the array.
 * @param {Integer}
 *            [iStart] The index of the item to start at.
 * @param {Function}
 *            [isFunc] Function used to just the index of vItem.
 * @return {Integer} The last index of the item in the array if found or -1 if not found.
 */
Array.prototype.lastIndexOf = function (vItem, iStart, isFunc) {
    if(iStart == null || iStart >= this.length) {
        iStart = this.length - 1;
    }
    var i;
    if(typeof(isFunc) == "function") {
        for(i = iStart; i >= 0; i--) {
            if(isFunc(this[i], vItem, i)) {
                return i;
            }
        }
    } else {
        for(i = iStart; i >= 0; i--) {
            if(this[i] == vItem) {
                return i;
            }
        }
    }
    return -1;
};
/**
 * Runs a function on each item and returns an array.
 *
 * @param {Function}
 *            fnExec The function to run on each item.
 * @param {Object}
 *            [context] The object that the function belongs to or null for a global function.
 * @return {Array} An array made up of all the items that returned true for the function.
 */
Array.prototype.map = function (fnExec, context) {
    context = context || isInBrowser ? window : null;
    var aResult = [];
    for(var i = 0, len = this.length; i < len; i++) {
        aResult.push(fnExec.call(context, this[i], i, this));
    }
    return aResult;
};
/**
 * 对数组中所有对象提取给定的属性并组成一个数组
 *
 * @param {String}
 *            propName 要提取的属性名称
 * @return {Array}
 */
Array.prototype.pluck = function (propName) {
    var fnExec = function (vItem) {
        return vItem == null ? undefined : vItem[propName];
    };
    return this.map(fnExec);
};
/**
 * Removes the array item matching the given item.
 *
 * @param {Object}
 *            vItem the item to remove.
 * @param {Function}
 *            [isFunc] Function used to just the index of vItem.
 * @return {Object} The removed item.
 */
Array.prototype.remove = function (vItem, isFunc) {
    return this.removeAt(this.indexOf(vItem, null, isFunc));
};
/**
 * Removes the array item in the given position.
 *
 * @param {Integer}
 *            iIndex The index of the item to remove.
 * @return {Object} The removed item.
 */
Array.prototype.removeAt = function (iIndex) {
    var vItem;
    if(iIndex >= 0 && iIndex < this.length) {
        vItem = this[iIndex];
        this.splice(iIndex, 1);
    }
    return vItem;
};
/**
 * Runs a function on each item in the array and returns a result.
 *
 * @param {Function}
 *            fnTest The function to run on each value.
 * @param {Object}
 *            [context] The object that the function belongs to or null for a global function.
 * @param {Integer}
 *            [minCount] min count that returns true.
 * @return {Boolean} True if the function evaluates to true for some items(as minCount), false if not.
 */
Array.prototype.some = function (fnTest, context, minCount) {
    if(typeof context == "number") {
        minCount = context || 1;
        context = isInBrowser ? window : null;
    } else {
        minCount = minCount || 1;
        context = context || isInBrowser ? window : null;
    }
    var found = 0;
    for(var i = 0, len = this.length; i < len; i++) {
        if(fnTest.call(context, this[i], i, this)) {
            found++;
            if(found >= minCount) {
                return true;
            }
        }
    }
    return false;
};
/**
 * Runs a function on each item in the array and returns a result if any true.
 *
 * @param {Function}
 *            fnTest The function to run on each value.
 * @param {Object}
 *            [context] The object that the function belongs to or null for a global function.
 * @return {Boolean} True if the function evaluates to true for any one item, false if not.
 */
Array.prototype.any = function (fnTest, context) {
    return this.some(fnTest, context, 1);
};
/**
 * Creates an array composed of the indicated items in the current array.
 *
 * @param {Integer}
 *            iStart The first item to copy.
 * @param {Integer}
 *            [iStop] The index after the last item to copy.
 * @return {Array} An array containing all items in the original array between the given indices.
 */
Array.prototype._slice = function (iStart, iStop) {
    iStop = iStop || this.length;
    var aResult = [];
    for(var i = iStart; i < iStop; i++) {
        aResult.push(this[i]);
    }
    return aResult;
};
/**
 * Removes the first item in the array and returns it.
 *
 * @return {Object} The first item in the array.
 */
Array.prototype._shift = function () {
    var vItem;
    if(this.length > 0) {
        vItem = this[0];
        this.splice(0, 1);
    }
    return vItem;
};
/**
 * Alters the array by removing specified items and inserting others.
 *
 * @param {Integer}
 *            iIndex The index at which to begin altering the array.
 * @param {Integer}
 *            iLength The number of items to remove.
 * @param {args...} []
 *            The items to insert in place of the removed items.
 * @return {Array} An array containing all removed items.
 */
Array.prototype._splice = function (iIndex, iLength) {
    var aResult = [];
    var aRemoved = [];
    //
    var i;
    //
    for(i = 0; i < iIndex; i++) {
        aResult.push(this[i]);
    }
    for(i = iIndex; i < iIndex + iLength; i++) {
        aRemoved.push(this[i]);
    }
    if(arguments.length > 2) {
        for(i = 2; i < arguments.length; i++) {
            aResult.push(arguments[i]);
        }
    }
    for(i = iIndex + iLength, len = this.length; i < len; i++) {
        aResult.push(this[i]);
    }
    for(i = 0, len = aResult.length; i < len; i++) {
        this[i] = aResult[i];
    }
    this.length = aResult.length;
    //
    return aRemoved;
};

/**
 * Places the given items at the beginning of the array.
 *
 * @param [args...]
 *            vItem[] Items to add into the
 */
Array.prototype._unshift = function () {
    var aArgs = [];
    for(var i = 0, len = arguments.length; i < len; i++) {
        aArgs.push("arguments[" + i + "]");
    }
    eval("this.splice(0,0," + aArgs.join(",") + ")");
};
/*
 * Assign the necessary methods.
 */
for(var i = 0, len = __arrayMethodsToCheck.length; i < len; i++) {
    var method = __arrayMethodsToCheck[i];
    if(Array.prototype[method] == null) {
        Array.prototype[method] = Array.prototype["_" + method];
    }
}

/**
 * 以数组中的各元素的指定的属性值为key，元素为value形成一个json对象
 *
 * @author koqiui
 * @date 2016年12月13日 下午2:27:37
 *
 * @param keyProp
 * @returns {___anonymous34084_34085}
 */
Array.prototype.toMap = function (keyProp) {
    var retMap = {};
    for(var i = 0; i < this.length; i++) {
        var vItem = this[i];
        var keyVal = vItem[keyProp];
        retMap[keyVal] = vItem;
    }
    return retMap;
};
// JavaScript zArray Library end----------------------------------------------
/**
 * Adds all the items in the array and returns the result.
 *
 * @param {Function}
 *            fnEval An optional function to run value on each item before adding.
 * @param {Object}
 *            context The object that the function belongs to or null for a global function.
 * @return {Object} The result of adding all of the array items together.
 */
Array.prototype.sum = function (fnEval, context) {
    context = context || isInBrowser ? window : null;
    var initVal = null;
    if(typeof fnEval != "function") {
        fnEval = function (vItem) {
            return vItem;
        };
    } else {
        initVal = fnEval();
    }
    var result = initVal;
    var len = this.length;
    if(len > 0) {
        result = fnEval.call(context, this[0], 0, this);
        for(var i = 1; i < len; i++) {
            result += fnEval.call(context, this[i], i, this);
        }
    }
    return result;
};

/**
 * 返回数组中对象的属性和给定的条件对象的属性相等的元素列表
 *
 * @param {Object}
 *            filterProps 条件对象
 * @return {Array} 符合条件的元素数组
 */
Array.prototype.where = function (filterProps) {
    var proxyProps = filterProps;
    var proxyKeys = [];
    var keyCount = proxyKeys.length;
    if(proxyProps != null) {
        for(var key in proxyProps) {
            proxyKeys[keyCount++] = key;
        }
        keyCount = proxyKeys.length;
    }
    var fnTest = function (vItem) {
        // 按列值完全比较
        if(vItem == proxyProps) {
            return true;
        } else if(proxyProps != null && vItem != null) {
            for(var i = 0; i < keyCount; i++) {
                var key = proxyKeys[i];
                if(proxyProps[key] != vItem[key]) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    };
    return this.filter(fnTest);
};

/**
 * 对数组进行排序（可指定是否降序及比较函数） srcArray, compFunc(elA, elB), bDesc
 */
function sortArray() {
    var args = arguments;
    var xArray = args[0];
    if(!isArray(xArray)) {
        return xArray;
    }
    try {
        xArray = xArray.clone();
    } catch(ex) {
        //
    }
    var compFunc = null;
    var bDesc = false;
    if(args.length > 1) {
        if(typeof args[1] == "boolean") {
            bDesc = args[1] === true;
            if(args.length > 2 && typeof args[2] == "function") {
                compFunc = args[2];
            }
        } else if(typeof args[1] == "function") {
            compFunc = args[1];
            if(args.length > 2 && typeof args[2] == "boolean") {
                bDesc = args[2];
            }
        }
    }
    if(compFunc == null) {
        compFunc = function (elA, elB) {
            return elA == elB ? 0 : (elA < elB ? -1 : 1);
        };
    }
    var len = xArray.length;
    for(var i = 0; i < len - 1; i++) {
        var tmp = xArray[i];
        var indx = i;
        var tmp2;
        for(var j = i + 1; j < len; j++) {
            tmp2 = xArray[j];
            var result = compFunc(tmp2, tmp);
            result = bDesc ? result > 0 : result < 0;
            if(result) {
                tmp = tmp2;
                indx = j;
            }
        }
        if(indx > i) {
            tmp2 = xArray[i];
            xArray[i] = tmp;
            xArray[indx] = tmp2;
        }
    }
    return xArray;
}

/**
 * 对数组进行排序（可指定是否降序及比较函数） compFunc(elA, elB), bDesc
 */
if(typeof Array.prototype.sort != "function") {
    Array.prototype.sort = function () {
        var args = [this].concat(Array.prototype.slice.call(arguments, 0));
        return sortArray.apply(isInBrowser ? window : null, args);
    };
}

/**
 * 按指定的方向（where）移动指定数组(xArray)中指定索引位置(index or indices数组) 的元素 where : first, prev, next, last 返回索引位置信息数组[{old : x, new : y}, ...]
 */
function moveArrayElementsAt(xArray, indices, where) {
    xArray = xArray || [];
    var len = xArray.length;
    if(len <= 1) {
        return null;
    }
    indices = indices || [];
    // console.log(">> 1 :: " + indices);
    if(isNum(indices)) {
        indices = [indices];
    }
    indices = indices.sort();
    // console.log(">> 2 :: " + indices);
    if(indices.length === 0) {
        return null;
    }
    var minIndex = indices[0];
    if(minIndex === 0 && (where === "first" || where === "prev")) {
        return null;
    }
    var maxIndex = indices[indices.length - 1];
    if(maxIndex === (len - 1) && (where === "last" || where === "next")) {
        return null;
    }
    var offset = -1;
    if(where === "first") {
        offset = 0 - minIndex;
    } else if(where === "prev") {
        offset = -1;
    } else if(where === "next") {
        offset = 1;
    } else if(where === "last") {
        offset = (len - 1) - maxIndex;
    } else {
        return null;
    }
    //
    var tmpArray = [];
    for(var i = 0; i < len; i++) {
        tmpArray[i] = xArray[i];
    }
    //
    xArray.clear();
    //
    var indexChanges = [];
    for(var i = 0; i < indices.length; i++) {
        var index = indices[i];
        var indexNew = index + offset;
        xArray[indexNew] = tmpArray[index];
        indexChanges[i] = {
            "old": index,
            "new": indexNew
        };
    }
    //
    for(var i = 0, j = 0; i < len; i++) {
        var newElem = xArray[i];
        if(typeof newElem === "undefined") {
            while(true) {
                if(indices.indexOf(j) == -1) {
                    break;
                }
                j++;
            }
            xArray[i] = tmpArray[j++];
        }
    }
    return indexChanges;
}

// 改变当前数组，where : first, prev, next, last
Array.prototype.move = function (indices, where) {
    return moveArrayElementsAt(this, indices, where);
};

// 不改变当前数组，返回元素不重复的新数组
Array.prototype.unique = function (eqlFunc) {
    var retArray = [];
    if(typeof(eqlFunc) != "function") {
        eqlFunc = function (A, B) {
            return A == B;
        };
    }
    var k = 0;
    for(var i = 0, j = this.length; i < j; i++) {
        var tmpItem = this[i];
        if(retArray.indexOf(tmpItem, 0, eqlFunc) == -1) {
            retArray[k++] = tmpItem;
        }
    }
    return retArray;
};

// 查找重复的元素，返回重复元素组成的新数组
Array.prototype.findDuplicated = function (eqlFunc) {
    var retArray = [];
    if(typeof(eqlFunc) != "function") {
        eqlFunc = function (A, B) {
            return A == B;
        };
    }
    var k = 0,
        m = 0;
    var uniqueOnes = [];
    for(var i = 0, j = this.length; i < j; i++) {
        var tmpItem = this[i];
        if(uniqueOnes.indexOf(tmpItem, 0, eqlFunc) == -1) {
            uniqueOnes[k++] = tmpItem;
        } else {
            retArray[m++] = tmpItem;
        }
    }
    return retArray;
}

/**
 * 复制元素值或引用（从而返回一个新数组）
 */
function copyAsArray(srcArray) {
    srcArray = srcArray || [];
    var retArray = [];
    var len = srcArray.length;
    for(var i = 0; i < len; i++) {
        retArray[i] = srcArray[i];
    }
    return retArray;
}

// 声明名字空间
function declare(namespace) {
    if(typeof namespace != "string") {
        return null;
    }
    namespace = namespace.trim();
    if(namespace === "") {
        return null;
    }
    var names = namespace.split(".");
    var ns = [];
    var nsName = "";
    for(var i = 0; i < names.length; i++) {
        ns[i] = names[i];
        nsName = ns.join(".");
        if(eval('(typeof ' + nsName + ' == "undefined")')) {
            if(i === 0) {
                eval("var " + nsName + " = window." + nsName + " = {};");
            } else {
                eval(nsName + " = {};");
            }
        }
    }
    return eval(nsName);
}

// 返回绑定后的代理（主要用于事件处理）
function makeProxy(fn, context) {
    if(typeof context === "string") {
        var tmp = fn[context];
        context = fn;
        fn = tmp;
    }
    if(context == null) {
        context = isInBrowser ? window : null;
    }
    if(!isFunction(fn)) {
        return undefined;
    }
    var args = Array.prototype.slice.call(arguments, 2);
    var binded = function () {
        return fn.apply(context, args);
    };
    return binded;
}

// 判断某年是否为闰年
function isLeapYear(chkYear) {
    var theYear = null;
    if(isDate(chkYear)) {
        chkYear = chkYear.getFullYear();
    } else {
        theYear = ParseInt(chkYear);
    }
    if(!isNum(theYear)) {
        return false;
    }
    return (theYear % 4 === 0 && ((theYear % 100 !== 0) || (theYear % 400 === 0)));
}

// var __monthDaysAlgn = [01,02,03,04,05,06,07,08,09,10,11,12];
var __monthDaysNorm = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var __monthDaysLeap = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var __weekDayChsNames = ["日", "一", "二", "三", "四", "五", "六"];
// 按逻辑月份算
function getYearMonthDays(year, month) {
    var leap = isLeapYear(year);
    var mnth = ParseInt(month);
    var monthDays = leap ? __monthDaysLeap : __monthDaysNorm;
    return monthDays[mnth - 1];
}

Date.prototype.format = function (format) {
    /* yyyy-MM-dd HH:mm:ss.SSS */
    if(format == null) {
        format = "yyyy-MM-dd";
    }
    var result = format.replace(/yyyy/, this.getFullYear());
    result = result.replace(/yy/, padLeft(this.getYear(), 2, "0"));
    //
    result = result.replace(/MM/, padLeft(this.getMonth() + 1, 2, "0"));
    result = result.replace(/M/, this.getMonth() + 1);
    //
    result = result.replace(/dd/, padLeft(this.getDate(), 2, "0"));
    result = result.replace(/d/, this.getDate());
    //
    result = result.replace(/HH/, padLeft(this.getHours(), 2, "0"));
    result = result.replace(/H/, this.getHours());
    //
    result = result.replace(/mm/, padLeft(this.getMinutes(), 2, "0"));
    result = result.replace(/m/, this.getMinutes());
    //
    result = result.replace(/ss/, padLeft(this.getSeconds(), 2, "0"));
    result = result.replace(/s/, this.getSeconds());
    //
    result = result.replace(/SSS/, padLeft(this.getMilliseconds(), 3, "0"));
    result = result.replace(/S/, this.getMilliseconds());
    //
    return result;
};

if(Date._parse == null) {
    Date._parse = Date.parse;
    //
    Date.parse = function (dateStr, strictMode) {
        if(!dateStr) {
            return null;
        }
        if(isDate(dateStr)) {
            return dateStr;
        }
        strictMode = strictMode === true;
        if(strictMode) {
            dateStr = dateStr.replace(/-/g, "/");
            return Date._parse(dateStr);
        } else {
            dateStr = dateStr.replace(/年/g, '-');
            dateStr = dateStr.replace(/月/g, '-');
            dateStr = dateStr.replace(/日/g, '');
            dateStr = dateStr.replace(/时/g, ':');
            dateStr = dateStr.replace(/点/g, ':');
            dateStr = dateStr.replace(/分/g, ':');
            dateStr = dateStr.replace(/秒/g, '');
            dateStr = dateStr.replace(/毫秒/g, '');
            dateStr = dateStr.replace(/\s{2,}/g, " ");
            dateStr = dateStr.replace(/-/g, "/");
            // 解析毫秒
            var msIndex = dateStr.indexOf(".");
            if(msIndex != -1) {
                var ms = parseInt(dateStr.substring(msIndex + 1), 10);
                dateStr = dateStr.substring(0, msIndex);
                if(isNum(ms) && ms > 0) {
                    return Date._parse(dateStr) + ms;
                } else {
                    return Date._parse(dateStr);
                }
            } else {
                return Date._parse(dateStr);
            }
        }
    };
}

//
Date.parseAsDate = function (dateStr) {
    if(!dateStr) {
        return null;
    } else if(isDate(dateStr)) {
        return dateStr;
    } else if(isNum(dateStr)) {
        return new Date(dateStr);
    } else {
        return new Date(Date.parse(dateStr));
    }
};
//
Date.isValidDate = function (dateStr) {
    if(isDate(dateStr)) {
        return true;
    }
    var result = Date.parse(dateStr, true);
    return result != null && !isNaN(result);
};

Date.format = function (dateOrStr, format) {
    var date = Date.parseAsDate(dateOrStr);
    if(date) {
        return date.format(format || "yyyy-MM-dd");
    } else {
        return null;
    }
};

Date.prototype.isLeapYear = function () {
    return isLeapYear(this.getFullYear());
};

Date.prototype.getMonthDays = function () {
    return getYearMonthDays(this.getFullYear(), this.getMonth() + 1);
};
// toStdDateStr
if(Date.prototype._toString == null) {
    Date.prototype._toString = Date.prototype.toString;
    Date.prototype.toString = function (format) {
        if(typeof format == "undefined") {
            return this._toString();
        } else {
            return this.format(format);
        }
    };
}
//
Date.prototype.diff = function (that, part) {
    if(part == null) {
        part = "milliSecond";
    }
    var diffMs = this - that;
    switch(part.toLowerCase()) {
        case 'year':
            return this.getFullYear() - that.getFullYear();
        case 'month':
            return (this.getFullYear() - that.getFullYear()) * 12 + (this.getMonth() - that.getMonth());
        case 'day':
            return Math.floor(diffMs / 86400000);
        case 'hour':
            return Math.floor(diffMs / 3600000);
        case 'minute':
            return Math.floor(diffMs / 60000);
        case 'second':
            return Math.floor(diffMs / 1000);
        case 'week':
            return Math.floor(diffMs / 604800000);
        case 'quarter':
            return Math.ceil(this.diff(that, 'month') / 3);
        case 'millisecond':
            return diffMs;
        default:
            return null;
    }
};
// 返回某天是一年中的第几周(weekOfYear)
Date.prototype.getWeek = function () {
    var year1stDate = new Date(this.getFullYear(), 0, 1);
    var year1stDayOfWeek = year1stDate.getDay();
    var base = new Date(this.getFullYear(), this.getMonth(), this.getDate());
    var diffDays = base.diff(year1stDate, 'day');
    var diffWeeks = Math.floor(diffDays / 7);
    var leftDays = diffDays - diffWeeks * 7;
    return 1 + diffWeeks + Math.floor((year1stDayOfWeek + leftDays) / 7);
};
//
Date.prototype.asJSON = function () {
    var dt = {};
    dt.year = this.getFullYear();
    dt.month = this.getMonth() + 1;
    dt.day = this.getDate();
    dt.hour = this.getHours();
    dt.minute = this.getMinutes();
    dt.second = this.getSeconds();
    dt.milliSecond = this.getMilliseconds();
    dt.dayOfWeek = this.getDay();
    dt.weekOfYear = this.getWeek();
    dt.quarter = Math.ceil((this.getMonth() + 1) / 3);
    return dt;
};
//
Date.prototype.beginTime = function () {
    return new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0, 0);
};
Date.prototype.endTime = function () {
    var tomorrow0 = this.addDays(1).beginTime();
    return new Date(tomorrow0.getTime() - 1);
};
//
Date.prototype.add = function (count, part) {
    if(part == null) {
        part = "milliSecond";
    }
    switch(part.toLowerCase()) {
        case 'year':
            var base = this.asJSON();
            base.year += count;
            return new Date(base.year, base.month - 1, base.day, base.hour, base.minute, base.second, base.milliSecond);
        case 'month':
            var base = this.asJSON();
            var sign = Math.sign(count);
            var year = sign * Math.floor(Math.abs(count) / 12);
            var month = count % 12;
            base.year += year;
            base.month += month;
            return new Date(base.year, base.month - 1, base.day, base.hour, base.minute, base.second, base.milliSecond);
        case 'day':
            return new Date(this.getTime() + 86400000 * count);
        case 'hour':
            return new Date(this.getTime() + 3600000 * count);
        case 'minute':
            return new Date(this.getTime() + 60000 * count);
        case 'second':
            return new Date(this.getTime() + 1000 * count);
        case 'week':
            return new Date(this.getTime() + 604800000 * count);
        case 'quarter':
            return this.add(count * 3, 'month');
        case 'millisecond':
            return new Date(this.getTime() + count);
        default:
            return null;
    }
};

Date.prototype.addYears = function (count) {
    return this.add(count, 'year');
};
Date.prototype.addMonths = function (count) {
    return this.add(count, 'month');
};
Date.prototype.addDays = function (count) {
    return this.add(count, 'day');
};
Date.prototype.addHours = function (count) {
    return this.add(count, 'hour');
};
Date.prototype.addMinutes = function (count) {
    return this.add(count, 'minute');
};
Date.prototype.addSeconds = function (count) {
    return this.add(count, 'second');
};
Date.prototype.addWeeks = function (count) {
    return this.add(count, 'week');
};
Date.prototype.addQuarters = function (count) {
    return this.add(count, 'quarter');
};
Date.prototype.getPart = function (part) {
    if(part == null) {
        part = "milliSecond";
    }
    switch(part.toLowerCase()) {
        case 'year':
            return this.getFullYear();
        case 'month':
            return this.getMonth() + 1;
        case 'day':
            return this.getDate();
        case 'hour':
            return this.getHours();
        case 'minute':
            return this.getMinutes();
        case 'second':
            return this.getSeconds();
        case 'millisecond':
            return this.getMilliseconds();
        case 'dayofweek':
            return this.getDay();
        case 'weekofyear':
            return this.getWeek();
        case 'quarter':
            return Math.ceil((this.getMonth() + 1) / 3);
        default:
            return null;
    }
};

// => { days : , hours : }
function calcDiffHours(dtFrom, dtTo, dayValve) {
    if(!isNum(dayValve) || dayValve < 0) {
        dayValve = 1;
    }
    var fromDate = Date.parseAsDate(dtFrom);
    var toDate = Date.parseAsDate(dtTo);
    //
    var diffDays = toDate.diff(fromDate, 'day');
    // console.log("diffDays :" + diffDays);
    var diffHours = toDate.diff(fromDate, 'hour');
    // console.log("diffHours :" + diffHours);
    if(toDate >= fromDate) {
        if(diffDays >= dayValve) {
            diffHours = diffHours - diffDays * 24;
        } else {
            diffDays = 0;
        }
    } else {
        diffDays = diffHours = 0;
    }
    //
    return {
        days: diffDays,
        hours: diffHours
    }
}

// makeDiffHoursStr('2016-10-31 16:32', '2016-11-02 14:31') => 1天21小时
function makeDiffHoursStr(dtFrom, dtTo, dayValve) {
    var diff = calcDiffHours(dtFrom, dtTo, dayValve);
    console.log(diff.days + " days , " + diff.hours + " hours");
    var diffHoursStr;
    if(diff.days != 0 && diff.hours != 0) {
        diffHoursStr = (diff.days > 0) ? diff.days + "天" : diff.hours + "小时";
    } else {
        diffHoursStr = "0天"
    }
    return diffHoursStr;
}

//
function getObjAttr(_objToEval, attrName) {
    var tmpAttrName = __escapeJsonStr(attrName);
    var evalStr = '( _objToEval["' + trim(tmpAttrName) + '"] )';
    // alert(evalStr);
    return eval(evalStr);
}

// ------------
function __parseJson(jsonStr) {
    try {
        return eval('(' + jsonStr + ')');
    } catch(exp) {
        throw new TypeError("JSON parse error !");
    }
}

function __stringifyJson(obj) {
    var dblQuote = '"';
    var Callee = arguments.callee;
    if(obj == null) {
        return 'null';
    } else if(isBoolean(obj)) {
        return obj.toString();
    } else if(isNumber(obj)) {
        return isFinite(obj) ? obj.toString() : 'null';
    } else if(isString(obj)) {
        return dblQuote + __escapeJsonStr(obj) + dblQuote;
    } else if(isDate(obj)) {
        return dblQuote + obj.format('yyyy-MM-dd HH:mm:ss') + dblQuote;
    } else if(isArray(obj)) {
        var count = obj.length;
        var elemStrs = [];
        for(var i = 0; i < count; i++) {
            elemStrs[i] = Callee(obj[i]);
        }
        return "[" + elemStrs.join(",") + "]";
    } else if(typeof(obj.toJSON) == "function") {
        return obj.toJSON();
    } else // if(isPlainObject(obj)) //Strict Check ...
    {
        var attrStrs = [];
        var index = 0;
        var hasOwnProperty = Object.hasOwnProperty;
        for(var attr in obj) {
            if(hasOwnProperty.call(obj, attr)) {
                var value = obj[attr];
                attrStrs[index++] = Callee(attr) + ":" + Callee(value);
            }
        }
        return "{" + attrStrs.join(",") + "}";
    }
}

//
var __isJSONDefined = typeof(JSON) !== "undefined" && (isFunction(JSON.parse) || isFunction(JSON.stringify));
// alert("JSON already defined ? "+__isJSONDefined);

function isJSONDefined() {
    //__isJSONDefined = false;
    // force to use simple JSON object.(IGNORE browser built-in JSON)
    return __isJSONDefined;
}

//
if(!isJSONDefined()) {
    JSON = {};
    JSON.parse = __parseJson;
    JSON.stringify = __stringifyJson;
}

if(isFunction(JSON.parse)) {
    JSON.decode = JSON.parse;
    //
    JSON.decodeStr = function (str) {
        return str == null ? null : decodeURIComponent(str);
    };
}

if(isFunction(JSON.stringify)) {
    JSON.encode = JSON.stringify;
    //
    JSON.encodeStr = function (str) {
        return str == null ? null : encodeURIComponent(str);
    };
}

//
function merge(original, overwrite, includeFunc) {
    original = original || {};
    includeFunc = includeFunc !== false;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    //
    if(overwrite == null) {
        original = null;
    } else if(isPlainObject(overwrite)) {
        for(var key in overwrite) {
            if(hasOwnProperty.call(overwrite, key)) {
                var orgVal = original[key];
                var value = overwrite[key];
                original[key] = merge(orgVal, value);
            }
        }
    } else if(isArray(overwrite)) {
        original = [];
        var items = overwrite;
        for(var i = 0; i < items.length; i++) {
            original[i] = merge({}, items[i]);
        }
    } else if(typeof overwrite == "function" && includeFunc) {
        original = overwrite;
    } else {
        original = overwrite;
    }
    //
    return original;
}

/**
 * @class convenient hashmap for key/value pair operations
 * @param {String}
 *            [name] keymap name (for debug usage)
 * @constructor
 */
function KeyMap(name) {
    this.name = "";
    if(name != null) {
        this.name = "" + name;
    }
    /**
     * @private inner store object
     */
    var __data = {};
    /**
     * clear all key/value pairs
     */
    this.clear = function () {
        for(var xKey in __data) {
            delete __data[xKey];
        }
        //
        return this;
    };
    //
    this.merge = function (json) {
        merge(__data, json);
        //
        return this;
    };
    //
    this.from = function (json) {
        if(json == null) {
            json = {};
        }
        __data = json;
        //
        return this;
    };
    /**
     * save key/value pair
     *
     * @param {String}
     *            key (NOTE, key string will be trimmed before saving)
     * @param {Object}
     *            value
     */
    this.set = function (key, value) {
        __data[key] = value;
        //
        return this;
    };
    /**
     * 同 set
     */
    this.put = function (key, value) {
        return this.set(key, value);
    };
    /**
     * return value by given key
     *
     * @param {String}
     *            key the key of the key/value pair of which the value is to be retrieve
     * @returns {Object} the value
     */
    this.get = function (key) {
        return __data[key];
    };
    //
    this.data = function (key, value) {
        var argCount = arguments.length;
        if(argCount == 0) {
            return __data;
        } else if(argCount == 1) {
            return this.get(key);
        } else if(argCount == 2) {
            this.set(key, value);
        }
    };
    /**
     * check whether contains the given key
     *
     * @param {String}
     *            key
     * @returns {Boolean}
     */
    this.contains = function (key) {
        return typeof __data[key] != "undefined";
    };
    /**
     * like {@link KeyMap#set} except that will not overwrite existing key/value pair with the same key
     *
     * @param {String}
     *            key
     * @param {Object}
     *            value
     * @returns {Boolean} whether added successfully
     */
    this.add = function (key, value) {
        if(!this.contains(key)) {
            __data[key] = value;
            return true;
        }
        return false;
    };
    /**
     * remove the key/value pair by given key
     *
     * @param {String}
     *            key
     * @returns {Object} the removed value (or null if not exist)
     */
    this.remove = function (key) {
        var retValue = __data[key];
        delete __data[key];
        return retValue;
    };
    /**
     * return all the current keys
     *
     * @returns {Array} all the current keys
     */
    this.keys = function () {
        var retKeys = [];
        var keyCount = retKeys.length;
        for(var xKey in __data) {
            retKeys[keyCount++] = xKey;
        }
        return retKeys;
    };
    /**
     * return all the current values
     *
     * @returns {Array} all the current values
     */
    this.values = function () {
        var retValues = [];
        var valCount = retValues.length;
        for(var xKey in __data) {
            retValues[valCount++] = __data[xKey];
        }
        return retValues;
    };
    /**
     * return the count of current items
     *
     * @returns {Number}
     */
    this.size = function () {
        var retSize = 0;
        for(var xKey in __data) {
            retSize++;
        }
        return retSize;
    };
    //
    this.isEmpty = function () {
        return this.size() == 0;
    };
    /**
     * clone current key/value pairs to a newly created {@link #KeyMap } object
     *
     * @param {String}
     *            [newName] new keymap name
     */
    this.clone = function (newName) {
        var newKeyMap = new KeyMap(newName);
        var data = merge({}, __data);
        newKeyMap.from(data);
        return newKeyMap;
    };
    //
    this.reverse = function () {
        var _keys = this.keys();
        var tmpData = merge({}, __data);
        this.clear();
        //
        for(var i = _keys.length - 1; i >= 0; i--) {
            var key = _keys[i];
            __data[key] = tmpData[key];
        }
        //
        return this;
    };
    //
    this.toObject = function () {
        return merge({}, __data);
    };
    /**
     * json-style toString
     *
     * @param {Boolean}
     *            outputNull whether to output null value items
     * @returns {String} json string representing current key/value info
     */
    this.toJSON = function () {
        var _keys = this.keys();
        var _keysCount = _keys.length;
        var itemStrArray = [];
        var itemStrCount = 0;
        for(var i = 0; i < _keysCount; i++) {
            var tmpKey = _keys[i];
            var tmpValue = this.get(tmpKey);
            itemStrArray[itemStrCount++] = JSON.stringify(tmpKey + "") + ":" + JSON.stringify(tmpValue);
        }
        return "{" + itemStrArray.join(",") + "}";
    };
    //
    this.toString = this.toJSON;
}

KeyMap.newOne = function () {
    return new KeyMap();
};
// 静态方法，从给定的json对象包装出一个KeyMap对象
KeyMap.from = function (json) {
    var keyMap = KeyMap.newOne();
    keyMap.from(json);
    return keyMap;
};

//
function sortByKey(json, compFunc) {
    var retJson = null;
    //
    json = json || null;
    //
    if(json != null) {
        if(typeof compFunc !== "function") {
            compFunc = function (elA, elB) {
                return elA == elB ? 0 : (elA < elB ? -1 : 1);
            };
        }
        //
        retJson = {};
        var tmpMap = KeyMap.from(json);
        //
        var tmpKeys = tmpMap.keys();
        tmpKeys = tmpKeys.sort(compFunc);
        for(var i = 0; i < tmpKeys.length; i++) {
            var tmpKey = tmpKeys[i];
            var tmpValue = tmpMap.get(tmpKey);
            retJson[tmpKey] = tmpValue;
        }
    }
    //
    return retJson;
}
// [], key, [value1,value2,...]
function makeCrossCombsWith(srcCombs, key, values) {
    if(srcCombs == null) {
        srcCombs = [];
    }
    values = values || [];
    //
    var retCombs = [];
    var srcLen = srcCombs.length;
    if(srcLen == 0) {
        for(var j = 0; j < values.length; j++) {
            var json = {};
            json[key + ""] = values[j];
            retCombs.add(json);
        }
    } else {
        for(var i = 0; i < srcLen; i++) {
            var srcJson = srcCombs[i];
            for(var j = 0; j < values.length; j++) {
                var json = merge({}, srcJson);
                json[key + ""] = values[j];
                retCombs.add(json);
            }
        }
    }
    return retCombs;
}
// 生成 交叉组合项（比如商品规格组合）
// key2ValuesMap :: key => [value1,value2,...]
function makeCrossCombsFor(key2ValuesMap) {
    var retCombs = [];
    //
    var tmpMap = KeyMap.from(key2ValuesMap);
    var tmpKeys = tmpMap.keys();
    for(var i = 0; i < tmpKeys.length; i++) {
        var tmpKey = tmpKeys[i];
        var values = tmpMap.get(tmpKey);
        if(values != null && values.length > 0) {
            // 只考虑有效的
            retCombs = makeCrossCombsWith(retCombs, tmpKey, values);
        }
    }
    //
    return retCombs;
}
// limitSize 最大元素数
function LimitedQueue(limitSize) {
    var dataSize = limitSize;
    var dataList = [];
    // 相同元素判断函数
    var sameJudger = function (eA, eB) {
        return eA == eB;
    };
    // 设置相同元素判断函数
    this.setJudger = function (theJudger) {
        if(typeof theJudger == "function") {
            sameJudger = theJudger;
        }
        //
        return this;
    };
    //
    this.add = function (el) {
        var curIndex = dataList.indexOf(el, 0, sameJudger);
        if(curIndex != -1) {
            var tmpArray = [];
            for(var i = curIndex; i > 0; i--) {
                dataList[i] = dataList[i - 1];
            }
            dataList[0] = el;
        } else {
            dataList.unshift(el);
            if(dataList.length > dataSize) {
                dataList.length = dataSize;
            }
        }
        // console.log(JSON.encode(dataList));
        return this;
    };
    // 输出为数组
    this.toArray = function () {
        return dataList.clone();
    };
}

// 把json数据拆分成(key, value, jsonData)对传递给 keyValSetter 回调函数供其使用
function syncDataBy(jsonData, keyValSetter) {
    if(jsonData == null || typeof keyValSetter != "function") {
        return;
    }
    var hasOwnProperty = Object.hasOwnProperty;
    for(var key in jsonData) {
        if(hasOwnProperty.call(jsonData, key)) {
            try {
                keyValSetter(key, jsonData[key], jsonData);
            } catch(ex) {
                //
            }
        }
    }
}

/**
 * 比较两个数组，得到 theArray 相对于 refArray 的变化结果：</br> more : 多出的元素列表</br> less : 减少的元素列表</br> same : 一样的的元素列表（根据eqlFunc判断）</br> diff : 不同的元素列表（根据eqlFunc判断）</br>
 * ========================================================== 参数中的eqlFunc主要用于判断两个元素是否一样（如判断两条记录是否一样：无变化）</br> 参数中的isFunc主要用于判断两个数组中的对等元素（如判断两条记录的id值是否相等）</br>
 */
function compareArrays(theArray, refArray, eqlFunc, isFunc) {
    var result = {
        more: [],
        less: [],
        same: [],
        diff: []
    };
    if(refArray == null) {
        refArray = [];
    }
    if(theArray == null) {
        theArray = [];
    }
    var refCount = refArray.length;
    var theCount = theArray.length;
    if(refCount === 0) {
        result.more = theArray;
    } else if(theCount === 0) {
        result.less = refArray;
    } else {
        if(typeof(eqlFunc) != "function") {
            eqlFunc = function (A, B) {
                return A == B;
            };
        }
        //
        theArray = theArray.clone();
        refArray = refArray.clone();
        var more = result.more;
        var less = result.less;
        var same = result.same;
        var diff = result.diff;
        for(var i = refCount - 1, j = theCount - 1; i >= 0 || j >= 0;) {
            var refObj = i >= 0 ? refArray[i] : undefined;
            var theObj = j >= 0 ? theArray[j] : undefined;
            if(i >= 0) {
                var theIndex = theArray.indexOf(refObj, null, isFunc);
                if(theIndex != -1) {
                    theObj = theArray[theIndex];
                    if(eqlFunc(theObj, refObj)) {
                        same[same.length] = theObj;
                    } else {
                        diff[diff.length] = theObj;
                    }
                    theArray.removeAt(theIndex);
                    refArray.removeAt(i);
                    i--;
                    j--;
                } else {
                    less[less.length] = refObj;
                    refArray.removeAt(i);
                    i--;
                }
            } else {
                more[more.length] = theObj;
                theArray.removeAt(j);
                j--;
            }
        }
    }
    result.more = result.more.reverse();
    result.less = result.less.reverse();
    result.same = result.same.reverse();
    result.diff = result.diff.reverse();
    return result;
}

/**
 * 比较两个记录组成的（数组）列表，得到 newRecords 相对于 oldRecords 的变化结果：</br> added : 新添加 的记录列表</br> deleted : 新删除 的记录列表</br> modified : 新修改 的记录列表（根据recEqlFunc判断）</br>
 * ======================================================================== idColNameOrIdEqlFunc : id列名称 或 判断两条记录是否相等的函数（对复合键比较有用），<br/> 已经提供了默认的根据给定的id列名称进行比较的函数）<br/> recEqlFunc :
 * 判断两条记录是否相等（无变化）的函数，<br/> 已经提供了默认的判断两条记录相等比较的函数）<br/>
 */
function compareRecordsById(newRecords, oldRecords, idColNameOrIdEqlFunc, recEqlFunc) {
    var idEqlFunc = null;
    if(typeof(idColNameOrIdEqlFunc) == "function") {
        idEqlFunc = idColNameOrIdEqlFunc;
    } else {
        var idColName = idColNameOrIdEqlFunc;
        if(typeof(idColName) == "string") {
            if((idColName = idColName.trim()) === "") {
                idColName = "id";
            }
        } else {
            idColName = "id";
        }
        idEqlFunc = function (record1, record2) {
            // 按 idColName 标识两个列表中的同一条记录
            if(record1 == record2) {
                return true;
            } else if(record1 != null && record2 != null) {
                return record1[idColName] == record2[idColName];
            } else {
                return false;
            }
        };
    }
    //
    // var hasOwnProperty = Object.hasOwnProperty;
    if(typeof(recEqlFunc) != "function") {
        recEqlFunc = function (record1, record2) {
            // 按列值完全比较
            if(record1 == record2) {
                return true;
            } else if(record1 != null && record2 != null) {
                var colName;
                for(colName in record1) {
                    // if(hasOwnProperty.call(record1, colName)) {
                    if(record1[colName] != record2[colName]) {
                        return false;
                    }
                    // }
                }
                for(colName in record2) {
                    // if(hasOwnProperty.call(record2, colName)) {
                    if(record1[colName] != record2[colName]) {
                        return false;
                    }
                    // }
                }
                return true;
            } else {
                return false;
            }
        };
    }
    //
    var _result = compareArrays(newRecords, oldRecords, recEqlFunc, idEqlFunc);
    //
    delete _result["same"];
    var result = {
        added: _result.more,
        deleted: _result.less,
        modified: _result.diff
    };
    return result;
}

//
function getClassOf(obj) {
    if(obj == null) {
        return null;
    }
    if(isFunction(obj)) {
        return Function;
    } else {
        return obj.constructor;
    }
}

function getFuncName(func) {
    if(!isFunction(func)) {
        return null;
    }
    var funcDeclRegExp = /^function(\s)+([\w\$]+?(\s)*\()/i;
    var funcStr = func.toString().trim();
    var funcDeclParts = funcStr.match(funcDeclRegExp);
    if(funcDeclParts != null && funcDeclParts.length > 0) {
        // alert(funcDeclParts.join("\n---\n"));
        var funcDecl = funcDeclParts[0].trim();
        var funcName = funcDecl.substring(8, funcDecl.length - 1);
        funcName = funcName.trim();
        // alert('"'+funcName+'"');
        return funcName;
    }
    return null;
}

function getClassNameOf(obj) {
    var objClass = getClassOf(obj);
    return objClass == null ? null : getFuncName(objClass);
}

/**
 * 是否金额数字
 *
 * @param numStr
 * @param allowSign
 * @return
 */
function isMoneyStr(numStr, allowSign) {
    if(numStr == null) {
        return false;
    }
    numStr = "" + numStr;
    allowSign = allowSign === true;
    var moneyRegexp = allowSign ? /^(\+|-)?([0-9]|[1-9][0-9]*)(\.\d+)?$/ : /^([0-9]|[1-9][0-9]*)(\.\d+)?$/;
    return moneyRegexp.test(numStr);
}
// 是否整数
function isIntStr(numStr) {
    if(numStr == null) {
        return false;
    }
    numStr = "" + numStr;
    var numRegexp = /^\-?\d+$/;
    return numRegexp.test(numStr);
}

// 是否自然数
function isNatualStr(numStr) {
    if(numStr == null) {
        return false;
    }
    numStr = "" + numStr;
    var numRegexp = /^([0-9]|[1-9][0-9]*)$/;
    return numRegexp.test(numStr);
}

//
function isValidEmail(checkStr) {
    var regExp = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    return regExp.test(checkStr);
}

function isDigitsStr(checkStr) {
    var regExp = /^(\d)+$/;
    return regExp.test(checkStr);
}

function isDigitsOrHyphenStr(checkStr) {
    var regExp = /^(\d|-)+$/;
    return regExp.test(checkStr);
}

function isMobile(checkStr) {
    if(checkStr == null || checkStr.length != 11) {
        return false;
    }
    var regExp = /^1[3|4|5|7|8]\d{9}$/;
    return regExp.test(checkStr);
}

function isTelNo(checkStr) {
    if(checkStr == null || checkStr.length < 7) {
        return false;
    }
    var regExp = /(^([0][1-9][0-9]-?)?[0-9]{8}$)|(^([0][1-9]{3}-?)?[0-9]{7}$)/;
    return regExp.test(checkStr);
}

function isPhoneNo(checkStr) {
    return isMobile(checkStr) || isTelNo(checkStr);
}

function isHexColor(checkStr) {
    if(checkStr == null || checkStr.length < 4) {
        return false;
    }
    var regExp = /^#[0-9a-fA-F]{3,6}$/;
    return regExp.test(checkStr);
}

//
var __cityCodeForIdentity = {
    11: "北京",
    12: "天津",
    13: "河北",
    14: "山西",
    15: "内蒙古",
    21: "辽宁",
    22: "吉林",
    23: "黑龙江 ",
    31: "上海",
    32: "江苏",
    33: "浙江",
    34: "安徽",
    35: "福建",
    36: "江西",
    37: "山东",
    41: "河南",
    42: "湖北 ",
    43: "湖南",
    44: "广东",
    45: "广西",
    46: "海南",
    50: "重庆",
    51: "四川",
    52: "贵州",
    53: "云南",
    54: "西藏 ",
    61: "陕西",
    62: "甘肃",
    63: "青海",
    64: "宁夏",
    65: "新疆",
    71: "台湾",
    81: "香港",
    82: "澳门",
    91: "国外 "
};

function isIdentity(code) {
    if(!code || !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(code)) {
        console.log("身份证号格式错误");
        return false;
    } else if(!__cityCodeForIdentity[code.substr(0, 2)]) {
        console.log("省份编码错误");
        return false;
    } else {
        // 18位身份证需要验证最后一位校验位
        if(code.length == 18) {
            code = code.split('');
            // ∑(ai×Wi)(mod 11)
            // 加权因子
            var factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
            // 校验位
            var parity = [1, 0, 'X', 9, 8, 7, 6, 5, 4, 3, 2];
            var sum = 0;
            var ai = 0;
            var wi = 0;
            for(var i = 0; i < 17; i++) {
                ai = code[i];
                wi = factor[i];
                sum += ai * wi;
            }
            var last = parity[sum % 11];
            if(parity[sum % 11] != code[17]) {
                console.log("校验位错误");
                return false;
            }
        }
    }
    return true;
}

//
function checkPassword(chkStr, strict) {
    if(typeof chkStr != "string") {
        return "密码必须为字符串";
    }
    if(!/^[a-zA-Z_0-9]{6,16}$/ig.test(chkStr)) {
        return "密码必须为6~16位由字母、数字和下划线组成的字符串";
    }
    //
    strict = strict === true;
    if(strict) {
        if(/^[a-zA-Z]+$/ig.test(chkStr) || /^[0-9]+$/ig.test(chkStr)) {
            return "密码不能为纯字母或纯数字";
        }
    }
    return null;
}

// ------------------------- 浏览器页面专用 -------------------------
console = console || {
        // 防止浏览器不支持时报错
        log: function () {
        },
        trace: function () {
        },
        debug: function () {
        },
        info: function () {
        },
        warn: function () {
        },
        error: function () {
        },
        assert: function () {
        },
        clear: function () {
        },
        count: function () {
        },
        goup: function () {
        },
        goupEnd: function () {
        },
        dir: function () {
        },
        time: function () {
        },
        timeEnd: function () {
        },
        table: function () {
        }
    };

//
function getDomById(id) {
    return document.getElementById(id);
}

//
function getPageInfo() {
    return {
        title: window.document.title,
        href: window.location.href,
        hash: window.location.hash,
        protocol: window.location.protocol,
        host: window.location.host,
        port: window.location.port,
        hostname: window.location.hostname,
        origin: window.location.origin,
        pathname: window.location.pathname,
        search: window.location.search
    };
}

//
function getServerBase(docLoc) {
    if(typeof docLoc == "undefined") {
        docLoc = window.location.href;
    }
    var slashIndex = docLoc.indexOf("://") + 3;
    slashIndex = docLoc.indexOf("/", slashIndex);
    return docLoc.substring(0, slashIndex);
}

// 获取带有 protocol :// hostname[:port] 的全路径url
function getServerBasedUrl(appBasedUrl, refServerUrl) {
    if(appBasedUrl == null) {
        appBasedUrl = "/";
    }
    //
    if(appBasedUrl.indexOf("://") == -1) {
        // 处理serverBase问题
        if(typeof refServerUrl == "undefined") {
            refServerUrl = window.location.href;
        }
        //
        var serverBase = getServerBase(refServerUrl);
        appBasedUrl = serverBase + appBasedUrl;
    }
    //
    return appBasedUrl;
}

// WebSocket
function getWebSocket() {
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    return window.WebSocket;
}

// 合成Base64DataURL
function base64StrToDataURL(mimeType, base64Str) {
    var tpl = "data:{0};base64,{1}";
    return tpl.format(mimeType, base64Str);
}

// 播放音频文件
function playAudio(dataOrUrl, useProxy) {
    if(dataOrUrl == null) {
        return;
    }
    //
    useProxy = useProxy === true;
    //
    var tmpAudio = null;
    if(useProxy || !window.Audio) {
        tmpAudio = document.createElement("audio");
        tmpAudio = document.body.appendChild(tmpAudio);
        tmpAudio.onended = function () {
            tmpAudio.remove();
        };
    } else {
        tmpAudio = new Audio();
    }
    tmpAudio.src = dataOrUrl;
    try {
        tmpAudio.play();
    } catch(ex) {
        console.error(ex);
    }
}

// 语音朗读文本（=> makeTextAudioUrl）
function speakText(text, useProxy, failToDefaultAudio) {
    if(!useProxy && !(window.SpeechSynthesisUtterance && window.speechSynthesis)) {
        useProxy = true;
    }
    if(useProxy) {
        if(typeof makeTextAudioUrl == "function") {
            var textAudioUrl = makeTextAudioUrl(text, true);
            playAudio(textAudioUrl, true);
        } else {
            console.warn("没有找到 function makeTextAudioUrl(text, failToDefaultAudio) 的实现");
        }
    } else {
        // 创建一个 SpeechSynthesisUtterance的实例
        var newUtterance = new SpeechSynthesisUtterance();
        // 设置文本
        newUtterance.text = text;
        // 添加到队列
        window.speechSynthesis.speak(newUtterance);
    }
}

// 设置页面标题
function setPageTitle(docTitle, domId) {
    document.title = docTitle;
    //
    if(typeof domId == "string") {
        var dom = getDomById(domId);
        if(dom != null) {
            dom.innerText = docTitle;
        }
    }
}

// 更换页面url
var __hidden_link_id_for_page = genUniqueStr();
// beforeOpen 指定打开目标frame时作为打开前的回调函数
// target 在当前窗口打开时作为是否替换标记参数（替换当前页面而不保留历史）
function setPageUrl(url, target, beforeOpen) {
    if(typeof target == "string") {
        if(target == "_self") {
            window.location.href = url;
            return;
        }
        var dom = getDomById(__hidden_link_id_for_page);
        if(dom == null) {
            dom = document.createElement("A");
            dom.id = __hidden_link_id_for_page;
            dom.style.display = "none";
            dom = document.body.appendChild(dom);
        }
        dom.target = target;
        dom.href = url;
        if(typeof beforeOpen == "function") {
            dom.onclick = function () {
                return beforeOpen();
            };
        }
        dom.click();
    } else {
        if(target === true) {
            window.location.replace(url);
        } else {
            window.location.assign(url);
        }
    }
}

/**
 * 重复（事件）检查类 __RepeatChecker.isValidFor("log") <br/> __RepeatChecker.isValidFor("log", 1000)
 */
function __RepeatChecker() {
    var defaultInterval = 1000;
    var cachedCodeTimeMap = {};
    /**
     * @Param {String}
     *            uniqueCode 事件表示码
     * @Param {int}
     *            [interval=1000] 最小毫秒间隔
     */
    this.isValidFor = function (uniqueCode, interval) {
        var curTime = new Date().getTime();
        var lastTime = cachedCodeTimeMap[uniqueCode];
        cachedCodeTimeMap[uniqueCode] = curTime;
        if(lastTime == null) {
            return true;
        } else {
            if(typeof interval == "undefined") {
                interval = defaultInterval;
            }
            return curTime - lastTime >= interval;
        }
    };
}

// 全局预定义对象
var repeatChecker = new __RepeatChecker();
//
// 任务延迟器（防止任务频繁执行）
function TaskDelayer() {
    var _taskTimer = null;
    this.delay = function (taskFunc, delayTime) {
        clearTimeout(_taskTimer);
        //
        _taskTimer = setTimeout(taskFunc, delayTime);
    };
    this.cancel = function () {
        clearTimeout(_taskTimer);
    };
}

TaskDelayer.newOne = function () {
    return new TaskDelayer();
};

// ------------------------------------------------------------------
//
/**
 * 获取iframe所在的宿主窗口，如果没有宿主窗口将返回null
 */
var __cachedHostWin;

function getHostWindow() {
    if(typeof __cachedHostWin == "undefined") {
        var hostWin = window.parent;
        if(hostWin != null && hostWin != window) {
            __cachedHostWin = hostWin.window;
        } else {
            __cachedHostWin = null;
        }
    }
    return __cachedHostWin;
}

/**
 * 判断当前页面是否有（内嵌在）宿主窗口
 *
 * @return {Boolean}
 */
function hasHostWindow() {
    return getHostWindow() !== null;
}

// 是否是iframe页面
function isIframePage() {
    return getHostWindow() !== null;
}

function getWindowFrame() {
    if(hasHostWindow()) {
        return window.frameElement;
    } else {
        return null;
    }
}

/**
 * 调用宿主窗口的函数，可传递参数<br>
 * 如：callHostFunc('test', a,b)，将执行宿主窗口的 test(a,b)
 *
 * @param {String}
 *            callback function
 */
function callHostFunc(callback) {
    var hostWin = getHostWindow();
    if(hostWin != null) {
        var callbackFunc = callback;
        if(typeof callback == "string") {
            callbackFunc = hostWin[callback];
        }
        if(typeof callbackFunc == "function") {
            var argCount = arguments.length;
            var args = argCount > 1 ? Array.prototype.slice.call(arguments, 1) : [];
            return callbackFunc.apply(hostWin, args);
        }
    }
    return undefined;
}

/**
 * 显馈窗口信息
 */
function __echoWindowInfo() {
    var pageInfo = getPageInfo();
    alert(pageInfo.title + " => " + pageInfo.href);
}

/**
 * 显示宿主窗口信息（供调试用）
 */
function echoHostWindow() {
    callHostFunc(__echoWindowInfo);
}

/**
 * @param url
 * @returns {json: scheme, host, port, url, hash, uri, params}
 */
function parseUrl(url, toDecode) {
    toDecode = toDecode === true;
    if(typeof url == "undefined") {
        url = window.location.href;
    } else if(typeof url == "boolean") {
        toDecode = url;
        url = window.location.href;
    }
    //
    url = decodeURI(url);
    //
    var result = {};
    var colonIndex = url.indexOf("://");
    var remainUrl = null;
    if(colonIndex != -1) {
        result.scheme = url.substring(0, colonIndex);
        var slashIndex1 = colonIndex + 3;
        var slashIndex2 = url.indexOf("/", slashIndex1);
        var serverPart = url.substring(slashIndex1, slashIndex2);
        var portIndex = serverPart.indexOf(":");
        result.host = portIndex != -1 ? serverPart.substring(0, portIndex) : serverPart;
        result.port = portIndex != -1 ? parseInt(serverPart.substring(portIndex + 1), 10) : 80;
        remainUrl = url.substring(slashIndex2);
    } else {
        remainUrl = url;
    }
    //
    var fragIndex = remainUrl.indexOf("#");
    if(fragIndex != -1) {
        result.url = remainUrl.substring(0, fragIndex);
        var fragStr = remainUrl.substring(fragIndex).replace(/^[^#]*#?(.*)$/, '$1').trim();
        result.hash = fragStr;
        result.frags = {};
        if(fragStr !== "") {
            var frags = fragStr.split("&");
            for(var i = 0, j = frags.length; i < j; i++) {
                var nameValue = frags[i].split("=");
                var xName = toDecode ? decodeURIComponent(nameValue[0]) : nameValue[0];
                var xValue = toDecode ? decodeURIComponent(nameValue[1]) : nameValue[1];
                result.frags[xName] = xValue;
            }
        }
        //
        remainUrl = remainUrl.substring(0, fragIndex);
    } else {
        result.url = remainUrl;
    }
    //
    var flagStart = remainUrl.indexOf("?");
    result.uri = flagStart == -1 ? remainUrl : remainUrl.substring(0, flagStart);
    var paramStart = flagStart == -1 ? -1 : flagStart + 1;
    //
    result.params = {};
    if(paramStart != -1) {
        var paramStr = remainUrl.substring(paramStart).trim();
        var params = paramStr.length > 0 ? paramStr.split("&") : [];

        for(var i = 0, j = params.length; i < j; i++) {
            var nameValue = params[i].split("=");
            var xName = toDecode ? decodeURIComponent(nameValue[0]) : nameValue[0];
            var xValue = toDecode ? decodeURIComponent(nameValue[1]) : nameValue[1];
            result.params[xName] = xValue;
        }
    }
    // alert(JSON.encode(result));
    return result;
}

// extractUrlParams("url") => {json};
function extractUrlParams(url, toDecode) {
    return parseUrl(url, toDecode).params;
}

/**
 * 把参数map对象追加到baseUrl后，形成新的url
 */
function concatUrlParams(baseUrl, params, toEncode) {
    if(params == null) {
        return baseUrl;
    }
    var fragStr = null;
    var fragIndex = baseUrl.indexOf("#");
    if(fragIndex != -1) {
        fragStr = baseUrl.substring(fragIndex).replace(/^[^#]*#?(.*)$/, '$1').trim();
        fragStr = fragStr === "" ? null : fragStr;
        baseUrl = baseUrl.substring(0, fragIndex);
    }
    toEncode = toEncode === true;
    var appendStr = "";
    if(typeof params == "string") {
        appendStr = params;
    } else {
        var hasOwnProperty = Object.hasOwnProperty;
        var paramStrs = [];
        var index = 0;
        for(var attr in params) {
            if(hasOwnProperty.call(params, attr)) {
                var value = params[attr];
                if(typeof value == "function") {
                    value = value();
                }
                if(value == null) {
                    continue;
                }
                if(isArray(value)) {
                    var len = value.length;
                    for(var i = 0; i < len; i++) {
                        if(toEncode) {
                            paramStrs[index++] = encodeURIComponent(attr) + "=" + encodeURIComponent(value[i]);
                        } else {
                            paramStrs[index++] = attr + "=" + value[i];
                        }
                    }
                } else {
                    if(isDate(value)) {
                        value = value.format('yyyy-MM-dd HH:mm:ss');
                    } else if(isPlainObject(value)) {
                        value = JSON.encode(value);
                    }
                    if(toEncode) {
                        paramStrs[index++] = encodeURIComponent(attr) + "=" + encodeURIComponent(value);
                    } else {
                        paramStrs[index++] = attr + "=" + value;
                    }
                }
            }
        }
        appendStr = paramStrs.join("&");
    }
    var cntStr = "";
    if(baseUrl == null) {
        baseUrl = "";
    } else if(baseUrl.indexOf("?") == -1) {
        cntStr = "?";
    } else if(!baseUrl.endsWith("?")) {
        cntStr = "&";
    }
    return baseUrl + cntStr + appendStr + (fragStr == null ? "" : "#" + fragStr);
}

function makeUrl() {
    return concatUrlParams.apply(window, arguments);
}

// json参数转成url参数
function jsonToUrlParams(jsonParams, toEncode) {
    return concatUrlParams(null, jsonParams, toEncode);
}

// 生成唯一的请求字符串参数（不慎严密）
var __uniqueRequestName = "__Unique_Request_Id";
//
function genUniqueStr() {
    var ts = new Date().getTime();
    var randomSuffix = Math.round(Math.random() * 10000) + "_" + Math.round(Math.random() * 10000);
    return ts + "_" + randomSuffix;
}

// 给url附加唯一的参数（防止对话框缓存）
function makeUniqueRequest(url) {
    return concatUrlParams(url, __uniqueRequestName + "=" + genUniqueStr());
}

// 生成函数调用脚本（函数名称，参数数组）
// demox("x", {"x" : 5, "y" : 6})
function makeFuncCallScript(funcName, args) {
    var sb = String.builder();
    sb.append(funcName);
    sb.append("(");
    //
    if(args == null) {
        args = [];
    } else if(isPlainObject(args)) {
        args = [args];
    }
    for(var i = 0; i < args.length; i++) {
        var arg = args[i];
        var argStr = isFunction(arg) ? __stringifyJson(getFuncName(arg)) : __stringifyJson(arg);
        if(i > 0) {
            sb.append(", ");
        }
        sb.append(argStr);
    }
    sb.append(");");
    //
    // console.log(sb.value);
    return sb.value;
}

// =================================== {{ iframe 对话框传值
// ===================================
// 对话框页面参数名称（预定义）
var __dlgArgParamName = "__dlgArgName";
// ====================== 宿主页面所需代码
// 对话框（页面）参数对象
var __dlgPageArgs = {};
// 获取对话框（页面）参数（供对话框页面回调的接口）
function getDlgPageArg(argName) {
    return __dlgPageArgs[argName];
}

// 设置对话框（页面）参数（本宿主页面调用）
function setDlgPageArg(argName, argValue) {
    __dlgPageArgs[argName] = argValue || null;
}

// 组成对话框页面url（页面url + argName）
function makeDlgPageUrl(pageUrl, argName, extParams) {
    if(pageUrl.charAt(0) == "/" && typeof getAppUrl == "function") {
        pageUrl = getAppUrl(pageUrl);
    }
    var theParams = extParams == null ? {} : merge({}, extParams);
    theParams[__dlgArgParamName] = argName;
    //
    return makeUrl(pageUrl, theParams);
}

// ====================== 对话框页面所需代码
// 从宿主窗口获取参数（argName 可以忽略）
function getDlgArgForMe() {
    var hostWin = getHostWindow();
    if(hostWin == null) { // 不在iframe中
        // 返回的值为 undefined
        return;
    }
    //
    var urlParams = extractUrlParams(true);
    argName = urlParams[__dlgArgParamName];
    return hostWin.getDlgPageArg(argName);
}

// =================================== }} iframe 对话框传值
// ===================================
/**
 * Javascript open window http://www.webtoolkit.info/
 */
function openWindow(pageUrl, options) {
    var args = '';
    if(typeof(options) == 'undefined') {
        options = {};
    }
    if(typeof(options.name) == 'undefined') {
        options.name = 'win' + Math.round(Math.random() * 100000);
    }
    if(typeof(options.height) != 'undefined' && typeof(options.fullscreen) == 'undefined') {
        args += "height=" + options.height + ",";
    }
    if(typeof(options.width) != 'undefined' && typeof(options.fullscreen) == 'undefined') {
        args += "width=" + options.width + ",";
    }
    if(typeof(options.fullscreen) != 'undefined') {
        args += "width=" + screen.availWidth + ",";
        args += "height=" + screen.availHeight + ",";
    }
    if(typeof(options.center) == 'undefined') {
        options.x = 0;
        options.y = 0;
        args += "screenx=" + options.x + ",";
        args += "screeny=" + options.y + ",";
        args += "left=" + options.x + ",";
        args += "top=" + options.y + ",";
    }
    if(typeof(options.center) != 'undefined' && typeof(options.fullscreen) == 'undefined') {
        options.y = Math.floor((screen.availHeight - (options.height || screen.height)) / 2) - (screen.height - screen.availHeight);
        options.x = Math.floor((screen.availWidth - (options.width || screen.width)) / 2) - (screen.width - screen.availWidth);
        args += "screenx=" + options.x + ",";
        args += "screeny=" + options.y + ",";
        args += "left=" + options.x + ",";
        args += "top=" + options.y + ",";
    }
    if(typeof(options.scrollbars) != 'undefined') {
        args += "scrollbars=1,";
    }
    if(typeof(options.menubar) != 'undefined') {
        args += "menubar=1,";
    }
    if(typeof(options.locationbar) != 'undefined') {
        args += "location=1,";
    }
    if(typeof(options.resizable) != 'undefined') {
        args += "resizable=1,";
    }

    return window.open(pageUrl, options.name, args);
}

// ----------
// 打开html预览窗口
function openWindowForHtml(htmlStr, winName) {
    winName = winName || "html-preview";
    htmlStr = htmlStr || "";
    //
    var win = openWindow("", {
        name: winName
    });
    //
    winDoc = win.document;
    winDoc.open();
    winDoc.write(htmlStr);
    winDoc.close();
}

// 关闭当前页面窗口
function closePageWindow() {
    window.opener = null;
    window.open("", "_self");
    window.close();
}

// 简单的html转换
function escapeHtmlStr(srcStr) {
    if(srcStr == null) {
        return null;
    }
    var htmlStr = "" + srcStr;
    htmlStr = replace(htmlStr, " ", "&nbsp;");
    htmlStr = replace(htmlStr, "<", "&lt;");
    htmlStr = replace(htmlStr, ">", "&gt;");
    htmlStr = replace(htmlStr, "\n", "<br>");
    return htmlStr;
}

// 加载js文件（具有防止重复加载功能）
function loadJs(jsSrc, parent, id) {
    //loadCallback(newlyLoaded, jsUrl)
    var loadCallback = null;
    if(typeof parent == "function") {
        loadCallback = parent;
        parent = null;
    }
    //
    if(typeof parent == "string") {
        var tmpParents = document.getElementsByTagName(parent);
        if(tmpParents.length > 0) {
            parent = tmpParents[0];
        } else {
            parent = null;
        }
    }
    if(parent == null) {
        parent = document.body;
    }
    //
    if(typeof id == "function") {
        loadCallback = id;
        id = null;
    }
    //
    if(id == null) {
        // 自动生成id;
        var lastSlashIndex = jsSrc.lastIndexOf("/");
        if(lastSlashIndex == -1) {
            lastSlashIndex = jsSrc.lastIndexOf("\\");
        }
        var dotIndex = -1;
        if(lastSlashIndex == -1) {
            dotIndex = jsSrc.indexOf(".js", 0);
            if(dotIndex == -1) {
                dotIndex = jsSrc.indexOf("?", 0);
            }
        } else {
            dotIndex = jsSrc.indexOf(".js", lastSlashIndex + 1);
            if(dotIndex == -1) {
                dotIndex = jsSrc.indexOf("?", lastSlashIndex + 1);
            }
        }
        id = jsSrc;
        if(dotIndex != -1) {
            id = jsSrc.substring(0, dotIndex) + ".js";
        }
        // id = replace(id, "\" );
    }
    // console.log("script id : " + id);
    var allScripts = document.getElementsByTagName("script");
    var existedJs = null;
    for(var i = 0, c = allScripts.length; i < c; i++) {
        var tmpScript = allScripts[i];
        if(tmpScript.id == id) {
            existedJs = tmpScript;
            break;
        }
    }
    if(existedJs != null) {
        if(existedJs.src == null || existedJs.src == "") {
            if(loadCallback != null) {
                existedJs.onload = function () {
                    loadCallback(true, jsSrc);
                };
            }
            existedJs.src = jsSrc;
        } else {
            //console.log("已经加载过：" + jsSrc);
            if(loadCallback != null) {
                loadCallback(false, jsSrc);
            }
        }
        return;
    }
    //
    var script = document.createElement('script');
    script.type = 'text/javascript';
    //script.charset = 'utf-8';
    script.src = jsSrc;
    script.id = id;
    if(loadCallback != null) {
        script.onload = function () {
            loadCallback(true, jsSrc);
        };
    }
    parent.appendChild(script);
}

// 加载css文件（具有防止重复加载功能）
function loadCss(cssSrc, parent, id) {
    //loadCallback(newlyLoaded, cssUrl)
    var loadCallback = null;
    if(typeof parent == "function") {
        loadCallback = parent;
        parent = null;
    }
    //
    if(typeof parent == "string") {
        var tmpParents = document.getElementsByTagName(parent);
        if(tmpParents.length > 0) {
            parent = tmpParents[0];
        } else {
            parent = null;
        }
    }
    if(parent == null) {
        parent = document.head;
    }
    //
    if(typeof id == "function") {
        loadCallback = id;
        id = null;
    }
    //
    if(id == null) {
        // 自动生成id;
        var lastSlashIndex = cssSrc.lastIndexOf("/");
        if(lastSlashIndex == -1) {
            lastSlashIndex = cssSrc.lastIndexOf("\\");
        }
        var dotIndex = -1;
        if(lastSlashIndex == -1) {
            dotIndex = cssSrc.indexOf(".css", 0);
            if(dotIndex == -1) {
                dotIndex = cssSrc.indexOf("?", 0);
            }
        } else {
            dotIndex = cssSrc.indexOf(".css", lastSlashIndex + 1);
            if(dotIndex == -1) {
                dotIndex = cssSrc.indexOf("?", lastSlashIndex + 1);
            }
        }
        id = cssSrc;
        if(dotIndex != -1) {
            id = cssSrc.substring(0, dotIndex) + ".css";
        }
        // id = replace(id, "\" );
    }
    // console.log("link css id : " + id);
    var allLinks = document.getElementsByTagName("link");
    var existedCss = null;
    for(var i = 0, c = allLinks.length; i < c; i++) {
        var tmpLink = allLinks[i];
        if(tmpLink.id == id) {
            existedCss = tmpLink;
            break;
        }
    }
    if(existedCss != null) {
        if(existedCss.href == null || existedCss.href == "") {
            if(loadCallback != null) {
                existedCss.onload = function () {
                    loadCallback(true, cssSrc);
                };
            }
            existedCss.href = cssSrc;
        } else {
            //console.log("已经加载过：" + cssSrc);
            if(loadCallback != null) {
                loadCallback(false, cssSrc);
            }
        }
        return;
    }
    //
    var link = document.createElement('link');
    link.type = "text/css";
    //link.charset = 'utf-8';
    link.rel = 'stylesheet';
    link.id = id;
    link.href = cssSrc;
    if(loadCallback != null) {
        link.onload = function () {
            loadCallback(true, cssSrc);
        };
    }
    parent.appendChild(link);
}

// 提取文件名部分
// /opt/data/aaa-bbb.jpg >> aaa-bbb.jpg
function extractShortFileName(filePath) {
    if(isNoB(filePath)) {
        return "";
    }
    // check for Unix-style path
    var pos = filePath.lastIndexOf("/");
    if(pos == -1) {
        // check for Windows-style path
        pos = filePath.lastIndexOf("\\");
    }
    if(pos != -1) {
        // any sort of path separator found
        return filePath.substring(pos + 1);
    } else {
        // plain name
        return filePath;
    }
}

// 提取文件扩展名
// /opt/data/aaa-bbb.jpg >> .jpg
function extractFileNameExt(fileName) {
    if(isNoB(fileName)) {
        return "";
    }
    var dotIndex = fileName.lastIndexOf('.');
    return dotIndex == -1 ? "" : fileName.substring(dotIndex);
}

// 判断给定的文件名是否图片文件
function isImageFile(fileName) {
    var suffix = extractFileNameExt(fileName).toLowerCase();
    return suffix.isIn(".gif", ".png", ".jpg", ".jpeg", ".bmp", ".ico");
}

function isImageType(fileType) {
    return fileType.startsWith("image/");
}

// 给文件名追加字符串
// (/opt/data/aaa-bbb.jpg , -m ) >> /opt/data/aaa-bbb-m.jpg
function addFileNamePart(orgFileName, partToAdd) {
    var parentPath = null;
    var pathSep = "/";
    var pos = orgFileName.lastIndexOf(pathSep);
    if(pos == -1) {
        pathSep = "\\";
        // check for Windows-style path
        pos = orgFileName.lastIndexOf(pathSep);
    }
    if(pos != -1) {
        parentPath = orgFileName.substring(0, pos);
    }
    //
    var shortFileName = extractShortFileName(orgFileName);
    var fileNameExt = extractFileNameExt(shortFileName);
    if(fileNameExt == "") {
        return (parentPath == null ? "" : parentPath + pathSep) + shortFileName + partToAdd;
    }
    //
    var extIndex = shortFileName.lastIndexOf(fileNameExt);
    var noExtFileName = shortFileName.substring(0, extIndex);
    return (parentPath == null ? "" : parentPath + pathSep) + noExtFileName + partToAdd + fileNameExt;
}

// 常见邮箱登录url
var __mailboxHomeUrls = {
    // 网易邮箱
    "@163.com": "http://mail.163.com/",
    "@126.com": "http://mail.126.com/",
    "@yeah.net": "http://mail.yeah.net/",
    "@vip.163.com": "http://vip.163.com/",
    // 腾讯邮箱
    "@qq.com": "https://mail.qq.com/cgi-bin/loginpage",
    // 新浪邮箱
    "@sina.com": "http://mail.sina.com.cn/",
    "@sina.cn": "http://mail.sina.com.cn/",
    "@vip.sina.com": "http://vip.sina.com.cn/",
    // 搜狐邮箱
    "@sohu.com": "http://mail.sohu.com/",
    // 微软邮箱
    "@hotmail.com": "https://login.live.com/",
    "@live.com": "https://login.live.com/",
    "@live.cn": "https://login.live.com/",
    "@msn.com": "https://login.live.com/",
    // 189邮箱(电信)
    "@189.cn": "http://webmail30.189.cn/w2/",
    // 139邮箱（移动）
    "@139.com": "http://mail.10086.cn/",
    // tom邮箱
    "@tom.com": "http://web.mail.tom.com/webmail/login/index.action",
    // 21cn邮箱
    "@21cn.com": "http://mail.21cn.com/w2/"
};
// 获取邮箱的登录url
function getMailHomeUrl(email) {
    if(!isValidEmail(email)) {
        return null;
    }
    var mailBox = email.substring(email.indexOf("@"));
    return __mailboxHomeUrls[mailBox];
}

/**
 * 获取密码文本的强度 返回 => W : weak 弱, M : middle 中, S : strong 强
 */
function getPasswordStrength(password) {
    if(isNoB(password)) {
        return null;
    }
    if(password.length >= 6) {
        if(/[a-zA-Z]+/.test(password) && /[0-9]+/.test(password) && /\W+\D+/.test(password)) {
            return "S";
        } else if(/[a-zA-Z]+/.test(password) || /[0-9]+/.test(password) || /\W+\D+/.test(password)) {
            if(/[a-zA-Z]+/.test(password) && /[0-9]+/.test(password)) {
                return "M";
            } else if(/\[a-zA-Z]+/.test(password) && /\W+\D+/.test(password)) {
                return "M";
            } else if(/[0-9]+/.test(password) && /\W+\D+/.test(password)) {
                return "M";
            } else {
                return "W";
            }
        }
    }
    return null;
}

/**
 * var initTrackInfo = { id : "hotspot-1", //初始相对于图片的位置(rect，类似于 image-map) left : 210, top : 1010, width : 236, height : 78, //图片大小信息（像素） refId : "image-1", refWidth :640, refHeight : 1138 };
 * 自动计算（跟踪）图片中原来的(rect)位置在图片缩放后的新位置
 *
 * @param initTrackInfo
 * @returns {json: {left, top, width, height}}
 */
function calcTrackerDim(initTrackInfo) {
    var xLeft, xTop, xWidth, xHeight;
    var refObj = $("#" + initTrackInfo.refId);
    var left = refObj.offset().left;
    var top = refObj.offset().top;
    var width = refObj.width();
    var height = refObj.height();
    //
    xTop = height / initTrackInfo.refHeight * initTrackInfo.top + top;
    xLeft = width / initTrackInfo.refWidth * initTrackInfo.left + left;
    xWidth = width / initTrackInfo.refWidth * (initTrackInfo.left + initTrackInfo.width) + left - xLeft;
    xHeight = height / initTrackInfo.refHeight * (initTrackInfo.top + initTrackInfo.height) + top - xTop;
    return {
        left: Math.round(xLeft),
        top: Math.round(xTop),
        width: Math.round(xWidth),
        height: Math.round(xHeight)
    };
}
// 条件监视器（定时检查给定的条件，然后执行指定的函数）
function CondMonitor(name) {
    var _name = name || "CondMonitor" + genUniqueStr();
    var _interval = 10;
    var _evalExpr = null;
    var _execFunc = null;
    var _timeout = -1;
    var _timeoutHandler = null;
    //
    var _timer = null;
    var _startTime = 0;
    var _times = 0;
    //
    this.interval = function (interval) {
        if(typeof interval == "number" && interval > 0) {
            _interval = interval;
        }
        //
        return this;
    };
    //
    this.timeout = function (timeout, timeoutHandler) {
        if(typeof timeout == "number" && timeout > 0) {
            _timeout = timeout;
        }
        if(typeof timeoutHandler == "function") {
            _timeoutHandler = timeoutHandler;
        }
        //
        return this;
    };
    //
    this.when = function (evalExpr) {
        if(evalExpr != null) {
            _evalExpr = evalExpr;
        }
        //
        return this;
    };
    //
    this.then = function (execFunc) {
        if(typeof execFunc == "function") {
            _execFunc = execFunc;
        }
        //
        return this;
    };
    //
    this.start = function () {
        if(_timer != null) {
            clearInterval(_timer);
        }
        _times = 0;
        //
        if(_evalExpr == null || _execFunc == null) {
            console.error(_name + ">> 请先设置when(...)条件 和 执行then(...)函数");
            //
            return this;
        }
        //
        var proxyFunc = _evalExpr;
        if(typeof _evalExpr != "function") {
            proxyFunc = function () {
                return eval(_evalExpr) == true;
            };
        }
        //
        _timer = setTimeout(function () {
            _times++;
            //
            // console.log(_name + ">> 正在执行第 " + _times + "次条件检查...");
            if(proxyFunc() == true) {
                // console.log(_name + ">> 条件已满足");
                _execFunc();
                //
                return;
            }
            if(_timeout > 0) {
                var curTime = new Date().getTime();
                if(curTime - _startTime >= _timeout) {
                    if(_timeoutHandler != null) {
                        _timeoutHandler();
                    } else {
                        console.warn(_name + ">> 超时已取消执行");
                    }
                    //
                    return;
                }
            }
            //
            _timer = setTimeout(arguments.callee, _interval);
        }, _interval);
        //
        _startTime = new Date().getTime();
        //
        return this;
    };
}
//
CondMonitor.newOne = function (name) {
    return new CondMonitor(name);
};

// 解决部分刷新问题
function asTimeout(func, timeout) {
    if(typeof timeout !== "number") {
        timeout = 0;
    }
    //
    setTimeout(func, timeout);
}

// 文件下载---------------------------------------------------------
var __fileDownloaderCtrlPrefix = "-file-downloader-ctrl-";
//
function downloadFile(linkCtrlOrUrl, params) {
    if(linkCtrlOrUrl == null) {
        return false;
    }
    var targetIframeDivId = __fileDownloaderCtrlPrefix + "div";
    var targetIframeDiv = document.getElementById(targetIframeDivId);
    if(targetIframeDiv == null) {
        targetIframeDiv = document.createElement("div");
        targetIframeDiv.style.display = "none";
        targetIframeDiv.id = targetIframeDivId;
        targetIframeDiv.style.position = "absolute";
        targetIframeDiv.style.left = "-9999";
        targetIframeDiv.style.top = "-9999";
        targetIframeDiv.style.width = "1px";
        targetIframeDiv.style.height = "1px";
        targetIframeDiv = document.body.appendChild(targetIframeDiv);
    }
    targetIframeDiv.style.display = "none";
    //
    var targetIframeName = __fileDownloaderCtrlPrefix + "iframe";
    var targetIframe = document.getElementById(targetIframeName);
    if(targetIframe == null) {
        var html = "<iframe id='" + targetIframeName + "' name='" + targetIframeName + "' src='about:blank' style='display:none;position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;'></iframe>";
        targetIframeDiv.innerHTML = html;
        targetIframe = document.getElementById(targetIframeName);
    } else {
        targetIframe.src = "about:blank";
    }
    //
    var baseUrl = null;
    var linkCtrl = linkCtrlOrUrl;
    //
    if(typeof linkCtrlOrUrl == "string") {
        linkCtrl = document.getElementById(linkCtrlOrUrl);
    }
    if(linkCtrl == null) {
        baseUrl = linkCtrlOrUrl;
    } else {
        baseUrl = linkCtrl.href;
        linkCtrl.target = targetIframeName;
    }
    params = params || {};
    // 强制下载文本标记
    if(typeof params["downloadText"] == "undefined") {
        params["downloadText"] = true;
    }
    if(params["failMsgCallback"] == null) {
        params["failMsgCallback"] = "showFailDownloadMsg";
    }
    var fullUrl = concatUrlParams(baseUrl, params);
    targetIframe.src = fullUrl;
    //
    return false;
}

function downloadLink(link) {
    return downloadFile(link, {
        failMsgCallback: "showFailDownloadMsg"
    });
}

var ValidateRules = {
    required: function (value) {
        // 是否为空白字符串
        return value != null && trim(value + "") != '';
    },
    eqLength: function (value, eqLen) {
        // 文本长度是否相等
        eqLen = ParseInt(eqLen);
        return (value != null) ? (value.length == eqLen) : false;
    },
    minLength: function (value, minLen) {
        // 是否满足最小长度
        minLen = ParseInt(minLen);
        return (value != null) ? (value.length >= minLen) : false;
    },
    maxLength: function (value, maxLen) {
        // 是否满足最小长度
        maxLen = ParseInt(maxLen);
        return (value != null) ? (value.length <= maxLen) : false;
    },
    rangeLength: function (value, minLen, maxLen) {
        // 长度是否在给定的范围内（如：[6,16]）
        var minLen = ParseInt(minLen);
        var maxLen = ParseInt(maxLen);
        return (value != null) ? (value.length >= minLen && value.length <= maxLen) : false;
    },
    minValue: function (value, minVal) {
        // 是否满足最小值
        value = ParseFloat(value);
        minVal = ParseFloat(minVal);
        return isNum(value) ? value >= minVal : false;
    },
    maxValue: function (value, maxVal) {
        // 是否满足最大值
        value = ParseFloat(value);
        maxVal = ParseFloat(maxVal);
        return isNum(value) ? value <= maxVal : false;
    },
    rangeValue: function (value, minVal, maxVal) {
        // 数值是否在给定的范围内（如：[-20, 100]）
        value = ParseFloat(value);
        minVal = ParseFloat(minVal);
        maxVal = ParseFloat(maxVal);
        return isNum(value) ? (value >= minVal && value <= maxVal) : false;
    },
    isDate: function (value) {
        // 是否为日期时间格式
        return Date.isValidDate(value);
    },
    isTime: function (value) {
        // 是否为时间格式
        if(!isString(value)) {
            return false;
        }
        var nowDateStr = new Date().format("yyyy-MM-dd");
        var timeStr = nowDateStr + " " + value;
        return Date.isValidDate(timeStr);
    },
    minDate: function (value, minDate) {
        // 日期是否满足最小日期
        var isDate = Date.isValidDate(value);
        if(!isDate) {
            return false;
        } else {
            var date = Date.parseAsDate(value);
            minDate = Date.parseAsDate(minDate);
            return date >= minDate;
        }
    },
    maxDate: function (value, maxDate) {
        // 日期是否满足最大日期
        var isDate = Date.isValidDate(value);
        if(!isDate) {
            return false;
        } else {
            var date = Date.parseAsDate(value);
            maxDate = Date.parseAsDate(maxDate);
            return date <= maxDate;
        }
    },
    rangeDate: function (value, minDate, maxDate) {
        // 日期是否满足给定日期范围
        var isDate = Date.isValidDate(value);
        if(!isDate) {
            return false;
        } else {
            var date = Date.parseAsDate(value);
            minDate = Date.parseAsDate(minDate);
            maxDate = Date.parseAsDate(maxDate);
            return date >= minDate && date <= maxDate;
        }
    },
    rangeTime: function (value, minTime, maxTime) {
        // 时间是否满足给定日期范围
        var nowDateStr = new Date().format("yyyy-MM-dd");
        var date = Date.parseAsDate(nowDateStr + " " + value);
        var minDate = Date.parseAsDate(nowDateStr + " " + minTime);
        var maxDate = Date.parseAsDate(nowDateStr + " " + maxTime);
        return date >= minDate && date <= maxDate;
    },
    inList: function (value, items) {
        // 是否为列表项之一
        return (value != null) ? value.isIn(items) : false;
    },
    isMobile: function (value, sysAdminName) {
        sysAdminName == null || 'sysadmin';
        // 是否为手机号码
        return isMobile(value) || sysAdminName == value;
    },
    isTel: function (value) {
        // 是否为座机号码
        return isTelNo(value);
    },
    isPhone: function (value) {
        // 是否为手机或座机号码
        return isPhoneNo(value);
    },
    isMoney: function (value, allowSign) {
        // 是否为金额字符串
        allowSign = (allowSign == null) ? false : (allowSign == true);
        return isMoneyStr(value, allowSign);
    },
    isInt: function (value) {
        // 是否为整数
        return isIntStr(value);
    },
    isNatual: function (value) {
        // 是否为自然数
        return isNatualStr(value);
    },
    isDigits: function (value) {
        // 是否为数字字符串
        return isDigitsStr(value);
    },
    isDigitsOrHyphen: function (value) {
        // 是否为数字和-组成的字符串
        return isDigitsOrHyphenStr(value);
    },
    isEmail: function (value) {
        // 是否为邮箱
        return isValidEmail(value);
    },
    isHexColor: function (value) {
        // 是否为16进制颜色值
        return isHexColor(value);
    },
    isNum: function (value) {
        // 是否为数值字符串
        var numVal = ParseFloat(value);
        return numVal == value && isNum(numVal);
    },
    isPswd: function (value, strict) {
        strict = strict == "true";
        // 验证密码
        return checkPassword(value, strict) == null;
    },
    isIdNo: function (code) {
        //身份证号码
        return isIdentity(code);
    }
};

// 浏览器信息
var Browser = {};
(function () {

    if(isInBrowser) {
        Browser.appName = navigator.appName;
        Browser.name = Browser.appName;
        var userAgent = navigator.userAgent;
        Browser.userAgent = userAgent;
        Browser.mozilla = false;
        Browser.webkit = false;
        Browser.opera = false;
        Browser.safari = false;
        Browser.chrome = false;
        Browser.msie = false;
        Browser.android = false;
        Browser.blackberry = false;
        Browser.ios = false;
        Browser.operaMobile = false;
        Browser.windowsMobile = false;
        Browser.mobile = false;
        Browser.envName = "";
        //
        Browser.fullVersion = '' + parseFloat(navigator.appVersion);
        Browser.majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;
        // In Opera, the true version is after "Opera" or after "Version"
        if((verOffset = userAgent.indexOf("Opera")) != -1) {
            Browser.opera = true;
            Browser.name = "Opera";
            Browser.fullVersion = userAgent.substring(verOffset + 6);
            if((verOffset = userAgent.indexOf("Version")) != -1) {
                Browser.fullVersion = userAgent.substring(verOffset + 8);
            }
        }
        // In MSIE < 11, the true version is after "MSIE" in userAgent
        else if((verOffset = userAgent.indexOf("MSIE")) != -1) {
            Browser.msie = true;
            Browser.name = "Microsoft Internet Explorer";
            Browser.fullVersion = userAgent.substring(verOffset + 5);
        }
        // In TRIDENT (IE11) => 11, the true version is after "rv:" in userAgent
        else if(userAgent.indexOf("Trident") != -1) {
            Browser.msie = true;
            Browser.name = "Microsoft Internet Explorer";
            var start = userAgent.indexOf("rv:") + 3;
            var end = start + 4;
            Browser.fullVersion = userAgent.substring(start, end);
        }
        // In Chrome, the true version is after "Chrome"
        else if((verOffset = userAgent.indexOf("Chrome")) != -1) {
            Browser.webkit = true;
            Browser.chrome = true;
            Browser.name = "Chrome";
            Browser.fullVersion = userAgent.substring(verOffset + 7);
        }
        // In Safari, the true version is after "Safari" or after "Version"
        else if((verOffset = userAgent.indexOf("Safari")) != -1) {
            Browser.webkit = true;
            Browser.safari = true;
            Browser.name = "Safari";
            Browser.fullVersion = userAgent.substring(verOffset + 7);
            if((verOffset = userAgent.indexOf("Version")) != -1) {
                Browser.fullVersion = userAgent.substring(verOffset + 8);
            }
        }
        // In Safari, the true version is after "Safari" or after "Version"
        else if((verOffset = userAgent.indexOf("AppleWebKit")) != -1) {
            Browser.webkit = true;
            Browser.name = "Safari";
            Browser.fullVersion = userAgent.substring(verOffset + 7);
            if((verOffset = userAgent.indexOf("Version")) != -1) {
                Browser.fullVersion = userAgent.substring(verOffset + 8);
            }
        }
        // In Firefox, the true version is after "Firefox"
        else if((verOffset = userAgent.indexOf("Firefox")) != -1) {
            Browser.mozilla = true;
            Browser.name = "Firefox";
            Browser.fullVersion = userAgent.substring(verOffset + 8);
        }
        // In most other browsers, "name/version" is at the end of userAgent
        else if((nameOffset = userAgent.lastIndexOf(' ') + 1) < (verOffset = userAgent.lastIndexOf('/'))) {
            Browser.name = userAgent.substring(nameOffset, verOffset);
            Browser.fullVersion = userAgent.substring(verOffset + 1);
            if(Browser.name.toLowerCase() == Browser.name.toUpperCase()) {
                Browser.name = navigator.appName;
            }
        }
        /* Check all mobile environments */
        Browser.android = (/Android/i).test(userAgent);
        Browser.blackberry = (/BlackBerry/i).test(userAgent);
        Browser.ios = (/iPhone|iPad|iPod/i).test(userAgent);
        Browser.operaMobile = (/Opera Mini/i).test(userAgent);
        Browser.windowsMobile = (/IEMobile/i).test(userAgent);
        Browser.mobile = Browser.android || Browser.blackberry || Browser.ios || Browser.windowsMobile || Browser.operaMobile;
        // trim the fullVersion string at semicolon/space if present
        if((ix = Browser.fullVersion.indexOf(";")) != -1) {
            Browser.fullVersion = Browser.fullVersion.substring(0, ix);
        }
        if((ix = Browser.fullVersion.indexOf(" ")) != -1) {
            Browser.fullVersion = Browser.fullVersion.substring(0, ix);
        }
        Browser.majorVersion = parseInt('' + Browser.fullVersion, 10);
        if(isNaN(Browser.majorVersion)) {
            Browser.fullVersion = '' + parseFloat(navigator.appVersion);
            Browser.majorVersion = parseInt(navigator.appVersion, 10);
        }
        Browser.version = Browser.majorVersion;
        //
        if(userAgent.indexOf("QQ/") != -1) {
            Browser.envName = "QQ";
        } else if(userAgent.indexOf("MicroMessenger/") != -1) {
            Browser.envName = "WX";
        }
    }

})();

/**
 * 判断是否在微信浏览器中
 */
function isWeiXinEnv() {
    return Browser.envName === "WX";
}

module.exports = {
    moduleName: moduleName,
    //
    StringBuilder: StringBuilder,
    //
    isString: isString,
    isNumber: isNumber,
    isBoolean: isBoolean,
    isFunction: isFunction,
    isDate: isDate,

    isPlainObject: isPlainObject,
    isEmptyObject: isEmptyObject,

    isIntStr: isIntStr,
    isNatualStr: isNatualStr,
    isMoneyStr: isMoneyStr,
    isValidEmail: isValidEmail,
    isMobile: isMobile,
    isTelNo: isTelNo,
    isPhoneNo: isPhoneNo,
    isHexColor: isHexColor,
    isIdentity: isIdentity,
    checkPassword: checkPassword,
    getPasswordStrength: getPasswordStrength,

    ValidateRules: ValidateRules,

    replace: replace,
    merge: merge,
    moveArrayElementsAt: moveArrayElementsAt,
    compareArrays: compareArrays,
    makeDiffHoursStr: makeDiffHoursStr,
    sortByKey: sortByKey,
    asTimeout: asTimeout,
    repeatChecker: repeatChecker,

    KeyMap: KeyMap,
    LimitedQueue: LimitedQueue,
    TaskDelayer: TaskDelayer,
    CondMonitor: CondMonitor,
    makeCrossCombsFor: makeCrossCombsFor,

    getPageInfo: getPageInfo,
    setPageTitle: setPageTitle,
    setPageUrl: setPageUrl,
    openWindowForHtml: openWindowForHtml,
    escapeHtmlStr: escapeHtmlStr,
    calcTrackerDim: calcTrackerDim,

    loadJs: loadJs,
    loadCss: loadCss,

    extractShortFileName: extractShortFileName,
    extractFileNameExt: extractFileNameExt,

    isImageFile: isImageFile,
    isImageType: isImageType,

    addFileNamePart: addFileNamePart,
    getMailHomeUrl: getMailHomeUrl,

    genUniqueStr: genUniqueStr,
    makeUniqueRequest: makeUniqueRequest,
    makeUrl: makeUrl,
    parseUrl: parseUrl,
    extractUrlParams: extractUrlParams,
    jsonToUrlParams: jsonToUrlParams,

    getServerBase: getServerBase,
    getServerBasedUrl: getServerBasedUrl,
    getWebSocket: getWebSocket,

    base64StrToDataURL: base64StrToDataURL,
    playAudio: playAudio,
    speakText: speakText,

    Browser: Browser
};