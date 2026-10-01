/*
 * The script for the Options page
 */

var OptionsPage = {
    COMPAT_MAP: {
            'mode-ie-7s' : 'IE7S',
            'mode-ie-8s' : 'IE8S',
            'mode-ie-8f' : 'IE8F',
            'mode-ie-9s' : 'IE9S',
            'mode-ie-9f' : 'IE9F',
            'mode-ie-10s' : 'IE10S',
            'mode-ie-10f' : 'IE10F',
            'mode-ie-11s' : 'IE11S',
            'mode-ie-11f' : 'IE11F'
    },
    COMPAT_VALUE_MAP: {},  // Will be filled out during init as the inverse of COMPAT_MAP

    licensed: false,

    gatherOptionElements: function(elSelect) {
        var values = [];
        for(i=0; i<elSelect.children.length; i++)
        {
            var elOption = elSelect.children[i];
            if ((elOption.getAttribute("disabled") != "disabled") && elOption.value)
                values.push(elOption.value);
        }
        return values;
    },

    gatherAutoURLs: function(list) {
        var urls = this.gatherOptionElements($('#address-list')[0]);
        alert(urls);
        $('#hidden-autourl-list')[0].value = JSON.stringify(urls);
        urls = this.gatherOptionElements($('#exclusion-list')[0]);
        alert(urls);
        $('#hidden-exclusion-list')[0].value = JSON.stringify(urls);
    },

    handleECMSettings: function(values) {
        var GENERAL_OPTIONS = [
            'enable-auto-urls',
            'enable-chrome-popups',
            'open-popups-in-tab',
            'hide-addr-bar',
            'enable-use-full-window-popups',
            'only-auto-urls',
            'never-open-exceptions',
            'show-status-text',
            'spellcheck',
            'scripturl-mitigation',
            'enable-direct-invoke',
            'cookie-sync',
            'favicon',
            'beforeunload',
            'enable-dep',
            'enable-atl-dep',
            'ietab-header',
            'threaded-popups',
            'open-in-new-tab',
            'new-pointer-mode',
            'optimize-direct-invoke',
            'intercept-redirects',
            'single-session',
            'local-network',
            'ie-dialogs',
            'show-context-menu'
        ]

        var countDisabled = 0;
        for (var key in GENERAL_OPTIONS) {
            var id = GENERAL_OPTIONS[key];
            // If the ECM value is false, then disable the element
            if (values['adm-' + id] === false) {
                countDisabled++;
                var selector = '#' + id + '-row';
                $(selector + ' input').attr('disabled', 'disabled');
                $(selector).addClass('admin-disabled');
            }
        }
        // If all of the general options are disabled, then hide the block
        if (countDisabled == GENERAL_OPTIONS.length)
            $('#general-options-block').addClass('admin-disabled-block');

        // If auto urls are disabled, then hide the block
        if ( (values['adm-enable-autourl-list'] === false) || (values['adm-autourl-list'] === false)) {
            $('#autourl-block').addClass('admin-disabled-block');
            $('#autourl-block input').attr('disabled', 'disabled');
        }
        // If exclusion lists are disabled, hide the block
        if ( (values['adm-enable-exclusion-list'] === false) || (values['adm-exclusion-list'] === false)) {
            $('#autourl-exceptions-block').addClass('admin-disabled-block');
            $('#autourl-exceptions-block input').attr('disabled', 'disabled');
        }
        // If compat mode is disabled, then hide it too
        if ( (values['adm-enable-compat-mode'] === false) || (values['adm-compat-mode'] === false)) {
            $('#compatibility-mode').addClass('admin-disabled-block');
            $('#compatibility-mode input').attr('disabled', 'disabled');
        }
    },

    updateSetting: function(key, value) {
        this.settings[key] = value;
        BackgroundProxy.call2('setSetting', key, value);
    },

    onCompatModeClick: function(evt) {
        var newMode = this.COMPAT_MAP[evt.target.id];
        this.updateSetting('compat-mode', newMode);
    },

    appendOptionElements: function($select, values, disabled) {
        if (typeof(values) == 'undefined')
            return;

        for (var i=0; i<values.length; i++) {
            if (!values[i])
                continue;
            var $option = $('<option></option>');
            $option.val(values[i]);
            $option.text(values[i]);
            if (disabled)
                $option.attr('disabled', 'disabled');
            $option.appendTo($select);
        }
    },

    appendAdminOptionHeader: function($select) {
        var $option = $('<option disabled="disabled"></option>');
        $option.appendTo($select);
        $option = $('<option class="admin-url-header" disabled="disabled">Admin-Supplied URLs</option>');
        $option.appendTo($select);
    },

    loadAutoUrls: function(values) {
        // Clear it out
        $select = $('#address-list');
        $select.empty();

        // Add the user-defined auto urls
        this.appendOptionElements($select, values['local-autourl-list']);

        // If we have any ECM auto urls, add a header then append them
        if (values['ecm-autourl-list'] && values['ecm-autourl-list'].length) {
            this.appendAdminOptionHeader($select);
            this.appendOptionElements($select, values['ecm-autourl-list'], true);
        }

        // Add the user-defined exclusion urls
        $select = $('#exclusion-list');
        $select.empty();
        this.appendOptionElements($select, values['local-exclusion-list']);

        // And append the ECM exclusions
        if (values['ecm-exclusion-list'] && values['ecm-exclusion-list'].length) {
            this.appendAdminOptionHeader($select);
            this.appendOptionElements($select, values['ecm-exclusion-list'], true);
        }

        if ( (values['local-api-whitelist'] && values['local-api-whitelist'].length) ||
             (values['local-api-blacklist'] && values['local-api-blacklist'].length) ) {
            $('#clear-apilist-button').css('display', 'inline');
        }
    },

    displayPlatformSpecific: function() {
        var arrPlatformSpecific = $('[platform]');
        var currentPlatform = this.settings['use-remote-host'] ? 'hosted' : 'native';
        for (var i=0; i<arrPlatformSpecific.length; i++) {
            var platform = arrPlatformSpecific[i].getAttribute('platform');
            if (platform != currentPlatform) {
                arrPlatformSpecific[i].style.display = 'none';
            }
        }
    },

    loadSettings: function(values) {
        console.log("loadSettings");
        var self = this;
        this.handleECMSettings(values);

        this.settings = values;

        // Set the general option properties
        $('#enable-auto-urls').prop('checked', !!values['enable-auto-urls']);
        $('#enable-chrome-popups').prop('checked', !!values['enable-chrome-popups']);
        $('#open-popups-in-tab').prop('checked', !!values['open-popups-in-tab']);
        $('#hide-addr-bar').prop('checked', !!values['hide-addr-bar']);
        $('#enable-use-full-window-popups').prop('checked', !!values['enable-use-full-window-popups']);
        $('#only-auto-urls').prop('checked', !!values['only-auto-urls']);
        $('#never-open-exceptions').prop('checked', !!values['never-open-exceptions']);
        $('#show-status-text').prop('checked', !!values['show-status-text']);
        $('#spellcheck').prop('checked', !!values['spellcheck']);
        $('#scripturl-mitigation').prop('checked', !!values['scripturl-mitigation']);
        $('#enable-direct-invoke').prop('checked', !!values['enable-direct-invoke']);
        $('#cookie-sync').prop('checked', !!values['cookie-sync']);
        $('#favicon').prop('checked', !!values['favicon']);
        $('#beforeunload').prop('checked', !!values['beforeunload']);
        $('#enable-dep').prop('checked', !!values['enable-dep']);
        $('#enable-atl-dep').prop('checked', !!values['enable-atl-dep']);
        $('#ietab-header').prop('checked', !!values['ietab-header']);
        $('#threaded-popups').prop('checked', !!values['threaded-popups']);
        $('#open-in-new-tab').prop('checked', !!values['open-in-new-tab']);
        $('#single-session').prop('checked', !!values['single-session']);
        $('#local-network').prop('checked', !!values['local-network']);
        $('#ie-dialogs').prop('checked', !!values['ie-dialogs']);
        $('#show-context-menu').prop('checked', !!values['show-context-menu']);
        $('#new-pointer-mode').prop('checked', !!values['new-pointer-mode']);
        $('#optimize-direct-invoke').prop('checked', !!values['optimize-direct-invoke']);
        $('#intercept-redirects').prop('checked', !!values['intercept-redirects']);

        // If we have a licensee value, then this is a licensed copy
        if (values['licensee'])
            this.licensed = true;

        // Hide any settings that should not be visible on this platform
        self.displayPlatformSpecific();

        // Load the autourl lists
        this.loadAutoUrls(values);

        // Update the compat mode
        if (values['compat-mode']) {
            var id = this.COMPAT_VALUE_MAP[[values['compat-mode']]];
            $('#' + id).prop('checked', true);
        }

        // No license info or advertising for remote host
        if (values['use-remote-host']) {
            $('#licensee-name').css('display', 'none');
        } else {
            // Display license info
            if (values['licensee']) {
                $('#licensee').text(values['licensee']);
                $('#licensee-info').css('display', 'inline');
                if (values['license-expiration']) {
                    var expiresTime = values['license-expiration'];
                    var now = new Date();
                    var diff = expiresTime - now.valueOf();
                    if (diff < 0) {
                        $('#license-expiration').css('font-weight', 'bold');
                        $('#license-expiration').css('color', 'red');
                        $('#check-license-again').css('display', 'block');
                    }
                    var expireDate = new Date(values['license-expiration']);
                    var options = { day: 'numeric', month: 'long', year: 'numeric' };
                    var expireText = expireDate.toLocaleString('default', options)
                    $('#license-date').text(expireText);
                    $('#license-expiration').css('display', 'inline');
                }
            }
            else {
                $('#not-licensed').css('display', 'inline');
            }

            if(IETAB.Storage.get('licenseCancelled')) {
                $('#license-expiration').css('display', 'inline');
                $('#license-expiration').text('License Expired');
                $('#check-license-again').css('display', 'block');
                $('#license-expiration').css('color', 'red');


            }
        }

        $('#check-license-again a').click((evt) => {
            evt.preventDefault();
            BackgroundProxy.call('licensePing');

            // Show the "Checking..." message
            $('body').append(`
            <div id="checking-message" style="">
              Checking...
            </div>
            `);


            // Set a timeout to refresh the page after 3 seconds
            setTimeout(() => {
                $('#checking-message').remove(); // Remove the "Checking..." message
                location.reload(); // Refresh the page
            }, 3000);
        });
        
        if(oldStorage['helper-version'])
            $('#helper-version').text('Helper version: ' + values['helper-version']);
    },

    onAddressKey: function(event)
    {
        var characterCode;

        // First, check for the enter key
        if(event && event.which)
            characterCode = event.which;
        else
            characterCode = event.keyCode;

        if(characterCode == 13)
        {
            this.onAdd();
            return false;
        }
    },

    onxAddressKey: function(event) {
        var characterCode;

        // First, check for the enter key
        if (event && event.which)
            characterCode = event.which;
        else
            characterCode = event.keyCode;

        if (characterCode == 13) {
            this.onxAdd();
            return false;
        }
    },

    onAdd: function()
    {
        var addressText = document.getElementById("address-text");
        var addressList = document.getElementById("address-list");
        var str = addressText.value;
        str = str.trim();
        if (!this.settings['use-remote-host'] && (str.indexOf('[') == 0) && !this.licensed) {
            window.setTimeout(function() {
                $("#license-dialog").leanModal();
            }, 0);
            return;
        }

        if(str)
        {
            addressList.insertBefore(new Option(str, str), addressList.firstChild);
            addressText.value = "";
        }

        // Update the storage
        var urls = this.gatherOptionElements($('#address-list')[0]);
        this.updateSetting('autourl-list', urls);
    },

    onRemove: function()
    {
        var addressList = document.getElementById("address-list");
        for(var i=addressList.options.length-1; i>=0; i--)
        {
            if(addressList.options[i].selected)
            {
                addressList.removeChild(addressList.options[i]);
            }
        }
        // Update the storage
        var urls = this.gatherOptionElements($('#address-list')[0]);
        this.updateSetting('autourl-list', urls);
    },

    onxAdd: function() {
        var addressText = document.getElementById("x-address-text");
        var exclusionList = document.getElementById("exclusion-list");
        var str = addressText.value;
        if (str) {
            exclusionList.add(new Option(str, str), null);
            addressText.value = "";
        }
        // Update the storage
        var urls = this.gatherOptionElements($('#exclusion-list')[0]);
        this.updateSetting('exclusion-list', urls);
    },

    onxRemove: function() {
        var exclusionList = document.getElementById("exclusion-list");
        for (var i = exclusionList.options.length - 1; i >= 0; i--) {
            if (exclusionList.options[i].selected) {
                exclusionList.removeChild(exclusionList.options[i]);
            }
        }
        // Update the storage
        var urls = this.gatherOptionElements($('#exclusion-list')[0]);
        this.updateSetting('exclusion-list', urls);
    },

    onClearAPIList: function() {
        this.updateSetting('api-whitelist', []);
        this.updateSetting('api-blacklist', []);
        $('#clear-apilist-button').css('display', 'none');
    },

    //
    //    dotVersionCompare
    //
    //    v1 > v2  : +1
    //    v1 == v2 : 0
    //    v1 < v2  : -1
    //
    dotVersionCompare: function(v1, v2) {
        var p1 = v1.split(".");
        var p2 = v2.split(".");

        for(var i=0; i < p1.length; i++) {
            // If we were equal so far and v1 is longer, then v1 is bigger
            if(p2.length <= i) return 1;

            // Compare the current integers
            var n1 = parseInt(p1[i]);
            var n2 = parseInt(p2[i]);
            if(n1 < n2) return -1;
            else if(n1 > n2) return 1;
        }
        // If we reached the end of both versions, then they are equal, otherwise
        // if we didn't reach the end of v2, then it is longer, and therefore greater
        if(i == p2.length) return 0;
        else return -1;
    },

    versionAtLeast: function(v) {
        return (this.dotVersionCompare(this.version, v) >=0);
    },

    isOnEdge: function() {
        return navigator.userAgent.indexOf('Edg/') != -1;
    },

    initDocReady: function() {
    },

    isAtLeastWindows8: function() {
        try {
            var regexVersion = /Windows NT ([^ ;]*)/;
            var match = window.navigator.userAgent.match(regexVersion);
            if (!match)
                return false;

            var n = parseFloat(match[1]);
            return n >= 6.2;

        } catch(ex) {
            return false;
        }
    },

    onMessage: function(msg) {
        var html = '';
        if (msg.type == 'DUMP_CREATED') {
            html = $('#dump-output').html();
            html += '=====================================<br/>';
            if (msg.url) {
                html += 'URL: ' + msg.url + '<br/>';
            }
            if (msg.hostName) {
                html += 'HOST NAME: ' + msg.hostName + '<br/>';
            }
            if (msg.processId) {
                html += 'PROCESS ID: ' + msg.processId + '<br/>';
            }
            html += 'DUMP: ' + msg.dumpFile + '<br/>';
            html += '=====================================<br/>';
            $('#dump-output').html(html);
        } else if(msg.type == 'URL_PROCESS_INFO') {
            html = $('#dump-output').html();
            html += '=====================================<br/>';
            html += 'PROCESS ID: ' + msg.processId + '<br/>';
            html += 'URL: ' + msg.url + '<br/>';
            html += '=====================================<br/>';
            $('#dump-output').html(html);
        }
    },

    isEdge: function() {
        return (navigator.userAgent.indexOf('Edg/') != -1);
    },

    // Function to download data to a file
    download: function(data, filename, type) {
        var file = new Blob([data], {type: type});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            var a = document.createElement("a"),
                    url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);  
            }, 0); 
        }
    },

    finishImport: function(contents) {
        var data = {};
        try {
            data = JSON.parse(contents);
        } catch(ex) {

        }
        if (!data.v || !data.localSettings) {
            alert('Not an IE Tab settings file');
        }
        alert('Settings imported.\r\n\r\nPress okay to reload IE Tab with the new settings');
        oldStorage['localSettings'] = data.localSettings;
        window.setTimeout(function() {
            chrome.runtime.reload();

        }, 2000);
    },

    readImportFile: function(evt) {
        var file = evt.target.files[0];
        if (!file)
            return;
        var reader = new FileReader();
        reader.onload = (evt) => {
            var contents = evt.target.result;
            this.finishImport(contents);
        }
        reader.readAsText(file);
    },

    exportSettings: function() {
        chrome.runtime.sendMessage({ type: 'GET_EXPORTSETTINGS' }, (data) => {
            this.download(JSON.stringify(data), 'ietab_settings.txt', 'text/plain');
        });
    },

    updateOnlyWebRequestButton: function() {
        if (IETAB.Storage.get('only-web-request')) {
            $('#only-web-request').text('Do use DNR');
        } else {
            $('#only-web-request').text("Don't use DNR");
        }
    },

    initWindowLoad: function() {
        var self = this;

        this.COMPAT_VALUE_MAP = {};
        for (var key in this.COMPAT_MAP) {
            this.COMPAT_VALUE_MAP[this.COMPAT_MAP[key]] = key;
        }

        // Don't show the Chrome Web Store rating prompt on edge
        if (this.isOnEdge()) {
            $('#rate-ietab').css('display', 'none');
        }

        var requestSettings = [
            // General settings
            'enable-auto-urls',
            'enable-chrome-popups',
            'open-popups-in-tab',
            'hide-addr-bar',
            'enable-use-full-window-popups',
            'only-auto-urls',
            'never-open-exceptions',
            'show-status-text',
            'spellcheck',
            'scripturl-mitigation',
            'enable-direct-invoke',
            'cookie-sync',
            'favicon',
            'beforeunload',
            'enable-dep',
            'enable-atl-dep',
            'ietab-header',
            'threaded-popups',
            'open-in-new-tab',
            'new-pointer-mode',
            'optimize-direct-invoke',
            'intercept-redirects',
            'single-session',
            'local-network',
            'ie-dialogs',
            'show-context-menu',
            'use-remote-host',

            // Auto URLs
            'local-autourl-list',
            'local-exclusion-list',
            'local-api-whitelist',
            'local-api-blacklist',
            'ecm-autourl-list',
            'ecm-exclusion-list',

            // Compat mode
            'compat-mode',

            // License information
            'licensee',
            'license-key',
            'license-expiration',

            'helper-version',

            // Administrative control
            'adm-enable-auto-urls',
            'adm-enable-chrome-popups',
            'adm-open-popups-in-tab',
            'adm-hide-addr-bar',
            'adm-enable-use-full-window-popups',
            'adm-disable-auto-search',
            'adm-only-auto-urls',
            'adm-enable-dep',
            'adm-enable-atl-dep',
            'adm-never-open-exceptions',
            'adm-show-status-text',
            'adm-spellcheck',
            'adm-scripturl-mitigation',
            'adm-enable-direct-invoke',
            'adm-cookie-sync',
            'adm-favicon',
            'adm-beforeunload',
            'adm-ietab-header',
            'adm-threaded-popups',
            'adm-open-in-new-tab',
            'adm-new-pointer-mode',
            'adm-single-session',
            'adm-ie-dialogs',
            'adm-show-context-menu',

            // These three are deprecated and can go away when we stop supporting
            // the "EnterpriseSettings" string and exclusively use GPO settings.
            'adm-enable-autourl-list',
            'adm-enable-exclusion-list',
            'adm-enable-compat-mode',

            // New GPO-formatted settings are better
            'adm-autourl-list',
            'adm-exclusion-list',
            'adm-compat-mode'
        ];

        BackgroundProxy.call('getSetting', requestSettings, (settings) => {
            this.loadSettings(settings);
        });

        $('#address-text').keypress( this.onAddressKey.bind(this) );
        $('#add-button').click( this.onAdd.bind(this) );
        $('#remove-button').click( this.onRemove.bind(this) );
        $('#clear-apilist-button').click( this.onClearAPIList.bind(this) );

        $('#x-address-text').keypress( this.onxAddressKey.bind(this) );
        $('#x-add-button').click( this.onxAdd.bind(this) );
        $('#x-remove-button').click( this.onxRemove.bind(this) );

        // General Options click handlers
        $('#enable-auto-urls').click(function() {
            self.updateSetting('enable-auto-urls', !!$('#enable-auto-urls:checked').val());
        });
        $('#enable-chrome-popups').click(function() {
            self.updateSetting('enable-chrome-popups', !!$('#enable-chrome-popups:checked').val());
        });
        $('#open-popups-in-tab').click(function() {
            self.updateSetting('open-popups-in-tab', !!$('#open-popups-in-tab:checked').val());
        });
        $('#hide-addr-bar').click(function() {
            self.updateSetting('hide-addr-bar', !!$('#hide-addr-bar:checked').val());
        });
        $('#enable-use-full-window-popups').click(function() {
            self.updateSetting('enable-use-full-window-popups', !!$('#enable-use-full-window-popups:checked').val());
        });
        $('#only-auto-urls').click(function() {
            self.updateSetting('only-auto-urls', !!$('#only-auto-urls:checked').val());
        });
        $('#never-open-exceptions').click(function() {
            self.updateSetting('never-open-exceptions', !!$('#never-open-exceptions:checked').val());
        });
        $('#show-status-text').click(function() {
            self.updateSetting('show-status-text', !!$('#show-status-text:checked').val());
        });
        $('#spellcheck').click(function() {
            self.updateSetting('spellcheck', !!$('#spellcheck:checked').val());
        });
        $('#scripturl-mitigation').click(function() {
            self.updateSetting('scripturl-mitigation', !!$('#scripturl-mitigation:checked').val());
        });
        $('#enable-direct-invoke').click(function() {
            self.updateSetting('enable-direct-invoke', !!$('#enable-direct-invoke:checked').val());
        });
        $('#cookie-sync').click(function() {
            self.updateSetting('cookie-sync', !!$('#cookie-sync:checked').val());
        });
        $('#favicon').click(function() {
            self.updateSetting('favicon', !!$('#favicon:checked').val());
        });
        $('#beforeunload').click(function() {
            self.updateSetting('beforeunload', !!$('#beforeunload:checked').val());
        });
        $('#enable-dep').click(function() {
            self.updateSetting('enable-dep', !!$('#enable-dep:checked').val());
        });
        $('#enable-atl-dep').click(function() {
            self.updateSetting('enable-atl-dep', !!$('#enable-atl-dep:checked').val());
        });
        $('#ietab-header').click(function() {
            self.updateSetting('ietab-header', !!$('#ietab-header:checked').val());
        });
        $('#threaded-popups').click(function() {
            self.updateSetting('threaded-popups', !!$('#threaded-popups:checked').val());
        });
        $('#open-in-new-tab').click(function() {
            self.updateSetting('open-in-new-tab', !!$('#open-in-new-tab:checked').val());
        });
        $('#new-pointer-mode').click(function() {
            self.updateSetting('new-pointer-mode', !!$('#new-pointer-mode:checked').val());
        });
        $('#optimize-direct-invoke').click(function() {
            self.updateSetting('optimize-direct-invoke', !!$('#optimize-direct-invoke:checked').val());
        });
        $('#intercept-redirects').click(function() {
            self.updateSetting('intercept-redirects', !!$('#intercept-redirects:checked').val());
        });
        $('#single-session').click(function() {
            self.updateSetting('single-session', !!$('#single-session:checked').val());
        });
        $('#local-network').click(function() {
            self.updateSetting('local-network', !!$('#local-network:checked').val());
        });
        $('#ie-dialogs').click(function() {
            self.updateSetting('ie-dialogs', !!$('#ie-dialogs:checked').val());
        });
        $('#show-context-menu').click(function() {
            self.updateSetting('show-context-menu', !!$('#show-context-menu:checked').val());
        });

        // Compat mode settings click handler
        $('#compatibility-mode input').click( function(evt) {
            self.onCompatModeClick(evt);
        });

        // Enable version-specific functionality
        this.version = chrome.runtime.getManifest().version;
        $('#ie-tab-version').text(this.version);

        // Display version-specific options that qualify
        var arrVersionSpecific = $('[ext-version]');
        var isWin8 = this.isAtLeastWindows8();
        for (var i=0; i<arrVersionSpecific.length; i++) {
            // But not if they also require windows 8 and we're on something less
            if(!isWin8 && (arrVersionSpecific[i].getAttribute('win-version') == '8')) {
                arrVersionSpecific[i].style.display = 'none';
                continue;
            }

            var ver = arrVersionSpecific[i].getAttribute('ext-version');
            if(!this.versionAtLeast(ver)) {
                arrVersionSpecific[i].style.display = 'none';
            }
        }

        // Block license-only features for users without a license
        document.addEventListener('click', function(e) {
            // But we don't have license requirements for the hosted version
            if (this.settings['use-remote-host'])
                return;
            var el = e.target;
            if (el.hasAttribute('licensed-only')) {
                if (!this.licensed) {
                    e.stopPropagation();
                    e.preventDefault();

                    window.setTimeout(function() {
                        $("#license-dialog").leanModal();
                    }, 0);
                }
            }
        }.bind(this), true);

        // Enable the debug options if they have '?debug=1'
        if (document.location.href.indexOf('debug=1') != -1) {
            $('#debug-options').css('display', 'inline-block');
        }
        $('#dump-button').click(function() {
            $('#dump-output').html('Dumps being requested...<br/><br/>');
            BackgroundProxy.call('onDumpAllProcesses');
        });
        $('#dump-windows').click(function() {
            BackgroundProxy.call('onDumpWindows');
        });
        $('#toggle-hosted-mode').click(function() {
            BackgroundProxy.call('onToggleHosted');
        });
        $('#clear-local').click(function() {
            oldStorage.remove('localSettings');
            chrome.runtime.reload();
        });
        $('#reset-ietab').click(() => {
            for (var key in oldStorage) {
                if (typeof oldStorage[key] != 'function') 
                    oldStorage.remove(key);
            }
            chrome.runtime.reload();
        });

        $('#only-web-request').click(() => {
            IETAB.Storage.set('only-web-request', !IETAB.Storage.get('only-web-request'));
            this.updateOnlyWebRequestButton();
            window.setTimeout(() => {
                chrome.runtime.reload();
            }, 2000);
        });
        this.updateOnlyWebRequestButton();

        $('#export-button').click(() => {
            this.exportSettings();
        });

        $('#import-button').click(() => {
            $('#import-file').click();
        });
        if ($('#import-file').length)
            $('#import-file')[0].addEventListener('change', this.readImportFile.bind(this), false);

        $('#enable-crash-dumps-button').click(function() {
            window.setTimeout(function() {
                alert(
                    'IMPORTANT:  Do not select Open or try to run directly from Chrome. ' +
                    'This will only work if you click on the arrow and select "Show in Folder" and run the .reg from Explorer. ' +
                    'This is only available to machine administrators.\r\n' +
                    'Execute the downloaded .reg file to enable the collection of crash dump files when the IE Tab Helper crashes\r\n' +
                    'The dump file location:  %LOCALAPPDATA%\\IE Tab\\CrashDumps');
            }, 0);
        });
        if (this.isEdge()) {
            $('.thebrowser').text('Edge');
        } else {
            $('.thebrowser').text('Chrome');
        }
    },

    initEarly: function() {
        chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
    }
}

OptionsPage.initEarly();

$(document).ready(function() {
    OptionsPage.initDocReady();
});

$(window).on('load', function() {
    OptionsPage.initWindowLoad();
});


