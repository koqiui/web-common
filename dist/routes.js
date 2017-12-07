/**
 * Created by koqiui on 2017-04-09.
 */
var moduleName = 'Routes';
//----------------------------------------------
var __showDebug = true;
var __registFunction = null;
//[{path, component}, ...]
var __routeMaps = [];
//是否检查重复或覆盖注册
var __checkDuplicates = true;
//{ path => component}
var __routeMapAll = {};
var __routeRegistStates = {};
module.exports = {
    moduleName: moduleName,
    //
    debug: function (showDebug) {
        __showDebug = showDebug;
    },
    //是否检查重复注册
    checkDuplicates: function (trueOrFalse) {
        __checkDuplicates = trueOrFalse !== false;
    },
    //设置注册函数
    setRegistFunction: function (registFn) {
        __registFunction = registFn;
    },
    //
    add: function () {
        var routeMaps = arguments;
        for(var i = 0; i < routeMaps.length; i++) {
            var routeMap = routeMaps[i];
            //
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
            }
            else {
                //传入的是配置对象
                desc = routeMap.desc;
                path = routeMap.path;
                comp = routeMap.component;
                if(comp == null) {
                    console.error('找不到路由 ' + path + ' 对应的组件，确认是否导入了指定组件' + (desc == null ? '' : '(' + desc + ')') + '！');
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
            __routeMapAll[path] = comp;
            //
            __routeMaps.push(routeMap);
            //
            if(typeof __registFunction == 'function') {
                //注册路由时注册组件
                __registFunction(comp);
                if(__showDebug) {
                    console.trace('路由 ' + path + ' ' + (desc == null ? '' : '(' + desc + ')') + ' <' + name + '> 已加入 并且 已【注册组件】');
                }
            }
            else {
                if(__showDebug) {
                    console.trace('路由 ' + path + ' ' + (desc == null ? '' : '(' + desc + ')') + ' <' + name + '> 已加入');
                }
            }
        }
    },

    get: function (path) {
        return __routeMapAll[path];
    },

    all: function () {
        return __routeMaps;
    },

    clear: function () {
        __routeMaps.length = 0;
        __routeMapAll = {};
    }
};
