
var ScanResult;
var ScanURL = "";	
var Safe_tip = "";
var Safe_Des = "";		
var hostname = 'com.ascplugin.protect';	

	function GetGhromeVersion()
    {
        var version = window.navigator.userAgent;
        var index = version.indexOf("Chrome/") + "Chrome/".length;
        version = version.substring(index, index+2);
        console.log("version: " + version);
        return version;
    } 

	function OpenMoreLink()
	{
		window.open("https://www.iobit.com/goto.php?id=morede");	
	}

	function OpenSafebrowsing()
	{
		var otherwindow = window.open('https://www.iobit.com/goto.php?id=google');
		otherwindow.opener = null;
	}
	
	function ReplaceLanguage()
	{
		var isphish= window.location.href.includes('type=phish');
		console.log("***** ReplaceLanguage");
		var title = window.document.getElementById("title");
		if (!title) return;

		if(isphish)
		{
            chrome.storage.sync.get("Risk_Title_Phish",function(obj){
                title.innerText = obj.Risk_Title_Phish;
            });
		}
		else
		{
            chrome.storage.sync.get("Risk_Title",function(obj){
                title.innerText = obj.Risk_Title;
            });
		}

		var recommend = window.document.getElementById("recommend");
		if (!recommend) return;
		chrome.storage.sync.get("Risk_recommend",function(obj){
			//console.log("recommend.innerText " + recommend);
			//console.log("recommend.innerText " + obj);
			recommend.innerText = obj.Risk_recommend;
		});
		var goBack = window.document.getElementById("goBack");
		chrome.storage.sync.get("Risk_goBack",function(obj){
			goBack.innerText = obj.Risk_goBack;
		});
		var report = window.document.getElementById("report"); 
		var continueAway = window.document.getElementById("continueAway");
		
		console.log("***** ReplaceLanguage ScanResult：" + ScanResult);
		
		if (ScanResult==7)
		{	
			report.innerText ='';
			continueAway.innerText = '';
		}
		else
		{				
			chrome.storage.sync.get("Risk_report",function(obj){
				report.innerText = obj.Risk_report;
			});
			chrome.storage.sync.get("Risk_continue",function(obj){
				continueAway.innerText = obj.Risk_continue;
			});				
		}

		var	detail = document.getElementById("detail");
		if (isphish)
		{
            detail.parentNode.className = 'derails_nohover';
            // detail.href ='https://www.iobit.com/goto.php?id=morede';
			detail.removeEventListener('click',OpenMoreLink)
            detail.addEventListener('click', //() => {
            //     chrome.tabs.create({ active: true, url: "https://www.iobit.com/goto.php?id=morede" });
			//},
			OpenMoreLink,
			
			false);
		}
		else
		{
            detail.removeAttribute("href");
            detail.style.cssText +=";cursor:pointer;"
		}
		chrome.storage.sync.get("Site_Details",function(obj){
			detail.innerText = obj.Site_Details;
		});
			
		
		chrome.storage.sync.get("Site_Advisory",function(obj){
			var Advisory_Str = obj.Site_Advisory;
			var Site_Advisory = document.getElementById("Site_Advisory");
			if (isphish)
			{
                Site_Advisory.innerHTML = Advisory_Str + " IObit";

            }
			else
			{
                Site_Advisory.innerHTML = Advisory_Str + " <a id='googleApi' style='color:#ecb3ae; text-decoration:underline; cursor:pointer;' hover='#ecb3ae'; href='https://www.iobit.com/goto.php?id=google' rel='nofollow' target='_blank'>Google</a> & IObit";
                //var	googleApi = document.getElementById('googleApi');
                //googleApi.setAttribute("href", "#");
				//googleApi.addEventListener('click', OpenSafebrowsing);
            }

        });
        
		//URL = document.getElementById("sourceURL").innerHTML;
        //var hrefstr = "mailto:feedback@iobit.com?subject=Report Risk Webpage&Body=Webpage:" +URL+ "%0d%0aVersion:V10%0d%0aComment:";
        //var feedItem = document.getElementById('report');
		//feedItem.href = hrefstr;
		//feedItem.onclick = function(){console.log('test'); window.open('mailto:feedback@iobit.com?subject=Report Risk Webpage&Body=Webpage:test%0d%0aVersion:V10%0d%0aComment:');}							
		//feedItem.setAttribute("onClick", hrefstr);

		
		var sourceURL = document.getElementById('sourceURL');
		if (!recommend) return;
		// sourceURL.innerHTML = ScanURL;
		sourceURL.innerText = ScanURL;

		//init email url
		var URL = ScanURL.replace('&', '%26');
        var AContext = "mailto:feedback@iobit.com?subject=Report False Alarm&Body=Webpage:" +URL+ "%0d%0aComment:";
		document.getElementById('report').href = AContext;
	}	
	
	function GoBack()
	{
		//window.open("about: blank", window.name, "", false);
		location.replace("about: blank");
		location.href="about: blank";
		return false;
	}
	function OpenLink(URL)
	{
		window.open(URL);
	}

	// function SendMail()		
	// {	
	// 	console.log("***** SendMail");
	// 	var URL = document.getElementById("sourceURL").innerHTML;
    //     URL = URL.replace('&', '%26');
    //     var AContext = "mailto:feedback@iobit.com?subject=Report False Alarm&Body=Webpage:" +URL+ "%0d%0aComment:";
	// 	// focus();	
	// 	// anamel.ro
	// 	chrome.tabs.create({url:AContext}, function(tab) {
	// 		window.setTimeout(function(){
	// 			chrome.tabs.remove(tab.id)
	// 			// chrome.tabs.update(tab.id,{url:''})
	// 		}, 500)
	// 	});	
		
	// }
	
	function setLang(id,text)
	{
		document.getElementById(id).innerHTML = text;
	}
	
	function setImage(id, src)
	{
		document.getElementById(id).src = src;
	}
	function SetContinueAway()
	{
		var AURL = document.getElementById("sourceURL");
		console.log("AURL.innerHTML: " + AURL.innerHTML);
        
		chrome.runtime.sendMessage({action:'SetFilterURL', ScanURL:AURL.innerHTML}, function(response){
			window.location.replace(AURL.innerHTML);
		});
		/*
		chrome.runtime.sendMessage(hostname,{CMD:"SetFilterURL",FilterURL:AURL.innerHTML},function(response){
            if(response.result)
			{
                //window.location.replace(AURL.innerHTML);
			}
        });
		*/
	}	
	
	function OpenAntiphishing()
	{
		window.open('https://www.iobit.com/goto.php?id=antiph');
	}
	
	function OpenStopBadware()
	{
		window.open('https://www.iobit.com/goto.php?id=adware');
	}	
	
	function getResult()
	{
        var tabId;

        chrome.tabs.getCurrent(function (tab){
            tabId = tab.id;

            var itemname = tabId+"scanResult";
            //console.log("tab.favIconUrl: " + tab.favIconUrl);
            //console.log("chrome.storage.sync.get itemname: " + itemname);
            chrome.storage.sync.get(itemname,function(obj){
                ScanResult = obj[itemname];
                //var ScanUrl = obj[itemname+'ScanURL'];
                //console.log("ScanUrl: " + ScanUrl + "  result: " + ScanResult);
                if (ScanResult!=1 && ScanResult!=2 && ScanResult!=7 && ScanResult!=8)
                {
                	setTimeout(getResult(),50);
                    return;
                }
                if (obj[itemname])
                {
                    //console.log("obj."+itemname+": " + obj[itemname]);
                    chrome.storage.sync.get(itemname+'ScanURL',function(obj){
                        ScanURL = obj[itemname+'ScanURL'];

                        //console.log("obj['ScanURL']:" + obj[itemname+'ScanURL']);
                        if (ScanURL) ReplaceLanguage();

                    });
                }

            });
        });
	}
        var tabId;
        var CurrentVersion = GetGhromeVersion();
        if (CurrentVersion<=18)
		{
			chrome.tabs.getCurrent(function(tab){
                tabId = tab.id;
                var itemname = tabId+"scanResult";
				chrome.storage.sync.get(itemname,function(obj){
					ScanResult = obj[itemname];
					ReplaceLanguage();
				});
                
            });
        }else{
            getResult();

        }
        
       
	
	chrome.runtime.onMessage.addListener(function (message,sender,sendresponse) {
		if (message.CMD="URL")
		{
			//console.log("@@@@@@@@@@@@@URL: " + message.URL);
            ScanURL = message.URL;
            ScanResult = message.SCANRESULT;
            if (message.URL) ReplaceLanguage();
            sendresponse({STATUS:1});
		}

	});
	
	//document.getElementById('antiphish').addEventListener('click', OpenAntiphishing);
	//document.getElementById('stopbadware').addEventListener('click', OpenStopBadware);
	
	document.getElementById('goBack').addEventListener('click', GoBack);
	document.getElementById('continueAway').addEventListener('click', SetContinueAway);
	// document.getElementById('report').addEventListener('click', SendMail);
	