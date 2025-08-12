<template>
<main id="view-book" class="view">
    <h1>Check book view</h1>
    <ViewBookComponent :book-id="book_id" :name="name" />
    <ViewBookNoteComponent :book-id="book_id" :name="name" />
</main>
</template>

<script setup>
import { toRefs } from 'vue';
import ViewBookComponent from '@/components/books/update/ViewBookComponent.vue';
import ViewBookNoteComponent from '@/components/books/update/ViewBookNoteComponent.vue';

// Receives from router because props: true
const props = defineProps({
  book_id: { type: [String, Number], required: true },
  name: { type: String, default: '' },
})

// keep reactivity
const { book_id, name } = toRefs(props)
</script>