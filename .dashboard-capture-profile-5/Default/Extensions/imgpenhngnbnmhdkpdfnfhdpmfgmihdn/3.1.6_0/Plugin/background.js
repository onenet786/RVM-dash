
importScripts("../adblock/js/background.js");

///////////////////////////////////

///////////////////////////////////

// importScripts('../adblock/js/ewe-api.js');
var AURL = '';
var FirstLoad = 1;
var Site_Safe_tip = 'This site is safe.';
var Site_Risk_tip = 'This site is unsafe';
var Protected_Off_tip = 'IObit Surfing Protection & Ads Removal: Off';
var Iobit_SP_Ads = 'IObit Surfing Protection & Ads Removal';

var CurrentVersion = 0;
var CurrentFilterURL = '';
var varTime;


//native messaging api
var yahoomail_runfirst = 0;
// var all_func_disable = 0;
// var isOpen = '';
var isOpenAdblock = '';
var isOpenEmailProtect = '';

var MinerInfo = new Array();
var this_domaintest = null;

//var lastUrl='';




// chrome.alarms.create('banckgroundtime',{ periodInMinutes:2 });
// chrome.alarms.onAlarm.addListener(function(){
//     console.log('in alarm') ;   
// });
chrome.action.setBadgeBackgroundColor({ color: "#ffad5f"/*, tabId:tabId*/ })
// var safemode=false;
try {
    //var port = chrome.runtime.connectNative(hostname);//this is error for two native massage
    port.onDisconnect.addListener(function () {
        if (!safemode) {
            safemode = true;
            var objtemp = {};
            objtemp['isopen'] = 'true';
            isOpen = 'true';
            chrome.storage.sync.set(objtemp, function () { /*console.log("isopen: "+'false');*/
            });
            // setOnBeforeRequest('true');
            chrome.storage.local.set({ "Site_Safe_tip": "This site is safe" });

            chrome.storage.local.set({ "Link_Safe_tip": "This link is safe" });
            chrome.tabs.query({ active: true/*,currentWindow: true*/ }, function (tabs) {
                if (tabs) {
                    var id = tabs[0].id;
                    var tab_url = tabs[0].url;

                    if ((tab_url != 'about:blank')) {
                        chrome.alarms.create({ when: Date.now() + 1000 });
                        chrome.alarms.onAlarm.addListener(function () {
                            chrome.tabs.reload(id);
                            chrome.alarms.clear();
                        });
                        /*chrome.action.getPopup({tabId:id},function(PopupStr){
                            if(PopupStr==''){
                                window.setTimeout(function(){
                                    chrome.tabs.reload(id);
                                },1000);
                            }
                        })*/
                    }
                }
            });
            //console.log(chrome.runtime.lastError);
        }

    });
}
catch (e) {
    console.log(e);
}

function log(info) {
    /*console.log(info);*/
}

//move to onupdate
// function setOnBeforeRequest(ret) {
//     if ((GetGhromeVersion() >= 17)) {
//         //add interceptRequest
//         if (ret == 'true') {
//             /*console.log("onBeforeRequest.addListener");*/

//             
//             //chrome.webRequest.onBeforeRequest.addListener(interceptRequest, {urls: ["*://*/*"]}, ["blocking"]);
//         } else {
//             /*console.log('port has not executed yet,so lead to failed to get isopen');*/
//         }

//     } else {
//         /*console.log("failed: ***** onBeforeRequest.addListener");*/
//     }
// }

function setAllFuncOffDo(ret_IsOpen, ret_IsOpenAdBlock) {

    if ((ret_IsOpenAdBlock == '') || (ret_IsOpen == '')) {

        window.setTimeout(setAllFuncOffDo(ret_IsOpen, ret_IsOpenAdBlock), 500);
        return;
    }

    if ((ret_IsOpenAdBlock != '1') && (ret_IsOpen != 'true')) {
        /*console.log("********** All Function OFF setPopup null");*/

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            /*console.log("tabs: " + tabs);*/
            if (tabs) {
                var id = tabs[0].id;
                chrome.action.setPopup({ tabId: id, popup: '' });
                console.log('1');
            }

        });


    }
    else {
        /*console.log('Not All Func Off');*/
    }
}


// function UpdateMinerInfoArr(aMinerInfo) {
//     if (MinerInfo.length <= 0) {
//         MinerInfo.push(aMinerInfo);
//     } else {
//         var isFind = false;
//         for (var i = 0; i < MinerInfo.length; i++) {
//             if (MinerInfo[i].tabId == aMinerInfo.tabId) {
//                 MinerInfo[i].url = aMinerInfo.url;
//                 isFind = true;
//                 break;
//             }
//         }
//         if (isFind==false) {
//             MinerInfo.push(aMinerInfo);
//         }
//     }
//     chrome.storage.sync.set({ "MinerInfo": MinerInfo }, () => {
//         /*console.log("set miner info succ");*/
//     });
// }

// function DeleteMinerList(isdelete)
// {
//     var forbidrules = new Array();    
//     chrome.declarativeNetRequest.getDynamicRules(function(rules){
//         for(let j=0;j<rules.length;j++){
//         //console.log('rule:'+rules[j].condition.urlFilter);	
//             forbidrules.push(rules[j].id);
//         }
//     });  
//     if(isdelete)
//     {
//         chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds:forbidrules});
//     }
//     if(forbidrules.length > 0){ 
//         return false;
//     }else{
//         return true;
//     }
// }

function IsContainMinerScript(aMinerInfo) {

    chrome.tabs.get(aMinerInfo.tabId, (tab) => {
        if (MinerInfo.length <= 0) {
            chrome.action.getPopup({ tabId: tab.id }, (res) => {
                if (res.indexOf('threat.html') != -1) {
                    chrome.action.setIcon({ tabId: tab.id, path: chrome.runtime.getURL("Plugin/img/risk.png") }, function () { });
                    chrome.action.enable(tab.id);
                    // return false;
                }
                else {
                    if ((tab.url != "chrome://newtab/") || (tab.url != "edge://newtab/")) {
                        // chrome.action.setPopup({ tabId: tab.id, popup: chrome.runtime.getURL("Plugin/safe.html") + "?false" });
                        RefreshPopupBox("Plugin/safe.html?false", tab.id, tab.url);
                        chrome.action.setIcon({ tabId: tab.id, path: chrome.runtime.getURL("Plugin/img/safe.png") }, function () { });
                        chrome.action.enable(tab.id);
                        console.log('2');
                    }
                }
            });

            return false;
        } else {
            for (var i = 0; i < MinerInfo.length; i++) {
                if (MinerInfo[i].tabId == tab.id) {
                    if (tab.url.indexOf(MinerInfo[i].url) != -1) {
                        //return true;
                        chrome.action.setIcon({ tabId: tab.id, path: chrome.runtime.getURL("Plugin/img/icon_a_small.png") }, function () { });
                        // chrome.action.setPopup({ tabId: tab.id, popup: chrome.runtime.getURL("Plugin/safe.html") + "?true" });
                        RefreshPopupBox("Plugin/safe.html?true", tab.id, tab.url);
                        chrome.action.enable(tab.id);
                        console.log('3');
                        return true;
                    }
                }
            }
            // chrome.action.setPopup({ tabId: tab.id, popup: chrome.runtime.getURL("Plugin/safe.html") + "?false" });
            RefreshPopupBox("Plugin/safe.html?false", tab.id, tab.url);
            chrome.action.setIcon({ tabId: tab.id, path: chrome.runtime.getURL("Plugin/img/safe.png") }, function () { });
            chrome.action.enable(tab.id);
            console.log('4');
            return false;
        }
    });
    return false;
}

if (!safemode) {
    chrome.storage.sync.clear();
    var aLanArr = new Array("Site_Risk", "Site_Risk_tip", "Site_Risk_phish", "Site_Safe", "Site_Safe_tip", "Site_Advisory", "Site_Details", "btn_ok",
        "Ads_removed", "SP_Off", "ads_Nofound", "Site_Miner_tip", "Email_Risk_link", "Email_Risk_sender", "Email_Risk_link_sender", "AllowAD");
    //delete lan;for load next 
    chrome.storage.local.remove(aLanArr, function () {
        console.log('clear lan');
    });

}


function SetLanguageFinish() {
    /*console.log("set lan succ");*/
}
async function removeInvalid() {
    chrome.tabs.query({}, async function (tabs) {
        let name = '__badges';
        let obj = {}; //obj[name] = null;
        chrome.storage.local.get(obj, (result) => {
            if (result && result[name]) {
                for (var key in result[name]) {
                    if (!(tabs && tabs.some((tab) => tab.id === key))) {
                        delete (result[name][key]);
                    }
                }
                let objset = {}; objset[name] = result[name];
                chrome.storage.local.set(objset, function () {
                });
            }
        });
    });
}
chrome.runtime.onStartup.addListener(
    function () {
        removeInvalid();
    }
);

chrome.tabs.onCreated.addListener(
    function (tab) {
        chrome.action.disable(tab.id);
    }
)
try {
    // CurrentVersion = GetGhromeVersion();
    // chrome.action.onClicked.addListener(function(tab){
    // 	/*console.log("****************** chrome.action.onClicked.addListener");*/
    // });


    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        // console.log('in OnUpdated tab: '+ tab);
        // console.log('changinfo: '+ changeInfo);
        // chrome.storage.sync.get("all_func_disable",function(obj){
        //     if(obj.all_func_disable == 1){
        //         // console.log('all_func_disable bk:'+ 1);
        //         chrome.action.disable(tabId);
        //     }        
        // });

        chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true, tabUpdate: { increment: 0, tabId: tab.id } }, () => { });
        // badges[tabId] = 0;
        if (tab.url.search(/chrome:\/\//i) == 0) return;//Filter out errors caused by extended page refresh
        chrome.storage.sync.get("isepopen", function (obj) {
            if (obj.isOpen)
            // if (tab.url.indexOf('mail.yahoo.com')!= -1)
            {
                chrome.tabs.sendMessage(tab.id, { method: "startProtect", firstRun: yahoomail_runfirst, type: 2 }, function (response) {
                    if (response.fresh == 1) {
                        yahoomail_runfirst = 2;
                    }
                });
            }
        });

        //console.log('updated status  <<<<< : ' + changeInfo.status);
        if ((changeInfo.status == 'complete') || (changeInfo.status == 'loading')) {
            /*console.log('table updated  <<<<<');*/
            /*console.log(tab.url);*/

            chrome.storage.sync.get("isopen", function (obj) {
                // var tab_id = tabId; 
                if (obj.isopen == 'true') {
                    var AScanURL = tab.url;
                    console.log('changeInfo.status: ' + changeInfo.status);
                    if (changeInfo.status == 'complete') {
                        interceptRequest(tab);
                    }
                    // if(AScanURL !="chrome://newtab/")
                    // {
                    //     if (IsContainMinerScript({ tabId: tabId, url: AScanURL }) == false){
                    // 	    showIconIndex = 3;
                    // 	    showIcon(tabId);
                    //     }
                    // }

                    /*console.log("extension is open");*/
                    if (AScanURL.indexOf("?IObit") != -1) {
                        AScanURL = AScanURL.substring(0, AScanURL.indexOf("?IObit"));
                    }

                    if (tab.url.indexOf(chrome.runtime.getURL("Plugin/warning.html")) != -1) {
                        /*console.log("warning page showicon");*/
                        if (tab.url.indexOf('phish') != -1) {
                            console.log('icon1');
                            showIconIndex = 8;
                            showIcon(tabId, tab.url);

                        }
                        else {
                            console.log('icon2');
                            showIconIndex = 1;
                            showIcon(tabId, tab.url);

                        }
                        console.log('warning: ' + tab.url);
                        return;
                    } else if (("chrome://newtab/" == tab.url) || ("chrome://extensions/" == tab.url) || ("edge://extensions/" == tab.url) || ("edge://newtab/" == tab.url)) {
                        if (tabId) {
                            console.log('icon3');
                            showIconIndex = 0;
                            showIcon(tabId, tab.url);

                        }
                        console.log('newtab ');
                        return;
                    } else if ("about:blank" == tab.url) {
                        if (tabId) {
                            chrome.action.setIcon({ tabId: tabId, path: chrome.runtime.getURL("Plugin/img/icon_ok_gry_16.png") }, function () { });
                            chrome.action.disable(tabId);
                        }
                        console.log('about:blank');
                        return;
                    }
                    console.log('showIconIndex = 5');
                    console.log('icon4');
                    showIconIndex = 5;
                    showIcon(tabId, tab.url);


                    var IconStr = AScanURL.substring(AScanURL.length - 4, AScanURL.length);
                    if (IconStr == '.ico') {
                        showIconIndex = 0;
                        ScanResult = 0;
                    }


                    if (changeInfo.status == 'complete') {
                        chrome.tabs.sendMessage(tab.id, { method: "startProtect", firstRun: FirstLoad, type: 1 }, function (response) {
                            /*console.log("send startProtect already! firstRun Value:"+FirstLoad);*/
                            showIconIndex = 3;
                            showIcon(tabId, tab.url);
                            FirstLoad = 2;
                        });
                    }
                } else {
                    chrome.storage.sync.get("isepopen", function (obj) {
                        var AScanURL = tab.url;
                        if ((obj.isepopen == 'true') && ((AScanURL != "chrome://newtab/") || (AScanURL != "edge://newtab/"))) {
                            console.log('icon5');
                            showIconIndex = 3;
                            showIcon(tabId, tab.url);
                        }

                        if (tabId) {
                            //chrome.action.disable(tab_id); //chrome.pageAction.hide(tab_id);

                            if (tab.url.indexOf(chrome.runtime.getURL("Plugin/warning.html")) != -1) {
                                if (tab.url.indexOf('phish') != -1) {
                                    showIconIndex = 8;
                                }
                                else {
                                    showIconIndex = 1;
                                }
                                console.log('icon6');
                                showIcon(tabId, tab.url);

                                return;
                            } else if (("chrome://newtab/" == tab.url) || ("edge://extensions/" == tab.url) || ("edge://newtab/" == tab.url)/*||("chrome://extensions/"==tab.url)*/) {
                                if (tabId) {
                                    console.log('icon7');
                                    showIconIndex = 0;
                                    showIcon(tabId, tab.url);

                                }
                                return;
                            } else if ("about:blank" == tab.url) {
                                if (tabId) {
                                    chrome.action.setIcon({ tabId: tabId, path: chrome.runtime.getURL("Plugin/img/icon_ok_gry_16.png") }, function () { });
                                    chrome.action.disable(tabId);
                                }
                                console.log('about blank');
                                return;
                            }

                            showIconIndex = 5;
                            console.log('icon8')
                            showIcon(tabId, tab.url);

                        }
                    });


                }
            });
            chrome.storage.sync.get("isepopen", function (obj) {
                // var tab_id = tab.id;
                if (obj.isepopen == 'true') {

                    /*console.log("extension is open");*/
                    if (changeInfo.status == 'complete') {
                        chrome.tabs.sendMessage(tab.id, { method: "startProtect", firstRun: 2, type: 2 }, function (response) {
                        });
                    }
                }
            });
        }
    });


    function interceptRequest(details) {
        /*console.log('intercept  >>>>>');*/
        // if (details.type=="main_frame"){	
        /*console.log('onSendHeaders: ' + details.url);*/
        if (details.url.indexOf("?IObit") == -1 && details.url.indexOf(chrome.runtime.getURL("Plugin/warning.html")) == -1) {
            console.log('interceptRequest: ' + details.url);
            port.postMessage({ CMD: "Scan", ScanURL: details.url, ScanType: 2, tabid: details.id });
        }

    }


    //message handle for content scripts
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        // console.log('request.action: ' + request.action);
        if (request.action == 'Scan') {
            if (request.resultName == 'resultwindow') {
                if (request.ScanURL.indexOf("?IObit") == -1 && request.ScanURL.indexOf(chrome.runtime.getURL("Plugin/warning.html")) == -1) {
                    /*console.log("********** request.ScanURL: " + request.ScanURL + '  sender.tab.id: ' + sender.tab.id);*/
                    tabId = sender.tab.id;

                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        /*console.log("tabs.length" + tabs.length);*/
                        //console.log("ScanURL" + tabs[0].url);
                        //tabId = tabs[0].id;							
                        /*console.log('Scan tabId: ' + tabId);*/
                        console.log('request addlisten1: ' + request.ScanURL);
                        port.postMessage({ CMD: "Scan", ScanURL: request.ScanURL, ScanType: 2, tabid: tabId });
                    });
                }
            } else {
                /*console.log("********** searchengine request.ScanURL: " + request.ScanURL);*/

                /*console.log("********** searchengine request.ScanURL: " + request.ScanURL);*/
                if (request.type) {
                    if (safemode) {
                        chrome.tabs.sendMessage(sender.tab.id, { action: "scanResult", value: 0, resultname: request.resultName, searchengine: request.searchengine }, function (response) { });
                    }
                    else {
                        console.log('request addlisten2: ' + request.ScanURL);
                        port.postMessage({ CMD: "Scan", ScanURL: request.ScanURL, ScanType: request.ScanType, tabid: sender.tab.id, OnlyResult: 1, resultname: request.resultName, searchengine: request.searchengine, type: request.type });

                    }


                }
                else {
                    if (safemode) {
                        chrome.tabs.sendMessage(sender.tab.id, { action: "scanResult", value: 0, resultname: request.resultName, searchengine: request.searchengine }, function (response) { });
                    }
                    else {
                        port.postMessage({
                            CMD: "Scan",
                            ScanURL: request.ScanURL,
                            ScanType: request.ScanType,
                            tabid: sender.tab.id,
                            OnlyResult: 1,
                            resultname: request.resultName,
                            searchengine: request.searchengine
                        });
                    }
                }
            }
            sendResponse({});
        }
        else if (request.action == 'ScanSender') {
            port.postMessage({ CMD: "ScanSender", Email: request.Email, ScanType: request.ScanType, tabid: sender.tab.id, OnlyResult: 1, resultname: request.resultName, searchengine: request.searchengine, URL: sender.tab.url });
            sendResponse({});
        }
        else if (request.action == 'ScanLink') {
            port.postMessage({ CMD: "ScanLink", ScanURL: request.ScanURL, ScanType: request.ScanType, tabid: sender.tab.id, OnlyResult: 1, resultname: request.resultName, searchengine: request.searchengine, URL: sender.tab.url });
            sendResponse({});
        }
        else if (request.action == 'SetShowADName') {
            /*console.log("********** SetShowADName: " + request.ADName);*/
            chrome.storage.sync.set({ 'showadname': request.ADName });
            port.postMessage({ CMD: "SetShowADName", ADName: request.ADName });
            sendResponse({});
        }
        else if (request.action == 'SetFilterURL') {
            /*console.log("********** SetFilterURL: " + request.ScanURL);*/
            port.postMessage({ CMD: "SetFilterURL", FilterURL: request.ScanURL });
            sendResponse({});
        }
        else if (request.action == 'sendMail') {
            /*console.log("********** sendMail: " + request.sendMail);*/
            port.postMessage({ CMD: "OpenByParam", ParamStr: request.sendMail });
            sendResponse({});
        } else if (request.action == "BlockFpAction") {
            port.postMessage({ CMD: "BlockFpAction", browser: "chrome", domain: request.url });
            sendResponse({});
        }

    });
}
catch (e) {
    /*console.log('except: ' +  e);*/
}
