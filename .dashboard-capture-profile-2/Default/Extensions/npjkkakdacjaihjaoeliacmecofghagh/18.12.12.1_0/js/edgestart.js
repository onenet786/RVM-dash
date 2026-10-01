/*
 * edgestart.js
 *
 * Script for the edge start page.
 *
 */
var EdgeStart = {
    tabId: null,

    onAddressEnter: function() {
        // Navigate the top frame so this navigation gets into the history and the
        // back / forward queue
        var url = $('#address-box').val();
        BackgroundProxy.call2('openWithIETab', this.tabId, url);
//        Background.openWithIETab(this.tabId, url);
    },

    addEventListeners: function() {
        $('#address-box').keypress(function(e) {
            if(e.which == 13) {
                this.onAddressEnter();
            }
        }.bind(this));

        $('#go-btn-anchor').click(function(e) {
            this.onAddressEnter();
            e.preventDefault();
        }.bind(this));

        $('#address-box').focus(function() {
            window.setTimeout(function() {
                $('#address-box').select();
            }, 100);
        });

    },

    initCompatMode: function() {
        var mode = Settings.get('compat-mode');

        // Strip the 'S' or 'F' indicator and add a space after 'IE'
        mode = mode.slice(0, -1);
        mode = mode.replace('IE', '');
        $('#ie-version').text(mode);
    },

    initCurrentTab: function() {
        chrome.tabs.getCurrent(function(tab) {
            this.tabId = tab.id;
            this.windowId = tab.windowId;
        }.bind(this));
    },

    init: function() {

        var manifest = chrome.runtime.getManifest();
        $('#ietab-version').text(manifest.version);

        var licensee = Settings.get('licensee');
        if (licensee) {
            $('#licensee').text(licensee);
         }

        this.initCompatMode();
        this.initCurrentTab();
        this.addEventListeners();
        $('#address-box').focus();
    },
}

window.onload = function() {
    EdgeStart.init();
}
