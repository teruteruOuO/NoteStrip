<template>
<main id="dashboard" class="view">
    <p>Hello #{{ user.user.id }}</p>
    <LogoutComponent />
    <BookReadActivityComponent />
    <TopBooksComponent />
</main>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import LogoutComponent from '@/components/login/LogoutComponent.vue';
import BookReadActivityComponent from '@/components/dashboard/BookReadActivityComponent.vue';
import TopBooksComponent from '@/components/dashboard/TopBooksComponent.vue';

const user = useUserStore();
</script>