/*
 *
 * remhost_manager.js
 *
 * Manages remote host connections
 *
 * A single user only opens a single RDP session to the remote host
 *
 */

var RemoteHostManager = {
    _remoteHost: '',
    _remoteSessionId: null,
    _net: null,
    _waitingCreators: [],
    _lastConnectResult: 0,   // -1: failed, 0: unknown, 1: success
    _lastInputTime: new Date(),
    _userInfo: {},
    _tabPorts: [],
    _activeTabId: 0,

    FIREBASE_API_KEY: 'AIzaSyAYdB3iIRB7ZVDDiBLX8_g4tc6hzdDCeFM',
    PORT_TEST_INTERVAL_MS: 10000,
    IDLE_CHECK_INTERVAL_MS: 2000,
    IDLE_WARNING_TIME_S: 90,

    getUserInfo: function() {
        return this._userInfo;
    },

    sendMessage: function (msg) {
        // console.log('Sending ' + JSON.stringify(msg));
        if (this._net)
            this._net.send('ietab:' + JSON.stringify(msg), true);
    },

    isConnected: function() {
        return (this._net != null);
    },

    // Asynchonrous form of isConnected, so it can be called from tabs
    getConnected: function(argEmpty, fnResponse) {
        fnResponse(this.isConnected());
        return true;
    },


    internalMessageHandler: function(msg) {
        return false;
    },

    translateMessage: function(msg) {
        if (msg && msg.length >= 10 && msg.substr(0, 10) == 'clipboard|') {
            return 'ietab:{ "type": "CLIPBOARD_REMOTE_COPY",  "text": "' + escape(msg.substr(10)) + '"}';
        } else {
            return msg;
        }
    },

    onMessage: function (msg) {
        var i = 0;
        if (this.internalMessageHandler(msg))
            return;

        while (i < this._tabPorts.length) {
            var port = this._tabPorts[i];
            try {
                port.postMessage(msg);
                i++;
            } catch(ex) {
                // Otherwise, remove the port
                this._tabPorts.splice(i, 1);
            }
        }
    },

    sendProxyData: function(requestId, httpVersion, status, statusText, headers, data) {
        var msg = {
            id: requestId,
            httpVersion: httpVersion,
            status: status,
            statusText: statusText,
            headers: headers,
            data: data
        }
        // console.log('PROXY RESPONSE: ' + JSON.stringify(msg));
        this._net.send('proxy:' + JSON.stringify(msg),true);
    },

    onProxyMessage: function (msg) {
        // We are just picking an extension page to do the work.  Which may cause a problem if multiple tabs are open
        // and the one processing proxy requests for a different tab is closed.
        // For now, just pick the first open page we have

        var urlFilter = 'chrome-extension://' + chrome.runtime.id;
        chrome.tabs.query({}, (tabs) => {
            for (var i=0; i<tabs.length; i++) {
                if (tabs[i].url.indexOf(urlFilter) == 0) {
                    var msgWrapper = {
                        type: 'PROXY_REQUEST',
                        msg: msg
                    }
                    chrome.tabs.sendMessage(tabs[i].id, msgWrapper);
                    break;
                }
            }
        });
    },

    startConnectedPortsTest: function () {
        if (this._idPortTest)
            return;
        this._idPortTest = setInterval(this.testConnectedPorts.bind(this), this.PORT_TEST_INTERVAL_MS);
    },

    resetRemoteHost: function() {
        this.clearNetIntervals();
        if (this._net) {
            try {
                this._net.close();
            } catch(ex) {};

            this._net = null;
            this._remoteHost = null;
            this._remoteSessionId = null;
        }
    },

    showIdleWarning: function(timeRemaining) {
        var msg = {
            type: 'IDLE_WARNING',
            timeRemaining: timeRemaining
        }
        this.sendMessageToAllContainers(msg);
    },

    cancelIdleWarning: function() {
        var msg = {
            type: 'CANCEL_IDLE_WARNING'
        }
        this.sendMessageToAllContainers(msg);

    },

    idleTimeout: function() {
        var msg = {
            type: 'SESSION_TIMEOUT'
        }
        this.sendMessageToAllContainers(msg);
        this.onNetworkClosed(true);
    },

    getIdleTime: function() {
        return ((new Date()).getTime() - this._lastInputTime.getTime()) / 1000; 
    },

    // getIdleState
    //     0 = not idle
    //     1 = idle warning should be visible
    //     2 = we have surpassed the idle timeout period
    //
    getIdleState: function() {
        var idleTime = this.getIdleTime();

        if (idleTime > this._sessionIdleTimeout) {
            return 2;

        } else if (idleTime > (this._sessionIdleTimeout - this.IDLE_WARNING_TIME_S)) {
            return 1;
        } else {
            return 0;
        }
    },

    startIdleTracking: function() {
        // Note:  This tracker gets cleared by clearNetIntervals along with
        // some of the intervals set up by myrtille
        if (this._idleInterval)
            return;
        this._idleInterval = setInterval(function() {
            var idleState = this.getIdleState();

            if (idleState == 2) {
                this.idleTimeout();

            } else if (idleState == 1) {
                this.showIdleWarning(this._sessionIdleTimeout - this.getIdleTime());
            }
        }.bind(this), this.IDLE_CHECK_INTERVAL_MS);
    },

    resumeIdleSession: function() {
        this.fakeInputAction();
    },

    fakeInputAction: function() {
        if (this._net) {
            // Send a fake keydown / keyup combo for the 'SHIFT' key
            // to simulate activity and avoid idle timeout
            this._net.send('KSC16-1');
            this._net.send('KSC16-0');
        }
        this.updateLastInputTime();
    },

    updateLastInputTime: function() {
        var prevIdleState = this.getIdleState();
        this._lastInputTime = new Date();
        if ((prevIdleState == 1) && (this.getIdleState != 1)) {
            this.cancelIdleWarning();
        }
    },

    testConnectedPorts: function () {
        // Send a message through to all connected ports, this will purge
        // any that aren't live or that are failing to handle callbacks.
        this.onMessage({ type: 'NULL' });
        
        // If all ports are gone, then close our connection
        if (!this._tabPorts.length) {
            this.resetRemoteHost();
            clearInterval(this._idPortTest);
            this._idPortTest = 0;
        }
    },

    onNetworkError: function () {
        this.onNetworkClosed();
    },

    onNetworkClosed: function (skipMessage) {
        this.resetRemoteHost();
        if (this._lastConnectResult != 1) {
            // We failed to gracefully connect to the remote host.
            // Set lastConnectResult = -1, this will force us to try a different host on the next connection attempt
            this._lastConnectResult = -1;
            if (this.fnFinishConnect)
            {
                this.fnFinishConnect('Host Server Unavailable.  If your network is in working order, please contact us at support@ietab.net.');
            }
        }
        if (!skipMessage) {
            var msg = {
                type: 'NETWORK_CLOSED'
            }
            this.onMessage(msg);
        }
        this._tabPorts = [];
    },

    disconnect: function () {
        // We disconnect automatically with the port testing
    },

    refreshJWT: function(fnContinue) {
        if (!oldStorage['refreshToken']) {
            fnContinue();
            return;
        }

        var params = 'grant_type=refresh_token&refresh_token=' + oldStorage['refreshToken'];
        var req = new Request('https://securetoken.googleapis.com/v1/token?key=' + this.FIREBASE_API_KEY, {
            method: 'POST',
            credentials: 'include',
            redirect: 'follow',
            headers: {
                'Content-type': 'application/x-www-form-urlencoded'
            },
            body: params

        });
        fetch(req).then((response) => {
            if (response.status != 200) {
                console.log('Error ' + response.status + ' from token refresh request');
                fnContinue();
                return;
            }

            response.text().then((text) => {
                try {
                    var response = JSON.parse(text);
                    if (!response.id_token || !response.expires_in) {
                        throw 'No token in response';
                    }
                    var expires = new Date();
                    expires.setTime(expires.getTime() + parseInt(response.expires_in) * 1000);
                    chrome.cookies.set({
                        url: Settings.get('website'),
                        domain: 'ietab.net',
                        name: 'jwt',
                        path: '/',
                        expirationDate: Math.floor(expires.getTime() / 1000),
                        value: response.id_token
                    }, fnContinue );
                } catch(ex) {
                    console.log(ex.message);
                    fnContinue();
                }
            });
        })
    },

    updateIETabAuth: function(fnContinue) {
        if (!oldStorage['refreshToken']) {
            // There is nothing we can do without a refresh token regardless of
            // whether they have a JWT cookie
            fnContinue();
            return;
        }

        // See if they have a JWT
        chrome.cookies.get({ url: 'https://hub.ietab.net', name: 'jwt' }, function(cookie) {
            if (cookie && cookie.value) {
                // They have a JWT, let them through
                fnContinue();
                return;
            }

            // No auth token, try to refresh
            this.refreshJWT(fnContinue);
        }.bind(this));
    },

    updateRemoteHost: function (tabId, fnResponse) {
        this._remoteHost = null;
        this._remoteSessionId = null;

        this.updateIETabAuth(() => {
            var hubUrl = oldStorage['hub-host'];

            if (!hubUrl) {
                hubUrl = 'https://hub.ietab.net';
            }
            hubUrl += '/hubapi/userslots';
            if (this._lastConnectResult == -1) {
                hubUrl += '?retry=1';
            }
            var params = 'grant_type=refresh_token&refresh_token=' + oldStorage['refreshToken'];
            var req = new Request(hubUrl, {
                method: 'GET',
                credentials: 'include',
                redirect: 'follow',
                headers: {
                    'Content-type': 'application/x-www-form-urlencoded'
                }
            });
            fetch(req).then((response) => {
                if (response.status == 200) {
                    response.text().then((text) => {
                        var result = null;
                        try {
                            result = JSON.parse(text);
                        } catch (ex) {
                            console.log('Invalid JSON response from HUB = ' + response.responseText);
                            fnResponse('INVALID RESPONSE');
                        }
                        if (result && result.UserInfo) {
                            this._userInfo = result.UserInfo;
                        }
                        if (result && result.Host && result.SessionId) {
                            this._remoteHost = result.Host;
                            this._remoteSessionId = result.SessionId;
                            this._sessionIdleTimeout = result.SessionIdleTimeout;
                            fnResponse('OK');
                        } else if (result && result.RedirectUrl) {
                            var redirUrl = '';
                            if (result.RedirectUrl.match(/^http/))
                                redirUrl = result.RedirectUrl;
                            else
                                redirUrl = Settings.get('website') + '/' + result.RedirectUrl;
                            chrome.tabs.update(tabId, { url: redirUrl })
                        } else {
                            fnResponse('NO HOST AVAILABLE');
                        }
                    });
                } else if (response.status == 401) {
                    fnResponse('UNAUTHORIZED');
                } else {
                    fnResponse('HUB CONNECTION FAILED, STATUS: ' + response.status);
                }
            });
        });
    },

    initNetwork: function() {
        // Myrtille sets up some intevals for bandwidth usage and fulscreen updates but they don't cancel them.
        // We want to track them so we can cancel them when the network shuts down.
        /* This was legacy, we aren't using myrtille's fancy bandwidth checking logic
        var fnOldSetInterval = window.setInterval;
        window.setInterval = function(fnCallback, interval) {
            this._netIntervals = this._netIntervals || [];
            var result = fnOldSetInterval(fnCallback, interval);
            this._netIntervals.push(result);
            return result;
        }.bind(this);
        */
        try {
            this._net.init();
        } catch(ex) {
            // window.setInterval = fnOldSetInterval;
        }
    },

    clearNetIntervals: function() {
        if (this._idleInterval)
            clearInterval(this._idleInterval);
        this._idleInterval = null;

        /* There is no setInterval, if this is necessary then find another way
        if (!this._netIntervals)
            return;
        for (var i=0; i<this._netIntervals.length; i++) {
            window.clearInterval(this._netIntervals[i]);
        }
        this._netIntervals = [];
        */
    },

    sendMessageToAllContainers: function(msg) {
        var i = 0;
        msg.sendToAll = true;

        while (i < this._tabPorts.length) {
            var port = this._tabPorts[i];
            try {
                port.postMessage(msg);
                i++;
            } catch (ex) {
                this._tabPorts.splice(i,1);
            }
        }
    },

    connectImpl: function (tabId, fnResult) {
        try {

            if (this._net) {
                fnResult('OK'); // Connected and ready to go!
                chrome.tabs.sendMessage(this._activeTabId, { type: 'RH_INITUSER' });
                return;
            }

            if (!this._remoteHost || !this._remoteSessionId) {
                this.updateRemoteHost(tabId, function (result) {
                    if (result == 'OK') {
                        // Try again
                        this.connectImpl(tabId, fnResult);
                    } else {
                        fnResult(result);
                    }
                }.bind(this));
                return;
            }

            this.config.remoteHost = this._remoteHost;
            this.config.remoteSessionId = this._remoteSessionId;
            this._net = new Network(this.config, this.dialog, this.config.display);
            this._net.onerror = this.onNetworkError.bind(this);
            this._net.onclosed = this.onNetworkClosed.bind(this);
            this._lastConnectResult = 0;
            this.fnFinishConnect = this._net.fnFinishConnect = function (result) {
                if (result == 'OK') {
                    this._lastConnectResult = 1;
                    this.startIdleTracking();
                    chrome.tabs.sendMessage(this._activeTabId, { type: 'RH_INITUSER' });
                }
                fnResult(result);
            }.bind(this);

            this._net.onMessage = function (msg) {
                if ((msg.indexOf('ietab:') == 0) || (msg.indexOf('clipboard|') == 0)) {
                    try {
                        msg = this.translateMessage(msg);
                        this.onMessage(JSON.parse(msg.substr(6)));
                    } catch (ex) {
                        console.log('Invalid Helper Message: ' + msg);
                    }
                    return true;
                } else if (msg.indexOf('proxy:') == 0) {
                    try {
                        this.onProxyMessage(JSON.parse(msg.substr(6)));
                    } catch(ex) {
                        console.log('Invalid Proxy Message: ' + msg);
                    }
                }

                return false;
            }.bind(this);

            this.initNetwork();
        }
        catch (exc) {
            console.log('failed to start myrtille: ' + exc.message);
            this.resetRemoteHost();
            fnResult('FAIL');
        }
    },

    connect: function (arg, fnResult) {
        var tabId = this._currentCallTabId;
        this.connectImpl(tabId, (result) => {
            if (result == 'OK') {
                this.startConnectedPortsTest();
            }
            fnResult(result);
        });
        return true;  // Asynchronous result
    },

    sendFullScreenUpdate: function () {
        this._net.send(this._net.getCommandEnum().REQUEST_FULLSCREEN_UPDATE.text);
    },

    // These are calls from the remote host proxy in the IE container tab
    onRHProxyCall: function(msg, sender, fnResponse) {
        this._currentCallTabId = sender.tab.id;
        return this[msg.fnName](msg.arg, fnResponse);
    },

    onRHProxySetProp: function(msg, fnResponse) {
        this[msg.propName] = msg.value;
    },

    onRHProxyGetProp: function(msg, fnResponse) {
        var obj = this;
        var nextName = msg.propName;
        var restName = msg.propName;
        do {
            var nextDot = restName.indexOf('.');
            if (nextDot != -1) {
                nextName = restName.slice(0, nextDot);
                obj = obj[nextName];
                restName = restName.slice(nextDot+1);
            }
            else {
                break;
            }
        } while(true);
        
        fnResponse(obj[restName]);

    },

    onNetworkSend: function(msg) {
        this._net.send(msg.data, msg.excludeImg);
    },

    onProcessUserEvent: function(msg) {
        this._net.processUserEvent(msg.event, msg.data);
    },

    onTabMessage: function(msg, sender, fnResponse) {
        // Note:  Return true if the fnResponse callback is expected to be asynchronous
        switch(msg.type) {
            case 'RH_CALL': 
                return this.onRHProxyCall(msg, sender, fnResponse);
            case 'RH_SETPROP':
                this.onRHProxySetProp(msg, fnResponse);
                return false;
            case 'RH_GETPROP':
                this.onRHProxyGetProp(msg, fnResponse);
                return false;
            case 'RH_NETWORK_SEND':
                this.onNetworkSend(msg);
                return false;
            case 'RH_NETWORK_PROCESSUSEREVENT':
                this.onProcessUserEvent(msg);
                return false;
            case 'RH_DISCONNECT':
                RemoteHostManager.disconnect(sender);
                return false;
        }

    },

    setActiveTab: function(tabId) {
        if (tabId) {
            this._activeTabId = tabId;
        } else {
            chrome.tabs.query({ active: true }, (tabs) => {
                this._activeTabId = tabs[0].id;
            });
        }
    },

    addImage: function(idx, posX, posY, width, height, format, quality, fullscreen, imgData) {
        var msg = {
            type: 'RH_ADDIMAGE',
            posX: posX,
            posY: posY,
            width: width,
            height: height,
            format: format,
            quality: quality,
            fullscreen: fullscreen
        };
        // imgData is a Uint8Array and for some reason these don't JSON-ify without help, so we use a custom
        // stringifier
        msg.imgData = Utils.Uint8ArrayToJson(imgData);

        chrome.tabs.sendMessage(this._activeTabId, msg);
    },


    _init: function () {
        try {
            // We can't provide the host here because we don't know the server URL at the time we load,
            // we only know it when we obtain it from the hub.  But we want to initialize Myrtille, so
            // just use 127.0.0.1 which is fine, we'll update it before we connect
            var httpServerUrl = 'http://127.0.0.1/Myrtille/';
            var remoteSessionActive = false;
            var statEnabled = false;
            // Technically, debugEnabled should be false.  But unfortunately Myrtille's design captures a bunch of
            // exceptions and logs them with Debug.showDebug so you don't see them.  So frankly if debugEnabled doesn't do
            // anything that is bad for performance, I'm inclined to leave it enabled.  Check whether it does!
            var debugEnabled = false;
            var compatibilityMode = false;
            var browserResize = false;
            //var displayWidth = window.screen.availWidth;
            // var displayHeight = window.screen.availHeight;
            var displayWidth = 1920;
            var displayHeight = 1080;

            this.config = new Config(httpServerUrl, statEnabled, debugEnabled, compatibilityMode, browserResize,  displayWidth, displayHeight, 'RDP', false);
            this.dialog = new Dialog(this.config);
        }
        catch (exc) {
            console.log('failed to start myrtille: ' + exc.message);
            myrtille = null;
        }

        // Listen for messages
        chrome.runtime.onMessage.addListener((message, sender, fnResponse) => {
            return this.onTabMessage(message, sender, fnResponse);
        });
        chrome.runtime.onConnect.addListener((port) => {
            if (port.name != 'RemoteHostManager')
                return;

            // We use the port to communicate host messages
            this._tabPorts.push(port);
        });

    }
}



RemoteHostManager._init();
