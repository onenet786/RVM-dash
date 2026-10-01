/*
 * nativehost_messaging_cs.js
 *
 * Code for the content script to communicate with the native host
 *
*/
var NativeHost_Messaging = {
    _fnPortListener: null,
    _port: null,
    _fnConnectComplete: null,

/*
    sendMessageImpl: function(msg, fnResponse) {
        chrome.runtime.sendMessage({
            type: 'NM_POSTMESSAGE',
            msg: msg
        }, fnResponse);
    },
*/
    postMessageImpl: function(msg) {
        this._port.postMessage({
            type: 'NM_POSTMESSAGE',
            msg: msg
        });
    },

    isConnectedImpl: function() {
        return !!this._hostName;
    },

    onPortMessage: function(msg) {
        switch(msg.type) {
            case 'NM_CONNECTED':
                if (this._fnConnectComplete) {
                    this._fnConnectComplete('OK');
                }
                break;
            case 'NM_HOSTMESSAGE':
                this.onHostMessage(msg.msg);
                break;
            case 'NM_DISCONNECTED':
                this._postMessageToListeners({ type: '_DISCONNECTED' });
                break;

            case 'NM_CONNECT_FAILED':
                if (this._fnConnectComplete) {
                    this._fnConnectComplete('FAILED');
                }
                break;

        }
    },

    /*
    *    connect
    *
    *    Connect to the native host.
    *    Possible response values:
    *
    *       OK
    *       E_NO_NATIVE_HOST      -- Could not connect to native host
    */
    connectImpl: function(hostName, fnResponse) {
        // First, open a standard Chrome communications port
        this._fnConnectComplete = (result) => {
            this._fnConnectComplete = null;
            fnResponse(result);
        }
        this._port = chrome.runtime.connect({ name: 'NativeHostManager' });
        this._fnPortListener = this.onPortMessage.bind(this);
        this._port.onMessage.addListener(this._fnPortListener);
        this._port.postMessage({ type: 'NM_CONNECT', hostName: hostName });
        this._port.onDisconnect.addListener(() => {
            chrome.runtime.sendMessage({ type: 'NM_DISCONNECT', hostName: this._hostName });
            this.onPortMessage({ type: 'NM_DISCONNECTED' });
        })
    },

    testForHostImpl: function(fnResult) {
        this.connect(function(result) {
            this.disconnect();
            fnResult(result == 'OK');
        }.bind(this), true);  // Skip the version check
    },

    disconnectImpl: function() {
        chrome.runtime.sendMessage({ type: 'NM_DISCONNECT', hostName: this._hostName });
    },

    hostInitImpl: function() {
        // nathost_port already handles message correlation.  Stacking them
        // is not only redundant but will cause a conflict because we simply
        // add _callId to the messages.
        this._enableMessageCorrelation = true;
    },

    onUnloadImpl: function() {
        // Make sure nobody else uses this port while we are cleaning up
        var port = this._port;
        this._port = null;
        if (port) {
            try {
                if (this._fnPortListener)
                    port.onMessage.removeListener(this._fnPortListener);
                if (this._fnPortDisconnectListener)
                    port.onDisconnect.removeListener(this._fnPortDisconnectListener);
            } catch(ex) {}
            this._fnPortListener = null;
            this._fnPortDisconnectListener = null;
        }
    }
}
