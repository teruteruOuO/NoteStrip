<template>
<section id="view-book-note" class="component">
    <section class="loader" v-if="isLoading.page">
    </section>

    <section class="retrieve-fail feedback fail" v-else-if="!feedback.page.success">
        <h2>Notes</h2>
        <p>{{ feedback.page.message }}</p>
    </section>

    <section class="retrieve-success empty" v-else-if="notes.length <= 0">
        <h2>Notes</h2>
        <p>No notes found. Add one!</p>
    </section>

    <section class="retrieve-success" v-else>
        <h2>Notes</h2>
        <section v-for="note in notes" :key="note.id">
            <p>Title: {{ note.title }}</p>
            <p>Content: {{ note.content }}</p>
            <p>Date Added: {{ note.timestamp }}</p>
        </section>
    </section>
</section>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { onBeforeRouteUpdate } from 'vue-router';
import axios from 'axios';

const props = defineProps({ bookId: { type: [String, Number], required: true } });
const user = useUserStore();
const isLoading = reactive({ page: false });
const feedback = reactive({
    page: { message: '', success: false }
});
const notes = ref([]);

// Retrieve all notes pertaining to this book
const retrieveAllNotes = async (book_id) => {
    isLoading.page = true;

    try {
        const noteResponse = await axios.get(`/api/book/view-notes/${user.user.id}/${book_id}`);
        console.log(noteResponse.data.message);
        console.log(`Note Response data information:`, noteResponse);

        feedback.page.success = true;
        feedback.page.message = noteResponse.data.message;

        // Store notes in variable
        notes.value = noteResponse.data.notes;

    } catch (error) {
        console.error(`An error occured while retrieving the user's notes for this book`);
        feedback.page.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.page.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.page.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }
    } finally {
        isLoading.page = false;
    }
}

onMounted(async () => {
    await retrieveAllNotes(props.bookId);
});

// React to param changes with onBeforeRouteUpdate
onBeforeRouteUpdate((to) => {
    const nextId = to.params.bookId;
    if (nextId) retrieveAllNotes(nextId);
});
</script>