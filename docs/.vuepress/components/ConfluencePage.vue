<!-- Demo.vue -->
<template>
  <div class="container">
    <p>
      Title: <i>{{ title }}</i>
    </p>
    <p>
      Excerpt: <i>{{ excerpt }}</i>
    </p>
    <p>
      iFrame Url:
      <a :href="iframeUrl"
        ><i>{{ iframeUrl }}</i></a
      >
    </p>
    <iframe
      id="konviw-iframe"
      class="konviw--page"
      :src="url"
      @load="LoadFrame((resize = true))"
      scrolling="no"
    >
    </iframe>
  </div>
</template>

<script>
export default {
  props: {
    pageId: { type: String, required: true },
  },
  data() {
    return {
      title: '',
      url: `https://konviw.vercel.app/cpv/wiki/spaces/konviw/pages/${this.pageId}`,
      excerpt: '',
      iframeUrl: '',
    };
  },
  methods: {
    LoadFrame(resize) {
      window.onmessage = (e) => {
        if (resize) {
          if (Object.prototype.hasOwnProperty.call(e.data, 'frameHeight')) {
            document.getElementById(
              'konviw-iframe',
            ).style.height = `${e.data.frameHeight}px`;
          }
          this.frameHeight = e.data.frameHeight;
        }

        if (Object.prototype.hasOwnProperty.call(e.data, 'iframeUrl')) {
          this.iframeUrl = e.data.iframeUrl;
        }
        if (Object.prototype.hasOwnProperty.call(e.data, 'title')) {
          this.title = e.data.title;
        }
        if (Object.prototype.hasOwnProperty.call(e.data, 'excerpt')) {
          this.excerpt = e.data.excerpt;
        }
        if (Object.prototype.hasOwnProperty.call(e.data, 'pageId')) {
          this.pageId = e.data.pageId;
        }
        if (Object.prototype.hasOwnProperty.call(e.data, 'slug')) {
          this.slug = e.data.slug;
          this.directUrl = `/${this.slug}/${this.pageId}`;
        }
      };
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
  width: 100%;
  overflow: hidden;
  border: 1px solid lightgray;
  border-radius: 5px;
}
</style>
