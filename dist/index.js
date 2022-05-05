/**
 * Created by koqiui on 2017-04-09.
 */
var moduleName = 'WC';
//----------------------------------------------

module.exports = {
    moduleName: moduleName,
    //
    Utils: require('./utils'),
    Ajax: require('./ajax'),
    Routes: require('./routes'),
    EventBus: require('./eventbus'),
    Store: require('./store'),

    Jqext: require('./jqext'),
    H5file: require('./h5file')
};