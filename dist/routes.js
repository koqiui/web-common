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
            path: "/",
            component: first.component,
            desc: first.desc
        });
    }
    //
    return children;
}

function registChildren(children) {
    if(typeof __registFunction == 'function') {
        children = children || [];
        for(var i = 0; i < children.length; i++) {
            var child = children[i];
            //注册子路由组件
            __registFunction(child.component);
        }
    }
}
//
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
                        registChildren(routeMap.children);
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
                    //
                    if(routeMap.children != null) {
                        registChildren(routeMap.children);
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
                __routeMaps.push(routeMap);
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
