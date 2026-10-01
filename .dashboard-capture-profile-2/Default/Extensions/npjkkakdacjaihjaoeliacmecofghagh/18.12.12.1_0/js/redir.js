//
// RedirPage script for redir.htm
//
// This is a web-accessible resource that is used as a way to redirect
// auto URLs to the nhc.htm landing page.
//
// We want to keep nhc.htm NON web_accessible and still use a friendly URL.
//
// But redir.htm IS web_accessible.  We keep it from being used arbitrarily by
// only allowing it to open specific URLs that were registered for a short-lived
// time with a random identifier, so only auto URLs that we initiated can be opened
// with redir.htm.
//
var RedirPage = {
    extractChildUrl: function(fnResponse) {
        var regex = /[#]urlid=([^&].*)/;
        var match = document.location.href.match(regex);
        if (match) {
            BackgroundProxy.getProp('pendingAutoUrls', (pendingAutoUrls) => {
                // See if this is a pending Auto URL
                var details = pendingAutoUrls[match[1]];
                if (details && details.url) {
                    BackgroundProxy.call('setAutoUrlDetails', details);

                    fnResponse(details.url);
                }
            });
        } else {
            // Not a URLID, an actual URL
            regex = /[#]url=(.*)/;
            match = document.location.href.match(regex);
            if (match)
                fnResponse(match[1]);
            else
                fnResponse(null);

        }
        return null;
    },

    getNativeHostContainer: function(url) {
        return chrome.runtime.getURL('nhc.htm') + '#url=' + url;
    },

    onUrlChanged: function() {
        this.extractChildUrl((url) => {
            if (url) {
                var containerUrl = this.getNativeHostContainer(url);
                window.location.replace(containerUrl);
            } else {
                document.getElementById('problem').style.display = 'block';
            }
        });
    },

    init: function() {
        window.onhashchange = function() {
            this.onUrlChanged();
        }.bind(this);

        // First check for the url
        this.onUrlChanged();
    }
}

RedirPage.init();
