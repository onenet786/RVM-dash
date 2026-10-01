
/*******************************************************************************************/
var AURL=window.location.href;
var CurHost = window.location.host;
var waitTimeName = null;
var InsertCount = 0;
var ProtectType = '';
var CurrPageElementCount = 0;
var CheckFlag = 0;

var cur_index = 0;
var XMLNS="http://www.w3.org/1999/xhtml";
var ScanResult;
var IsReplace = 0;
var filterURL = '';
var CurrentVersion = 0;
var isshowad = 0;
var hostname = 'com.ascplugin.protect';
var freshfrequency = 0;
delay = null;
ShowDelay = null;
CurrDisplay = null;
	chrome.runtime.onMessage.addListener(function(request,sender,sendResponse) {
        if (request.action == 'language') {
            localStorage.setItem(request.name, request.value);
            sendResponse({result: 'success'});
        } else if (request.action == 'isopen') {
            localStorage.setItem('isopen', request.value);
            sendResponse({result: 'success'});
        } else if (request.action == 'showadurl') {
            localStorage.setItem('showadurl', request.value);
            sendResponse({result: 'success'});
        } else if (request.action == 'showadname') {
            localStorage.setItem('showadname', request.value);
            sendResponse({result: 'success'});
        } else if (request.action == 'isshowad') {
            localStorage.setItem('isshowad', request.value);
            sendResponse({result: 'success'});
        }
        else if (request.action == 'scanResult') {
            if (request.searchengine == 'baidu') {
                var listItemElements = document.body.getElementsByTagName("h3");
                var listItemElementsCount = listItemElements.length;
                for (var i = 0; i < listItemElementsCount; ++i) {
                    if (request.resultname !== ('result' + i)) continue;
                    var ScanResult = request.value;
                    var resultElements = listItemElements[i].getElementsByTagName("a");
                    var asc_imgElement = listItemElements[i].getElementsByTagName("img");

                    if (resultElements && resultElements.length != 0) {
                        var hrefElement = resultElements[0];
                        if ((ScanResult == 1)  || (ScanResult == 7) ||(ScanResult == 2)) {
                            var isSafe = false;
                            var type = 0;
                        }else if(ScanResult == 8)
                        {
                            var isSafe = false;
                            type = 2;
                        }
                        else {
                            var type = 0;
                            var isSafe = true;
                        }
                        if (asc_imgElement && asc_imgElement.length != 0) {
                            var FindImg = false;
                            FindImg = CheckAddASCImg(asc_imgElement);
                            if (FindImg == false) {
                                // listItemElements[i]
                                this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe,type);
                            } else {
                                console.log("image exists");
                            }
                        } else {
                            this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe,type);
                        }
                        //this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe);
                    }
                }
            }

            else if (request.searchengine == 'ask'){
                //var listItemElements = document.body.getElementsByTagName("h3");                
                var listItemElements = document.querySelectorAll('.i_.div.si49, .result-title');
                var listItemElementsCount = listItemElements.length;
                CurrPageElementCount = listItemElementsCount; 
                for (var i = 0; i < listItemElementsCount; i++) {
                    if (request.resultname !== ('result' + i)) continue;
                    var ScanResult = request.value;

                    var resultElements = listItemElements[i].getElementsByTagName("a");
                    var asc_imgElement = listItemElements[i].getElementsByTagName("img");
                    var parentId = listItemElements[i].parentNode.parentNode.id;

                    if (resultElements && resultElements.length != 0 && (parentId != "relate")) {
                        var hrefElement = resultElements[0];
                        if ((ScanResult == 1)  || (ScanResult == 7) ||(ScanResult == 2)) {
                            var isSafe = false;
                            var type = 0;
                        }else if(ScanResult == 8)
                        {
                            var isSafe = false;
                            type = 2;
                        }
                        else {
                            var type = 0;
                            var isSafe = true;
                        }
                        if(resultElements[0].offsetWidth + 23 > listItemElements[i].offsetWidth){
                            insertNewImgElement(document, listItemElements[i], 'iobit', isSafe, type,false,true);
                        }else{
                            insertNewImgElement(document, listItemElements[i], 'iobit', isSafe, type);
                        }
                        console.log('ask insert image');
                    } else {
                        console.log("ask insert image wrong");
                    }
                }               
            }

            else if (request.searchengine == 'bing') {
                var listItemElements = document.body.getElementsByTagName("h2");
                var listItemElementsCount = listItemElements.length;
                for (var i = 0; i < listItemElementsCount; ++i) {
                    if (request.resultname !== ('result' + i)) continue;
                    var ScanResult = request.value;
                    var resultElements = listItemElements[i].getElementsByTagName("a");
                    var asc_imgElement = listItemElements[i].getElementsByTagName("img");
                    if (resultElements && resultElements.length != 0) {
                        var hrefElement = resultElements[0];
                        if ((ScanResult == 1)  || (ScanResult == 7) ||(ScanResult == 2)) {
                            var isSafe = false;
                            var type = 0;
                        }else if(ScanResult == 8)
                        {
                            var isSafe = false;
                            type = 2;
                        }
                        else {
                            var type = 0;
                            var isSafe = true;
                        }

                        if (asc_imgElement && asc_imgElement.length != 0) {
                            var FindImg = false;
                            FindImg = CheckAddASCImg(asc_imgElement);
                            if (FindImg == false) {
                                this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe,type);
                            } else {
                                console.log("image exists");
                            }
                        } else {
                            this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe,type);
                        }
                        //this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe);
                    }
                }
            }

            //google wgb
            else if (request.searchengine == 'google') {
                var listItemElements = document.body.getElementsByTagName("h3");
                var listItemElementsCount = listItemElements.length;
                for (var i = 0; i < listItemElementsCount; ++i) {
                    if (request.resultname !== ('result' + i)) continue;
                    var ScanResult = request.value;
                    var resultElements = listItemElements[i].getElementsByTagName("a");
                    var asc_imgElement = listItemElements[i].getElementsByTagName("img");
					if((location.href.indexOf(".google.") !=-1)&&(location.href.includes('search?')))//zl add jp google 
					{	
                    if (resultElements && resultElements.length != 0) {
                        var hrefElement = resultElements[0];
                        if (hrefElement.getElementsByTagName("h3").length != 0) {
                            continue;
                        }
                        if ((ScanResult == 1)  || (ScanResult == 7) ||(ScanResult == 2)) {
                            var isSafe = false;
                            var type = 0;
                        }else if(ScanResult == 8)
                        {
                            var isSafe = false;
                            type = 2;
                        }
                        else {
                            var type = 0;
                            var isSafe = true;
                        }
                        //this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe);

                        if (asc_imgElement && asc_imgElement.length != 0) {
                            var FindImg = false;
                            FindImg = CheckAddASCImg(asc_imgElement);
                            if (FindImg == false) {
                                this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe,type);
                            } else {
                                console.log("image exists");
                            }
                        } else {
                            this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe,type);
                        }
                    }
                    else {
                        //MOGAI wgb
                        if ((ScanResult == 1)  || (ScanResult == 7) ||(ScanResult == 2)) {
                            var isSafe = false;
                            var type = 0;
                        }else if(ScanResult == 8)
                        {
                            var isSafe = false;
                            type = 2;
                        }
                        else {
                            var type = 0;
                            var isSafe = true;
                        }

                        if (asc_imgElement && asc_imgElement.length != 0) {
                            var FindImg = false;
                            FindImg = CheckAddASCImg(asc_imgElement);
                            if (FindImg == false) {
                                var childlist = listItemElements[i].childNodes;
                                var childlistlength = childlist.length;
                                if (childlistlength != 0) {
                                    this.insertNewImgElement_GoogleNew(document, listItemElements[i], childlist[childlistlength - 1], isSafe,type);
                                }
                                else {
                                    this.insertNewImgElement_GoogleNew(document, listItemElements[i], null, isSafe,type);
                                }

                            } else {
                                console.log("image exists");
                            }
                        }
                        else {
                            var childlist = listItemElements[i].childNodes;
                            var childlistlength = childlist.length;
                            if (childlistlength != 0) {
                                this.insertNewImgElement_GoogleNew(document, listItemElements[i], childlist[childlistlength - 1], isSafe,type);
                            }
                            else {
                                this.insertNewImgElement_GoogleNew(document, listItemElements[i], null, isSafe,type);
                            }

                        }

                    }
					}
                }
            }


            else if (request.searchengine == 'yahoo') {
                var listItemElements = document.body.getElementsByTagName("h3");
                var listItemElementsCount = listItemElements.length;
                for (var i = 0; i < listItemElementsCount; ++i) {
                    if (request.resultname !== ('result' + i)) continue;
                    var ScanResult = request.value;
                    var resultElements = listItemElements[i].getElementsByTagName("a");
                    var asc_imgElement = listItemElements[i].getElementsByTagName("img");

                    if (resultElements && resultElements.length != 0) {
                        var hrefElement = resultElements[0];
                        if ((ScanResult == 1)  || (ScanResult == 7) ||(ScanResult == 2)) {
                            var isSafe = false;
                            var type = 0;
                        }else if(ScanResult == 8)
                        {
                            var isSafe = false;
                            type = 2;
                        }
                        else {
                            var type = 0;
                            var isSafe = true;
                        }
                        //this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe);

                        if (asc_imgElement && asc_imgElement.length != 0) {
                            var FindImg = false;
                            FindImg = CheckAddASCImg(asc_imgElement);
                            if (FindImg == false) {
                                this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe,type);
                            } else {
                                console.log("image exists");
                            }
                        } else {
                            this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe,type);
                        }
                    }
					else
					{
						//var hrefElement = resultElements[0];
                        if ((ScanResult == 1)  || (ScanResult == 7) ||(ScanResult == 2)) {
                            var isSafe = false;
                            var type = 0;
                        }else if(ScanResult == 8)
                        {
                            var isSafe = false;
                            type = 2;
                        }
                        else {
                            var type = 0;
                            var isSafe = true;
                        }
                        //this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe);

                        if (asc_imgElement && asc_imgElement.length != 0) {
                            var FindImg = false;
                            FindImg = CheckAddASCImg(asc_imgElement);
                            if (FindImg == false) {
                                this.insertNewImgElement(document, listItemElements[i].parentElement, listItemElements[i], isSafe,type);
                            } else {
                                console.log("image exists");
                            }
                        } else {
                            this.insertNewImgElement(document, listItemElements[i].parentElement, listItemElements[i], isSafe,type);
                        }
					}
                }
            }
            else if (request.searchengine == 'yandex') {
                var listItemElements = document.body.getElementsByTagName("h2");
                var listItemElementsCount = listItemElements.length;
    
                var subTitleList = document.body.getElementsByTagName("div");
                let subTitle_index = [];
                for(let i in subTitleList)
                {
                    try
                    {
                        if(subTitleList[i].getAttribute('class') == 'Sitelinks-Header')
                        {
                            subTitle_index.push(i);
                        }
                    }
                    catch(err)
                    {

                    }    
                }
                for (var i = 0; i < listItemElementsCount; ++i) {
                    if (request.resultname !== ('result' + i)) continue;
                    var ScanResult = request.value;
                    var resultElements = listItemElements[i].parentElement;
    
                    if (resultElements && resultElements.length != 0) {
                        var hrefElement = resultElements;
                        if ((ScanResult == 1)  || (ScanResult == 7) ||(ScanResult == 2)) {
                            var isSafe = false;
                            var type = 0;
                        }else if(ScanResult == 8)
                        {
                            var isSafe = false;
                            type = 2;
                        }
                        else {
                            var type = 0;
                            var isSafe = true;
                        }
                        this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe,type);
                    }
                }
                for(let i = 0; i < subTitle_index.length; i++)
                {
                    if (request.resultname !== ('result' + (listItemElementsCount + i))) continue;
                    var ScanResult = request.value;
                    var resultElements = subTitleList[subTitle_index[i]];
                    if (resultElements && resultElements.length != 0) {
                        var hrefElement = resultElements.getElementsByTagName('a')[0];
                        if ((ScanResult == 1)  || (ScanResult == 7) ||(ScanResult == 2)) {
                            var isSafe = false;
                            var type = 0;
                        }else if(ScanResult == 8)
                        {
                            var isSafe = false;
                            type = 2;
                        }
                        else {
                            var type = 0;
                            var isSafe = true;
                        }
                        this.insertNewImgElement(document, subTitleList[subTitle_index[i]], hrefElement, isSafe,type);
                    }
                }
            }

            else if (request.searchengine == 'babylon') {
                var listItemElements = document.body.getElementsByClassName("gRsSlicetitle");
                var listItemElementsCount = listItemElements.length;

                for (var i = 0; i < listItemElementsCount; ++i) {
                    if (request.resultname !== ('result' + i)) continue;
                    var ScanResult = request.value;
                    var hrefelement = listItemElements[i];
                    if (hrefelement) {
                        if ((ScanResult == 1)  || (ScanResult == 7) ||(ScanResult == 2)) {
                            var isSafe = false;
                            var type = 0;
                        }else if(ScanResult == 8)
                        {
                            var isSafe = false;
                            type = 2;
                        }
                        else {
                            var type = 0;
                            var isSafe = true;
                        }
                        this.insertNewImgElement(document, listItemElements[i].parentNode, listItemElements[i], isSafe,type);
                        console.log('babylon insert image');
                    } else {
                        console.log("insert image wrong");
                    }
                }
            }

            else if (request.searchengine == 'v9') {
                var listItemElements = document.body.getElementsByTagName("a"); //bodyElement.getElementsByTagName("h2");
                var listItemElementsCount = listItemElements.length;

                for (var i = 0; i < listItemElementsCount; i++) {
                    if (request.resultname !== ('result' + i)) continue;
                    var ScanResult = request.value;
                    var hrefelement = listItemElements[i];
                    if (hrefelement && hrefelement.parentNode.className == 'title') {
                        if ((ScanResult == 1)  || (ScanResult == 7) ||(ScanResult == 2)) {
                            var isSafe = false;
                            var type = 0;
                        }else if(ScanResult == 8)
                        {
                            var isSafe = false;
                            type = 2;
                        }
                        else {
                            var type = 0;
                            var isSafe = true;
                        }
                        this.insertNewImgElement(document, listItemElements[i].parentNode, listItemElements[i], isSafe,type);
                        console.log('v9 insert image');
                    } else {
                        console.log("v9 insert image wrong");
                    }
                }
            }
            //zl add duckduckgo
            else if (request.searchengine == 'duckduckgo'){
                var listItemElements = document.body.getElementsByTagName("h2");
                var listItemElementsCount = listItemElements.length;
                CurrPageElementCount = listItemElementsCount; 
                for (var i = 0; i < listItemElementsCount; i++) {
                    if (request.resultname !== ('result' + i)) continue;
                    var ScanResult = request.value;

                    var resultElements = listItemElements[i].getElementsByTagName("a");
                    var asc_imgElement = listItemElements[i].getElementsByTagName("img");
                    var parentId = listItemElements[i].parentNode.parentNode.id;

                    if (resultElements && resultElements.length != 0 && (parentId != "relate")) {
                        var hrefElement = resultElements[0];
                        if ((ScanResult == 1)  || (ScanResult == 7) ||(ScanResult == 2)) {
                            var isSafe = false;
                            var type = 0;
                        }else if(ScanResult == 8)
                        {
                            var isSafe = false;
                            type = 2;
                        }
                        else {
                            var type = 0;
                            var isSafe = true;
                        }
                        this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe,type);
                        console.log('duckduckgo insert image');
                    } else {
                        console.log("duckduckgo insert image wrong");
                    }
                }               
            }
           
           else if (request.searchengine == 'aol')
            {
                var listItemElements = document.body.getElementsByTagName("h3");
                var listItemElementsCount = listItemElements.length;
                CurrPageElementCount = listItemElementsCount; 
                for (var i = 0; i < listItemElementsCount; i++) {
                    if (request.resultname !== ('result' + i)) continue;
                    var ScanResult = request.value;

                    var resultElements = listItemElements[i].getElementsByTagName("a");
                    var asc_imgElement = listItemElements[i].getElementsByTagName("img");
                    var parentId = listItemElements[i].parentNode.parentNode.id;

                    if (resultElements && resultElements.length != 0 && (parentId != "relate")) {
                        var hrefElement = resultElements[0];
                        if ((ScanResult == 1)  || (ScanResult == 7) ||(ScanResult == 2)) {
                            var isSafe = false;
                            var type = 0;
                        }else if(ScanResult == 8)
                        {
                            var isSafe = false;
                            type = 2;
                        }
                        else {
                            var type = 0;
                            var isSafe = true;
                        }
                        this.insertNewImgElement(document, listItemElements[i], hrefElement, isSafe,type);
                        console.log('aol insert image');
                    } else {
                        console.log("aol insert image wrong");
                    }
                }               
            }


            /*MAIL_PROTECT*/
            else if (request.searchengine == 'gmail') {
                //freshfrequency --;
                //if (window.location.href != request.)
                var alist = document.body.getElementsByTagName('div');

                for (var i in alist) {
                    try
                    {
                        if (alist[i].getAttribute('role') == 'main') {
                            var main_div = alist[i];
                            break;
                        }
                    }
                    catch(err)
                    {

                    }

                }
                if (main_div != undefined) {
                    alist = main_div.getElementsByTagName('a');
                    var ScanResult = request.value;
                    let templist = {};
                    templist = {...alist};
                    for(let key in templist)
                    {
                        if(templist[key].href.includes('www.iobit.com'))
                        {
                            delete templist[key];
                        }
                    }
                    let index = 0;
                    for(let key in templist)
                    {
                        if(index != key)
                        {
                            //console.log(`index: ${index}, key: ${key}.`);
                            templist[index] = templist[key];
                            delete templist[key];
                        }
                        index++;
                    }
                    for (let i in templist) {
                        try
                        {
                            if (i == request.resultname && templist[i].href == request.ScanURL) {
                                //console.time('loop');
                                if (ScanResult == 1 || ScanResult == 7 || ScanResult == 2)
                                {
                                    this.insertNewImgElement(document, templist[i], 'iobit', false, 4, true);
                                }
                                else if (ScanResult == 8)
                                {

                                    this.insertNewImgElement(document, templist[i], 'iobit', false, 2, true);
                                }
                                else
                                {
                                    //this.insertNewImgElement(document, alist[i], 'iobit', true,2);
                                }
                                //console.timeEnd('loop');
                            }
                        }
                        catch(err)
                        {

                        }
                    }

                }
            }
            else if (request.searchengine == 'hotmail') {
                var alist = document.getElementsByTagName('div');
                for (var i in alist) {
                    if (alist[i].getAttribute('role') == 'main') {
                        var main_div = alist[i];
                        break;
                    }
                }
                if (main_div != undefined) {
                    alist = main_div.getElementsByTagName('a');
                    let templist = {};
                    templist = {...alist};
                    for(let key in templist)
                    {
                        if(templist[key].href.includes('www.iobit.com'))
                        {
                            delete templist[key];
                        }
                    }
                    let index = 0;
                    for(let key in templist)
                    {
                        if(index != key)
                        {
                            //console.log(`index: ${index}, key: ${key}.`);
                            templist[index] = templist[key];
                            delete templist[key];
                        }
                        index++;
                    }
                    /*if (validateEmail(alist[0].innerHTML))
                    {
                        alert(alist[0].innerHTML);
                    }*/
                    var ScanResult = request.value;
                    for (var i in templist) {
                        if (templist[i].target == '_blank' && templist[i].outerHTML.indexOf('noopener noreferrer') != -1) {
                            try {
                                if (templist[i].href.indexOf('mailto:') == 0) {
                                    continue;
                                }
                            }
                            catch (error) {
                                continue;
                            }
                            if (i == request.resultname) {
                                if (ScanResult == 1 || ScanResult == 7 || ScanResult == 2)
                                {
                                    this.insertNewImgElement(document, templist[i], 'iobit', false, 4, true);
                                }
                                else if (ScanResult == 8)
                                {
                                    this.insertNewImgElement(document, templist[i], 'iobit', false, 2, true);
                                }
                                else
                                {
                                    //this.insertNewImgElement(document, alist[i], 'iobit', true,2);
                                }
                                break;
                            }
                        }
                    }
                }

            }
            else if (request.searchengine == 'gmail_classic')
            {
                var alist = document.getElementsByTagName('a');
                for (var i in alist)
                {
                    if ( alist[i].className =='' && alist[i].target == '_blank' && alist[i].outerHTML.indexOf('data-saferedirecturl') != -1) {
                        if (i == request.resultname) {
                            var ScanResult = request.value;
                            if (ScanResult == 1 || ScanResult == 7 ||(ScanResult == 2))
                            {
                                this.insertNewImgElement(document, alist[i], 'iobit', false,4);
                            }
                            else if (ScanResult == 8)
                            {
                                this.insertNewImgElement(document, alist[i], 'iobit', false,2);
                            }
                            else
                            {
                                //this.insertNewImgElement(document, alist[i], 'iobit', true,2);
                            }
                        }
                    }
                }
            }
            else if(request.searchengine == 'yahoomail'){
                var alist = document.getElementsByTagName('div');
                for (var i in alist)
                {
                    if ( alist[i].getAttribute('role') == 'main')
                    {
                        var main_div = alist[i];
                        break;
                    }
                }
                if (main_div != undefined) {
                    var alist = main_div.getElementsByTagName('a');
                    let templist = {};
                    templist = {...alist};
                    for(let key in templist)
                    {
                        if(templist[key].href.includes('www.iobit.com'))
                        {
                            delete templist[key];
                        }
                    }
                    let index = 0;
                    for(let key in templist)
                    {
                        if(index != key)
                        {
                            templist[index] = templist[key];
                            delete templist[key];
                        }
                        index++;
                    }
                    for (var i in templist) {
                        try
                        {
                            if (templist[i].target == '_blank' && templist[i].outerHTML.indexOf('ymailto') == -1 && templist[i].outerHTML.indexOf('nofollow') != -1) {
                                if (i == request.resultname) {
                                    var ScanResult = request.value;
                                    if (ScanResult == 1 || ScanResult == 7 ||(ScanResult == 2))
                                    {
                                        this.insertNewImgElement(document, templist[i], 'iobit', false, 4, true);
                                    }
                                    else if (ScanResult == 8)
                                    {
                                        this.insertNewImgElement(document, templist[i], 'iobit', false, 2, true);
                                    }
                                    else
                                    {
                                        //this.insertNewImgElement(document, alist[i], 'iobit', true,2);
                                    }
                                    break;
                                }
                            }
                        }
                        catch (err)
                        {
                            break;
                        }
                    }
                }
            }
             else if (request.searchengine == 'aolmail') {
                let main_div = null;
                let tmpdiv = document.querySelectorAll('div[role]');
                for (let index = 0; index < tmpdiv.length; index++) {
                    const element = tmpdiv[index];
                    if(element.getAttribute('role')=='main'){
                        main_div = element;
                        break;
                    }
                }
                if (main_div != null) {
                    let alist = main_div.getElementsByTagName('a');
                    var ScanResult = request.value;
                    for (let i in alist) {
                        try
                        {
                            if(request.tabURL != location.href) break;
                            if(alist[i].innerText.includes('www.iobit.com')) continue;
                            if (alist[i].innerText.includes(request.ScanURL)) {
                                if (ScanResult == 1 || ScanResult == 7 || ScanResult == 2)
                                {
                                    this.insertNewImgElement(document, alist[i], 'iobit', false, 4, true);
                                }
                                else if (ScanResult == 8)
                                {
                                    this.insertNewImgElement(document, alist[i], 'iobit', false, 2, true);
                                }
                                else
                                {
                                    //this.insertNewImgElement(document, alist[i], 'iobit', true,2);
                                }
                                //console.timeEnd('loop');
                            }
                        }
                        catch(err)
                        {

                        }
                    }

                }
            }
            else if (request.searchengine == 'yandexmail') {
                let main_div = document.querySelector('div.MessageViewerLayout__probeContainer--1vLHh'); 
                if (main_div != undefined) {
                    let alist = main_div.getElementsByTagName('a');
                    let ScanResult = request.value;

                    for (let index = 0; index < alist.length; index++) {
                        const element = alist[index];
                        let tmphref = element.href;
                        if(tmphref.includes('www.iobit.com')) continue;
                        try
                        {
                            if(tmphref == request.ScanURL){
                                if (element.target == '_blank' && element.outerHTML.indexOf('noopener') != -1) {
                                    if (ScanResult == 1 || ScanResult == 7 ||(ScanResult == 2))
                                    {
                                        this.insertNewImgElement(document, element, 'iobit', false, 4, true);
                                    }
                                    else if (ScanResult == 8)
                                    {
                                        this.insertNewImgElement(document, element, 'iobit', false, 2, true);
                                    }
                                    else
                                    {
                                        //this.insertNewImgElement(document, alist[i], 'iobit', true,2);
                                    }
                                    // break;
                                }
                            }
                        }
                        catch (err)
                        {
                            // break;
                        }
                    }

                }
            }
            else if (request.searchengine == 'icloudmail') {
                console.log("scanlink icloudmail~~~ao~~~");
            }
            else if (request.searchengine == 'zohomail') {
               let main_div = document.querySelector('div.zmPVMail')
                if (main_div != undefined) {
                    let ScanResult = request.value;
                    let alist = main_div.getElementsByTagName('a');
                    for (let index = 0; index < alist.length; index++) {
                        const element = alist[index];
                        let tmpaddr = element.href;
                        let rexft=/mailto%3a(\S*)/;

                        try {
                            if(tmpaddr.includes('www.iobit.com')) continue;
                            if(tmpaddr.includes('mailto=')){
                                tmpaddr = 'mailto:'+ rexft.exec(tmpaddr)[1];
                            }
                            if (element.target == '_blank' && (!element.outerHTML.includes('noopener'))){
                                if(tmpaddr == request.ScanURL){
                                    if (ScanResult == 1 || ScanResult == 7 ||(ScanResult == 2))
                                    {
                                        this.insertNewImgElement(document, element, 'iobit', false, 4, true);
                                    }
                                    else if (ScanResult == 8)
                                    {
                                        this.insertNewImgElement(document, element, 'iobit', false, 2, true);
                                    }
                                    else
                                    {
                                        //this.insertNewImgElement(document, alist[i], 'iobit', true,2);
                                    }

                                    // break;
                                }
                            }
                        } catch (error) {
                            console.log('error : '+error);
                        }


                    }
   
                }

            }
            else if (request.searchengine == 'gmxmail') {
                console.log("scanlink gmxmail~~~ao~~~");
            }
            else if (request.searchengine == 'protonmail') {
                var alist = document.getElementsByTagName('main');
                if (alist.length != 0)
                {
                    var main_div = alist[0];
                }
                if (main_div != undefined) {
                    var alist = main_div.getElementsByTagName('a');
                    let templist = {};
                    templist = {...alist};
                    for(let key in templist)
                    {
                        if(templist[key].href.includes('www.iobit.com'))
                        {
                            delete templist[key];
                        }
                    }
                    let index = 0;
                    for(let key in templist)
                    {
                        if(index != key)
                        {
                            //console.log(`index: ${index}, key: ${key}.`);
                            templist[index] = templist[key];
                            delete templist[key];
                        }
                        index++;
                    }
                    for (var i in templist) {
                        try
                        {
                            if (alist[i].target == '_blank' && alist[i].outerHTML.indexOf('noreferrer nofollow noopener') != -1) {
                                if (i == request.resultname) {
                                    var ScanResult = request.value;
                                    if (ScanResult == 1 || ScanResult == 7 ||(ScanResult == 2))
                                    {
                                        this.insertNewImgElement(document, templist[i], 'iobit', false, 4, true);
                                    }
                                    else if (ScanResult == 8)
                                    {
                                        this.insertNewImgElement(document, templist[i], 'iobit', false, 2, true);
                                    }
                                    else
                                    {
                                        //this.insertNewImgElement(document, alist[i], 'iobit', true,2);
                                    }
                                    break;
                                }
                            }
                        }
                        catch (err)
                        {
                            break;
                        }
                    }
                }
            }
            else if (request.searchengine == 'webmail') {
                console.log("scanlink webmail~~~ao~~~");
            }
            else if (request.searchengine == 'rumail') {
                let main_div = document.querySelector('div.letter__body');
                if (main_div != undefined) {
                    var alist = main_div.getElementsByTagName('a');

                        for (let index = 0; index < alist.length; index++) {
                            const element = alist[index];
                            try
                            {
                                if (element.target == '_blank' && element.outerHTML.indexOf('noopener noreferrer') != -1) {
                                    if (element.href == request.ScanURL) {
                                        let ScanResult = request.value;
                                        if (ScanResult == 1 || ScanResult == 7 ||(ScanResult == 2))
                                        {
                                            this.insertNewImgElement(document, element, 'iobit', false, 4, true);
                                        }
                                        else if (ScanResult == 8)
                                        {
                                            this.insertNewImgElement(document, element, 'iobit', false, 2, true);
                                        }
                                        else
                                        {
                                            //this.insertNewImgElement(document, alist[i], 'iobit', true,2);
                                        }
                                        // break;
                                    }
                                }
                            }
                            catch (err)
                            {
                                // break;
                            }
                            
                        }

                }
            }
        }
        else if (request.action == 'scanSenderResult') {
            if (request.searchengine == 'gmail') {
                //freshfrequency --;
                //if (window.location.href != request.)
                var alist = document.body.getElementsByTagName('div');

                for (var i in alist) {
                    try
                    {
                        if (alist[i].getAttribute('role') == 'main') {
                            var main_div = alist[i];
                            break;
                        }
                    }
                    catch(err)
                    {

                    }

                }
                if (main_div != undefined) {
                    alist = main_div.getElementsByTagName('span');
                    var attr = "";
                    // var res = [];

                    for (i in alist) {
                        try {
                            if (alist[i].getAttribute('dir') != undefined) continue;
                            attr = alist[i].getAttribute('email');
                        }
                        catch (error) {
                            continue;
                        }

                        if (attr != undefined && attr != "") {
                            if (i == request.resultname) {
								if(attr == request.Eaddr)
								{	
									var ScanResult = request.value;
									if (ScanResult == 8)
									{
										if(alist[i].childElementCount !=0 )
										{
											this.insertNewImgElement(document, alist[i].parentNode, alist[i].parentNode.lastChild, false,3);
										}
										else
										{									
											this.insertNewImgElement(document, alist[i], alist[i].parentNode.lastChild, false,3);//to insert
										}
									}
									else
									{
                                    //this.insertNewImgElement(document, alist[i].parentNode, alist[i].parentNode.lastChild, true,3);
									}
								}
                            }

                        }
                    }

                }
            }
            else if (request.searchengine == 'hotmail') {
                var alist = document.getElementsByTagName('div');
                for (var i in alist) {
                    if (alist[i].getAttribute('role') == 'main') {
                        var main_div = alist[i];
                        break;
                    }
                }
                if (main_div != undefined) {
                    alist = main_div.getElementsByTagName('span');
                    for (var i in alist) {
                        try {
                            if (alist[i].className.indexOf('lpc-hoverTarget')) {
                                if (alist[i].firstChild.tagName == 'DIV' && alist[i].firstChild.firstChild.tagName == 'SPAN') {
                                    if (alist[i].firstChild.firstChild.childNodes[1].nodeValue != undefined) {
                                        if (i == request.resultname) {
                                            var ScanResult = request.value;
                                            if (ScanResult == 8) {
                                                this.insertNewImgElement(document, alist[i].firstChild, alist[i], false,3);
                                            }
                                            else {
                                                //this.insertNewImgElement(document, alist[i].parentNode, alist[i], isSafe,3);
                                            }

                                            break;
                                        }


                                    }

                                }
                            }
                        }
                        catch (error) {
                            continue;
                        }

                    }
                }
            }
            else if (request.searchengine == 'yahoomail') {
                var alist = document.getElementsByTagName('div');
                for (var i in alist)
                {
                    if ( alist[i].getAttribute('role') == 'main')
                    {
                        var main_div = alist[i];
                        break;
                    }
                }
                if(main_div)
                {
                    alist = main_div.getElementsByTagName('span');
                    for (var i in alist) {

                        if (alist[i].getAttribute('data-test-id') == 'email-pill') {
                            try
                            {
                                if (i == request.resultname) {
                                    var ScanResult = request.value;
                                    if (ScanResult == 8) {
                                        this.insertNewImgElement(document, alist[i], 'iobit', false,3);
                                    }
                                    else {
                                        //this.insertNewImgElement(document, alist[i], 'iobit', isSafe,3);
                                    }

                                    break;
                                }
                            }
                            catch (err)
                            {
                                continue;
                            }

                        }
                    }
                }

            }
            else if (request.searchengine == 'aolmail') {
                let main_div = null;
                let tmpdiv = document.querySelectorAll('div[role]');
                for (let index = 0; index < tmpdiv.length; index++) {
                    const element = tmpdiv[index];
                    if(element.getAttribute('role')=='main'){
                        main_div = element;
                        break;
                    }
                }
                if(main_div)
                {
                    let alist = main_div.getElementsByTagName('span');
                    for (var i in alist) {
                        try
                        {
                            if (alist[i].getAttribute('data-test-id') == 'email-pill') {
                                if (i == request.resultname) {
                                    var ScanResult = request.value;
                                    if (ScanResult == 8) {
                                        this.insertNewImgElement(document, alist[i], 'iobit', false,3);
                                    }
                                    else {
                                        //this.insertNewImgElement(document, alist[i], 'iobit', isSafe,3);
                                    }

                                    break;
                                }
                            }

                        }
                        catch (err)
                        {
                            continue;
                        }
                    }
                }
            }
            else if (request.searchengine == 'yandexmail') {
                let main_div = document.querySelector('div.MessageViewerLayout__probeContainer--1vLHh')
                if(main_div)
                {
                    let alist = main_div.getElementsByTagName('span');
                    for (var i in alist) {
                        try
                        {
                            if (alist[i].getAttribute('class') == 'Sender_email_iWFMG qa-MessageViewer-SenderEmail') {
                                if (i == request.resultname) {
                                    var ScanResult = request.value;
                                    if (ScanResult == 8) {
                                        this.insertNewImgElement(document, alist[i], 'iobit', false,3);
                                    }
                                    else {
                                        //this.insertNewImgElement(document, alist[i], 'iobit', isSafe,3);
                                    }

                                    break;
                                }

                            }else if(alist[i].className.includes('ContactBadge_name_CChy2')){
                                if (i == request.resultname) {
                                    let ScanResult = request.value;
                                    let tmpElmt = alist[i].parentElement.parentElement;
                                    if (ScanResult == 8) {
                                        this.insertNewImgElement(document, tmpElmt, 'iobit', false,3);
                                    }
                                    else {
                                        //this.insertNewImgElement(document, alist[i], 'iobit', isSafe,3);
                                    }

                                    break;
                                }
                            }

                        }
                        catch (err)
                        {
                            continue;
                        }

                    }
                }
            }
            else if (request.searchengine == 'icloudmail') {
                console.log("scanSender icloudmail~~~ao~~~");
            }
            else if (request.searchengine == 'zohomail') {
                let main_div = document.querySelector('div.zmPVMail');
                if(main_div)
                {
                    let alist = main_div.getElementsByTagName('span');
                    for (var i in alist) {

                        if ((alist[i].getAttribute('class') == 'zmMHlD  jsCollDisp')||(alist[i].className=='jsReciID')) {
                            try
                            {
                                if (i == request.resultname) {
                                    if (request.value == 8) {
                                        this.insertNewImgElement(document, alist[i], 'iobit', false,3);
                                    }
                                    else {
                                        //this.insertNewImgElement(document, alist[i], 'iobit', isSafe,3);
                                    }

                                    break;
                                }
                            }
                            catch (err)
                            {
                                continue;
                            }

                        }
                    }
                }

            }
            else if (request.searchengine == 'gmxmail') {
                console.log("scanSender gmxmail~~~ao~~~");
            }
            else if (request.searchengine == 'protonmail') {
                console.log("scanSender protonmail~~~ao~~~");
            }
            else if (request.searchengine == 'webmail') {
                console.log("scanSender webmail~~~ao~~~");
            }
            else if (request.searchengine == 'rumail') {
                var alist = document.getElementsByTagName('span');
                for (var i in alist) 
                {
                    try
                    {
                        if (alist[i].getAttribute('class') == 'letter-contact' && 
                        (alist[i].parentNode.className == 'letter__author' || alist[i].parentNode.className.includes('letter__recipients')
                        ||alist[i].parentNode.className.includes('letter__header-details-recipient'))) {
                                if (i == request.resultname) {
                                    if (request.value == 8) {
                                        this.insertNewImgElement(document, alist[i], 'iobit', false,3);
                                    }
                                    else {
                                        //this.insertNewImgElement(document, alist[i], 'iobit', isSafe,3);
                                    }

                                    break;
                                }
                        }
                    }
                    catch (err)
                    {
                        continue
                    }
                }
        }

    }

    });
 
try
{

    function GetGhromeVersion()
    {
	    var version = window.navigator.userAgent;
	    var index = version.indexOf("Chrome/") + "Chrome/".length;
	    version = version.substring(index, index+2);
	    console.log("version: " + version);
	    return version;
    }


	CurrentVersion = GetGhromeVersion(); 		
	//console.log("CurrentVersion: " + CurrentVersion);
	if (CurrentVersion<17) 
	{
		//console.log("GhromeVersion < 17");
		//CheckURL();			
	}


    function layeroutEx(element, e, isSpecial = false)
    {
        /*if (obj.id == undefined || obj.id == '')
        {
            return;
        }
        var element= document.getElementById('d_' +obj.id);*/
        if (element == null) return;
        if (ShowDelay!=null)
        {
            // console.log('clearTimeout in layeroutEx: ' +ShowDelay);
            clearTimeout(ShowDelay);
            // console.log('');
        }

        if(element!=CurrDisplay)
        {
            if (CurrDisplay) { CurrDisplay.style.cssText+=";display:none;"; }
        }
        clearTimeout(delay);

        var x,y;
        if (e.currentTarget == element)
        {
            var obj = document.getElementById(element.id.slice(2));
            if (obj == null)return;

        }
        else
        {
            obj = e.currentTarget;
        }

        oRect = obj.getBoundingClientRect();
        x= oRect.left;
        if (document.documentElement.scrollWidth < oRect.left + 335)
        {
            x= oRect.left - 320;
        }
        y= oRect.bottom;
        h=obj.offsetHeight;
        sh = 0;
        sh=Math.max(document.documentElement.scrollTop, document.body.scrollTop);

        ShowDelay = window.setTimeout(function(){
            if(isSpecial)
            {
                element.style.cssText += ";display:block;left:" + (obj.offsetLeft + obj.offsetWidth/2) + "px;top:" + (obj.offsetTop + obj.offsetHeight) + "px;";
                //console.log(`Special-left: ${(obj.offsetLeft + obj.offsetWidth/2)}px, top: ${(obj.offsetTop + obj.offsetHeight)}px.`);
            }
            else
            {
                element.style.cssText+=";display:block;left:"+x+"px;top:"+(y+sh+5)+"px;";
                //console.log(`left: ${x}px, top: ${(y+sh+5)}px.`);
            }
                
            try
            {
                var span1 =  element.getElementsByTagName("span")[0];
                if (span1.clientHeight> 26)
                {
                    span1.style.cssText+="margin-top:8px;"
                }
            }
            catch(err)
            {

            }
        }, 800);
    }

    function layerinEx(element,e)
    {
        /*if (obj.id == undefined || obj.id == '')
        {
            return;
        }

        var element= document.getElementById('d_' + obj.id);*/
        if (element == null) return;
        CurrDisplay = element;

        if (ShowDelay!=null)
        {
            // console.log('clearTimeout in layerinEx: ' +ShowDelay);
            // console.log('');
            clearTimeout(ShowDelay);
        }

        if (e.currentTarget)
        {
            if (e.relatedTarget != element)
            {
                if (element != e.relatedTarget.parentNode)
                {
                    delay = window.setTimeout(function()
                    {
                        element.style.cssText+=";display:none;";
                    }, 500);

                    //element.style.cssText+=";display:none;";
                }
            }
        } else
        {
            if (e.toElement != element)
            {
                if (element != e.toElement.parentNode)
                {
                    delay = window.setTimeout(function()
                    {
                        element.style.cssText+=";display:none;";
                    }, 500);

                    //element.style.cssText+=";display:none;";
                }
            }
        }
    }


	
    //***************************************************************** for Search Engine code

	function CheckAddASCImg(ImageList)
	{
		var k=0;
		var FindImg = false;
		for (k=0;k<=ImageList.length-1;k++)
		{							
			var asc_ImgID = "";
			if (ImageList[k].id)
			{
				asc_ImgID = ImageList[k].id;								
			}
            asc_ImgID = asc_ImgID.substring(0,6);
			if (asc_ImgID.indexOf("ascimg")!=-1)
			{
                //if(asc_ImgID.indexOf("-ascimg")==-1)
                //{
                    FindImg = true;
                    break;	
                //}			
			}
		}
		return FindImg;
	}
	

	function createDiv(currentDocument, isSafe,type, isSpecial = false)
	{
            var newDivElement = currentDocument.createElement("div");
			newDivElement.setAttribute("id", "d_ascimg" + InsertCount);
			/*newDivElement.setAttribute("onmouseover", "layerout(document.getElementById('"+ "ascimg" + InsertCount +"'), 'd" + InsertCount + "');");
			newDivElement.setAttribute("onmouseout", "layerin(document.getElementById('"+ "ascimg" + InsertCount +"'), event,'d" + InsertCount + "');");
*/
            newDivElement.addEventListener("mouseout",function (e) {
                    layerinEx(e.currentTarget,e);
                },false);
            newDivElement.addEventListener("mouseover",function (e) {
                    layeroutEx(e.currentTarget,e, isSpecial);
                },false);


            /*newDivElement.addEventListener("click",function (e) {
                    layerout(e.currentTarget);
                    e.cancelBubble = true;
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                },true);
			*/
			if (isSafe)
			{
				newDivElement.setAttribute("style", "border:1px solid #b6b6b6; float:left; display:none;position: absolute;overflow: hidden; z-index: 1000; left: 24px;width:340px;height:170px; font:14px arial; background:url(" + chrome.runtime.getURL("Plugin/img/bg.png") + ") 0 0 no-repeat;");
			}
			else
			{
				newDivElement.setAttribute("style", "border:1px solid #b6b6b6; float:left; display:none;position: absolute;overflow: hidden; z-index: 1000; left: 24px;width:340px;height:170px; font:14px arial; background:url(" + chrome.runtime.getURL("Plugin/img/bg.png") + ") 0 0 no-repeat;");
			}
            var topDiv = currentDocument.createElement("div");
            topDiv.setAttribute("style","height:44px;width:100%;");
            newDivElement.appendChild(topDiv);

            var bodyDiv = currentDocument.createElement("div");
			bodyDiv.setAttribute("style", "float:left; width:100%; height:96px;display:inline-block;");
			newDivElement.appendChild(bodyDiv);
			
		
            var dlElement = currentDocument.createElement("dl");
			dlElement.setAttribute("style", "width:100%; display:inline-block; overflow:hidden;margin:0");
			bodyDiv.appendChild(dlElement);
		
            var dtElement = currentDocument.createElement("dt");
			if (isSafe)
			{
				dtElement.setAttribute("style", "float:left; width:33px; margin-top: 10px; margin-left:26px;height:33px;background:url(" + chrome.runtime.getURL("Plugin/img/safe_logo.png")+ ") 0 0 no-repeat;");
			}
			else
			{
				dtElement.setAttribute("style", "float:left; width:33px; margin-top: 10px; margin-left:26px;height:33px;background:url(" + chrome.runtime.getURL("Plugin/img/risk_logo.png")+ ") 0 0 no-repeat;");
                var bottomDiv = currentDocument.createElement("div");
                bottomDiv.setAttribute("style","height:30px;width:100%;display:inline-block;");
                newDivElement.appendChild(bottomDiv);
			}
			dlElement.appendChild(dtElement);
			
            var ddElement = currentDocument.createElement("dd");			
			dlElement.appendChild(ddElement);
		    
			/**************
            var span1Element = currentDocument.createElement("span");			
			if (isSafe)
			{
				ddElement.setAttribute("style", "font-size:20px; margin-left:0px; margin-top:0px;");
                span1Element.setAttribute("style", "color:#009933; font-size:20px; margin-left:16px;");
                chrome.storage.sync.get('Site_Safe',function(data){
					span1Element.innerText = data.Site_Safe;
				});
			}											 
			else
			{
				ddElement.setAttribute("style", "font-size:20px; margin-left:0px; margin-top:0px;");
				span1Element.setAttribute("style", "color:#d70101; font-size:20px; margin-left:16px;");
				chrome.storage.sync.get('Site_Risk',function(data){
					span1Element.innerText = data.Site_Risk;
				});
			}
			ddElement.appendChild(span1Element);
			*************************************************/

            var span2Element = currentDocument.createElement("span");			
			if (isSafe)
			{
			    if (type == 2)
                {
                    span2Element.setAttribute("style", "color:#4c4c4c; font-size:17px; float: left;margin-top: 17px; margin-left: 14px;width:242px;display:block;text-align:left;");
                    chrome.storage.sync.get('Link_Safe_tip',function(data){
                        span2Element.innerText = data.Link_Safe_tip;
                    });
                }
                else if (type == 3)
                {
                    span2Element.setAttribute("style", "color:#4c4c4c; font-size:17px; float: left;margin-top: 17px; margin-left: 14px;width:242px;display:block;text-align:left;");
                    chrome.storage.sync.get('Sender_Safe_tip',function(data){
                        span2Element.innerText = data.Sender_Safe_tip;
                    });
                }
                else
                {
                    span2Element.setAttribute("style", "color:#4c4c4c; font-size:17px; float: left;margin-top: 17px; margin-left: 14px;width:242px;display:block;text-align:left;");
                    chrome.storage.sync.get('Site_Safe_tip',function(data){
                        if (data.Site_Safe_tip){
                            span2Element.innerText = data.Site_Safe_tip;
                        }
                        else{
                            span2Element.innerText = 'This site is safe.';
                        }

                    });
                }
			}
			else
			{

                if (type == 2)
                {
                    span2Element.setAttribute("style", "color:#4c4c4c; font-size:17px; float: left;margin-top: 17px; margin-left: 14px;width:242px;display:block;text-align:left;");
                    chrome.storage.sync.get('Link_Phish_tip',function(data){
                        span2Element.innerText = data.Link_Phish_tip;
                    });
                }
                else if (type == 3)
                {
                    span2Element.setAttribute("style", "color:#4c4c4c; font-size:17px; float: left;margin-top: 17px; margin-left: 14px;width:242px;display:block;text-align:left;");
                    chrome.storage.sync.get('Email_Risk_tip',function(data){
                        span2Element.innerText = data.Email_Risk_tip;
                    });
                }
                else if (type == 4)
                {
                    span2Element.setAttribute("style", "color:#4c4c4c; font-size:17px; float: left;margin-top: 17px; margin-left: 14px;width:242px;display:block;text-align:left;");
                    chrome.storage.sync.get('Link_Risk_tip',function(data){
                        span2Element.innerText = data.Link_Risk_tip;
                    });
                }
                else
                {
                    span2Element.setAttribute("style", "color:#4c4c4c; font-size:17px; float: left;margin-top: 17px; margin-left: 14px;width:242px;display:block;text-align:left;");
                    chrome.storage.sync.get('Site_Risk_tip',function(data){
                        span2Element.innerText = data.Site_Risk_tip;
                    });
                }

			}			
			ddElement.appendChild(span2Element);
			
			//**************************
			if (!isSafe)
			{
				var ulElement = currentDocument.createElement("ul");
				ulElement.setAttribute("style", "margin:0; color:#808080; font-size:12px; list-style:none; padding:0;");
                bottomDiv.appendChild(ulElement);
				
                var	li1_element = currentDocument.createElement("li");
                var	li2_element = currentDocument.createElement("li");
				/*if (ProtectType=='google')
				{
					li1_element.setAttribute("style", "width:220px; float:left; margin-top:8px;margin-left:10px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;");
                    li2_element.setAttribute("style", "text-align:center; width:90px; text-decoration:underline; cursor:pointer; position:relative; float:left; margin-top:3px;");

                }
				else
				{
					li1_element.setAttribute("style", "width:214px; float:left; margin-top:0px;");
                    li2_element.setAttribute("style", "text-align:center; width:110px; text-decoration:underline; cursor:pointer; position:relative; float:left; margin-top:-25px; margin-left:200px");

                }*/
                li1_element.setAttribute("style", "width:220px; float:left; margin-top:8px;margin-left:10px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;");
                li2_element.setAttribute("style", " width:110px; cursor:pointer; position:absolute; right:0px; margin-top:8px;white-space: nowrap;");

                ulElement.appendChild(li1_element);

                if (type == 2)
                {
                    chrome.storage.sync.get('Site_Advisory',function(data){
                        var Advisory_Str  = data.Site_Advisory;
                        li1_element.innerHTML = Advisory_Str + " IObit";
                    });
                    chrome.storage.sync.get('Site_Details',function(data){
                        var Site_Details  = data.Site_Details;
                        li2_element.innerHTML = "<a id='detail_more' style='text-align:right; color: #808080; text-decoration:underline; cursor:pointer; float: right; margin-right: 10px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;' target='_blank' href='https://www.iobit.com/goto.php?id=morede'>" + Site_Details + "</a>";
                        li2_element.style.cssText += 'cursor:default;';
                        ulElement.appendChild(li2_element);
                    });

                }
                else if (type == 3)
                {

                }
                else if (type == 4)
                {
                    chrome.storage.sync.get('Site_Advisory',function(data){
                        var Advisory_Str  = data.Site_Advisory;
                        li1_element.innerHTML = Advisory_Str + " <a id='googleSafe' style='font-size:12px; color:#808080; text-decoration:underline; cursor:pointer;' href='#' onClick=''>Google</a> & IObit";
                        var googleSafe = li1_element.getElementsByTagName("a");
                        googleSafe[0].setAttribute("target", "_blank");
                        googleSafe[0].setAttribute("href", "https://www.iobit.com/goto.php?id=google");
                    });
                    var tipdetailpng  = '"' + chrome.runtime.getURL("Plugin/img/tip_details.png")+'"';

                    chrome.storage.sync.get('Site_Details',function(data){
                        var Site_Details  = data.Site_Details;
                        li2_element.innerHTML = "<SPAN style='text-align:center; color: #808080; text-decoration:underline; cursor:default; float: right;width:110px; margin-right: 10px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;   '>" + Site_Details + " <ul id='asc_u" + InsertCount + "' style='font-size:10px; width:82px; height:64px; display:none;text-decoration:underline; padding-top:5px; background:url(" + tipdetailpng + ") 0 0 no-repeat; position:absolute; top:-60px; right:25px;list-style:none;padding:0;'> <li style='height:18px; line-height:18px;margin-top:10px;text-align: center;'><a href='https://www.iobit.com/goto.php?id=antiph' style='text-align:center;'>Anti-phishing</a></li> <li style='height:18px; line-height:18px;text-align: center;'><a href='https://www.iobit.com/goto.php?id=adware' style='text-align:center;'>Adware</a></li> </ul></SPAN>";
                        //console.log("<A style='text-align:right; color: #808080; text-decoration:underline; cursor:default; float: right; margin-right: 10px;   '>" + Site_Details + " <ul id='asc_u" + InsertCount + "' style='font-size:9px; width:82px; height:64px; display:none; padding-top:5px; background:url('" + tipdetailpng + "') 0 0 no-repeat; position:absolute; top:-55px; right:5px;list-style:none;padding:0;'> <li style='height:18px; line-height:18px;margin-top:10px;'><a href='https://www.iobit.com/goto.php?id=antiph' onClick='' style='text-align:center;'>Anti-phishing</a></li> <li style='height:18px; line-height:18px;'><a href='https://www.iobit.com/goto.php?id=adware' onClick='' style='text-align:center;'>Adware</a></li> </ul></A>");
                        //console.log(li2_element.innerHTML);
                        var test1 = li2_element.getElementsByTagName('span');

                        ulElement.appendChild(li2_element);
                        test1[0].addEventListener("mouseover",function (e) {
                            console.log('a');
                            e.currentTarget.childNodes[1].style.display = 'block';
                        },true);
                        test1[0].addEventListener("mouseout",function (e) {
                            e.currentTarget.childNodes[1].style.display = 'none';
                        },true);

                        var Adware = li2_element.getElementsByTagName('a');

                        Adware[0].setAttribute("target", "_blank");
                        Adware[1].setAttribute("target", "_blank');");

                        Adware[0].setAttribute("href", "https://www.iobit.com/goto.php?id=antiph");
                        Adware[1].setAttribute("href", "https://www.iobit.com/goto.php?id=adware");
                    });
                }
                else
                {
                    chrome.storage.sync.get('Site_Advisory',function(data){
                        var Advisory_Str  = data.Site_Advisory;
                        li1_element.innerHTML = Advisory_Str + " <a id='googleSafe' style='font-size:12px; color:#808080; text-decoration:underline; cursor:pointer;' href='#' onClick=''>Google</a> & IObit";
                        var googleSafe = li1_element.getElementsByTagName("a");
                        googleSafe[0].setAttribute("target", "_blank");
                        googleSafe[0].setAttribute("href", "https://www.iobit.com/goto.php?id=google");
                    });
                    var tipdetailpng  = chrome.runtime.getURL("Plugin/img/tip_details.png");
                    chrome.storage.sync.get('Site_Details',function(data){
                        var Site_Details  = data.Site_Details;
                        li2_element.innerHTML = "<SPAN style='text-align:center; color: #808080; text-decoration:underline; cursor:default; float: right;width:110px; margin-right: 10px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;   '>" + Site_Details + " <ul id='asc_u" + InsertCount + "' style='font-size:10px; width:82px; height:64px; display:none; padding-top:5px; background:url(" + tipdetailpng + ") 0 0 no-repeat; position:absolute; top:-60px; right:25px;list-style:none;padding:0;'> <li style='height:18px; line-height:18px;margin-top:10px;text-align: center;'><a href='https://www.iobit.com/goto.php?id=antiph' style='text-align:center;'>Anti-phishing</a></li> <li style='height:18px; line-height:18px;text-align: center;'><a href='https://www.iobit.com/goto.php?id=adware' style='text-align:center;'>Adware</a></li> </ul></SPAN>";
                        var test1 = li2_element.getElementsByTagName('span');

                        ulElement.appendChild(li2_element);
                        test1[0].addEventListener("mouseover",function (e) {
                            console.log('a');
                            e.currentTarget.childNodes[1].style.display = 'block';
                        },true);
                        test1[0].addEventListener("mouseout",function (e) {
                            e.currentTarget.childNodes[1].style.display = 'none';
                        },true);
                        var Adware = li2_element.getElementsByTagName('a');

                        Adware[0].setAttribute("target", "_blank");
                        Adware[1].setAttribute("target", "_blank');");
                        Adware[0].setAttribute("href", "https://www.iobit.com/goto.php?id=antiph");
                        Adware[1].setAttribute("href", "https://www.iobit.com/goto.php?id=adware");
                    });
                }
			}
			return newDivElement;
	}

    function insertNewImgElement(currentDocument, parentElement, elementAfterNewOne, isSafe, type, isSpecial = false,isShowblock=false)
    {
		if (currentDocument && parentElement && elementAfterNewOne)
        {
        			var acheck = parentElement.getElementsByTagName('img');
        			// for (var i=0;i<acheck.length;i++)
					// {
                    //     if (acheck[i].id != undefined && acheck[i].id.indexOf('ascimg')==0)return;
					// }
                    var FindImg = CheckAddASCImg(acheck);
                    if (FindImg){
                        return;
                    }
					var iconURL = chrome.runtime.getURL("Plugin/img/safe.png");
					// var newURLElement = currentDocument.createElement("a");
					var newImageElement = currentDocument.createElement("img");
					//var newDivElement =  createDiv(currentDocument); //currentDocument.createElement("div");

					// newURLElement.setAttribute("href", "");
					//newDivElement.setAttribute("id", "d_ascimg" + InsertCount);

					newImageElement.setAttribute("src", iconURL);
                    if(isShowblock){
                        newImageElement.setAttribute("style", "cursor:Pointer;margin-left:4px;height:16px;display:block;");
                    }else
                    {
                        newImageElement.setAttribute("style", "cursor:Pointer;margin-left:4px;height:16px;");
                    }
					
					newImageElement.setAttribute("id", "ascimg" + InsertCount);
					//newImageElement.setAttribute("onmouseover", "layerout(this,'d" + InsertCount + "');");
					//newImageElement.setAttribute("onmouseout", "layerin(this, event,'d" + InsertCount + "');");
                    //newImageElement.setAttribute("onmouseover", "layerout(this,'d" + InsertCount + "');");
                    //newImageElement.setAttribute("onmouseout", "layerin(this, event,'d" + InsertCount + "');");
					newImageElement.addEventListener("mouseout",function (e) {
						layerinEx(document.getElementById('d_' + e.currentTarget.id),e);
                        e.cancelBubble = true;
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
					},true);
            		newImageElement.addEventListener("mouseover",function (e) {
            		    layeroutEx(document.getElementById('d_' + e.currentTarget.id), e, isSpecial);
                        e.cancelBubble = true;
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    },true);

					newImageElement.addEventListener("click",function (e) {
                        layeroutEx(document.getElementById(e.currentTarget.id));
						e.cancelBubble = true;
                        e.preventDefault();
						e.stopPropagation();
						return false;
					},true);
					if(ProtectType == 'google'){
						var a_element = parentElement.getElementsByTagName("a");
						var a_width = a_element[0].offsetWidth;
						//if(a_width>490)
							//a_element[0].setAttribute("style", "width:480px;overflow: hidden;display: -webkit-inline-box;");
					}
					try
					{
						//if (elementAfterNewOne.nextSibling){
						//	parentElement.insertBefore(newImageElement, elementAfterNewOne.nextSibling);//inserting
						//}
						//else
						//{
							parentElement.insertBefore(newImageElement, null);		
						//}
                    }
					catch(erro)
					{
						console.log("error:"+ erro);
					}
					
                    if (isSafe)
                    {
                        if (type == 2)
                        {
                            iconURL = chrome.runtime.getURL("Plugin/img/safe.png");
                            newImageElement.setAttribute("src", iconURL);
                            var newDivElement = createDiv(currentDocument, isSafe, type, isSpecial);
                        }
                        else if (type == 3)
                        {
                            iconURL = chrome.runtime.getURL("Plugin/img/safe.png");
                            newImageElement.setAttribute("src", iconURL);
                            var newDivElement = createDiv(currentDocument, isSafe, type, isSpecial);
                        }
                        else
                        {
                            iconURL = chrome.runtime.getURL("Plugin/img/safe.png");
                            newImageElement.setAttribute("src", iconURL);
                            var newDivElement = createDiv(currentDocument, isSafe);
                        }

                    }
                    else
                    {
                        if (type == 2)
                        {
                            iconURL = chrome.runtime.getURL("Plugin/img/risk.png");
                            newImageElement.setAttribute("src", iconURL);
                            var newDivElement = createDiv(currentDocument, isSafe, type, isSpecial);
                        }
                        else if (type == 3)
                        {
                            iconURL = chrome.runtime.getURL("Plugin/img/risk.png");
                            newImageElement.setAttribute("src", iconURL);
                            var newDivElement = createDiv(currentDocument, isSafe, type, isSpecial);
                        }
                        else if (type == 4)
                        {
                            iconURL = chrome.runtime.getURL("Plugin/img/risk.png");
                            newImageElement.setAttribute("src", iconURL);
                            var newDivElement = createDiv(currentDocument, isSafe, type, isSpecial);
                        }
                        else
                        {
                            iconURL = chrome.runtime.getURL("Plugin/img/risk.png");
                            newImageElement.setAttribute("src", iconURL);
                            var newDivElement =  createDiv(currentDocument, isSafe);
                        }
                    }	

					var divID = newDivElement.id;		   	
                    var ExistDivElement = currentDocument.getElementById(divID);
                    if (ExistDivElement)
                    {
                        currentDocument.body.removeChild(ExistDivElement);
                    }
                    if(isSpecial)
                    {
                        let parentNode = parentElement.parentElement;
                        parentNode.appendChild(newDivElement);
                        // console.log('*-------------------------------------------------------------------------*');
                    }
                    else
                    {
                        currentDocument.body.appendChild(newDivElement);
                    }
					InsertCount = InsertCount + 1;	
        }else{
			console.log('wrong');
		}
    }
    function insertNewImgElement_GoogleNew(currentDocument, parentElement, elementAfterNewOne, isSafe,type)
    {
        var hrefEnable = true;

        if (currentDocument && parentElement )
        {
            var iconURL = chrome.runtime.getURL("Plugin/img/safe.png");
            // var newURLElement = currentDocument.createElement("a");
            var newImageElement = currentDocument.createElement("img");
            //var newDivElement =  createDiv(currentDocument); //currentDocument.createElement("div");

            // newURLElement.setAttribute("href", "");
            //newDivElement.setAttribute("id", "d" + InsertCount);

            newImageElement.setAttribute("src", iconURL);
            newImageElement.setAttribute("style", "cursor:Pointer;margin-left:4px;");
            newImageElement.setAttribute("id", "ascimg" + InsertCount);
            /*newImageElement.setAttribute("onmouseover", "layerout(this,'d" + InsertCount + "');");
            newImageElement.setAttribute("onmouseout", "layerin(this, event,'d" + InsertCount + "');");*/

            newImageElement.addEventListener("mouseout",function (e) {
                layerinEx(document.getElementById('d_' + e.currentTarget.id),e);
                e.cancelBubble = true;
                e.preventDefault();
                e.stopPropagation();
                return false;
            },true);
            newImageElement.addEventListener("mouseover",function (e) {
                layeroutEx(document.getElementById('d_' + e.currentTarget.id),e);
                e.cancelBubble = true;
                e.preventDefault();
                e.stopPropagation();
                return false;
            },true);


            newImageElement.addEventListener("click",function (e) {
                layeroutEx(document.getElementById(e.currentTarget.id));
                e.cancelBubble = true;
                e.preventDefault();
                e.stopPropagation();
                return false;
            },true);

			if (!elementAfterNewOne)
			{
                parentElement.insertBefore(newImageElement, null);
			}
			else
			{
                if (elementAfterNewOne.nextSibling){
                    parentElement.insertBefore(newImageElement, elementAfterNewOne.nextSibling);
                }
                else
                {
                    parentElement.insertBefore(newImageElement, null);
                }
			}


            if (isSafe)
            {
                iconURL = chrome.runtime.getURL("Plugin/img/safe.png");
                newImageElement.setAttribute("src", iconURL);
                var newDivElement = createDiv(currentDocument, true, type);
            }
            else
            {
                iconURL = chrome.runtime.getURL("Plugin/img/risk.png");
                newImageElement.setAttribute("src", iconURL);
                var newDivElement =  createDiv(currentDocument, false, type);
            }

            var divID = newDivElement.id;
            var ExistDivElement = currentDocument.getElementById(divID);
            if (ExistDivElement)
            {
                currentDocument.body.removeChild(ExistDivElement);
            }
            currentDocument.body.appendChild(newDivElement);
            InsertCount = InsertCount + 1;
        }else{
            console.log('wrong');
        }
    }
	function protectResult(currentDocument)
	{
		if (currentDocument)
		{
			var bodyElement = currentDocument.body;
			//google wgb start
			if (bodyElement && (ProtectType == 'google'))
            {
				var listItemElements = bodyElement.getElementsByTagName("h3");
				var listItemElementsCount = listItemElements.length;
				CurrPageElementCount = listItemElementsCount;
				console.log("*****protectResult listItemElementsCount: " + listItemElementsCount);
				
				if (listItemElements && listItemElementsCount != 0)
				{
					for (var i = 0; i < listItemElementsCount; ++i)
					{
						var resultElements = listItemElements[i].getElementsByTagName("a");
						var asc_imgElement = listItemElements[i].getElementsByTagName("img");
						var hrefElements = listItemElements[i].parentNode.parentNode.getElementsByTagName("cite");
						
						if (resultElements && resultElements.length != 0)
						{
							var hreftoscan = '';
                            var hrefElement = listItemElements[i].getElementsByTagName("a")[0];
                            if (hrefElement.getElementsByTagName("h3").length != 0)
                            {
                                continue;
                            }
							hreftoscan = hrefElement.attributes['href'].value;
							if(hreftoscan == ''){
								console.log('empty url');
								continue;
							}else{
								hreftoscan = hreftoscan.replace(/<\/?[^>]*>/g,'');
								console.log('href to scan:'+i+'-'+hreftoscan);
							}
							
							if (asc_imgElement && asc_imgElement.length !=0)
							{									
								var FindImg = false;			
								FindImg = CheckAddASCImg(asc_imgElement);
								if (FindImg==false)
								{
									console.log("send scan: " + hreftoscan);
									chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'google'},function(response){});

								}
								else
								{
									console.log("*****protectResult Img Exists!");	
								}				
								
							}
							else
							{
								//console.log("*****protectResult Insert herf: " + hrefElement.href);
								console.log("send scan: " + hreftoscan);
								chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'google'},function(response){});

							}
						}
						else
						{
							//MOGAI wgb
                            var hreftoscan = '';
							var nextnode = listItemElements[i].parentNode;
							if(nextnode.nodeName === 'A')//zl google search upgrade
							{
								hreftoscan = nextnode.href;
								if (asc_imgElement && asc_imgElement.length !=0)
								{
									var FindImg = false;
									FindImg = CheckAddASCImg(asc_imgElement);
									if (FindImg==false)
									{
											console.log("send scan: " + hreftoscan);
											chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'google'},function(response){});

									}
									else
									{
											console.log("*****protectResult Img Exists!");
									}
								}
								else
								{
                                                //http://bnmwork.global.ssl.fastly.net/
                                   chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'google'},function(response){});

                                }
									
						  }else{
							var nextnode = listItemElements[i].nextSibling;
							while (nextnode != null)
							{
								if (nextnode.nodeName == "DIV")
								{
									var divChildList = nextnode.childNodes;
                                    for (var j = 0; j < divChildList.length; ++j)
									{
                                        if (divChildList[j].nodeName == "CITE")
										{
                                            hreftoscan = divChildList[j].innerHTML;
                                            if (asc_imgElement && asc_imgElement.length !=0)
											{
												var FindImg = false;
												FindImg = CheckAddASCImg(asc_imgElement);
												if (FindImg==false)
												{
													console.log("send scan: " + hreftoscan);
													chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'google'},function(response){});

												}
												else
												{
													console.log("*****protectResult Img Exists!");
												}
											}
											else
											{
                                                //http://bnmwork.global.ssl.fastly.net/
                                                chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'google'},function(response){});

                                            }
											break;
										}
									}
									break;
								}
                                nextnode = nextnode.nextSibling;
							}							
						  }

						}		
					}
				}
				else
				{
					window.setTimeout(function() {protectResult(currentDocument);}, 3000);
				}
			}	

// google end

			//google new end
            if (bodyElement && (ProtectType == 'yahoo'))
            {
                console.log("*****protectResult yahoo");
				var listItemElements = bodyElement.getElementsByTagName("h3");
				var listItemElementsCount = listItemElements.length;
				CurrPageElementCount = listItemElementsCount;
				console.log("*****protectResult listItemElementsCount: " + listItemElementsCount);
				
				if (listItemElements && listItemElementsCount != 0)
				{
					for (var i = 0; i < listItemElementsCount; ++i)
					{
						var resultElements = listItemElements[i].getElementsByTagName("a");
						var asc_imgElement = listItemElements[i].getElementsByTagName("img");
						//var hrefElements = listItemElements[i].parentNode.parentNode.getElementsByTagName("span");
						var hrefElements = listItemElements[i].parentNode.parentNode.getElementsByTagName("a");
						
						if (resultElements && resultElements.length != 0)
						{
							var hreftoscan = '';
							for(var xx=0;xx<hrefElements.length;xx++)
							{
								hreftoscan = hrefElements[xx].href;
								break;
								/*
								if(hrefElements[xx].className=='url')
								{
									hreftoscan = hrefElements[xx].innerHTML;
									break;
								}
								*/
							}
							
							if(hreftoscan == ''){
								console.log('empty url');
								continue;
							}else{
								hreftoscan = hreftoscan.replace(/<\/?[^>]*>/g,'');
								console.log('dddddddddddddddd:'+i+'-'+hreftoscan);
							}
							
							if (asc_imgElement && asc_imgElement.length !=0)
							{									
								var FindImg = false;			
								FindImg = CheckAddASCImg(asc_imgElement);
								if (FindImg==false)
								{
									console.log("send scan: " + hreftoscan);
									chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'yahoo'},function(response){});
								}
								else
								{
									console.log("*****protectResult Img Exists!");	
								}				
								
							}
							else
							{
								//console.log("*****protectResult Insert herf: " + hrefElement.href);
								console.log("send scan: " + hreftoscan);
								chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'yahoo'},function(response){});	
							}
							
						}
						else  //zl jp
						{
							var hreftoscan = '';
							for(var xx=0;xx<hrefElements.length;xx++)
							{
								hreftoscan = hrefElements[xx].href;
								break;
								/*
								if(hrefElements[xx].className=='url')
								{
									hreftoscan = hrefElements[xx].innerHTML;
									break;
								}
								*/
							}
							
							if(hreftoscan == ''){
								console.log('empty url');
								continue;
							}else{
								hreftoscan = hreftoscan.replace(/<\/?[^>]*>/g,'');
								console.log('dddddddddddddddd:'+i+'-'+hreftoscan);
							}
							
							if (asc_imgElement && asc_imgElement.length !=0)
							{									
								var FindImg = false;			
								FindImg = CheckAddASCImg(asc_imgElement);
								if (FindImg==false)
								{
									console.log("send scan: " + hreftoscan);
									chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'yahoo'},function(response){});
								}
								else
								{
									console.log("*****protectResult Img Exists!");	
								}				
								
							}
							else
							{
								//console.log("*****protectResult Insert herf: " + hrefElement.href);
								console.log("send scan: " + hreftoscan);
								chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'yahoo'},function(response){});	
							}	
							
							//
						}						
						
					}
				}
				else
				{
					window.setTimeout(function() {protectResult(currentDocument);}, 3000);
				}
			}	
				
			if (ProtectType == 'bing')
			{
				var listItemElements = bodyElement.getElementsByTagName("h2");
				var listItemElementsCount = listItemElements.length;
				CurrPageElementCount = listItemElementsCount;
				console.log("*****protectResult listItemElementsCount: " + listItemElementsCount);
				
				if (listItemElements && listItemElementsCount != 0)
				{
					for (var i = 0; i < listItemElementsCount; ++i)
					{
						var resultElements = listItemElements[i].getElementsByTagName("a");
						var asc_imgElement = listItemElements[i].getElementsByTagName("img");
						var hrefElements = listItemElements[i].parentNode.parentNode.getElementsByTagName("cite");
						
						if (resultElements && resultElements.length != 0)
						{
							var hreftoscan = '';
							for(var xx=0;xx<resultElements.length;xx++){
								hreftoscan = resultElements[xx].href;
								break;
							}
							
							if(hreftoscan == ''){
								console.log('empty url');
								continue;
							}else{
								hreftoscan = hreftoscan.replace(/<\/?[^>]*>/g,'');
								console.log('dddddddddddddddd:'+i+'-'+hreftoscan);
							}
							
							var hrefElement = resultElements[0];
							
							if (asc_imgElement && asc_imgElement.length !=0)
							{									
								var FindImg = false;			
								FindImg = CheckAddASCImg(asc_imgElement);
								if (FindImg==false)
								{
									console.log("send scan: " + hreftoscan);
									chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'bing'},function(response){});
								}
								else
								{
									console.log("*****protectResult Img Exists!");	
								}				
								
							}
							else
							{
								//console.log("*****protectResult Insert herf: " + hrefElement.href);
								console.log("send scan: " + hreftoscan);
								chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'bing'},function(response){});	
							}
							
						}
						else
						{
							//
						}	
					}
				}
				else
				{
					window.setTimeout(function() {protectResult(currentDocument);}, 3000);
				}
			}				
		}		
	}
	
	
	function protectResult_baidu(currentDocument)
	{
		if (currentDocument)
		{
			
			var bodyElement = currentDocument.body;
            if (bodyElement)
            {
				var listItemElements = bodyElement.getElementsByTagName("h3");
				var listItemElementsCount = listItemElements.length;
				CurrPageElementCount = listItemElementsCount;
				//alert("*****protectResult listItemElementsCount ####: " + listItemElementsCount);
				console.log("*****protectResult listItemElementsCount ####: " + listItemElementsCount);
				if (listItemElements && listItemElementsCount != 0)
				{
					for (var i = 0; i < listItemElementsCount; ++i)
					{
						var resultElements = listItemElements[i].getElementsByTagName("a");
						var asc_imgElement = listItemElements[i].getElementsByTagName("img");
						var hrefelementnews = listItemElements[i].parentNode.getElementsByTagName("span");
						var hreftoscan = '';
						for(var xx=0;xx<hrefelementnews.length;xx++){
							if(hrefelementnews[xx].className=='g'||hrefelementnews[xx].className=='c-showurl'){
								hreftoscan = hrefelementnews[xx].innerHTML;
								break;
							}								
						}
							
						if(hreftoscan == ''){
							console.log('scan url:empty');
						}else{
							hreftoscan = hreftoscan.replace(/<\/?[^>]*>/g,'');
							console.log('scan url'+i+': '+hreftoscan);
						}
						//alert(hrefelementnews[0]);
						if (resultElements && resultElements.length != 0){
							if (hreftoscan == '')
							{
                                hreftoscan = resultElements[0].getAttribute("href");
                                console.log('scan url true: ' + hreftoscan);
							}
							if (asc_imgElement && asc_imgElement.length !=0)
							{	

								var FindImg = false;			
								FindImg = CheckAddASCImg(asc_imgElement);
								if (FindImg==false)
								{
									chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'baidu'},function(response){});
								}
								else
								{
									console.log("*****protectResult Img Exists!");	
								}								
								
							}
							else
							{
								console.log("protectResult waitTime!####");
								chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'baidu'},function(response){});
							}
						}
					}
				}
				else
				{
					window.setTimeout(function() {protectResult_baidu(currentDocument);}, 3000);
				}
			}
		}
	}	
	
	
	
	function protectResult_yandex(currentDocument)
	{
        if (currentDocument)
		{
			console.log("*****protectResult yandex");
			var bodyElement = currentDocument.body;
            if (bodyElement)
            {
					console.log("*****protectResult yandex");
					var listItemElements = bodyElement.getElementsByTagName("h2"); //b-serp2-item__title-link
					var listItemElementsCount = listItemElements.length;
                    var subTitleList = bodyElement.getElementsByTagName("div");
                    let subTitle_index = [];
                    var cur_index = 0;
                    for(let i in subTitleList)
                    {
                        try
                        {
                            if(subTitleList[i].getAttribute('class') == 'Sitelinks-Header')
                            {
                                subTitle_index.push(i);
                            }
                        }
                        catch(err)
                        {

                        }    
                    }
					CurrPageElementCount = listItemElementsCount;
					console.log("yandex*************************protectResult images__title listItemElementsCount: " + listItemElementsCount);
					
					if (listItemElements && listItemElementsCount != 0)
					{
                        //h2 title Link
						for (let i = 0; i < listItemElementsCount; ++i)
						{
							let resultElements = listItemElements[i];
							let asc_imgElement = resultElements.parentNode.getElementsByTagName("img");				
							let hreftoscanS =  listItemElements[i].parentElement;
							let hreftoscan = null;
							try
							{
								hreftoscan = hreftoscanS.href;
							}
                            catch(e)
							{
								console.log('except: ' + e);
							}  
								
							console.log("hreftoscan::"+hreftoscan);
							if (resultElements && (hreftoscan!=null))
							{
								if (asc_imgElement && asc_imgElement.length !=0)
								{									
									let FindImg = false;			
									FindImg = CheckAddASCImg(asc_imgElement);
									if (FindImg==false)
									{
										console.log("*****protectResult Insert herf: " + hreftoscan);
										chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'yandex'},function(response){});
									}	
								}
								else
								{
									console.log("*****protectResult Insert herf: " + hreftoscan);
									chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'yandex'},function(response){});
								}
							}		
                            cur_index++;
						}
                        //subtitle Link
                        for(let i = 0; i < subTitle_index.length; i++)
                        {
                            let resultElements = subTitleList[subTitle_index[i]];
                            let asc_imgElement = resultElements.getElementsByTagName("img");				
							let hreftoscanS =  resultElements.getElementsByTagName('a');
							let hreftoscan = null;
                            try
							{
								hreftoscan = hreftoscanS[0].href;
							}
                            catch(e)
							{
								console.log('except: ' + e);
							}  
								
							console.log("subtitle-hreftoscan::"+hreftoscan);
							if (resultElements && (hreftoscan!=null))
							{
                                console.log('index = ' + (cur_index + i));
								if (asc_imgElement && asc_imgElement.length !=0)
								{									
									let FindImg = false;			
									FindImg = CheckAddASCImg(asc_imgElement);
									if (FindImg==false)
									{
										console.log("*****protectResult Insert herf: " + hreftoscan);
										chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+(cur_index + i),searchengine:'yandex'},function(response){});
									}	
								}
								else
								{
									console.log("*****protectResult Insert herf: " + hreftoscan);
									chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+(cur_index + i),searchengine:'yandex'},function(response){});
								}
							}		
                        }
					}
					else
					{
						window.setTimeout(function() {protectResult_yandex(currentDocument);}, 3000);
					}
			}
		}			
	}
	
	function protectResult_babylon(currentDocument)
	{
		if (currentDocument)
		{
			var bodyElement = currentDocument.body;
            if (bodyElement)
            {
				var listItemElements = bodyElement.getElementsByClassName("gRsSlicetitle"); //bodyElement.getElementsByTagName("h2");
				var listItemElementsCount = listItemElements.length;
				CurrPageElementCount = listItemElementsCount;
				console.log("*****protectResult listItemElementsCount: " + listItemElementsCount);
				
				if (listItemElements && listItemElementsCount != 0)
				{
					for (var i = 0; i < listItemElementsCount; ++i)
					{
						var hrefElement = listItemElements[i];
						var asc_imgElement = hrefElement.parentNode.getElementsByTagName("img");
						var hreftoscans = hrefElement.parentNode.getElementsByTagName("span");
						var hreftoscan = '';
						for(var xx=0;xx<hreftoscans.length;xx++){
							if(hreftoscans[xx].className=='gRsSliceurl'&&hreftoscans[xx].dir=="ltr"){
								hreftoscan = hreftoscans[xx].innerHTML;
							}
						}
						hreftoscan = hreftoscan.replace(/<\/?[^>]*>/g,'');
						//console.log("*****protectResult_babylon hrefElement.class: " + hrefElement.className);
						
						if (hrefElement && (hrefElement.className=="gRsSlicetitle"))
						{					
							if (asc_imgElement && asc_imgElement.length !=0)
							{	
													
								var FindImg = false;			
								FindImg = CheckAddASCImg(asc_imgElement);
								if (FindImg==false)
								{
									console.log("****hreftoscan: " + hreftoscan);
									//this.insertNewImgElement(currentDocument, hrefElement.parentNode, hrefElement, true);
									chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'babylon'},function(response){});
								}
								else
								{
									console.log("*****protectResult Img Exists!");		
									
								}	
							}
							else
							{
								console.log("*****image false .hreftoscan: " + hreftoscan);
								//this.insertNewImgElement(currentDocument, hrefElement.parentNode, hrefElement, true);
								chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'babylon'},function(response){});
							}									
						}
					}
				}
				else
				{
					window.setTimeout(function() {protectResult_babylon(currentDocument);}, 3000);
				}
			}
		}		
	}
	
	function protectResult_v9(currentDocument)
	{
		if (currentDocument)
		{
			console.log("*****protectResult1");
			var bodyElement = currentDocument.body;
            if (bodyElement)
            {
				console.log("*****protectResult2");
				
				var listItemElements = bodyElement.getElementsByTagName("a"); //bodyElement.getElementsByTagName("h2");
				var listItemElementsCount = listItemElements.length;
					CurrPageElementCount = listItemElementsCount;
				console.log("*****protectResult listItemElementsCount: " + listItemElementsCount);
				
				if (listItemElements && listItemElementsCount != 0)
				{
					for (var i = 0; i < listItemElementsCount; ++i)
					{
						var hrefElement = listItemElements[i];
						var asc_imgElement = hrefElement.parentNode.getElementsByTagName("img");
						var hreftoscans = hrefElement.parentNode.parentNode.getElementsByClassName("url");
						var hreftoscan = '';
						for(var xx=0;xx<hreftoscans.length;xx++){
							hreftoscan = hreftoscans[xx].innerHTML;
							break;
						}
						hreftoscan = hreftoscan.replace(/<\/?[^>]*>/g,'');
						
						if (hrefElement && (hrefElement.parentNode.className=="title"))
						{
												
							if (asc_imgElement && asc_imgElement.length !=0)
							{	
								var FindImg = false;			
								FindImg = CheckAddASCImg(asc_imgElement);
								if (FindImg==false)
								{
									//console.log("*****protectResult Insert herf: " + hrefElement.href);
									//this.insertNewImgElement(currentDocument, hrefElement.parentNode, hrefElement, true);
									chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'v9'},function(response){});
								}
								else
								{
									console.log("*****protectResult Img Exists!");	
								}				
								
							}
							else
							{
								console.log("***** <img false> href toscan: " + hreftoscan);
								//this.insertNewImgElement(currentDocument, hrefElement.parentNode, hrefElement, true);						
								chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'v9'},function(response){});	
							}									
						}
					}
				}
				else
				{
					window.setTimeout(function() {protectResult_v9(currentDocument);}, 3000);
				}
			}
		}	
	}
	
    function protectresulte_duckduckgo(currentDocument)
    {
		if (currentDocument)
		{
			console.log("*****protectResult duckduckgo");
			var bodyElement = currentDocument.body;
            if (bodyElement)
            {
					console.log("*****protectResult duckduckgo");
					var listItemElements = bodyElement.getElementsByTagName("h2"); //b-serp2-item__title-link
					var listItemElementsCount = listItemElements.length;
					CurrPageElementCount = listItemElementsCount;
					console.log("duckduckgo*************************protectResult images__title listItemElementsCount: " + listItemElementsCount);
					
					if (listItemElements && listItemElementsCount != 0)
					{
						for (var i = 0; i < listItemElementsCount; ++i)
						{
							var resultElements = listItemElements[i]
							var asc_imgElement = resultElements.parentNode.getElementsByTagName("img");				
							//var hreftoscanS = resultElements.parentNode.getElementsByClassName('Link Link_theme_normal OrganicTitle-Link OrganicTitle-Link_wrap organic__url link');
							var hreftoscanS = resultElements.parentNode.getElementsByTagName("a");
							var hreftoscan = null;
							try
							{
								//var hreftoscan = hreftoscanS[0].href;
								 var hreftoscan = hreftoscanS[0].href;

							}catch(e)
							{
								console.log('except: ' + e);
							}  
								
							console.log("hreftoscan::"+hreftoscan);
							if (resultElements && (hreftoscan!=null))
							{
								if (asc_imgElement && asc_imgElement.length !=0)
								{									
									var FindImg = false;			
									FindImg = CheckAddASCImg(asc_imgElement);
									if (FindImg==false)
									{
										console.log("*****protectResult Insert herf: " + hreftoscan);
										//this.insertNewImgElement(currentDocument, hrefElement.parentNode, hrefElement, true);
										chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'duckduckgo'},function(response){});
									}	
								}
								else
								{
									console.log("*****protectResult Insert herf: " + hreftoscan);
									//this.insertNewImgElement(currentDocument, hrefElement.parentNode, hrefElement, true);
									chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'duckduckgo'},function(response){});
								}
							}		
						}
					}
					else
					{
						window.setTimeout(function() {protectresulte_duckduckgo(currentDocument);}, 3000);
					}
			}
		}	        
    }	


 function protectResulte_ask(currentDocument)
   {
        console.log("welcome to ask.com");
		if (currentDocument)
		{
			console.log("*****protectResult ask");
			var bodyElement = currentDocument.body;
            if (bodyElement)
            {
					console.log("*****protectResult ask");
                     
                    var listItemElements = document.querySelectorAll('.i_.div.si49, .result-title');
					var listItemElementsCount = listItemElements.length;
					CurrPageElementCount = listItemElementsCount;
					console.log("ask*************************protectResult images__title listItemElementsCount: " + listItemElementsCount);
					
					if (listItemElements && listItemElementsCount != 0)
					{
						for (var i = 0; i < listItemElementsCount; ++i)
						{
							var resultElements = listItemElements[i]
							var asc_imgElement = resultElements.parentNode.getElementsByTagName("img");				
							//var hreftoscanS = resultElements.parentNode.getElementsByClassName('Link Link_theme_normal OrganicTitle-Link OrganicTitle-Link_wrap organic__url link');
							var hreftoscanS = resultElements.parentNode.getElementsByTagName("a");
							var hreftoscan = null;
							try
							{
								//var hreftoscan = hreftoscanS[0].href;
								 var hreftoscan = hreftoscanS[0].href;

							}catch(e)
							{
								console.log('except: ' + e);
							}  
								
							console.log("hreftoscan::"+hreftoscan);
							if (resultElements && (hreftoscan!=null))
							{
								if (asc_imgElement && asc_imgElement.length !=0)
								{									
									var FindImg = false;			
									FindImg = CheckAddASCImg(asc_imgElement);
									if (FindImg==false)
									{
										console.log("*****protectResult Insert herf: " + hreftoscan);
										//this.insertNewImgElement(currentDocument, hrefElement.parentNode, hrefElement, true);
										chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'ask'},function(response){});
									}	
								}
								else
								{
									console.log("*****protectResult Insert herf: " + hreftoscan);
									//this.insertNewImgElement(currentDocument, hrefElement.parentNode, hrefElement, true);
									chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'ask'},function(response){});
								}
							}		
						}
					}
					else
					{
						window.setTimeout(function() {protectResulte_ask(currentDocument);}, 3000);
					}
			}
		}	 
	}	


function protectResulte_aol(currentDocument)
    {
        console.log("welcome to aol.com");
        if (currentDocument)
		{
			console.log("*****protectResult aol");
			var bodyElement = currentDocument.body;
            if (bodyElement)
            {
					console.log("*****protectResult aol");
					var listItemElements = bodyElement.getElementsByTagName("h3"); //b-serp2-item__title-link
					var listItemElementsCount = listItemElements.length;
					CurrPageElementCount = listItemElementsCount;
					console.log("aol*************************protectResult images__title listItemElementsCount: " + listItemElementsCount);
					
					if (listItemElements && listItemElementsCount != 0)
					{
						for (var i = 0; i < listItemElementsCount; ++i)
						{
							var resultElements = listItemElements[i]
							var asc_imgElement = resultElements.parentNode.getElementsByTagName("img");				
							//var hreftoscanS = resultElements.parentNode.getElementsByClassName('Link Link_theme_normal OrganicTitle-Link OrganicTitle-Link_wrap organic__url link');
							var hreftoscanS = resultElements.parentNode.getElementsByTagName("a");
							var hreftoscan = null;
							try
							{
								//var hreftoscan = hreftoscanS[0].href;
								 var hreftoscan = hreftoscanS[0].href;

							}catch(e)
							{
								console.log('except: ' + e);
							}  
								
							console.log("hreftoscan::"+hreftoscan);
							if (resultElements && (hreftoscan!=null))
							{
								if (asc_imgElement && asc_imgElement.length !=0)
								{									
									var FindImg = false;			
									FindImg = CheckAddASCImg(asc_imgElement);
									if (FindImg==false)
									{
										console.log("*****protectResult Insert herf: " + hreftoscan);
										//this.insertNewImgElement(currentDocument, hrefElement.parentNode, hrefElement, true);
										chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'aol'},function(response){});
									}	
								}
								else
								{
									console.log("*****protectResult Insert herf: " + hreftoscan);
									//this.insertNewImgElement(currentDocument, hrefElement.parentNode, hrefElement, true);
									chrome.runtime.sendMessage({action:'Scan',ScanURL:hreftoscan,ScanType:2,resultName:'result'+i,searchengine:'aol'},function(response){});
								}
							}		
						}
					}
					else
					{
						//window.setTimeout(function() protectresulte_aol(currentDocument);}, 3000);
					}
			}
		}
	console.log("wofolenie");	        
    }	

function mail_protect(AURL,isinit)
{
        //console.log('testlog into function mail_protect');
        if (AURL.indexOf('mail.google.com/mail/') != -1)
        {
            //alert(window.location.pathname);
            if ((window.location.href.search(/#.{1,8}\//) != -1))
            {
                //sovle user customize tab loading slowly
				if(window.location.href.lastIndexOf("/") > window.location.href.lastIndexOf("%"))
				{}
				else
				{
				    return;
				}
                var tmp = window.location.href.split("#search/");
                if (tmp.length >1)
                {
                    if (tmp[1].indexOf("/") == -1)
                    {
                        return;
                    }
                }
                if (isinit)
                {
                    //AddTip(document);
                    var alist = document.getElementsByTagName('div');
                    for (var i in alist)
                    {
                        if ( alist[i].getAttribute('role') == 'main')
                        {
                            //if(alist[i].className !== 'nH'){
                                var main_div = alist[i];
                                break;
                            //}
                            
                            
                        }
                    }
                    if (main_div)
                    {
                        addDivMonitor(main_div);
                    }
                    else
                    {
                        addDivMonitor(document);
                    }
                }
                mail_protect_gmail();
            }
            else if (window.location.href.search(/&th=.{16}.*&v=/) != -1)
            {
                if (isinit)
                {
                    //AddTip(document);
                    var alist = document.getElementsByTagName('table');
                    for (var i in alist)
                    {
                        try
                        {
                            if(alist[i].nextSibling.tagName == 'TABLE' && alist[i].nextSibling.className == 'ft')
                            {
                                var main_div = alist[i];
                            }
                        }
                        catch(err)
                        {

                        }
                    }
                    if (main_div)
                    {
                        addDivMonitor(main_div);
                    }
                    else
                    {
                        addDivMonitor(document);
                    }
                }
                mail_protect_gmail_classic();
                /*var alist = document.getElementsByTagName('a');

                for (i in alist)
                {
                    if ( alist[i].className =='' && alist[i].target == '_blank' && alist[i].outerHTML.indexOf('data-saferedirecturl') != -1)
                    {
                        this.insertNewImgElement(document, alist[i], 'www.baidu.com', true);
                    }
                }*/
            }
        }
        else if (AURL.indexOf('outlook.live.com/mail') != -1)
        {
            if (window.location.pathname.search(/\/.{1,12}\/id\//) != -1)
            {
                if (isinit)
                {
                    var alist = document.getElementsByTagName('div');
                    for (var i in alist)
                    {
                        try
                        {
                            if ( alist[i].getAttribute('role') == 'main')
                            {
                                var main_div = alist[i];
                                break;
                            }
                        }
                        catch(err)
                        {

                        }
                    }
                    if (main_div)
                    {
                        addDivMonitor(main_div)
                    }
                    else
                    {
                        addDivMonitor(document);
                    }
                }
                mail_protect_hotmail();
            }
        }
        else if (AURL.indexOf('mail.yahoo.com/d/') != -1)
        {
            if (window.location.pathname.search(/.*\/messages\//) != -1)
            {
                if (isinit)
                {
                    var alist = document.getElementsByTagName('div');
                    for (var i in alist)
                    {
                        try
                        {
                            if ( alist[i].getAttribute('role') == 'main')
                            {
                                var main_div = alist[i];
                                break;
                            }
                        }
                        catch(err)
                        {

                        }

                    }
                    if (main_div) {
                        addDivMonitor(main_div);
                    }
                    else
                    {
                        addDivMonitor(document);
                    }
                    //AddTip(document);
                }
                mail_protect_yahoo();
            }
        }
        else if (AURL.indexOf('mail.aol.com') != -1)
        {
            if(isinit)
            {
                var alist = document.getElementsByTagName('div');
                for (var i in alist)
                {
                    try
                    {
                        if (alist[i].getAttribute('role') == 'main')
                        {
                            var main_div = alist[i];
                            break;
                        }
                    }
                    catch(err)
                    {}
                }
                if(main_div){
                    addDivMonitor(main_div);
                }
                else
                {
                    addDivMonitor(document);
                }
            }
            mail_protect_aol();
        }
        else if (AURL.indexOf('mail.yandex.com') != -1)
        {
           if(isinit)
            {
                var alist = document.getElementsByTagName('div');
                for (var i in alist)
                {
                    try
                    {
                        if (alist[i].getAttribute('role') == 'main')
                        {
                            var main_div = alist[i];
                            break;
                        }
                    }
                    catch(err)
                    {}
                }
                if(main_div){
                    addDivMonitor(main_div);
                }
                else
                {
                    addDivMonitor(document);
                }
            }
            mail_protect_yandex(); 
        }
        else if (AURL.indexOf('icloud.com/mail') != -1)
        {
            if(isinit)
            {
                var alist = document.getElementsByTagName('div');
                for (var i in alist)
                {
                    try
                    {
                        if (alist[i].getAttribute('role') == 'main')
                        {
                            var main_div = alist[i];
                            break;
                        }
                    }
                    catch(err)
                    {}
                }
                if(main_div){
                    addDivMonitor(main_div);
                }
                else
                {
                    addDivMonitor(document);
                }
            }
            mail_protect_icloud(); 
        }
        else if (AURL.indexOf('mail.zoho.com') != -1)
        {
            if(isinit)
            {
                var alist = document.getElementsByTagName('div');
                for (var i in alist)
                {
                    try
                    {
                        if (alist[i].getAttribute('role') == 'main')
                        {
                            var main_div = alist[i];
                            break;
                        }
                    }
                    catch(err)
                    {}
                }
                if(main_div){
                    addDivMonitor(main_div);
                }
                else
                {
                    addDivMonitor(document);
                }
            }
            mail_protect_zoho(); 
        }
        else if (AURL.indexOf('gmx.com/mail') != -1)
        {
            if(isinit)
            {
                var alist = document.getElementsByTagName('div');
                for (var i in alist)
                {
                    try
                    {
                        if (alist[i].getAttribute('role') == 'main')
                        {
                            var main_div = alist[i];
                            break;
                        }
                    }
                    catch(err)
                    {}
                }
                if(main_div){
                    addDivMonitor(main_div);
                }
                else
                {
                    addDivMonitor(document);
                }
            }
            mail_protect_gmx(); 
        }
        else if (AURL.indexOf('mail.proton.me') != -1)
        {
            console.log('testlog intto proton mail me mail pro');
            if(isinit)
            {
                var alist = document.getElementsByTagName('div');
                for (var i in alist)
                {
                    try
                    {
                        if (alist[i].getAttribute('role') == 'main')
                        {
                            var main_div = alist[i];
                            break;
                        }
                    }
                    catch(err)
                    {}
                }
                if(main_div){
                    addDivMonitor(main_div);
                }
                else
                {
                    addDivMonitor(document);
                }
            }
            mail_protect_proton(); 
        }
        else if (AURL.indexOf('web.de/emai') != -1)
        {
            if(isinit)
            {
                var alist = document.getElementsByTagName('div');
                for (var i in alist)
                {
                    try
                    {
                        if (alist[i].getAttribute('role') == 'main')
                        {
                            var main_div = alist[i];
                            break;
                        }
                    }
                    catch(err)
                    {}
                }
                if(main_div){
                    addDivMonitor(main_div);
                }
                else
                {
                    addDivMonitor(document);
                }
            }
            mail_protect_gmx(); 
        }
        else if (AURL.indexOf('mail.ru') != -1)
        {
            if(isinit)
            {
                var alist = document.getElementsByTagName('div');
                for (var i in alist)
                {
                    try
                    {
                        if (alist[i].getAttribute('role') == 'main')
                        {
                            var main_div = alist[i];
                            break;
                        }
                    }
                    catch(err)
                    {}
                }
                if(main_div){
                    addDivMonitor(main_div);
                }
                else
                {
                    addDivMonitor(document);
                }
            }
            mail_protect_ru(); 
        }
}

function mail_protect_gmail()
{
        var alist = document.getElementsByTagName('div');
        for (var i in alist)
        {

            if ( alist[i].getAttribute('role') == 'main')
            {
                var main_div = alist[i];
                break;
            }
        }
        if (main_div != undefined)
        {
            alist = main_div.getElementsByTagName('a');
			var hasflag;
            for (i in alist)
            {
                hasflag = false;
                if ( alist[i].className =='' && alist[i].target == '_blank' && alist[i].outerHTML.indexOf('data-saferedirecturl') != -1 && alist[i].href !='')
                {
                    var acheck = alist[i].getElementsByTagName('img');
                    for (var j=0;j<acheck.length;j++)
                    {
                        if (acheck[j].id != undefined && acheck[j].id.indexOf('ascimg')==0)
                        {
                            hasflag = true;
                            break;
                        }

                    }
                    if (hasflag){
                        continue;
                    }

                    chrome.runtime.sendMessage({action:'ScanLink',ScanURL:alist[i].href,ScanType:2,resultName:i,searchengine:'gmail',type:1},function(response){});
                    //console.log(alist[i].href);
                    //this.insertNewImgElement(document, alist[i], 'www.baidu.com', true);
                    //freshfrequency ++;
                }
            }
            alist = main_div.getElementsByTagName('span');

            var attr = "";
           // var res = [];
            for (i in alist)
            {
            	try
				{
                    if (alist[i].getAttribute('dir') !=undefined) continue;
                    attr = alist[i].getAttribute('email');
				}
				catch (error)
				{
					continue;
				}

                if (attr != undefined && attr != "" )
                {
                	//res.push(alist[i]);
                    chrome.runtime.sendMessage({action:'ScanSender',Email:attr,ScanType:2,resultName:i,searchengine:'gmail'},function(response){});
                    //freshfrequency ++;
                }

            }
        }
	}
    function mail_protect_gmail_classic()
	{
        var alist = document.getElementsByTagName('table');
        for (var i in alist)
        {
            try
            {
                if(alist[i].nextSibling.tagName == 'TABLE' && alist[i].nextSibling.className == 'ft')
                {
                    var main_div = alist[i];
                }
            }
            catch(err)
            {

            }
        }
        if (main_div)
        {
            var alist = document.getElementsByTagName('a');

            for (var i in alist)
            {
                try
                {
                    if ( alist[i].className =='' && alist[i].target == '_blank' && alist[i].outerHTML.indexOf('data-saferedirecturl') != -1)
                    {
                        var sendhref = alist[i].href.replace(/http(s)?:\/\/www.google.com\/url\?q=/,'');
                        sendhref = sendhref.replace(/%3A/g,':');
                        sendhref = sendhref.replace(/%2F/g,'/');
                        //this.insertNewImgElement(document, alist[i], 'www.baidu.com', true);
                        chrome.runtime.sendMessage({action:'ScanLink',ScanURL:sendhref,ScanType:2,resultName:i,searchengine:'gmail_classic',type:1},function(response){});
                    }
                }
                catch(err)
                {

                }

            }
        }
	}
    function mail_protect_hotmail()
	{
        var alist = document.getElementsByTagName('div');
        for (var i in alist)
        {
            if ( alist[i].getAttribute('role') == 'main')
            {
                var main_div = alist[i];
                break;
            }
        }
        if (main_div != undefined)
        {
            alist = main_div.getElementsByTagName('a');
            /*if (validateEmail(alist[0].innerHTML))
            {
                alert(alist[0].innerHTML);
            }*/
            for (var i in alist)
            {
                if (alist[i].target == '_blank' && alist[i].outerHTML.indexOf('noopener noreferrer') != -1)
                {
                	try
					{
                        if(alist[i].href.indexOf('mailto:') == 0)
                        {
                            continue;
                        }
					}
					catch(error)
					{
						continue;
					}
                    chrome.runtime.sendMessage({action:'ScanLink',ScanURL:alist[i].href,ScanType:2,resultName:i,searchengine:'hotmail',type:1},function(response){});
                }
            }
            alist = main_div.getElementsByTagName('span');

            for (var i in alist)
			{
				try
				{
                    if(alist[i].className.indexOf('lpc-hoverTarget')!=-1)
                    {
                        if (alist[i].firstChild.tagName=='DIV' && alist[i].firstChild.firstChild.tagName=='SPAN' )
                        {
                            var mail = alist[i].firstChild.firstChild.childNodes[1].nodeValue.trim();
                            mail = mail.slice(1,-1);
                            //console.log('index:' + i + '  '+mail);
                            chrome.runtime.sendMessage({action:'ScanSender',Email:mail,ScanType:2,resultName:i,searchengine:'hotmail'},function(response){});
                            //this.insertNewImgElement(document, testa, 'www.baidu.com', true);
							
                        }
                    }
				}
				catch(error)
				{
					continue;
				}

			}
        }
	}
    function mail_protect_yahoo()
    {
        var alist = document.getElementsByTagName('div');
        for (var i in alist)
        {
            try
            {
                if ( alist[i].getAttribute('role') == 'main')
                {
                    var main_div = alist[i];
                    break;
                }
            }
            catch(err)
            {

            }
        }
        if (main_div != undefined) {
            var alist = main_div.getElementsByTagName('a');
            for (var i in alist) {
                try
                {
                    if (alist[i].target == '_blank' && alist[i].outerHTML.indexOf('ymailto') == -1 && alist[i].outerHTML.indexOf('nofollow') != -1) {
                        chrome.runtime.sendMessage({action:'ScanLink',ScanURL:alist[i].href,ScanType:2,resultName:i,searchengine:'yahoomail',type:1},function(response){});

                    }
                }
                catch (err)
                {}
            }
            alist = main_div.getElementsByTagName('span');
            for (var i in alist) {
                try
                {
                if (alist[i].getAttribute('data-test-id') == 'email-pill') {

                        var frommail = alist[i].lastElementChild.lastElementChild.innerHTML.replace("&nbsp;","");
                        frommail = frommail.replace("&lt;","");
                        frommail = frommail.replace("&gt;","");
                        chrome.runtime.sendMessage({action:'ScanSender',Email:frommail,ScanType:2,resultName:i,searchengine:'yahoomail'},function(response){});

                    }


                    /*alert(frommail);
                    break;*/
                }
                catch (error)
                {

                }
            }
        }
    }
    function mail_protect_aol()
    {
        let main_div = null;
        let tmpdiv = document.querySelectorAll('div[role]');
        for (let index = 0; index < tmpdiv.length; index++) {
            const element = tmpdiv[index];
            if(element.getAttribute('role')=='main'){
                main_div = element;
                break;
            }
        }
        if (main_div != undefined) {
            var alist = main_div.getElementsByTagName('a');
            console.log("testlog LinkCounts:" + alist.length);
            for (var i in alist) {
                try
                {
                   if (alist[i].target == '_blank' && alist[i].outerHTML.indexOf('nofollow') != -1) {
	                    var mailLink = alist[i].innerText;
	                    if (mailLink.indexOf('//') != -1)
                        {
                           mailLink = mailLink.slice(mailLink.indexOf("//")+2);
                        }
	        //console.log('testlog mailLink:' + mailLink);
                        chrome.runtime.sendMessage({action:'ScanLink',ScanURL:mailLink, ScanType:2,resultName:i,searchengine:'aolmail',type:1},function(response){});
                    }
                }
                catch (err) {}
            }
	
            alist = main_div.getElementsByTagName('span');
            for (var i in alist) {
                try
                {
                if (alist[i].getAttribute('data-test-id') == 'email-pill') {
                        let frommail = '';
                        let tmplist = alist[i].lastElementChild.getElementsByTagName('span');
                        if(tmplist.length > 0){
                            frommail = tmplist[0].lastElementChild.innerHTML.replace("&nbsp;","");
                            frommail = frommail.replace("&lt;","");
                            frommail = frommail.replace("&gt;","");
                        }else{
                            frommail = alist[i].lastElementChild.getAttribute('title');    
                        }
                        //console.log('===============aol mail address 2: '+frommail);
                        chrome.runtime.sendMessage({action:'ScanSender',Email:frommail,ScanType:2,resultName:i,searchengine:'aolmail'},function(response){});

                    }
                }
                catch (error)
                {

                }
            }
        }
    }
    function mail_protect_yandex()
    {
        var main_div = document.querySelector('div.MessageViewerLayout__probeContainer--1vLHh')
        if (main_div != undefined) {
            var alist = main_div.getElementsByTagName('a');
            console.log("testlog LinkCounts:" + alist.length);
            for (var i in alist) {
                try
                {
                   if (alist[i].target == '_blank' && alist[i].outerHTML.indexOf('noopener') != -1) {
	        var mailLink = alist[i].href;
	        //console.log('testlog mailLink ' + mailLink);
                        chrome.runtime.sendMessage({action:'ScanLink',ScanURL:mailLink, ScanType:2,resultName:i,searchengine:'yandexmail',type:1},function(response){});
                    }
                }
                catch (err) {}
            }
	
            alist = main_div.getElementsByTagName('span');
            for (var i in alist) {
                try
                {
                    if (alist[i].getAttribute('class') == 'Sender_email_iWFMG qa-MessageViewer-SenderEmail') {
                            let frommail = alist[i].getAttribute('title');
                            console.log('testlog mailSender ' + frommail);
                            chrome.runtime.sendMessage({action:'ScanSender',Email:frommail,ScanType:2,resultName:i,searchengine:'yandexmail'},function(response){});

                    }else if(alist[i].className.includes('ContactBadge_name_CChy2')){
                        let frommail = alist[i].innerHTML;
                        console.log('testlog mailSender ' + frommail);
                        chrome.runtime.sendMessage({action:'ScanSender',Email:frommail,ScanType:2,resultName:i,searchengine:'yandexmail'},function(response){});
                    }
        
                }
                catch (error)
                {

                }
            }
        }
    }
    function mail_protect_icloud()
    {

    }
    function mail_protect_zoho()
   {
        let main_div = document.querySelector('div.zmPVMail');
        if (main_div != undefined) {
            var alist = main_div.getElementsByTagName('a');
            console.log("testlog LinkCounts:" + alist.length);
            for (var i in alist) {
                try
                {
                    
                    let rexft=/mailto%3a(\S*)/;
                    let tmpaddr=alist[i].href;
                    if(tmpaddr.includes('www.iobit.com')) continue;
                    if(alist[i].href.includes('mailto=')){
                        tmpaddr = 'mailto:'+rexft.exec(alist[i].href)[1];
                    }

                   if (alist[i].target == '_blank' && (!alist[i].outerHTML.includes('noopener'))) {
                        chrome.runtime.sendMessage({action:'ScanLink',ScanURL:tmpaddr, ScanType:2,resultName:i,searchengine:'zohomail',type:1},function(response){});
                    }
                }
                catch (err) {}
            }
	
            alist = main_div.getElementsByTagName('span');
            console.log(alist.length);
            for (var i in alist) {
                try
                {
                if ((alist[i].getAttribute('class') == 'zmMHlD  jsCollDisp')||(alist[i].className=='jsReciID')) {
                        var frommail = alist[i].getAttribute('data-eid');
                        //console.log('testlog mailSender ' + frommail);
                        chrome.runtime.sendMessage({action:'ScanSender',Email:frommail,ScanType:2,resultName:i,searchengine:'zohomail'},function(response){});

                    }
                }
                catch (error)
                {

                }
            }
        }
    }
    function mail_protect_gmx()
    {
        var alist = document.getElementsByTagName('div');
        for (var i in alist)
        {
            try
            {
                if ( alist[i].getAttribute('class') == 'mail-body')
                {
                    var main_div = alist[i];
                    break;
                }
            }
            catch(err)
            {

            }
        }
        //console.log('testlog mail-body divCounts: ' + main_div.getElementsByTagName('div').length);
        //console.log('testlog mail-body aCounts: ' + main_div.getElementsByTagName('a').length);
        //console.log('testlog mail-body htmlCounts: ' + main_div.getElementsByTagName('html').length);
        //console.log('testlog mail-body bodyCounts: ' + main_div.getElementsByTagName('body').length);
        if (main_div != undefined)
        {
            alist = main_div.getElementsByTagName('a');
            console.log('testlog LinkCounts: ' + alist.length);
            for (var i in alist)
            {
                if (alist[i].target == '_blank' && alist[i].href != '')
                {
                    chrome.runtime.sendMessage({action:'ScanLink',ScanURL:alist[i].href,ScanType:2,resultName:i,searchengine:'gmxmail',type:1},function(response){});
                }
            }

            alist = main_div.getElementsByTagName('dl');
            for (var i in alist)
			{
				try
				{
                    if(alist[i].getAttribute('class') == 'mail-sender form-objc')
                    {
                        var mail = alist[i].firstChild.firstChild.getAttribute('title');
                        mail = mail.slice(mail.indexOf('<') + 1, mail.indexOf('>'));
                        chrome.runtime.sendMessage({action:'ScanSender',Email:mail,ScanType:2,resultName:i,searchengine:'gmxmail'},function(response){});
                        //this.insertNewImgElement(document, testa, 'www.baidu.com', true);
                    }
				}
				catch(error)
				{
					continue;
				}

			}
        }
	}
    function mail_protect_proton()
    {

        if (true) {
            var alist = document.getElementsByTagName('a');
            console.log('testlog LinkCounts: ' + alist.length);
            for (var i in alist) {
                try
                {
                    if (alist[i].target == '_blank' && alist[i].outerHTML.indexOf('nofollow') != -1) {
                        chrome.runtime.sendMessage({action:'ScanLink',ScanURL:alist[i].href,ScanType:2,resultName:i,searchengine:'yahoomail',type:1},function(response){});
                    }
                }
                catch (err)
                {}
            }
            alist = document.getElementsByTagName('span');
            for (var i in alist) {
                try
                {
                    if (alist[i].getAttribute('data-testid') == 'recipient-address') {
	                    var frommail = alist[i].innerHTML;
                        frommail = frommail.replace("&lt;","");
                        frommail = frommail.replace("&gt;","");
                        //console.log('testlog mail sender' + frommail);
                        chrome.runtime.sendMessage({action:'ScanSender',Email:frommail,ScanType:2,resultName:i,searchengine:'yahoomail'},function(response){});
                    }
                }
                catch (error)
                {

                }
            }
        }
    }
    function mail_protect_web()
    {

    }
    function mail_protect_ru()
    {
        let main_div = document.querySelector('div.letter__body');
        if (main_div != undefined) {
            let alist = main_div.getElementsByTagName('a');
            // console.log('testlog LinkCounts:' + alist.length);
            for (var i in alist) {
                try
                {
                    if (alist[i].target == '_blank' && alist[i].outerHTML.indexOf('noopener noreferrer') != -1) {
                        chrome.runtime.sendMessage({action:'ScanLink',ScanURL:alist[i].href,ScanType:2,resultName:i,searchengine:'rumail',type:1},function(response){});

                    }
                }
                catch (err)
                {}
            }
            alist = document.getElementsByTagName('span');
            // console.log('testlog if find sender' + alist.length);
            for (var i in alist) {
                try
                {
                if (alist[i].getAttribute('class') == 'letter-contact' && 
                (alist[i].parentNode.className == 'letter__author' || alist[i].parentNode.className.includes('letter__recipients')
                ||alist[i].parentNode.className.includes('letter__header-details-recipient'))) {
                        var frommail = alist[i].getAttribute('title');
                        // console.log('testlog mail sender: ' + frommail);
                        chrome.runtime.sendMessage({action:'ScanSender',Email:frommail,ScanType:2,resultName:i,searchengine:'rumail'},function(response){});

                    }

                }
                catch (error)
                {

                }
            }
        }
    }
	




	function AddTip(currentDocument)
	{
		if(currentDocument)
		{
			// var ahead = document.getElementsByTagName('head')[0];
			// js = document.createElement('script');
			// js.setAttribute('type', 'text/javascript');
			// js.setAttribute('src', chrome.runtime.getURL("Plugin/tips.js"));
			// ahead.appendChild(js);
		}
	}
	function addDivMonitor(mainElement)
    {

		if (mainElement){ 

				mainElement.addEventListener('DOMSubtreeModified',function (e) {
					if (e.target.tagName === 'DIV' && ((new Date()).getTime() - freshfrequency >2000))
					{
						freshfrequency = (new Date()).getTime();
                        if(window.location.href.indexOf('mail.google.com/mail/') != -1)
                        {
                            if(e.target.attributes.role != undefined)
                            {
                                if((e.target.attributes.role.value != 'button')&&(e.target.attributes.role.value != 'option')&&(e.target.attributes.role.value != 'toolbar'))
                                {
                                    setTimeout(function () {
                                    mail_protect(window.location.href);
                                    },500);
                                }
                            }
                            else{
                                if(e.target.className.indexOf('ip')==-1)
                                {
                                    setTimeout(function () {
                                        mail_protect(window.location.href);
                                    },500);
                                }
                            }
                        }
                        else
                        {
                            setTimeout(function () {
                                mail_protect(window.location.href);
                            },500);   
                        }
					}
				});
			//}
		}
    }
	//*****************
	function CheckURL()
	{
		chrome.storage.sync.get('isopen',function(data){
			if(data.isopen=='true'){
				chrome.runtime.sendMessage({action:'Scan',ScanURL:AURL,ScanType:2,resultName:'resultwindow'},function(response){});
			}
		});
	}

    function validateEmail(email) {
        var re = /^(([^()[\]\\.,;:\s@\"]+(\.[^()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        return re.test(email);
    }

    if(CheckFlag==0){
		CheckURL();
		//console.log('ex.js page check url');
		CheckFlag = 1;
	}
	console.log("before all_funcdisable");
	chrome.storage.sync.get('all_func_disable', function(data)
	{
		console.log(data.all_func_disable);
		if(data.all_func_disable == 1)
		{
			console.log('*************** all_func_disable is True.');
			return false;
		}
		
		/*chrome message listener*/
		console.log("all_funcdisable");
		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {	
		if (request.method == "startProtect")
		{
			console.log('start protect');
            //console.log(AURL);
			//console.log("************* startProtect " + request.firstRun + 'datetime: ' + Date());
			if (request.firstRun==1)
			{

				console.log("request.firstRun CheckURL");


				CheckURL();	
			}
			CheckFlag = 1;	
			
			//console.log("request.firstRun ::"+request.firstRun);
			if ( document && document.getElementsByTagName && document.getElementById &&document.body)
			{
				if (AURL.indexOf('mail') != -1)
                {
                        request.type = 2;
                }
                else
                {
                        request.type = 1;
                }
				console.log("testlog type:" + request.type);
				if (request.type == 2)
				{
				    if (request.firstRun == 0)
                    {
                            window.location.reload();
                            sendResponse({fresh:1});
                            return;
                    }
					//console.log('testlog is going to mail_protect');
					mail_protect(AURL,true);
                    sendResponse({data: 'success'});
                    return;
				}
				else
				{
					{
					waitTimeName = null;
					ProtectType = '';
					InsertCount = 0;


					// if (AURL.indexOf('www.google')!=-1)
					// {
					// 	window.setTimeout(function(){
					// 		ProtectType = 'google';
					// 		AddTip(document);
					// 		protectResult(document);}, 500);
					// }
					// else 
                    if ((AURL.indexOf('www.google')!=-1) &&(AURL.includes('search?')))
					{
						ProtectType = 'google';
						AddTip(document);
						window.setTimeout(function() {protectResult(document);}, 500);
					}
					else if (AURL.indexOf('www.bing.com')!=-1)
					{
						ProtectType = 'bing';
						AddTip(document);
						protectResult(document);
					}
					else if (AURL.indexOf('cn.bing.com')!=-1)
					{
						ProtectType = 'bing';
						AddTip(document);
						protectResult(document);
					}
					else if (AURL.indexOf('search.yahoo')!=-1)
					{
						ProtectType = 'yahoo';
						AddTip(document);
						protectResult(document);
					}
					else if (AURL.indexOf('search.yahoo.co.jp')!=-1)
					{
						ProtectType = 'yahoo';
						AddTip(document);
						protectResult(document);
					}
					else if (AURL.indexOf('www.yahoo.cn')!=-1)
					{
						ProtectType = 'yahoo';
						AddTip(document);
						protectResult(document);
					}
					else if (AURL.indexOf('www.baidu.com')!=-1)
					{
						console.log("baidu protect");
						ProtectType = 'baidu';
						AddTip(document);
						window.setTimeout(function() {protectResult_baidu(document);}, 1500);
						//protectResult_baidu(document);
					}
					else if (((AURL.indexOf('yandex.')!=-1)||(CurHost='ya.ru')) &&(AURL.includes('/search/')))
					{
						ProtectType = 'yandex';
						AddTip(document);
						window.setTimeout(function() {protectResult_yandex(document);}, 1500);
					}
					else if (AURL.indexOf('search.avg')!=-1)
					{
						ProtectType = 'avg';
						AddTip(document);
						protectResult(document);
					}
					else if (AURL.indexOf('babylon.com')!=-1)
					{
						ProtectType = 'babylon';
						console.log("**********babylon com");
						AddTip(document);
						protectResult_babylon(document);
					}
					else if (AURL.indexOf('http://search.v9.com')!=-1)
					{
						ProtectType = 'v9';
						console.log("**********http://search.v9.com");
						AddTip(document);
						protectResult_v9(document);
					}
					else if (AURL.indexOf('http://search.conduit.com')!=-1) {
						ProtectType = 'conduit';
						console.log("**********search.conduit.com");
						AddTip(document);
						protectResult_conduit(document);
					}
                    else if(AURL.indexOf('duckduckgo.com')!=-1){
                        ProtectType = 'duckduckgo';
                        console.log("*********duckduckgo.com");
                        AddTip(document);
                        protectresulte_duckduckgo(document);
                    }
                    else if(AURL.indexOf('ask.com')!=-1){
                        ProtectType = 'ask';
                        console.log("*********ask.com");
                        AddTip(document);
                        protectResulte_ask(document);
                    }
	                else if(AURL.indexOf('aol.com')!=-1){
                        ProtectType = 'aol';
                        console.log("*********aol.com");
                        AddTip(document);
                        protectResulte_aol(document);
                    }
				}
				}
			}
			else
			{
				console.log("**********document is null");
			}
			
			sendResponse({data: 'success'});			
		}	
		});	
		
	});   
    
		
  }catch(e)
  {
	console.log('except: ' + e);
  }  
