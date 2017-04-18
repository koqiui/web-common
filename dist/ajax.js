/**
 * Created by koqiui on 2017-04-09.
 */
var moduleName = 'Ajax';
//----------------------------------------------
var utils = require('./utils');
var axios = require('axios');
var jajax = require('jquery').ajax;

//
var __ajaxSetted = false;
var __ajaxBaseUrl = "";
var __ajaxBeforeSendCallback = null;
var __ajaxErrorCallbck = function (errMsg) {
    console.error(errMsg);
};
//
function AjaxCoreFn() {
    var _baseUrl = __ajaxBaseUrl;
    var _cache = false;
    var _async = true;
    var _type = "GET";
    var _url = "";
    // 发送的数据类型: contentType
    var _contentType = "application/json";
    // 返回的数据类型: dataType
    var _resultType = "json";
    //
    var _params = {};
    var _data = {};
    var _timeout = 0;
    //
    var _beforeSendCallback = null;
    var _doneHandler = null;
    var _failHandler = null;
    var _failMessage = null;
    var _statusHandler = {};
    var _statusMessage = {};
    //
    var _alwaysHandler = null;
    // var logger = console && console.log ? console.log : null;
    this.baseUrl = function (baseUrl) {
        _baseUrl = baseUrl || "";
        //
        return this;
    };
    //
    this.get = function (url) {
        _type = "GET";
        //
        _url = url;
        //
        return this;
    };
    this.post = function (url) {
        _type = "POST";
        //
        _url = url;
        //
        return this;
    };
    this.put = function (url) {
        _type = "PUT";
        //
        _url = url;
        //
        return this;
    };
    this.params = function (params) {
        _params = params;
        //
        return this;
    };
    this.data = function (data) {
        _data = data;
        //
        return this;
    };
    this.timeout = function (timeout) {
        _timeout = timeout;
        //
        return this;
    };
    this.sync = function () {
        _async = false;
        //
        return this;
    };
    this.cache = function () {
        _cache = true;
        //
        return this;
    };
    // 发送内容格式
    this.asJson = function () {
        _contentType = "application/json";
        //
        return this;
    };
    this.asForm = function () {
        _contentType = "application/x-www-form-urlencoded";
        //
        return this;
    };
    // 接收内容格式
    this.forJson = function () {
        _resultType = "json";
        //
        return this;
    };
    this.forHtml = function () {
        _resultType = "html";
        //
        return this;
    };
    this.forText = function () {
        _resultType = "text";
        //
        return this;
    };
    this.forXml = function () {
        _resultType = "xml";
        //
        return this;
    };
    this.beforeSend = function (callback) {
        _beforeSendCallback = callback;
        //
        return this;
    };
    // 结果处理
    this.done = function (callback) {
        _doneHandler = callback;
        //
        return this;
    };
    this.fail = function (callback) {
        if(utils.isString(callback)) {
            _failMessage = callback;
        } else {
            _failHandler = callback;
        }
        //
        return this;
    };
    this.always = function (callback) {
        _alwaysHandler = callback;
        //
        return this;
    };
    this.onStatus = function (status, callback) {
        if(utils.isString(callback)) {
            _statusMessage[status] = callback;
        } else {
            _statusHandler[status] = callback;
        }
        //
        return this;
    };
    this.on401 = function (callback) {
        return this.onStatus(401, callback);
    };
    this.on402 = function (callback) {
        return this.onStatus(402, callback);
    };
    this.on404 = function (callback) {
        return this.onStatus(404, callback);
    };
    this.on500 = function (callback) {
        return this.onStatus(500, callback);
    };
    this.on502 = function (callback) {
        return this.onStatus(502, callback);
    };
    //
    function sendRequest() {
        var url = _url;
        if(_baseUrl && !url.startsWith("http")) {
            url = _baseUrl + url;
        }
        url = utils.makeUrl(url, _params, true);
        var ajax = null;
        if(_type == "GET") {
            var ajaxConf = {
                cache: _cache,
                async: _async,
                type: _type,
                url: url,
                dataType: _resultType,
                data: _data
            };
            if(typeof _timeout == "number" && _timeout > 0) {
                ajaxConf.timeout = _timeout;
            }
            if(typeof _beforeSendCallback == "function") {
                ajaxConf.beforeSend = function (jqXHR) {
                    if(typeof __ajaxBeforeSendCallback == "function") {
                        __ajaxBeforeSendCallback(jqXHR);
                    }
                    _beforeSendCallback(jqXHR);
                };
            } else if(typeof __ajaxBeforeSendCallback == "function") {
                ajaxConf.beforeSend = function (jqXHR) {
                    __ajaxBeforeSendCallback(jqXHR);
                };
            }
            ajax = jajax(ajaxConf);
        } else {
            var data = _data;
            if(_contentType.endsWith("/json")) {
                data = JSON.encode(data);
            }
            var ajaxConf = {
                cache: _cache,
                async: _async,
                type: _type,
                url: url,
                dataType: _resultType,
                data: data,
                contentType: _contentType
            };
            if(typeof _timeout == "number" && _timeout > 0) {
                ajaxConf.timeout = _timeout;
            }
            if(typeof _beforeSendCallback == "function") {
                ajaxConf.beforeSend = function (jqXHR) {
                    if(typeof __ajaxBeforeSendCallback == "function") {
                        __ajaxBeforeSendCallback(jqXHR);
                    }
                    _beforeSendCallback(jqXHR);
                };
            } else if(typeof __ajaxBeforeSendCallback == "function") {
                ajaxConf.beforeSend = function (jqXHR) {
                    __ajaxBeforeSendCallback(jqXHR);
                };
            }
            ajax = jajax(ajaxConf);
        }
        //
        ajax.done(function (data, type, jqXHR) {
            if(typeof _doneHandler == "function") {
                _doneHandler(data, jqXHR);
            }
        });
        //
        ajax.fail(function (jqXHR, type, statusText) {
            var errInfo = {};
            errInfo.type = "error";
            errInfo.message = statusText || jqXHR.statusText;
            try {
                var responseX = jqXHR.responseJSON || JSON.decode(jqXHR.responseText);
                if(responseX != null && responseX.message) {
                    errInfo.code = responseX.code;
                    errInfo.message = responseX.message;
                }
            } catch(ex) {
                //
            }
            if(errInfo.message == "error") {
                errInfo.message = "未知错误";
            }
            var status = jqXHR.status;
            var statusHandler = _statusHandler[status];
            var continueNext = true;
            if(statusHandler != null) {
                var statusMessage = _statusMessage[status];
                if(statusMessage) {
                    errInfo.message = statusMessage;
                }
                var handleResult = statusHandler(errInfo, jqXHR, status);
                continueNext = handleResult !== false;
            }
            if(continueNext && _failHandler != null) {
                if(_failMessage) {
                    errInfo.message = _failMessage;
                }
                _failHandler(errInfo, jqXHR, status);
            }
        });
        //
        if(_alwaysHandler != null) {
            ajax.always(function (jqXHR, type, statusText) {
                _alwaysHandler(jqXHR);
            });
        }
    }

    //
    this.go = function () {
        sendRequest();
    };
    //
    {
        // 默认处理函数
        this.fail(function (errInfo, jqXHR, status) {
            var errMsg = errInfo.message || "处理失败";
            //
            __ajaxErrorCallbck(errMsg);
        });

        this.on401(function (errInfo, jqXHR, status) {
            var errMsg = errInfo.message || "未登录/未能认证";
            //
            __ajaxErrorCallbck(errMsg);
        });
        this.on402(function (errInfo, jqXHR, status) {
            var errMsg = errInfo.message || "未授权或权限不足";
            //
            __ajaxErrorCallbck(errMsg);
        });
        this.on404(function (errInfo, jqXHR, status) {
            var errMsg = errInfo.message || "未找到请求的资源";
            //
            __ajaxErrorCallbck(errMsg);
        });

        this.on500(function (errInfo, jqXHR, status) {
            var errMsg = errInfo.message || "服务器繁忙";
            //
            __ajaxErrorCallbck(errMsg);
        });
        this.on502(function (errInfo, jqXHR, status) {
            var errMsg = errInfo.message || "服务器维护中...";
            //
            __ajaxErrorCallbck(errMsg);
        });
    }
    //
    return this;
}

//
module.exports = {
    moduleName: moduleName,
    //
    axios: axios,
    jajax: jajax,

    //
    setted: function () {
        return __ajaxSetted;
    },
    baseUrl: function (baseUrl) {
        __ajaxBaseUrl = baseUrl || "";
        //
        __ajaxSetted = true;
    },
    errorCallback: function (errorCallback) {
        if(typeof errorCallback == 'function') {
            __ajaxErrorCallbck = errorCallback;
        }
    },
    beforeSend: function (callback) {
        __ajaxBeforeSendCallback = callback || null;
    },
    newOne: function () {
        return new AjaxCoreFn();
    },
    get: function (url) {
        return new AjaxCoreFn().get(url);
    },
    post: function (url) {
        return new AjaxCoreFn().post(url);
    },
    put: function (url) {
        return new AjaxCoreFn().put(url);
    }
};
