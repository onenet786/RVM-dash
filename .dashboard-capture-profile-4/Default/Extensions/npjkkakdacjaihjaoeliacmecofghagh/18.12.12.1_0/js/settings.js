/*
 *
 * settings.js
 *
 * Place to get general user settings.
 * This includes all configurable user settings that may have been set
 * with the Enterprise Configuration Manager.
 * 
*/


var Settings = {
    _started: Date.now(),
    settingsLoaded: false,

    DEFAULT_SETTINGS: {
        'compat-mode': 'IE7S',
        'disable-intro-page': false,
        'enable-auto-urls': true,
        'enable-chrome-popups': true,
        'show-search-box': false,
        'enable-use-full-window-popups': true,
        'enable-dep': true,
        'enable-atl-dep': true,
        'only-auto-urls' : false,
        'hide-addr-bar' : false,
        'show-status-text' : false,
        'open-popups-in-tab': false,
        'allow-api-prompt': true,
        'enable-direct-invoke': false,
        'scripturl-mitigation': true,
        'cookie-sync': false,
        'single-session': false,
        'local-network': false,
        'favicon': false,
        'beforeunload': false,
        'ietab-header': false,
        'threaded-popups': false,
        'ie-dialogs': true,
        'show-context-menu': true
    },

    DEFAULT_HOSTED_SETTINGS: {
        'enable-use-full-window-popups': false,
        'compat-mode': 'IE11F'
    },

    /* These settings cannot be changed even by Group Policy */
    LOCKED_HOSTED_SETTINGS: {
        'enable-chrome-popups': true,
        'ie-dialogs': false,
        'open-in-new-tab': true,
        'scripturl-mitigation': true
    },

    MERGED_SETTINGS: {
        'autourl-list': 1,
        'exclusion-list': 1,
        'api-whitelist': 1,
        'api-blacklist': 1
    },

    _initLocal: function() {
        // Mappings for old settings
        var settingsMap = {
            'compatMode': 'compat-mode',
            'enableAutoUrls': 'enable-auto-urls',
            'enableChromePopups': 'enable-chrome-popups',
            'showSearchBox': 'show-search-box',
            'disableAutoSearch': 'disable-auto-search',
            'filterUrls': 'autourl-list',
            'exclusionUrls': 'exclusion-list'
        }

        // If it already exists, then we're done
        var localSettings = IETAB.Storage.get('localSettings');
        if (localSettings && (typeof(localSettings) == 'object'))
            return localSettings;

        // Initialize it as empty and copy any old settings
        localSettings = {};
        for (var from in settingsMap) {
            var value = IETAB.Storage.get(from);
            if (value || (typeof(value) != 'object'))
                localSettings[settingsMap[from]] = value;

            // Delete the deprecated value
            // (We used to do this, but now keep it around in case there's a bug.  We can delete these much later
            //  after a successful upgrade)
            // IETAB.Storage.set(from, null);
        }
        IETAB.Storage.set('localSettings', localSettings);
        return localSettings;
    },

    _log: function(text) {
        // Debug.log('Settings.' + text);
    },

    _updateCompatMode: function() {
        // If the compat mode changes, we need to update the registry
        var newMode = this.get('compat-mode');
        Background.onSetCompatMode(newMode);
    },

    _updateSpellCheck: function() {
        var value = this.get('spellcheck');
        Background.onSetSpellCheck(value);
    },

    _updateScriptMitigation: function() {
        var value = this.get('scripturl-mitigation');
        Background.onSetScriptMitigation(value);
    },

    _updateOpenInNewTab: function() {
        var value = this.get('open-in-new-tab');
        Background.onSetOpenInNewTab(value);
    },

    _updateNewPointerMode: function () {
        var value = this.get('new-pointer-mode');
        Background.onSetNewPointerMode(value);
    },

    _onNewECMSettings: function() {
        this._updateCompatMode();
        this._updateSpellCheck();
        this._updateScriptMitigation();
        this._updateOpenInNewTab();
        this._updateNewPointerMode();
    },

    isCompatModeString: function(strMode) {
        var arrModes = ['IE7S', 'IE8S', 'IE8F', 'IE9S', 'IE9F', 'IE10S', 'IE10F', 'IE11S', 'IE11F' ];
        strMode = strMode.toUpperCase();

        return (arrModes.indexOf(strMode) != -1);
    },

    mapCompatModeString: function(strMode) {
        var nMode = 7000;
        if (!strMode)
            return nMode;

        strMode = strMode.toUpperCase();
        switch (strMode) {
            case "IE7S": nMode = 7000; break;
            case "IE8S": nMode = 8000; break;
            case "IE8F": nMode = 8888; break;
            case "IE9S": nMode = 9000; break;
            case "IE9F": nMode = 9999; break;
            case "IE10S": nMode = 10000; break;
            case "IE10F": nMode = 10001; break;
            case "IE11S": nMode = 11000; break;
            case "IE11F": nMode = 11001; break;
        }
        return nMode;
    },

    stripFilterOptions: function(filter) {

    },

    getAdvancedFilterOptions: function(filter) {
        var regex = /^\[([^\]]*)\]/;
        var match = filter.match(regex);
        if (!match)
            return null;
        return match[1].split(',');
    },

    getPerUrlMode: function(url) {
        var filter = this.getAutoURLFilter(url);
        if (!filter)
            return 0;

        var options = this.getAdvancedFilterOptions(filter);
        if (!options)
            return 0;

        for (var i=0; i<options.length; i++) {
            if (this.isCompatModeString(options[i]))
                return this.mapCompatModeString(options[i]);
        }
        return 0;
    },

    listMatch: function(url, listName)
    {
        var filterUrls = Settings.get(listName);
        if (filterUrls) {
            for (var i = 0; i < filterUrls.length; i++) {
                var regex = null;
                var filter = filterUrls[i];
                var regexOptions = this.getRegexFromURLFilter(filter);
                var modifier = regexOptions.isCaseSensitive ? '' : 'i';

                // This is user-supplied data, so put the regex constructor in a try / catch
                var regex = null;
                try {
                    regex = new RegExp(regexOptions.regex, modifier);
                }
                catch (ex) {
                }

                if (regex) {
                    // Check for a match AND that the match contains the entire URL.
                    var match = url.match(regex)
                    if (match && (match[0] == url))
                        return filterUrls[i];
                }
            }
        }
        return false;
    },

    getRegexFromURLFilter: function(filter) {
        var regex = null;

        // Remove any special attribute modifiers
        filter = filter.replace(/^\[[^\]]*\]/, '');
        var isCaseSensitive = false;
        var modifier = 'i';
        if (filter.indexOf("r/") == 0) {
            filter = filter.slice(2);
        } else if(filter.indexOf('rcs/') == 0) {
            filter = filter.slice(4);
            isCaseSensitive = true;
            modifier = '';
        } else {
            //        We could escape a bunch more, but historically we haven't, and it would be a breaking
            //        change now, so we keep it like this
            //        Also, whatever we do here, we should match in the ietabhelper's listmatch functionality
            filter = filter.replace(/\//g, "\\/").replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/, "\\?");
        }

        // We require the entire URL to match
        if (filter.indexOf('^') != 0)
            filter = '^' + filter;
        if (filter[filter.length-1] != '$')
            filter = filter + '$';

        // This is user-supplied data, so put the regex constructor in a try / catch
        // as validation
        var regex = null;
        try {
            regex = new RegExp(filter, modifier);
        }
        catch (ex) {
            console.log('Invalid auto URL: ' + filter);
            filter = null;
        }
        return {
            regex: filter,
            isCaseSensitive: isCaseSensitive
        }
    },

    getAutoURLFilter: function(url) {
        if (url.match(/chrome[^\:]*\:/i))
            return null;
        // Never load the options page in IE Tab, otherwise you can get stuck not being able to
        // change the Auto URLs.  For example, if you had entered an Auto URL of '*'
        if (url.match(/^https?:\/\/www\.(dev\.)?ietab\.net\/options/))
            return null;

        if (this.listMatch(url, 'exclusion-list'))
            return null;

        return this.listMatch(url, "autourl-list");
    },

    filterHasOption: function(filter, option) {
        var options = this.getAdvancedFilterOptions(filter);
        if (!options)
            return false;
        option = option.toUpperCase();
        for (var i=0; i<options.length; i++) {
            if (options[i].toUpperCase() == option) {
                return true;
            }
        }
        return false;
    },

    URLhasFilterOption: function(url, option) {
        // Special-case filter options
        if (option == 'local') {
            if (url.match(/^(https?:\/\/)?(localhost|127.0.0.1).*/))
                return true;
        }

        // Look for filter options to compare
        var filter = this.getAutoURLFilter(url);
        if (!filter)
            return false;

        return this.filterHasOption(filter, option);
    },

    getCompatModeInt: function () {
        var mode = this.get('compat-mode');
        return this.mapCompatModeString(mode);
    },

    mapRegKeyToECM: function(key, value) {
        var TYPE = {
            BOOL:        1,
            BOOL_INVERT: 2,
            INT :        3,
            STRING:      4,
            LIST:        5
        }
        var GPOToECM = {
            'ShowIntroPage':           [ TYPE.BOOL_INVERT, 'disable-intro-page'],
            'HideAddressBar':          [ TYPE.BOOL, 'hide-addr-bar' ],
            'EnableAutoURLs':          [ TYPE.BOOL, 'enable-auto-urls' ],
            'SettingsRefreshInterval': [ TYPE.INT,  'settings-refresh-interval'],
            'UseFullWindowPopups':     [ TYPE.BOOL, 'enable-use-full-window-popups' ],
            'OpenPopupsWithChrome':    [ TYPE.BOOL, 'enable-chrome-popups' ],
            'OpenPopupsInTab':         [ TYPE.BOOL, 'open-popups-in-tab' ],
            'EnableDEPPolicy':         [ TYPE.BOOL, 'enable-dep' ],
            'EnableATLDEPWorkaround':  [ TYPE.BOOL, 'enable-atl-dep' ],
            'OnlyOpenAutoURLs':        [ TYPE.BOOL, 'only-auto-urls' ],
            'ShowStatusText':          [ TYPE.BOOL, 'show-status-text' ],
            'IECompatibilityMode':     [ TYPE.STRING, 'compat-mode' ],
            'LicenseeName':            [ TYPE.STRING, 'licensee' ],
            'LicenseKey':              [ TYPE.STRING, 'license-key' ],
            'AllowApiPrompt':          [ TYPE.BOOL, 'allow-api-prompt' ],
            'EnableDirectInvoke':      [ TYPE.BOOL, 'enable-direct-invoke' ],
            'OptimizeDirectInvoke':    [ TYPE.BOOL, 'optimize-direct-invoke' ],
            'InterceptRedirects':      [ TYPE.BOOL, 'intercept-redirects' ],
            'ScriptUrlMitigation':     [ TYPE.BOOL, 'scripturl-mitigation' ],
            'CookieSync':              [ TYPE.BOOL, 'cookie-sync' ],
            'Favicon':                 [ TYPE.BOOL, 'favicon' ],
            'BeforeUnload':            [ TYPE.BOOL, 'beforeunload' ],
            'SpellCheck':              [ TYPE.BOOL, 'spellcheck' ],
            'NeverOpenExceptions':     [ TYPE.BOOL, 'never-open-exceptions' ],
            'IETabHeader':             [ TYPE.BOOL, 'ietab-header' ],
            'ThreadedPopups':          [ TYPE.BOOL, 'threaded-popups' ],
            'OpenInNewTab':            [ TYPE.BOOL, 'open-in-new-tab' ],
            'NewPointerMode':          [ TYPE.BOOL, 'new-pointer-mode' ],
            'SessionShare':            [ TYPE.BOOL, 'single-session' ],
            'LocalNetwork':            [ TYPE.BOOL, 'local-network' ],
            'IEDialogs':               [ TYPE.BOOL, 'ie-dialogs' ],
            'AutoURLFile':             [ TYPE.STRING, 'autourl-file' ],
            'ShowContextMenu':         [ TYPE.BOOL, 'show-context-menu'],

            // List values are handled specially
            'AutoURLs':                [ TYPE.LIST, 'autourl-list' ],
            'AutoURLExceptions':       [ TYPE.LIST, 'exclusion-list'],
            'ApiWhitelist':            [ TYPE.LIST, 'api-whitelist' ]

        }

        // First check for a lockdown setting
        if (key.indexOf('AllowChange') == 0) {
            var testKey = key.substr(11);
            var entry = GPOToECM[testKey];
            if (entry) {
                // Convert the result to an ECM admin setting
                var result = {};
                result.name = 'adm-' + entry[1];
                result.value = !!value;

                // Lockdown setting found, we are done
                return result;
            }
        }

        // Not a lockdown setting, check for standard mapping
        var entry = GPOToECM[key];
        if (!entry) {
            // No ECM Mapping
            return null;
        }

        // Deal with lists first
        if (entry[0] == TYPE.LIST) {
            var result = { name: entry[1] };
            result.value = [];
            for (key in value) {
                result.value.push(value[key]);
            }
            return result;
        }

        // Not an admin setting and not a list
        var result = { name: entry[1] };
        switch(entry[0]) {
            case TYPE.BOOL:
                result.value = !!value;
                break;
            case TYPE.BOOL_INVERT:
                result.value = !value;
                break;
            case TYPE.INT:
                result.value = parseInt(value);
                break;
            case TYPE.STRING:
                result.value = value;
                break;
        }
        // Regular mapping, mapped and done, return the result
        return result;
    },

    /**
     *   regToECMSettings
     *
     *   Takes the registry settings JSON, validates, and merges and/or creates
     *   ECM-style settings JSON from them.
     *
     *   This supports backwards compatibility for the "EnterpriseSettings" REG_SZ value.
     *   But also supports the set of new standalone reg values which take precedence.
    **/
    regToECMSettings: function(regSettings) {
        if (!regSettings || !regSettings.result || regSettings.error) {
            return null;
        }

        // Use the 'result'
        regSettings = regSettings.result;

        // Legacy support, first load the original ECM settings
        var ecmSettings = regSettings.EnterpriseSettings;
        if (ecmSettings) {
            try {
                // This is a REG_SZ value, parse it into JSON
                ecmSettings = JSON.parse(ecmSettings);
            } catch(ex) {
                ecmSettings = null;
            }
        }
        delete regSettings.EnterpriseSettings;

        for (var key in regSettings) {
            var ecmResult = this.mapRegKeyToECM(key, regSettings[key]);
            if (ecmResult) {
                if (!ecmSettings) {
                    ecmSettings = {};
                }
                ecmSettings[ecmResult.name] = ecmResult.value;
            }
        }
        return ecmSettings;
    },

    validateLicense: function(fnResult, licensee, key) {
        // Fix for bug where one license validation failure would result in the licensee and license-key being set to null
        // which could never be fixed.  Broken in 17.2.28.1 and fixed in 17.2.29.1.
        if (Settings.get('licensee') === null) {
            this.remove('licensee');
            this.remove('license-key');
        }
        
        if (!licensee)
            licensee = this.get('licensee');
        if (!key)
            key = this.get('license-key');

        // No license or key, we're done
        if (!licensee || !key) {
            fnResult(false);
            return;
        }

        // Use the helper to validate the license
        NativeHostManager.sendWorkerMessage({
                type: 'VALIDATE_LICENSE',
                licensee: licensee,
                key: key,
            }, function(msgResult) {
                fnResult(msgResult && (msgResult.type == 'OK'));
            }.bind(this)
        );
    },

    sendCachedFile: function(fileName, fileContent, fnResult) {
        var cacheKey = 'file-cache:' + fileName;
        // We explicitly check for NULL because NULL indicates that the file does not exist, which
        // is not the same as an empty file.
        if (fileContent != null) {
            oldStorage.set(cacheKey, fileContent)
        } else {
            fileContent = oldStorage[cacheKey] || '';
        }
        fnResult(fileContent);
    },

    getAutoUrlFile: function(file, fnResult) {
        // If it's a file:// URL then use the helper to get it since it has higher permissions, otherwise
        // we use Utils which uses XHR.
        if (file.indexOf('file:') == 0) {
            NativeHostManager.sendWorkerMessage({
                type: 'GET_FILE_URL',
                file: file
            }, function(msgResult) {
                this.sendCachedFile(file, msgResult.fileContent, fnResult);
            }.bind(this));
        } else {
            Utils.getFileContent(file, false, function(fileContent) {
                this.sendCachedFile(file, fileContent, fnResult);
            }.bind(this));
        }
    },

    processAutoUrlFile: function(ecmSettings, fnContinue) {
        if (!ecmSettings || !ecmSettings['autourl-file']) {
            fnContinue();
            return;
        }

        this.getAutoUrlFile(ecmSettings['autourl-file'], function(fileContent) {
            if (fileContent) {
                var entries = fileContent.split(/[\r\n]+/);
                for (var i=0; i<entries.length; i++) {
                    var entry = entries[i];
                    if (entry.indexOf('x/') == 0) {
                        entry = entry.substring(2);
                        if (entry) {
                            var xList = ecmSettings['exclusion-list'] || [];
                            xList.push(entry);
                            ecmSettings['exclusion-list'] = xList;
                        }
                    } else if (entry) {
                        var urlList = ecmSettings['autourl-list'] || [];
                        urlList.push(entry);
                        ecmSettings['autourl-list'] = urlList;
                    }
                }
            }
            fnContinue();
        }.bind(this));
    },

    postProcessECMSettings: function(ecmSettings, fnContinue) {
        this.processAutoUrlFile(ecmSettings, fnContinue);
    },

    whenLoaded: function(fnOnLoad) {
        if (this.settingsLoaded) {
            this.onLoaded = null;
            fnOnLoad();
        } else {
            this.onLoaded = fnOnLoad;
        }
    },

    processRegSettings: function(regSettings, fnReady) {
        var ecmSettings = this.regToECMSettings(regSettings);
        if (!ecmSettings) {
            this._log('No Enterprise settings found, deleting local storage');
            IETAB.Storage.set('ECMSettings', null);
        }

        this.postProcessECMSettings(ecmSettings, function() {
            IETAB.Storage.set('ECMSettings', ecmSettings);
            // Last step is to perform license validation
            this.validateLicense(function(result) {
                if (!result) {
                    // No valid license, delete enterprise settings
                    IETAB.Storage.set('ECMSettings', null);
                }
                if (!this.settingsLoaded) {
                    if (this.onLoaded) {
                        this.onLoaded();
                    }
                }
                this.settingsLoaded = true;
                this._onNewECMSettings();
                if (fnReady) {
                    fnReady();
                }
            }.bind(this));
        }.bind(this));
    },

    _mergeRegSettings: function(regSettings, newRegSettings) {
        if (newRegSettings && newRegSettings.result && !newRegSettings.error) {
            if (!regSettings || !regSettings.result || regSettings.error)
                regSettings = { result: {} };
            for (var key in newRegSettings.result) {
                // Replace any current registry setting with the higher priority setting
                regSettings.result[key] = newRegSettings.result[key];
            }
        }
        return regSettings;
    },

    _processPolicy: function(fnReady) {
        // Remote host clients ONLY use chrome managed storage
        if (this._useRemoteHost()) {
            // NOTE:  10/21/24 Disabled managed storage support because it was broken in Edge.
            // TODO:  Just remove this code
            if (chrome.storage && chrome.storage.managed) {
                chrome.storage.managed.get(null, function(managedSettings) {
                    this.processRegSettings({ result: managedSettings }, fnReady);
                }.bind(this))
            } else {
                fnReady();
            }
            return;
        }

        console.log('Reading GPO: ' + (new Date()));        
        // We are on Windows.
        // Use GET_REGKEY to get the HKCU and HKLM policy settings
        // Note that HKCU policy settings take precedence over HKCU user settings
        // and HKLM policy settings have the highest precedence
        NativeHostManager.sendWorkerMessage(
            {type: 'GET_REGKEY', hive: 'HKCU', path: 'Software\\IE Tab\\Enterprise\\Settings' },
            function(regSettings) {
                NativeHostManager.sendWorkerMessage(
                    {type: 'GET_REGKEY', hive: 'HKCU', path: 'Software\\Policies\\IE Tab\\IE Tab' },
                    function(hkcuRegSettings) {
                        regSettings = this._mergeRegSettings(regSettings, hkcuRegSettings);
                        NativeHostManager.sendWorkerMessage(
                            {type: 'GET_REGKEY', hive: 'HKLM', path: 'Software\\Policies\\IE Tab\\IE Tab' },
                            function(hklmRegSettings) {
                                regSettings = this._mergeRegSettings(regSettings, hklmRegSettings);
                                // Note that we get a result even if there is no native host.  That result
                                // will be { type: 'HOST_NOT_FOUND' }, so we end up calling processRegSettings
                                // with 'undefined' for the settings, which is fine.

                                // Chrome managed settings are the highest priority
                                // NOTE:  10/21/24 Disabled managed storage support because it was broken in Edge.
                                // TODO:  Just remove this code
                                if (false && chrome.storage && chrome.storage.managed) {
                                    chrome.storage.managed.get(null, function(managedSettings) {
                                        regSettings = this._mergeRegSettings(regSettings, { result: managedSettings});
                                        this.processRegSettings(regSettings, fnReady);
                                    }.bind(this))
                                } else {
                                    this.processRegSettings(regSettings, fnReady);
                                }
                            }.bind(this)
                        );
                    }.bind(this)
                );
            }.bind(this)
        );
    },

    _updateSettings: function(fnReady) {
        this._log('_updateSettings');

        // We only process policy from the background, not every container
        if (Utils.inServiceWorker()) {
            this._processPolicy(fnReady);
        } else {
            if (fnReady)
                fnReady();
        }
    },

    installECMTest: function(value) {
        IETAB.Storage.set('ECMTestSettings', value);
        // Deal with new settings
        this._onNewECMSettings();
    },

    _valueOrDefault: function(container, key) {
        if ( !container || (typeof(container[key]) == 'undefined') )
            return this.DEFAULT_SETTINGS[key];
        else
            return container[key];
    },

    _getId: function() {
        var url = chrome.runtime.getURL('');
        var regexChrome = /chrome-extension:\/\/([^\/]*)/;
        var regexSafari = /safari-web-extension:\/\/([^\/]*)/;
        var match = url.match(regexChrome);
        if (!match) {
            match = url.match(regexSafari);
        }
        return match[1];
    },

    _useRemoteHost: function() {
        // Provide a switch for turning the remote host beta off
        if (oldStorage['disable-remote-host'])
            return false;
        // Force remote host
        if (oldStorage['use-remote-host'] == 1) {
            return true;
        }
        // Disabled for enterprise installs by default
        var id = this._getId();
        if ( (id == 'knnoopddfdgdabjanjmeodpkmlhapkkl') || (id == 'ncdgipmkgkhennagnfmnlkflidilhbdi') ) {
            return false;
        }
        // Otherwise, just check for a windows-based platform
        return (navigator.platform.toLowerCase().indexOf('win') == -1);
    },

    getOneSpecial: function(key) {
        switch(key) {
            case 'helper-version':
                return oldStorage['helper-version'];
            case 'use-remote-host':
                return this._useRemoteHost();
            case 'extension-id':
                return this._getId();
            case 'website':
                if (oldStorage['website'])
                    return oldStorage['website'];
                else
                    return 'https://www.ietab.net';
                break;
        }
        return null;
    },

    getOne: function(key) {
        // See if this a special, pre-defined setting
        var result = this.getOneSpecial(key);
        if (result || (typeof(result) == 'boolean')) {
            return result;
        }

        // If it is a locked hosted setting then use it
        if (this.getOneSpecial('use-remote-host') && (typeof(this.LOCKED_HOSTED_SETTINGS[key]) != 'undefined')) {
            return this.LOCKED_HOSTED_SETTINGS[key];
        }

        // Get both the local and the ECM settings
        var localSettings = IETAB.Storage.get('localSettings');
        // ECM Test settings override the ECM registry settings
        var ecmSettings = IETAB.Storage.get('ECMTestSettings');
        if (!ecmSettings)
            ecmSettings = IETAB.Storage.get('ECMSettings');

        // If they request local only, then give them local only
        if (key.indexOf('local-') === 0)
            return this._valueOrDefault(localSettings, key.substr(6));

        // If they request ecm only, then give them ecm only
        if (key.indexOf('ecm-') === 0)
            return this._valueOrDefault(ecmSettings, key.substr(4));

        // If no ECM settings, just return the local settings value
        if (!ecmSettings)
            return this._valueOrDefault(localSettings, key);

        // Check whether the ECM has disabled this key locally, if so, return the ECM value
        var enabledKey = 'adm-' + key;
        if (ecmSettings[enabledKey] === false)
            return this._valueOrDefault(ecmSettings, key);

        // If we don't have an ECM value, return the local one
        if (typeof(ecmSettings[key]) == 'undefined')
            return this._valueOrDefault(localSettings, key);

        // If we don't have a local value, return the ECM one
        if (!localSettings || (typeof(localSettings[key]) == 'undefined'))
            return ecmSettings[key];

        // If we got here then both values are defined

        // Deal with merged settings
        if (this.MERGED_SETTINGS[key]) {
            var result = ecmSettings[key];
            if (typeof(ecmSettings['adm-enable-' + key]) !== false)
                result = result.concat(localSettings[key]);
            // Remove duplicates
            result = result.filter(function(el, pos) {
                return result.indexOf(el) == pos;
            });
            return result;
        }

        // At this point we have both ECM and local values, it's not a merged value, and it hasn't been disabled,
        // so return the local one
        return localSettings[key];
    },

    addToList: function(theList, entry) {
        var values = this.get(theList) || [];
        values.push(entry);
        this.set(theList, values);
    },

    get: function(key) {
        if ((typeof(key) === 'object') && key.length) {
            var result = {};
            for (var i=0; i<key.length; i++) {
                result[key[i]] = this.getOne(key[i]);
            }
            return result;
        }
        else {
            return this.getOne(key);
        }
    },

    remove: function(key) {
        var localSettings = IETAB.Storage.get('localSettings');
        delete localSettings[key];
        IETAB.Storage.set('localSettings', localSettings);
    },

    set: function(key, value) {
        // It is redundant to supply 'local-' when setting a setting, but for consistency
        // we allow it.  Just remote the prefix.
        var regexLocal = /^local\-/;
        key = key.replace(regexLocal, '');

        var localSettings = IETAB.Storage.get('localSettings');
        if (!localSettings)
            localSettings = this._initLocal();

        localSettings[key] = value;

        IETAB.Storage.set('localSettings', localSettings);

        // Special-case for compat mode
        if (key == 'compat-mode')
            Background.onSetCompatMode(value);

        if (key == 'spellcheck')
            Background.onSetSpellCheck(value);

        if (key == 'scripturl-mitigation')
            Background.onSetScriptMitigation(value);

        if (key == 'open-in-new-tab')
            Background.onSetOpenInNewTab(value);

        if (key == 'new-pointer-mode')
            Background.onSetNewPointerMode(value);

        if ((key == 'autourl-list') || (key == 'exclusion-list') || (key == 'enable-auto-urls')) {
            BackgroundProxy.call('onAutoUrlsChanged');
        }

        if (key == 'show-context-menu') {
            Background.onContextMenuChanged();
        }
    },


    onAlarm: function(alarm) {
        if (Utils.inServiceWorker() && (alarm.name === 'gpoPing')) {
            this._updateSettings();
        }
    },
    
    init: function(fnReady) {
        // First, load the storage cache
        IETAB.Storage.callWhenReady(() => {
            // Use default hosted settings if they exist
            if (this.getOneSpecial('use-remote-host')) {
                for (var key in this.DEFAULT_HOSTED_SETTINGS) {
                    this.DEFAULT_SETTINGS[key] = this.DEFAULT_HOSTED_SETTINGS[key];
                }
            }

            if (Utils.inServiceWorker() && Background.isSessionStart) {
                // Read GPO then continue with fnReady
                this._updateSettings(fnReady);

                // Establish the refresh for GPO alarm
                chrome.alarms.create('gpoPing', {
                    periodInMinutes: 10
                });
                this._initLocal();
            } else {
                this._initLocal();
                fnReady();
            }
        });
    }
}

// Make sure the alarm handler is set at the top level
chrome.alarms.onAlarm.addListener(Settings.onAlarm.bind(Settings));
