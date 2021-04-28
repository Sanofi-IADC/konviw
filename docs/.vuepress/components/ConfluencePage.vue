<!-- Demo.vue -->
<template>
  <div class="container">
    <div v-if="metadata">
      <p>
        Title: <i>{{ msgTitle }}</i>
      </p>
      <p>
        Space Key: <i>{{ msgSpaceKey }}</i>
      </p>
      <p>
        Page ID: <i>{{ msgPageId }}</i>
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

    <iframe
      :id="iframeId"
      :src="url"
      @load="iframeLoaded(iframeId)"
      scrolling="no"
      class="konviw--page"
    />
  </div>
</template>

<script>
import iFrameResize from 'iframe-resizer/js/iframeResizer';

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
      msgSpaceKey: '',
      iframeId: `konviw-iframe-${this.pageId}`,
    };
  },
  methods: {
    iframeLoaded(iframeId) {
      iFrameResize(
        {
          log: false,
          checkOrigin: false,
          onMessage: (messageData) => {
            // Callback fn when message is received
            this.msgPageId = messageData.message.konviwPageId;
            this.msgTitle = messageData.message.konviwTitle;
            this.msgExcerpt = messageData.message.konviwExcerpt;
            this.msgIframeUrl = messageData.message.konviwFrameUrl;
            this.msgSpaceKey = messageData.message.konviwSpaceKey;
          },
        },
        `#${iframeId}`,
      );
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
  min-width: 100%;
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
