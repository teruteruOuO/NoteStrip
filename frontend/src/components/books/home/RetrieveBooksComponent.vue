<template>
<section id="retrieve-books" class="component">
    <section class="loader" v-if="isLoading.page">
    </section>

    <section class="retrieve-fail feedback fail" v-else-if="!feedback.success">
        <p>{{ feedback.message }}</p>
    </section>

    <section class="retrieve-success empty" v-else-if="booksData.books.length <= 0">
        <p>No Books Found. Add one!</p>
    </section>

    <section class="retrieve-success" v-else>
        <section class="books">
            <section v-for="book in booksData.books" :key="book.id" :id="`${book.title}-${book.id}`">
                <p>
                    <RouterLink :to="{ name: 'view-book', params: { book_id: book.id }, query: { name: book.title } }">
                        {{ book.title }}
                    </RouterLink>
                </p>

                <RouterLink :to="{ name: 'view-book', params: { book_id: book.id }, query: { name: book.title } }">
                    <img :src="book.image_source" :alt="book.title" :title="book.title" />
                </RouterLink>
            </section>
        </section>

        
        <section class="pagination buttons" v-if="booksData.total_pages > 1">
            <button type="button" @click="prevPage" :disabled="booksData.current_page <= 1">Previous</button>
            <p>{{ booksData.current_page }}/{{ booksData.total_pages }}</p>
            <button type="button" @click="nextPage" :disabled="booksData.current_page >= booksData.total_pages">Next</button>
        </section>
    </section>
</section>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import { reactive, onMounted } from 'vue';
import { RouterLink, useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const feedback = reactive({ message: '', success: false });
const isLoading = reactive({ page: false });
const booksData = reactive({
    books: [],
    current_page: 1,
    total_pages: 1
});

// Retrieve books
const retrieveBooks = async (page = 1) => {
    isLoading.page = true;

    try {
        const response = await axios.get(`/api/book/all-books/${user.user.id}`, { params: { page }});
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        feedback.success = true;
        feedback.message = response.data.message;

        // Retrieve values and store them into variables
        booksData.books = response.data.books;
        booksData.current_page = response.data.current_page;
        booksData.total_pages = response.data.total_pages;

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

const nextPage = () => {
    if (booksData.current_page < booksData.total_pages) {
        const newPage = booksData.current_page + 1;
        router.push({ name: 'books', query: { page: newPage } }); // update URL
        retrieveBooks(newPage);
    }
};

const prevPage = () => {
    if (booksData.current_page > 1) {
        const newPage = booksData.current_page - 1;
        router.push({ name: 'books', query: { page: newPage } }); // update URL
        retrieveBooks(newPage);
    }
};

// Retrieve books automatically on page visit
onMounted(async () => {
    const pageFromUrl = parseInt(route.query.page) || 1;
    retrieveBooks(pageFromUrl);
});
</script>