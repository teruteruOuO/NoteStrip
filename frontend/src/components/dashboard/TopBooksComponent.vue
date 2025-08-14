<template>
<section id="top-books" class="component">
    <h1>Top {{ booksData.limit }} Books</h1>
    <form @submit.prevent="retrieveBooks(booksData.limit)">
        <ul>
            <li>
                <label for="number-of-books">Top Books Count: </label>
                <input type="number" name="number-of-books" id="number-of-books" v-model.number="booksData.limit" min="1" max="10" required />
                <button type="submit" :disabled="isLoading.page" :class="{ 'button-loading': isLoading.page }">
                    <span v-if="!isLoading.page">Retrieve Books</span>
                    <span v-else>Retrieving books..</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="loader" v-if="isLoading.page">
    </section>

    <section class="retrieve-fail feedback fail" v-else-if="!feedback.success">
        <p>{{ feedback.message }}</p>
    </section>

    <section class="retrieve-success empty" v-else-if="booksData.books.length <= 0">
        <p>No Books Found. Add one!</p>
    </section>

    <section class="retrieve-success" v-else>
        <section v-for="book in booksData.books" :key="book.id" :id="`${book.title}-${book.id}`">
            <p><RouterLink :to="{ name: 'view-book', params: { book_id: book.id }, query: { name: book.title } }">{{ book.title }}</RouterLink></p>
            <p>Total Read Count: {{ book.read_count }}</p>
            <img :src="book.image_source" :alt="book.title" style="max-width: 200px; max-height: 200px;">
        </section>
    </section>
</section>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import { reactive, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import axios from 'axios';

const user = useUserStore();
const feedback = reactive({ message: '', success: false });
const isLoading = reactive({ page: false });
const booksData = reactive({
    books: [],
    limit: 3
});

// Retrieve books
const retrieveBooks = async (limit) => {
    isLoading.page = true;

    // normalize & reflect the submitted value in UI
    limit = Math.min(10, Math.max(1, Number(limit)));
    booksData.limit = limit;

    try {
        const response = await axios.get(`/api/dashboard/top-books/${user.user.id}`, { params: { limit } });
        console.log(response.data.message);
        console.log(`Top Books Response data information:`, response);

        feedback.success = true;
        feedback.message = response.data.message;

        // Retrieve values and store them into variables
        booksData.books = response.data.books;

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

// Retrieve books automatically on page visit
onMounted(async () => {
    retrieveBooks(booksData.limit);
});
</script>