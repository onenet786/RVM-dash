/*
 * portmv2.js
 *
 * Port MV2 localStorage to MV3 chrome.storage.local. 
 * Only run once per install of the extension
 *
 *
*/

var PortMV2 = {
    init: function() {
        var msg = {
            type: 'MV2_STORAGE',
            storage: localStorage
        }
        chrome.runtime.sendMessage(msg);
        // Only do this once. If we rollback to MV2 then MV2 since 17.6.3.1 knows how to
        // pick up MV3 storage
        localStorage.clear();

    }
}

window.addEventListener('load', () => {
    PortMV2.init();
});

