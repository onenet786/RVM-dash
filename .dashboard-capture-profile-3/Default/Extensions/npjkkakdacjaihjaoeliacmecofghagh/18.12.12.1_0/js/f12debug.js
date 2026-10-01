/*

    F12Debug

    Open the F12 debugger tools
 */
var F12Debug = {
    init: function() {
        var regex = /.*\?t=(.*)/;
        var match = document.location.href.match(regex);
        var t = decodeURIComponent(match[1]);
        chrome.tabs.sendMessage(parseInt(t), { type: 'INT_OPEN_DEBUGGER' }, () => {
            window.close();
        });
    }
}

F12Debug.init();
