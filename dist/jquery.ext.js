/**
 * Created by koqiui on 2017-05-09.
 */
(function (global, factory) {
    var theExports = null;
    var hasModuleExports = false;
    if(typeof module === "object" && typeof module.exports === "object") {
        theExports = module.exports;
        hasModuleExports = true;
    } else {//导出为模块
        theExports = global['Jqext'] = {};
    }
    factory(theExports, hasModuleExports);
}(typeof window !== "undefined" ? window : this, function (exports, hasModuleExports) {
    exports.__name__ = 'Jqext';
    //
    if(hasModuleExports) {
        console && console.log('以模块方式导入[' + exports.__name__ + ']');
    }
    else {
        console && console.log('以普通方式引入[' + exports.__name__ + ']');
    }
    //---------------------------------------------------------------------------------
    var utils = hasModuleExports ? require('./utils') : window['Utils'];
    var $ = hasModuleExports ? require('jquery') : window['jQuery'];
    var Store = hasModuleExports ? require('store') : window['store'];
    //---------------------------------------------------------------------------------
    //$id("abc")  == $("#abc") , $id("a.b.c") == $("[id='a.b.c']")
    var __alphaPrefixReg = /^[a-zA-Z0-9_-].*/i;
    var __noneAlphaReg = /[^a-zA-Z0-9_-]+/i;
    var __classNameReg = /^\.[a-zA-Z0-9_-].*/i;

    function $id(selector) {
        if(typeof selector == "string") {
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
        if(attrName.indexOf("[") != -1 && attrName.indexOf("]") != -1) {
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
        checkEl = $id(checkEl);
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
        if(!$.colorbox) {
            utils.setPageUrl(imgSrc, '_blank');
            return;
        }
        var imgHtml = '<img src="{0}"  />'.format(imgSrc);
        var maxWidth = $(window).width() - 40;
        var maxHeight = $(window).height() - 40;
        $.colorbox({
            html: imgHtml,
            maxWidth: maxWidth,
            maxHeight: maxHeight
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
                    for(var i = 0, c = raws.length; i < c; i++) {
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
                    for(var i = 0, c = values.length; i < c; i++) {
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
    function centerInView(domId, targetView, vtAdjust) {
        var refView = targetView || window;
        var jqRefView = $id(refView);
        if(jqRefView.length != 1) {
            throw "居中参考对象必须有而且只能有一个！";
        }
        refView = jqRefView.get(0);
        vtAdjust = vtAdjust || 0;
        //
        var refLeft, refTop, refWid, refHgt;
        if(refView == window) {
            var jqDoc = $(document);
            refLeft = jqDoc.scrollLeft();
            refTop = jqDoc.scrollTop();
            refWid = jqRefView.width();
            refHgt = jqRefView.height();
        } else {
            var refOffset = jqRefView.offset();
            refLeft = refOffset.left;
            refTop = refOffset.top;
            refWid = jqRefView.width();
            refHgt = jqRefView.height();
        }
        var jqDom = $id(domId);
        var jqWid = jqDom.width();
        var jqHgt = jqDom.height();
        var offset = {
            left: refLeft + (refWid - jqWid) / 2,
            top: refTop + (refHgt - jqHgt) / 2 + vtAdjust
        };
        jqDom.css("left", "");
        jqDom.css("top", "");
        jqDom.offset(offset);
    }

    // Toast 提示
    function ToastCoreFn() {
        var THIS = this;
        var html = '<div class="toast"><span data-role="content" class="content info"></span></div>';
        var jqDom = null;
        var jqDomEl = null;
        var jqContent = null;
        var theTimer = null;
        var theCallback = null;
        var curUniqueId = null;

        //
        function createDom() {
            if(jqDom == null) {
                jqDom = $(html).appendTo(document.body);
                jqDomEl = jqDom.get(0);
                jqDom.css("display", "none");
                jqContent = jqDom.find('>span[data-role="content"]');
                //
                $(document).on("mousedown", function (event) {
                    if(event.target != jqDomEl && !$.contains(jqDomEl, event.target)) {
                        if($(jqDomEl).is(":visible")) {
                            THIS.hide();
                        }
                    }
                });
            }
        }

        // iconClass : info, warning, error
        this.show = function (msg, duration, iconClass, callback) {
            createDom();
            //
            window.clearTimeout(theTimer);
            //
            callback = callback || null;
            if(typeof iconClass == "function") {
                callback = iconClass;
                iconClass = null;
            }
            theCallback = callback;
            //
            iconClass = iconClass || "info";
            msg = msg || "";
            duration = duration || 2000;
            //
            jqContent.text(msg);
            jqContent.removeClass("info warning error");
            jqContent.addClass("content");
            jqContent.addClass(iconClass);
            //
            centerInView(jqDom, window, -20);
            //
            jqDom.show();
            //
            var uniqueId = utils.genUniqueStr();
            curUniqueId = uniqueId;
            theTimer = window.setTimeout(function () {
                THIS.hide(uniqueId);
            }, duration);
            //
            return this;
        };
        this.hide = function (uniqueId) {
            window.clearTimeout(theTimer);
            //
            if(typeof theCallback == "function") {
                try {
                    theCallback();
                } catch(ex) {
                    //
                }
            }
            //
            if(uniqueId = null && uniqueId != curUniqueId) {
                return;
            }
            if(jqDom != null) {
                jqDom.fadeOut("fast");
            }
            //
            return this;
        };
        //
        return this;
    };
    // 单一对象
    var Toast = new ToastCoreFn();

    // TopMsg 提示
    function TopMsgCoreFn() {
        var contentTpls = {
            Text: '{}'
        };

        function toImageTypeName(type) {
            switch(type) {
                case 1:
                    return 'Image';

                case 2:
                    return 'Link';

                default:
                    return 'Text';

            }
        }

        var THIS = this;
        var html = '<div class="top-msg">\
					<span class="icon info"></span>\
					<span class="speaker"></span>\
					<span class="icon close"></span>\
					<div class="content"></div>\
				</div>';
        var jqDom = null;
        var jqDomEl = null;
        var jqContent = null;
        var jqIcon = null;
        var jqSpeaker = null;
        var jqClose = null;
        var theTimer = null;
        var curUniqueId = null;
        var hideDelay = 10000;
        var linkTarget = "_self";
        var isMobile = false;
        // 有声通知是否关闭
        var defindedStore = !(typeof Store === "undefined");
        var speakerIsMute = false;
        var speakerVersionCheck = "2016-12-30";
        var speakerVersionCookie = "informMsgVersion";
        var speakerIsMuteCookie = "informMsgIsMute";
        //
        var iconClassMap = {
            "warn": "warning",
            "fatal": "error"
        };

        function mapIconClass(iconClass) {
            var tmpIconClass = iconClassMap[iconClass];
            return tmpIconClass || iconClass || "info";
        }

        //
        function createDom() {
            if(jqDom == null) {
                jqDom = $(html).appendTo(document.body);
                jqDomEl = jqDom.get(0);
                jqDom.css("display", "none");
                jqContent = jqDom.find('>.content');
                jqIcon = jqDom.find('>.icon:first');
                jqSpeaker = jqIcon.next('.speaker');
                jqClose = jqDom.find('>.icon.close');
                //
                if(defindedStore) {
                    var spearkerVersion = Store.get(speakerVersionCookie, "");
                    if(speakerVersionCheck > spearkerVersion) {
                        Store.set(speakerVersionCookie, speakerVersionCheck);
                        Store.set(speakerIsMuteCookie, speakerIsMute);
                    } else {
                        speakerIsMute = Store.get(speakerIsMuteCookie, speakerIsMute);
                    }
                }
                if(speakerIsMute) {
                    jqSpeaker.addClass("mute");
                    jqSpeaker.attr("title", "有声通知 未开启");
                } else {
                    jqSpeaker.removeClass("mute");
                    $(this).attr("title", "已开启 有声通知");
                }
                //
                jqSpeaker.on("click", function () {
                    if($(this).hasClass("mute")) {
                        $(this).removeClass("mute");
                        $(this).attr("title", "已开启 有声通知");
                        //
                        speakerIsMute = false;
                    } else {
                        $(this).addClass("mute");
                        $(this).attr("title", "有声通知 未开启");
                        //
                        speakerIsMute = true;
                    }
                    if(defindedStore) {
                        Store.set(speakerIsMuteCookie, speakerIsMute);
                    }
                });
                jqClose.on("click", function () {
                    THIS.hide();
                });
                //
                adjustForMoblie();
            }
        }

        //
        function adjustForMoblie() {
            if(jqDom != null) {
                isMobile ? jqDom.addClass("full-width") : jqDom.removeClass("full-width");
            }
        }

        this.setLinkTarget = function (sLinkTarget) {
            linkTarget = sLinkTarget || "_self";
        };
        //
        this.setMobile = function (bMobile) {
            isMobile = bMobile === true;
            adjustForMoblie();
        };
        // iconClass : info, warning, error, success
        this.show = function (msgData, iconClass, closeDelay) {
            createDom();
            //
            window.clearTimeout(theTimer);
            //
            msgData = msgData || {};

            if(typeof iconClass == "number") {
                closeDelay = Math.max(1000, iconClass);
                iconClass = null;
            }
            iconClass = iconClass || msgData.resultType || "info";
            iconClass = mapIconClass(iconClass);
            closeDelay = closeDelay || hideDelay;
            //
            var msgType = msgData.type;
            var msgTypeName = typeof msgType == "number" ? toImageTypeName(msgType) : msgType;
            var msgTxt = msgData.txt;
            var msgUrl = msgData.url;
            var msgSender = msgData.senderName || "";
            if(msgSender) {
                msgSender = "来自" + msgSender + "的";
            }
            var soundTxt = msgTxt;

            var html = "";
            jqContent.css("padding-bottom", "10px");
            jqContent.css("padding-left", "80px");

            if(msgTypeName == "Link") {
                soundTxt = "您有一条" + msgSender + "链接消息";
                msgTxt = msgTxt || msgUrl;
                html += "<a href='{1}' target='{2}'>{0}</a>".format(utils.escapeHtmlStr(msgTxt), utils.escapeXmlValueStr(msgUrl), linkTarget);
            } else if(msgTypeName == "Image") {
                soundTxt = "您有一条" + msgSender + "图片消息";
                msgTxt = msgTxt || "<无图片说明>";
                jqContent.css("padding-left", "40px");
                html += "<div style='margin-bottom:10px;'>{0}</div>".format(utils.escapeHtmlStr(msgTxt));
                html += '<img src="{0}" />'.format(utils.escapeXmlValueStr(msgUrl));
            } else { //Text
                soundTxt = msgSender + "消息:" + msgTxt;
                html += utils.escapeHtmlStr(msgTxt);
            }
            jqContent.html(html);
            //

            if(!speakerIsMute) {
                utils.speakText(soundTxt, false, isMobile);
            }

            jqDom.removeClass("info warning error success");
            jqDom.addClass(iconClass);
            jqIcon.removeClass("info warning error success");
            jqIcon.addClass(iconClass);
            //
            jqDom.slideDown("fast");
            //
            var uniqueId = utils.genUniqueStr();
            curUniqueId = uniqueId;
            theTimer = window.setTimeout(function () {
                THIS.hide(uniqueId);
            }, closeDelay);
            //
            return this;
        };
        this.hide = function (uniqueId) {
            window.clearTimeout(theTimer);
            //
            if(uniqueId = null && uniqueId != curUniqueId) {
                return;
            }
            if(jqDom != null) {
                jqDom.slideUp("slow");
            }
            //
            return this;
        };
        //
        return this;
    }

    // 单一对象
    var TopMsg = new TopMsgCoreFn();

    // appBaseUrl => http://www.ushangupu.cn
    // appRelUrl => /goods?id=1
    // hashUrl => /spec/list?x=2
    // => http://www.ushangupu.cn/goods?id=1#/spec/list?x=2
    function makePageRouteUrl(appBaseUrl, appRelUrl, hashUrl) {
        appRelUrl = appRelUrl || '/';
        hashUrl = hashUrl || '';
        //
        var urlInfo = {
            appRelUrl: appRelUrl
        };
        if(hashUrl) {
            urlInfo.hashUrl = hashUrl;
        }
        //
        if(!appBaseUrl) {
            appBaseUrl = typeof getAppUrl == 'function' ? getAppUrl('') : '';
        }
        appBaseUrl += "/route";
        //
        return utils.makeUrl(appBaseUrl, urlInfo, true);
    }

    //在页面中打开 => http://www.ushangupu.cn/goods?id=1#/spec/list?x=2
    // appBaseUrl => http://www.ushangupu.cn
    // appRelUrl => /goods?id=1
    // hashUrl => /spec/list?x=2
    // openPageRouteUrl(appBaseUrl, appRelUrl, hashUrl);
    function openPageRouteUrl(appBaseUrl, appRelUrl, hashUrl) {
        var pageRouteUrl = makePageRouteUrl(appBaseUrl, appRelUrl, hashUrl);
        utils.setPageUrl(pageRouteUrl, '_blank');
    }

    //-------- 视频支持 --------
    var __video_templates = {
        flash: "<embed src='{url}' allowFullScreen='true' quality='high' width='{width}' height='{height}' align='middle' allowScriptAccess='always' type='application/x-shockwave-flash'></embed>",
        normal: "<video style='width:{width}px;height:{height}px;' class='video-js vjs-default-skin vjs-big-play-centered' controls preload='auto' width='{width}' height='{height}' poster='{poster}'>" +
        "<source src='{url}'>" +
        "<p class='vjs-no-js'>要观看此视频，请启用浏览器的Javascript脚本功能，并升级到<a href='http://videojs.com/html5-video-support/' target='_blank'>支持Html5视频</a>的浏览器 </p>" +
        "</video>"
    };

    function renderVideo(domOrId, videoInfo) {
        videoInfo = videoInfo || null;
        if(typeof videoInfo == 'string') {
            videoInfo = {
                url: videoInfo
            };
        }
        if(videoInfo == null) {
            return null;
        }
        //
        videoInfo.width = videoInfo.width || 480;
        videoInfo.height = videoInfo.height || 300;
        //
        var flashFlag = videoInfo.flashFlag == true;
        //
        var tplStr = flashFlag ? __video_templates.flash : __video_templates.normal;
        //
        var tplHtml = tplStr.format(videoInfo);
        //
        if(domOrId != null) {
            $id(domOrId).html(tplHtml);
        }
        return tplHtml;
    }

    //----------------------------------- exports -------------------------------------
    var privateMemKeys = ['__name__', 'exportToWindow'];//不能导出的成员
    var windowedKeyMap = {//exports 名称 => window 名称
        //
    };
    //
    exports.$id = $id;
    exports.$attr = $attr;
    //
    exports.isEventFromWithin = isEventFromWithin;
    exports.borrowOrReturnDomNode = borrowOrReturnDomNode;
    exports.showImageViewBox = showImageViewBox;
    //
    exports.HiddenForm = HiddenForm;
    exports.centerInView = centerInView;
    //
    exports.Toast = Toast;
    exports.TopMsg = TopMsg;
    //
    exports.makePageRouteUrl = makePageRouteUrl;
    exports.openPageRouteUrl = openPageRouteUrl;
    exports.renderVideo = renderVideo;
    //
    exports.exportToWindow = function () {//把当前模块的成员导出到window全局
        if(typeof window !== 'undefined') {
            var winKey = null;
            for(var key in this) {
                if(privateMemKeys.indexOf(key) == -1) {
                    winKey = windowedKeyMap[key] || key;
                    window[winKey] = this[key];
                }
            }
            console.warn('模块[' + this.__name__ + ']的成员已导出到window全局');
        }
    }
}));
