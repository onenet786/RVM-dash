//====================================================//
//test code

// console.log(chrome.storage.local.get);
var fingerBlock = false;
function overrideMethods()
{
  var script = document.createElement("script");
  script.id = 'iobit_Finger_Print';
  script.src = chrome.runtime.getURL("Plugin/Test.js");
  script.onload = function () {
    this.remove();
  };
   (document.head || document.documentElement).appendChild(script); 
   script.remove(); 
}

chrome.storage.local.get("FingerPrintSwitch", (item) => {
    console.log("has get the FIngerPrintSwitch");
    console.log(item.FingerPrintSwitch);
    if (item.FingerPrintSwitch == true) {
        chrome.storage.local.get("FingerPrintWhiteList", (item_list) => {
            var find = false;
			console.log(item_list.FingerPrintWhiteList);
			//console.log(item_list.FingerPrintWhiteList.length)
            if ((item_list.FingerPrintWhiteList.length == 1) && (item_list.FingerPrintWhiteList[0] == "")) {
                find = "";
            } else {
                for (var i = 0; i < item_list.FingerPrintWhiteList.length; i++) {
                    if (item_list.FingerPrintWhiteList[i] != "") {
                        if (location.href.toLowerCase().indexOf(item_list.FingerPrintWhiteList[i].toLowerCase()) > -1) {
                            find = true;
                        }
                    }
                }
            }
            if (!find) {	
            overrideMethods();


                // var prefix = localStorage.getItem('prefix');
                var prefix = 'iobit';
                window.addEventListener(prefix + "_shk_showNote", function (evt) {
                    if (!fingerBlock)
                    {
                        fingerBlock = true;
                        chrome.runtime.sendMessage({ action: "BlockFpAction", url: location.href });

                    }
                })
            }
        });
    }
});


// var prefix = 'iobit';
//   (function addListener() {

//   })();






	






