<template>
<section id="search-book" class="component">
    <form>
        <ul>
            <li>
                <label for="search">Search Title: </label>
                <input type="text" name="search" id="search" v-model="booksData.search_title" @input="debounceSearch(booksData.search_title)" required />
            </li>
        </ul>
    </form>

    <section id="result" v-if="booksData.search_title && booksData.books.length >= 0">
        <section class="loader" v-if="isLoading.search">
        </section>

        <section class="retrieve-fail feedback fail" v-else-if="!feedback.success">
            <p>{{ feedback.message }}</p>
        </section>

        <section class="retrieve-success empty" v-else-if="booksData.books.length <= 0">
            <p>No books found containing that title</p>
        </section>

        <section class="retrieve-success" v-else>
            <section v-for="book in booksData.books" :key="book.id" :id="`search-${book.title}-${book.id}`">
                <p><RouterLink :to="{ name: 'view-book', params: { book_id: book.id }, query: { name: book.title } }">{{ book.title }}</RouterLink></p>
                <p>
                    <RouterLink :to="{ name: 'view-book', params: { book_id: book.id }, query: { name: book.title } }">
                        <img :src="book.image_source" :alt="book.title">
                    </RouterLink>
                </p>
            </section>
        </section>
    </section>
</section>
</template>

<script setup>
import { reactive, onMounted, onBeforeUnmount } from 'vue';
import { useUserStore } from '@/stores/user';
import { RouterLink } from 'vue-router';
import axios from 'axios';

const user = useUserStore();
const booksData = reactive({
    books: [],
    search_title: null
});
const isLoading = reactive({ search: false });
const feedback = reactive({ message: '', success: false });
let debounceTimer;

const searchBook = async (title) => {
    // Stop firing requests if search is empty
    if (!title || !title.trim()) {
        booksData.books = [];
        feedback.success = true;
        feedback.message = '';
        return;
    }

    isLoading.search = true;

    try {
        const response = await axios.get(`/api/book/search-book/${user.user.id}`, { params: { title }});
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        feedback.success = true;
        feedback.message = response.data.message;

        // Retrieve values and store them into variables
        booksData.books = response.data.books;

    } catch (error) {
        console.error(`An error occured while searching the user's books with the title ${title}`);
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
        isLoading.search = false;
    }
}

const debounceSearch = (title) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        searchBook(title);
    }, 1000 * 0.5); // wait 0.5s after typing stops
};

// The code below clears the input bar and books result once anything in the page is clicked
const clearSearch = () => {
    clearTimeout(debounceTimer);
    booksData.search_title = '';
    booksData.books = [];
    feedback.success = true;
    feedback.message = '';
};
const handleGlobalClick = (e) => {
    const inputEl = document.getElementById('search');
    const target = e.target;

    // Do NOT clear if clicking the input or its label
    const clickedInput = inputEl && (target === inputEl || inputEl.contains(target));
    const clickedLabel = target.closest && target.closest('label[for="search"]');

    if (clickedInput || clickedLabel) return;

    clearSearch();
};
onMounted(() => {
    document.addEventListener('click', handleGlobalClick, true);
});
onBeforeUnmount(() => {
    document.removeEventListener('click', handleGlobalClick, true);
});
</script>