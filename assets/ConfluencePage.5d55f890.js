import{o as le,c as fe,a as v,t as j,g as Oe,w as Ae,v as Ve,d as B,p as qe,h as Ue}from"./app.9bf40d55.js";import{_ as Ke}from"./plugin-vue_export-helper.21dcd24c.js";var Te={exports:{}};(function(O){(function(p){if(typeof window=="undefined")return;var H=0,Q=!1,M=!1,A="message",V=A.length,q="[iFrameSizer]",X=q.length,k=null,S=window.requestAnimationFrame,Ee={max:1,scroll:1,bodyScroll:1,documentElementScroll:1},n={},Y=null,U={autoResize:!0,bodyBackground:null,bodyMargin:null,bodyMarginV1:8,bodyPadding:null,checkOrigin:!0,inPageLinks:!1,enablePublicMethods:!0,heightCalculationMethod:"bodyOffset",id:"iFrameResizer",interval:32,log:!1,maxHeight:1/0,maxWidth:1/0,minHeight:0,minWidth:0,mouseEvents:!0,resizeFrom:"parent",scrolling:!1,sizeHeight:!0,sizeWidth:!1,warningTimeout:5e3,tolerance:0,widthCalculationMethod:"scroll",onClose:function(){return!0},onClosed:function(){},onInit:function(){},onMessage:function(){x("onMessage function not defined")},onMouseEnter:function(){},onMouseLeave:function(){},onResized:function(){},onScroll:function(){return!0}};function de(){return window.MutationObserver||window.WebKitMutationObserver||window.MozMutationObserver}function W(e,t,c){e.addEventListener(t,c,!1)}function Re(e,t,c){e.removeEventListener(t,c,!1)}function Pe(){var e=["moz","webkit","o","ms"],t;for(t=0;t<e.length&&!S;t+=1)S=window[e[t]+"RequestAnimationFrame"];S?S=S.bind(window):f("setup","RequestAnimationFrame not supported")}function _e(e){var t="Host page: "+e;return window.top!==window.self&&(t=window.parentIFrame&&window.parentIFrame.getId?window.parentIFrame.getId()+": "+e:"Nested host page: "+e),t}function Ne(e){return q+"["+_e(e)+"]"}function ge(e){return n[e]?n[e].log:Q}function f(e,t){G("log",e,t,ge(e))}function he(e,t){G("info",e,t,ge(e))}function x(e,t){G("warn",e,t,!0)}function G(e,t,c,o){o===!0&&typeof window.console=="object"&&console[e](Ne(t),c)}function Se(e){function t(){function i(){ye(g),we(a),L("onResized",g)}l("Height"),l("Width"),ke(i,g,"init")}function c(){var i=z.substr(X).split(":"),u=i[1]?parseInt(i[1],10):0,h=n[i[0]]&&n[i[0]].iframe,m=getComputedStyle(h);return{iframe:h,id:i[0],height:u+o(m)+d(m),width:i[2],type:i[3]}}function o(i){if(i.boxSizing!=="border-box")return 0;var u=i.paddingTop?parseInt(i.paddingTop,10):0,h=i.paddingBottom?parseInt(i.paddingBottom,10):0;return u+h}function d(i){if(i.boxSizing!=="border-box")return 0;var u=i.borderTopWidth?parseInt(i.borderTopWidth,10):0,h=i.borderBottomWidth?parseInt(i.borderBottomWidth,10):0;return u+h}function l(i){var u=Number(n[a]["max"+i]),h=Number(n[a]["min"+i]),m=i.toLowerCase(),b=Number(g[m]);f(a,"Checking "+m+" is in range "+h+"-"+u),b<h&&(b=h,f(a,"Set "+m+" to min value")),b>u&&(b=u,f(a,"Set "+m+" to max value")),g[m]=""+b}function E(){function i(){function m(){var F=0,_=!1;for(f(a,"Checking connection is from allowed list of origins: "+h);F<h.length;F++)if(h[F]===u){_=!0;break}return _}function b(){var F=n[a]&&n[a].remoteHost;return f(a,"Checking connection is from: "+F),u===F}return h.constructor===Array?m():b()}var u=e.origin,h=n[a]&&n[a].checkOrigin;if(h&&""+u!="null"&&!i())throw new Error("Unexpected message received from: "+u+" for "+g.iframe.id+". Message was: "+e.data+". This error can be disabled by setting the checkOrigin: false option or by providing of array of trusted domains.");return!0}function C(){return q===(""+z).substr(0,X)&&z.substr(X).split(":")[0]in n}function R(){var i=g.type in{true:1,false:1,undefined:1};return i&&f(a,"Ignoring init message from meta parent page"),i}function P(i){return z.substr(z.indexOf(":")+V+i)}function N(i){f(a,"onMessage passed: {iframe: "+g.iframe.id+", message: "+i+"}"),L("onMessage",{iframe:g.iframe,message:JSON.parse(i)}),f(a,"--")}function te(){var i=document.body.getBoundingClientRect(),u=g.iframe.getBoundingClientRect();return JSON.stringify({iframeHeight:u.height,iframeWidth:u.width,clientHeight:Math.max(document.documentElement.clientHeight,window.innerHeight||0),clientWidth:Math.max(document.documentElement.clientWidth,window.innerWidth||0),offsetTop:parseInt(u.top-i.top,10),offsetLeft:parseInt(u.left-i.left,10),scrollTop:window.pageYOffset,scrollLeft:window.pageXOffset,documentHeight:document.documentElement.clientHeight,documentWidth:document.documentElement.clientWidth,windowHeight:window.innerHeight,windowWidth:window.innerWidth})}function K(i,u){function h(){T("Send Page Info","pageInfo:"+te(),i,u)}Le(h,32,u)}function ie(){function i(b,F){function _(){n[m]?K(n[m].iframe,m):u()}["scroll","resize"].forEach(function(ze){f(m,b+ze+" listener for sendPageInfo"),F(window,ze,_)})}function u(){i("Remove ",Re)}function h(){i("Add ",W)}var m=a;h(),n[m]&&(n[m].stopPageInfo=u)}function oe(){n[a]&&n[a].stopPageInfo&&(n[a].stopPageInfo(),delete n[a].stopPageInfo)}function re(){var i=!0;return g.iframe===null&&(x(a,"IFrame ("+g.id+") not found"),i=!1),i}function s(i){var u=i.getBoundingClientRect();return pe(a),{x:Math.floor(Number(u.left)+Number(k.x)),y:Math.floor(Number(u.top)+Number(k.y))}}function r(i){function u(){k=F,w(),f(a,"--")}function h(){return{x:Number(g.width)+b.x,y:Number(g.height)+b.y}}function m(){window.parentIFrame?window.parentIFrame["scrollTo"+(i?"Offset":"")](F.x,F.y):x(a,"Unable to scroll to requested position, window.parentIFrame not found")}var b=i?s(g.iframe):{x:0,y:0},F=h();f(a,"Reposition requested from iFrame (offset x:"+b.x+" y:"+b.y+")"),window.top!==window.self?m():u()}function w(){L("onScroll",k)!==!1?we(a):be()}function y(i){function u(){var _=s(F);f(a,"Moving to in page link (#"+m+") at x: "+_.x+" y: "+_.y),k={x:_.x,y:_.y},w(),f(a,"--")}function h(){window.parentIFrame?window.parentIFrame.moveToAnchor(m):f(a,"In page link #"+m+" not found and window.parentIFrame not found")}var m=i.split("#")[1]||"",b=decodeURIComponent(m),F=document.getElementById(b)||document.getElementsByName(b)[0];F?u():window.top!==window.self?h():f(a,"In page link #"+m+" not found")}function I(i){var u={};if(Number(g.width)===0&&Number(g.height)===0){var h=P(9).split(":");u={x:h[1],y:h[0]}}else u={x:g.width,y:g.height};L(i,{iframe:g.iframe,screenX:Number(u.x),screenY:Number(u.y),type:g.type})}function L(i,u){return Z(a,i,u)}function se(){switch(n[a]&&n[a].firstRun&&ce(),g.type){case"close":D(g.iframe);break;case"message":N(P(6));break;case"mouseenter":I("onMouseEnter");break;case"mouseleave":I("onMouseLeave");break;case"autoResize":n[a].autoResize=JSON.parse(P(9));break;case"scrollTo":r(!1);break;case"scrollToOffset":r(!0);break;case"pageInfo":K(n[a]&&n[a].iframe,a),ie();break;case"pageInfoStop":oe();break;case"inPageLink":y(P(9));break;case"reset":ve(g);break;case"init":t(),L("onInit",g.iframe);break;default:Number(g.width)===0&&Number(g.height)===0?x("Unsupported message received ("+g.type+"), this is likely due to the iframe containing a later version of iframe-resizer than the parent page"):t()}}function ae(i){var u=!0;return n[i]||(u=!1,x(g.type+" No settings for "+i+". Message was: "+z)),u}function ue(){for(var i in n)T("iFrame requested init",Fe(i),n[i].iframe,i)}function ce(){n[a]&&(n[a].firstRun=!1)}var z=e.data,g={},a=null;z==="[iFrameResizerChild]Ready"?ue():C()?(g=c(),a=g.id,n[a]&&(n[a].loaded=!0),!R()&&ae(a)&&(f(a,"Received: "+z),re()&&E()&&se())):he(a,"Ignored: "+z)}function Z(e,t,c){var o=null,d=null;if(n[e])if(o=n[e][t],typeof o=="function")d=o(c);else throw new TypeError(t+" on iFrame["+e+"] is not a function");return d}function me(e){var t=e.id;delete n[t]}function D(e){var t=e.id;if(Z(t,"onClose",t)===!1){f(t,"Close iframe cancelled by onClose event");return}f(t,"Removing iFrame: "+t);try{e.parentNode&&e.parentNode.removeChild(e)}catch(c){x(c)}Z(t,"onClosed",t),f(t,"--"),me(e)}function pe(e){k===null&&(k={x:window.pageXOffset!==p?window.pageXOffset:document.documentElement.scrollLeft,y:window.pageYOffset!==p?window.pageYOffset:document.documentElement.scrollTop},f(e,"Get page position: "+k.x+","+k.y))}function we(e){k!==null&&(window.scrollTo(k.x,k.y),f(e,"Set page position: "+k.x+","+k.y),be())}function be(){k=null}function ve(e){function t(){ye(e),T("reset","reset",e.iframe,e.id)}f(e.id,"Size reset requested by "+(e.type==="init"?"host page":"iFrame")),pe(e.id),ke(t,e,"reset")}function ye(e){function t(l){if(!e.id){f("undefined","messageData id not set");return}e.iframe.style[l]=e[l]+"px",f(e.id,"IFrame ("+d+") "+l+" set to "+e[l]+"px")}function c(l){!M&&e[l]==="0"&&(M=!0,f(d,"Hidden iFrame detected, creating visibility listener"),We())}function o(l){t(l),c(l)}var d=e.iframe.id;n[d]&&(n[d].sizeHeight&&o("height"),n[d].sizeWidth&&o("width"))}function ke(e,t,c){c!==t.type&&S&&!window.jasmine?(f(t.id,"Requesting animation frame"),S(e)):e()}function T(e,t,c,o,d){function l(){var N=n[o]&&n[o].targetOrigin;f(o,"["+e+"] Sending msg to iframe["+o+"] ("+t+") targetOrigin: "+N),c.contentWindow.postMessage(q+t,N)}function E(){x(o,"["+e+"] IFrame("+o+") not found")}function C(){c&&"contentWindow"in c&&c.contentWindow!==null?l():E()}function R(){function N(){n[o]&&!n[o].loaded&&!P&&(P=!0,x(o,"IFrame has not responded within "+n[o].warningTimeout/1e3+" seconds. Check iFrameResizer.contentWindow.js has been loaded in iFrame. This message can be ignored if everything is working, or you can set the warningTimeout option to a higher value or zero to suppress this warning."))}!!d&&n[o]&&!!n[o].warningTimeout&&(n[o].msgTimeout=setTimeout(N,n[o].warningTimeout))}var P=!1;o=o||c.id,n[o]&&(C(),R())}function Fe(e){return e+":"+n[e].bodyMarginV1+":"+n[e].sizeWidth+":"+n[e].log+":"+n[e].interval+":"+n[e].enablePublicMethods+":"+n[e].autoResize+":"+n[e].bodyMargin+":"+n[e].heightCalculationMethod+":"+n[e].bodyBackground+":"+n[e].bodyPadding+":"+n[e].tolerance+":"+n[e].inPageLinks+":"+n[e].resizeFrom+":"+n[e].widthCalculationMethod+":"+n[e].mouseEvents}function Ce(e){return typeof e=="number"}function Me(e,t){function c(){function r(y){var I=n[s][y];I!==1/0&&I!==0&&(e.style[y]=Ce(I)?I+"px":I,f(s,"Set "+y+" = "+e.style[y]))}function w(y){if(n[s]["min"+y]>n[s]["max"+y])throw new Error("Value for min"+y+" can not be greater than max"+y)}w("Height"),w("Width"),r("maxHeight"),r("minHeight"),r("maxWidth"),r("minWidth")}function o(){var r=t&&t.id||U.id+H++;return document.getElementById(r)!==null&&(r+=H++),r}function d(r){return r===""&&(e.id=r=o(),Q=(t||{}).log,f(r,"Added missing iframe ID: "+r+" ("+e.src+")")),r}function l(){switch(f(s,"IFrame scrolling "+(n[s]&&n[s].scrolling?"enabled":"disabled")+" for "+s),e.style.overflow=(n[s]&&n[s].scrolling)===!1?"hidden":"auto",n[s]&&n[s].scrolling){case"omit":break;case!0:e.scrolling="yes";break;case!1:e.scrolling="no";break;default:e.scrolling=n[s]?n[s].scrolling:"no"}}function E(){(typeof(n[s]&&n[s].bodyMargin)=="number"||(n[s]&&n[s].bodyMargin)==="0")&&(n[s].bodyMarginV1=n[s].bodyMargin,n[s].bodyMargin=""+n[s].bodyMargin+"px")}function C(){var r=n[s]&&n[s].firstRun,w=n[s]&&n[s].heightCalculationMethod in Ee;!r&&w&&ve({iframe:e,height:0,width:0,type:"init"})}function R(){n[s]&&(n[s].iframe.iFrameResizer={close:D.bind(null,n[s].iframe),removeListeners:me.bind(null,n[s].iframe),resize:T.bind(null,"Window resize","resize",n[s].iframe),moveToAnchor:function(r){T("Move to anchor","moveToAnchor:"+r,n[s].iframe,s)},sendMessage:function(r){r=JSON.stringify(r),T("Send Message","message:"+r,n[s].iframe,s)}})}function P(r){function w(){T("iFrame.onload",r,e,p,!0),C()}function y(L){if(!!e.parentNode){var se=new L(function(ae){ae.forEach(function(ue){var ce=Array.prototype.slice.call(ue.removedNodes);ce.forEach(function(z){z===e&&D(e)})})});se.observe(e.parentNode,{childList:!0})}}var I=de();I&&y(I),W(e,"load",w),T("init",r,e,p,!0)}function N(r){if(typeof r!="object")throw new TypeError("Options is not an object")}function te(r){for(var w in U)Object.prototype.hasOwnProperty.call(U,w)&&(n[s][w]=Object.prototype.hasOwnProperty.call(r,w)?r[w]:U[w])}function K(r){return r===""||r.match(/^(about:blank|javascript:|file:\/\/)/)!==null?"*":r}function ie(r){var w=r.split("Callback");if(w.length===2){var y="on"+w[0].charAt(0).toUpperCase()+w[0].slice(1);this[y]=this[r],delete this[r],x(s,"Deprecated: '"+r+"' has been renamed '"+y+"'. The old method will be removed in the next major version.")}}function oe(r){r=r||{},n[s]={firstRun:!0,iframe:e,remoteHost:e.src&&e.src.split("/").slice(0,3).join("/")},N(r),Object.keys(r).forEach(ie,r),te(r),n[s]&&(n[s].targetOrigin=n[s].checkOrigin===!0?K(n[s].remoteHost):"*")}function re(){return s in n&&"iFrameResizer"in e}var s=d(e.id);re()?x(s,"Ignored iFrame, already setup."):(oe(t),l(),c(),E(),P(Fe(s)),R())}function $(e,t){Y===null&&(Y=setTimeout(function(){Y=null,e()},t))}var ee={};function Le(e,t,c){ee[c]||(ee[c]=setTimeout(function(){ee[c]=null,e()},t))}function We(){function e(){function d(l){function E(R){return(n[l]&&n[l].iframe.style[R])==="0px"}function C(R){return R.offsetParent!==null}n[l]&&C(n[l].iframe)&&(E("height")||E("width"))&&T("Visibility change","resize",n[l].iframe,l)}Object.keys(n).forEach(function(l){d(l)})}function t(d){f("window","Mutation observed: "+d[0].target+" "+d[0].type),$(e,16)}function c(){var d=document.querySelector("body"),l={attributes:!0,attributeOldValue:!1,characterData:!0,characterDataOldValue:!1,childList:!0,subtree:!0},E=new o(t);E.observe(d,l)}var o=de();o&&c()}function He(e){function t(){Ie("Window "+e,"resize")}f("window","Trigger event: "+e),$(t,16)}function xe(){function e(){Ie("Tab Visable","resize")}document.visibilityState!=="hidden"&&(f("document","Trigger event: Visiblity change"),$(e,16))}function Ie(e,t){function c(o){return n[o]&&n[o].resizeFrom==="parent"&&n[o].autoResize&&!n[o].firstRun}Object.keys(n).forEach(function(o){c(o)&&T(e,t,n[o].iframe,o)})}function je(){W(window,"message",Se),W(window,"resize",function(){He("resize")}),W(document,"visibilitychange",xe),W(document,"-webkit-visibilitychange",xe)}function ne(){function e(o,d){function l(){if(d.tagName){if(d.tagName.toUpperCase()!=="IFRAME")throw new TypeError("Expected <IFRAME> tag, found <"+d.tagName+">")}else throw new TypeError("Object is not a valid DOM element")}d&&(l(),Me(d,o),c.push(d))}function t(o){o&&o.enablePublicMethods&&x("enablePublicMethods option has been removed, public methods are now always available in the iFrame")}var c;return Pe(),je(),function(d,l){switch(c=[],t(d),typeof l){case"undefined":case"string":Array.prototype.forEach.call(document.querySelectorAll(l||"iframe"),e.bind(p,d));break;case"object":e(d,l);break;default:throw new TypeError("Unexpected data type ("+typeof l+")")}return c}}function Be(e){e.fn?e.fn.iFrameResize||(e.fn.iFrameResize=function(c){function o(d,l){Me(l,c)}return this.filter("iframe").each(o).end()}):he("","Unable to bind to jQuery, it is not fully loaded.")}window.jQuery&&Be(window.jQuery),typeof p=="function"&&p.amd?p([],ne):O.exports=ne(),window.iFrameResize=window.iFrameResize||ne()})()})(Te);var Je=Te.exports;const Qe={name:"ConfluencePage",props:{pageId:{type:String,required:!0},type:{type:String,required:!0},switchTheme:{type:Boolean,default:!1},metadata:{type:Boolean,default:!0}},data(){return{darkMode:!1,msgTitle:"",msgExcerpt:"",msgIframeUrl:"",msgPageId:"",msgSpaceKey:"",iframeId:`konviw-iframe-${this.pageId}`}},methods:{iframeLoaded(O){Je({log:!1,checkOrigin:!1,onMessage:p=>{this.msgPageId=p.message.konviwPageId,this.msgTitle=p.message.konviwTitle,this.msgExcerpt=p.message.konviwExcerpt,this.msgIframeUrl=p.message.konviwFrameUrl,this.msgSpaceKey=p.message.konviwSpaceKey}},`#${O}`)}},computed:{url:function(){const O=this.darkMode?"dark":"light";return`https://konviw.vercel.app/cpv/wiki/spaces/konviw/pages/${this.pageId}?type=${this.type}&theme=${O}`}}},J=O=>(qe("data-v-f96e930c"),O=O(),Ue(),O),Xe={class:"container"},Ye={key:0},Ge=B(" Title: "),Ze=B(" Space Key: "),De=B(" Page ID: "),$e=B(" Excerpt: "),en=B(" iFrame Url: "),nn=["href"],tn={key:1},on=J(()=>v("span",{class:"label"},"Dark mode",-1)),rn=J(()=>v("label",{for:"toggle",class:"switch"},null,-1)),sn=J(()=>v("br",null,null,-1)),an=J(()=>v("br",null,null,-1)),un=["id","src"];function cn(O,p,H,Q,M,A){return le(),fe("div",Xe,[H.metadata?(le(),fe("div",Ye,[v("p",null,[Ge,v("i",null,j(M.msgTitle),1)]),v("p",null,[Ze,v("i",null,j(M.msgSpaceKey),1)]),v("p",null,[De,v("i",null,j(M.msgPageId),1)]),v("p",null,[$e,v("i",null,j(M.msgExcerpt),1)]),v("p",null,[en,v("a",{href:M.msgIframeUrl},[v("i",null,j(M.msgIframeUrl),1)],8,nn)])])):Oe("",!0),H.switchTheme?(le(),fe("div",tn,[on,Ae(v("input",{type:"checkbox",id:"toggle",class:"checkbox","onUpdate:modelValue":p[0]||(p[0]=V=>M.darkMode=V)},null,512),[[Ve,M.darkMode]]),rn,sn,an])):Oe("",!0),v("iframe",{id:M.iframeId,src:A.url,onLoad:p[1]||(p[1]=V=>A.iframeLoaded(M.iframeId)),scrolling:"no",class:"konviw--page"},null,40,un)])}var dn=Ke(Qe,[["render",cn],["__scopeId","data-v-f96e930c"]]);export{dn as default};