<template>
<main id="check-book" class="view">
    <h1>Check book view</h1>
    <ViewBookComponent :book-id="book_id" :name="name" />
    <ViewBookNoteComponent :book-id="book_id" />
</main>
</template>

<script setup>
import ViewBookComponent from '@/components/books/update/ViewBookComponent.vue';
import ViewBookNoteComponent from '@/components/books/update/ViewBookNoteComponent.vue';

// Receives from router because props: true
const props = defineProps({
    book_id: { type: String, required: true },
    name: { type: String, default: '' }, // from query ?name=
});

const { book_id, name } = props;
</script>