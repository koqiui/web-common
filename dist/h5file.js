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
    //读取文件，返回FormData对象
    readFileItemsAsFromData: function (fileItems, name) {
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
        var formData = Util.readFileItemsAsFromData(_fileItems, _fieldName);
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

//
module.exports = {
    moduleName: moduleName,
    //
    Util: Util,
    Uploader: Uploader
};