//====================================================================================//
/*
    public value
*/
var popupSafeOrRisk = null;
var currentTabId = null;
var lan_AdsNotFound = null;
var AdblockSwitch = null;
var SpFuncSwitch = null;
var IsMinerPage = null;
var adWhiteCheck = false;
var DefultAdWhite = false;
//var port=chrome.runtime.connectNative("com.ascplugin.protect");
//console.log('popup connect to location application: '+port)
//var LanArr=new Array();
//====================================================================================//


//====================================================================================//
/*
    public function
*/

function log(text) {
    console.log(text);
}
const AddWhiteADblock = (aTabId, achecked) => {
    return new Promise((resolve, reject) => {
        msg = { command: "counter", action: "AddWhiteADblock", tabId: aTabId, checked: achecked };
        chrome.runtime.sendMessage(msg, function (response) {
            resolve(response);
        });
    });
}

/*function GetMultiLanguage(){
    port.postMessage({CMD:"GetLanguage",LanName:'Site_Risk',LanDefault:'Risk:'});
    port.postMessage({CMD:"GetLanguage",LanName:'Site_Risk_tip',LanDefault:'This site is unsafe'});
    port.postMessage({CMD:"GetLanguage",LanName:'Site_Safe',LanDefault:'Safe:'});
    port.postMessage({CMD:"GetLanguage",LanName:'Site_Safe_tip',LanDefault:'This site is safe'});
    port.postMessage({CMD:"GetLanguage",LanName:'Site_Advisory',LanDefault:'Advisory provided by'});
    port.postMessage({CMD:"GetLanguage",LanName:'Site_Details',LanDefault:'More Details'});
    port.postMessage({CMD:"GetLanguage",LanName:'btn_ok',LanDefault:'Ok'});
    port.postMessage({CMD:"GetLanguage",LanName:'Risk_Title',LanDefault:'This website has been reported as unsafe'});
    port.postMessage({CMD:"GetLanguage",LanName:'Risk_recommend',LanDefault:'We recommend that you do not continue visiting this website'});
    port.postMessage({CMD:"GetLanguage",LanName:'Risk_goBack',LanDefault:'Cancel'});
    port.postMessage({CMD:"GetLanguage",LanName:'Risk_report',LanDefault:'Report false alarm'});
    port.postMessage({CMD:"GetLanguage",LanName:'Risk_continue',LanDefault:'Continue anyway'});
    port.postMessage({CMD:"GetLanguage",LanName:'Ads_removed',LanDefault:'ads removed on this page'});
    port.postMessage({CMD:"GetLanguage",LanName:'SP_Off',LanDefault:'Surfing Protection is OFF'});
    port.postMessage({CMD:"GetLanguage",LanName:'ads_Nofound',LanDefault:'No ads found'});
}*/
//====================================================================================//

//==============================================================================================================================//
/*
    test code 
*/
/*
//window.open('www.baidu.com')
//it can use this function to open some url
//chrome.tabs.create({active:true,url:"https://www.baidu.com"})
chrome.storage.onChanged.addListener(function(changes,areaName){
    log("Change in storage area: "+area);
    var changeItems=Object.keys(changes);
    for (item of changeItems){
        log(item+" has changed:");
        log("Old value");
        log(changes[item].oldValue);
        log("New value");
        log(changes[item].newValue);
    }
});//this function is useless

//it can useing this function to check the multi-language
//the results of adblock can use chrome.action.getBadgeText function
//the problem is how to know this function is risk
//it can use chrome.action.getPopup
//if the page is safe ,then ,use the popup/safe.html
//if the page is risk ,then ,use the popup/risk.html
//using string.indexOf("safe.html")>0? to jundge whether the page is safe of risk
//the html can set using chrome.action.setPopup
chrome.storage.local.get(null,function(results){
    log("check the storage name: "+results.name)
})*/

//test this js file whether can use the global file 
//log('test whether the popup.js can use global variable: '+LanArr);

var safeDesc = document.getElementById("safeDesc");
var safeDescTip = document.getElementById("safeDescTip");
var dd_detail = document.getElementById("dd_detail");
var safeImg = document.getElementById("safeImg");
//dd_detail.setAttribute("style", "margin-top:30px;float: left; margin-left: -35px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 183px");
dd_detail.setAttribute("height", "100px");

var dd_detail = document.getElementById('dd_detail');

/*function safeDescMouseOver() {
   dd_detail.setAttribute("style", "margin-top:14px;float: left; margin-left: -35px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 183px");
   safeDescTip.setAttribute("style", "display :inline;font-weight:300;font-size:small;overflow:visible;text-overflow:clip")
   safeImg.setAttribute("style", "float:left;margin-top:19px");
}

function safeDescMouseOut() {
   dd_detail.setAttribute("style", "margin-top:30px;float: left; margin-left: -35px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 183px");
   safeDescTip.setAttribute("style", "display:none");
   safeImg.setAttribute("style", "float:left;margin-top:35px");
}

if (safeDescTip) {
    console.log('enter the onmouseover')
    safeDesc.addEventListener("mouseover", function () {
        setTimeout('safeDescMouseOver()',30);
    })
    safeDesc.addEventListener("mouseout",function(){
        setTimeout('safeDescMouseOut()', 3000);
    })
}  */

//==============================================================================================================================//

//===================================================================================//
/*
    jundge whether the page is safe or risk
    how to get the tabId
    return true:safe
    return false:risk
*/
function IsSafeOrRisk(aTabId) {
    //log('currentTabId: '+currentTabId);
    log('IsSafeOrRisk tabId: ' + aTabId);
    chrome.action.getPopup({ tabId: aTabId }, function (result) {
        log(result);
        if (result.indexOf("safe.html") >= 0) {
            //log('true');
            //get the badge text to content of safe.html
            //print the num of ab block
            {
                /*
                    add the multi-language
                */
                /*log('LanArr.length: '+LanArr.length);
                for(var i=0;i<LanArr.length;i++){
                    if(LanArr[i].LanName=='Site_Safe_tip'){
                        var safeDesc=document.getElementById('safeDesc');
                        safeDesc.innerHTML=LanArr[i].LanValue;
                    }else if(LanArr[i].LanName==='Ads_removed'){
                        var adsremoved=document.getElementById('adsremoved');
                        adsremoved.innerHTML=LanArr[i].LanValue;
                    }
                }*/
            }
            var ADBlockNum = browser.action.getBadgeText({ tabId: aTabId });
            ADBlockNum.then(function (item) {
                var adsremovenum = document.getElementById('adsremovenum');
                var adsremoved = document.getElementById('adsremoved');
                if (adsremovenum) {
                    console.log('-----------------------' + item + '-------------------------');
                    if (item == '') {
                        adsremovenum.innerHTML = '';
                        if (adsremoved) {
                            adsremoved.innerHTML = lan_AdsNotFound;
                            console.log('lan_AdsNotFound:' + lan_AdsNotFound);
                            //  adsremoved.setAttribute('title', lan_AdsNotFound);
                        }
                    } else {
                        adsremovenum.innerHTML = item + ' ';
                        var adsremoved = document.getElementById('adsremoved');
                        console.log('adsremoved item:' + item);

                        //  adsremoved.setAttribute('title', item + adsremoved.innerHTML);
                    }
                }
            }, function (error) { })
            return true;
        } else if (result.indexOf("Popup/threat.html") >= 0) {
            //log('false');
            // let site_width =  
            var flag_a_google = document.getElementById('safebrowsing_faq');
            console.log('----3');
            if (flag_a_google) { log('get the element') };
            flag_a_google.setAttribute('rel', 'nofollow');
            flag_a_google.addEventListener('click', function () {
                chrome.tabs.create({ active: true, url: "https://www.iobit.com/goto.php?id=google" })
            }, false);

            /*
            var antiphish=document.getElementById("antiphish");
            antiphish.addEventListener('click',function(){
                chrome.tabs.create({active:true,url:"https://www.iobit.com/goto.php?id=antiph"})
            },false)
            var stopbadware=document.getElementById("stopbadware");
            stopbadware.addEventListener('click',function(){
                chrome.tabs.create({active:true,url:"https://www.iobit.com/goto.php?id=adware"})
            },false)
            */
            //return false;
        } else {
            return null;
        }
    });
}
//===================================================================================//

//===================================================================================//
/*
    get the popup page  corresponding page's id
*/
//GetMultiLanguage();
/*chrome.tabs.query({active:true,currentWindow:true},function(tabsArr){
    log('tabs.query.length: '+tabsArr.length);
    log('tabs.query.tabsArr[0].tabId: '+tabsArr[0].id);
    if(tabsArr.length==1){
        currentTabId=tabsArr[0].id;
        IsSafeOrRisk(tabsArr[0].id);		
    }
});*/
//===================================================================================//

//===================================================================================//
/*
    port on mesage event
    the time order is error
    need adjust
    11.23 there is a problem,it will show delayed
*/
/*port.onMessage.addListener(function(item){
    if(item.input.CMD=="GetLanguage"){
        log('popup receive the message "GetLanguage": '+item.input.LanName);
        var safeDesc=document.getElementById('safeDesc');
        var adsremoved=document.getElementById('adsremoved');
        if(safeDesc){
            log('safeDesc exists');
            if(item.input.LanName=='Site_Safe_tip'){
                log('get the Site_Safe_tip: '+item.result);
                safeDesc.innerHTML=item.result;
            }
        };
        if(adsremoved){
            log('adsremoved exists');
            if(item.input.LanName=='Ads_removed'){
                log('get the Ads_removed: '+item.result);
                adsremoved.innerHTML=item.result;
            }
        }
    }
});*/
//===================================================================================//

//===================================================================================//
//get the sp and adblock function status
function onResponse(responseMsg) {
    console.log('receive the message from the native message');
    if (responseMsg.input.CMD == 'GetFuncStaus') {
        console.log('GetFuncStaus is: ' + responseMsg.result);
        if (responseMsg.result == '000') {
            SpFuncSwitch = false;
            ADBlockSwitch = false;
        } else if (responseMsg.result == '100') {
            SpFuncSwitch = true;
            ADBlockSwitch = false;
        } else if (responseMsg.result == '001') {
            SpFuncSwitch = false;
            ADBlockSwitch = true;
        } else if (responseMsg.result == '101') {
            SpFuncSwitch = true;
            ADBlockSwitch = true;
        };
    }
    if ((SpFuncSwitch == false) && (ADBlockSwitch == true)) {
        //safeDesc.setAttribute('style', 'visibility:hidden');
        //dd_detail.setAttribute('style', 'margin-top: 14px; float: left; margin-left: -35px; width: 245px');

    }
}
function onError(error) { };
//===================================================================================//


//===================================================================================//
/*
    Multi_language 
*/
function onItem(item) {
    console.log(item.Lan.length);
    //====================================//
    //check the language's content
    /*for (var i = 0; i < item.Lan.length; i++) {
        console.log(item.Lan[i].LanName);
        console.log(item.Lan[i].LanValue);
    }*/
    //====================================//

    //safe page
    var safeDesc = document.getElementById('safeDesc');
    var adsremoved = document.getElementById('adsremoved');
    //threat page
    var safeTitle = document.getElementById('safeTitle');
    var Site_Advisory = document.getElementById('Site_Advisory');
    var detail = document.getElementById('detail');
    var safeDescTip = document.getElementById('safeDescTip');
    if (safeDesc) {
        for (var i = 0; i < item.Lan.length; i++) {
            if (item.Lan[i].LanName == 'Site_Safe_tip') {
                safeDesc.innerHTML = item.Lan[i].LanValue;
                //safeDescTip.innerHTML = item.Lan[i].LanValue;
                console.log('Site_Safe_tip:' + item.Lan[i].LanValue);
                break;
            }
        }
    };
    if (adsremoved) {
        for (var i = 0; i < item.Lan.length; i++) {
            if (item.Lan[i].LanName == 'Ads_removed') {
                adsremoved.innerHTML = item.Lan[i].LanValue;
                break;
            }
        }
    }
    if (safeTitle) {
        for (var i = 0; i < item.Lan.length; i++) {
            if (item.Lan[i].LanName == 'Site_Risk_tip') {
                safeTitle.innerHTML = item.Lan[i].LanValue;
                // safeTitle.setAttribute('title', item.Lan[i].LanValue);
                console.log('Site_Risk_tip:' + item.Lan[i].LanValue);
                break;
            }
        }
    }
    if (Site_Advisory) {
        for (var i = 0; i < item.Lan.length; i++) {
            if (item.Lan[i].LanName == 'Site_Advisory') {
                Site_Advisory.innerHTML = item.Lan[i].LanValue + ' <a id="safebrowsing_faq" style="color:#666; text-decoration:underline; cursor:pointer;" rel="nofollow" target="_blank">Google</a> & IObit';
                console.log('Site_Advisory:' + item.Lan[i].LanValue);
                break;
            }
        }
    }
    if (detail) {
        for (var i = 0; i < item.Lan.length; i++) {
            if (item.Lan[i].LanName == 'Site_Details') {
                detail.innerHTML = item.Lan[i].LanValue;
                break;
            }
        }
    }
    for (var i = 0; i < item.Lan.length; i++) {
        if (item.Lan[i].LanName == "ads_Nofound") {
            lan_AdsNotFound = item.Lan[i].LanValue;
            break;
        }
    }
    //var Sending = browser.runtime.sendNativeMessage("com.ascplugin.protect", { CMD: 'GetFuncStaus' });
    //Sending.then(onResponse, onError);
};
function onError(error) {

}


/*function onNativeMessageResponse(item) {
    console.log('this is pop native message,the message is: ' + item.data);
    if (item.data == '0') {
        AdblockSwitch = false;
        var adsRemoved = document.getElementById('adsremoved');
        if (adsRemoved) {
            adsRemoved.setAttribute('style', 'visibility:hidden');
        }     
    } else if (item.data == '1') {   
        AdblockSwitch = true;
    }
}
var nativeMessageResponse=browser.runtime.sendNativeMessage("com.ascplugin.protect", { name: 'DoGetAdbFlag', data: {browsername:'firefox'}});
nativeMessageResponse.then(onNativeMessageResponse,onError);*/
//IsShowAd();
//IsBlockMinerScript();
/*var gettingItem = browser.storage.local.get();
gettingItem.then(onItem, onError);*/


//===================================================================================//


//===================================================================================//
//new frame
chrome.tabs.query({ active: true, currentWindow: true }, function (tabsArr) {
    log('tabs.query.length: ' + tabsArr.length);
    log('tabs.query.tabsArr[0].tabId: ' + tabsArr[0].id);
    if (tabsArr.length == 1) {
        //=====================================================================================//
        chrome.storage.local.get('DefulwhiteList', function (r) {
            if (!r) return;
            // console.log('ad defult白名单: ' + r.DefulwhiteList);
            let temparr = r.DefulwhiteList;
            let domain = tabsArr[0].url.split('/');
            domain = domain[2].replace('www.', '');
            if (temparr.length > 0) {
                if (temparr.indexOf(domain) >= 0) {
                    DefultAdWhite = true;
                } else {
                    DefultAdWhite = false;
                }
            } else {
                DefultAdWhite = true;
            }
            console.log('DefultAdWhite: ' + DefultAdWhite);
        });
        DebugIsSafeOrRisk(tabsArr[0].id);
        //=====================================================================================//
    }
});

function getTextWidth(str) {
    var width = 0;
    var html = document.createElement('span');
    html.innerText = str;
    html.className = 'getTextWidth';
    document.querySelector('body').appendChild(html);
    width = document.querySelector('.getTextWidth').offsetWidth;
    document.querySelector('.getTextWidth').remove();
    return width;
}

function InitAddADbloock(aTabId, strlan) {
    var adWhite = document.getElementsByClassName("ADbWhite")[0];
    let checkBox = adWhite.querySelector('#Adwhite');
    if (DefultAdWhite) {
        adWhite.style.display = "none";
    } else {
        if (adWhite) {
            checkBox.checked = adWhiteCheck;

            if (adWhite.style.display != "block") {
                adWhite.style.display = "block";
                let elm = adWhite.querySelector('label');
                elm.textContent = strlan;
                adWhite.addEventListener('click', () => { AddWhiteADblock(aTabId, checkBox.checked) });
            }
        }
    }

}


var safeFlag = null;
function DebugIsSafeOrRisk(aTabId) {
    chrome.action.getPopup({ tabId: aTabId }, (popupItem) => {
        //console.log("the url of popup is: " + popupItem)
        var type = 0;
        if (popupItem.indexOf('checked=1') != -1) {
            adWhiteCheck = true;
        }
        if (popupItem.indexOf('Plugin/safe.html') > -1) {
            //safe
            console.log('popup safe ');
            // isContainMinerScript = IsBlockMinerScript();
            //get language
            safeFlag = true;
        } else {
            //threat
            safeFlag = false;
            if (popupItem.indexOf('type=1') != -1) {
                type = 1
            }
            else if (popupItem.indexOf('type=2') != -1) {
                type = 2
            }
            else if (popupItem.indexOf('type=3') != -1) {
                type = 3
            }
            else if (popupItem.indexOf('type=4') != -1) {
                type = 4
            }
            console.log('popup type: ' + type);
            /*else if (popupItem.indexOf('type=5') != -1)
            {
                type = 5
            }*/
        }
        var aLanArr = new Array("Site_Risk", "Site_Risk_tip", "Site_Risk_phish", "Site_Safe", "Site_Safe_tip", "Site_Advisory", "Site_Details", "btn_ok",
            "Ads_removed", "SP_Off", "ads_Nofound", "Site_Miner_tip", "Email_Risk_link", "Email_Risk_sender", "Email_Risk_link_sender", "AllowAD");
        chrome.storage.local.get(aLanArr, (lanItem) => {
            console.log("the lan is: " + lanItem.Site_Advisory);
            InitAddADbloock(aTabId, lanItem.AllowAD);
            switch (safeFlag) {
                case true:
                    chrome.action.getBadgeText({ tabId: aTabId }, (item) => {
                        console.log("item: " + item.Ads_removed)
                        if ((item == "") || (item == null)) {
                            var aSafeDes = document.getElementById('safeDesc');
                            if (aSafeDes) {
                                aSafeDes.innerHTML = lanItem.Site_Safe_tip;
                                aSafeDes.setAttribute("style", "font-size: 20px; color: #4c4c4c; width: 245px");
                            }
                            var adsNum = document.getElementById('adsremovenum');
                            if (adsNum) {
                                adsNum.innerHTML = "";
                            }
                            var adsRemove = document.getElementById('adsremoved');
                            if (adsRemove) {
                                adsRemove.innerHTML = "";
                            }
                            /*var dd_detail = document.getElementById('dd_detail');
                            if (dd_detail) {
                                dd_detail.setAttribute("style", "margin-top: 40px; float: left; margin-left: -35px; width: 245px");
                            }*/
                        } else {
                            var aSafeDesc = document.getElementById('safeDesc');
                            if (aSafeDesc) {
                                aSafeDesc.setAttribute("style", "display:none");
                            }
                            var adsNum = document.getElementById('adsremovenum');
                            if (adsNum) {
                                adsNum.setAttribute("style", "font-size: 20px;color: #ff9500;");
                                adsNum.innerHTML = item + ' ';

                            }
                            var adsRemove = document.getElementById('adsremoved');
                            if (adsRemove) {
                                adsRemove.setAttribute("style", "font-size: 14px; color: #4c4c4c; width: 245px;");
                                adsRemove.innerHTML = lanItem.Ads_removed;
                            }
                            var safeImg = document.getElementById('safeImg');
                            if (safeImg) {
                                safeImg.setAttribute("src", chrome.runtime.getURL("/Plugin/img/icon_e_big.png"));
                                //safeImg.setAttribute("style", "margin-top:34px");
                            }
                            var dd_detail = document.getElementById('dd_detail');
                            try {
                                dd_detail.style.cssText += "margin-top:12px;";
                                if (dd_detail) {
                                    dd_detail.removeChild(dd_detail.getElementsByTagName('br')[0]);
                                }
                            }
                            catch (err) {

                            }
                        }
                    });
                    break;
                case false:
                    switch (type) {
                        case 0:
                            var riskDesc = document.getElementById('safeTitle');
                            if (riskDesc) {
                                riskDesc.innerHTML = lanItem.Site_Risk_tip;
                                //riskDesc.setAttribute("style", "color:#4c4c4c; font-size: 20px; display: block; margin-top: 15px; height: 50px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;width:223px");
                            }
                            var advi = document.getElementById('Site_Advisory');
                            if (advi) {
                                console.log('----5');
                                advi.innerHTML = lanItem.Site_Advisory + ' <a id="safebrowsing_faq" style=" text-decoration:underline; cursor:pointer;" rel="nofollow" target="_blank">Google</a> & IObit';
                                if (getTextWidth(lanItem.Site_Advisory + ' Google & IObit') > 214) {
                                    advi.setAttribute('title', lanItem.Site_Advisory + ' Google & IObit');
                                }
                                var aGoogle = document.getElementById('safebrowsing_faq');
                                aGoogle.setAttribute('rel', 'nofollow');
                                if (aGoogle) {
                                    aGoogle.addEventListener('click', () => {
                                        chrome.tabs.create({ active: true, url: "https://www.iobit.com/goto.php?id=google" });
                                    }, false)
                                }

                            }
                            var aDetail = document.getElementById('detail');
                            if (aDetail) {
                                aDetail.innerHTML = lanItem.Site_Details;
                                if (getTextWidth > 12) {
                                    aDetail.setAttribute('title', lanItem.Site_Details);
                                }
                                //aDetail.style.cssText+="display:inline-block";
                            }
                            /* var antiphish = document.getElementById("antiphish");
                             antiphish.addEventListener('click', function () {
                                 chrome.tabs.create({ active: true, url: "https://www.iobit.com/goto.php?id=antiph" })
                             }, false)
                             var stopbadware = document.getElementById("stopbadware");
                             stopbadware.addEventListener('click', function () {
                                 chrome.tabs.create({ active: true, url: "https://www.iobit.com/goto.php?id=adware" })
                             }, false);
                             */
                            break;
                        case 1:
                            var riskDesc = document.getElementById('safeTitle');
                            if (riskDesc) {
                                riskDesc.innerHTML = lanItem.Email_Risk_link;
                                if (riskDesc.clientHeight > 26) {
                                    riskDesc.parentNode.style.cssText += "margin-top:7px";
                                }
                                //riskDesc.setAttribute("style", "color:#4c4c4c; font-size: 17px; display: block; margin-top: 5px; height: 50px; white-space: pre-line; overflow: hidden; text-overflow: ellipsis;width:223px");
                            }
                            var advi = document.getElementById('Site_Advisory');
                            if (advi) {
                                advi.innerHTML = lanItem.Site_Advisory + ' <a id="safebrowsing_faq" style=" text-decoration:underline; cursor:pointer;" rel="nofollow" target="_blank">Google</a> & IObit';
                                var aGoogle = document.getElementById('safebrowsing_faq');
                                aGoogle.setAttribute('rel', 'nofollow');
                                if (aGoogle) {
                                    console.log('----1');
                                    aGoogle.addEventListener('click', () => {
                                        chrome.tabs.create({ active: true, url: "https://www.iobit.com/goto.php?id=google" });
                                    }, false)
                                    let site_width = getTextWidth(lanItem.Site_Advisory + ' Google & Iobit');
                                    let site_offwidth = advi.offsetWidth;
                                    console.log('site_width: ' + site_width);
                                    console.log('site_offwidth: ' + site_offwidth);
                                    if (site_width > site_offwidth) {
                                        aGoogle.title = 'Google & Iobit';
                                    }
                                }

                            }
                            var aDetail = document.getElementById('detail');
                            if (aDetail) {
                                console.log('detail:' + lanItem.Site_Details);
                                aDetail.innerHTML = lanItem.Site_Details;
                                let detail_width = getTextWidth(lanItem.Site_Details)
                                let detail_offwidth = aDetail.parentNode.offsetWidth;
                                if (detail_width > detail_offwidth) {
                                    aDetail.setAttribute('title', lanItem.Site_Details);
                                }

                                //aDetail.style.cssText+="display:inline-block";
                            }
                            chrome.action.getBadgeText({ tabId: aTabId }, (item) => {
                                if ((item == "") || (item == null)) {
                                    var adsNum = document.getElementById('adsremovenum');
                                    if (adsNum) {
                                        adsNum.innerHTML = "";
                                    }
                                    var adsRemove = document.getElementById('adsremoved');
                                    if (adsRemove) {
                                        adsRemove.innerHTML = "";
                                    }
                                } else {
                                    var adsNum = document.getElementById('adsremovenum');
                                    if (adsNum) {
                                        adsNum.setAttribute("style", "font-size: 20px;color:#ff9500;");
                                        adsNum.innerHTML = item + ' ';
                                        // InitAddADbloock(aTabId, lanItem.AllowAD);
                                    }
                                    var adsRemove = document.getElementById('adsremoved');
                                    if (adsRemove) {
                                        adsRemove.setAttribute("style", "font-size: 14px; color: #4c4c4c; width: 245px;");
                                        adsRemove.innerHTML = lanItem.Ads_removed;
                                    }
                                }

                            });
                            /*var antiphish = document.getElementById("antiphish");
                            antiphish.addEventListener('click', function () {
                                chrome.tabs.create({ active: true, url: "https://www.iobit.com/goto.php?id=antiph" })
                            }, false)
                            var stopbadware = document.getElementById("stopbadware");
                            stopbadware.addEventListener('click', function () {
                                chrome.tabs.create({ active: true, url: "https://www.iobit.com/goto.php?id=adware" })
                            }, false);
                            */
                            break;
                        case 2:
                            var riskDesc = document.getElementById('safeTitle');
                            if (riskDesc) {
                                riskDesc.innerHTML = lanItem.Email_Risk_sender;
                                if (riskDesc.clientHeight > 26) {
                                    riskDesc.parentNode.style.cssText += "margin-top:7px";
                                }
                                //riskDesc.setAttribute("style", "color:#4c4c4c; font-size: 18px; display: block; margin-top: 5px; height: 50px; white-space: pre-line; overflow: hidden; text-overflow: ellipsis;width:223px");
                            }
                            var advi = document.getElementById('Site_Advisory');
                            advi.setAttribute('style', 'display:none');
                            var aDetail = document.getElementById('detail');
                            aDetail.setAttribute('style', 'display:none');
                            chrome.action.getBadgeText({ tabId: aTabId }, (item) => {
                                if ((item == "") || (item == null)) {
                                    var adsNum = document.getElementById('adsremovenum');
                                    if (adsNum) {
                                        adsNum.innerHTML = "";
                                    }
                                    var adsRemove = document.getElementById('adsremoved');
                                    if (adsRemove) {
                                        adsRemove.innerHTML = "";
                                    }
                                } else {
                                    var adsNum = document.getElementById('adsremovenum');
                                    if (adsNum) {
                                        adsNum.setAttribute("style", "font-size: 20px;color:#ff9500;");
                                        adsNum.innerHTML = item + ' ';
                                        // InitAddADbloock(aTabId, lanItem.AllowAD);
                                    }
                                    var adsRemove = document.getElementById('adsremoved');
                                    if (adsRemove) {
                                        adsRemove.setAttribute("style", "font-size: 14px; color: #4c4c4c; width: 245px;");
                                        adsRemove.innerHTML = lanItem.Ads_removed;
                                    }
                                }

                            });
                            break;
                        case 3:
                            var riskDesc = document.getElementById('safeTitle');
                            if (riskDesc) {
                                riskDesc.innerHTML = lanItem.Email_Risk_link_sender;
                                if (riskDesc.clientHeight > 26) {
                                    riskDesc.parentNode.style.cssText += "margin-top:7px";
                                }
                                //riskDesc.setAttribute("style", "color:#4c4c4c; font-size: 16px; display: block; margin-top: 0px; height: 50px; white-space: pre-line; overflow: hidden; text-overflow: ellipsis;width:223px; line-height: 16.5px");
                            }
                            var advi = document.getElementById('Site_Advisory');
                            if (advi) {
                                advi.innerHTML = lanItem.Site_Advisory + ' <a id="safebrowsing_faq" style=" text-decoration:underline; cursor:pointer;" rel="nofollow" target="_blank">Google</a> & IObit';
                                var aGoogle = document.getElementById('safebrowsing_faq');
                                if (aGoogle) {
                                    aGoogle.addEventListener('click', () => {
                                        chrome.tabs.create({ active: true, url: "https://www.iobit.com/goto.php?id=google" });
                                    }, false)
                                }
                            }
                            var aDetail = document.getElementById('detail');
                            if (aDetail) {
                                aDetail.innerHTML = lanItem.Site_Details;
                                aDetail.setAttribute('title', lanItem.Site_Details);
                                aDetail.style.cssText += "display:inline-block;text-decoration:underline;";
                            }
                            chrome.action.getBadgeText({ tabId: aTabId }, (item) => {
                                if ((item == "") || (item == null)) {
                                    var adsNum = document.getElementById('adsremovenum');
                                    if (adsNum) {
                                        adsNum.innerHTML = "";
                                    }
                                    var adsRemove = document.getElementById('adsremoved');
                                    if (adsRemove) {
                                        adsRemove.innerHTML = "";
                                    }
                                } else {
                                    var adsNum = document.getElementById('adsremovenum');
                                    if (adsNum) {
                                        adsNum.setAttribute("style", "font-size: 20px;color: #ff9500;");
                                        adsNum.innerHTML = item + ' ';
                                        // InitAddADbloock(aTabId, lanItem.AllowAD);

                                    }
                                    var adsRemove = document.getElementById('adsremoved');
                                    if (adsRemove) {
                                        adsRemove.setAttribute("style", "font-size: 14px; color: #4c4c4c; width: 245px;");
                                        adsRemove.innerHTML = lanItem.Ads_removed;
                                    }
                                }

                            });
                            /*var antiphish = document.getElementById("antiphish");
                            antiphish.addEventListener('click', function () {
                                chrome.tabs.create({ active: true, url: "https://www.iobit.com/goto.php?id=antiph" })
                            }, false)
                            var stopbadware = document.getElementById("stopbadware");
                            stopbadware.addEventListener('click', function () {
                                chrome.tabs.create({ active: true, url: "https://www.iobit.com/goto.php?id=adware" })
                            }, false);
                            */
                            break;
                        case 4:
                            var riskDesc = document.getElementById('safeTitle');
                            if (riskDesc) {
                                riskDesc.innerHTML = lanItem.Site_Risk_phish;
                                if (riskDesc.clientHeight > 26) {
                                    riskDesc.parentNode.style.cssText += "margin-top:7px";
                                }
                                //riskDesc.setAttribute("style", "color:#4c4c4c; font-size: 18px; display: block; margin-top: 5px; height: 50px; white-space: pre-line; overflow: hidden; text-overflow: ellipsis;width:223px");
                            }
                            var advi = document.getElementById('Site_Advisory');
                            if (advi) {
                                advi.innerHTML = lanItem.Site_Advisory + ' IObit';
                                let site_width = getTextWidth(lanItem.Site_Advisory + 'Iobit');
                                let site_offwidth = advi.offsetWidth;
                                // console.log('site_width: '+ site_width);
                                // console.log('site_offwidth: '+ site_offwidth);
                                if (site_width > site_offwidth) {
                                    advi.title = lanItem.Site_Advisory + ' IObit';;
                                }
                            }
                            var aDetail = document.getElementById('detail');
                            if (aDetail) {
                                aDetail.parentNode.className = "detai_info_nohover";
                                aDetail.innerHTML = lanItem.Site_Details;
                                let detail_width = getTextWidth(lanItem.Site_Details)
                                let detail_offwidth = aDetail.parentNode.offsetWidth;
                                if (detail_width > detail_offwidth) {
                                    aDetail.setAttribute('title', lanItem.Site_Details);
                                }

                                aDetail.addEventListener('click', () => {
                                    chrome.tabs.create({ active: true, url: "https://www.iobit.com/goto.php?id=morede", });
                                }, false)
                                //aDetail.style.cssText+="display:inline-block";
                            }

                            break;
                        /*case 5: 
                            var riskDesc = document.getElementById('safeTitle');
                            if (riskDesc) {
                                riskDesc.innerHTML = lanItem.Risk_Title;
                                if (riskDesc.clientHeight >26)
                                {
                                    riskDesc.parentNode.style.cssText+="margin-top:7px";
                                }
                                //riskDesc.setAttribute("style", "color:#4c4c4c; font-size: 18px; display: block; margin-top: 5px; height: 50px; white-space: pre-line; overflow: hidden; text-overflow: ellipsis;width:223px");
                            }
                            var advi = document.getElementById('Site_Advisory');
                            if (advi) {
                                advi.innerHTML = lanItem.Site_Advisory + ' IObit';
                            }
                            var aDetail = document.getElementById('detail');
                            if (aDetail) {
                                aDetail.parentNode.className = "detai_info_nohover";
                                aDetail.innerHTML = lanItem.Site_Details;
                                aDetail.setAttribute('title',lanItem.Site_Details);
                                aDetail.addEventListener('click', () => {
                                    chrome.tabs.create({ active: true, url: "https://www.iobit.com/goto.php?id=morede" ,});
                                },false)
                            	
                                //aDetail.style.cssText+="display:inline-block";
                            }
                            break;*/
                        default:
                            break;
                    }

                    break;
                default:
                    break;
            }
        });
    });
}
//===================================================================================//


