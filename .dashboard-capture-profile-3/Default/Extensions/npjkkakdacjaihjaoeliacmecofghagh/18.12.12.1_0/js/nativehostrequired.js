
var NativeHostRequired = {
    init: function() {
        // Begin the download
        var anchorObj = $('#the-download')[0];

        // Raise a fake elick on the .dat file link, which will rename it to .exe
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window,
            0, 0, 0, 0, 0, false, false, false, false, 0, null);
        var allowDefault = anchorObj.dispatchEvent(evt);

        // Poll every 5 seconds for the native host to be available
        var theInterval = window.setInterval(function() {
            chrome.runtime.sendMessage({ type: 'TEST_FOR_NATIVEHOST' }, (result) => {
                if (result) {
                    // Hey, it's installed, redirect to the container page
                    window.clearInterval(theInterval);
                    var url = document.location.href.match(/#url=(.*)/)[1];
                    // Is this okay to not use urlid?
                    document.location.href = chrome.runtime.getURL('nhc.htm') + '#url=' + url;
                }
            });
        }.bind(this), 5000);

    }
}

window.onload = function() {
    NativeHostRequired.init();
}
