/**
 * Created by koqiui on 2017-04-09.
 */
var moduleName = 'Routes';
//----------------------------------------------
var __routeMaps = [];

module.exports = {
    moduleName: moduleName,
    //
    add: function () {
        var routeMaps = arguments;
        for(var i = 0; i < routeMaps.length; i++) {
            __routeMaps.push(routeMaps[i]);
        }
    },

    all: function () {
        return __routeMaps;
    },

    clear: function () {
        __routeMaps.length = 0;
    }
};
