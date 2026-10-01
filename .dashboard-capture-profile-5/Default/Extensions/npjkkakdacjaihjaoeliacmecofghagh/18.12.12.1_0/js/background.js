/*
 *  background.js
 *
 * Code for the background page (shocker!)
 *
*/

console.log('SW Started: ' + (new Date()));

//
// Hack for bug where the old version of the service worker might be cached
// https://mail.google.com/mail/u/0/#category/forums/FMfcgzQVxbfvkZcZwdnhBnvCLwpXVzsz
//
self.addEventListener('install', event => {
    // Force the waiting service worker to become the active service worker immediately
    self.skipWaiting();
  });

  self.addEventListener('activate', event => {
      // Ensure the new service worker takes control of all clients immediately
      self.clients.claim()
  });



var Background = {
    nextTabId: 0,
    popupInfo: {},     // Map that holds the port and hostWindowId for new popups
    isFirstRun: false,
    helperVersion: null,
    pendingAutoUrls: {}, // The set of URLs that are pending opening in IE Tab
    autoUrlDetails: {},
    forceLocal: {},
    waitForInitQueue: [],
    redirectingTabs: {},

    usingBlockingWebRequest: false,
    removedBlockingWebRequest: false,
    
    IEOBJECT_KEEP_ALIVE: 15000,
    NATHOST_KEEP_ALIVE: 15000,
    RELOAD_DELAY: 3000,
    PENDING_AUTOURL_TIMEOUT: 10000,
    DOWNLOAD_START_TOLERANCE: 5000,
    STARTUP_DOWNLOAD_MAX_AGE: 15000,
    FORCE_LOCAL_TIMEOUT: 20000,

    FIXED_AUTOURL_EXCEPTIONS: [
        'r/^chrome[^\:]*\:.*',
        'r/^edge[^\:]*\:.*'
    ],
    
    getNextIETabId: function() {
        this.nextTabId++;
        return this.tabIdPrefix + this.nextTabId;
    },

    isInEdge: function() {
        return (navigator.userAgent.indexOf('Edg/') != -1);
    },

    isAutoURL: function(url) {
        if (this.forceLocal[url]) {
            return false;
        }
        var filter = Settings.getAutoURLFilter(url);
        if (!filter)
            return false;
        return !Settings.filterHasOption(filter, 'not-auto');
    },

    isAutoURLException: function(url)
    {
        return !!Settings.listMatch(url, 'exclusion-list');
    },

    addForceLocal: function(url) {
        // Cleanup any existing entries
        var now = (new Date()).getTime();
        var urlEntry;
        var timeCreated;
        for (urlEntry in this.forceLocal) {
            timeCreated = this.forceLocal[urlEntry];
            if (now - timeCreated > this.FORCE_LOCAL_TIMEOUT) {
                delete this.forceLocal[urlEntry];
            }
        }

        // And add our new entry
        this.forceLocal[url] = (new Date()).getTime();
    },

    getContainerPage: function() {
        return 'u.htm';
    },

    getNativeHostContainer: function(url) {
        return chrome.runtime.getURL('nhc.htm') + '#url=' + url;
    },

    openWithIETab: function(tabId, url) {
        // We do not allow them to re-open the getting started page using IE Tab
        if(url.indexOf("ie-tab-getting-started") != -1)
            return;

        var containerUrl;
        // If native host has been detected or the plugin doesn't work, go with native host.
        // We have to go there eventually anyhow.
        containerUrl = this.getNativeHostContainer(url);

        // Not sure why we have a 100 ms delay, leaving now because I assume it was determined it was necessary.
        self.setTimeout(function() {
            if (!tabId)
                chrome.tabs.create({ url: containerUrl });
            else
                chrome.tabs.update(tabId, { url: containerUrl });
        }, 100);
    },

    onFirstRun: function()
    {
        if (this.didRunFirstRun) {
            return;
        }
        this.didRunFirstRun = true;

        if (!this.isInEdge() && !Settings.get('disable-intro-page')) {
            if (Settings.get('use-remote-host')) {
                targetUrl = 'http://www.ietab.net/hostedfirstrun';
                chrome.tabs.create({  url: targetUrl });
            } else {
                targetUrl = "http://www.ietab.net/thanks-installing-ie-tab";
                // Do not show for admin installs
                chrome.management.getSelf(function(info) {
                    if(info.installType != 'admin') {
                        chrome.tabs.create({  url: targetUrl });
                    }
                }.bind(this));
            }
        }
    },

    onUpgrade: function() {
    },

    // Connect to the host if we are not already connected and send the message.
    // Automatically disconnects from the host after a timeout period
    // Will reply with { type: 'HOST_NOT_FOUND' } if it was not able to connect.
    sendWorkerMessage: function(msg, fnResponse) {
        NativeHostManager.sendWorkerMessage(msg, fnResponse);
    },

    onSetCompatMode: function(strMode) {
        var nMode = Settings.mapCompatModeString(strMode);

        this.sendWorkerMessage({ type: 'SET_COMPAT_MODE', newMode: nMode });
    },

    onSetSpellCheck: function(value) {
        this.sendWorkerMessage({ type: 'SET_SPELLCHECK', value: value });
    },

    onSetScriptMitigation: function(value) {
        this.sendWorkerMessage({ type: 'SET_SCRIPTURL_MITIGATION', value: value });
    },

    onSetOpenInNewTab: function(value) {
        this.sendWorkerMessage({ type: 'SET_OPENINNEWTAB', value: value });
    },

    onSetNewPointerMode: function (value) {
        this.sendWorkerMessage({ type: 'SET_NEW_POINTER_MODE', value: value });
    },

    getLocalizedText: function(keys, fnResponse) {
        var result = {};

        for (var i = 0; i < keys.length; i++) {
            var str = I18N(keys[i]);
            if (str)
                result[keys[i]] = str;
        }
        fnResponse(result);
    },

    onShowNormalOptions: function() {
        var manifest = chrome.runtime.getManifest();
        var url = manifest["options_page"];
        if(url.indexOf("http") == -1)
            url = chrome.runtime.getURL(url);

        chrome.tabs.create({ url: url });
    },

    isRegexSupported: function(url, fnResponse) {
        var regexFilter = Settings.getRegexFromURLFilter(url);

        chrome.declarativeNetRequest.isRegexSupported(regexFilter, (response) => {
            if (!response.isSupported) {
                console.error('DNR does not support filter: ' + url);
            }
            fnResponse(response);
        });
    },

    hasDNRInvalidUrl: function(fnResponse) {
        // We already did this and notified users, just call the callback
        fnResponse(false);
        return;

        var urls = [];
        var autoUrls = Settings.get('autourl-list');
        if (autoUrls && autoUrls.length) {
            urls = autoUrls;
        }
        var excUrls = Settings.get('exclusion-list');
        if (excUrls && excUrls.length) {
            urls = urls.concat(excUrls);
        }

        if (!urls.length) {
            fnResponse(false);
            return;
        }

        var nResponses = 0;
        var hasBad = false;

        for (var i=0; i<urls.length; i++) {
            this.isRegexSupported(urls[i], (response) => {
                nResponses++;
                if(!hasBad) {
                    hasBad = !response.isSupported;
                }
                // Report it when this is the last response
                if (nResponses == urls.length) {
                    fnResponse(hasBad);
                }
            });
        }
    },

    licensePing: function(daily) {
        console.log('Performing license ping');
        // Daily license ping
        var key = Settings.get('license-key');
    
        if (!key)
            return;
    
        this.hasDNRInvalidUrl(async (hasDNRInvalidUrl) => {
            var baseUrl = chrome.runtime.getURL('');
            var id = baseUrl.match(/chrome-extension:\/\/([^\/]*)\//)[1];
    
            key = encodeURIComponent(key);
            id = encodeURIComponent(id);
            var rand = Math.round(Math.random() * 1000000);
            var cancelled = IETAB.Storage.get('licenseCancelled');
            var helperVersion = Settings.get('helper-version');
            var url = 'https://lping.ietab.net/logger/pingl?key=' + key + '&ext=' + id + '&hv=' + helperVersion + '&rt=0';
            if (!daily) {
                url += '&cancelled=' + cancelled;
            }
            if (hasDNRInvalidUrl) {
                url += '&idnr=1';
            } else {
                url += '&idnr=0';
            }
            url += '&r=' + rand;
    
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    IETAB.Storage.set('licenseCancelled', data.licenseCancelled);
                    Settings.set('license-expiration', data.licenseExpiration);
                } else {
                    IETAB.Storage.set('licenseCancelled', false);
                }
            } catch (ex) {
                IETAB.Storage.set('licenseCancelled', false);
            }
        });
    },
    
    onDailyPing: function() {
        try {
            this.licensePing(true);
        } catch(ex) {
            // Ping is not strictly necessary
        }
    },

    // This is called from the "notsupported" page.  when users are in Metro mode, they will
    // see the "notsupported" page.  And it will be re-loaded when they switch to desktop mode.
    // So that page asks us again whether IE Tab is actually enabled.
    onGetEnabled: function(fnResponse) {
        this.sendWorkerMessage({ type: 'CAN_ATTACH' }, function(msgResponse) {
            fnResponse(msgResponse.type == 'OK');
        });
        return true; // Tell them the response is asynchronous
    },

    onDumpSingleProcess: function(msg) {
        if (!msg.processId) {
            return;
        }
        this.sendWorkerMessage({ type: 'DUMP_PROCESS', processId: msg.processId }, function(result) {
            if(result.type == 'DUMP_CREATED') {
                var result = { type: 'DUMP_CREATED', url: msg.url, dumpFile: result.dumpFile };
                ExtensionApi.broadcastRequest(result);
                this.sendToAllTabs(result);
            }
        });
    },

    sendToAllTabs: function(msg) {
        chrome.tabs.query({}, function(tabs) {
            for (var i=0; i<tabs.length; ++i) {
                chrome.tabs.sendMessage(tabs[i].id, msg);
            }
        });
    },

    onDumpWindows: function() {
        // Send the message back to every tab, it's a case of last-writer wins.
        chrome.tabs.query({}, function(tabs) {
            var message = { type: 'DUMP_WINDOWS' };
            for (var i=0; i<tabs.length; ++i) {
                chrome.tabs.sendMessage(tabs[i].id, message);
            }
        });
    },

    dumpSingleProcess: function(hostName, processId) {
        this.sendWorkerMessage({ type: 'DUMP_PROCESS', processId: processId }, (result) => {
            if(result.type == 'DUMP_CREATED') {
                var result = { type: 'DUMP_CREATED', hostName: hostName, processId: processId, dumpFile: result.dumpFile };
                ExtensionApi.broadcastRequest(result);
                this.sendToAllTabs(result);
            }
        });
    },

    onDumpAllProcesses: function() {
        // Dump every open port
        for (var hostName in NativeHostManager._nativeHostPorts) {
            this.dumpSingleProcess(hostName, NativeHostManager._nativeHostPorts[hostName]._processId);
        }

        // Send a message to every tab to get the URLs they have open for that process ID
        chrome.tabs.query({}, function(tabs) {
            var message = { type: 'GET_URL_PROCESS_INFO' };
            for (var i=0; i<tabs.length; ++i) {
                chrome.tabs.sendMessage(tabs[i].id, message);
            }
        }.bind(this));
    },

    onToggleHosted: function() {
        var bHosted = Settings.get('use-remote-host');
        bHosted = !bHosted;
        if (!bHosted)
            oldStorage.remove('use-remote-host');
        else
            oldStorage.set('use-remote-host', 1);
        oldStorage.remove('version');
        chrome.runtime.reload();
    },

    saveNewLicensee: function(data) {
        Settings.set('licensee', data.email);

        var img = new Image();
        img.src = 'https://www.ietab.net/logger/wslicense?info=' + encodeURIComponent(JSON.stringify(data));
    },

    onGetEmail: function(token, fnResponse) {
        console.log('Retrieving email address');
        var req = new XMLHttpRequest();
        req.open('GET', 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + token);
        req.onreadystatechange = function() {
            if (req.readyState == 4) {
                console.log('UserInfo = ' + req.responseText);
                var data = JSON.parse(req.responseText);
                if (data && data.email) {
                    this.saveNewLicensee(data);
                    fnResponse(true);
                }
            }
        }.bind(this);
        req.send();
    },

    onValidateLicense: function(fnResponse) {
        console.log('LICENSE VALIDATION');
        chrome.identity.getAuthToken({ interactive: true }, function(token) {
            console.log('Auth Token = ' + token);
            var CWS_LICENSE_API_URL = 'https://www.googleapis.com/chromewebstore/v1.1/userlicenses/';
            var req = new XMLHttpRequest();
            req.open('GET', CWS_LICENSE_API_URL + chrome.runtime.id);
            req.setRequestHeader('Authorization', 'Bearer ' + token);
            req.onreadystatechange = function() {
                if (req.readyState == 4) {
                    console.log('License API response = ' + req.responseText);
                    var license = JSON.parse(req.responseText);
                    if(license && license.result && (license.accessLevel == 'FULL')) {
                        this.onGetEmail(token, fnResponse);
                    }
                }
            }.bind(this);
            req.send();
        }.bind(this));
    },

    reloadTabs: function() {
        this.checkAlreadyLoadedTabs();
    },

    getSetting: function(key) {
        return Settings.get(key);
    },

    setSetting: function(key, value) {
        Settings.set(key, value);
    },

    getExportSettings: function(fnResponse) {
        var data = { v: 1 };
        data.extVersion = Settings.get('extension-id');
        data.helperVersion = Settings.get('helper-version');
        data.localSettings = oldStorage['localSettings'] || '{}';
        NativeHostManager.sendWorkerMessage(
            {type: 'GET_REGKEY', hive: 'HKCU', path: 'Software\\Policies\\IE Tab\\IE Tab' },
            (hkcuRegSettings) => {
                data.hkcuRegSettings = hkcuRegSettings.result;
                NativeHostManager.sendWorkerMessage(
                    {type: 'GET_REGKEY', hive: 'HKLM', path: 'Software\\Policies\\IE Tab\\IE Tab' },
                    (hklmRegSettings) => {
                        data.hklmRegSettings = hklmRegSettings.result;
                        fnResponse(data);
                    }
                );
            }
        );
        return true;
    },

    onExtApiRequest: function(sender, request, fnResponse) {
        switch(request.type) {
            case 'GET_SETTING':
                fnResponse(Settings.get(request.key));
                break;
            case 'SET_SETTING':
                Settings.set(request.key, request.value);
                break;
            case 'GET_STORAGE':
                fnResponse(IETAB.Storage.get(request.key));
                break;
            case 'SET_STORAGE':
                IETAB.Storage.set(request.key, request.value);
                break;
            case 'CLEAR_LOCAL_SETTINGS':
                oldStorage.remove('localSettings');
                break;
            case 'RESET_ALL_SETTINGS':
                for (var key in oldStorage)
                    oldStorage.remove(key);
                window.location.reload();
                break;
            case 'GET_ECMTEST':
                fnResponse(IETAB.Storage.get('ECMTestSettings'));
                break;
            case 'SET_ECMTEST':
                Settings.installECMTest(request.value);
                break;
            case 'GET_ENABLED':
                return this.onGetEnabled(fnResponse);
            case 'UPDATE_REGKEY':
                Settings.set('licensee', request.licensee);
                Settings.set('license-key', request.key);
                // This might be an updated, formerly-cancelled license
                try {
                    this.licensePing(false);
                } catch(ex) {
                }
                chrome.runtime.sendMessage({ type: 'REGISTRATION_SUCCESS' });
                fnResponse();
                break;
            case 'DUMP_HELPERS':
                this.onDumpAllProcesses();
                break;
            case 'VALIDATE_LICENSE':
                this.onValidateLicense(fnResponse);
                return true;
                break;
            case 'DUMP_WINDOWS':
                this.onDumpWindows();
                break;
            case 'TOGGLE_HOSTED':
                this.onToggleHosted();
                break;
            case 'UPDATE_REFRESHTOKEN':
                if (request.token)
                    oldStorage.set('refreshToken', request.token);
                else
                    oldStorage.remove('refreshToken');
                break;
            case 'RELOAD_IETABS':
                this.reloadTabs();
                break;
        }
        // Explicity return true if you plan to send an asynchronous response
        return false;
    },

    checkDownloadsByUrl: function(url) {
        if (!chrome.downloads)
            return;

        chrome.downloads.search({ query: [ url ] }, function(items) {
            var foundFiles = [];
            var now = (new Date()).getTime();
            for (var i=0; i<items.length; i++) {
                var age = (new Date(items[i].startTime)) - now;
                if (age < this.STARTUP_DOWNLOAD_MAX_AGE) {
                    chrome.downloads.erase({ id: items[i].id });
                    foundFiles.push(items[i].filename);
                }
            }
            if (foundFiles.length) {
                // Close any "Save As" dialogs
                this.sendWorkerMessage({ type: 'CLOSE_CHROME_DIALOGS2', foundFiles: foundFiles });
            }
        }.bind(this));
    },

    checkDownloadsByTime: function(skipURLs) {
        if (!chrome.downloads)
            return;

        var startAfter = (new Date()).getTime() - this.STARTUP_DOWNLOAD_MAX_AGE;
        startAfter = (new Date(startAfter)).toISOString();

        chrome.downloads.search({ startedAfter: startAfter }, function(items) {
            var foundUrls = [];
            var foundFiles = [];
            for (var i=0; i<items.length; i++) {
                if (skipURLs[items[i].url])
                    continue;
                if (!foundUrls[items[i].url] && this.isAutoURL(items[i].url)) {
                    this.openWithIETab(null, items[i].url);
                    chrome.downloads.erase({ id: items[i].id });
                    foundFiles.push(items[i].filename);
                    foundUrls[items[i].url] = true;
                }
            }
            if (foundFiles.length) {
                // Close any "Save As" dialogs
                // NOTE:  Do not use CLOSE_CHROME_DIALOGS, it existed in older helper versions and was
                // buggy, so we don't ever want it executed
                this.sendWorkerMessage({ type: 'CLOSE_CHROME_DIALOGS2', foundFiles: foundFiles });
            }
        }.bind(this));
    },

    checkAutoURLs: function(tab) {
        var url = tab.url.toString();
        if(url.match(/chrome[^\:]*\:/i))
            return false;

        if(this.isAutoURL(url)) {
            if (this.redirectingTabs[tab.id.toString()]) {
                console.log('Already redirected tab: ' + tab.id);
            } else {
                console.log('checkAutoURLs opening: ' + url);
                this.openWithIETab(tab.id, url);
            }
            return true;
        } else {
            return false;
        }
    },

    checkReload: function(tab) {
        // Some pages require the extension to be initialized before they will work
        // properly.  So we reload those pages after we have initialized.
        var reload = false;
        if (tab.url.indexOf('/notsupported') != -1) {
            reload = true;
        } else if (tab.url.match(/https?:\/\/www\.(dev\.)?ietab\.net\/options/)) {
            reload = true;
        }
        else if (tab.url.indexOf(chrome.runtime.getURL('options.html')) == 0)
        {
            reload = true;
        }

        if (reload) {
            setTimeout(function() {
                chrome.tabs.reload(tab.id, { bypassCache: true });
            }, this.RELOAD_DELAY);
        }
    },

    checkAlreadyLoadedTabs: function() {
        chrome.windows.getAll({ populate: true }, function(windows) {
            var foundAutoURLs = {};
            for (var iWindow=0; iWindow<windows.length; iWindow++) {
                var window = windows[iWindow];
                for (var iTab = 0; iTab < window.tabs.length; iTab++) {
                    // Check whether to load it as an auto url
                    if (this.checkAutoURLs(window.tabs[iTab])) {
                        foundAutoURLs[window.tabs[iTab].url] = true;

                        // It was an auto-url.  See if it was downloaded before we loaded so we can
                        // delete the download which will re-close the download shelf
                        this.checkDownloadsByUrl(window.tabs[iTab].url);
                    } else {
                        // If it's not an auto URL, check if we should reload it
                        this.checkReload(window.tabs[iTab]);
                    }
                }
            }
            // In recent versions of Chrome, if you open a download when Chrome isn't yet open,
            // then Chrome will close the tab with the download URL.  So we won't find them as a direct
            // URL in that case.  So we do another query for recent downloads, but we skip any of the
            // downloads that we did find that had an address in the tab and were already opened as an
            // auto URL, lest we double-open them.  This arises especially when they have the option checked
            // to always ask for a file name.
            this.checkDownloadsByTime(foundAutoURLs);
        }.bind(this));
    },

    getVersion: function() {
        return chrome.runtime.getManifest().version;
    },

    setAutoUrlDetails: function(details) {
        Background.autoUrlDetails[details.url] = details;
    },

    getRedirectAutoURL: function(details) {
        var id = Math.random().toString().substr(2,9);
        this.pendingAutoUrls[id] = details;


        setTimeout(function() {
            delete this.pendingAutoUrls[id];
        }.bind(this), this.PENDING_AUTOURL_TIMEOUT);

        return chrome.runtime.getURL('redir.htm') + '#urlid=' + id;
    },

    setAutoURLDetails: function(details) {
        this.autoUrlDetails[details.url] = details;
    },

    removeAutoURLDetails: function(url) {
        delete this.autoUrlDetails[url];
    },

    onBeforeRequest: function(details, async) {
        // Let everything initialize so we have our settings to check for auto URLs
        if (!this.fullyInitialized) {
            this.waitForInit(() => {
                this.onBeforeRequest(details, true);
            });
            return;
        }

        if (!Settings.get('enable-auto-urls'))
            return;

        // DNR handles get requests, we only need to intercept POST requests
        // Unless we are exclusiviely using webRequest
        // if (!IETAB.Storage.get('only-web-request') && (details.method.toLowerCase() != 'post'))
            // return;

        if (details.frameType != 'outermost_frame')
            return;

        // We don't just use isAutoURL because we may need the filter later.
        var filter = Settings.getAutoURLFilter(details.url);
        if (!filter)
            return;
        if (Settings.filterHasOption('not-auto'))
            return;

        // Ideally, we could redirect directly to the IE Tab URL.  But you can't use redirectUrl to redirect to a
        // non-web-accessible resource.  Reference: https://code.google.com/p/chromium/issues/detail?id=313155
        // So we redirect to the web_accessible redir.htm page with an anonymous identifier.
        // It picks up that anonymous identifier and if it matches a pending auto URL, then IT redirects
        // to nhc.htm.
        //
        // We previously used to redirect to about:blank and then re-load with openWithIETab.  But I think
        // that can be racy and sometimes about:blank will end up winning, plus you end up with multiple
        // attempts to open the page in IE Tab.  Same issue with using cancel: true.
        //
        // So this additional redirect through redir.htm turns out to be the smoothest solution.
        //

        var knownBadFilters = IETAB.Storage.get('knownBadFilters') || {};

        // Note: check async because the 'return' will be ignored if we are not calling this synchronously
        if (!async && Background.usingBlockingWebRequest) {
            console.log('WR blocking redirect: ' + details.url);
            var redirectUrl = this.getRedirectAutoURL(details);
            return { redirectUrl: redirectUrl };
        } else {
            // We handle:
            //   1. Redirects for filters not supported by DNR
            //   2. All POST requests
            //   3. All GET & POST requests if 'only-web-request'
            if (knownBadFilters[filter] || IETAB.Storage.get('only-web-request') || (details.method.toLowerCase() == 'post')) {
                // The timeout is a little trick to keep us from redirecting this tab twice when checkAutoURLs is called after startup
                this.redirectingTabs[details.tabId.toString()] = true;
                setTimeout(() => {
                    // We are just trying to avoid reloading on start-up
                    delete this.redirectingTabs[details.tabId.toString()];
                }, 10000);
                console.log('WR async redirect: ' + details.url);
                this.setAutoURLDetails(details);
                this.openWithIETab(details.tabId, details.url);
            }

            /* Keeping this for posterity, but I don't think we need it.  knownBadFilters is better
               because there are some URLs that it can catch that isRegexSupported doesn't even catch
            else {
                // This is not a POST request.
                // DNR should have handled it.
                // However, DNR does not support all auto URL filters, so we check for an unsupported 
                // filter and if that's what matches then we do the redirect ourselves
                var regexFilter = Settings.getRegexFromURLFilter(filter);
                console.log('Filter: ' + regexFilter.regex);
                chrome.declarativeNetRequest.isRegexSupported(regexFilter, (result) => {
                    if (!result.isSupported) {
                        console.log('Url not supported, backstop it with WR')
                        this.setAutoURLDetails(details);
                        this.openWithIETab(details.tabId, details.url);
                    }
                });
            }
            */
        }
    },

    handleNativeMessage: function(port, msg) {
        if (!msg || !msg.type)
            return false;

        var handled = true;
        switch(msg.type) {
            case 'NEW_COOKIE_FROM_IE':
                Cookies.onNewCookieFromIE(port, msg.url, msg.cookieData, msg.fromSetCookie);
                break;
            default:
                handled = false;
        }
        return handled;
    },

    //
    // onDownloadCreated
    //
    // Technically, the need for this is to catch file:// URLs in the enterprise release.
    //
    // In general, the purpose of the download listener is to catch Auto URLs that we did not catch with
    // the webRequest or tab listeners.  This is not normally hit in the webstore release because it doesn't have the
    // download permission.  But the enterprise release has the download permission.
    //
    // The problem is force-installed extensions can't possibly have the file:// permission.  So we use this backup
    // approach to intercept file:// URLs that would otherwise end up as downloads (they aren't caught by
    // webrequest or the tab-change listener, so this is our last alternative).
    //   Reference: https://code.google.com/p/chromium/issues/detail?id=173640
    //
    onDownloadCreated: function(downloadItem) {
        // We check for 'in_progress' and double-check the startTime to workaround this bug:
        //   https://code.google.com/p/chromium/issues/detail?id=432757
        //
        if (downloadItem.state != 'in_progress')
            return;
        var now = (new Date()).getTime();
        var downloadStart = (new Date(downloadItem.startTime)).getTime();
        if (now - downloadStart > this.DOWNLOAD_START_TOLERANCE)
            return;

        if (!Settings.get('enable-auto-urls'))
            return;

        if (this.isAutoURL(downloadItem.url)) {
            chrome.downloads.cancel(downloadItem.id);

            // Use the currently active tab
            chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
                if (tabs && tabs.length) {
                    this.openWithIETab(tabs[0].id, downloadItem.url);
                }
            }.bind(this));
        }
    },

    initContextMenu: function() {
        if (Settings.get('show-context-menu')) {
            ContextMenu.create(this);
        }
    },

    onContextMenuChanged: function() {
        if (Settings.get('show-context-menu')) {
            ContextMenu.create(this);
        } else {
            ContextMenu.remove();
        }
    },

    initRemoteHostSupport: function () {
    },

    escapeRegExp: function(string) {
        return string.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'); // $& means the whole matched string
    },

    addSessionRules: function(autoUrls, exceptUrls) {
        if (!Settings.get('enable-auto-urls'))
            return;

        // Don't do anything if we are exclusively using webrequest
        if (IETAB.Storage.get('only-web-request'))
            return;

        // Reset the known bad filters
        var knownBadFilters = {};
        IETAB.Storage.set('knownBadFilters', knownBadFilters);

        var idx = RULE_RANGE_AUTOURLS[0];
        // Add the auto URLs
        if (autoUrls) {
            autoUrls.forEach((filter) => {
                // It might have the 'not-auto' filter option in which case it isn't
                // _actually_ an auto url, it just has settings
                if (Settings.filterHasOption(filter, 'not-auto'))
                    return;

                var regexOptions = Settings.getRegexFromURLFilter(filter);
                var regexSub = chrome.runtime.getURL('redir.htm');
                regexSub += '#url=\\0';

                var newRule = {
                    id: idx++,
                    priority: 1,
                    action: {
                        type: 'redirect',
                        'redirect': {
                            'regexSubstitution': regexSub
                        }
                    },
                    'condition': {
                        regexFilter: regexOptions.regex,
                        requestMethods: [ 'get' ],
                        resourceTypes: [ 'main_frame' ],
                        isUrlFilterCaseSensitive: regexOptions.isCaseSensitive
                    }
                }
                chrome.declarativeNetRequest.updateSessionRules({
                    addRules: [ newRule ]
                }).catch((error) => {
                    knownBadFilters[filter] = true;
                    IETAB.Storage.set('knownBadFilters', knownBadFilters);
                    console.error('Found bad filter: ' + filter, error);
                })
            });
        }
        // Add the fixed exceptions
        if (!exceptUrls) {
            exceptUrls = [];
        }
        exceptUrls = exceptUrls.concat(this.FIXED_AUTOURL_EXCEPTIONS);
        // And add the actual rules
        if (exceptUrls) {
            exceptUrls.forEach((filter) => {
                var regexOptions = Settings.getRegexFromURLFilter(filter);

                var newRule = {
                    id: idx++,
                    priority: 2,  // IMPORTANT:  Make these a higher priority, we definitely don't want to 
                    action: {
                        type: 'allow',
                    },
                    'condition': {
                        regexFilter: regexOptions.regex,
                        requestMethods: [ 'get' ],
                        resourceTypes: [ 'main_frame' ],
                        isUrlFilterCaseSensitive: regexOptions.isCaseSensitive
                    }
                }
                chrome.declarativeNetRequest.updateSessionRules({
                    addRules: [ newRule ]
                });
            });
        }

    },
    
    updateSessionRules: function() {
        var autoUrls = Settings.get('autourl-list');
        var exceptUrls = Settings.get('exclusion-list');
        var enableAutoUrls = Settings.get('enable-auto-urls');
        var newRules = [];
        
        // Quick in-memory cache test to avoid calling this when nothing really changed
        var testUrls = JSON.stringify(autoUrls) + JSON.stringify(exceptUrls) + JSON.stringify(enableAutoUrls);
        if (this.cachedUrls && (testUrls == this.cachedUrls))
            return;
        this.cachedUrls = testUrls;

        // First, remove the existing ones
        chrome.declarativeNetRequest.getSessionRules(previousRules => {
            const previousRuleIds = previousRules.map(rule => rule.id);
            const removeRuleIds = previousRuleIds.filter(id => id >= RULE_RANGE_AUTOURLS[0] && id <= RULE_RANGE_AUTOURLS[1]);
            chrome.declarativeNetRequest.updateSessionRules({
                removeRuleIds: removeRuleIds,
            }, () => {
                // Now that we've removed them all, re-add the existing ones
                this.addSessionRules(autoUrls, exceptUrls);
            });
        });
     },

    hasAutoUrls: function() {
        var autoUrls = Settings.get('autourl-list');
        return autoUrls && autoUrls.length;
    },

    onAutoUrlsChanged: function() {
        this.updateSessionRules();

        if (this.hasAutoUrls()) {
            addUrlListeners();
        } else {
            removeUrlListeners();
        }

        if (this.useDownloadListener) {
            // Make sure the download listener is active
            if (chrome.downloads && !this.fnOnDownloadCreated) {
                this.fnOnDownloadCreated = this.onDownloadCreated.bind(this);
                chrome.downloads.onCreated.addListener(this.fnOnDownloadCreated);

            }
        }
    },

    updateHelperVersion: function() {
        this.sendWorkerMessage({ type: 'PING' }, function(msgResponse) {
            if (msgResponse.type == 'PONG') {
                // Test for the correct version and upgrade if necessary
                oldStorage.set('helper-version', msgResponse.helperVersion);
            }
        }.bind(this));
    },

    
    initNativeHost: function(fnContinue) {
        if (Settings.get('use-remote-host')) {
            setTimeout(function() {
                fnContinue();
            }, 0);
            return;
        }
        this.continueInitNativeHost(fnContinue);
    },

    continueInitNativeHost: function(fnContinue) {
        this.minVersionFail = false;

        if (!Background.isSessionStart) {
            // We only do the version and upgrade checking on first session init
            // According to this change, this will happen on upgrade, reload, enable/disable, startup:
            // https://issues.chromium.org/issues/40171997#comment50
            //    
            fnContinue();
            return;
        }
        if (this.chromeVersion.major < 27) {
            // Native messaging is not supported
            fnContinue();
            return;
        }

        // Try to connect
        this.sendWorkerMessage({ type: 'PING' }, function(msgResponse) {
            if (msgResponse.type == 'PONG') {
                // Test for the correct version and upgrade if necessary
                oldStorage.set('helper-version',  msgResponse.helperVersion);
                NativeHostManager.checkVersion(function(result) {
                    if (result == 'E_VERSION_MIN_FAILED') {
                        this.minVersionFail = true;
                    }
                    this.updateHelperVersion();

                    // Initialize registry settings
                    this.sendWorkerMessage({ type: 'INITREGISTRY' });

                    fnContinue();
                }.bind(this));
            } else {
                fnContinue();
            }
        }.bind(this));
    },

    init: function ()
    {
        var previousVersion = IETAB.Storage.get("version");
        this.isFirstRun = !previousVersion;

         var ua = navigator.userAgent.toLowerCase();

        this.isSafari = (ua.indexOf('safari') != -1) && (ua.indexOf('chrome') == -1);

         var regexChrome = /Chrome\/(\d+)\./;
         var match = self.navigator.appVersion.match(regexChrome);
         if (match) {
             this.chromeVersion = { major: parseInt(match[1], 10) };
         } else {
             this.chromeVersion = { major: 90 };
         }

        var manifest = chrome.runtime.getManifest();
        var newVersion = manifest.version;
        if (previousVersion != newVersion) {
            IETAB.Storage.set("version", newVersion);

            if (!this.isFirstRun) {
                // Just hang onto the fact that this is an upgrade, we will make use of it later
                // after other dependent initialization.
                this.isUpgrade = true;
            }
        }
        this.initNativeHost(this.init2.bind(this));
    },

    testForNativeHost: function(fnResponse) {
        NativeHostManager.getNativeHostPort('host_test', (port) => {
            fnResponse(!!port);
        });
    },

    updatePermissions: function(fnResponse) {
        this.permissions = { http: true };

        if (this.isSafari) {
            this.permissions.downloads = false;
            this.permissions.other = false;
            this.permissions.file = false;
            if (fnResponse) {
                fnResponse(this.permissions);
            }
            return;
        }

        // Downloads first
        chrome.permissions.contains({
            permissions: [ 'downloads' ]
        }, function(granted) {
            if (granted) {
                this.permissions.downloads = true;
            }
            // Now check for all URLs (except file).
            chrome.permissions.contains({
                origins: [ '<all_urls>' ]
            }, function(granted) {
                if (granted) {
                    this.permissions.other = true;
                }
                // file:// URLs are checked separately
                chrome.permissions.contains({
                    origins: [ 'file://*' ]
                }, function(granted) {
                    if (granted) {
                        this.permissions.file = true;
                    }
                    if (fnResponse) {
                        fnResponse(this.permissions);
                    }
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },

    onUrlProcessInfoReceived: function(processInfo) {
        // Broadcast the message to the options page
        var msg = { type: 'URL_PROCESS_INFO', url: processInfo.url, processId: processInfo.processId };
        ExtensionApi.broadcastRequest(msg);
        // And to the new extension-hosted options page
        this.sendToAllTabs(msg);
    },

    onProxyResponse: function(msg) {
        RemoteHostManager.sendProxyData(msg.requestId, 'HTTP/1.1', msg.status, msg.statusText, msg.headers, msg.b64Data );
    },

    updateOptionsRedirect: function() {
        var regex = '^https?:\/\/[^\/]*\.ietab\.net\/options';
        var newRules = [];

        var regexSub = chrome.runtime.getURL('options.html');
        ruleId = RULE_RANGE_OPTIONSPAGE[0];

        newRules.push({
            id: ruleId,
            priority: 3,
            action: {
                type: 'redirect',
                'redirect': {
                    'regexSubstitution': regexSub
                }
            },
            'condition': {
                regexFilter: regex,
                requestMethods: [ 'get' ],
                resourceTypes: [ 'main_frame' ],
                isUrlFilterCaseSensitive: false
            }
        })
        chrome.declarativeNetRequest.updateSessionRules({
            addRules: newRules,
            removeRuleIds: [ ruleId ]
        });
    },
    
    
    initSessionStart: function() {
        var key = Settings.get('license-key');

        if (typeof(chrome.runtime.setUninstallURL) != 'undefined') {
            if (!key)
                chrome.runtime.setUninstallURL('http://www.ietab.net/ie-tab-alternatives');
            else
                chrome.runtime.setUninstallURL('');
        }

        // Wait for enterprise settings to be loaded before doing this
        Settings.whenLoaded(function() {
            // TODO:  This 1.5 second hack is our safe workaround, do better in the future.
            //  It turns out we had a call to chrome.storage.managed.get that was causing
            // a 450ms - 1000ms delay and allowing us to find URLs that were still loading so we would check for them on startup.
            // But when MSFT broke that and we just initialized without calling that functionality, then shortcut urls were not getting
            // detected.  Quickest way to emulate the old behavior is adding a minor delay.
            self.setTimeout(() => {
                this.checkAlreadyLoadedTabs();
            }, 1500);

            this.initContextMenu();

            if (this.isFirstRun) {
                this.onFirstRun();
            } else if (this.isUpgrade) {
                this.onUpgrade();
            }
           if (IETAB.Storage.get('licenseCancelled')) {
               // Check whether their license has been restored
               // We no longer check every time they load, we now have a re-check option in 
               // the options page
               // this.licensePing();
           }
        }.bind(this));

        var firstSeen = IETAB.Storage.get("firstSeen");
        if (!firstSeen) {
            firstSeen = (new Date()).getTime();
            IETAB.Storage.set("firstSeen", firstSeen);
        }


        this.onAutoUrlsChanged();
        this.updatePermissions();
        this.updateOptionsRedirect();
    },

    init2: function() {
        if (Background.isSessionStart) {
            this.initSessionStart();
        }

        this.initRemoteHostSupport();
        
        Background.fullyInitialized = true;

        while (this.waitForInitQueue.length > 0) {
            // If a waiter goes away or something, we don't want to fail to finish initialization
            const fnResponse = this.waitForInitQueue.shift();
            try {
                fnResponse(true);
            } catch(ex) {
                console.error(ex);
            }
        }
        this.initContextMenu();
        console.log('BG Ready: ' + (new Date()));
    },

    waitForInit: function(fnResponse) {
        if (this.fullyInitialized) {
            fnResponse(false);
            return;
        }
        this.waitForInitQueue.push(fnResponse);
    }
}

if (typeof importScripts === 'function') {
    importScripts('b64.js');
    importScripts('rule_ranges.js');
    importScripts('utils.js');
    importScripts('storage.js');
    importScripts('background_proxy.js');
    importScripts('gatracking.js');
    importScripts('settings.js');
    importScripts('extapi_bp.js');
    importScripts('nathost_port.js');
    importScripts('nathost_manager.js');
    importScripts('ietabapi_bp.js');
    importScripts('cookies.js');
    importScripts('oldbookmarks.js');
    importScripts('contextmenu.js');

    var arrScripts = [
        '/myrtille/config.js',
        '/myrtille/dialog.js',
        '/myrtille/display/divs.js',
        '/myrtille/network.js',
        '/myrtille/network/buffer.js',
        '/myrtille/network/longpolling.js',
        '/myrtille/network/websocket.js',
        '/myrtille/network/xmlhttp.js',
        '/myrtille/audio/audiowebsocket.js',
        '/js/remhost_manager.js',
        '/js/datacenter.js'
    ];

    Utils.importArrScripts(arrScripts);

}

// This is a workaround for native messaging not working on startup
// See this thread in the chromium-extensions group
// https://groups.google.com/a/chromium.org/g/chromium-extensions/c/XY6u0raKRJQ/m/xHOjNiE5BwAJ
chrome.runtime.onStartup.addListener(() => {});

// This is the global initialization logic
chrome.storage.session.get('sessionStarted', (result) => {
    if (!result.sessionStarted) {
        console.log('Session started: ' + new Date());
        // Store an indicator that this is the first session
        // for this service worker, the equivalent of background page load in MV2
        Background.isSessionStart = true;
        chrome.storage.session.set({ "sessionStarted": Date.now() });
    }

    Settings.init(() => {
        // Init but also read chrome policy (which is done by _updateSettings)
        Background.init();
    });
});

// When an auth request comes in, hide the IE Tab Helper
chrome.webRequest.onAuthRequired.addListener(function(details) {
    if (details.tabId && (details.tabId != -1)) {
        chrome.tabs.sendMessage(details.tabId, { type: 'AUTH_REQUESTED' });
    }
}, {urls: ["<all_urls>"]});

if (chrome.action) {
    chrome.action.onClicked.addListener(function(tab) {
        var targetUrl = tab.url;
        if(targetUrl.match(/^chrome|^edge/))
        {
            // Not a supported URL, open a new tab with the help page
            if (Settings.get('use-remote-host')) {
                targetUrl = 'http://www.ietab.net/hostedstartpage?from=chromeurl';
            } else if (this.isInEdge()) {
                targetUrl = chrome.runtime.getURL('edgestartpage.html') + '?';
                chrome.tabs.update(tab.id, { url: targetUrl });
                return;
            } else {
                targetUrl = "http://www.ietab.net/ie-tab-documentation?from=chromeurl";
            }
            // Determine if we have a license key so we can decide whether to show an ad or not
            var key = Settings.get('license-key');
            if (key)
                targetUrl += '&key=1';

        }
        Background.openWithIETab(tab.id, targetUrl);
    }.bind(Background));
}

// We still need this in addition to the webRequest listener so we can redirect file:// URLs
function onTabsUpdated(tabId, changeInfo, tab) {
    Background.waitForInit((async) => {
        if((changeInfo.status == "loading") && Settings.get("enable-auto-urls")) {
            // We definitely need this for file:// URLs and backstopping others as well,
            // but the Background will check all urls before finishing initialization
            // so we don't need to duplicate that effort if it isn't fully initialized yet
            if ((tab.url.indexOf('file:') == 0)) {
                Background.checkAutoURLs(tab);
            }
        }
    });
}

function onBeforeRequestBlocking(info) {
    if (!Background.usingBlockingWebRequest) {
        // Remove the non-blocking listener on the first call to the blocking listener
        chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
        console.log('Using blocking webRequest');
    }
    Background.usingBlockingWebRequest = true;
    var returnValue = Background.onBeforeRequest(info);
    return returnValue;
}

function onBeforeRequest(info) {
    // Just in case the first request gets queued for both listeners
    if (Background.usingBlockingWebRequest)
        return;

    if (!Background.removedBlockingWebRequest) {
        chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestBlocking);
        Background.removedBlockingWebRequest = true;
        console.log('Using non-blocking WebRequest');
    }
    return Background.onBeforeRequest(info);
}

function addUrlListeners() {
    if (Background.urlListenersAdded)
        return;
    Background.urlListenersAdded = true;

    chrome.tabs.onUpdated.addListener(onTabsUpdated)

    chrome.webRequest.onBeforeRequest.addListener(
        onBeforeRequestBlocking,
        { urls: ['<all_urls>'], types: [ 'main_frame' ]  },
        [ 'blocking', 'requestBody']
    );

    chrome.webRequest.onBeforeRequest.addListener(
        onBeforeRequest,
        { urls: ['<all_urls>'], types: [ 'main_frame' ] },
        [ 'requestBody' ]
    );
}

function removeUrlListeners() {
    chrome.tabs.onUpdated.removeListener(onTabsUpdated);
    chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestBlocking);
    chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
    Background.urlListenersAdded = false;
}

// We need to add them on the first run but we can remove them of there are no auto urls
addUrlListeners();


ExtensionApi.onRequest = Background.onExtApiRequest.bind(Background);

// Listen for direct message requests
chrome.runtime.onMessage.addListener(function(msg, sender, fnResponse) {
    if (msg && msg.type == 'REQUEST_PERMISSIONS') {
        chrome.permissions.request({
            permissions: [ 'downloads' ],
            origins: [ '<all_urls>' ]
        }, function(granted) {
            this.updatePermissions(fnResponse);
        }.bind(this));
        return true;
    } else if(msg.type == 'IETABAPI_REQUEST') {
        return IETabApi.onIETabApiRequest(msg.request, sender, fnResponse);
    } else if(msg.type == 'DUMP_SINGLE_PROCESS') {
        this.onDumpSingleProcess(msg);
    } else if (msg.type == 'URL_PROCESS_INFO') {
        this.onUrlProcessInfoReceived(msg);
    } else if (msg.type == 'PROXY_RESPONSE') {
        Background.onProxyResponse(msg);
    } else if (msg.type == 'SW_WAIT_FOR_INIT') {
        Background.waitForInit(fnResponse);
        return true;
    } else if (msg.type == 'TEST_FOR_NATIVEHOST') {
        Background.testForNativeHost(fnResponse);
        return true;
    } else if (msg.type == 'GET_EXPORTSETTINGS') {
        Background.getExportSettings(fnResponse);
        return true;
    }

}.bind(this));

