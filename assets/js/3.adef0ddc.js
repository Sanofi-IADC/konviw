(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{331:function(t,e,a){},359:function(t,e,a){"use strict";a(331)},365:function(t,e,a){"use strict";a.r(e);a(172);var r={props:{pageId:{type:String,required:!0},type:{type:String,required:!0},metadata:{type:Boolean,default:!0}},data:function(){return{title:"",url:"https://konviw.vercel.app/cpv/wiki/spaces/konviw/pages/".concat(this.pageId,"?type=").concat(this.type,"&cache=no-cache"),excerpt:"",iframeUrl:""}},methods:{LoadFrame:function(t){var e=this;window.onmessage=function(a){t&&(Object.prototype.hasOwnProperty.call(a.data,"frameHeight")&&(document.getElementById("konviw-iframe").style.height="".concat(a.data.frameHeight,"px")),e.frameHeight=a.data.frameHeight),Object.prototype.hasOwnProperty.call(a.data,"iframeUrl")&&(e.iframeUrl=a.data.iframeUrl),Object.prototype.hasOwnProperty.call(a.data,"title")&&(e.title=a.data.title),Object.prototype.hasOwnProperty.call(a.data,"excerpt")&&(e.excerpt=a.data.excerpt),Object.prototype.hasOwnProperty.call(a.data,"pageId")&&(e.pageId=a.data.pageId),Object.prototype.hasOwnProperty.call(a.data,"slug")&&(e.slug=a.data.slug,e.directUrl="/".concat(e.slug,"/").concat(e.pageId))}}}},i=(a(359),a(26)),c=Object(i.a)(r,(function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",{staticClass:"container"},[t.metadata?a("div",[a("p",[t._v("\n      Title: "),a("i",[t._v(t._s(t.title))])]),t._v(" "),a("p",[t._v("\n      Excerpt: "),a("i",[t._v(t._s(t.excerpt))])]),t._v(" "),a("p",[t._v("\n      iFrame Url:\n      "),a("a",{attrs:{href:t.iframeUrl}},[a("i",[t._v(t._s(t.iframeUrl))])])])]):t._e(),t._v(" "),a("iframe",{staticClass:"konviw--page",attrs:{id:"konviw-iframe",src:t.url,scrolling:"no"},on:{load:function(e){t.LoadFrame(t.resize=!0)}}})])}),[],!1,null,"4795fc6d",null);e.default=c.exports}}]);