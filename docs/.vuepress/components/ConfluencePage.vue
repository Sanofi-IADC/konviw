<!-- Demo.vue -->
<template>
  <div class="container">
    <div v-if="metadata">
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
    </div>
    <div v-if="switchTheme">
      <span class="label">Dark mode</span>
      <input type="checkbox" id="toggle" class="checkbox" v-model="darkMode" />
      <label for="toggle" class="switch"></label>
      <br />
      <br />
    </div>
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
    type: { type: String, required: true },
    switchTheme: { type: Boolean, default: false },
    metadata: { type: Boolean, default: true },
  },
  data() {
    return {
      darkMode: false,
      title: '',
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
  computed: {
    url: function () {
      const theme = this.darkMode ? 'dark' : 'light';
      return `https://konviw.vercel.app/cpv/wiki/spaces/konviw/pages/${this.pageId}?type=${this.type}&theme=${theme}&cache=no-cache`;
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
