<template>
<main id="dashboard" class="view">
    <p>Hello #{{ user.user.id }}</p>
    <LogoutComponent />
</main>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import LogoutComponent from '@/components/login/LogoutComponent.vue';
const user = useUserStore();
</script>