/**
 * Created by koqiui on 2017-04-09.
 */
var moduleName = 'Routes';
//----------------------------------------------
//[{path, component}, ...]
var __routeMaps = [];
//是否检查重复或覆盖注册
var __checkDuplicates = true;
//{ path => component}
var __routeMapAll = {};
module.exports = {
    moduleName: moduleName,
    //是否检查重复注册
    checkDuplicates: function (trueOrFalse) {
        __checkDuplicates = trueOrFalse !== false;
    },
    //
    add: function () {
        var routeMaps = arguments;
        for(var i = 0; i < routeMaps.length; i++) {
            var routeMap = routeMaps[i];
            var path = routeMap.path;
            var comp = routeMap.component;
            if(comp == null) {
                console.error("找不到路由 " + path + " 对应的组件（确认是否导入了指定组件）！");
                continue;
            }
            else if(__checkDuplicates) {
                var existed = __routeMapAll[path];
                if(existed != null) {
                    if(comp == existed) {
                        console.debug("路由重复：" + path + " => " + (comp.name || "<未命名>"));
                    }
                    else {
                        console.error("路由覆盖：" + path + " => " + (comp.name || "<未命名>") + " 要覆盖 " + (existed.name || "<未命名>"));
                    }
                    //
                    continue;
                }
                __routeMapAll[path] = comp;
            }
            //
            __routeMaps.push(routeMap);
        }
    },

    all: function () {
        return __routeMaps;
    },

    clear: function () {
        __routeMaps.length = 0;
        __routeMapAll = {};
    }
};
