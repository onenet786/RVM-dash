
function getRandomString() {
  var text = "";
  var charset = "abcdefghijklmnopqrstuvwxyz";
  for (var i = 0; i < 5; i++)
      text += charset.charAt(Math.floor(Math.random() * charset.length));
  return text;
}

function GetRandomObj() {
  function GetRandom() {
      return Math.floor(Math.random() * 100) % 30;
  }
  var a, b, c, d;
  a = GetRandom();
  b = GetRandom();
  c = GetRandom();
  d = GetRandom();
  return { first: a, second: b, third: c, fourth: d };
}

var prefix = getRandomString();

// var inject_canvas = function(eventPre) {
//     console.log("this page OverrideDefaultFunction_debug");
//     function showNotification() {
//         const evt = new CustomEvent(eventPre + "_shk_showNote", { 'detail': {} });
//         window.dispatchEvent(evt);
//     }
//     const getImageData = CanvasRenderingContext2D.prototype.getImageData;
//     function overrideCanvasProto(root) {
//         function overrideCanvasInternal(name, old) {
//             // root.prototype['shk_' + name] = old;
//             Object.defineProperty(root.prototype, name, {
//                 value: function () {
//                     var width = this.width;
//                     var height = this.height;
//                     var content = this.getContext("2d");
//                     var imageData = getImageData.apply(content,[0, 0, width, height]);
//                     for (var i = 0; i < height; i++) {
//                         for (var j = 0; j < width; j++) {
//                             var index = ((i * (width * 4)) + (j * 4));
//                             imageData.data[index] = imageData.data[index] + RandomObj.first;
//                             imageData.data[index + 1] = imageData.data[index + 1] + RandomObj.second;
//                             imageData.data[index + 2] = imageData.data[index + 2] + RandomObj.third;
//                             imageData.data[index + 3] = imageData.data[index + 3] + RandomObj.fourth;
//                         }
//                     }
//                     content.putImageData(imageData, 0, 0);
//                     console.log("Finger print has block the track,the call is: " + name);
//                     showNotification();
//                     return old.apply(this, arguments);
//                 }
//             });
//         }
//         overrideCanvasInternal("toDataURL", root.prototype.toDataURL);
//         overrideCanvasInternal("toBlob", root.prototype.toBlob);
//     }
//     overrideCanvasProto(HTMLCanvasElement);

//     function overrideCanvasIMG(root){
//       function overrideRenderingFunction(name,root) {
//         // const name = "getImageData";
//         // root.prototype['shk_' + name] = getImageData;
//         Object.defineProperty(root.prototype, name, {
//             value: function () {
//                 var imageData = getImageData.apply(this, arguments);
//                 var height = imageData.height;
//                 var width = imageData.width;
//                 for (var i = 0; i < height; i++) {
//                     for (var j = 0; j < width; j++) {
//                         var index = ((i * (width * 4)) + (j * 4));
//                         imageData.data[index] = imageData.data[index] + RandomObj.first;
//                         imageData.data[index + 1] = imageData.data[index + 1] + RandomObj.second;
//                         imageData.data[index + 2] = imageData.data[index + 2] + RandomObj.third;
//                         imageData.data[index + 3] = imageData.data[index + 3] + RandomObj.fourth;
//                     }
//                 }
//                 console.log("has block the finger print,the call is :" + name);
//                 showNotification();
//                 return imageData;
//             }
//         });
//       }
//       overrideRenderingFunction("getImageData",root)
//     }
//     overrideCanvasIMG(CanvasRenderingContext2D); 
// };

var inject_canvas = function (eventPre) {
    console.log("this page inject_canvas");
    function showNotification() {
        const evt = new CustomEvent(eventPre + "_shk_showNote", { 'detail': {} });
        window.dispatchEvent(evt);
    }

  const toBlob = HTMLCanvasElement.prototype.toBlob;
  const toDataURL = HTMLCanvasElement.prototype.toDataURL;
  const getImageData = CanvasRenderingContext2D.prototype.getImageData;
  //
  var noisify = function (canvas, context) {
    if (context) {
      const RandomObj = GetRandomObj();
      //
      const width = canvas.width;
      const height = canvas.height;
      if (width && height) {
        const imageData = getImageData.apply(context, [0, 0, width, height]);
        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            const n = ((i * (width * 4)) + (j * 4));
            imageData.data[n + 0] = imageData.data[n + 0] + RandomObj.first;
            imageData.data[n + 1] = imageData.data[n + 1] + RandomObj.second;
            imageData.data[n + 2] = imageData.data[n + 2] + RandomObj.third;
            imageData.data[n + 3] = imageData.data[n + 3] + RandomObj.fourth;
          }
        }
        //
        // window.top.postMessage("canvas-fingerprint-defender-alert", '*');
        console.log("has block the finger print,the call is :" + imageData.length);
        showNotification();
        context.putImageData(imageData, 0, 0); 
      }
    }
  };
  const context = {
    "toBlob": function() {
        Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
        "value": function () {
          noisify(this, this.getContext("2d"));
          return toBlob.apply(this, arguments);
        }
      }); 
    },
    "toDataURL": function(){
      Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
        "value": function () {
          noisify(this, this.getContext("2d"));
          return toDataURL.apply(this, arguments);
        }
      });
    },
    "getImageData": function(){
      Object.defineProperty(CanvasRenderingContext2D.prototype, "getImageData", {
        "value": function () {
          noisify(this.canvas, this);
          return getImageData.apply(this, arguments);
        }
      });
    }
  }
  context.toBlob();
  context.toDataURL();
  context.getImageData();

};

var inject_audio = function (eventPre) {
	    function showNotification() {
        const evt = new CustomEvent(eventPre + "_shk_showNote", { 'detail': {} });
        window.dispatchEvent(evt);
    }
  const context = {
    "BUFF": null,
    "getChannelData": function (e) {
      const getChannelData = e.prototype.getChannelData;
      Object.defineProperty(e.prototype, "getChannelData", {
        "value": function () {
          const results_1 = getChannelData.apply(this, arguments);
          if (context.BUFF !== results_1) {
            context.BUFF = results_1;

            for (var i = 0; i < results_1.length; i += 100) {
              let index = Math.floor(Math.random() * i);
              results_1[index] = results_1[index] + Math.random() * 0.0000001;
            }
          }
          
		  console.log("Audio Finger print has block the track,the call is: getChannelData");
		  showNotification();
          return results_1;
        }
      });
    },
    "createAnalyser": function (e) {
      const createAnalyser = e.prototype.__proto__.createAnalyser;
      Object.defineProperty(e.prototype.__proto__, "createAnalyser", {
        "value": function () {
          const results_2 = createAnalyser.apply(this, arguments);
          const getFloatFrequencyData = results_2.__proto__.getFloatFrequencyData;
          Object.defineProperty(results_2.__proto__, "getFloatFrequencyData", {
            "value": function () {

              const results_3 = getFloatFrequencyData.apply(this, arguments);
              for (var i = 0; i < arguments[0].length; i += 100) {
                let index = Math.floor(Math.random() * i);
                arguments[0][index] = arguments[0][index] + Math.random() * 0.1;
              }
              
			  console.log("Audio Finger print has block the track,the call is: getFloatFrequencyData");
              return results_3;
            }
          });
          
		  console.log("Audio Finger print has block the track,the call is: createAnalyser");
		  showNotification();
          return results_2;
        }
      });
    }
  };
  //
  
  console.log('audio start');
  context.getChannelData(AudioBuffer);
  context.createAnalyser(AudioContext);
  
  console.log('audio buffer and Context');
  
  context.getChannelData(OfflineAudioContext);
  context.createAnalyser(OfflineAudioContext);
  //
  // document.documentElement.dataset.acxscriptallow = true;
	//showNotification();
};


var inject_webgl = function (eventPre) {

	   function showNotification() {
        const evt = new CustomEvent(eventPre + "_shk_showNote", { 'detail': {} });
        window.dispatchEvent(evt);
		}	
	
var Items = function (e){
	var rand = e.length * Math.random();
	return e[Math.floor(rand)];
}
function getRandomNum(power){
	var temp = [];
	for (var i = 0; i < power.length;i++)
	{
		temp.push(Math.pow(2,power[i]));
	}
	return Items(temp);
}

function GetRandomInt(power){
	var temp = [];
	for (var i = 0; i < power.length; i++) {
          var n = Math.pow(2, power[i]);
          temp.push(new Int32Array([n, n]));
        }
    return Items(temp);
}

function GetRandomFloat_point(power){
	var tmp = [];
    for (var i = 0; i < power.length; i++) {
          var n = Math.pow(2, power[i]);
          tmp.push(new Float32Array([Math.random(), n]));
    }
    return Items(tmp);
}

function GetRandomFloat_line(power){
	var tmp = [];
    for (var i = 0; i < power.length; i++) {
          var n = Math.pow(2, power[i]);
          tmp.push(new Float32Array([1, n]));
    }
    return Items(tmp);
}
	
	
  var config = {
  
      "webgl": {
        "buffer": function (target) {
          var proto = target.prototype ? target.prototype : target.__proto__;
          const bufferData = proto.bufferData;
          Object.defineProperty(proto, "bufferData", {
            "value": function () {
				//console.log("arguments",arguments);
                var arg_length = arguments[1].length;  
                if(arg_length===9 && arg_length)
                {
				
					 for (var i = 0;i<arg_length;i++)
					 {  
						var noise = 0.1 * Math.random() * arguments[1][i];
						arguments[1][i] = arguments[1][i] + noise;  
					 }
					console.log("webgl Finger print has block the track,the call is: bufferData " + arguments[1].length);
					showNotification();
                }
				
              return bufferData.apply(this, arguments);
            }
          });
		  
        },
        "parameter": function (target) {
          var proto = target.prototype ? target.prototype : target.__proto__;
          const getParameter = proto.getParameter;
          Object.defineProperty(proto, "getParameter", {
            "value": function () {
              //
              if (arguments[0] === 3379) return getRandomNum([14, 15]);
              //else if (arguments[0] === 36347) return getRandomNum([12, 13]);
              //else if (arguments[0] === 34076) return getRandomNum([14, 15]);
              //else if (arguments[0] === 34024) return getRandomNum([14, 15]);
              //else if (arguments[0] === 3386) return GetRandomInt([13, 14, 15]);
			  else if (arguments[0] === 3415) return GetRandomInt([13, 14, 15]);
              //else if (arguments[0] === 3413) return getRandomNum([1, 2, 3, 4]);
              //else if (arguments[0] === 3412) return getRandomNum([1, 2, 3, 4]);
              //else if (arguments[0] === 3411) return getRandomNum([1, 2, 3, 4]);
              else if (arguments[0] === 3410) return getRandomNum([1, 2, 3, 4]);
              //else if (arguments[0] === 34047) return getRandomNum([1, 2, 3, 4]);
              //else if (arguments[0] === 34930) return getRandomNum([1, 2, 3, 4]);
              //else if (arguments[0] === 34921) return getRandomNum([1, 2, 3, 4]);
              //else if (arguments[0] === 35660) return getRandomNum([1, 2, 3, 4]);
			  else if (arguments[0] === 35661) return getRandomNum([4, 5, 6, 7, 8]);
              else if (arguments[0] === 36349) return getRandomNum([10, 11, 12, 13]);
			  else if (arguments[0] === 33902) return GetRandomFloat_line([0,10,11,12,13]);
              else if (arguments[0] === 33901) return GetRandomFloat_point([0,10,11,12,13]);
              //else if (arguments[0] === 37446) return Items(["Graphics", "HD Graphics", "Intel(R) HD Graphics","Google SwiftShader"]);
              //else if (arguments[0] === 7938) return Items(["WebGL 1.0", "WebGL 1.0 (OpenGL)", "WebGL 1.0 (OpenGL Chromium)","WebGL 2.0"]);
              //else if (arguments[0] === 35724) return Items(["WebGL", "WebGL GLSL", "WebGL GLSL ES", "WebGL GLSL ES (OpenGL Chromium)","WebGL GLSL ES 1.0","WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)"]);
              //
			  console.log("webgl Finger print has block the track,the call is: getParameter"+arguments[0]);
			  showNotification();
              return getParameter.apply(this, arguments);
            }
          });
        }
      }
  };
  //
  
  console.log('start webgl');
  config.webgl.buffer(WebGLRenderingContext);
  config.webgl.buffer(WebGL2RenderingContext);
  console.log('webgl buffer');
  config.webgl.parameter(WebGLRenderingContext);
  config.webgl.parameter(WebGL2RenderingContext);

  // document.documentElement.dataset.wgscriptallow = true;
  
};
try
{
  var prefix = 'iobit';
  // localStorage.setItem('prefix',prefix);
	// OverrideDefaultFunction_debug(RandomObj.first,RandomObj.second,RandomObj.third,RandomObj.fourth , prefix);
  inject_canvas(prefix);
  inject_audio(prefix);
	inject_webgl(prefix);

}
catch(e)
{
	console.log(e)
}
