// const { EWE } = require("./ewe-api");


importScripts('../adblock/js/ewe-api.js');
// importScripts('ewe-api.js');
var hostname = 'com.ascplugin.protect';
var port = chrome.runtime.connectNative(hostname);
var dll = {};
dll.locked = false;
dll.message = [];
var safemode = false;
var isOpen = '';
var all_func_disable = 0;
var showIconIndex = 0;
// var _db_block_whitelist = [];
// var index=0;
var sendmessage = function (tabid, url, scanResult) {
    chrome.tabs.sendMessage(tabid, { CMD: "URL", URL: url, SCANRESULT: scanResult }, function (response) {
        //console.log("sendMessage to tabid:" + tabid + "  URL: " + URL + "  SCANRESULT: "+ scanResult);
        if (response == undefined) {
            //console.log("sendMessage to tabid:" + tabid + "RESPONSE UNDEFINED" );
            chrome.tabs.get(tabid, function (tab) {
                if (tab.url.indexOf("Plugin/warning.html") != -1) {
                    setTimeout(sendmessage, 200, tabid, url, scanResult);
                }
                else {
                    setTimeout(sendmessage, 500, tabid, url, scanResult);
                }
            });

        }
        else {
            /*console.log("sendMessage to tabid:" + tabid + "RESPONSE: " + response);*/

        }
    });
};
var native_onmessage = function (g) {

    // var msgArry= [];
    // chrome.storage.local.get('array',function(arr){ msgArry = arr; });
    // if (msgArry.length == 0) {
    //     return
    // }
    // console.log('dll.message.length: '+ dll.message.length);
    // console.log('name:'+ g.name);
    // console.log('data:'+ g.data);
    if (dll.message.length == 0) {
        return
    }
    if (!g || typeof g.name == "undefined" || g.name != "adblock" /*|| g.data !=""*/) {
        // console.log('cmd: '+ g);
        return
    }
    // chrome.storage.local.set({Locked:true})
    dll.locked = true;

    var e = /*dll.message[index];*/dll.message.shift();
    // console.log('e : '+ e[0]["name"]);
    // dll.message.push(e);
    // index = index + 1
    // var e = msgArry.shift();
    // chrome.storage.local.set({'ntvMsg':msgArry});
    // chrome.storage.local.set({array:msgArry},function(){console.log('save suc')} );
    var c = e[0]["data"];
    var b = e[0]["name"];
    var d = e[1];
    var a = e[2];
    if (!g || typeof g.data == "undefined") {
        log("Call %c" + b + "(" + c.join() + ") failed, msg: ", "color:red");
        log(g);
        if (typeof a == "function") {
            a.call(null)
        }
    } else {
        var f = JSON.stringify(g);
        if (g.data.length > 1024) {
            f = "truncated(1024) ... "
        }
        log("Call result %c" + b + "(" + c.join() + "): " + f, "color:red");
        if (typeof g.data == "undefined") {
            return
        }
        if (typeof d == "function") {
            d.call(null, g.data)
        }
    }
    if (dll.message.length > 0)
    // if (msgArry.length > 0)
    {
        e = dll.message[0];
        // e = msgArry[0];
        c = e[0]["data"];
        b = e[0]["name"];
        log("Call %c" + b + "(" + c.join() + "): ", "color:red");
        port.postMessage(e[0])
    }
    dll.locked = false
};
async function startadbolock() {
    console.log('start adblock')
    await EWE.start();
    await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: [], enableRulesetIds: [
            "2F0A4F0D-DF16-40D0-B0E0-5EB6791EC119",
            "4337FB2B-A95C-44D5-B78D-11AD40F7711B",
            "7FCD16F0-6505-4A59-90CD-B49849481B0B",
            "879ECB9D-8935-4506-939E-5BBB7DD09402",
            "8C13E995-8F06-4927-BEA7-6C845FB7EEBF",
            "8D421590-1A68-4B68-BE50-04E17C09460E",
            "9F743FCD-801B-41D0-830F-5A4EA995216E",
            "A41441EE-BF7C-4A48-9A43-42CCEA2B2A1D",
            "C8C1AA76-15B4-4CA3-8A9C-AD38D6AFCAEC",
            "CB94E27D-6CD1-4DB9-83D9-6B7F1A3555F6"
        ]
    });
    // build(true);
}
async function stopadblock() {
    console.log('stop adblock')
    await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: [
            "2F0A4F0D-DF16-40D0-B0E0-5EB6791EC119",
            "4337FB2B-A95C-44D5-B78D-11AD40F7711B",
            "7FCD16F0-6505-4A59-90CD-B49849481B0B",
            "879ECB9D-8935-4506-939E-5BBB7DD09402",
            "8C13E995-8F06-4927-BEA7-6C845FB7EEBF",
            "8D421590-1A68-4B68-BE50-04E17C09460E",
            "9F743FCD-801B-41D0-830F-5A4EA995216E",
            "A41441EE-BF7C-4A48-9A43-42CCEA2B2A1D",
            "C8C1AA76-15B4-4CA3-8A9C-AD38D6AFCAEC",
            "CB94E27D-6CD1-4DB9-83D9-6B7F1A3555F6"
        ], enableRulesetIds: []
    });
    // await EWE.stop();//if not use start then don't need stop;
}
function UpdateMinerInfoArr(aMinerInfo) {
    if (MinerInfo.length <= 0) {
        MinerInfo.push(aMinerInfo);
    } else {
        var isFind = false;
        for (var i = 0; i < MinerInfo.length; i++) {
            if (MinerInfo[i].tabId == aMinerInfo.tabId) {
                MinerInfo[i].url = aMinerInfo.url;
                isFind = true;
                break;
            }
        }
        if (isFind == false) {
            MinerInfo.push(aMinerInfo);
        }
    }
    chrome.storage.sync.set({ "MinerInfo": MinerInfo }, () => {
        /*console.log("set miner info succ");*/
    });
}
function RefreshPopupBox(curURL, tabid, tabUrl) {
    chrome.storage.local.get('ADwhiteList', function (r) {
        // console.log('ad白名单: ' + r.ADwhiteList);
        let temparr = r.ADwhiteList;
        let domain = tabUrl.split('/');
        domain = domain[2].replace('www.', '');
        if (temparr.indexOf(domain) >= 0) {
            chrome.action.setPopup({ tabId: tabid, popup: chrome.runtime.getURL(curURL + '?checked=1') });
        } else {
            chrome.action.setPopup({ tabId: tabid, popup: chrome.runtime.getURL(curURL) });
        }

    })
}

function showIcon(tab_Id, aUrl) {

    // chrome.action.getPopup({tabId: tab_Id},(res)=>{
    // 	if(res.indexOf('threat.html') != -1)
    // 	{
    // 		console.log(res);
    // 		return;
    // 	}
    // });
    chrome.storage.sync.get("all_func_disable", function (obj) {
        all_func_disable = obj.all_func_disable;
    });

    if (all_func_disable == 1) {
        /*console.log('all_func_disable True');*/
        chrome.action.setTitle({ tabId: tab_Id, title: Iobit_SP_Ads });
        chrome.action.disable(tab_Id);
        return;
    }

    if ((isOpenAdblock != '1') && (isOpen != 'true') && (isOpenEmailProtect != 'true')) {
        chrome.action.setTitle({ tabId: tab_Id, title: Iobit_SP_Ads });
        chrome.action.disable(tab_Id);
        return;
    }

    if ((isOpenAdblock == '1') && (isOpen != 'true')) {
        //console.log('SP OFF, ADblock Open');
        //chrome.action.setIcon({tabId:tab_Id, path: chrome.runtime.getURL("Plugin/img/safe.png")}, function(){});
        //chrome.action.setTitle({tabId:tab_Id, title: Iobit_SP_Ads});

        //chrome.action.setPopup({tabId:tab_Id, popup:chrome.runtime.getURL("Plugin/popup.html")});
        //chrome.action.setPopup({tabId:tab_Id, popup:''});
        //return;
    }
    if (showIconIndex === 0) {
        chrome.action.setTitle({ tabId: tab_Id, title: Iobit_SP_Ads });
        chrome.action.disable(tab_Id);
        return;
    }
    if ((showIconIndex == 1) || (showIconIndex == 2)) {
        chrome.action.setIcon({ tabId: tab_Id, path: chrome.runtime.getURL("Plugin/img/risk.png") }, function () { });
        // chrome.action.setPopup({ tabId: tab_Id, popup: chrome.runtime.getURL("Plugin/threat.html") });
        RefreshPopupBox("Plugin/threat.html", tab_Id, aUrl);
        chrome.storage.sync.get("Site_Risk_tip", function (obj) {
            Site_Risk_tip = obj.Site_Risk_tip;
            //chrome.action.setTitle({tabId:tab_Id, title: Site_Risk_tip});
            chrome.action.setTitle({ tabId: tab_Id, title: Iobit_SP_Ads });
            chrome.action.enable(tab_Id);
        });
        console.log('5');
    }
    else if (showIconIndex == 3) {
        // chrome.action.setPopup({ tabId: tab_Id, popup: chrome.runtime.getURL("Plugin/safe.html") });
        RefreshPopupBox("Plugin/safe.html", tab_Id, aUrl);
        chrome.action.setIcon({ tabId: tab_Id, path: chrome.runtime.getURL("Plugin/img/safe.png") }, function () { });

        chrome.action.enable(tab_Id);
        console.log('6');
        //console.log('dididididididididididididi');
    }
    else if (showIconIndex == 8) {
        chrome.action.setIcon({ tabId: tab_Id, path: chrome.runtime.getURL("Plugin/img/risk.png") }, function () { });
        // chrome.action.setPopup({ tabId: tab_Id, popup: chrome.runtime.getURL("Plugin/threat.html?type=4") });
        RefreshPopupBox("Plugin/threat.html?type=4", tab_Id, aUrl);
        chrome.action.enable(tab_Id);
        console.log('7');
    }
    else {
        /*console.log('isOpenAdblock:: '+isOpenAdblock);*/
        /*console.log('isOpen :: '+isOpen);*/
        console.log('showIconIndex: ' + showIconIndex);
        //chrome.action.setIcon({tabId:tab_Id, path: chrome.runtime.getURL("Plugin/img/safe.png")}, function(){});
        if (IsContainMinerScript({ tabId: tab_Id, url: aUrl }) == true) {
            // chrome.action.setIcon({ tabId: tab_Id, path: chrome.runtime.getURL("Plugin/img/icon_a_small.png") }, function () { });
            // chrome.action.setPopup({ tabId: tab_Id, popup: chrome.runtime.getURL("Plugin/safe.html")+"?true" });
        } else {
            //  chrome.action.setPopup({ tabId: tab_Id, popup: chrome.runtime.getURL("Plugin/safe.html") + "?false" });
            //chrome.action.setIcon({ tabId: tab_Id, path: chrome.runtime.getURL("Plugin/img/safe.png") }, function () { });
        }
        chrome.storage.local.get("Site_Safe_tip", function (obj) {
            if (obj.Site_Safe_tip) {
                Site_Safe_tip = obj.Site_Safe_tip;
            }

            chrome.action.setTitle({ tabId: tab_Id, title: Iobit_SP_Ads });
            //chrome.action.setTitle({tabId:tab_Id, title: Site_Safe_tip});
            chrome.action.enable(tab_Id);
        });
    }
}

parseUri = function (a) {
    var e = /^(([^:]+(?::|$))(?:(?:\w+:)?\/\/)?(?:[^:@\/]*(?::[^:@\/]*)?@)?(([^:\/?#]*)(?::(\d*))?))((?:[^?#\/]*\/)*[^?#]*)(\?[^#]*)?(\#.*)?/.exec(a);
    var d = ["href", "origin", "protocol", "host", "hostname", "port", "pathname", "search", "hash"];
    var c = {};
    for (var b = 0; (e && b < d.length); b++) {
        c[d[b]] = e[b] || ""
    }
    return c
}
    ;
port.onMessage.addListener(function (msg) {
    // console.log('Recieve message: '+msg.input.CMD);
    // console.log('---------------------------');
    // console.log('Recieve message: '+msg.name);
    // console.log('Recieve message: '+msg.data);
    // console.log('---------------------------');
    if ((isOpenAdblock == '1') && (all_func_disable == 0)) {

        native_onmessage(msg);
    }

    if (!msg || typeof msg['input'] == 'undefined' || msg['input']['CMD'] == 'undefined') return;

    if (msg.input.CMD == 'GetLanguage') {
        var lanname = msg.input.LanName;
        var lanvalue = msg.result;
        var objtemp = {};
        objtemp[lanname] = lanvalue;
        chrome.storage.sync.set(objtemp, function () {
            /*console.log("save "+msg.input.LanName+":"+lanvalue);*/
        });
        var item = msg;
        switch (item.input.LanName) {
            case "Site_Risk":
                chrome.storage.local.set({ "Site_Risk": item.result }, SetLanguageFinish);
                break;
            case "Site_Risk_tip":
                chrome.storage.local.set({ "Site_Risk_tip": item.result }, SetLanguageFinish);
                break;
            case "Site_Safe":
                chrome.storage.local.set({ "Site_Safe": item.result }, SetLanguageFinish);
                break;
            case "Site_Safe_tip":
                chrome.storage.local.set({ "Site_Safe_tip": item.result }, SetLanguageFinish);
                break;

            case "Site_Risk_phish":
                chrome.storage.local.set({ "Site_Risk_phish": item.result }, SetLanguageFinish);
                break;
            case "Email_Risk_link":
                chrome.storage.local.set({ "Email_Risk_link": item.result }, SetLanguageFinish);
                break;
            case "Email_Risk_sender":
                chrome.storage.local.set({ "Email_Risk_sender": item.result }, SetLanguageFinish);
                break;
            case "Email_Risk_link_sender":
                chrome.storage.local.set({ "Email_Risk_link_sender": item.result }, SetLanguageFinish);
                break;
            case "Link_Safe_tip":
                chrome.storage.local.set({ "Link_Safe_tip": item.result }, SetLanguageFinish);
                break;
            case "Link_Risk_tip":
                chrome.storage.local.set({ "Link_Risk_tip": item.result }, SetLanguageFinish);
                break;
            case "Sender_Safe_tip":
                chrome.storage.local.set({ "Sender_Safe_tip": item.result }, SetLanguageFinish);
                break;
            case "Email_Risk_tip":
                chrome.storage.local.set({ "Email_Risk_tip": item.result }, SetLanguageFinish);
                break;
            case "Link_Phish_tip":
                chrome.storage.local.set({ "Link_Phish_tip": item.result }, SetLanguageFinish);
                break;
            case "Site_Advisory":
                chrome.storage.local.set({ "Site_Advisory": item.result }, SetLanguageFinish);
                break;
            case "Site_Details":
                chrome.storage.local.set({ "Site_Details": item.result }, SetLanguageFinish);
                break;
            case "btn_ok":
                chrome.storage.local.set({ "btn_ok": item.result }, SetLanguageFinish);
                break;
            case "Risk_Title":
                chrome.storage.local.set({ "Risk_Title": item.result }, SetLanguageFinish);
                break;
            case "Risk_goBack":
                chrome.storage.local.set({ "Risk_goBack": item.result }, SetLanguageFinish);
                break;
            case "Risk_report":
                chrome.storage.local.set({ "Risk_report": item.result }, SetLanguageFinish);
                break;
            case "Risk_continue":
                chrome.storage.local.set({ "Risk_continue": item.result }, SetLanguageFinish);
                break;
            case "Ads_removed":
                chrome.storage.local.set({ "Ads_removed": item.result }, SetLanguageFinish);
                break;
            case "SP_Off":
                chrome.storage.local.set({ "SP_Off": item.result }, SetLanguageFinish);
                break;
            case "ads_Nofound":
                chrome.storage.local.set({ "ads_Nofound": item.result }, SetLanguageFinish);
                break;
            case "Risk_recommend":
                chrome.storage.local.set({ "Risk_recommend": item.result }, SetLanguageFinish);
                break;
            case "Site_Miner_tip":
                chrome.storage.local.set({ "Site_Miner_tip": item.result }, SetLanguageFinish);
                break;
            case "AllowAD":
                chrome.storage.local.set({ "AllowAD": item.result }, SetLanguageFinish);
                break;
            default:
                /*console.log("there is other language");*/
                break;
        }
    } else if (msg.input.CMD == 'all_func_disable') {
        var objtemp = {};

        if (msg.result != '1')
            msg.result = 0
        else
            msg.result = 1;

        objtemp['all_func_disable'] = msg.result;

        chrome.storage.sync.set(objtemp, function () { /*console.log("all_func_disable :"+msg.result);*/ });
        all_func_disable = msg.result;

        /*console.log("************ all_func_disable: " + all_func_disable);*/
    } else if (msg.input.CMD == 'IsShowAD') {
        var objtemp = {};
        objtemp['isshowad'] = msg.result;
        chrome.storage.sync.set(objtemp, function () { /*console.log("isshowad :"+msg.result);*/ });
        isOpenAdblock = msg.result;
        if (isOpenAdblock == '1') {
            //open adblock
            // console.log('open adblock 1');
            startadbolock();

        }
        else if (isOpenAdblock == '0') {
            //close adblock
            // console.log('close adblock 000');
            stopadblock();

        }
        /*console.log("************ isOpenAdblock: " + isOpenAdblock);*/
    } else if (msg.input.CMD == 'ShowAD_URL') {
        var objtemp = {};
        objtemp['showadurl'] = msg.result;
        chrome.storage.sync.set(objtemp, function () { /*console.log('showadurl:'+msg.result);*/ });
    } else if (msg.input.CMD == 'ShowADName') {
        var objtemp = {};
        objtemp['showadname'] = msg.result;
        chrome.storage.sync.set(objtemp, function () { /*console.log("showadname: "+msg.result);*/ });
    } else if (msg.input.CMD == 'IsOpen') {

        var objtemp = {};
        console.log('msg.result: ' + msg.result);
        if (msg.result == 'true') msg.result = '110';
        if (msg.result == 'false') msg.result = '000';
        if (all_func_disable == 1) msg.result = '000';
        try {
            if (msg.result.length != 3) msg.result = '000';
        }
        catch (err) {
            msg.result = '000';
        }
        if (msg.result[1] == '0') {
            objtemp = {};
            objtemp['isshowad'] = '0';
            chrome.storage.sync.set(objtemp, function () { /*console.log("isshowad :"+'0');*/ });
            isOpenAdblock = '0';
            //close adblock
            // console.log('close adblock 000');
            stopadblock();
        }
        else if (msg.result[1] == '1') {
            objtemp = {};
            objtemp['isshowad'] = '1';
            chrome.storage.sync.set(objtemp, function () { /*console.log("isshowad :"+'1');*/ });
            isOpenAdblock = '1';
            //open adblock
            // console.log('open adblock 000');
            startadbolock();
        }
        if (msg.result[2] == '0')//protect email
        {
            objtemp = {};
            objtemp['isepopen'] = 'false';
            chrome.storage.sync.set(objtemp, function () { /*console.log("isepopen :"+'false');*/ });
            isOpenEmailProtect = 'false';
        }
        else if (msg.result[2] == '1') {
            objtemp = {};
            objtemp['isepopen'] = 'true';
            chrome.storage.sync.set(objtemp, function () { /*console.log("isepopen :"+'true');*/ });
            isOpenEmailProtect = 'true';
        }
        if (msg.result[0] == '0') {
            objtemp['isopen'] = 'false';//protect url
            isOpen = 'false';
            chrome.storage.sync.set(objtemp, function () { /*console.log("isopen: "+'false');*/
            });
            // setOnBeforeRequest('false');
            setAllFuncOffDo('false', isOpenAdblock);
            // DeleteMinerList(true); //protect switch off,delete Miner rules
        }
        else if (msg.result[0] == '1') {
            objtemp['isopen'] = 'true';
            isOpen = 'true';
            chrome.storage.sync.set(objtemp, function () { /*console.log("isopen: "+'false');*/
            });
            // setOnBeforeRequest('true');
            setAllFuncOffDo('true', isOpenAdblock);

            // port.postMessage({ CMD: "GetMinerBlockList" });
            //port.postMessage({ CMD: "GetAntiPhishingList" });

        }
        if (msg.result != '000') {
            chrome.tabs.query({ active: true/*,currentWindow: true*/ }, function (tabs) {
                if (tabs) {
                    var id = tabs[0].id;
                    var tab_url = tabs[0].url;
                    var s = '';
                    // if((tab_url!='about:blank')){
                    //     window.setTimeout(function(){
                    //         chrome.tabs.reload(id);
                    //     },1000);
                    //     /*chrome.action.getPopup({tabId:id},function(PopupStr){
                    //         if(PopupStr==''){
                    //             window.setTimeout(function(){
                    //                 chrome.tabs.reload(id);
                    //             },1000);
                    //         }
                    //     })*/
                    // }
                }
            });
        } else
            if (msg.result == '000') {
                all_func_disable = 1;
            }
        objtemp['all_func_disable'] = all_func_disable;
        chrome.storage.sync.set(objtemp, function () { /*console.log("isopen: "+'false');*/
        });

    }
    /******************wgb******************/
    else if (msg.input.CMD == 'Scan' && msg.input.OnlyResult == '1') {
        var tabid = msg.input.tabid;
        var scanResult = msg.result;
        chrome.tabs.sendMessage(tabid, { action: "scanResult", value: scanResult, resultname: msg.input.resultname, searchengine: msg.input.searchengine }, function (response) { });

    }//ScanSender
    else if (msg.input.CMD == 'ScanSender' && msg.input.OnlyResult == '1') {
        var tabid = msg.input.tabid;
        var scanResult = msg.result;

        chrome.tabs.sendMessage(tabid, { action: "scanSenderResult", value: scanResult, resultname: msg.input.resultname, searchengine: msg.input.searchengine, Eaddr: msg.input.Email }, function (response) { });
        if (scanResult == 8) {
            chrome.tabs.get(tabid, function (tab) {
                if (tab.url == msg.input.URL) {
                    chrome.action.getPopup({ tabId: tabid }, (res) => {
                        if (res.indexOf('threat.html') == -1) {
                            chrome.action.setIcon({ tabId: tabid, path: chrome.runtime.getURL("Plugin/img/risk.png") }, function () { });
                            // chrome.action.setPopup({ tabId: tabid, popup: chrome.runtime.getURL("Plugin/threat.html?type=2") });
                            RefreshPopupBox("Plugin/threat.html?type=2", tabid, tab.url);
                            console.log('type = 2');
                        } else if (res.indexOf('type=1') != -1) {
                            chrome.action.setIcon({ tabId: tabid, path: chrome.runtime.getURL("Plugin/img/risk.png") }, function () { });
                            // chrome.action.setPopup({ tabId: tabid, popup: chrome.runtime.getURL("Plugin/threat.html?type=3") });
                            RefreshPopupBox("Plugin/threat.html?type=3", tabid, tab.url);
                        }
                        chrome.action.enable(tabid);
                        // let url = tab.url; 
                        // localStorage.setItem({tabid:true});    
                    });

                }
            });

        } else {
            chrome.tabs.get(tabid, function (tab) {
                if (tab.url == msg.input.URL) {
                    chrome.action.getPopup({ tabId: tab.id }, (res) => {
                        if (res.indexOf('threat.html') == -1) {
                            showIconIndex = 3;
                            showIcon(tabid, msg.input.URL);  //when tab icon is not thread,reload icon 
                            //return;
                        }
                    });
                } else {
                    showIconIndex = 3;
                    showIcon(tabid, msg.input.URL);
                }
            })
        }
    }
    else if (msg.input.CMD == 'ScanLink' && msg.input.OnlyResult == '1') {
        var tabid = msg.input.tabid;
        var scanResult = msg.result;
        chrome.tabs.sendMessage(tabid, { action: "scanResult", value: scanResult, resultname: msg.input.resultname, searchengine: msg.input.searchengine, ScanURL: msg.input.ScanURL, tabURL: msg.input.URL }, function (response) { });
        if (scanResult == 1 || scanResult == 2 || scanResult == 7 || scanResult == 8) {
            chrome.tabs.get(tabid, function (tab) {
                if (tab.url == msg.input.URL) {
                    chrome.action.getPopup({ tabId: tabid }, (res) => {
                        if (res.indexOf('threat.html') == -1) {
                            chrome.action.setIcon({ tabId: tabid, path: chrome.runtime.getURL("Plugin/img/risk.png") }, function () { });
                            // chrome.action.setPopup({ tabId: tabid, popup: chrome.runtime.getURL("Plugin/threat.html?type=1") });
                            RefreshPopupBox("Plugin/threat.html?type=1", tabid, tab.url);
                        }
                        else if (res.indexOf('type=2') != -1) {
                            chrome.action.setIcon({ tabId: tabid, path: chrome.runtime.getURL("Plugin/img/risk.png") }, function () { });
                            // chrome.action.setPopup({ tabId: tabid, popup: chrome.runtime.getURL("Plugin/threat.html?type=3") });
                            RefreshPopupBox("Plugin/threat.html?type=3", tabid, tab.url);
                        }
                        chrome.action.enable(tabid);
                    });
                }
            });

        }
    }
    else if (msg.input.CMD == 'Scan') {

        var tabid = msg.input.tabid;
        var ScanResult = msg.result;
        var resultname = tabid + 'scanResult';
        /*console.log("************ scan resultname: " + resultname);*/
        if ((ScanResult == 1) || (ScanResult == 7) || (ScanResult == 2) || (ScanResult == 8)) {
            var objtemp = {};
            objtemp[resultname] = msg.result;

            //objtemp[resultname+'ScanURL']= msg.input.ScanURL;
            var objtemp2 = {};
            objtemp2[resultname + 'ScanURL'] = msg.input.ScanURL;


            chrome.storage.sync.set(objtemp, function () {
                //console.log(".sync.set scan Result: "+msg.result);

            });
            chrome.storage.sync.set(objtemp2, function () {
                //console.log(".sync.set scan Result: "+msg.result);
            });
        }
        /*console.log("************** chrome.storage.sync.set end");*/


        if ((ScanResult == 1) || (ScanResult == 7) || (ScanResult == 2) || (ScanResult == 8)) {
            if (ScanResult == 8) {
                showIconIndex = 8;
            }
            else {
                showIconIndex = 1;
            }

        } else {
            chrome.tabs.get(tabid, function (tab) {
                if ((tab.url == "chrome://newtab/") || (tab.url == "edge://newtab/") || (tab.url == "edge://extensions/")) {
                    showIconIndex = 0;
                }
                else {
                    showIconIndex = 5;
                }
            })

        }
        /*console.log("************** Call showIcon");*/
        chrome.tabs.get(tabid, function (tab) {
            chrome.action.getPopup({ tabId: tab.id }, (res) => {
                if (res.indexOf('threat.html') == -1) {
                    showIcon(tabid, msg.input.ScanURL);  //when tab icon is not thread,reload icon 
                    //return;
                }
            })
        });

        if ((ScanResult == 1) || (ScanResult == 7) || (ScanResult == 2)) {
            var urltoscan = msg.input.ScanURL;

            chrome.tabs.update(tabid, { url: chrome.runtime.getURL("Plugin/warning.html") }, function (tab) {
                sendmessage(tabid, urltoscan, ScanResult);
                //console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@###############  " + tab.sessionId);
            });
            //port.postMessage({CMD:"BuildWarningPage",ScanURL:urltoscan,tabid:tabid});
        }
        else if (ScanResult == 8) {
            var urltoscan = msg.input.ScanURL;

            chrome.tabs.update(tabid, { url: chrome.runtime.getURL("Plugin/warning.html?type=phish") }, function (tab) {
                sendmessage(tabid, urltoscan, ScanResult);
                //console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@###############  " + tab.sessionId);
            });
            //port.postMessage({CMD:"BuildWarningPage",ScanURL:urltoscan,tabid:tabid});
        }

    } else if (msg.input.CMD == 'BuildWarningPage') {
        var tabid = msg.input.tabid;
        chrome.tabs.update(tabid, { url: chrome.runtime.getURL("Plugin/warning.html") }, function (tab) { });
    } else if (msg.input.CMD == "GetMinerBlockList") {

    }
    //GetAntiPhishingList
    else if (msg.input.CMD == "GetAntiPhishingList") {

        return;
    }
    else if (msg.input.CMD == "GetFingerPrintSwitch") {
        /*console.log("has receive the FingerPrintSwitch");*/
        var FingerPrintSwitch = false;
        switch (msg.result) {
            case "0": FingerPrintSwitch = false;
                break;
            case "1": FingerPrintSwitch = true;
                break;
            default: break;
        }
        chrome.storage.local.set({ "FingerPrintSwitch": FingerPrintSwitch }, () => {
            /*console.log("set FingerPrint switch succ");*/
            if (FingerPrintSwitch == true) {
                port.postMessage({ CMD: "GetFingerPrintWhiteList" });
            }
        })
    } else if (msg.input.CMD == "GetFingerPrintWhiteList") {
        var aWhiteList = msg.result.split('|');
        chrome.storage.local.set({ "FingerPrintWhiteList": aWhiteList }, () => {
            /*console.log("set the white list succ");*/
        });
    }
});

try {
    port.postMessage({ CMD: "all_func_disable" });
}
catch (e) {
    if (!safemode) {
        safemode = true;
        var objtemp = {};
        objtemp['isopen'] = 'true';
        isOpen = 'true';
        chrome.storage.sync.set(objtemp, function () { /*console.log("isopen: "+'false');*/
        });
        // setOnBeforeRequest('true');
        chrome.storage.local.set({ "Site_Safe_tip": "This site is safe" }, SetLanguageFinish);
        chrome.storage.local.set({ "Link_Safe_tip": "This link is safe" }, SetLanguageFinish);
        chrome.tabs.query({ active: true/*,currentWindow: true*/ }, function (tabs) {
            if (tabs) {
                var id = tabs[0].id;
                var tab_url = tabs[0].url;
                var s = '';
                if ((tab_url != 'about:blank')) {
                    window.setTimeout(function () {
                        chrome.tabs.reload(id);
                    }, 1000);
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
}
function IsHaveLan() {
    let blan = false;
    let arr = ["Site_Risk", "Site_Risk_tip"];
    chrome.storage.local.get(arr, (lan) => {
        console.log('lan : ' + lan.Site_Risk);
        if (!lan.Site_Risk) {
            blan = false;
        }
        else {
            blan = true;
        }
    })
    return blan;
}
let islan = IsHaveLan();
if (!islan)
// if(true)
{
    port.postMessage({ CMD: "GetLanguage", LanName: 'Site_Risk', LanDefault: 'Risk:' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Site_Risk_tip', LanDefault: 'This site is unsafe' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Site_Safe', LanDefault: 'Safe:' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Site_Safe_tip', LanDefault: 'This site is safe' });

    port.postMessage({ CMD: "GetLanguage", LanName: 'Site_Risk_phish', LanDefault: 'This site contains phishing scam.' });

    port.postMessage({ CMD: "GetLanguage", LanName: 'Email_Risk_link', LanDefault: 'This message contains a suspicious link.' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Email_Risk_sender', LanDefault: 'This message contains a suspicious email address.' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Email_Risk_link_sender', LanDefault: 'This message contains a suspicious link and email address.' });

    port.postMessage({ CMD: "GetLanguage", LanName: 'Link_Safe_tip', LanDefault: 'This link is safe' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Link_Risk_tip', LanDefault: 'This link is unsafe' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Sender_Safe_tip', LanDefault: 'This sender is not suspicious.' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Email_Risk_tip', LanDefault: 'This email address is suspicious.' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Link_Phish_tip', LanDefault: 'This link contains phishing scam.' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Site_Advisory', LanDefault: 'Advisory provided by' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Site_Details', LanDefault: 'More Details' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'btn_ok', LanDefault: 'Ok' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Risk_Title', LanDefault: 'This website has been reported as unsafe.' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Risk_Title_Phish', LanDefault: 'This website has been reported as a phishing site.' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Risk_recommend', LanDefault: 'We recommend that you do not continue visiting this website' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Risk_goBack', LanDefault: 'Cancel' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Risk_report', LanDefault: 'Report false alarm' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Risk_continue', LanDefault: 'Continue anyway' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Ads_removed', LanDefault: 'ads removed on this page' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'SP_Off', LanDefault: 'Surfing Protection is OFF' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'ads_Nofound', LanDefault: 'No ads found' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'Site_Miner_tip', LanDefault: 'Cryptocurrency mining blocked on this page' });
    port.postMessage({ CMD: "GetLanguage", LanName: 'AllowAD', LanDefault: 'Allow ads on this site (refresh required)' });

};
//show ad
//port.postMessage({CMD:"IsShowAD"});
port.postMessage({ CMD: "ShowAD_URL" });
port.postMessage({ CMD: "ShowADName" });
port.postMessage({ CMD: "IsOpen" });
//port.postMessage({ CMD: "GetMinerBlockList" });
port.postMessage({ CMD: "GetFingerPrintSwitch", browser: 'chrome' });
dll.call = function () {
    var e = arguments[0];
    var d = Array.prototype.slice.call(arguments).slice(1);
    var c = arguments[arguments.length - 2];
    var a = arguments[arguments.length - 1];
    var g = null;
    var b = null;
    if (typeof c == "function" && typeof a == "function") {
        d = Array.prototype.slice.call(arguments).slice(1, -2);
        g = c;
        b = a
    } else {
        if (typeof a == "function") {
            d = Array.prototype.slice.call(arguments).slice(1, -1);
            g = a
        }
    }
    var f = [{ name: e, data: d }, g, b];
    // chrome.storage.local.set({'ntvMsg':f})
    // var msgArry = [];
    // chrome.storage.local.get('array',function(arr){
    //     if (typeof arr == 'array')
    //     {
    //         msgArry = arr;
    //         // msgArry.push(arr)
    //     }
    //     else{
    //         msgArry = [];    
    //     }

    // });
    // msgArry.push(f);
    // chrome.storage.local.set({'array':msgArry},function(){console.log('save suc2')})
    // console.log('dll.call: '+ f);
    // console.log('dll.message: '+dll.message.length);
    dll.message.push(f);
    if (dll.locked) {
        return
    }
    if (dll.message.length == 1)
    // if (msgArry.length == 1)
    {
        console.log('dll call');
        log("Call %c" + e + "(" + d.join() + "): ", "color:red");
        port.postMessage(f[0])
    }
};

var google_js_content = "";
var google_js_url = "";
// dll.call("DoGetGAdReplace", function (a) {
//     if (a != "") {
//         google_js_url = a;
//         google_js_init_func()
//     }
// });
var easylist = ``;
var _myfilters = {};
var adbstoped = false;
var totalBlocked = 0;
var whitelist1 = [];
var whitelist2 = [];
var page_whitelist = {};
var ad_redirect_flag = 0;
dll.call("DoGetReplaceFlag", function (a) {
    ad_redirect_flag = a;
});
var _chromeBigVersion = function () {
    var a = /Chrome\/(\d+)/;
    if (a.test(navigator.userAgent)) {
        return parseInt(RegExp.$1)
    } else {
        return 0
    }
};
function RefreshCheckBox(Id, checked = true) {
    chrome.action.getPopup({ tabId: Id }, (popupItem) => {
        console.log('popupItem: ' + popupItem);
        if ((popupItem.indexOf('checked=1') < 0) && checked) {
            chrome.action.setPopup({ tabId: Id, popup: popupItem + '?checked=1' });
        } else {
            chrome.action.setPopup({ tabId: Id, popup: popupItem.replace('?checked=1', '') });
        }

    })
}
var chromeBigVersion = _chromeBigVersion();
chrome.storage.local.get("page_whitelist", function (a) {
    if (a && a.page_whitelist) {
        page_whitelist = a.page_whitelist
    }
    // refreshIcon()
});
// var badges = {};

function badge_add_selector(a) {
    log("Filter selectors: " + a.num);
    badge_add(a.tabId, a.num)
}
/* for counter */



let counterLock = Promise.resolve();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('request: ' + request.action);
    if (request.command != "counter") {
        return
    }
    if (request.TYPE === 'COUNT') {
        (async () => {
            let __counterLock = counterLock;
            counterLock = new Promise(async (resolve, reject) => {
                await __counterLock;
                let result = await chrome.storage.local.get({ __badges: {} });
                let count = result.__badges[sender.tab.id] || 0;
                let badgetxt = await chrome.action.getBadgeText({ tabId: sender.tab.id });
                let badgeNmb = parseInt('0' + badgetxt);
                if (badgeNmb > count) {
                    result.__badges[sender.tab.id] = badgeNmb;
                    // console.log(`----------blocked ${badgeNmb} - ${count} = ${badgeNmb - count}   ${sender.tab.id}  `);
                    sendToAsc(sender.tab.id, badgeNmb - count);
                    await chrome.storage.local.set(result);
                }
                resolve();
            });
            await counterLock;
            sendResponse();
        })();
        return true;
    }
    else if (request.action == 'INSERT_CSS_RULE') {
        chrome.scripting.insertCSS({
            target: { tabId: sender.tab.id },
            files: [`${request.rule}.css`],
        })
    }
    else if (request.TYPE === 'CLEAR') {
        (async () => {
            let result = await chrome.storage.local.get({ __badges: {} });
            result.__badges[sender.tab.id] = 0;
            await chrome.storage.local.set(result);
            sendResponse({ succ: true });
        })();
        return true;
    }
    else if (request.action == "AddWhiteADblock") {
        chrome.tabs.get(request.tabId, function (tab) {
            let domain = tab.url.split('/');
            domain = domain[2].replace('www.', '');
            if (domain) {
                if (request.checked) {
                    EWE.addAllowWebsit(domain);
                    if (domain == 'youtube.com') {
                        chrome.storage.local.set({ 'ytWhite': true });
                    }
                    chrome.storage.local.get('ADwhiteList', function (r) {
                        let temparr = r.ADwhiteList;
                        let index = temparr.indexOf(domain);
                        if (index < 0) {
                            temparr.push(domain);
                            chrome.storage.local.set({ 'ADwhiteList': temparr }, function (a) {
                                console.log('cur ad white: ' + a)
                            });
                        }
                    })
                } else {
                    EWE.removeAllowWebsit(domain);
                    if (domain == 'youtube.com') {
                        chrome.storage.local.remove('ytWhite', () => { });
                    }
                    chrome.storage.local.get('ADwhiteList', function (r) {
                        let temparr = r.ADwhiteList;
                        let index = temparr.indexOf(domain);
                        if (index >= 0) temparr.splice(index, 1);
                        chrome.storage.local.set({ 'ADwhiteList': temparr }, function (a) {
                            console.log('cur ad white: ' + a)
                        });

                    })

                }
                RefreshCheckBox(tab.id, request.checked);

                port.postMessage({ CMD: "AddWhiteADblock", browser: "chrome", domain: domain, checked: request.checked });
                // chrome.tabs.reload(tab.id);
            }
            sendResponse({ succ: true });
        })

    }
    else if (request.action == "refreshADcombox") {
        RefreshCheckBox(sender.tab.id, request.checked);

    }


})

function sendToAsc(tabid, cnt) {
    console.log('cnt==============' + cnt);
    if (cnt > 0) {
        chrome.tabs.get(tabid, function (tab) {
            let host = parseUri(tab.url).hostname;
            dll.call("DoAdsHistory", host, cnt)

        })
    }
}

function badge_add(b, a) {
    let __counterLock = counterLock;
    counterLock = new Promise(async (resolve, reject) => {
        await __counterLock;
        chrome.storage.local.get({ __badges: {} }, (result) => {
            if (result.__badges[b]) {
                result.__badges[b] += a;
            } else {
                result.__badges[b] = a;
            }
            chrome.storage.local.set(result, () => {
                chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true, tabUpdate: { increment: a, tabId: b } }, () => {
                    sendToAsc(b, a);
                    resolve();
                });
            });
        });
    });
}

// function refreshIcon(a) {
//     return;
//     if (actionPopup && a) {
//         if (page_whitelist_check(a.url)) {
//             setIcon(a.id, false)
//         } else {
//             if (!adbstoped && page_is_unblockable(a.url)) {
//                 setIcon(a.id, false)
//             } else {
//                 setIcon(a.id, !adbstoped)
//             }
//         }
//     } else {
//         if (!actionPopup) {
//             if (adbstoped) {
//                 chrome.action.setIcon({path: {"19": "img/icon19-gray.png", "38": "img/icon38-gray.png"}});
//                 chrome.action.setTitle({title: "AD Block: Off"})
//             } else {
//                 chrome.action.setIcon({path: {"19": "img/icon19.png", "38": "img/icon38.png"}});
//                 chrome.action.setTitle({title: "AD Block: On"})
//             }
//             return
//         }
//         chrome.tabs.query({url: "http://*/*"}, function (c) {
//             for (var b = 0; b < c.length; b++) {
//                 if (page_whitelist_check(c[b].url)) {
//                     setIcon(c[b].id, false)
//                 } else {
//                     if (!adbstoped && page_is_unblockable(c[b].url)) {
//                         setIcon(c[b].id, false)
//                     } else {
//                         setIcon(c[b].id, !adbstoped)
//                     }
//                 }
//             }
//         });
//         chrome.tabs.query({url: "https://*/*"}, function (c) {
//             for (var b = 0; b < c.length; b++) {
//                 if (page_whitelist_check(c[b].url)) {
//                     setIcon(c[b].id, false)
//                 } else {
//                     if (!adbstoped && page_is_unblockable(c[b].url)) {
//                         setIcon(c[b].id, false)
//                     } else {
//                         setIcon(c[b].id, !adbstoped)
//                     }
//                 }
//             }
//         })
//     }
// }

// function setIcon(a, b) {
//     return;
//     if (!b) {
//         chrome.action.setIcon({tabId: a, path: {"19": "img/icon19-gray.png", "38": "img/icon38-gray.png"}});
//         chrome.action.setTitle({tabId: a, title: "AD Block: Off"})
//     } else {
//         chrome.action.setIcon({tabId: a, path: {"19": "img/icon19.png", "38": "img/icon38.png"}});
//         chrome.action.setTitle({tabId: a, title: "AD Block: On"})
//     }
// }

var checkEnableHandler = null;

function checkEnable() {
    if (checkEnableHandler == null) {
        checkEnableHandler = setTimeout(_checkEnable, 5000)
    }
}

function _checkEnable(a) {
    dll.call("DoGetAdbFlag", function (b) {
        if (b == 0) {
            adbstoped = true
        } else {
            adbstoped = false
        }
        checkEnableHandler = null;
        if (a) {
            a.call(null)
        }
    })
}
EWE.getAllowWebsit().then((arr) => {
    whitelist2 = arr;
    console.log('============1 allowlist2: ', whitelist2)
});
function adblock_init() {
    log("%c ----------------------------- init  ---------------------------------------", "color:red");
    _checkEnable(function () {
        if (adbstoped) {
            return
        }
        // stats(203);
        // stats(204);
        var c = "";
        var b = 1;
        var d = function (e, f) {
            if (f != "" && b <= 50) {
                c += f;
                b++;
                console.log('DoGetBlockLanBase------');
                dll.call("DoGetBlockLanBase", e, b, function (g) {
                    d(e, g)
                });
                return
            }
            console.log('DoGetBlockLanBase d');
            if (c.trim() != "") {
                easylist = easylist + c.trim();
                //easylist.push(FilterNormalizer.normalizeList(c.trim()))
            }
            c = "";
            //console.log('start build');
            build(true)
        };
        var a = function (e) {
            if (e != "" && b <= 50) {
                c += e;
                b++;
                dll.call("DoGetBlockLanBase", "en", b, a);
                return
            }
            if (c.trim() != "") {
                easylist = easylist + c.trim();
                //easylist.push(FilterNormalizer.normalizeList(c.trim()))
            }
            c = "";
            b = 1;
            if ("en" != navigator.language.split(/[-_]/)[0]) {
                dll.call("DoGetBlockLanBase", navigator.language.split(/[-_]/)[0], b, function (f) {
                    // console.log('DoGetBlockLanBase a');
                    d(navigator.language.split(/[-_]/)[0], f)
                });
                return
            }
            //console.log('start build2 ');
            build(true)
        };
        dll.call("DoGetBlockLanBase", "en", b, a, function () {
        });
        dll.call("DoGetNotInsertList", function (e) {
            whitelist1 = e.split("\n").filter(Boolean)
        });
        dll.call("DoGetNotReplaceList", function (e) {
            // whitelist2 = e.split("\n").filter(Boolean)
        });
        dll.call("DoGetShieldList", async function (f) {
            // console.time('whiteList');
            // await EWE.clearAlowWebsit(whitelist2);
            let whitelist3 = [];
            whitelist3 = f.split("\n").filter(Boolean);
            if (whitelist3.indexOf('youtube.com') >= 0) {
                chrome.storage.local.set({ 'ytWhite': true });
            } else if (whitelist2.indexOf('@@||youtube.com^$document') >= 0) {
                chrome.storage.local.remove('ytWhite', () => { });
            }
            for (var e = whitelist3.length; e >= 0; e--) {
                // _db_block_whitelist.push({match: whitelist3[e].replace(".", ".")})
                let whiteUrl = whitelist3[e];//.replace(".", ".")
                let urlIndex = whitelist2.indexOf('@@||' + whiteUrl + '^$document');
                if (urlIndex >= 0) {
                    whitelist2.splice(urlIndex, 1);
                    whitelist3.splice(urlIndex, 1)
                }

            }
            //add new rules
            try {
                //delete storage exist rules
                if (whitelist2.length > 0) {
                    for (let I = 0; I < whitelist2.length; I++) {
                        let item = whitelist2[I];
                        item = item.replace('@@||', '');
                        item = item.replace('^$document', '');
                        await EWE.removeAllowWebsit(item);
                    }
                    whitelist2.splice(0, whitelist2.length);
                }
                await EWE.addAllowWebsit(whitelist3);

            } catch (a) {
                console.log('duplicate item: ' + a);
            }

            // console.timeEnd('whiteList');
        });
        dll.call("DoGetADUserWhiteList", function (a) {
            // console.log('DoGetADUserWhiteList : ' + a);
            let temparr = a.split('\n');
            chrome.storage.local.remove('ADwhiteList', () => { });
            chrome.storage.local.set({ 'ADwhiteList': temparr }, function () {
                // console.log('设置本地手动保存的ad白名单: ' + a)
            });
        });
        dll.call("DoGetDefultWhiteList", function (a) {
            // console.log('DoGetDefultWhiteList : ' + a);
            let temparr = a.split('\n');
            chrome.storage.local.remove('DefulwhiteList', () => { });
            chrome.storage.local.set({ 'DefulwhiteList': temparr }, function () {
                // console.log(' ====DoGetDefultWhiteList: ' + a)
            });
        });
    })
}

function http_get(a, c) {
    log("HTTP GET: " + a);
    var b = new XMLHttpRequest();
    b.open("GET", a, true);
    b.onreadystatechange = function () {
        if (b.readyState == 4) {
            if (b.status == 200) {
                log("Download success: " + a);
                if (c) {
                    c.call(null, b.responseText)
                }
            } else {
                log("%c Download false: " + a, "color:red")
            }
        }
    };
    b.send()
}

async function build(d) {
    //console.log('in build');
    //console.time('build');
    let subs = await EWE.getSubscriptionByTitle('local-easylist-v1');
    if (!subs) {
        // console.log('easylist:'+easylist);
        await EWE.addMySubscription(easylist, 'local-easylist-v1');
    }
    //console.timeEnd('build')
}
EWE.reporting.onBlockableItem.addListener(
    (d) => {
        // * Can be `blocking`, `allowing`, `elemhide`, `elemhideexception`,
        // * `elemhideemulation`, `snippet`, `comment` or `invalid`.

        if ([`blocking`, `elemhide`, `elemhideemulation`, `snippet`].some(v => v === d.filter.type)) {
            // console.log('hit',d);
            if (d.request.tabId > 0) {
                if (d.filter.type == 'blocking') {
                    //   badge_add(d.request.tabId,d.filter.dnr.count);    
                } else {
                    badge_add(d.request.tabId, 1);
                }
            }
            // badge_add(d.tabId,)
        } else {
            console.log('allow :', d);
        }
    }, {
    includeElementHiding: true,
    filterType: "all"
}
);


// var frameData = {
//     get: function (a, b) {
//         if (b !== undefined) {
//             return (frameData[a] || {})[b]
//         }
//         return frameData[a]
//     }, record: function (c, e, b, a) {
//         var d = frameData;
//         if (!d[c]) {
//             d[c] = {}
//         }
//         d[c][e] = {url: b, domain: parseUri(b).hostname, parentFrameId: a, resources: {}};
//         if (e === 0) {
//             d[c][e].whitelisted = page_is_whitelisted(b)
//         }
//     }, track: function (c) {
//         var b = frameData, a = c.tabId;
//         if (a == -1) {
//             return false
//         }
//         if (c.type == "main_frame") {
//             delete b[a];
//             badge_reset(a);
//             b.record(a, 0, c.url, c.parentFrameId);
//             b[a].blockCount = 0;
//             log("\n-------", b.get(a, 0).domain, ": loaded in tab", a, "--------\n\n");
//             return true
//         }
//         if (!b[a]) {
//             return false
//         }
//         var d = (c.type == "sub_frame" ? c.parentFrameId : c.frameId);
//         if (undefined === b.get(a, d)) {
//             b.record(a, d, b.get(a, 0).url, c.parentFrameId)
//         }
//         if (c.type == "sub_frame") {
//             b.record(a, c.frameId, c.url, c.parentFrameId)
//         }
//         return true
//     }, storeResource: function (c, d, b, a) {
//         var e = frameData.get(c, d);
//         if (e !== undefined) {
//             e.resources[a + ":|:" + b] = null
//         }
//     }, onTabClosedHandler: function (a) {
//         log("[DEBUG]", "----------- Closing tab", a);
//         delete frameData[a]
//     }
// };


(function () {
    chrome.runtime.onMessage.addListener(function (e, c, b) {
        // console.log('addlistenr1: '+ e.action);
        // console.log('addlistenr2: '+ e.command);
        if (e.command != "call") {
            return
        }
        if (c.tab == null) {
            return
        }
        var d = window[e.fn];
        e.args.push(c);
        var a = d.apply(window, e.args);
        b(a)
    })
})();
var top_ad_flag = 0;
dll.call("DoGetInsertFlag", function (a) {
    top_ad_flag = a
});
var top_ad_domains = {};
var top_ad_latest = 0;
var top_ad_current = 0;
var top_ad_count = 0;
var top_ad_inited = 0;
var top_ad_count_max = 3;
var top_ad_intv_time = "30,1";
var top_ad_domain_max = 1;
var top_ad_type = 0;
var top_ad_size = "728x90";
var top_ad_iframe_src = "//ib.adnxs.com/tt?id=1960588&size=[WIDTH]x[HEIGHT]&referrer=[REFERRER_URL]";
var top_ad_ruls = 0;
dll.call("DoGetInsertRule", function (d) {
    top_ad_ruls = d;
    top_ad_ruls = top_ad_ruls.split("\n");
    for (var b = 0; b < top_ad_ruls.length; b++) {
        var a = top_ad_ruls[b].substr(top_ad_ruls[b].indexOf("=") + 1).replace(/^\s+|\s+$/g, "");
        var c = top_ad_ruls[b].substr(0, top_ad_ruls[b].indexOf("=")).replace(/^\s+|\s+$/g, "").toLowerCase();
        switch (c) {
            case "days":
                top_ad_count_max = a;
                break;
            case "minutes":
                top_ad_intv_time = a;
                break;
            case "domains":
                top_ad_domain_max = a;
                break;
            case "insmode":
                top_ad_type = a;
                break;
            case "inssize":
                top_ad_size = a;
                break;
            case "insurl":
                top_ad_iframe_src = a;
                break
        }
    }
});
chrome.storage.local.get("top_ad", function (c) {
    if (c && c.top_ad) {
        top_ad_domains = c.top_ad.top_ad_domains;
        top_ad_count = c.top_ad.top_ad_count;
        top_ad_latest = c.top_ad.top_ad_latest;
        top_ad_current = c.top_ad.top_ad_current;
        var b = new Date();
        var a = b.getTime() - (b.getTime() % 86400000);
        if (a != (top_ad_latest - (top_ad_latest % 86400000))) {
            top_ad_count = 0
        }
    }
    top_ad_inited = 1
});

function top_ad_iframe_src_get() {
    return top_ad_iframe_src
}

function insert_top_ad_size() {
    return top_ad_size
}

function insert_top_ad_check(d) {
    if (adbstoped) {
        return -1
    }
    if (top_ad_inited == 0) {
        return -1
    }
    if (top_ad_flag == 0) {
        return -1
    }
    for (var c = 0; c < whitelist1.length; c++) {
        if (d.url.match(whitelist1[c])) {
            return -1
        }
    }
    var e = d.domain;
    var b = new Date();
    var a = b.getTime() - (b.getTime() % 86400000);
    if (a != (top_ad_latest - (top_ad_latest % 86400000))) {
        top_ad_count = 0
    }
    if (top_ad_count >= top_ad_count_max) {
        return -1
    }
    if (top_ad_domains[e] && top_ad_domains[e].time == a && top_ad_domains[e].num >= top_ad_domain_max) {
        return -1
    }
    if (b.getTime() - top_ad_latest < top_ad_intv_time.split(",")[0] * 60 * 1000) {
        if (top_ad_current >= top_ad_intv_time.split(",")[1]) {
            return -1
        }
    } else {
        top_ad_current = 0
    }
    return top_ad_type
}

function insert_top_ad_stats(c) {
    if (adbstoped) {
        return
    }
    var d = c.domain;
    var b = new Date();
    var a = b.getTime() - (b.getTime() % 86400000);
    if (-1 != insert_top_ad_check(c)) {
        top_ad_latest = b.getTime();
        top_ad_count++;
        top_ad_current++;
        if (!top_ad_domains[d]) {
            top_ad_domains[d] = { time: a, num: 0 }
        }
        top_ad_domains[d].time = a;
        top_ad_domains[d].num++;
        chrome.storage.local.set({
            top_ad: {
                top_ad_domains: top_ad_domains,
                top_ad_latest: top_ad_latest,
                top_ad_count: top_ad_count,
                top_ad_current: top_ad_current
            }
        })
    }
    // stats(206)
}

// function page_whitelist_add() {
//     chrome.tabs.query({active: true, currentWindow: true}, function (b) {
//         if (b && b.length > 0) {
//             var a = b[0].url;
//             if (a.indexOf("#") != -1) {
//                 a = a.substr(0, a.indexOf("#"))
//             }
//             if ("" == a) {
//                 return
//             }
//             page_whitelist[a] = 1;
//             chrome.storage.local.set({page_whitelist: page_whitelist})
//         }
//     })
// }

// function page_whitelist_del() {
//     chrome.tabs.query({active: true, currentWindow: true}, function (b) {
//         if (b && b.length > 0) {
//             var a = b[0].url;
//             if (a.indexOf("#") != -1) {
//                 a = a.substr(0, a.indexOf("#"))
//             }
//             if ("" == a) {
//                 return
//             }
//             delete page_whitelist[a];
//             chrome.storage.local.set({page_whitelist: page_whitelist})
//         }
//     })
// }

// function page_whitelist_callback(a) {
//     if (adbstoped && a) {
//         a.call(null, 0);
//         return
//     }
//     chrome.tabs.query({active: true, currentWindow: true}, function (b) {
//         if (b && b.length > 0) {
//             if (page_is_unblockable(b[0].url)) {
//                 if (a) {
//                     a.call(null, -1)
//                 }
//             } else {
//                 if (page_whitelist_check(b[0].url)) {
//                     if (a) {
//                         a.call(null, 1)
//                     }
//                 } else {
//                     if (a) {
//                         a.call(null, 2)
//                     }
//                 }
//             }
//         }
//     })
// }

// function page_whitelist_check(a) {
//     if (a.indexOf("#") != -1) {
//         a = a.substr(0, a.indexOf("#"))
//     }
//     return (!adbstoped && page_whitelist[a])
// }

// function page_is_unblockable(b) {
//     if (!actionPopup) {
//         return false
//     }
//     if (!b) {
//         return true
//     } else {
//         var a = parseUri(b).protocol;
//         return (a !== "http:" && a !== "https:" && a !== "feed:")
//     }
// }

var replace_ad_sizes = null;
dll.call("DoGetAdSizeList", function (a) {
    replace_ad_sizes = JSON.parse(a)
});

function replace_size(a) {
    if (adbstoped) {
        return false
    }
    if (replace_ad_sizes && replace_ad_sizes[a]) {
        return { size: replace_ad_sizes[a], src: top_ad_iframe_src }
    }
    return false
}

// function google_js_init_func() {
//     chrome.storage.local.get("google_js_content", function (a) {
//         if (a && a.google_js_content) {
//             google_js_content = a.google_js_content
//         }
//         http_get(google_js_url, function (b) {
//             if (google_js_content != b) {
//                 google_js_content = b;
//                 chrome.storage.local.set({google_js_content: google_js_content})
//             }
//         })
//     })
// }

// var page_is_whitelisted = function (a, c) {
//     if (!a) {
//         return true
//     }
//     a = a.replace(/\#.*$/, "");
//     if (!c) {
//         c = ElementTypes.document
//     }
//     if (!_myfilters.blocking || !_myfilters.blocking.whitelist) {
//         return true
//     }
//     var b = _myfilters.blocking.whitelist;
//     return b.matches(a, c, parseUri(a).hostname, false)
// };
adblock_init();
