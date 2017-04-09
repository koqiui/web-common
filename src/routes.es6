/**
 * Created by koqiui on 2017-04-09.
 */

export const moduleName = 'Routes';
//
const __routeMaps = [];

export function add(...routeMaps) {
    for (let i = 0; i < routeMaps.length; i++) {
        __routeMaps.push(routeMaps[i]);
    }
}

export function all() {
    return __routeMaps;
}

export function clear() {
    __routeMaps.length = 0;
}

export default {
    moduleName
}