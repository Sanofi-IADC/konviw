<template>
  <div ref="comment"></div>
</template>
<script>
export default {
  props: {
    pageId: { type: String, required: true },
  },
  mounted() {
    const utterances = document.createElement('script');
    utterances.type = 'text/javascript';
    utterances.async = true;
    utterances.crossorigin = 'anonymous';
    utterances.src = 'https://utteranc.es/client.js';
    utterances.setAttribute('issue-term', this.pageId); // pathname|url|title|og:title
    utterances.setAttribute('theme', 'github-light'); // theme
    utterances.setAttribute('repo', 'Sanofi-IADC/konviw-comments'); // repository
    this.$refs.comment.appendChild(utterances);
  },
};
</script>
