function injectStyles() {
    return chrome.runtime.sendMessage({
        action: "INSERT_CSS_RULE",
        rule: "rules/youtube",
    });

}

function injectScriptlets() {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = chrome.runtime.getURL("adblock/js/scriptlets.js");
        script.onload = function () {
            this.remove();
            resolve();
        };
        script.onerror = reject;
        (document.head || document.documentElement).appendChild(script);
    });
}

async function init() {
    await Promise.all([injectStyles(), injectScriptlets()]);
}

chrome.storage.local.get('ytWhite', function (param) {
    if (!param.ytWhite) {
        init();
        // sendResponse({ succ: true });
    }
})