<template>
<main id="books" class="view">
    <h1>Books View</h1>
    <SearchBookComponent />
    <AddBooksLinkComponent />
    <RetrieveBooksComponent />
</main>
</template>

<script setup>
import SearchBookComponent from '@/components/books/home/SearchBookComponent.vue';
import AddBooksLinkComponent from '@/components/books/home/AddBooksLinkComponent.vue';
import RetrieveBooksComponent from '@/components/books/home/RetrieveBooksComponent.vue';
</script>