import{o as s,c as t,a as n}from"./app.dcf30c32.js";import{_ as i}from"./plugin-vue_export-helper.21dcd24c.js";const c={name:"ConfluenceSlides",props:{pageId:{type:String,required:!0},styleId:{type:String,required:!0}},data(){return{iframeId:`konviw-slide-${this.pageId}`}},computed:{url:function(){return`https://konviw.vercel.app/cpv/wiki/slides/konviw/${this.pageId}?style=${this.styleId}`}}},d={class:"container"},o=["id","src"];function a(p,l,_,u,e,r){return s(),t("div",d,[n("iframe",{id:e.iframeId,src:r.url,scrolling:"no",class:"konviw--page"},null,8,o)])}var m=i(c,[["render",a],["__scopeId","data-v-61add142"]]);export{m as default};
