/*
 * remotehost.js
 *
 * Code for communicating with a remote host
 *
*/
var RemoteHost_Messaging = {
    _connected: false,
    _helperId: null,

    postMessageImpl: function (msg) {
        RemoteHostProxy.call('sendMessage', msg);
    },

    isConnectedImpl: function() {
        return this._connected;
    },

    // setHelperInfo is used by pop-ups who already know their connection info
    // and just need to activate the pop-up.
    setHelperInfo: function (helperId, hostWindowId) {
        this._helperId = helperId;
        this.setIncludeWithAll({ helperId: helperId, hostWindowId: hostWindowId });
    },

    onHostMessage: function (msg) {
        // If we don't have a helper process and this is CREATE_SUCCESS, then GRAB IT!
        if (!this._helperId && (msg.type == 'CREATE_SUCCESS')) {
            this._helperId = msg.helperId;
            this.setIncludeWithAll({ helperId: msg.helperId });
        }

        if (IEContainer.preTranslateHostMessage(msg)) {
            return;
        }

        if (msg.sendToAll || (this._helperId && (this._helperId == msg.helperId))) {
            // We use a setTimeout to simplify debugging.  Chrome has a bug that necessitates this.
            // We are called in this context from the background page and when you cross page contexts
            // console logging and debuggin do not work in this destination context.  But by processing
            // the message asynchronously with a setTimeout we get back the ability to use console
            // logging and debugging
            window.setTimeout(function () {
                this.base__onHostMessage(msg);
            }.bind(this), 0);
        }
        // Don't return true even if it's ours because we can have multiple windows with the same helper
        return false;
    },

    /*
    *    connectImpl
    *
    *    connect to the remote host.
    *
    */
    connectImpl: function (hostName, fnResponse) {
        RemoteHostProxy.call('connect', null, fnResponse);
    },

    testForHostImpl: function(fnResult) {
        fnResult('OK');
    },

    disconnectImpl: function () {
        RemoteHostProxy.call('disconnect');
    },

    hostInitImpl: function () {
    },

    onUnloadImpl: function() {
        RemoteHostProxy.disconnect();
    }
}
