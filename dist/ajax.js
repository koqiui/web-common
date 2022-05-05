/**
 * Created by koqiui on 2017-04-09.
 */
(function (global, factory) {
    var theExports = null;
    var hasModuleExports = false;
    if(typeof module === "object" && typeof module.exports === "object") {
        theExports = module.exports;
        hasModuleExports = true;
    }
    else {//导出为模块
        theExports = global['Ajax'] = {};
    }
    factory(theExports, hasModuleExports);
}(typeof window !== "undefined" ? window : this, function (exports, hasModuleExports) {
    exports.__name__ = 'Ajax';
    //
    if(hasModuleExports) {
        console && console.log('以模块方式导入[' + exports.__name__ + ']');
    }
    else {
        console && console.log('以普通方式引入[' + exports.__name__ + ']');
    }
    //---------------------------------------------------------------------------------
    var utils = hasModuleExports ? require('./utils') : window['Utils'];
    var jquery = hasModuleExports ? require('jquery') : window['jQuery'];
    //---------------------------------------------------------------------------------
    var __ajaxDebug = false;
    var __ajaxSetted = false;
    var __ajaxBaseUrl = "";
    var __ajaxTimeout = 0;
    var __ajaxPageTokenName = '';
    var __ajaxParamsFilter = null;
    var __ajaxBeforeSendCallback = null;
    var __ajaxAfterRecvCallback = null;
    var __ajaxErrorCallbck = function (errMsg) {
        console.error(errMsg);
    };

    //
    function AjaxCoreFn() {
        var THIS = this;
        //
        var _baseUrl = __ajaxBaseUrl;
        var _cache = false;
        var _async = true;
        var _method = "GET";
        var _url = "";
        // 发送的数据类型: contentType
        var _contentType = "application/json";
        // 返回的数据类型: dataType
        var _resultType = "json";
        //
        var _header = {};
        var _params = {};
        var _data = {};
        var _timeout = __ajaxTimeout;
        //
        var _beforeSendCallback = null;
        var _doneHandler = null;
        var _failHandler = null;
        var _failMessage = null;
        var _statusHandler = {};
        var _statusMessage = {};
        //
        var _alwaysHandler = null;
        //
        var _triggerStates = {};
        //
        var _jqXHR = null;

        // clean
        function destroyThis(ajaxConf) {
            if(ajaxConf) {
                for(var key in ajaxConf) {
                    delete ajaxConf[key];
                }
                ajaxConf = null;
            }
            //
            for(var key in THIS) {
                delete THIS[key];
            }
            THIS = null;
            _jqXHR = null;
            //
            _baseUrl = null;
            _header = null;
            _params = null;
            _data = null;
            _beforeSendCallback = null;
            _doneHandler = null;
            _failHandler = null;
            _alwaysHandler = null;
            for(var key in _statusHandler) {
                delete _statusHandler[key];
            }
            _statusMessage = null;
            _triggerStates = null;
            //
            //console.log('ajax destroied');
        }

        // var logger = console && console.log ? console.log : null;
        this.baseUrl = function (baseUrl) {
            _baseUrl = baseUrl || "";
            //
            return this;
        };
        //
        this.get = function (url) {
            _method = "GET";
            //
            _url = url;
            //
            return this;
        };
        this.post = function (url) {
            _method = "POST";
            //
            _url = url;
            //
            return this;
        };
        this.put = function (url) {
            _method = "PUT";
            //
            _url = url;
            //
            return this;
        };
        //支持多次设置（融合模式）
        this.header = function (header) {
            header = header || {};
            //
            if(_jqXHR == null) {
                _header = utils.merge(_header, header);
            }
            else { //已经发出请求（设置_header已无效）
                for(var name in header) {
                    var value = header[name];
                    _jqXHR.setRequestHeader(name, value);
                }
            }
            //
            return this;
        };
        this.params = function (params) {
            _params = params || {};
            //
            return this;
        };
        this.data = function (data) {
            _data = data || {};
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
        //callback(jqXHR, this)
        this.beforeSend = function (callback) {
            _beforeSendCallback = callback;
            //
            return this;
        };
        // 结果处理
        //callback(data, jqXHR)
        this.done = function (callback) {
            _doneHandler = callback;
            //
            return this;
        };
        //callback(errInfo, jqXHR, status)
        this.fail = function (callback) {
            if(utils.isString(callback)) {
                _failMessage = callback;
            }
            else {
                _failHandler = callback;
            }
            //
            return this;
        };
        //callback(jqXHR)
        this.always = function (callback) {
            _alwaysHandler = callback;
            //
            return this;
        };
        //callback(errInfo, jqXHR, status)
        this.onStatus = function (status, callback) {
            if(utils.isString(callback)) {
                _statusMessage[status] = callback;
            }
            else {
                _statusHandler[status] = callback;
            }
            //
            return this;
        };
        this.on400 = function (callback) {
            return this.onStatus(400, callback);
        };
        this.on401 = function (callback) {
            return this.onStatus(401, callback);
        };
        this.on402 = function (callback) {
            return this.onStatus(402, callback);
        };
        this.on403 = function (callback) {
            return this.onStatus(403, callback);
        };
        this.on404 = function (callback) {
            return this.onStatus(404, callback);
        };
        this.on405 = function (callback) {
            return this.onStatus(405, callback);
        };
        this.on500 = function (callback) {
            return this.onStatus(500, callback);
        };
        this.on502 = function (callback) {
            return this.onStatus(502, callback);
        };
        this.on503 = function (callback) {
            return this.onStatus(503, callback);
        };
        this.on504 = function (callback) {
            return this.onStatus(504, callback);
        };
        //event:done, fail, always
        this.trigger = function (event, result, jqXHR) {
            _jqXHR = null; // clear !!!
            //
            if(event == "done") {
                if(typeof _doneHandler == "function") {
                    _triggerStates["done"] = true;
                    _doneHandler(result, jqXHR);
                }
            }
            else if(event == "fail") {
                if(typeof _failHandler == "function") {
                    _triggerStates["fail"] = true;
                    _failHandler(result, jqXHR);
                }
            }
            else if(event == "always") {
                if(typeof _alwaysHandler == "function") {
                    _triggerStates["always"] = true;
                    _alwaysHandler(jqXHR);
                }
            }
        };

        //
        function sendRequest() {
            var url = _url;
            if(_baseUrl && !url.startsWith("http")) {
                url = _baseUrl + url;
            }
            if(__ajaxPageTokenName) {//解析并添加页面token
                var urlParams = utils.extractUrlParams();
                var pageTokenValue = urlParams[__ajaxPageTokenName] || null;
                if(pageTokenValue) {
                    _params[__ajaxPageTokenName] = pageTokenValue;
                }
            }
            if(__ajaxParamsFilter) {
                _params = __ajaxParamsFilter(_params);
            }
            //
            url = utils.makeUrl(url, _params, true);
            //
            var ajaxConf = {
                cache: _cache,
                async: _async,
                type: _method,
                url: url,
                dataType: _resultType
            };
            //
            var data = _data;
            if(_method != 'GET') {
                ajaxConf.contentType = _contentType;
                //
                if(_contentType.endsWith("/json")) {
                    data = JSON.encode(data);
                }
                //
                ajaxConf.data = data;
            }
            if(typeof _timeout == "number" && _timeout > 0) {
                ajaxConf.timeout = _timeout;
            }
            //
            ajaxConf.headers = _header;
            //
            ajaxConf.beforeSend = function (jqXHR) {
                _jqXHR = jqXHR; // cache !!!
                //
                var continueIt = true;
                if(typeof __ajaxBeforeSendCallback == 'function') {
                    continueIt = __ajaxBeforeSendCallback(jqXHR, THIS);
                }
                if(continueIt !== false && typeof _beforeSendCallback == 'function') {
                    continueIt = _beforeSendCallback(jqXHR, THIS);
                }
                //
                if(continueIt === false) {
                    return false;
                }
            };
            //
            if(__ajaxDebug) {
                console.log(ajaxConf);
            }
            //
            var ajax = jquery.ajax(ajaxConf);
            //jqXHR.done(function( data, textStatus, jqXHR ) {})
            ajax.done(function (data, type, jqXHR) {
                if(typeof __ajaxAfterRecvCallback == 'function') {
                    __ajaxAfterRecvCallback(data, jqXHR);
                }
                //
                if(typeof _doneHandler == "function") {
                    if(_triggerStates["done"] !== true) {
                        _doneHandler(data, jqXHR);
                    }
                }
            });
            //jqXHR.fail(function( jqXHR, textStatus, errorThrown ) {})
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
                }
                catch(ex) {
                    //
                }
                if(errInfo.message == "error") {
                    errInfo.message = "未知错误";
                }
                var status = jqXHR.status;
                if(typeof status == 'undefined') {
                    status = jqXHR.status = 408;
                    errInfo.code = -1;
                    errInfo.message = "请求超时";
                }
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
                if(continueNext) {
                    if(_triggerStates["fail"] != true) {
                        if(_failMessage) {
                            errInfo.message = _failMessage;
                        }
                        if(_failHandler != null) {
                            _failHandler(errInfo, jqXHR, status);
                        }
                        else {
                            __ajaxErrorCallbck(errInfo.message);
                        }
                    }
                }
            });
            //
            //jqXHR.always(function( data|jqXHR, textStatus, jqXHR|errorThrown ) { })
            ajax.always(function (jqXHR, type, statusText) {
                _jqXHR = null; // clear !!!
                //
                if(_triggerStates["always"] !== true) {
                    if(_alwaysHandler != null) {
                        try {
                            _alwaysHandler(jqXHR);
                        }
                        catch(ex) {
                            console.error(ex)
                        }
                    }
                }
                //
                destroyThis(ajaxConf);
            });
        }

        //返回原生ajax
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
            this.on400(function (errInfo, jqXHR, status) {
                var errMsg = "无效/错误请求";
                //
                __ajaxErrorCallbck(errMsg);
            });
            this.on401(function (errInfo, jqXHR, status) {
                var errMsg = "未登录/未能认证";
                //
                __ajaxErrorCallbck(errMsg);
            });
            this.on402(function (errInfo, jqXHR, status) {
                var errMsg = "未授权或权限不足";
                //
                __ajaxErrorCallbck(errMsg);
            });
            this.on403(function (errInfo, jqXHR, status) {
                var errMsg = "请求的资源禁止访问";
                //
                __ajaxErrorCallbck(errMsg);
            });
            this.on404(function (errInfo, jqXHR, status) {
                var errMsg = "未找到请求的资源";
                //
                __ajaxErrorCallbck(errMsg);
            });
            this.on405(function (errInfo, jqXHR, status) {
                var errMsg = "请求的方法不被支持";
                //
                __ajaxErrorCallbck(errMsg);
            });
            this.on500(function (errInfo, jqXHR, status) {
                var errMsg = errInfo.message || "服务器繁忙";
                //
                __ajaxErrorCallbck(errMsg);
            });
            this.on502(function (errInfo, jqXHR, status) {
                var errMsg = errInfo.message || "网关未收到响应";
                //
                __ajaxErrorCallbck(errMsg);
            });
            this.on503(function (errInfo, jqXHR, status) {
                var errMsg = errInfo.message || "服务器维护中...";
                //
                __ajaxErrorCallbck(errMsg);
            });
            this.on504(function (errInfo, jqXHR, status) {
                var errMsg = errInfo.message || "网关响应接收超时";
                //
                __ajaxErrorCallbck(errMsg);
            });
        }
        //
        return this;
    }

    //----------------------------------- exports -------------------------------------
    exports.setted = function () {
        return __ajaxSetted;
    };
    exports.baseUrl = function (baseUrl) {
        __ajaxBaseUrl = baseUrl || "";
        //
        __ajaxSetted = true;
    };
    exports.timeout = function (timeout) {
        __ajaxTimeout = timeout;
    };
    exports.pageTokenName = function (pageTokenName) {
        __ajaxPageTokenName = pageTokenName || '';
    };
    exports.paramsFilter = function (paramsFilter) {
        __ajaxParamsFilter = paramsFilter || null;
    };
    //callback(errMsg)
    exports.errorCallback = function (callback) {
        if(typeof callback == 'function') {
            __ajaxErrorCallbck = callback;
        }
    };
    //callback(jqXHR, this)
    exports.beforeSend = function (callback) {
        __ajaxBeforeSendCallback = callback || null;
    };
    //callback(data, jqXHR)
    exports.afterRecv = function (callback) {
        __ajaxAfterRecvCallback = callback || null;
    };
    exports.newOne = function () {
        return new AjaxCoreFn();
    };
    exports.get = function (url) {
        return new AjaxCoreFn().get(url);
    };
    exports.post = function (url) {
        return new AjaxCoreFn().post(url);
    };
    exports.put = function (url) {
        return new AjaxCoreFn().put(url);
    };
    exports.debug = function (debugRequst) {
        __ajaxDebug = debugRequst;
    };

}));
