/*
 *
 * background_proxy.js
 *
 * Proxies for operations that we need to perform in the background service worker.
 * When loaded in the service worker it will just make the calls directly to the background object,
 * But when loaded in the container page or the options page it will send a message to make the call
 * 
 */

var BackgroundProxy = {
    _port: null,
    _isProxy: false,

    _init: function() {

        if (typeof Background == 'undefined') {
            this._isProxy = true;
        } else {
            // Listen for messages
            chrome.runtime.onMessage.addListener((message, sender, fnResponse) => {
                return this.onTabMessage(message, sender, fnResponse);
            });
        }
    },

    onTabMessage: function(msg, sender, fnResponse) {
        // Note:  Return true if the fnResponse callback is expected to be asynchronous
        switch(msg.type) {
            case 'BP_CALL': 
                return this.call(msg.fnName, msg.arg, fnResponse);
            case 'BP_CALL2':
                return this.call2(msg.fnName, msg.arg1, msg.arg2, fnResponse);
            case 'BP_SETPROP':
                Background[msg.propName] = msg.value;
                return false;
            case 'BP_GETPROP':
                fnResponse(Background[msg.propName]);
                return false;
       }
    },

    call: function(name, arg, fnResponse) {
        if (this._isProxy) {
            chrome.runtime.sendMessage({ type: 'BP_CALL', fnName: name, arg: arg }, fnResponse);
        } else {
            if (fnResponse) {
                fnResponse(Background[name](arg));
            }
            else {
                Background[name](arg, fnResponse);
            }
        }
    },

    call2: function(name, arg1, arg2, fnResponse) {
        if (this._isProxy) {
            chrome.runtime.sendMessage({ type: 'BP_CALL2', fnName: name, arg1: arg1, arg2: arg2 }, fnResponse);
        } else {
            if (fnResponse) {
                fnResponse(Background[name](arg1, arg2));
            }
            else {
                Background[name](arg, fnResponse);
            }
        }
    },

    setProp: function(name, value) {
        chrome.runtime.sendMessage({ type: 'BP_SETPROP', propName: name, value: value });
    },

    getProp: function(propName, fnResponse) {
        chrome.runtime.sendMessage({ type: 'BP_GETPROP', propName: propName }, fnResponse);
    }

}

BackgroundProxy._init();
