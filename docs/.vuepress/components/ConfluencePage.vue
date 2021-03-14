<!-- Demo.vue -->
<template>
  <div>
    <iframe id="cpv-iframe" class="app--frame" :src="url"> </iframe>
  </div>
</template>

<script>
export default {
  props: {
    pageId: { type: String, required: true },
  },
  data() {
    const url =
      'https://konviw.vercel.app/cpv/wiki/spaces/konviw/pages/' + this.pageId;
    // 'http://localhost:3000/cpv/wiki/spaces/konviw/pages/' + this.pageId;
    // console.log('pageId=', this.pageId);
    return { url };
  },
};
</script>

<style lang="css" scoped>
iframe.app--frame {
  display: flex;
  background: transparent;
  margin: 0;
  padding: 0;
  border: none;
  width: 1050px;
  height: 100%;
  position: absolute;
}

.app--content {
  position: absolute;
  background: transparent;
  margin: 0;
  padding: 0;
  border: none;
  left: 0%;
  right: 0%;
  top: 0;
  bottom: 40px;
}
</style>
