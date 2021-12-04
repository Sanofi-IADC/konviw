<!-- Demo.vue -->
<template>
  <div class="container">
    <iframe :id="iframeId" :src="url" scrolling="no" class="konviw--page" />
  </div>
</template>

<script>
export default {
  name: 'ConfluenceSlides',
  props: {
    pageId: { type: String, required: true },
    styleId: { type: String, required: true },
  },
  data() {
    return {
      iframeId: `konviw-slide-${this.pageId}`,
    };
  },
  computed: {
    url: function () {
      return `https://konviw.vercel.app/cpv/wiki/slides/konviw/${this.pageId}?style=${this.styleId}`;
    },
  },
};
</script>

<style lang="css" scoped>
.container {
  position: relative;
  left: 0px;
  top: 0;
  width: 100%;
}
iframe.konviw--page {
  position: relative;
  min-width: 100%;
  height: 600px;
  overflow: hidden;
  border: 1px solid lightgray;
  border-radius: 5px;
}
</style>
