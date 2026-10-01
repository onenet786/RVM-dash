/*
 *
 * nathost_manager.js
 *
 * Manages native host connections.
 *
 * We used to open a new native host connection for each tab.  But now we allow
 * for session sharing which means one native host for all tabs that are using
 * a compatible set of settings (e.g. same IE compatibility mode).
 *
 */
var NativeHostManager = {
    HOST_VERSION: '18.8.19.1',
    HOST_ID_PERUSER: 'net.ietab.ietabhelper.peruser',
    HOST_ID_PERBOX: 'net.ietab.ietabhelper.perbox',
    HOST_FILE_NAME: 'ietabhelper.dat',
    HOST_MANIFEST_FILE_NAME: 'ietab_nm_manifest.json',
    UPGRADE_TIMEOUT:  10000,

    // A map of nathost-options-string ==> live native host ports
    _nativeHostPorts: {},

    // Pending connections for each host-name.
    _connectionPending: {},

    // We keep a host alive for a certain number of seconds after its last use.
    // Last use means there are either active listeners or it is the time the last message was sent
    _hostKeepAlives: [
        { regex: /^worker$/, timeout: 10000 },
        { regex: /^shared*/, timeout: 3600 * 24 * 1000 },
        { regex: /^host-test$/, timeout: 5000 }
    ],
    DEFAULT_HOST_KEEPALIVE: 5000,

    _updateAllowedOrigins: function(manifestContent) {
        // hehijbfgiekmjfkfjpbkbammjbdenadd - Chrome Web Store release
        // knnoopddfdgdabjanjmeodpkmlhapkkl - IE Tab Enterprise edition
        // ncdgipmkgkhennagnfmnlkflidilhbdi - IE Tab Enterprise self-deployed
        // npjkkakdacjaihjaoeliacmecofghagh - Windows Store for Edge
        // almljgkjodjgoldenkijomojnejpkcjk - IE Tab Beta for Chrome
        // lfcnklibhpibaknkjjbgbnebephkcomf - IE Tab MV3 Beta
        var origins = [
            'chrome-extension://hehijbfgiekmjfkfjpbkbammjbdenadd/',
            'chrome-extension://knnoopddfdgdabjanjmeodpkmlhapkkl/',
            'chrome-extension://ncdgipmkgkhennagnfmnlkflidilhbdi/',
            'chrome-extension://npjkkakdacjaihjaoeliacmecofghagh/',
            'chrome-extension://almljgkjodjgoldenkijomojnejpkcjk/',
            'chrome-extension://lfcnklibhpibaknkjjbgbnebephkcomf/'
        ];
        var me = chrome.runtime.getURL('');
        if ( (origins[0] != me) && (origins[1] != me)) {
            origins.push(me);
        }
        var cleanOrigins = JSON.stringify(origins);
        cleanOrigins = cleanOrigins.replace(/[\[\]]/g, '');
        return manifestContent.replace('ALLOWED_ORIGINS', cleanOrigins);
    },

    /*
     **  processIntallerFiles
     **
     **   Given the installer file content as Base-64 encoded and the manifest file content,
     **   this does the actual work of performing the installation
     **
     */
    _processInstallerFiles: function(fileContent, manifestContent, fnResult) {
        this.sendWorkerMessage({
            type: 'UPGRADE',
            version: this.HOST_VERSION,
            fileContent: fileContent,
            manifestContent: manifestContent
        }, function(msgResult) {
            fnResult(msgResult.type);
        });
    },

    getAllOpenHosts: function() {
        return this._nativeHostPorts;

    },

    /*
     **   upgradeHost
     *
     *    This function should only be called on the NativeHost object in the background page, otherwise
     *    we could end up with multiple times trying to perform simultaneous upgrades.
     *
     *    This function will call fnResult with one of:
     *        OK
     *        E_UPGRADE_FAILED
     */
    upgradeHost: function(fnResponse) {
        // Allow just one caller to upgrade at a time
        var failTimeout = self.setTimeout(function() {
            fnResponse('E_UPGRADE_FAILED');
        }, this.UPGRADE_TIMEOUT);

        // Get the host file content as base64
        Utils.getFileContent(this.HOST_FILE_NAME, true, function(content) {
            var fileContent = content;
            // Get the manifest file content
            Utils.getFileContent(this.HOST_MANIFEST_FILE_NAME, false, function(content) {
                var manifestContent = this._updateAllowedOrigins(content);

                // Do the installer work
                this._processInstallerFiles(fileContent, manifestContent, fnResponse);

            }.bind(this));
        }.bind(this));
    },

    /*
     **  checkVersion
     *
     *   This function will call fnResult with one of:
     *       OK
     *       E_UPGRADE_FAILED
     *       E_VERSION_MIN_FAILED
     */
    checkVersion:  function(fnResult) {
        // CHECK_VERSION msg will respond with:
        //
        //    OK
        //    E_VERSION_MIN_FAILED    -- The extension version is too small for the host version
        //    UPGRADE_HOST            -- The host version is smaller than the extension's host version, initiate upgrade
        //
        this.sendWorkerMessage({
            type: 'CHECK_VERSION',
            extVersion: chrome.runtime.getManifest().version,
            hostVersion: this.HOST_VERSION
        }, function(msgResult) {
            if (msgResult.type == 'UPGRADE_HOST') {
                this.upgradeHost(function(result) {
                    if (result == 'OK') {
                        // Re-connect the 'worker' to the new native host
                        this.disconnectHost('worker');
                        this._connect('worker', fnResult);
                    } else {
                        fnResult(result);
                    }
                }.bind(this));
            } else {
                // Either OK or E_VERSION_MIN_FAILED
                fnResult(msgResult.type);
            }
        }.bind(this));
    },

    // Connect to the existing worker host or launch a new one if we are not already connected, then
    // send the message.
    //
    // Automatically disconnects from the worker host after a timeout period
    //
    sendWorkerMessage: function(msg, fnResponse) {
        this.getNativeHostPort('worker', function(port) {
            if(port) {
                port.sendMessage(msg, fnResponse);
            } else {
                if (fnResponse) {
                    fnResponse({ type: 'HELPER_NOT_INSTALLED' });
                }
            }
        }.bind(this));
    },

    _testNativeHost: function(port, fnResult) {
        if (port) {
            var oldMessageCorrelation = port._enableMessageCorrelation;
            port._enableMessageCorrelation = true;
            port.sendMessage({ type: 'PING' }, function(msgResponse) {
                if (msgResponse && (msgResponse.type == 'PONG')) {
                    fnResult(true);
                    oldStorage.set('helper-version', msgResponse.helperVersion);
                } else {
                    fnResult(false);
                }
                port._enableMessageCorrelation = oldMessageCorrelation;
            });
        }
    },

    /*
     *    tryConnectHost
     *
     *    Try to connect to the native host with the specified hostId.  It connects the port
     *    and sends an initial PING to confirm receipt.
     *
     *    It replies with null if it cannot connect or receive a ping response.
     *
     */
    _tryConnectHost: function(hostId, fnResponse) {
        var port = null;
        var reportedBack = false;

        var fnSafeResponse = function(port) {
            // Avoid re-entrancy if onDisconnect happens at the same time as we are sending the response
            // Since such operations are asynchronous
            if (reportedBack) {
                return;
            }
            reportedBack = true;
            fnResponse(port);
        }.bind(this);

        var fnDisconnect = function() {
            // We have to listen for onDisconnect if the host is missing
            fnSafeResponse(null);
        }.bind(this);

        try {
            port = chrome.runtime.connectNative(hostId);
            // In some cases Chrome lets you "connect" only to disconnect when you try to
            // send a message.  I believe this may just be legacy from the early days of native
            // messaging, but it doesn't hurt to keep this logic.
            port.onDisconnect.addListener(fnDisconnect);
        } catch(ex) {
            fnSafeResponse(null);
            return;
        }

        // Add our wrapper to the port for additional functionality
        port = new NativeHostPort(port);
        var extVersion = chrome.runtime.getManifest().version;

        var firstSeen = IETAB.Storage.get("firstSeen") / 1000;
        port.sendMessage({ type: 'PING', extVersion: extVersion, firstSeen: firstSeen }, function(msg) {
            port.onDisconnect.removeListener(fnDisconnect);
            port.onDisconnect.addListener(function() {
                port = null;
            }.bind(this));
            if (msg && (msg.type == 'PONG')) {
                oldStorage.set('helper-version', msg.helperVersion)
                port._processId = msg.processId;
                fnSafeResponse(port);
            } else {
                port = null;
                fnSafeResponse(port);
            }
        }.bind(this));
    },

    _finishConnect: function(name, port) {
        // Note:  Connection may have failed in which case port would be null
        if (port) {
            // Map this new port
            this._nativeHostPorts[name] = port;

            // Listen for disconnects.
            port.onDisconnect.addListener(function() {
                this.disconnect(port);
            }.bind(this));

            // Start checking for host shutdown (but we only need this for the worker now)
            if (name == 'worker') {
                this._checkHostShutdown();
            }
        }

        // Send the session cookies
        if (Settings.get('single-session')) {
            Cookies.sendSessionCookies(port);
        }

        // Notify connection pending listeners
        var arrListeners = this._connectionPending[name];
        delete this._connectionPending[name];
        for (var i=0; i<arrListeners.length; i++) {
            try {
                arrListeners[i](port);
            } catch(ex) {}
        }
    },

    /*
     *    _connect
     *
     *    Connect to the native host by name.
     *
     *       OK
     *       E_NO_NATIVE_HOST      -- Could not connect to native host
     */
    _connect: function(name, fnResponse) {

        // If we are already trying to connect, then just add their callback to
        // the queue for notification
        if (this._connectionPending[name]) {
            this._connectionPending[name].push(fnResponse);
            return;
        }

        // Connection is pending for this host
        this._connectionPending[name] = [ fnResponse ];

        // Try the per-user host
        this._tryConnectHost(this.HOST_ID_PERUSER, function(port) {
            if (port) {
                this._finishConnect(name, port);
                return;
            }
            // Try the per-box host
            this._tryConnectHost(this.HOST_ID_PERBOX, function(port) {
                if (port) {
                    this._finishConnect(name, port);
                    return;
                }
                this._finishConnect(name, null);
            }.bind(this));
        }.bind(this));
    },

    disconnectHost: function(name) {
        var port = this._nativeHostPorts[name];
        if (port) {
            this.disconnect(port);
        }
    },

    disconnect: function(port) {
        // See if we have a mapping for this port and remove it
        for (var name in this._nativeHostPorts) {
            if (this._nativeHostPorts[name] == port) {
                delete this._nativeHostPorts[name];
                break;
            }
        }
        try {
            port.disconnect();
        } catch(ex) {
            // Ignore errors
        }
    },

    getNativeHostPort: function(name, fnResponse) {
        var port = this._nativeHostPorts[name];

        if (!port) {
            this._connect(name, fnResponse);
            return;
        }

        // We have a port, but do a PING test first
        this._testNativeHost(port, function(result) {
            if (result) {
                fnResponse(port);
            } else {
                // Clean up this entry pointing to a bad port
                this.disconnect(port);
                // And try to launch a new one
                this._connect(name, fnResponse);
            }
        }.bind(this));
    },

    _getHostKeepAlive: function(hostName) {
        var entry;
        for (var i=0; i<this._hostKeepAlives.length; i++) {
            entry = this._hostKeepAlives[i];
            if (hostName.match(entry.regex)) {
                return entry.timeout;
            }
        }
        return this.DEFAULT_HOST_KEEPALIVE;
    },

    // Check host keepalive timeouts and shutdown unused host processes
    _checkHostShutdown: function() {
        var hostName;
        var lastMessages;
        var now;
        var keepAlive;

        for (hostName in this._nativeHostPorts) {
            var port = this._nativeHostPorts[hostName];
            if (port.hasListeners()) {
                continue;
            }
            lastMessage = port.getLastSentMessageTime();
            now = (new Date()).getTime();
            keepAlive = this._getHostKeepAlive(hostName);

            if (now - lastMessage > keepAlive) {
                this.disconnect(port);
            }
        }

        // If any hosts / ports are still alive, then check back later
        var checkBack = Number.MAX_VALUE;
        for (hostName in this._nativeHostPorts) {
            checkBack = Math.min(checkBack, this._getHostKeepAlive(hostName));
        }

        if (checkBack != Number.MAX_VALUE) {
            setTimeout(function() {
                this._checkHostShutdown();
            }.bind(this), checkBack+1);
        }
    },

    _removeTabFromPort: function(tabPort) {
        if (!tabPort.nhPort || !tabPort.nhPort.activeTabs)
            return;
        var activeTabs = tabPort.nhPort.activeTabs;
        if (!activeTabs)
            return;

        for (var i=0; i<activeTabs.length; i++) {
            if (activeTabs[i] == tabPort) {
                activeTabs.splice(i, 1);
                break;
            }
        }
        setTimeout(() => {
            // See if this port should be disconnected.  We wait 5 seconds in case a popup
            // was asynchronously opened before we closed.
            if (!tabPort.nhPort.activeTabs || !tabPort.nhPort.activeTabs.length) {
                try {
                    tabPort.nhPort.disconnect();
                } catch(ex) {

                }
            }
        }, 5000);
    },

    _onTabMessage: function(msg, tabPort) {
        // We need the hostWindowId so we can send our own message on disconnect.
        // This is particularly because PAGE_UNLOAD might not get sent to the host
        // window to tell it to close!
        if (msg.msg && msg.msg.hostWindowId) {
            tabPort.hostWindowId = msg.msg.hostWindowId;
        }
        switch(msg.type) {
            case 'NM_CONNECT':
                this.getNativeHostPort(msg.hostName, (nhPort) => {
                    if (!nhPort) {
                        tabPort.postMessage({
                            type: 'NM_CONNECT_FAILED'
                        });
                        return;
                    }

                    // Success
                    nhPort._enableMessageCorrelation = false;
                    tabPort.nhPort = nhPort;
                    if (nhPort.activeTabs) {
                        nhPort.activeTabs.push(tabPort);
                    } else {
                        nhPort.activeTabs = [ tabPort ];
                    }
                    nhPort.onDisconnect.addListener(() => {
                        try {
                            tabPort.postMessage({ 
                                type: 'NM_DISCONNECTED'
                            });
                        } catch(ex) {
                            // This can happen and it is normal
                        }
                    })
                    nhPort.onMessage.addListener((msg) => {
                        try {
                            tabPort.postMessage({
                                type: 'NM_HOSTMESSAGE',
                                msg: msg
                            });
                        } catch(ex) {
                            // The tab might go away before us!
                        }
                    });
                    tabPort.postMessage({
                        type: 'NM_CONNECTED'
                    })
                });
                break;
            case 'NM_POSTMESSAGE':
                tabPort.nhPort.postMessage(msg.msg);
                break;
        }
    },

    _init: function() {
        this._checkHostShutdown();

        chrome.runtime.onConnect.addListener(tabPort => {
            if (tabPort.name != 'NativeHostManager')
                return;

            tabPort.onDisconnect.addListener(() => {
                try {
                    // We don't always get this if it for example calls window.close(), so let the host know
                    // to go away.
                    tabPort.nhPort.sendMessage({ type: 'PAGE_UNLOADED', hostWindowId: tabPort.hostWindowId });
                } catch(ex) {

                }
                // Remove the tab and if it's the last tab then shut down
                this._removeTabFromPort(tabPort);
            });

            tabPort.onMessage.addListener((msg) => {
                this._onTabMessage(msg, tabPort);
            });
        });
    }
}

NativeHostManager._init();
