/*
*    utils.js
*
*    Generic helper functions
*
 */
var Utils = {
    //  dotVersionCompare
    //
    //  Similar to strcmp, a > b = +1, a == b = 0, a < b = -1
    //
    dotVersionCompare: function(a, b) {
        // Convert undefined to 0
        if (!a) a = "0";
        if (!b) b = "0";

        // Parse into version parts
        var parts = {};
        parts.a = a.split(".");
        parts.b = b.split(".");

        for(var i=0; i < parts.a.length; i++) {
            // If we were equal so far and we reached the end of b, then a is bigger
            if(parts.b.length <= i) return 1;

            // Equal so far, integer compare in the same location
            var na = parseInt(parts.a[i]);
            var nb = parseInt(parts.b[i]);
            if(na < nb) return -1;
            else if(na > nb) return 1;
        }

        // We reached the end of 'a'.  If we also reached the end of 'b', then
        // they are equal.  Otherwise, 'b' is longer.  And greater.
        if(i == parts.b.length) return 0;
        else return -1;
    },

    getFileContent: function(fileName, asBase64, fnResponse) {
        var url = fileName;
    
        if (!url.match(/^(https?|file):\/\//))
            url = chrome.runtime.getURL(url);
    
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                if (asBase64) {
                    return response.arrayBuffer();
                } else {
                    return response.text();
                }
            })
            .then(data => {
                if (asBase64) {
                    fnResponse(base64ArrayBuffer(data));
                } else {
                    fnResponse(data);
                }
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                fnResponse(null);
            });
    },

    parseUrl: function(url) {
        var a = document.createElement('a');
        a.href = url;
        return {
            protocol: a.protocol,
            hostname: a.hostname,
            host: a.host,
            pathname: a.pathname,
            search: a.search,
            origin: a.origin,
            hash: a.hash
        }
    },

    injectScript: function (src, fnLoaded) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = false;
        if (fnLoaded) {
            script.onload = fnLoaded;
        }
        script.src = src;
        document.head.appendChild(script);
    },

    importArrScripts: function(arrScripts) {
        for(var i= 0; i<arrScripts.length; i++) {
            importScripts(arrScripts[i]);
        }
    },

    injectScripts: function (arrScripts, fnLoaded, i) {
        if (!i) {
            i = 0;
        }
        this.injectScript(arrScripts[i], function () {
            i++;
            if (i == arrScripts.length) {
                if (fnLoaded) {
                    fnLoaded();
                }
            } else {
                this.injectScripts(arrScripts, fnLoaded, i);
            }
        }.bind(this));
    },

    numberWithCommas: function(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    JsonToUint8Array: function(json)
    {
        return new Uint8Array(JSON.parse(json));
    },
    
    Uint8ArrayToJson: function(binArray)
    {
        var arr = Array.from(binArray);
        return JSON.stringify(arr);
    },

    inServiceWorker: function() {
        return typeof self !== 'undefined' && 
        typeof ServiceWorkerGlobalScope !== 'undefined' && 
        self instanceof ServiceWorkerGlobalScope;
    },

    Uint8ArrayToBase64: function(u8Arr) {
        var CHUNK_SIZE = 0x8000; // arbitrary number of bytes
        var index = 0;
        var length = u8Arr.length;
        var result = '';
        var slice;
        while (index < length) {
            slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
            result += String.fromCharCode.apply(null, slice);
            index += CHUNK_SIZE;
        }
        return btoa(result);
    }
}

