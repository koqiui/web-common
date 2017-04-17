/**
 * Created by koqiui on 2017-04-17.
 */
var moduleName = 'EventBus';
//----------------------------------------------
var dumyHandler = function () {
    console.trace('此事件处理函数已不存在');
};

function EventBusCoreFn(name) {
    var _name = name || '';
    var _handlers = {};
    //
    this.name = function () {
        return _name;
    };
    //
    this.bind = function (event, handler, trace) {
        trace = trace || '';
        handler = handler || null;
        event = event || '';
        if(event === '' || handler === null) {
            trace && console.trace(trace);
            console.warn('绑定的事件名称/处理函数不可为空！');
            //
            return this;
        }
        //
        var curHandlers = _handlers[event] || null;
        if(curHandlers === null) {
            _handlers[event] = curHandlers = [];
        }
        //
        if(curHandlers.indexOf(handler) === -1) {
            curHandlers.push(handler);
            //
            trace && console.trace(trace);
            console.trace('给定的 ' + event + ' 事件处理函数已绑定');
        }
        else {
            console.warn('给定的 ' + event + ' 事件处理函数已绑定过');
        }
        //
        return this;
    };

    this.unbind = function (event, handler, trace) {
        trace = trace || '';
        handler = handler || null;
        event = event || '';
        if(event === '') {
            trace && console.trace(trace);
            console.warn('解绑的事件名称不可为空！');
            //
            return this;
        }
        //
        var curHandlers = _handlers[event] || null;
        if(curHandlers === null) {
            return this;
        }
        //
        if(handler === null) {
            curHandlers.length = 0;
            //
            trace && console.trace(trace);
            console.trace('给定的 ' + event + ' 事件处理函数已*全部*解绑');
        }
        else {
            var index = curHandlers.indexOf(handler);
            if(index !== -1) {
                curHandlers.splice(index, 1);
                //
                trace && console.trace(trace);
                console.trace('给定的 ' + event + ' 事件处理函数已解绑');
            }
        }
        //
        return this;
    };

    //
    this.trigger = function (event, payload, extra) {
        extra = extra || null;
        payload = payload || null;
        event = event || '';
        //
        if(event === '') {
            trace && console.trace(trace);
            console.warn('触发的的事件名称不可为空！');
            //
            return this;
        }
        //
        var curHandlers = _handlers[event] || null;
        if(curHandlers === null) {
            return this;
        }
        //
        for(var i = 0, len = curHandlers.length; i < len; i++) {
            var handler = curHandlers[i] || dumyHandler;
            try {
                handler(event, payload, extra, this.name());
            }
            catch(ex) {
                console.error(ex);
            }
        }
        //
        return this;
    };
}

//handler(event, payload, extra);
var __defaultName = 'default';
var __cachedBuses = {};
//
var __defaultBus = __cachedBuses[__defaultName] = new EventBusCoreFn(__defaultName);

//
module.exports = {
    moduleName: moduleName,
    //
    get: function (name) {
        name = name || __defaultName;
        var retBus = __cachedBuses[name];
        if(retBus == null) {
            retBus = __cachedBuses[name] = new EventBusCoreFn(name);
        }
        //
        return retBus;
    },
    //
    bind: function (event, handler, trace) {
        return __defaultBus.bind(event, handler, trace);
    },
    unbind: function (event, handler, trace) {
        return __defaultBus.unbind(event, handler, trace);
    },
    trigger: function (event, payload, extra) {
        return __defaultBus.trigger(payload, extra);
    }
};


