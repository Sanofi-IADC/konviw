<!-- ConfluenceCarousel.vue -->
<template>
  <div class="example-3d">
    <swiper class="swiper" :options="swiperOption">
      <swiper-slide v-for="(page, i) in pages" :key="i">
        <iframe
          width="100%"
          height="600px"
          frameborder="0"
          :src="urlPage(page)"
        ></iframe>
      </swiper-slide>
      <div class="swiper-pagination" slot="pagination"></div>
      <div class="swiper-button-prev" slot="button-prev"></div>
      <div class="swiper-button-next" slot="button-next"></div>
    </swiper>
  </div>
</template>

<script>
import { Swiper, SwiperSlide } from 'vue-awesome-swiper';
import 'swiper/css/swiper.css';

export default {
  name: 'ConfluenceCarousel',
  components: {
    Swiper,
    SwiperSlide,
  },
  data() {
    return {
      pages: [
        '77627494',
        '77627428',
        '77561880',
        '77561890',
        '77660200',
        '77627467',
        '77660239',
        '77627557',
        '77561961',
        '77594849',
        '77627885',
        '77627925',
        '77660827',
        '185794678',
      ],
      swiperOption: {
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        spaceBetween: 10,
        coverflowEffect: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 0.5,
          slideShadows: true,
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
      },
    };
  },
  methods: {
    urlPage: function (page) {
      return `https://konviw.vercel.app/cpv/wiki/spaces/konviw/pages/${page}`;
    },
  },
};
</script>

<style lang="css" scoped>
.example-3d {
  width: 100%;
  height: 650px;
  padding-top: 50px;
  padding-bottom: 50px;
}

.swiper {
  height: 100%;
  width: 100%;
}
.swiper .swiper-slide {
  border: solid;
  border-radius: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 415px;
  height: 615px;
  background-color: #fff;
}
</style>
