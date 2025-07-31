<template>
	<HeaderComponent />
	<RouterView />
</template>

<script setup>
import { RouterView } from 'vue-router';
import HeaderComponent from './components/HeaderComponent.vue';
</script>
