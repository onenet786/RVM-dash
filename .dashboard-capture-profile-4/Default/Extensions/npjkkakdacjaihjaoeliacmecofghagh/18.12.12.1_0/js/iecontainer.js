/*
 * iecontainer.js
 *
 * Script for the container that will load the IE rendering engine, whether that engine is provided by
 * a native host or by a remote host.
 *
 */
var IEContainer = {
    BW: null,  // The background window
    windowId: null,
    tabId: null,
    isAttached: false,
    realTitle: '',
    hostName: '',
    hostWindowId: null,
    hideAddressBar: false,
    beforeUnloadActive: false,
    helperSupportsHistory : false,
    includeWithAll: null,
    usingHostProxy: false,
    useRemoteHost: false,
    nextPushState: null,

    ATTACH_RETRY_TIMEOUT: 50,
    DISCONNECT_MESSAGE_WAIT: 3000,  // Don't show the disconnect message right away
    FORCE_ACTIVATE_DELAY: 2000,

    // BACK/FWD SUPPORT
    nextPageId: 1,
    currentPage: 0,
    historyId: 1,

    // We have a resize delay to deal with an obscure case:
    //    If you zoom in on the container page, you get the resize before
    //    the page has fully repainted.  So the anchor color line is still on the screen
    //    and we find it at the old location, thus we end up positioning the IE window
    //    where it WAS, not where it currently is.  You can see this by zooming the address
    //    bar out and then it happens when you zoom back in.
    RESIZE_DELAY: 50,

    ONE_DAY_MS: 1000 * 3600 * 24,

    buildContainerUrl: function(childUrl, popupInfo) {
        var containerPage = 'nhc.htm';
        var containerUrl = chrome.runtime.getURL(containerPage);
        if (popupInfo) {
            containerUrl += '#p=' + encodeURIComponent(JSON.stringify(popupInfo)) + '&';
        } else {
            containerUrl += '#';
        }
        containerUrl += 'url=' + childUrl;
        return containerUrl;
    },

    navigateContainer: function(childUrl, replaceEntry) {
        // navigateContainer is called by the address bar
        this.currentPage = this.nextPageId++;
        this.onPushState({ page: this.currentPage, historyId: this.historyId }, "", this.buildContainerUrl(childUrl));
        if (this.useRemoteHost && !this.usingHostProxy && Settings.URLhasFilterOption(childUrl, 'local')) {
            window.location.reload(true);
        } else {
            this.navigateHost(childUrl);
        }
        $('#prompt-activex').css('display', 'none');
    },

    extractChildUrl: function() {
        var regex = /[#&]url=([^&].*)/;
        var url = document.location.href.toString();
        var match = url.match(regex);
        if(match) {
            return match[1];
        } else {
            return 'about:blank';
        }
    },

    updateAddressBar: function(url) {
        var childUrl = url ? url : this.extractChildUrl();
        $('#address-box').val(childUrl);
    },

    getAddrHeight: function() {
        if (Settings.get('hide-addr-bar')) {
            return 0;
        }
        return $('#address-bar').outerHeight() * window.devicePixelRatio;
    },

    handleResize: function() {
        window.setTimeout(function() {
            var msgResize = {
                type: 'RESIZE',
                innerWidth: this.getIEWidth(),
                innerHeight: this.getIEHeight(),
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                addrHeight: this.getAddrHeight()
            };
            this.postHostMessage(msgResize);

            // Also check whether we should hide / or show the address bar
            if (Settings.get('hide-addr-bar')) {
                $('#address-bar').css('display', 'none');
            } else {
                $('#address-bar').css('display', 'table');
            }
        }.bind(this), this.RESIZE_DELAY);
    },

    restoreTitle: function() {
        document.title = this.realTitle;
    },

    removePopupInfoFromAddress: function(popupUrl, title) {
        // We only need popup info when we first attach.  Once the attach is successful
        // we can remove the popup info so a refresh will work.
        var newUrl = this.buildContainerUrl(popupUrl || this.extractChildUrl());
        history.replaceState({ page: this.currentPage, historyId: this.historyId }, "", newUrl);

        // If they supply a title or url use those as the new title
        title = title || popupUrl;
        if(title)
            this.setTitle(title);
        this.updateAddressBar();
    },

    onOpenDebugger: function() {
        var msg = {
            type: 'OPEN_DEBUGGER'
        }
        this.sendHostMessage(msg);
    },

    // Called when they click the 'X' button
    onReturnToChrome: function() {
        window.top.location = this.extractChildUrl();
    },

    onBookmark: function() {
    },

    isInEdge: function() {
        return navigator.userAgent.indexOf('Edg/') != -1;
    },

    navigateHost: function(url) {
        if (!url) {
            url = this.extractChildUrl();
        }
        if (this.useRemoteHost) {
            if ((url.indexOf('hostedstartpage') != -1) || (url.indexOf('file://') == 0) || (url.match(/^[cC]:/))) {
                $('#hosted-start-page').css('display', 'block');
                $('#display-div').css('display', 'none');
                return;
            }
            $('#hosted-start-page').css('display', 'none');
            $('#display-div').css('display', 'block');
        }

        BackgroundProxy.getProp('autoUrlDetails', (autoUrlDetails) => {
            var details = autoUrlDetails[url];
            if (details) {
                // We only support application/x-www-form-urlencoded for now.
                // Use javascript to help us convert the formData object to
                // that format so we don't have to do it in the helper app.
                BackgroundProxy.call('removeAutoURLDetails', url);
                if (details.requestBody && details.requestBody.formData) {
                    details.requestBody = new URLSearchParams(details.requestBody.formData).toString();
                } else {
                    details.requestBody = '';
                }
            } else {
                details = {};
            }

            this.replaceNextNav = true;
            this.postHostMessage({
                type: 'NAVIGATE',
                url: url,
                method: details.method,
                requestBody: details.requestBody
            });
        })
    },

    sendOptions: function() {
        var msg = {
            type: 'OPTIONS',
            options: {
                'autourl-list':         Settings.get('autourl-list'),
                'exclusion-list':       Settings.get('exclusion-list'),
                'enable-chrome-popups': Settings.get('enable-chrome-popups'),
                'only-auto-urls':       Settings.get('only-auto-urls'),
                'never-open-exceptions':Settings.get('never-open-exceptions'),
                'enable-dep':           Settings.get('enable-dep'),
                'enable-atl-dep':       Settings.get('enable-atl-dep'),
                'show-status-text':     Settings.get('show-status-text'),
                'enable-direct-invoke': Settings.get('enable-direct-invoke'),
                'optimize-direct-invoke':Settings.get('optimize-direct-invoke'),
                'intercept-redirects':  Settings.get('intercept-redirects'),
                'favicon':              Settings.get('favicon'),
                'beforeunload':         Settings.get('beforeunload'),
                'ietab-header':         Settings.get('ietab-header'),
                'single-session':       Settings.get('single-session'),
                'shared-process':       this.useSharedProcess(),
                'ie-dialogs':           Settings.get('ie-dialogs'),
                'local-network':        Settings.get('local-network'),
                'threaded-popups':      Settings.get('threaded-popups'),  
            }
        }
        this.postHostMessage(msg);
    },

    sendHostMessage: function(msg, fnResponse) {
        HostMessaging.sendMessage(msg, fnResponse);
    },

    postHostMessage: function(msg) {
        HostMessaging.postMessage(msg);
    },

    setIncludeWithAll: function(params) {
        HostMessaging.setIncludeWithAll(params);
    },

    getIEWidth: function() {
        if (!this.useRemoteHost) {
            return Math.floor(window.innerWidth * window.devicePixelRatio);
        } else {
            return window.innerWidth;
        }
    },

    getIEHeight: function() {
        var topHeight = this.hideAddressBar ? 1 : $('#address-bar')[0].offsetHeight;

        var height = window.innerHeight - topHeight;

        if (!this.useRemoteHost) {
            return Math.floor( height * window.devicePixelRatio );
        } else {
            return height;
        }

    },

    tryAttach: function() {
        if (this.useRemoteHost) {
            this.isAttached = true;
            return;
        }

        if (this.isAttached) {
            return;
        }
        // Check whether we are the active tab
        chrome.tabs.getCurrent(function(tab) {
            // We can't attach if we don't have a window id or aren't active
            if (!tab.active || !this.windowId) {
                this.restoreTitle();
                return;
            }

            // Remember the title change is asynchronous, so don't keep changing it or the helper
            // will never find it.  We may have to retry several times to find the window after
            // a single title change
            if (document.title.indexOf('ietaba:') == -1) {
                this.realTitle = document.title;
                var r = Math.random();
                document.title = 'ietaba:' + r;
            }

            var msg = {
                type: 'ATTACH',
                tabTitle: document.title,
                innerWidth: this.getIEWidth(),
                innerHeight: this.getIEHeight(),
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                addrHeight: this.getAddrHeight()
            }
            this.postHostMessage(msg);
        }.bind(this));
    },

    cloneWindow: function(url) {
        var url = this.buildContainerUrl(url);

        // See if we should just open the pop-up in a tab.
        if (Settings.get('open-popups-in-tab')) {
            chrome.tabs.getCurrent(function(tab) {
                chrome.tabs.create({ url: url, active: true, index: tab.index+1 });
            });
            return;
        }

        // Build the window creation options
        var createOptions = { url: url };
        chrome.windows.create(createOptions);
    },

    openNewWindow: function(url, features, popupInfo, forceChrome, forceTab, fromModal) {
        // If the full-window option is on or there are no features then use a full window
        var fullWindow = Settings.get('enable-use-full-window-popups') || !features;

        var openInChrome = forceChrome;
        if (!openInChrome) {
            // If it's a popup, check whether to hide the location bar
            if (features && ( (features.indexOf('location=no')!=-1) || (features.indexOf('location=0')!=-1))) {
                popupInfo.hideAddressBar = true;
            }
            // Store the popup info so the popup can find it
            url = this.buildContainerUrl(url, popupInfo);
        }

        // See if we should just open the pop-up in a tab.
        // But never do that if a modal is active because you can't get to it!
        var openInTab = !fromModal && (forceTab || Settings.get('open-popups-in-tab'));
        if (openInTab) {
            chrome.tabs.getCurrent(function(tab) {
                chrome.tabs.create({ url: url, active: true, index: tab.index+1 });
            });
            return;
        }

        // Build the window creation options
        var createOptions = {};
        if (fullWindow) {
            createOptions = { url: url };
        } else {
            // Find the options for creating the popup window
            var arrFeatures = features.split(',');
            createOptions = {
                url: url,
                focused: true,
                type: 'popup'
            }
            for (var i=0; i < arrFeatures.length; i++) {
                var parts = arrFeatures[i].split('=');
                if (typeof(parts[1]) == 'undefined')
                    continue;
                parts[0] = parts[0] && parts[0].trim();
                parts[1] = parts[1] && parts[1].trim();

                var value = parseInt(parts[1]);
                if (isNaN(value))
                    continue;
                switch(parts[0]) {
                    case 'left':
                    case 'top':
                        createOptions[parts[0]] = value;
                        break;
                    case 'width':
                        // Pop-ups shouldn't be small, make sure it's at least 100px wide
                        createOptions.width = value + 16;
                        createOptions.width = createOptions.width < 100 ? 100 : createOptions.width;
                        break;
                    case 'height':
                        // Pop-ups shouldn't be small, make sure it's at least 100px height
                        // One reason for this is that the Siebel HI UI ActiveX controls will automatically
                        // close a small pop-up that has their controls (something like < 98 pixels high)
                        createOptions.height = value + 40;
                        if (!Settings.get('hide-addr-bar'))
                            createOptions.height += 33;
                        createOptions.height = createOptions.height < 100 ? 100 : createOptions.height;
                        break;
                }
            }
        }
        chrome.windows.create(createOptions);
    },

    setTitle: function(newTitle) {
        this.realTitle = newTitle;
        if (document.title.indexOf('ietaba:') == -1) {
            document.title = newTitle;
        }
    },

    onDisconnected: function() {
        if (window) {
            window.setTimeout(function() {
                $('#helper-disconnected').css('display', 'block');
            }, this.DISCONNECT_MESSAGE_WAIT);
        }
    },

    onScriptError: function(msg) {
        var text = '';
        if(msg['context'] == 'IEC') {
            text = msg.context + ': ' + 'Error: ' + msg['description'] + ', line: ' + msg['lineNumber'];
        } else {
            text = msg.context + ': ' + 'Error: ' + msg['errorMessage'] + '.  Source: ' + msg['errorUrl'] + ':' + msg['errorLine'];
        }
        console.error(text);
    },

    onLogMessage: function(msg) {
        var text = msg['context'] + ': ' + msg['message'];
        console.log(text);
    },

    onPostMessageToOpener: function(msg, targetOrigin) {
        if (window.opener)
            window.opener.postMessage(msg, targetOrigin);
    },

    onFirstNavIsDownload: function() {
        // When the first navigation is a download, IE Tab shows a download prompt.
        // The web page then just shows "navigation cancelled".  And what we want to
        // do is go "back" to undo the browser navigation since it didn't really navigate
        // the browser.
        // Exception for hosted scenario since we actually use our UI to display the
        // downloads
        if (this.useRemoteHost)
            return;

        if (window.history.length > 1)
            window.history.go(-1);
        else
            window.close();
    },

    resumeIdleSession: function() {
        RemoteHostProxy.call('resumeIdleSession');
    },

    cancelIdleWarning: function() {
        if (this._idIdleWarningTimer) {
            window.clearInterval(this._idIdleWarningTimer);
            this._idIdleWarningTimer = 0;
        }
        $('#idle-warning').css('display', 'none');
    },

    showDialog: function(idDialog) {
        // Hide all dialogs
        this.hideDialogs();
        // And the progress indicator
        this.stopLoadingIndicator();
        // And show just the one
        $('#' + idDialog).css('display', 'flex');
    },

    hideDialogs: function() {
        $('.dialog-container').css('display', 'none');
    },

    showIdleWarning: function(timeRemaining) {
        timeRemaining = parseInt(timeRemaining);
        timeRemaining = Math.max(timeRemaining, 0);
        $('#idle-expire-seconds').text(timeRemaining);
        this.showDialog('idle-warning');
        this._idleRemaining = timeRemaining;
        if (!this._idIdleWarningTimer) {
            this._idIdleWarningTimer = window.setInterval(function() {
                RemoteHostProxy.call('getConnected', null, (connected) => {
                    if (!connected) {
                        this.cancelIdleWarning();
                    } else {
                        this.showIdleWarning(this._idleRemaining - 1);
                    }
                })
            }.bind(this), 1000);
        }
    },

    showSessionTimeout: function() {
        this.cancelIdleWarning();
        this.showDialog('session-timeout');
    },

    onNetworkClosed: function() {
        console.log('onNetworkClosed');
        IEContainer.showDialog('connection-lost');
    },

    onDNSFailure: function(url) {
        if (!this.useRemoteHost)
            return;

        var req = new XMLHttpRequest();
        req.open('GET', url);
        req.onreadystatechange = function() {
            if (req.readyState == 4) {
                if (req.status != 0) {
                    // Looks like this server is available locally, give them that message
                    var hostUrl = this.getHostWildcardUrl();
                    $('#local-single-url').text(hostUrl);
                    this.showDialog('intranet-url');
                }
            }
        }.bind(this);
        req.send();
    },

    preTranslateHostMessage: function(msg) {
        switch (msg.type) {
            case 'NETWORK_CLOSED':
                this.onNetworkClosed();
                return true;
            case 'DNS_FAILURE':
                this.onDNSFailure(msg.url);
                return true;
            case 'CLIPBOARD_REMOTE_COPY':
                this.onClipboardCopy(msg.text);
                return true;
            }
        return false;
    },

    remoteHostNavComplete: function() {
        // We do periodic fullscreen updates after
        // input action, but that means a screen with no input
        // will stay fuzzy.  So we do a few fullscreen / 100% quality
        // updates right after navigate complete.
        if (!this.useRemoteHost)
            return;

        this.fsUpdates = 0;
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
        }
        this.intervalId = window.setInterval(function() {
            RemoteHostProxy.call('sendFullScreenUpdate');
            this.fsUpdates++;
            if (this.fsUpdates >= 3)
            {
                window.clearInterval(this.intervalId);
            }
        }.bind(this), 1500);
    },

    readUploadFile: function(msg, file, countWhenFinished) {
        var newFile = {};
        newFile.name = file.name;
        var reader = new FileReader();
        reader.onload = function() {
            newFile.content = base64ArrayBuffer(reader.result);
            var nLen = msg.files.push(newFile);
            if (nLen == countWhenFinished) {
                this.postHostMessage(msg);
                this.hideDialogs();
            }
        }.bind(this);
        reader.readAsArrayBuffer(file);
    },

    onUploadFile: function(evt) {
        var files = evt.target.files;
        if (files.length == 0) {
            this.onUploadCancel();
            return;
        }

        // First check whether they are exceeding the maximum file size allowed
        var i;
        var totalSize = 0;
        for (i=0; i<files.length; i++) {
            totalSize += files[i].size;
            if (totalSize > 45000000) {
                alert('You have exceeded the maximum file upload size allowed for your account (40MB)');
                this.onUploadCancel();
                return;
            }
        }

        this.showDialog('upload-progress');
        var msg = { type: 'OPENFILE_COMPLETE' };
        msg.files = [];
        for (i=0; i<files.length; i++) {
            this.readUploadFile(msg, files[i], files.length);
        }
    },

    onUploadCancel: function() {
        var msg = { type: 'OPENFILE_CANCEL' };
        this.postHostMessage(msg);
        this.hideDialogs();
    },

    onOpenFile: function(msg) {
        if (!this.openFileInitialized) {
            this.openFileInitialized = true;
            $('#upload-browse').click(function() {
                $('#upload-file').click();
            }.bind(this));
            $('#upload-file').change(function(evt) {
                this.onUploadFile(evt);
            }.bind(this));
            $('#upload-cancel').click(function() {
                this.onUploadCancel();
            }.bind(this));
        }
        if (msg.multi)
        {
            $('#upload-file').attr('multiple', '');
        }
        else
        {
            $('#upload-file').removeAttr('multiple');
        }
        this.showDialog('upload-message');
    },

    onDoSaveFile: function(msg) {
        var fileName = $('#save-file').val();
        if (fileName) {
            fileName = fileName.trim();
        }
        if (fileName) {
            // If they enter c:\dir\file.txt or /something/file.txt, just ignore
            // everything but the file.txt part
            var regex = /[^\/\\:]*$/;
            var match = fileName.match(regex);
            if (match) {
                fileName = match[0];
                fileName = fileName.trim();
            } else {
                fileName = '';
            }
        }
        // Check for the extension
        if (msg.defaultExt && fileName && !fileName.match(/\./)) {
            fileName = fileName + '.' + msg.defaultExt;
        }

        if (!fileName) {
            $('#save-file').val('');
            $('#save-file').fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
            $('#save-file').focus();
        } else {
            // We have a valid file name, first switch UI to download mode
            $('#download-prompt').css('display', 'block');
            $('#save-file-prompt').css('display', 'none');
            $('#btn-save-file').css('display', 'none');

            // And download the file
            var msgDownload = {
                type: 'DOWNLOAD_FILE',
                filePath: msg.realFile,
                targetFile: fileName
            }
            this.postHostMessage(msgDownload);
        }
    },

    updateSaveFileSize: function(filePath) {
        var msg = {
            type: 'PING_FILESIZE',
            filePath: filePath
        }
        this.postHostMessage(msg);
    },

    onFileSizeResult: function(msg) {
        if ($('#file-save-bytes').is(':visible')) {
            var size = Utils.numberWithCommas(msg['size']);
            $('#file-save-bytes').text(size);
            window.setTimeout(function() {
                this.updateSaveFileSize(msg['filePath']);
            }.bind(this), 2000);
        }
    },

    isSavePromptActive: function() {
        return ($('#save-file-prompt').css('display') == 'block');
    },

    onSaveFilePrompt: function(msg) {
        this.saveFileMsg = msg;
        if (!this.saveFileInitialized) {
            this.saveFileInitialized = true;
            $('#btn-save-file').click(function() {
                this.onDoSaveFile(this.saveFileMsg);
            }.bind(this));
            $('#save-file').keypress(function(e) {
                if(e.which == 13) {
                    this.onDoSaveFile(this.saveFileMsg);
                }
            }.bind(this));
            $('#btn-save-cancel').click(function() {
                this.hideDialogs();
            }.bind(this));
            $('#upload-browse').click(function() {
                $('#upload-file').click();
            }.bind(this));
            $('#upload-file').change(function(evt) {
                this.onUploadFile(evt);
            }.bind(this));
            $('#upload-cancel').click(function() {
                this.onUploadCancel();
            }.bind(this));
        }
        // Make sure the dialog is in save mode and not download mode
        $('#download-prompt').css('display', 'none');
        $('#save-file-prompt').css('display', 'block');
        $('#btn-save-file').css('display', 'inline');
        // Prepare the inputs
        $('#save-file').val(msg.defaultFile || '');
        $('#save-file-ext').text(msg.defaultExt ? '(.' + msg.defaultExt + ')' : '');
        $('#file-save-bytes').text('0');
        window.setTimeout(function() {
            $('#save-file').focus();
        }, 100);
        // Prepare the file size counter
        window.setTimeout(function() {
            this.updateSaveFileSize(msg['realFile']);
        }.bind(this), 1000);

        this.showDialog('save-file-message');
    },

    onDownloading: function(msg) {
        if (!this.downloadingInitialized) {
            this.downloadingInitialized = true;
            $('#downloading-cancel').click(function() {
                this.hideDialogs();
            }).bind(this);
        }
        this.showDialog('downloading-message');
    },

    onDownloadComplete: function(msg) {
        var dataChars = window.atob(msg['data']);
        var arrCharCodes = new Array(dataChars.length);
        for(var i = 0; i < dataChars.length; i++) {
            arrCharCodes[i] = dataChars.charCodeAt(i);
        }
        // Convert that to a real typed array
        var byteArray = new Uint8Array(arrCharCodes);
        // And then a blog
        var blob = new Blob([byteArray], { type: 'application/octet-stream' })
        // And a corresponding URL object for download
        var url = URL.createObjectURL(blob);

        // Now create an anchor element to initiate a download
        var anchor = document.createElement('a')
        document.body.appendChild(anchor)
        anchor.style.display="none"
        anchor.href=url;
        anchor.download = msg["targetFile"];
        anchor.click();

        // And cancel the dialog
        this.hideDialogs();
    },

    onDownloadLocal: function(msg) {
        Background.addForceLocal(msg.url);
        var anchor = document.createElement('a');
        document.body.appendChild(anchor);
        anchor.style.display = 'none';
        anchor.href = msg.url;
        anchor.target = '_blank';
        anchor.click();
    },

    onPromptActiveXInstall: function(url) {
        // Note: Currently only happens on hosted
        $('#prompt-activex').slideDown(100);
        $('#prompt-activex a').text('This website wants to install an ActiveX control, if you trust the website to install add-ons, click here...');
    },

    onActiveXFailed(url) {
        $('#prompt-activex a').text('Some ActiveX controls failed to install or are not yet supported.  Click to try again...');
        $('#prompt-activex').slideDown(100);
    },

    onActiveXInstallFinished: function(didInstallOne) {
        $('#prompt-activex a').text('Done!  Reloading...');
        window.setTimeout(function() {
            window.location.reload(true);
        }.bind(this), 1500);
    },

    onPushState: function(state, title, url) {
        if (this.useRemoteHost) {
            if (history.state && history.state.placeholder) {
                history.replaceState(state, title, url);
                this.pushStatePlaceholderActive = false;
            } else {
                history.pushState(state, title, url);
            }
            return;
        }

        // Local host
        if (Utils.dotVersionCompare(oldStorage['helper-version'], '12.6.13.1') > 0) {
            // Workaround for Chrome disabling pushState unless there are user actions
            var msg = {
                type: 'PUSH_STATE',
                state: state,
                title: title,
                url: url
            }
            this.nextPushState = msg;
            this.postHostMessage(msg);
        } else {
            // Regular pushState
            history.pushState(state, title, url);
        }
    },

    onForceChromeActivation: function() {
        if (this.didActivatePage)
            return;

        var msg = {
            type: 'FORCE_CHROME_ACTIVATE'
        }
        window.setTimeout(function() {
            this.sendHostMessage(msg, function(msgResponse) {
                this.didActivatePage = msgResponse.activated;
            }.bind(this));
        }.bind(this), this.FORCE_ACTIVATE_DELAY);
    },

    onDocumentClicked: function() {
        // The only thing we use a click for currently is to fake a user gesture so we can
        // manipulate the history with pushState
        if (this.nextPushState) {
            history.pushState(this.nextPushState.state, this.nextPushState.title, this.nextPushState.url);
            this.nextPushState = null;
            this.updateAddressBar();
        }
    },

    onCanvasClicked: function() {
        // The purpose of this is to implement BACK/FWD functionality.  We can only
        // pushState in response to a click, so we pushState a placeholder when
        // mousedown is pushed.  Then if a navigation happens in the WebBrowser control
        // we can just replaceState that entry.  Otherwise we can't add an entry.
        if (!history.state || !history.state.placeholder)
            history.pushState({ placeholder: true }, document.title, document.URL);
        this.pushStatePlaceholderActive = true;
    },

    onClipboardCopy: function(text) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs && (tabs.length == 1) && (tabs[0].id == this.tabId)) {
                text = unescape(text);
                navigator.clipboard.writeText(text);
            }
        }.bind(this))
    },

    onSetUnloadPrompt: function(enabled) {
        this.forceBeforeUnload = enabled;
    },

    onWindowClosing: function() {
        // Some popups print then close the window.  Since hosted print is asynchronous with a file
        // save, we want to not close until the print is done.
        if (this.popupInfo && this.isSavePromptActive()) {
            // First, hide it because we are closing
            $('#save-file-prompt').css('display', 'none');

            // Then send a message to the opening window to save the file
            var parentMsg = {
                type: 'POPUP_SAVE_FILE',
                saveFileMsg: this.saveFileMsg
            }
            chrome.tabs.sendMessage(this.openerId, parentMsg);
            // Give some time for the message to arrive at the parent window then close
            window.setTimeout(function() {
                window.close();
            }.bind(this), 500);
        } else {
            // I'm not sure when we started using this 300ms timeout, unfortunately it's not commented.
            // But we'll just leave it for now, assuming there was a reason
             window.setTimeout(function() {
                window.close();
            }, 300)
        }
    },

    onHostMessage: function(msg, fnResponse) {
        // Only handle messages from our host window
        if (msg.hostWindowId && (msg.hostWindowId != this.hostWindowId)) {
            return;
        }

        switch(msg.type) {
            case 'TITLE_CHANGE':
                this.setTitle(msg.newTitle);
                break;
            case 'NAVIGATE_COMPLETE':
                if (this.replaceNextNav) {
                    history.replaceState({ page: this.currentPage, historyId: this.historyId }, "", this.buildContainerUrl(msg.url));
                    this.updateAddressBar(msg.url);
                } else {
                    this.currentPage = this.nextPageId++;
                    this.onPushState({ page: this.currentPage, historyId: this.historyId }, "", this.buildContainerUrl(msg.url));
                    // Explicitly supply the URL to the address bar because onPushState is async and so it
                    // doesn't have the right URL yet
                    this.updateAddressBar(msg.url);
                }
                this.replaceNextNav = false;
                this.remoteHostNavComplete();
                break;
            case 'FRAME_NAVIGATE_COMPLETE':
                // Always ignore a frame's first navigation which happens when the page is loaded, so it doesn't actually
                // contribute as a navigation in the history
                if (msg.firstNav)
                    break;

                if (this.replaceNextNav) {
                    history.replaceState({ page: this.currentPage, historyId: this.historyId }, "", "");
                } else {
                    // This is a new navigation in a frame which means the WB control can go "Back", so we add
                    // a new entry to the Chrome history.
                    this.currentPage = this.nextPageId++;
                    this.onPushState({ page: this.currentPage, historyId: this.historyId }, "", "");
                }
                this.replaceNextNav = false;
                break;
            case 'NEW_WINDOW':
                this.openNewWindow(msg.url, msg.features, { hostName: this.hostName, helperId: msg.helperId, hostWindowId: msg.popupHostWindowId, openerId: this.tabId }, msg.forceChrome, msg.forceTab, msg.fromModal);
                break;
            case 'CLONE_WINDOW':
                this.cloneWindow(msg.url);
                break;
            case 'RETURN_TO_CHROME':
                window.top.location = msg.url;
                break;
            case 'WINDOW_CLOSING':
                this.onWindowClosing();
                break;
            case 'BEFORENAVIGATE2':
                this.showLoadingFavicon();
                break;
            case 'CMDLINE':
                console.log('CMDLINE = ' + msg.value);
                break;
            case 'ATTACH_SUCCESS':
                this.isAttached = true;
                this.restoreTitle();
                this.removePopupInfoFromAddress(msg.url, msg.title);
                break;
            case 'ATTACH_FAILED_METRO':
            case 'ATTACH_RETRY':
                window.setTimeout(function() {
                    this.tryAttach();
                }.bind(this), this.ATTACH_RETRY_TIMEOUT);
                break;
            case 'ATTACH_FAILED_CLOSED':
                if(this.popupInfo) {
                    // The popup host window may close itself before we attach, in which case we need
                    // to close this popup.
                    window.close();
                }
                break;
            case '_DISCONNECTED':
                this.onDisconnected();
                break;
            case 'SEND_MESSAGE':
                chrome.runtime.sendMessage(msg.extensionId, JSON.parse(msg.message));
                break;
            case 'SCRIPT_ERROR':
                this.onScriptError(msg);
                break;
            case 'LOG_MESSAGE':
                this.onLogMessage(msg);
                break;
            case 'FAVICON_CHANGED':
                this.updateFavicon(msg.newFavicon);
                break;
            case 'UPDATE_BEFOREUNLOAD':
                this.beforeUnloadActive = msg.active;
                break;
            case 'POSTMESSAGE_TO_OPENER':
                this.onPostMessageToOpener(msg.msg, msg.targetOrigin);
                break;
            case 'NO_BACK':
                history.back();
                break;
            case 'FIRSTNAV_IS_DOWNLOAD':
                this.onFirstNavIsDownload();
                break;
            case 'IDLE_WARNING':
                this.showIdleWarning(msg.timeRemaining);
                break;
            case 'CANCEL_IDLE_WARNING':
                this.cancelIdleWarning();
                break;
            case 'SESSION_TIMEOUT':
                this.showSessionTimeout();
                break;
            case 'OPEN_FILE':
                this.onOpenFile(msg);
                break;
            case 'SAVE_FILE':
                this.onSaveFilePrompt(msg);
                break;
            case 'DOWNLOAD_COMPLETE':
                this.onDownloadComplete(msg);
                break;
            case 'DOWNLOADING':
                this.onDownloading(msg);
                break;
            case 'DOWNLOAD_LOCAL':
                this.onDownloadLocal(msg);
                break;
            case 'FILESIZE_RESULT':
                this.onFileSizeResult(msg);
                break;
            case 'PROMPT_ACTIVEX_INSTALL':
                this.onPromptActiveXInstall(msg.url);
                break;
            case 'ACTIVEX_INSTALL_FINISHED':
                this.onActiveXInstallFinished(msg.installedOne);
                break;
            case 'ACTIVEX_INSTALL_FAILED':
                this.onActiveXFailed(msg.url);
                break;
            case 'SET_UNLOAD_PROMPT':
                this.onSetUnloadPrompt(msg.enabled);
                break;
        }
    },

    initHostWindow: function(fnContinue) {
        // If we have popup info, then we already have a host window
        if (this.popupInfo) {
            this.hostName = this.popupInfo.hostName;
            this.hostWindowId = this.popupInfo.hostWindowId;
            this.openerId = this.popupInfo.openerId;
            this.setIncludeWithAll({ hostWindowId: this.hostWindowId });
            fnContinue();
            return;
        }

        // Create a new host window.  It will initially be invisible.
        var anchorColor = this.hideAddressBar ? [ 0xad, 0xae, 0xad ] : [ 0x6b, 0x92, 0xe7 ];
        var msgCreate = {
            type: 'CREATE',
            anchorColor: anchorColor,
            startWidth: this.getIEWidth(),
            startHeight: this.getIEHeight()
        }
        // Get the perUrlMode if there is one
        var url = this.extractChildUrl();
        var perUrlMode = Settings.getPerUrlMode(url);
        if (perUrlMode)
            msgCreate.perUrlMode = perUrlMode;
        if (this.useRemoteHost) {
            msgCreate.globalCompatMode = Settings.getCompatModeInt();
        }
         
        if (Settings.get('local-network') || Settings.URLhasFilterOption(url, 'local')) {
            msgCreate.useProxy = 1;
            this.usingHostProxy = true;
        }
        

        this.sendHostMessage(msgCreate, function(msgResult) {
            if (msgResult.type == 'CREATE_SUCCESS') {
                this.hostWindowId = msgResult.hostWindowId;
                this.setIncludeWithAll({ hostWindowId: this.hostWindowId });
                fnContinue();
            } else {
                // Treat this like we were disconnected.
                this.onDisconnected();
            }
        }.bind(this));
    },

    sendCookies: function(url, fnFinished) {
        // Send Chrome-sync'd cookies
        if (!Settings.get('cookie-sync')) {
            fnFinished();
            return;
        }
        chrome.cookies.getAll({ url: url }, function(cookies) {
            var cookieStrings = [];
            if (!cookies) {
                fnFinished();
                return;
            }
            for (var i=0; i<cookies.length; i++) {
                var cookie = cookies[i];
                var str = cookie.name + '=' + cookie.value + '; path=' + cookie.path + '; domain=' + cookie.domain;
                if (!cookie.session && (typeof(cookie.expirationDate) != 'undefined')) {
                    var strDate = new Date(cookie.expirationDate * 1000);
                    str += '; expires=' + strDate.toUTCString();
                }
                if (cookie.httpOnly) {
                    str += '; httpOnly';
                }
                if (cookie.secure) {
                    str += '; secure';
                }
                cookieStrings.push(str);
            }

            var msgCookies = {
                type: 'COOKIES',
                url: url,
                cookies: cookieStrings
            }

            this.sendHostMessage(msgCookies);
            fnFinished();
        }.bind(this));
    },

    tryHostForward: function() {
        this.replaceNextNav = true;
        this.sendHostMessage({ type: 'TRY_FORWARD' });
    },

    tryHostBack: function() {
        this.replaceNextNav = true;
        this.sendHostMessage({ type: 'TRY_BACK' });
    },

    onActivated: function () {
        if (this.myrtilleDisplay) {
            RemoteHostProxy.call('setActiveTab', this.tabId);
        }
        this.postHostMessage({ type: 'TABACTIVATED' });
        this.handleResize();
    },

    onDeactivated: function () {
        this.postHostMessage({ type: 'TABDEACTIVATED' });
    },

    startLoadingIndicator: function() {
        window.setTimeout(function() {
            if (!this._stopLoadingIndicator) {
                $('#loading-progress').css('display', 'inline-block');
            }
        }.bind(this), 1500);
    },

    stopLoadingIndicator: function() {
        this._stopLoadingIndicator = true;
        $('#loading-progress').css('display', 'none');
    },

    startMyrtille: function () {
        if (!this.useRemoteHost)
            return;

        try {
            // Set the displayDiv before initializing the display.
            RemoteHostProxy.call('setActiveTab', this.tabId);
            document.getElementById('display-div').style.display = 'block';

            // Create the new display object
            // this.myrtilleDisplay = new Display(RemoteHostManager.config, RemoteHostManager.dialog);

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
            var displayWidth = window.screen.availWidth;
            var displayHeight = window.screen.availHeight;

            var config = new Config(httpServerUrl, statEnabled, debugEnabled, compatibilityMode, browserResize,  displayWidth, displayHeight, 'RDP', false);
                this.myrtilleDisplay = new Display(config, DummyDialog);
            RemoteHostProxy.call('setActiveTab', this.tabId);
            this.myrtilleDisplay.init();
            // The network will call us back on this when the connection is complete.
            this.myrtilleDisplay.initUser = function (network) {
                var user = new User(config, DummyDialog, this.myrtilleDisplay, NetworkProxy);
                user.init();
            }.bind(this);

            chrome.runtime.onMessage.addListener( (msg, sender, fnResponse) => {
                if (msg.type == 'RH_ADDIMAGE') {
                    // Custom parser for imgData
                    var imgData = Utils.JsonToUint8Array(msg.imgData);
                    // Special-case mouse cursor comes in as a base64 string, not just image data
                    if (msg.format == 'cur') {
                        imgData = Utils.Uint8ArrayToBase64(imgData);
                    }
                    this.myrtilleDisplay.addImage(msg.idx, msg.posX, msg.posY, msg.width, msg.height, msg.format, msg.quality, msg.fullscreen, imgData);
                } else if (msg.type == 'RH_INITUSER') {
                    this.myrtilleDisplay.initUser();                }
            });
        }
        catch (exc) {
            console.log('failed to start myrtille: ' + exc.message);
        }
    },

    initIdleHandler: function() {
        // Idle UI handlers
        $('#resume-idle-session').click(function() {
            this.resumeIdleSession();
        }.bind(this));

        // Notify the remote host manager that we have input
        $(document).ready(function() {
            var displayDiv = document.getElementById('display-div');
            displayDiv.addEventListener('keydown', function() {
                RemoteHostProxy.call('updateLastInputTime');
            }, true);
            displayDiv.addEventListener('mousemove', function() {
                RemoteHostProxy.call('updateLastInputTime');
            }, true);
        });

        // This page was just loaded, send fake input to reset the idle state
        RemoteHostProxy.call('fakeInputAction');
    },

    checkShowTrialMessage: function() {
        RemoteHostProxy.getProp('_userInfo.InTrial', (inTrial) => {
            if (inTrial) {
                this.initTrial();
            }
        });
    },

    initTrial: function() {
        var lastShown = IETAB.Storage.get('last-shown-trial-message');
        var date = new Date().toLocaleDateString();
        BackgroundProxy.getProp('isFirstRun', (isFirstRun) => {
            if (isFirstRun) {
                // Don't show it to users on their very first day!
                IETAB.Storage.set('last-shown-trial-message', date);
                return;
            }
    
            // But do show it every day after that.
            if (date != lastShown) {
                this.showDialog('trial-message');
                var theInterval = window.setInterval(function() {
                    var n = parseInt($('#wait-time').text());
                    n--;
                    if (n==0) {
                        $('#resume-button').removeAttr('disabled');
                        $('#resume-button').text('Resume');
                        $('#resume-button').addClass('default-button');
                        IETAB.Storage.set('last-shown-trial-message', date);
                    } else {
                        $('#wait-time').text(n);
                    }
                }, 1000);
            }
        });
    },

    checkShowWindowsTrial: function(fnContinue) {
        var key = Settings.get('license-key');
        if (key) {
            fnContinue();
            return;
        }

        // We only enforce the license requirement for new installs after 1/18/23
        var jan18 = 1674085829591;
        var firstSeen = IETAB.Storage.get('firstSeen');
        if (firstSeen < jan18) {
            fnContinue();
            return;
        }

        var lastShown = IETAB.Storage.get('last-shown-trial-message');
        var date = new Date();
        var dateStr = date.toLocaleDateString();
        var age = date - firstSeen;
        age = age / 1000;  // Convert to seconds
        // Check whether we are more than two weeks old
        if (age > 3600*24*14) {
            // Trial expired!
            this.showDialog('windows-trial-expired');
            return;
        }
        

        // Show the warning once per day 
        if (dateStr != lastShown) {
            IETAB.Storage.set('last-shown-trial-message', dateStr);
            $('#trial-continue').click(function() {
                $('#windows-trial-message').css('display', 'none');
                fnContinue();
            });
            var options = { day: 'numeric', month: 'long', year: 'numeric' };
            var expireDate = new Date(firstSeen + 3600*24*14*1000);
            var expireText = expireDate.toLocaleDateString('default', options);
            $('#license-expiration-date').text(expireText);
            this.showDialog('windows-trial-message');

        } else {
            fnContinue();
        }
    },

    finalInitRemoteHost: function () {
        this.stopLoadingIndicator();

        this.checkShowTrialMessage();

        if (this.popupInfo) {
            HostMessaging.setHelperInfo(this.popupInfo.helperId, this.popupInfo.hostWindowId);
        }

        // Listen for activation changes which the helpers use to hide/show the host window
        //  1. Activate if:
        //       * We get onActivated for this tab.
        //       * Our window gets focus and we are the active tab.
        //  2. De-activate if:
        //       * onActivated activates a different tab but in our window
        //       * Our window loses focus
        //
        chrome.tabs.onActivated.addListener(function (activeInfo) {
            if (activeInfo.tabId == this.tabId) {
                this.onActivated();
            } else {
                if (activeInfo.windowId == this.windowId) {
                    this.onDeactivated();
                }
            }
        }.bind(this));

        chrome.windows.onFocusChanged.addListener(function (windowId) {
            if (windowId == this.windowId) {
                chrome.tabs.getCurrent(function (tab) {
                    if (tab.active) {
                        this.onActivated();
                    }
                }.bind(this));
            } else {
                this.onDeactivated();
            }
        }.bind(this));

        chrome.tabs.onAttached.addListener(function (tabId, attachInfo) {
            if (tabId == this.tabId) {
                this.windowId = attachInfo.newWindowId;
            }
        }.bind(this));

        // If this is the active tab, then activate the host window
        chrome.tabs.getCurrent(function (tab) {
            if (tab.active) {
                this.onActivated();
            }
        }.bind(this));

        var displayDiv = document.getElementById('display-div');
        displayDiv.addEventListener('mousedown', function() {
            this.onCanvasClicked();
        }.bind(this), true);

        this.initIdleHandler();
    },

    finalInitLocalHost: function() {
        // Listen for activation changes which the helpers uses to hide/show the host window
        chrome.tabs.onActivated.addListener(function(activeInfo) {
            if (activeInfo.windowId != this.windowId) {
                return;
            }

            if (activeInfo.tabId != this.tabId) {
                this.postHostMessage({ type: 'TABDEACTIVATED' });
            } else {
                this.onForceChromeActivation();
                this.postHostMessage({ type: 'TABACTIVATED' });
                if (!this.isAttached) {
                    // We have to attach first
                    this.tryAttach();
                }
            }
        }.bind(this));

        // We also need to force the chrome window to be user-activated so we can
        // use pushState  to work around the history manipulation intervention.
        // See the BACK/FWD design document for details
        this.onForceChromeActivation();
        chrome.windows.onFocusChanged.addListener(function (windowId) {
            if (windowId == this.windowId) {
                this.onForceChromeActivation();
            }
        }.bind(this));

        // Tell the helper when we are detached so it can hide the window
        chrome.tabs.onDetached.addListener(function(tabId, detachInfo) {
            if (tabId != this.tabId) {
                return;
            }
            this.windowId = null;
            this.isAttached = false;
            console.log("Detached");
            this.postHostMessage({ type: 'DETACH' });
        }.bind(this));

        // Tell the helper to re-attach to the new tab
        chrome.tabs.onAttached.addListener(function(tabId, attachInfo) {
            if (tabId != this.tabId) {
                return;
            }
            this.windowId = attachInfo.newWindowId;
            console.log('onAttached: ' + tabId);
            this.tryAttach();
        }.bind(this));

        document.addEventListener('mouseup', function() {
            this.onDocumentClicked();
        }.bind(this), false);

        // Attach the host control to this window
        this.tryAttach();
    },

    finalInit: function() {
        // Supply the options
        this.sendOptions();

        // Listen for host messages
        HostMessaging.addListener(function(msg, fnResponse) {
            this.onHostMessage(msg, fnResponse);
        }.bind(this));

        if (this.useRemoteHost) {
            this.finalInitRemoteHost();
        } else {
            this.finalInitLocalHost();
        }

        window.onresize = this.handleResize.bind(this);
        this.handleResize();

        // Handle focus change like resize.  We need this to fix the Z-Order on window restore, otherwise
        // the IE Tab window will end up behind the hidden hack RenderWidgetHostHWND and will be inactive.
        window.addEventListener('focus', function() {
            this.handleResize();
        }.bind(this), false);

        // Trap certain control keys to forward to the IE Tab host window

        // For some reason, right-alt results in ctrlKey == true on Polish keyboards
        // and they really need right-alt for special letters.  So w eexplicitly
        // check for altKey false
        window.addEventListener('keydown',function (e) {
            if ((e.keyCode == 114) || (e.ctrlKey && !e.altKey && e.keyCode === 70)) {   // F3 or Ctrl+F
                e.preventDefault();
                this.sendHostMessage({ type: 'SHOW_FIND' });
            } else if (e.ctrlKey && !e.altKey && ((e.keyCode == 187) || (e.keyCode == 107))) { // Ctrl+
                this.sendHostMessage({ type: 'ZOOM', value: 1 });
                e.preventDefault();
            } else if (e.ctrlKey && !e.altKey && ((e.keyCode == 189) || (e.keyCode == 109))) { // Ctrl-
                this.sendHostMessage({ type: 'ZOOM', value: -1 });
                e.preventDefault();
            } else if (e.ctrlKey && !e.altKey && (e.keyCode == 48)) { // Ctrl 0
                e.preventDefault();
                this.sendHostMessage({ type: 'ZOOM', value: 0 });
            } else  if (e.ctrlKey && !e.altKey && (e.keyCode == 83 )) { // Ctrl+S
                e.preventDefault();
                this.sendHostMessage({ type: 'SAVE_AS' });
           }

        }.bind(this));

        this.updateAddressBar();

        // History tracking help
        $(window).on( "popstate", function(event) {
            var state = event.originalEvent.state;

            // We may have pushed a pushState placeholder that was never used, if so
            // then just ignore this entry and go back one more
            if (this.pushStatePlaceholderActive) {
                this.pushStatePlaceholderActive = false;
                history.back();
                return;
            }

            if (!state || !this.helperSupportsHistory) {
                // No state, that means they navigated with a bookmark or entry in the address bar, so just
                // replace the state with our history info and  navigate the host
                this.currentPage = this.nextPageId++;
                history.replaceState({ page: this.currentPage, historyId: this.historyId }, "", "");
                this.navigateHost();
                return;
            }

            if (state.historyId != this.historyId) {
                // We popped a state from another instance of the WebBrowser control, so we
                // can't do a back or forward operation, just navigate the URL.
                // Also note that this invalidates our history tracking because we are adding a forward
                // entry to the WB control, but this could very well be from a Chrome back operation in Chrome.
                // So we reset the historyId to start over.
                this.historyId = this.getNewHistoryId();
                this.currentPage = this.nextPageId++;
                this.navigateHost();
            } else {
                // We popped a state that is form this instance of the WB control.   See if it is a FWD or BACK
                // and if so, use the WB control to perform the FWD or BACK, which enables us to capture and
                // use FWD/BACK for frame navigations.
                if(state.page < this.currentPage) {
                    this.currentPage = state.page;
                    this.tryHostBack();
                } else if (state.page > this.currentPage) {
                    this.currentPage = state.page;
                    this.tryHostForward();
                }
            }
        }.bind(this));

        if (!this.isPopup()) {
            this.currentPage = this.nextPageId++;
            history.replaceState({ page: this.currentPage, historyId: this.historyId }, "", "");
            this.navigateHost();
        }

        this.initDebugSupport();

        this.postHostMessage({ type: 'FINALINIT_DONE' });
    },

    initCurrentTab: function(fnContinue) {
        chrome.tabs.getCurrent(function(tab) {
            this.tabId = tab.id;
            this.windowId = tab.windowId;
            fnContinue();
        }.bind(this));
    },

    initHost: function (fnContinue) {
        var childUrl = this.extractChildUrl();
        // Init remote host (called for all, but only does work if we are actually using a remote host)
        this.initRemoteHost(function () {
            HostMessaging.connect(this.getHostName(), function (result) {
                console.log('connect result = ' + result);
                if (result == 'OK') {
                    fnContinue();
                } else if (!this.useRemoteHost) {
                    var chromeVersion = { major: parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10) };
                    var infoUrl = '/nativehostrequired.html#url=' + childUrl;
                    if (chromeVersion.major < 34) {
                        infoUrl = '/nativehostrequired_msi.html#url=' + childUrl;
                    }
                    window.top.location = infoUrl;
                } else {
                    // Using remote host
                    if (result == 'UNAUTHORIZED') {
                        chrome.cookies.set({
                            url: Settings.get('website'),
                            domain: 'ietab.net',
                            name: 'postloginietaburl',
                            path: '/',
                            value: encodeURIComponent(childUrl)
                        }, function () {
                            window.location.href = Settings.get('website') + '/login';
                        });
                    } else {
                        // Remote host solution.  Connection failed.  For now just tell them!
                        var el;
                        el = document.getElementById('connection-lost-reason');
                        el.style.display = 'block';
                        el.innerText = 'Reason: ' + result;
                        this.showDialog('connection-lost');
                        console.log('failed to connect');
                    }
                }
            }.bind(this));
        }.bind(this));
    },

    getPopupInfo: function() {
        var regex = /[^#]*#p=([^&]*)/;
        var match = document.location.href.match(regex);
        if (!match)
            return null;

        var info = null;
        try {
            info = JSON.parse(decodeURIComponent(match[1]));
        } catch(ex) {}

        return info;
    },

    isPopup: function() {
        return !!this.getPopupInfo();
    },

    //
    // We have to wait for information about this popup from our Creator.  Tab is Great!
    //
    popupInit: function(fnCallback) {
        this.popupInfo = this.getPopupInfo();

        // Now we know whether the popup demands an address bar, also check the setting
        this.hideAddressBar = this.hideAddressBar || Settings.get('hide-addr-bar');
        // Hide the address bar before we do other initialization to avoid flicker
        if (this.hideAddressBar) {
            $('#address-bar').css('display', 'none');
            $('#no-address-bar-anchor').css('display', 'block');
        }

        fnCallback();
    },

    isPlatformSupported: function() {
        return (window.navigator.platform.toLowerCase().indexOf('win') == 0);
    },

    dealWithUnsupportedPlatform: function() {
        var url = 'http://www.ietab.net/notsupported';
        // Uninstall if it is less than 10 minutes old.  This takes care of uninstalling for recent
        // installs, but it doesn't uninstall for users who may inadvertently click the button
        // while on an unsupported platform (which uninstalls across all sync'd devices).
        var firstSeen = IETAB.Storage.get("firstSeen");
        if (firstSeen) {
            var age = (new Date()).getTime() - firstSeen;
            age = age / (1000 * 60);
            if (age < 10) {
                chrome.management.uninstallSelf();
                url += '?uninstalled=1';
            }
        }
        window.top.location = url;
    },

    getDayString: function(time) {
        var date = new Date(time);
        return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
    },

    refreshLicenseStatus: function(fnShouldContinue) {
        BackgroundProxy.call('licensePing');

        // Show the "Checking..." message
        $('body').append(`
        <div id="checking-message" style="">
            Checking license status...
        </div>
        `);


        // Set a timeout to refresh the page after 3 seconds
        setTimeout(() => {
            $('#checking-message').remove(); // Remove the "Checking..." message

            if (IETAB.Storage.get('licenseCancelled')) {
                $('#notice-expired').css('display', 'block');
                fnShouldContinue(false);
            } else {
                this.continueCheckingExpiration(fnShouldContinue);
            }
        }, 3000);
    },

    continueCheckingExpiration: function(fnShouldContinue) {
        // Is their license expiring?
        var licenseExpiration = Settings.get('license-expiration');
        if (!licenseExpiration) {
            fnShouldContinue(true);
            return;
        }
        var now = Date.now();
        if (licenseExpiration > now) {
            fnShouldContinue(true);
            return;
        }

        // Only warn them about expiration once per day
        var lastShown = IETAB.Storage.get('last-shown-expiring-message');
        var date = new Date().toLocaleDateString();
        if (date == lastShown) {
            fnShouldContinue(true);
            return;
        }
        IETAB.Storage.set('last-shown-expiring-message', date);

        // Expiration date has passed, warn them
        $('#notice-expiring').css('display', 'block');
        $('.buy-now').click(function() {
            fnShouldContinue(true);
        }.bind(this));
        $('.remind-later').click(function() {
            fnShouldContinue(true);
        }.bind(this));
    },

    checkShowExpirationMessage: function(fnShouldContinue) {
        // No such thing on hosted, an account is always required, not a license
        if (this.useRemoteHost) {
            fnShouldContinue(true);
            return;
        }

        // If the license is cancelled then we double-check before stopping them
        if (IETAB.Storage.get('licenseCancelled')) {
            this.refreshLicenseStatus(fnShouldContinue);
            return;
        }

        this.continueCheckingExpiration(fnShouldContinue);

    },

    initNormal: function() {
        $('#reg-reminder2').css('display', 'none');

        if (!this.useRemoteHost && !this.isPlatformSupported()) {
            this.dealWithUnsupportedPlatform();
            return;
        }

        var regexChrome = /Chrome\/(\d+)\./;
        var match = window.navigator.appVersion.match(regexChrome);
        var chromeVersion;
        if (match) {
            chromeVersion = { major: parseInt(match[1], 10) };
        } else {
            chromeVersion = { major: 90 };
        }
        if (chromeVersion.major < 29) {
            window.top.location = '/chrome-too-old.html';
            return;
        }

        this.setTitle(this.extractChildUrl());

        this.initCurrentTab(function() {
            this.popupInit(function() {
                this.initHost(function() {
                    this.initHostWindow(function() {
                        this.sendCookies(this.extractChildUrl(), function() {
                            this.finalInit();
                        }.bind(this));
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },

    sendEval: function(context, cmd) {
        var msg = {
            type: 'DO_EVAL',
            context: context,
            cmd: cmd
        }
        this.sendHostMessage(msg);
    },

    useFavicon: function() {
        if (!Settings.get('favicon'))
            return false;

        var helperVersion = Settings.get('helper-version');
        return (Utils.dotVersionCompare(helperVersion, '9.7.12.1') >= 0);
    },

    useSharedProcess: function() {
        var helperVersion = Settings.get('helper-version');
        return Settings.get('shared-process') && (Utils.dotVersionCompare(helperVersion, '10.6.6.1') >= 0);
    },

    updateFavicon: function(newFavicon) {
        if (!this.useFavicon())
            return;

        if(this.lastFavicon == newFavicon)
            return;
        this.lastFavicon = newFavicon;

        // First, change to a blank one because if the new one doesn't exist then
        // Chrome will keep the previous one.  This way we get a blank one in the case
        // where one doesn't exist.
        favicon.change('images/default_favicon.ico');
        window.setTimeout(function() {
            // We use a timeout because on some versions of Chrome, the default favicon
            // doesn't stick if it isn't around long enough before changing it.
            favicon.change(newFavicon);
        }, 200);
    },

    initCommandSupport: function() {
        window.ie = {
            eval: function(cmd) {
                this.sendEval('IE', cmd);
            }.bind(this),
            evald: function(cmd) {
                this.sendEval('IED', cmd);
            }.bind(this)
        }
        window.iec = {
            eval: function(cmd) {
                this.sendEval('IEC', cmd);
            }.bind(this)
        }
    },

    showLoadingFavicon: function() {
        this.updateFavicon('images/default_favicon.ico');
    },

    onBeforePrint: function() {
        window.setTimeout(function() {
            this.sendHostMessage( { type: 'ONBEFOREPRINT' });
        }.bind(this), 0);
    },

    getNewHistoryId: function() {
        return Math.floor(Math.random() * 1000000)
    },

    getHostNameForReals: function() {
        var perUrlMode = '';

        if (this.popupInfo) {
            return this.popupInfo.hostName;
        }

        // Either use the shared host name or a unique host name
        if (this.useSharedProcess()) {
            perUrlMode = Settings.getPerUrlMode(this.extractChildUrl());
            if (perUrlMode) {
                return 'shared-' + perUrlMode;
            } else {
                return 'shared';
            }
        }

        // Create a new, unique, host-name for every tab.
        // Yeah, 10,000,000 is arbitrary, but it's sufficiently large, and readable when debugging
        return Math.floor(Math.random() * 10000000);
    },

    getHostName: function() {
        // This hostName never changes for a tab
        if (this.hostName) {
            return this.hostName;
        } else {
            this.hostName = this.getHostNameForReals();
            return this.hostName;
        }
    },

    initRemoteHost: function (fnContinue) {
        if (!this.useRemoteHost) {
            fnContinue();
            return;
        }

        $('html').addClass('hosted');

        var arrScripts = [
            'myrtille/display.js',
            'myrtille/network_proxy.js',
            'myrtille/config.js',
            'myrtille/display/canvas.js',
            'myrtille/display/divs.js',
            'myrtille/user.js',
            'myrtille/user/keyboard.js',
            'myrtille/user/mouse.js',
            'myrtille/user/touchscreen.js'];

        Utils.injectScripts(arrScripts, function () {
            this.startMyrtille();
            fnContinue();
        }.bind(this));

        // Start the loading indicator
        this.startLoadingIndicator();
    },

    getHostWildcardUrl: function() {
        var url = this.extractChildUrl();
        var parsed = Utils.parseUrl(url);
        return parsed.origin + '/*';
    },

    addLocalNetworkUrl: function() {
        var url = this.getHostWildcardUrl();
        Settings.addToList('autourl-list', '[local,not-auto]' + url);
        window.location.reload();
    },

    initStartPage: function() {
        var manifest = chrome.runtime.getManifest();
        $('#ietab-version').text(manifest.version);
        if (typeof(RemoteHostManager) != 'undefined') {
            var userInfo = RemoteHostManager.getUserInfo();
            if (!userInfo.InTrial) {
                // For now we are not displaying account time
                $('#account-time').css('display', 'none');
            }
        }

        var mode = Settings.get('compat-mode');

        // Strip the 'S' or 'F' indicator and add a space after 'IE'
        mode = mode.slice(0, -1);
        mode = mode.replace('IE', '');
        $('#ie-version').text(mode);
    },

    onClickActiveX: function() {
        $('#prompt-activex').attr('active', 'active');
        $('#prompt-activex a').text('Installing...');
        window.setTimeout(function() {
            var msg = { type: 'INSTALL_ACTIVEX' };
            this.postHostMessage(msg);
        }.bind(this), 1500);
    },

    initDebugSupport: function() {
        if (Settings.get('use-remote-host'))
            return;

        // No debug support for older helpers
        var helperVersion = Settings.get('helper-version');
        if (Utils.dotVersionCompare(helperVersion, '14.6.14.1') < 0)
            return;

        $('#debug-btn').css('display', 'inline');

        var debugUrl = chrome.runtime.getURL('debug.htm?t=' + this.tabId);

        console.log('Click on the link to open the IE Tab debug tools:');
        console.log('     ' + debugUrl);
    },

    init: function () {
        this.useRemoteHost = Settings.get('use-remote-host');

        if (!this.useRemoteHost) {
            this.checkShowWindowsTrial(this.init2.bind(this));
        } else {
            this.init2();
        }
    },

    init2: function() {
        this.historyId = this.getNewHistoryId();
        this.helperSupportsHistory = (Utils.dotVersionCompare(oldStorage['helper-version'], '10.3.32.1') >= 0);
        this.showLoadingFavicon();
        this.updateAddressBar();

        this.initCommandSupport();

        this.initStartPage();

        chrome.runtime.onMessage.addListener(function(message, sender, fnResponse) {
            switch(message.type) {
                case 'AUTH_REQUESTED':
                    this.postHostMessage({ type: 'TABDEACTIVATED' });
                    break;
                case 'GET_URL_PROCESS_INFO':
                    var msg = { type: 'URL_PROCESS_INFO' };
                    msg.url = $('#address-box').val();
                    msg.processId = HostMessaging.getProcessId();
                    chrome.runtime.sendMessage(msg);
                    break;
                case 'DUMP_WINDOWS':
                    this.postHostMessage({ type: 'DUMP_WINDOWS' });
                    break;
                case 'POPUP_SAVE_FILE':
                    this.onSaveFilePrompt(message.saveFileMsg);
                    break;
                case 'INT_OPEN_DEBUGGER':
                    this.onOpenDebugger();
                    fnResponse();
                    break;
                case 'PROXY_REQUEST':
                    Tunnel.onProxyMessage(message.msg);
                    break;
                }
        }.bind(this));

        chrome.runtime.onMessageExternal.addListener(function(message, sender) {
            if (sender && sender.id) {
                this.postHostMessage({ type: 'MESSAGE_EXTERNAL', sender: sender.id, message: JSON.stringify(message) });
            }
        }.bind(this));

        window.addEventListener('beforeunload', function(e) {
            if(this.forceBeforeUnload || this.beforeUnloadActive) {
                e.returnValue = '';
                return '';
            }

        }.bind(this), false);

        // Catch print requests so they can be redirected to IE
        var mediaQuery = window.matchMedia && window.matchMedia('print');
        if (mediaQuery) {
            mediaQuery.addListener(function(mql) {
                if (mql && mql.matches) {
                    this.onBeforePrint();
                }
            }.bind(this));
        }

        this.checkShowExpirationMessage(function(shouldContinue) {
            if (shouldContinue)
                this.initNormal();
        }.bind(this));

        $('.reload-button').click(function() {
            window.location.reload(true);
        }.bind(this));
        $('.close-dialog-button').click(function() {
            this.hideDialogs();
        }.bind(this));

        $('#local-net-single').click(function() {
            this.hideDialogs();
            this.addLocalNetworkUrl();
        }.bind(this));
        $('#local-net-none').click(function() {
            this.hideDialogs();
        }.bind(this));
        $('#prompt-activex').click(function(e) {
            e.preventDefault();
            if ($('#prompt-activex').attr('active'))
                return;
            this.onClickActiveX();
        }.bind(this));

    }
}

window.onload = function() {
    chrome.runtime.sendMessage( { type: 'SW_WAIT_FOR_INIT' }, () =>
        Settings.init(() => {
            IEContainer.init();
            AddressBar.init();
        })
    );
}

var DummyDialog = {
    showDebug: function(msg) { console.log(msg); },
    showStat: function() {},
    showMessage: function(msg) { },
    hideMessage: function() {},
    doHideMessage: function() {},
    showKeyboardHelper: function() {},
    hideKeyboardHelper: function() {},
    showDialogPopup: function() {},
    getShowDialogPopupDesc: function() {  },
    getShowDialogPopupText: function() { },
    getShowDialogPopupSelectText: function() {},
    getShowStatEnum: function() { return {}; }
}
function openPopup() {}
