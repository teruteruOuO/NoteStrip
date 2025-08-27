<template>
<main id="dashboard" class="view">
    <p>Hello #{{ user.user.id }}</p>
    <BookReadActivityComponent />
    <TopBooksComponent />
</main>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import BookReadActivityComponent from '@/components/dashboard/BookReadActivityComponent.vue';
import TopBooksComponent from '@/components/dashboard/TopBooksComponent.vue';

const user = useUserStore();
</script>