/*
 *
 * remhost_proxy.js
 *
 * Loaded in the container tab, used to make calls on the RemoteHostManager
 *
 */

var RemoteHostProxy = {
    _port: null,

    _init: function() {
        // Connect to the remote host manager
        this._port = chrome.runtime.connect( { name: 'RemoteHostManager' });
        this._port.onMessage.addListener((msg) => {
            HostMessaging.onHostMessage(msg);
        });
    },

    call: function(name, arg, fnResponse) {
        chrome.runtime.sendMessage({ type: 'RH_CALL', fnName: name, arg: arg }, fnResponse);
    },

    setProp: function(name, value) {
        chrome.runtime.sendMessage({ type: 'RH_SETPROP', propName: name, value: value });
    },

    getProp: function(propName, fnResponse) {
        chrome.runtime.sendMessage({ type: 'RH_GETPROP', propName: propName }, fnResponse);
    },

    disconnect: function() {
        chrome.runtime.sendMessage({ type: 'RH_DISCONNECT' });
    }


}

RemoteHostProxy._init();
