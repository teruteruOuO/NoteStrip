<template>
<section id="logs" class="component">
    <section class="loader" v-if="isLoading.page">
    </section>

    <section class="retrieve-fail feedback fail" v-else-if="!feedback.success">
        <p>{{ feedback.message }}</p>
    </section>

    <section class="retrieve-success" v-else>
        <table>
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Description</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="log in logData.activity_logs" :key="log.id">
                    <td>{{ log.timestamp }}</td>
                    <td>{{ log.description }}</td>
                </tr>
            </tbody>
        </table>

        <section class="pagination" v-if="logData.total_pages > 1">
            <button type="button" @click="prevPage" :disabled="logData.current_page <= 1">Previous</button>
            <p>{{ logData.current_page }}/{{ logData.total_pages }}</p>
            <button type="button" @click="nextPage" :disabled="logData.current_page >= logData.total_pages">Next</button>
        </section>
    </section>

</section>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const user = useUserStore();
const route = useRoute();
const router = useRouter();
const isLoading = reactive({ page: false });
const feedback = reactive({ message: '', success: ''});
const logData = reactive({
    activity_logs: [],
    current_page: 1,
    total_pages: 1
});

// Retrieve the user's activity logs
const retrieveActivityLogs = async (page = 1) => {
    isLoading.page = true;

    try {
        const response = await axios.get(`/api/account/activity_logs/${user.user.id}`, { params: { page }});
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        feedback.success = true;
        feedback.message = response.data.message;

        // Store the activity logs in a variable
        logData.activity_logs = response.data.activity_logs;
        logData.current_page = response.data.current_page;
        logData.total_pages = response.data.total_pages;

    } catch (error) {
        console.error(`An error occured while retrieving the user's activity logs`);
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
    if (logData.current_page < logData.total_pages) {
        const newPage = logData.current_page + 1;
        router.push({ name: 'account-logs', query: { page: newPage } }); // update URL
        retrieveActivityLogs(newPage);
    }
};

const prevPage = () => {
    if (logData.current_page > 1) {
        const newPage = logData.current_page - 1;
        router.push({ name: 'account-logs', query: { page: newPage } }); // update URL
        retrieveActivityLogs(newPage);
    }
};

// Retrieve activity logs automatically on page visit
onMounted(async () => {
    const pageFromUrl = parseInt(route.query.page) || 1;
    retrieveActivityLogs(pageFromUrl);
});
</script>

<style scoped>
table {
    border-collapse: separate;
    border-spacing: 0;
    inline-size: 100%;
    max-inline-size: 1300px;
    margin: 0 auto;
    text-align: left;
}

th, td {
    padding: 0.5rem;
    border-block-end: 1px solid black; 
    border-inline-end: 1px solid black; 
    background-color: #B8F4BC;
    color: black;
}


td:nth-of-type(5) {
    text-overflow:clip;
}

table tr td:first-child, 
table tr th:first-child {
    border-inline-start: 1px solid black; 
}

table tr th {
    border-block-start: 1px solid black; 
}

table tr:first-child th:first-child {
    border-top-left-radius: 0.5rem;
}

table tr:first-child th:last-child {
    border-top-right-radius: 0.5rem;
}

table tr:last-child td:first-child {
    border-bottom-left-radius: 0.5rem;
}

table tr:last-child td:last-child {
    border-bottom-right-radius: 0.5rem;
}

@media screen and (min-width: 667px) {
    table {
        text-align: center;
    }
}
</style>