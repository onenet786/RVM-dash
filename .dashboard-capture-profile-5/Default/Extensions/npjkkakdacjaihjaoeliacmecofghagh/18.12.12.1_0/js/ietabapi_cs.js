/*
 * This content script provides the ietab API to web pages that have permissions
 */

var IETabApi = {
    apiAccessAllowed: false,
    requestPending: false,

    postResponse: function(requestNumber, data) {
        var wrappedRequest = {
            type: 'IETABAPI_RESPONSE',
            src: 'CS',
            responseNumber: requestNumber,
            data: data
        }

        window.postMessage(wrappedRequest, document.location.origin);
    },

    onApiRequest: function(event) {
        if (event.data.request.type == 'REQUEST_ACCESS') {
            // Only one request is allowed at a time, and we are done if they already have access
            if (this.requestPending || this.apiAccessAllowed) {
                this.postResponse(event.data.requestNumber, this.apiAccessAllowed);
                return;
            }

            this.requestPending = true;
            chrome.runtime.sendMessage({
                type: 'IETABAPI_REQUEST',
                request: { type: 'REQUEST_ACCESS', silent: event.data.request.silent }
            }, function(result) {
                this.requestPending = false;
                this.apiAccessAllowed = result;
                this.postResponse(event.data.requestNumber, result);
            }.bind(this));

            return;
        }

        // Not an access request, check whether it's allowed
        if(!this.apiAccessAllowed && (event.data.request.type != 'GET_VERSION')) {
            // IE Tab api request has not been made yet
            throw 'IETABAPI Error:  Permission not granted.  You must call window.ietab.requestAccess to use the IE Tab Api.';

            // Note: throw above exited, no return necessary
        }

        // This request is allowed, go ahead and make it
        var fnResponse;
        if (event.data.requestNumber) {
            fnResponse = function(data) {
                this.postResponse(event.data.requestNumber, data);
            }.bind(this);
        }
        // It's a web page api request and it's allowed, go ahead and send it
        if (fnResponse)
            chrome.runtime.sendMessage(event.data, null, fnResponse);
        else
            chrome.runtime.sendMessage(event.data);
    },

    onApiResponse: function(event) {
        if (this.waitingCalls[event.data.responseNumber]) {
            // Call the response function and delete the waiting entry
            (this.waitingCalls[event.data.responseNumber])(event.data);
            delete this.waitingCalls[event.data.responseNumber];
            return;
        }
    },

    init: function() {
        // Listen for posted api messages from the web page and send them to the background page
        window.addEventListener('message', function(event) {
            if (event.origin !== document.location.origin)
                return;

            if (!event.data || !event.data.src || !event.data.type)
                return;

            // Make sure it's from the web page
            if (event.data.src != 'WP')
                return;

            if (event.data.type == 'IETABAPI_REQUEST') {
                this.onApiRequest(event);
            } else if(event.data.type == 'IETABAPI_RESPONSE') {
                this.onApiResponse(event)
            }
        }.bind(this), false);

        // Inject the web-page portion of the api
        var script = document.createElement('script');
        script.setAttribute('id', '__iet__api__wp__');
        script.src = chrome.runtime.getURL('js/ietabapi_wp.js');
        (document.head||document.documentElement).appendChild(script);

        // Delete the script element so it doesn't clutter the DOM
        script.parentNode.removeChild(script);

    }
}

IETabApi.init();
