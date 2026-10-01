/*
 * storage.js
 *
 * Storage support
 *
 * In MV2 this was synchronous by virtue of using localStorage, but that is no longer available.
 * In MV3, we emulate localStorage with 'oldStorage', which is a cache of the chrome.storage.local values
 * 
 *
*/

if (typeof(IETAB) == "undefined")
    IETAB = {};

_OLDSTORAGESTART = {
    set: function(key, value) {
        this[key] = String(value);
        var objSet = {};
        objSet[key] = String(value);
        chrome.storage.local.set(objSet);
    },

    remove: function(key) {
        delete this[key];
        chrome.storage.local.remove(key);
    }
}

oldStorage = _OLDSTORAGESTART;

IETAB.Storage = {
    _readyListeners: [],

    get: function(key) {
        var value = oldStorage[key];
        if(typeof(value) == "undefined")
            return null;

        try {
            return JSON.parse(value);
        } catch(ex) {
            // If it's not valid JSON (e.g. manually edited), just return null
            console.log('Invalid storage value: ' + key);
            return null;
        }
    },

    set: function(key, value) {
        if (!value && (typeof(value) != 'boolean')) {
            oldStorage.remove(key);
        }
        else {
            oldStorage.set(key, JSON.stringify(value));
        }


        if ( (key == 'ECMSettings') || (key == 'ECMTestSettings') ) {
            BackgroundProxy.call('onAutoUrlsChanged');
        }
    },

    remove: function(key) {
        oldStorage.remove(key);
    },

    callWhenReady: function(fnContinue) {
        if (this._ready) {
            fnContinue();
            return;
        }
        this._readyListeners.push(fnContinue);
    },

    _reloadStorageCache: function(fnContinue) {
        oldStorage = _OLDSTORAGESTART;
        chrome.storage.local.get(null, (items) => {
            Object.assign(oldStorage, items);
            fnContinue();
        });
     },

     _setupOffscreenDocument: function(path) {
        const offscreenUrl = chrome.runtime.getURL(path);

        if (!chrome.offscreen || !chrome.offscreen.Reason || !chrome.offscreen.Reason.LOCAL_STORAGE) {
            // In Chrome 109 (last version of Chrome for Windows 7), there is no offscreen
            // And LOCAL_STORAGE wasn't defined until Chrome 113
            console.log('Porting settings with tab');
            chrome.tabs.create( { url: offscreenUrl, selected: false }, (newTab) => {
                this.portMV2Tab = newTab;
            });
            return true;
        } else {
            // create offscreen document
            console.log('Porting settings with offscreen');
            var creating = chrome.offscreen.createDocument({
                url: offscreenUrl,
                reasons: ['LOCAL_STORAGE'],
                justification: 'To read MV2 localStorage and port to chrome.storage.local',
            });

            return false;
        }
    },

    _closeSettingsPortTab: function() {
        if (!this.portMV2Tab) {
            setTimeout(() => {
                this._closeSettingsPortTab();
            }, 500);
        }
        chrome.tabs.remove(this.portMV2Tab.id);
    },

    
    _portMV2Settings: function(fnContinue) {
        var usingTab = false;

        if (!Utils.inServiceWorker()) {
            // We only do this from the service worker not extension pages
            fnContinue();
            return;
        }
        if (oldStorage['mv2-port-finished']) {
            fnContinue();
            return;
        }
        console.log('Porting MV2 settings...');
        var fnListener = chrome.runtime.onMessage.addListener((msg, sender) => {
            if (msg.type == 'MV2_STORAGE') {
                for (var key in msg.storage) {
                    oldStorage.set(key, msg.storage[key]);
                }
                if (chrome.offscreen) {
                    chrome.offscreen.closeDocument();
                }
                chrome.runtime.onMessage.removeListener(fnListener);
                oldStorage.set('mv2-port-finished', true);
                console.log('MV2 settings port finished');
                if (usingTab) {
                    this._closeSettingsPortTab();
                }
                fnContinue();
            }
        });
        usingTab = this._setupOffscreenDocument('portmv2.html');
    },

    _init: function() {
        this._reloadStorageCache(() => {
            this._portMV2Settings(() => {
                this._ready = true;
                for (var i=0; i<this._readyListeners.length; i++) {
                    this._readyListeners[i]();
                }
                this._readyListeners = [];
                })
        });

        // Set a listener to reload the cache when the local storage changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace != 'local')
                return;

            for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
                if (typeof newValue == 'undefined') {
                    delete oldStorage[key]
                } else {
                    oldStorage[key] = newValue;
                }
            }
        });
    }
}

IETAB.Storage._init();