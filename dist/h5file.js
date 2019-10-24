//H5版文件处理代码
/**
 * Created by koqiui on 2017-04-09.
 */
var moduleName = 'H5file';
//----------------------------------------------
var utils = require('./utils');
var jqext = require('./jqext');

//
var $ = jqext.$;
var $id = jqext.$id;
var KeyMap = utils.KeyMap;
//
var Util = {
    //读取选择的图片文件，转为ImageDataUrl
    readImageFileAsDataUrl: function (imageFile, dataUrlCallback) {
        if(utils.isImageType(imageFile.type)) {
            if(typeof window.FileReader === 'undefined') {
                var failMsg = '浏览器不支持FileReader对象';
                //
                if(typeof dataUrlCallback === 'function') {
                    dataUrlCallback(null, failMsg);
                } else {
                    console.warn(failMsg);
                }
            } else {
                var fileReader = new FileReader();
                fileReader.onload = function (evnt) {
                    var dataUrl = evnt.target.result;
                    if(typeof dataUrlCallback === 'function') {
                        dataUrlCallback(dataUrl, imageFile.name);
                    } else {
                        console.warn('未指定dataUrl回调函数');
                    }
                };
                //
                fileReader.readAsDataURL(imageFile);
                //
                return;
            }
        } else {
            var failMsg = '非图片文件(' + imageFile.name + ')';
            //
            if(typeof dataUrlCallback === 'function') {
                dataUrlCallback(null, failMsg);
            } else {
                console.warn(failMsg);
            }
        }
    },
    //显示给定的imagefile到给定的imag对象
    showImageFile: function (imageFile, imgDom) {
        var jqImage = $id(imgDom);
        if(jqImage.length !== 1) {
            return;
        }
        var image = jqImage.get(0);
        if(image.tagName !== 'IMG') {
            return;
        }
        //
        Util.readImageFileAsDataUrl(imageFile, function (dataUrl) {
            image.src = dataUrl;
        });
    },
    //读取文件，返回FormData对象
    readFileItemsAsFormData: function (fileItems, name) {
        fileItems = fileItems || [];
        name = name || 'file';
        //
        var fileFormData = new FormData();
        for(var i = 0, c = fileItems.length; i < c; i++) {
            var fileItem = fileItems[i];
            fileFormData.append(name, fileItem);
        }
        //
        return fileFormData;
    }
};

/**
 *
 */
function Uploader(options) {
    var THIS = this;
    //是否使用内部（而非file本身的）文件类型检查
    var __useInnerFilter = true;
    //
    var _fieldName = 'file';
    var _multiple = false;
    //', '分割的mimetype，如：image/png,image/gif
    var _accept = '*/*';
    var _serverUrl = '';

    //
    var _changeHandler = null;
    var _progressHandler = null;
    //
    var _beforeUpload = null;
    var _doneHandler = null;
    var _failHandler = null;
    //var _alwaysHandler = null;
    //
    var _bindTo = null;
    var _fileCtrl = null;
    var _initFlag = false;
    var _destroyed = false;
    //
    var _extParams = {};
    var _fileItems = [];

    this.destroy = function () {
        //
        _destroyed = true;
        //
        $id(_bindTo).unbind();
        _bindTo = null;
        $id(_fileCtrl).unbind();
        $id(_fileCtrl).remove();
        _fileCtrl = null;
        //
        _changeHandler = null;
        _progressHandler = null;
        //
        _beforeUpload = null;
        _doneHandler = null;
        _failHandler = null;
        //
        _extParams = null;
        _fileItems = [];
        //
        THIS = null;
    };

    //
    function isAcceptable(refFileType, chkFileType) {
        var refParts = refFileType.split('/');
        var refType = refParts[0];
        var refSubType = refParts[1];
        if(refType === '*') {
            return true;
        }
        //
        var chkParts = chkFileType.split('/');
        var chkType = chkParts[0];
        var chkSubType = chkParts[1];
        //
        if(refType !== chkType) {
            return false;
        } else {
            if(refSubType === '*') {
                return true;
            } else if(refSubType === chkSubType) {
                return true;
            }
            return false;
        }
    }

    //
    function filterFileItems(fileItems) {
        var retItems = [];
        //
        if(__useInnerFilter) {
            var refFileTypes = _accept.split(', ');
            var refFileTypeCount = refFileTypes.length;
            //
            for(var i = 0, c = fileItems.length; i < c; i++) {
                var fileItem = fileItems[i];
                var fileType = fileItem.type;
                //
                var accepted = false;
                for(var j = 0; j < refFileTypeCount; j++) {
                    var refFileType = refFileTypes[j];
                    if(isAcceptable(refFileType, fileType)) {
                        accepted = true;
                        break;
                    }
                }
                if(accepted) {
                    retItems.push(fileItem);
                }
            }
        } else {
            retItems = Array.prototype.slice.call(fileItems, 0);
        }
        //
        return retItems;
    }

    function rebindFileInput() {
        if(_fileCtrl !== null) {
            $id(_fileCtrl).unbind();
            $id(_fileCtrl).remove();
            //
            _fileCtrl = null;

        }
        //创建file input 控件
        _fileCtrl = document.createElement('input');
        _fileCtrl.type = 'file';
        _fileCtrl.id = 'file-' + utils.genUniqueStr();
        //
        document.body.appendChild(_fileCtrl);
        //
        _fileCtrl.multiple = _multiple;
        //！！！不可加入accept，会拖死弹出框
        if(!__useInnerFilter) {
            // _fileCtrl.accept = _accept;
        }
        //
        _fileCtrl.name = _fieldName;
        _fileCtrl.style.display = 'none';
        _fileCtrl.isStale = false;
        //_fileCtrl.style.width = 0;
        //_fileCtrl.style.height = 0;
        //
        //绑定事件
        $id(_fileCtrl).bind('change', function (evnt) {
            evnt.preventDefault();
            //
            _fileCtrl.isStale = false;
            //
            var files = this.files;
            //隔离文件对象
            _fileItems = filterFileItems(files);
            //
            if(_changeHandler !== null) {
                _changeHandler(_fileItems, THIS);
            }
        });
    }

    //
    this.fieldName = function (fieldName) {
        _fieldName = fieldName || 'file';
        if(_fileCtrl !== null) {
            _fileCtrl.name = _fieldName;
        }
        //
        return this;
    };

    //
    this.multiple = function (multiple) {
        _multiple = multiple !== false;
        if(_fileCtrl !== null) {
            _fileCtrl.multiple = _multiple;
        }
        //
        return this;
    };
    //
    this.accept = function (accept) {
        if(utils.isArray(accept)) {
            _accept = accept;
        } else {
            _accept = Array.prototype.slice.call(arguments, 0).join(', ');
        }
        if(_fileCtrl !== null && !__useInnerFilter) {
            _fileCtrl.accept = _accept;
        }
        //
        return this;
    };

    //
    this.serverUrl = function (serverUrl) {
        _serverUrl = serverUrl || '';
        //
        return this;
    };
    //
    this.changeHandler = function (changeHandler) {
        if(typeof changeHandler === 'function') {
            _changeHandler = changeHandler;
        } else {
            _changeHandler = null;
        }
        //
        return this;
    };
    //
    this.progressHandler = function (progressHandler) {
        if(typeof progressHandler === 'function') {
            _progressHandler = progressHandler;
        } else {
            _progressHandler = null;
        }
        //
        return this;
    };
    //
    this.bindTo = function (bindTo) {
        _bindTo = bindTo;
        //
        return this;
    };
    //
    this.beforeUpload = function (beforeUpload) {
        if(typeof beforeUpload === 'function') {
            _beforeUpload = beforeUpload;
        }
        //
        return this;
    };
    //
    this.done = function (doneHandler) {
        if(typeof doneHandler === 'function') {
            _doneHandler = doneHandler;
        }
        //
        return this;
    };
    //
    this.fail = function (failHandler) {
        if(typeof failHandler === 'function') {
            _failHandler = failHandler;
        }
        //
        return this;
    };
    //
    this.resetFiles = function () {
        rebindFileInput();
        //
        _fileItems = [];
        //
        return this;
    };
    //
    this.init = function () {
        if(_bindTo === null) {
            throw '尚未设置触发控件（bindTo）';
        }
        //
        if(!_initFlag) {
            _initFlag = true;
            //
            rebindFileInput();
            //
            $id(_bindTo).bind('click', function (evnt) {
                evnt.stopPropagation();
                //
                $(_fileCtrl).trigger('click');
            });
        }
        //
        return this;
    };
    //
    this.params = function (params) {
        _extParams = params || {};
        //
        return this;
    };
    //
    this.upload = function (params) {
        if(_destroyed) {
            throw '控件已通过 destroy()销毁，无法再调用';
        }
        //
        THIS.init();
        //
        var beforeResult = true;
        if(_beforeUpload) {
            beforeResult = _beforeUpload(_fileItems, THIS);
        }
        //
        if(beforeResult === false) {
            return;
        }
        //
        if(_fileCtrl.isStale || _fileItems.length === 0) {
            alert('请选择要上传的文件');
            return;
        }
        //
        var serverUrl = _serverUrl;
        if(Uploader.baseUrl && !serverUrl.startsWith('http')) {
            serverUrl = Uploader.baseUrl + serverUrl;
        }
        //
        params = params || _extParams;
        //
        var formData = Util.readFileItemsAsFormData(_fileItems, _fieldName);
        //
        var paramsMap = KeyMap.from(params);
        for(var i = 0, paramNames = paramsMap.keys(); i < paramNames.length; i++) {
            var paramName = paramNames[i];
            formData.append(paramName, paramsMap.get(paramName));
        }
        //
        var xhr = new XMLHttpRequest();
        xhr.open('POST', serverUrl, true);
        //
        xhr.onreadystatechange = function (evnt) {
            var resp = evnt.target;
            //
            if(resp.readyState !== 4) {
                return;
            }
            //
            if(resp.status === 200) {
                //上传完毕把控件状态设置为过期;
                THIS.resetFiles();
                //
                var jsonStr = resp.responseText;
                var result = JSON.decode(jsonStr);
                if(_doneHandler) {
                    _doneHandler(result);
                }
            } else {
                var result = {};
                result.type = 'error';
                result.message = '文件上传失败 ' + resp.statusText;
                if(_failHandler) {
                    _failHandler(result);
                }
            }
        };
        //
        xhr.upload.onprogress = function (evnt) {
            //console.log(evnt);
            //
            if(evnt.lengthComputable) {
                var progress = {};
                progress.total = evnt.total;
                progress.loaded = evnt.loaded;
                //
                if(_progressHandler) {
                    _progressHandler(progress, THIS);
                }
            }
        };
        //
        xhr.send(formData);
    };
}

//
Uploader.newOne = function () {
    return new Uploader();
};

//====================================================
//从Content-Disposition响应头解析文件名称
function parseFileNameFromContentDisposition(contentDisposition) {
    var cpStr = contentDisposition || null;
    if(cpStr == null) {
        return null;
    }
    var index = cpStr.toLowerCase().indexOf('filename=');
    if(index != -1) {//'filename='.length = 9
        cpStr = cpStr.substring(index + 9);
        cpStr = cpStr.dequote();
        return decodeURI(cpStr);//解码
    } else {
        return null;
    }
}

function Downloader(options) {
    var THIS = this;
    //
    var _xhr = null;
    //
    var _method = "GET";
    var _url = "";
    // 发送的数据类型: contentType : json / form
    var _contentType = 'json';
    //
    var _header = {};
    var _params = {};
    var _data = {};
    //
    var _timeout = null;
    //
    var _fileName = null;
    var _fileNameHeader = null;
    //
    var _doneHandler = null;
    var _failHandler = null;
    var _progressHandler = null;
    //是否有错误发生
    var _failed = false;
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
    //
    //支持多次设置（融合模式）
    this.header = function (header) {
        header = header || {};
        //
        _header = utils.merge(_header, header);
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
        _timeout = timeout || null;
        //
        return this;
    };
    this.fileName = function (fileName) {
        _fileName = fileName;
        //
        return this;
    };
    this.fileNameHeader = function (fileNameHeader) {
        _fileNameHeader = fileNameHeader;
        //
        return this;
    };
    this.asJson = function () {
        _contentType = 'json';
        //
        return this;
    };
    this.asForm = function () {
        _contentType = 'form';
        //
        return this;
    };
    //data : {fileName, fileBody}
    this.done = function (doneHandler) {
        if(typeof doneHandler === 'function') {
            _doneHandler = doneHandler;
        }
        //
        return this;
    };
    //
    this.fail = function (failHandler) {
        if(typeof failHandler === 'function') {
            _failHandler = failHandler;
        }
        //
        return this;
    };
    //
    // {type : (0,开始，1:进行中，2:结束，-1:中止), message, fileName, loaded, total}
    this.progress = function (progressHandler) {
        if(typeof progressHandler === 'function') {
            _progressHandler = progressHandler;
        } else {
            _progressHandler = null;
        }
        //
        return this;
    };
    //
    this.go = function () {
        if(_xhr != null) {
            console.warn('已经发出了下载请求，本次请求已取消');
            return;
        }
        //重置失败标记
        _failed = false;
        //
        var xhr = new XMLHttpRequest();
        try {
            xhr.responseType = 'blob';
        } catch(ex) {
            console.warn('浏览器Ajax不支持指定blob响应类型');
        }
        //缓存请求对象（防止重复调用）
        _xhr = xhr;
        //
        xhr.onerror = function (evnt) {
            //console.error('-- error --');
            //console.error(evnt);
            //TODO 提取信息文本
            var errMsg = 'Ajax方式文件下载出错';
            if(!_failed) {
                _failed = true; //设置失败标记
                //
                var handler = _failHandler || _doneHandler;
                if(handler) {
                    handler({
                        type: 'error',
                        message: errMsg
                    });
                } else {
                    console.error(errMsg);
                }
            }
        };
        xhr.onabort = function (evnt) {
            //console.warn('-- abort --');
            //console.warn(evnt);
            //TODO 提取信息文本
            var wrnMsg = 'Ajax方式文件下载已主动取消';
            if(!_failed) {
                _failed = true; //设置失败标记
                //
                var handler = _failHandler || _doneHandler;
                if(handler) {
                    handler({
                        type: 'warn',
                        message: wrnMsg
                    });
                } else {
                    console.warn(wrnMsg);
                }
            }
        };
        xhr.ontimeout = function (evnt) {
            //console.error('-- timeout --');
            //console.error(evnt);
            //TODO 提取信息文本
            var errMsg = 'Ajax方式文件下载超时';
            if(!_failed) {
                _failed = true; //设置失败标记
                //
                var handler = _failHandler || _doneHandler;
                if(handler) {
                    handler({
                        type: 'error',
                        message: errMsg
                    });
                } else {
                    console.error(errMsg);
                }
            }
        };
        //loadstart[, progress, load], loadend
        xhr.onloadstart = function (evnt) {
            //console.log('-- loadstart --');
            //console.log(evnt);
            //这里evnt.total 和 evnt.loaded 没用
            var info = { //没有进度和总量信息
                type: 0,
                message: '下载开始'
            };
            //
            if(_progressHandler) {
                _progressHandler(info);
            } else {
                console.log(info);
            }
        };
        xhr.onprogress = function (evnt) {
            //lengthComputable, total, loaded
            //console.log('-- progress --');
            //console.log(evnt);
            //
            var info = {
                type: 1,
                message: '正在下载',
                fileName: _fileName,
                loaded: evnt.loaded
            };
            if(evnt.lengthComputable) {
                info.total = evnt.total;
                if(info.loaded == info.total) { //下载完毕
                    info.type = 2;
                    info.message = '下载完毕';
                } else if(info.loaded == 0) {
                    info.type = 0;
                    info.message = '下载开始';
                }
            }
            //
            if(_progressHandler) {
                _progressHandler(info);
            } else {
                console.log(info);
            }
        };
        xhr.onload = function (evnt) {
            //console.log('-- loading --');
            //console.log(evnt);
            //
            /* 与 onloadend 重复
            var info = {
                type: 2,
                message: '下载完毕',
                fileName: _fileName,
                loaded: evnt.loaded
            };
            if(evnt.lengthComputable) {
                info.total = evnt.total;
            }
            //
            if(_progressHandler) {
                _progressHandler(info);
            } else {
                console.log(info);
            }
            */
        };
        xhr.onloadend = function (evnt) {
            //console.log('-- loadend --');
            //console.log(evnt);
            //
            var info = {
                type: _failed ? -1 : 2,
                message: _failed ? '下载中止' : '下载完毕',
                fileName: _fileName,
                loaded: evnt.loaded
            };
            if(evnt.lengthComputable) {
                info.total = evnt.total;
            }
            //
            if(_progressHandler) {
                _progressHandler(info);
            } else {
                _failed ? console.warn(info) : console.info(info);
            }
            //清除请求对象
            _xhr = null;
        };
        //
        xhr.onreadystatechange = function (evnt) {
            //console.log('-- readystatechange --');
            //console.log(evnt);
            //console.log(this);
            //
            if(this.readyState !== 4) { //this.DONE
                if(this.readyState == 2) { //this.HEADERS_RECEIVED
                    var rspFileName = null;//从响应得到的文件名称
                    //
                    //console.log('-- response headers --');
                    //console.log(this.getAllResponseHeaders());
                    var allHeaderStr = (this.getAllResponseHeaders() + "" || "").toLowerCase();
                    //1
                    if(_fileNameHeader && allHeaderStr.indexOf(_fileNameHeader.toLowerCase()) != -1) {
                        try { //从自定义响应头获取文件名
                            rspFileName = this.getResponseHeader(_fileNameHeader);
                            if(rspFileName) {//解码
                                rspFileName = decodeURI(rspFileName);
                            }
                        } catch(ex) {
                            console.warn(ex);
                        }
                    }
                    //2
                    if(!rspFileName && allHeaderStr.indexOf('content-disposition') != -1) {
                        //从Content-Disposition响应头获取文件名
                        var cpStr = this.getResponseHeader('Content-Disposition');
                        rspFileName = parseFileNameFromContentDisposition(cpStr);
                    }
                    //
                    if(rspFileName) {//以响应的文件名为主
                        _fileName = rspFileName;
                    }
                    else if(!_fileName) { //3 从url解析文件名
                        var rspUrl = this.responseURL || _url; //IE Ajax获取不到responseURL
                        if(rspUrl.endsWith('?')) {
                            rspUrl = rspUrl.substring(0, rspUrl.length - 1);
                        }
                        _fileName = utils.extractShortFileName(rspUrl);
                    }
                }
                //
                return;
            }
            //
            if(this.status === 200) {
                var result = {
                    type: 'info',
                    message: '文件下载完毕',
                }
                result.data = {
                    fileName: _fileName,
                    fileBody: this.response //URL.createObjectURL(this.response)
                };
                //
                if(_doneHandler) {
                    _doneHandler(result);
                } else {
                    console.warn('--- 未设置下载结果处理函数 ---');
                    console.log(result);
                }
            }
            /*else {
                var errMsg = 'Ajax方式文件下载失败';
                if(!_failed) {
                    _failed = true; //设置失败标记
                    //
                    var handler = _failHandler || _doneHandler;
                    if(handler) {
                        handler({
                            type: 'error',
                            message: errMsg
                        });
                    } else {
                        console.error(errMsg);
                    }
                }
            }*/
        };
        //
        var fullUrl = utils.makeUrl(_url, _params);
        xhr.open(_method, fullUrl, true);
        if(_timeout) {
            xhr.timeout = _timeout;
        }
        for(var name in _header) {
            xhr.setRequestHeader(name, _header[name]);
        }
        if(_method == 'GET') {
            xhr.send();
        } else {
            if(_contentType == 'form') {
                var formData = new FormData();
                if(_data) {
                    for(var name in _data) {
                        formData.append(name, _data[name]);
                    }
                }
                xhr.send(formData);
            } else {
                xhr.setRequestHeader('Content-Type', 'application/json');
                //
                var json = JSON.encode(_data || {});
                xhr.send(json);
            }
        }
    };

    //是否可取消
    this.abortable = function () {
        return _xhr != null;
    };
    //取消下载
    this.abort = function () {
        if(_xhr != null) {
            try {
                _xhr.abort();
            } catch(ex) {
                console.log(ex);
            }
        }
    }
}

//
Downloader.newOne = function () {
    return new Downloader();
};

//
module.exports = {
    moduleName: moduleName,
    //
    Util: Util,
    Uploader: Uploader,
    Downloader: Downloader
};