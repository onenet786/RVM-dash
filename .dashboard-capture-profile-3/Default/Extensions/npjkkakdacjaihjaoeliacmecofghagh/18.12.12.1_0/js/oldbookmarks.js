/*
 *  oldbookmarks.js
 *
 * This functionality provides redirects for old or different versions of the extension where the user
 * might have had bookmarks using the old extension ID.  We redirect those bookmarks.
 * The logic is this:
 *   If an extension URL is opened and it is one of our old ones then
 *      If that extension is not installed then we redirect it to the currently installed version
 * 
 *
*/
var OldBookmarks = {
    // These are the various extension IDs for our extensions over the years, some are self-deployed
    // by corporations.
    EXTENSION_IDS: [
        'hehijbfgiekmjfkfjpbkbammjbdenadd',
        'knnoopddfdgdabjanjmeodpkmlhapkkl',
        'ncdgipmkgkhennagnfmnlkflidilhbdi',
        'lfcnklibhpibaknkjjbgbnebephkcomf'
    ],

    // We cache the check on whether our old extension is installed
    installedVersions: {},
    myId: null,

    getIdFromUrl: function(url) {
        var match = url.match('chrome-extension://([^\/]*)');
        if (!match)
            return '';
        return match[1];
    },

    checkLegacyInstalled: function(id, fnIsInstalled) {
/* We don't even support having multiple installed, so no need for this check
   which doesn't work in SW anyhow

        var req = new XMLHttpRequest();
        var url = 'chrome-extension://' + id + '/redir.htm';
        req.open('GET', url);
        req.onreadystatechange = () => {
            if (req.readyState == 4) {
                fnIsInstalled(req.status == 200);
            }
        }
        req.send();
*/
        fnIsInstalled(false);
    },

    redirectBookmark: function(tab) {
        var match = tab.url.match(/chrome-extension:\/\/[^\/]*\/(.*)/);
        if (match) {
            var newUrl = 'chrome-extension://' + this.myId + '/' + match[1];
            chrome.tabs.update(tab.id, { url: newUrl });
        }
    },

    checkRedirectBookmark: function(tab) {
        var id = this.getIdFromUrl(tab.url);
        if (!id || (id == this.myId))
            return;

        if (typeof(this.installedVersions[id]) == 'undefined') {
            // Check whether this one is installed and cache the result
            this.checkLegacyInstalled(id, (isInstalled) => {
                this.installedVersions[id] = isInstalled;
                if (!isInstalled) {
                    this.redirectBookmark(tab);
                }
            });
        } else {
            if (!this.installedVersions[id]) {
                this.redirectBookmark(tab);
            }
        }
    },

    onUpdated: function(tabId, changeInfo, tab) {
        if (changeInfo.status != 'complete')
            return;
        
        if (tab.url.indexOf('chrome-extension://') != 0)
            return;
        for (var i=0; i<this.EXTENSION_IDS.length; i++) {
            // Of course we don't need to redirect our own
            if (this.EXTENSION_IDS[i] == this.myId)
                continue;
            var extUrl = 'chrome-extension://' + this.EXTENSION_IDS[i];
            if (tab.url.indexOf(extUrl) == 0) {
                this.checkRedirectBookmark(tab);

            }
        }
    },

    init: function() {
        this.myId = Settings.get('extension-id');
        chrome.tabs.onUpdated.addListener(this.onUpdated.bind(this));
    }
}

OldBookmarks.init();
