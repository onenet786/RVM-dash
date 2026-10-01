//alert('tips');
/**
		var asc_top_move = 30;
		var asc_left_move = 5;
		function asc_to_im(t,s,sid,id,type){
			var asctotop=0;
			var asctoleft = 0;
			if(t==1){
				document.getElementById(id).style.display = 'block';				
				if(type=='bing'){
					pos = getElementPos(sid);
					var asctotop=pos.y+asc_top_move;
					var asctoleft=pos.x+asc_left_move;
					document.getElementById(id).style.top = asctotop+'px';
					document.getElementById(id).style.left = asctoleft+'px';
				}
			}else{
				document.getElementById(id).style.display = 'none';
			}
		}

		function getElementPos(elementId) {
			var ua = navigator.userAgent.toLowerCase();
			var isOpera = (ua.indexOf('opera') != -1);
			var isIE = (ua.indexOf('msie') != -1 && !isOpera); // not opera spoof
			var el = document.getElementById(elementId);
			if(el.parentNode === null || el.style.display == 'none') {
				return false;
			}
			var parent = null;
			var pos = [];     
			var box;     
			if(el.getBoundingClientRect) {    //IE
				box = el.getBoundingClientRect();
				var scrollTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
				var scrollLeft = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
				return {x:box.left + scrollLeft, y:box.top + scrollTop};
			}else if(document.getBoxObjectFor) {   // gecko    
				box = document.getBoxObjectFor(el); 
				var borderLeft = (el.style.borderLeftWidth)?parseInt(el.style.borderLeftWidth):0; 
				var borderTop = (el.style.borderTopWidth)?parseInt(el.style.borderTopWidth):0; 
				pos = [box.x - borderLeft, box.y - borderTop];
			} else {   // safari & opera    
				pos = [el.offsetLeft, el.offsetTop];  
				parent = el.offsetParent;     
				if (parent != el) { 
					while (parent) {  
						pos[0] += parent.offsetLeft; 
						pos[1] += parent.offsetTop; 
						parent = parent.offsetParent;
					}  
				}   
				if (ua.indexOf('opera') != -1 || ( ua.indexOf('safari') != -1 && el.style.position == 'absolute' )) { 
					pos[0] -= document.body.offsetLeft;
					pos[1] -= document.body.offsetTop;         
				}    
			}              
			if (el.parentNode) { 
				parent = el.parentNode;
			} else {
				parent = null;
			}
			while (parent && parent.tagName != 'BODY' && parent.tagName != 'HTML') { // account for any scrolled ancestors
				pos[0] -= parent.scrollLeft;
				pos[1] -= parent.scrollTop;
				if (parent.parentNode) {
					parent = parent.parentNode;
				} else {
					parent = null;
				}
			}
			return {x:pos[0], y:pos[1]};
		}
**/		
		
var
  delay = null;
  ShowDelay = null;
  CurrDisplay = null;
		
function layerout(obj, bgid)
{
	var element= document.getElementById(bgid);
	
	if (ShowDelay!=null)
	{
		console.log('clearTimeout: ' +ShowDelay);	
		clearTimeout(ShowDelay);
	}
	
	if(element!=CurrDisplay)
	{		
		if (CurrDisplay) { CurrDisplay.style.cssText+=";display:none;"; }
	}	
	clearTimeout(delay);	
	
	var x,y;
	oRect=obj.getBoundingClientRect();

	x= oRect.left;
	y= oRect.bottom;
	h=obj.offsetHeight;

	sh = 0;
	sh=Math.max(document.documentElement.scrollTop, document.body.scrollTop);
	
	
	ShowDelay = window.setTimeout(function(){						
					element.style.cssText+=";display:block;left:"+x+"px;top:"+(y+sh+5)+"px;";
				}, 800);
}

function layerin(obj,e,bgid) 
{   
	var element = document.getElementById(bgid);
	CurrDisplay = element;
	
	if (ShowDelay!=null)
	{
		console.log('clearTimeout: ' +ShowDelay);	
		clearTimeout(ShowDelay);
	}
	
	if (e.currentTarget) 
	{
		if (e.relatedTarget != obj)
		{
			if (obj != e.relatedTarget.parentNode)
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
 		if (e.toElement != obj)
		{
 			if (obj != e.toElement.parentNode) 
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


	function close_div(id)
	{
		//console.log('close_div '+ id);
		var element= document.getElementById(id);		
		element.style.cssText+=";display:none;";		
	}

	function layerIn_test(bgid)
	{
		alert('layerIn_test 1');
		var element= document.getElementById(bgid);
		
		var x = 400;
		var y= 40;
		var sh = 0;
		sh=Math.max(document.documentElement.scrollTop, document.body.scrollTop);
		
		alert('layerIn_test 3' + element);	
			
		element.style.cssText+=";display:block;left:"+x+"px;top:"+(y+sh+5)+"px;";
		
		alert('layerIn_test 2');
	}