/*
 *
 * tunnel.js
 *
 * Manages remote proxy tunnels
 *
 * A single user only opens a single RDP session to the remote host
 *
 */
var Tunnel = {
    sockets: {},
    pendingMessages: {},
    pendingRequestUrls: {},
    pendingRequestIds: {},
    nextRuleId: RULE_RANGE_TUNNEL[0],

    BAtoB64: function(bytes) {
        var len = bytes.byteLength;
        var binaryString = '';
        for (var i = 0; i < len; i++) {
            binaryString += String.fromCharCode( bytes[ i ] );
        }
        return window.btoa( binaryString );
    },
    
    sendResponse: function(requestId, xhr) {
        var httpVersion = 'HTTP/1.1';
        var headers = '';
        if (xhr.webRequestHeaders) {
            headers = xhr.webRequestHeaders;
        } else {
            console.log('No webRequest headers?! for ' + xhr.msg.url)
            headers = xhr.getAllResponseHeaders();
        }
        headers = headers.replace('content-encoding: gzip\r\n', '');
        headers = headers.replace(/content-length: \d+/, 'content-length: ' + xhr.response.byteLength);
        headers = headers.replace('connection: Keep-Alive', '');
        headers = headers.replace(/content-encoding: [^\r\n]*/gm, '');
        headers += '\r\n';

        var b64Data = this.BAtoB64( new Uint8Array(xhr.response) );

        var msg = {
            type: 'PROXY_RESPONSE',
            requestId: requestId,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: headers,
            b64Data: b64Data
        }
        chrome.runtime.sendMessage(msg);
    },


    prepareHeaderIntercept: function (ua, fnCallback) {
        if (!ua ||
            !chrome.declarativeNetRequest ||
            !chrome.declarativeNetRequest.updateSessionRules) {
            fnCallback(null);
            return;
        }

        ua = ua.replace(/^ +/, '');

        var ruleId = this.nextRuleId++;
        if (ruleId >= RULE_RANGE_TUNNEL[1]) {
            ruleId = RULE_RANGE_TUNNEL[0];
            this.nextRuleId = RULE_RANGE_TUNNEL[0] + 1;
        }

        var rule = {
            id: ruleId,
            priority: 1,
            action: {
                type: 'modifyHeaders',
                requestHeaders: [{
                    header: 'User-Agent',
                    operation: 'set',
                    value: ua
                }]
            },
            condition: {
                // Broad so redirects get the UA,
                // but limited to this tab’s XHRs.
                regexFilter: '.*',
                resourceTypes: ['xmlhttprequest'],
                tabIds: [IEContainer.tabId]
            }
        };

        chrome.declarativeNetRequest.updateSessionRules(
            { addRules: [rule] },
            function () {
                fnCallback(ruleId);
            }
        );
    },

    onProxyMessage: function(msg) {
        var headers = msg.headers.split('\r\n');
        var sendHeaders = {};
        var ua = '';
        for (var i=0; i<headers.length; i++) {
            var header = headers[i];
            var index = header.indexOf(':');
            if (index != -1) {
                var name = header.substring(0, index);
                var value = header.substring(index+1);
                if (name.toLowerCase() == 'user-agent') {
                    ua = value;
                }
                // Chrome considers setting the "host" in a header here as an "ERR_INVALID_ARGUMENT".
                // In any case it shouldn't be needed as it is part of the URL given to the XHR.
                if (name.toLowerCase() == "host")
                    continue;
                value = value.replace(/^ +/, '');
                sendHeaders[name] = value;
            }
        }
        var xhr = new XMLHttpRequest();
        xhr.requestHeaders = msg.headers;
        xhr.responseType = "arraybuffer";
        this.pendingRequestUrls = this.pendingRequestUrls || {};
        this.pendingRequestUrls[msg.url] = xhr;
        xhr.msg = msg;
        xhr.theUrl = msg.url;
        xhr.open(msg.method, msg.url);
        this.prepareHeaderIntercept(ua, (ruleId) => {
            xhr.onreadystatechange = function() {
            //       Gotta make sure we remove the DNR intercept regardless of cancel / success / failure
            //        and even doubly with a timeout just to make sure, otherwise we break
            //        XHR globally for Chrome
            if (xhr.cancelled)
                return;
            
            if (xhr.readyState == 4) {
                // Remove the User-Agent rule
                chrome.declarativeNetRequest.updateSessionRules({
                    removeRuleIds: [ ruleId ]
                });
                this.sendResponse(msg.id, xhr);
            }
            }.bind(this);
        });
        var body = null;
        if (msg.body)
        {
            body = window.atob(msg.body);
        }
        xhr.send(body);
    },

    getPendingRequestFromDetails: function(details, matchRequestId) {
        if ((details.frameId != 0) || (details.tabId != IEContainer.tabId) || (details.type != 'xmlhttprequest') || (details.initiator + "/" != chrome.runtime.getURL('')))
            return null;

        var xhr = this.pendingRequestIds[details.requestId];
        if (!xhr) {
            xhr = this.pendingRequestUrls[details.url];
        }
        return xhr;
    },

    onBeforeRequest: function(details) {
        var xhr = this.getPendingRequestFromDetails(details);
        if (xhr) {
            xhr.requestId = details.requestId;
            this.pendingRequestIds[details.requestId] = xhr;
        }
    },

    sendRedirectResponse: function(xhr, details) {
        xhr.cancelled = true;
        delete this.pendingRequestUrls[xhr.msg.url];
        if (xhr.requestId && this.pendingRequestIds[xhr.requestId])
            delete this.pendingRequestIds[xhr.requestId];

        var allHeaders = xhr.webRequestHeaders + '\r\n';

        var httpVersion = 'HTTP/1.1';

        var msg = {
            type: 'PROXY_RESPONSE',
            requestId: xhr.msg.id,
            status: details.statusCode,
            statusText: details.statusLine,
            headers: allHeaders,
            b64Data: null
        }
        chrome.runtime.sendMessage(msg);
    },

    onHeadersReceived: function(details) {
        if (details.statusCode > 299 && details.statusCode < 400) {
            console.log('redirect ');
        }
        // If we receive a redirect then actually redirect
        var xhr = this.getPendingRequestFromDetails(details, true);
        if (!xhr)
            return;
        // getAllResponseHeaders does not include cookies so we get all headers
        // from here
        xhr.webRequestHeaders = '';
        for (var i=0; i<details.responseHeaders.length; i++) {
            var header = details.responseHeaders[i];
            if (xhr.webRequestHeaders) {
                xhr.webRequestHeaders += '\r\n';
            }
            xhr.webRequestHeaders += header.name + ': ' + header.value;
        }
        if (details.statusCode > 299 && details.statusCode < 400) {
            this.sendRedirectResponse(xhr, details);
            xhr.cancelled = true;
        }
    },

    onBeforeSendHeaders: function(details) {
        var xhr = this.getPendingRequestFromDetails(details, true);
        if (!xhr)
            return;

        var resultHeaders = [];
        var headers = xhr.requestHeaders.split('\r\n');
        for (var i=0; i<headers.length; i++) {
            var header = headers[i];
            var index = header.indexOf(':');
            if (index != -1) {
                var name = header.substring(0, index);
                var value = header.substring(index+1);
                // Chrome considers setting the "host" in a header here as an "ERR_INVALID_ARGUMENT".
                // In any case it shouldn't be needed as it is part of the URL given to the XHR.
                if (name.toLowerCase() == "host")
                    continue;
                value = value.replace(/^ +/, '');
                resultHeaders.push({ name: name, value: value });
            }
        }

        return { requestHeaders: resultHeaders };
    },

    init: function() {
/*        if (!this.fnOnBeforeSendHeaders) {
            this.fnOnBeforeSendHeaders = this.onBeforeSendHeaders.bind(this);
            chrome.webRequest.onBeforeSendHeaders.addListener(
                this.fnOnBeforeSendHeaders,
                { urls: ["<all_urls>"], types: [ 'xmlhttprequest' ], tabId: -1 },
                [ 'blocking', 'requestHeaders' ]
            );
        }
*/
        
        if (!this.fnOnBeforeRequest) {
            this.fnOnBeforeRequest = this.onBeforeRequest.bind(this);
            chrome.webRequest.onBeforeRequest.addListener(
                this.fnOnBeforeRequest,
                { urls: ["<all_urls>"], types: [ 'xmlhttprequest' ], tabId: -1 },
                [ ]
            );
        }

        if (!this.fnOnHeadersReceived) {
            this.fnOnHeadersReceived = this.onHeadersReceived.bind(this);
            chrome.webRequest.onHeadersReceived.addListener(
                this.fnOnHeadersReceived,
                { urls: ["<all_urls>"], types: ['xmlhttprequest' ], tabId: -1 },
                [ 'responseHeaders' ]
            );
        }
    }    
}

Tunnel.init();