/**
 * Created by 胡长伟 on 2020-02-17.
 * 示例写法模块
 */
(function (global, factory) {
    var theExports = null;
    var hasModuleExports = false;
    if(typeof module === "object" && typeof module.exports === "object") {
        theExports = module.exports;
        hasModuleExports = true;
    } else {//导出为模块
        theExports = global['WebDemo'] = {};
    }
    factory(theExports, hasModuleExports);
}(typeof window !== "undefined" ? window : this, function (exports, hasModuleExports) {
    exports.__name__ = 'WebDemo';
    //
    if(hasModuleExports) {
        console && console.log('以模块方式导入[' + exports.__name__ + ']');
    }
    else {
        console && console.log('以普通方式引入[' + exports.__name__ + ']');
    }
    //---------------------------------------------------------------------------------

    //code here ...

    //----------------------------------- exports -------------------------------------
    var privateMemKeys = ['__name__', 'exportToWindow'];//不能导出的成员
    var windowedKeyMap = {//exports 名称 => window 名称
        //
    };

    //...
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