<template>
<section id="retrieve-books" class="component">
    <section class="loader" v-if="isLoading.page">
    </section>

    <section class="retrieve-fail feedback fail" v-else-if="!feedback.success">
        <p>{{ feedback.message }}</p>
    </section>

    <section class="retrieve-success empty" v-else-if="books.length <= 0">
        <p>No Books Found. Add one!</p>
    </section>

    <section class="retrieve-success" v-else>
        <div v-for="book in books" :key="book.id">
            <p>{{ book.title }}</p>
            <p><img :src="book.image_source" :alt="book.title" style="max-width: 200px; max-height: 200px;"></p>
        </div>
    </section>
</section>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import { reactive, ref, onMounted } from 'vue';
import axios from 'axios';

const user = useUserStore();
const feedback = reactive({ message: '', success: false });
const isLoading = reactive({ page: false });
const books = ref([]);

// Retrieve books
const retrieveBooks = async () => {
    isLoading.page = true;

    try {
        const response = await axios.get(`/api/book/all-books/${user.user.id}`);
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        feedback.success = true;
        feedback.message = response.data.message;

        books.value = response.data.books;

    } catch (error) {
        console.error(`An error occured while retrieving the user's books`);
        feedback.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }

    } finally {
        isLoading.page = false;
    }
}

onMounted(async () => {
    await retrieveBooks();
});
</script>