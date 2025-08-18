<template>
	<HeaderComponent v-if="route.name !== 'home'"/>
	<RouterView />
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router';
import HeaderComponent from './components/HeaderComponent.vue';

const route = useRoute();
</script>
