/*
 * contextmenu.js
 *
 * Context menu support
 *
*/
var ContextMenu = {
    created: false,

    onClicked: function(info) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs.length)
                return;
            var tab = tabs[0];
            var url = info.linkUrl || info.srcUrl || info.frameUrl || info.pageUrl || tab.url;
            switch(info.menuItemId) {
                case 'ctxIETabOptions':
                case 'ctxOpenIETab':
                        Background.openWithIETab(null, url);
                    break;
                case 'ctxOpenCurrentTab':
                    Background.openWithIETab(tab.id, url);
                    break;
            }
        });
    },

    create: function() {
        if (this.created) {
            return;
        }
        this.created = true;

        var txtIETabOptions = "IE Tab Options";
        var txtOpenIETab = "Open in IE Tab";
        var txtOpenInCurrentTab = "Open in current tab";
        var contextTypes = [ 'page', 'frame', 'link', 'video' ];
        var contextParent = chrome.contextMenus.create({
            type: "normal",
            title: txtIETabOptions,
            contexts: contextTypes,
            id: 'ctxIETabOptions'
        });
        var contextOpenIETab = chrome.contextMenus.create({
            type: "normal",
            title: txtOpenIETab,
            contexts: contextTypes,
            parentId: contextParent,
            id: 'ctxOpenIETab'
        });
        var contextOpenSameTab = chrome.contextMenus.create({
            type: "normal",
            title: txtOpenInCurrentTab,
            contexts: contextTypes,
            parentId: contextParent,
            id: 'ctxOpenCurrentTab'
        });
        // var contextOptions = chrome.contextMenus.create({ type: "normal", title: I18N("ctxOptions"), contexts: contextTypes, parentId: contextParent, onclick: onContextClicked });
    },

    remove: function() {
        this.created = false;
        chrome.contextMenus.removeAll();
    }
}

chrome.contextMenus.onClicked.addListener((info) => {
    Background.waitForInit(() => {
        ContextMenu.onClicked(info);
    });
});