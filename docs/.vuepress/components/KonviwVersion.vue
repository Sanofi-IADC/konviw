<template>
  {{ konviwVersion }}
</template>

<script>
import * as pack from '../../../package.json'

export default {
  name: 'KonviwVersion',
  data() {
    return {konviwVersion: pack.version}
  }
};
</script>
