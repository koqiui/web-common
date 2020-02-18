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
        theExports = global['Routes'] = {};
    }
    factory(theExports, hasModuleExports);
}(typeof window !== "undefined" ? window : this, function (exports, hasModuleExports) {
    exports.__name__ = 'Routes';
    //
    if(hasModuleExports) {
        console && console.log('以模块方式导入[' + exports.__name__ + ']');
    }
    else {
        console && console.log('以普通方式引入[' + exports.__name__ + ']');
    }
    //---------------------------------------------------------------------------------
    var __showDebug = true;
    var __registFunction = null;
    //[{path, component}, ...]
    var __routeMaps = [];
    //是否检查重复或覆盖注册
    var __checkDuplicates = true;
    //{ path => component}
    var __routeMapAll = {};
    var __routeRegistStates = {};

    //
    function makeSubRoutes(subComps) {
        subComps = subComps || [];
        var children = [];
        for(var i = 0; i < subComps.length; i++) {
            var comp = subComps[i];
            children[i] = {
                path: comp.path,
                component: comp,
                desc: comp.desc
            };
        }
        //
        if(children.length > 0) {
            //插入默认路由
            var first = children[0];
            children.unshift({
                path: '',
                component: first.component,
                desc: first.desc
            });
        }
        //
        return children;
    }

    //----------------------------------- exports -------------------------------------
    //
    exports.debug = function (showDebug) {
        __showDebug = showDebug;
    };
    //是否检查重复注册
    exports.checkDuplicates = function (trueOrFalse) {
        __checkDuplicates = trueOrFalse !== false;
    };
    //设置注册函数
    exports.setRegistFunction = function (registFn) {
        __registFunction = registFn;
    };
    //
    exports.add = function () {
        var routeMaps = arguments;
        for(var i = 0; i < routeMaps.length; i++) {
            var routeMap = routeMaps[i];
            //
            if(routeMap == null) {
                console.warn('缺少参数 或 所要注册的路由组件 尚未加载（往往是因为存在双向依赖导致的）');
            }
            else {
                var name, desc, path, comp;
                //
                var name = routeMap['name'];
                if(name != null && routeMap['data'] != null) {
                    //传入的是组件
                    comp = routeMap;
                    desc = comp.desc;
                    path = comp.path;
                    if(path == null) {
                        console.error('组件' + (desc == null ? '' : '(' + desc + ')') + '缺少 path 信息，不能注册为路由组件 ： <' + name + '>');
                        continue;
                    }
                    //
                    routeMap = {
                        path: path,
                        component: comp
                    };
                    //
                    if(desc != null) {
                        routeMap.desc = desc;
                    }
                    //
                    var subRoutes = comp['subRoutes'] || null;
                    if(subRoutes != null && subRoutes.length > 0) {
                        routeMap.children = makeSubRoutes(subRoutes);
                    }
                }
                else {
                    //传入的是配置对象
                    desc = routeMap.desc;
                    path = routeMap.path;
                    comp = routeMap.component;
                    if(comp == null) {
                        console.warn('找不到路由 ' + path + ' 对应的组件，或 所要注册的路由组件 尚未加载' + (desc == null ? '' : '(' + desc + ')') + '！');
                        continue;
                    }
                    name = comp.name;
                    if(path == null) {
                        console.error('组件' + (desc == null ? '' : '(' + desc + ')') + '缺少 path 信息，不能注册为路由组件 ： <' + name + '>');
                        continue;
                    }
                }
                if(__checkDuplicates) {
                    var existed = __routeMapAll[path];
                    if(existed != null) {
                        if(comp == existed) {
                            console.warn('路由重复：' + path + ' => ' + (name || '<未命名>') + (desc == null ? '' : '(' + desc + ')'));
                        }
                        else {
                            console.error('路由覆盖：' + path + ' => ' + (name || '<未命名>') + (desc == null ? '' : '(' + desc + ')') + ' 要覆盖 ' + (existed.name || '<未命名>') + (existed.desc == null ? '' : '(' + existed.desc + ')'));
                        }
                        //
                        continue;
                    }
                }
                //
                if(typeof __registFunction == 'function') {
                    //注册路由时注册组件
                    __registFunction(comp);
                    if(__showDebug) {
                        console.log('路由 ' + path + ' ' + (desc == null ? '' : '(' + desc + ')') + ' <' + name + '> 已加入 并且 已【注册组件】');
                    }
                }
                else {
                    if(__showDebug) {
                        console.log('路由 ' + path + ' ' + (desc == null ? '' : '(' + desc + ')') + ' <' + name + '> 已加入');
                    }
                }

                //
                __routeMapAll[path] = comp;
                //
                if(routeMap.children) {
                    //修正/注册子路由
                    var parentPath = routeMap.path;
                    var children = routeMap.children;
                    for(var i = 0; i < children.length; i++) {
                        var childMap = children[i];
                        var childComp = childMap.component;
                        if(childComp.path.charAt(0) == '/') {
                            console.warn('子 路由组件（除有独立使用的场景，否则它）的 path 不应该 以 "/" 开头');
                        }
                        var childPath = childMap.path;
                        if(childPath.charAt(0) == '/') {
                            childPath = childPath.substring(1);
                            childMap.path = childPath;
                        }
                        var fullPath = parentPath + (childPath ? "/" + childPath : "");
                        //
                        childComp.fullPath = fullPath;
                        __routeMapAll[fullPath] = childComp;
                        //
                        var registed = false;
                        if(typeof __registFunction == 'function') {
                            __registFunction(childComp);
                            //
                            registed = true;
                        }
                        //
                        if(__showDebug) {
                            var desc = childComp.desc;
                            var name = childComp.name;
                            console.log('子 路由 ' + fullPath + ' ' + (desc == null ? '' : '(' + desc + ')') + ' <' + name + '> 已加入' + (registed ? ' 并且 已【注册组件】' : ''));
                        }
                    }
                }
                //
                __routeMaps.push(routeMap);
            }
        }
    };

    exports.get = function (path) {
        return __routeMapAll[path];
    };

    exports.all = function () {
        return __routeMaps;
    };

    exports.clear = function () {
        __routeMaps.length = 0;
        __routeMapAll = {};
    };
}));
