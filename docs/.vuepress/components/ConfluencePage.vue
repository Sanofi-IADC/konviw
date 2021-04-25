<!-- Demo.vue -->
<template>
  <div class="container">
    <div v-if="metadata">
      <p>
        Title: <i>{{ msgTitle }}</i>
      </p>
      <p>
        Excerpt: <i>{{ msgExcerpt }}</i>
      </p>
      <p>
        iFrame Url:
        <a :href="msgIframeUrl"
          ><i>{{ msgIframeUrl }}</i></a
        >
      </p>
    </div>
    <div v-if="switchTheme">
      <span class="label">Dark mode</span>
      <input type="checkbox" id="toggle" class="checkbox" v-model="darkMode" />
      <label for="toggle" class="switch"></label>
      <br />
      <br />
    </div>
    <!-- id="konviw-iframe" -->
    <iframe
      :id="iframeId"
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
  name: 'ConfluencePage',
  props: {
    pageId: { type: String, required: true },
    type: { type: String, required: true },
    switchTheme: { type: Boolean, default: false },
    metadata: { type: Boolean, default: true },
  },
  data() {
    return {
      darkMode: false,
      msgTitle: '',
      msgExcerpt: '',
      msgIframeUrl: '',
      msgPageId: '',
      msgSlug: '',
      directUrl: '',
      iframeId: `konviw-iframe-${this.pageId}`,
    };
  },
  methods: {
    LoadFrame(resize) {
      window.onmessage = (e) => {
        if (resize) {
          if (Object.prototype.hasOwnProperty.call(e.data, 'frameHeight')) {
            if (e.data.pageId === this.pageId) {
              document.getElementById(
                this.iframeId,
              ).style.height = `${e.data.frameHeight}px`;
            }
          }
        }

        if (Object.prototype.hasOwnProperty.call(e.data, 'iframeUrl')) {
          this.msgIframeUrl = e.data.iframeUrl;
        }
        if (Object.prototype.hasOwnProperty.call(e.data, 'title')) {
          this.msgTitle = e.data.title;
        }
        if (Object.prototype.hasOwnProperty.call(e.data, 'excerpt')) {
          this.msgExcerpt = e.data.excerpt;
        }
        if (Object.prototype.hasOwnProperty.call(e.data, 'pageId')) {
          this.msgPageId = e.data.pageId;
        }
        if (Object.prototype.hasOwnProperty.call(e.data, 'slug')) {
          this.msgSlug = e.data.slug;
          this.directUrl = `/${this.slug}/${this.pageId}`;
        }
      };
    },
  },
  computed: {
    url: function () {
      const theme = this.darkMode ? 'dark' : 'light';
      return `https://konviw.vercel.app/cpv/wiki/spaces/konviw/pages/${this.pageId}?type=${this.type}&theme=${theme}`;
      // return `http://localhost:3000/cpv/wiki/spaces/konviw/pages/${this.pageId}?type=${this.type}&theme=${theme}&cache=no-cache`;
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

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  background-color: rgba(0, 0, 0, 0.25);
  border-radius: 20px;
  transition: all 0.3s;
}
.switch::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: white;
  top: 1px;
  left: 1px;
  transition: all 0.3s;
}

.checkbox:checked + .switch::after {
  left: 20px;
}
.checkbox:checked + .switch {
  background-color: #29a906;
}
.checkbox {
  display: none;
}
span.label {
  font-size: 15px;
  vertical-align: top;
}
</style>
