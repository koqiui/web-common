/**
 * Created by koqiui on 2017-04-09.
 */
(function (global, factory) {
    var theExports = null;
    var hasModuleExports = false;
    if(typeof module === "object" && typeof module.exports === "object") {
        theExports = module.exports;
        hasModuleExports = true;
    } else {//导出为模块
        theExports = global['WebComn'] = {};
    }
    factory(theExports, hasModuleExports);
}(typeof window !== "undefined" ? window : this, function (exports, hasModuleExports) {
    exports.__name__ = 'WebComn';
    //
    if(hasModuleExports) {
        console.log('以模块方式导入[' + exports.__name__ + ']');
    }
    else {
        console.log('以普通方式导入[' + exports.__name__ + ']');
    }
    //---------------------------------------------------------------------------------
    //----------------------------------- exports -------------------------------------
    exports.Store = hasModuleExports ? require('store') : window['store'];

    exports.EventBus = hasModuleExports ? require('./eventbus') : window['EventBus'];

    exports.Utils = hasModuleExports ? require('./utils') : window['Utils'];

    exports.Ajax = hasModuleExports ? require('./ajax') : window['Ajax'];

    exports.$ = hasModuleExports ? require('jquery') : window['jQuery'];

    exports.Jqext = hasModuleExports ? require('./jquery.ext') : window['Jqext'];

    exports.H5file = hasModuleExports ? require('./h5file') : window['H5file'];

    exports.Routes = hasModuleExports ? require('./routes') : window['Routes'];

}));
