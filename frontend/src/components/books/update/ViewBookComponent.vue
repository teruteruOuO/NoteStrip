<template>
<section id="view-a-book" class="component">
    <h2>Check Book ({{ props.name }} {{ props.bookId }})</h2>
    <section class="loader" v-if="isLoading.page">
    </section>

    <section class="retrieve-fail feedback fail" v-else-if="!feedback.page.success">
        <p>{{ feedback.page.message }}</p>
    </section>

    <section class="retrieve-success" v-else>
        <p>ID: {{ bookInformation.id }}</p>
        <p>Title: {{ bookInformation.title }}</p>
        <p>Plot Description: {{ bookInformation.plot_description ? bookInformation.plot_description : 'N/A' }}</p>
        <p>Extra Information: {{ bookInformation.extra_information ? bookInformation.extra_information : 'N/A' }}</p>
        <p>Release Date: {{ bookInformation.release_date ? bookInformation.release_date : 'N/A' }}</p>
        <p>End Date: {{ bookInformation.end_date ? bookInformation.end_date : 'N/A' }}</p>
        <p>Reread: {{ bookInformation.reread }}</p>
        <p>Date Recorded {{ bookInformation.date_added }}</p>
        <p v-if="bookInformation.read_amount !== null">Read amount: {{ bookInformation.read_amount }}</p>
        <p><img :src="bookInformation.img" :alt="bookInformation.title" style="max-width: 200px; max-height: 200px;"></p>

        <section id="reread-activity" v-if="readActivity.id">
            <p>Latest Read Activity within the last 10 hrs: {{ readActivity.latest_read }}</p>
        </section>

        <section class="buttons">
            <ul>
                <li v-if="!readActivity.id">
                    <label for="re-read">Re-read today? </label>
                    <!-- Reread button. Disabled if readActivity is valid or if loading -->
                    <button type="button" id="re-read" @click="rereadBook" :disabled="readActivity.id || isLoading.button" :class="{ 'button-loading': isLoading.button }">
                        <span v-if="readActivity.id">Already reread today</span>
                        <span v-else-if="isLoading.button">Recording read activity...</span>
                        <span v-else>Yes</span>
                    </button>
                </li>
                <li v-if="readActivity.id">
                    <label for="un-reread">Made a mistake? Unre-read for today </label>
                    <!-- Unreread button. Active only if there's a readActivity -->
                    <button type="button" id="un-reread" @click="unRereadBook" :disabled="!readActivity.id || isLoading.button" :class="{ 'button-loading': isLoading.button }">
                        <span v-if="isLoading.button">Reverting read activity...</span>
                        <span v-else>Revert reread</span>
                    </button>
                </li>
            </ul>

            <section class="feedback" :class="{ 'success': feedback.button.success, 'fail': !feedback.button.success }" v-if="feedback.button.message !== ''">
                <p>{{ feedback.button.message }}</p>
            </section>
        </section>
    </section>
</section> 
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router';
import { reactive, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import axios from 'axios';

const props = defineProps({
    bookId: { type: [String, Number], required: true },
    name: { type: String, default: '' },
});
const router = useRouter();
const route = useRoute();
const user = useUserStore();
const isLoading = reactive({ page: false, button: false });
const feedback = reactive({ 
    page: { message: '', success: false },
    button: { message: '', success: false }
});
const bookInformation = reactive({
    id: null,
    title: null,
    img: null,
    plot_description: null,
    extra_information: null,
    release_date: null,
    end_date: null,
    reread: null,
    date_added: null,
    read_amount: null
});
const readActivity = reactive({
    id: null,
    latest_read: null
});

// Retrieve a single book instance of user
const retrieveABook = async (book_id) => {
    isLoading.page = true;

    try {
        const bookResponse = await axios.get(`/api/book/view-book/${user.user.id}/${book_id}`);
        console.log(bookResponse.data.message);
        console.log(`Book Response data information:`, bookResponse);

        feedback.page.success = true;
        feedback.page.message = bookResponse.data.message;

        // Store the data in bookInformation
        bookInformation.id = bookResponse.data.book.id;
        bookInformation.title = bookResponse.data.book.title;
        bookInformation.img = bookResponse.data.book.img;
        bookInformation.plot_description = bookResponse.data.book.plot_description;
        bookInformation.extra_information = bookResponse.data.book.extra_information;
        bookInformation.release_date = bookResponse.data.book.release_date;
        bookInformation.end_date = bookResponse.data.book.end_date;
        bookInformation.reread = bookResponse.data.book.reread;
        bookInformation.date_added = bookResponse.data.book.date_added;

        // if latest activity read exists, then store it
        if (bookResponse.data.latest_read_activity) {
            readActivity.id = bookResponse.data.latest_read_activity.id;
            readActivity.latest_read = bookResponse.data.latest_read_activity.latest_read
        }

        // if read amount exist, store it
        if (bookResponse.data.read_amount) {
            bookInformation.read_amount = bookResponse.data.read_amount
        }

        // keep query in sync with actual title (When a user tries to change the ID in the frontend parameter)
        if (route.query.name !== bookInformation.title) {
            // use replace to avoid history spam
            router.replace({
                name: 'view-book',
                params: { book_id },                // keep the current param
                query:  { name: bookInformation.title },          // update name to the real title
            });
        }

    } catch (error) {
        console.error(`An error occured while retrieving the user's book`);
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

// Reread the book
const rereadBook = async () => {
    isLoading.button = true;

    try {
        const response = await axios.post(`/api/book/reread/${user.user.id}/${bookInformation.id}`, { book_title: bookInformation.title });
        console.log(response.data.message);
        console.log(`Reread Response data information:`, response);

        feedback.button.success = true;
        feedback.button.message = response.data.message;

        // Remove the feedback message after 5 seconds
        setTimeout(() => {
            feedback.button.success = false;
            feedback.button.message = '';
        }, 5000);

        /* AJAX call operation instead of refresh */
        // Reset all variables except for rereadBook variables and the image
        feedback.page.success = false;
        feedback.page.message = '';

        bookInformation.id = null;
        bookInformation.title = null;
        bookInformation.plot_description = null;
        bookInformation.extra_information = null;
        bookInformation.release_date = null;
        bookInformation.end_date = null;
        bookInformation.reread = null;
        bookInformation.date_added = null;
        bookInformation.read_amount = null;

        readActivity.id = null;
        readActivity.latest_read = null;

        // recall retrieveABook
        await retrieveABook(props.bookId);

    } catch (error) {
        console.error(`An error occured while recording a reread on the user's book`);
        feedback.button.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.button.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.button.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }
    } finally {
        isLoading.button = false;
    }
}

// Unreread the book
const unRereadBook = async () => {
    isLoading.button = true;

    try {
        const response = await axios.post(`/api/book/unreread/${user.user.id}/${bookInformation.id}/${readActivity.id}`, { book_title: bookInformation.title });
        console.log(response.data.message);
        console.log(`Unreread Response data information:`, response);

        feedback.button.success = true;
        feedback.button.message = response.data.message;

        // Remove the feedback message after 5 seconds
        setTimeout(() => {
            feedback.button.success = false;
            feedback.button.message = '';
        }, 5000);

        /* AJAX call operation instead of refresh */
        // Reset all variables except for rereadBook variables
        feedback.page.success = false;
        feedback.page.message = '';

        bookInformation.id = null;
        bookInformation.title = null;
        bookInformation.plot_description = null;
        bookInformation.extra_information = null;
        bookInformation.release_date = null;
        bookInformation.end_date = null;
        bookInformation.reread = null;
        bookInformation.date_added = null;
        bookInformation.read_amount = null;

        readActivity.id = null;
        readActivity.latest_read = null;

        // recall retrieveABook
        await retrieveABook(props.bookId);

    } catch (error) {
        console.error(`An error occured while reverting a reread on the user's book`);
        feedback.button.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.button.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.button.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }
    } finally {
        isLoading.button = false;
    }
}

// Automatically trigger retrieveABook
onMounted(async () => {
    await retrieveABook(props.bookId);
});

// Situations where user attempts to change ID in the url
watch(() => props.bookId, async (id) => {
    if (!id) return

    bookInformation.id = null
    bookInformation.title = null
    bookInformation.img = null
    bookInformation.plot_description = null
    bookInformation.extra_information = null
    bookInformation.release_date = null
    bookInformation.end_date = null
    bookInformation.reread = null
    bookInformation.date_added = null
    bookInformation.read_amount = null
    readActivity.id = null
    readActivity.latest_read = null

    try {
        await retrieveABook(id)
    
        // Only now, after a successful fetch, sync the query to the real title.
        if (route.query.name !== bookInformation.title) {
                router.replace({
                    name: 'view-book',
                    params: { book_id: id },
                    query: { name: bookInformation.title },
                })
        }
    } catch {
        // On invalid ID (e.g., 404), DO NOT router.replace back to the old book.
        // Option 1: clear the query so URL reflects “unknown”
        router.replace({ name: 'view-book', params: { book_id: id }, query: {} })
    }
}, { immediate: true })

</script>