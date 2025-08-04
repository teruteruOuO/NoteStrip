<template>
<section id="logout" class="component">
    <button @click="logoutUser" :disabled="isLoading.button" :class="{ 'button-loading': isLoading.button }">
        <span v-if="!isLoading.form">Log out</span>
        <span v-else>Loggig out...</span>
    </button>

    <p class="feedback fail"> {{ feedback.message }} </p>
</section>
</template>

<script setup>
import axios from 'axios';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import { reactive } from 'vue';

// Initialize Variables
const router = useRouter();
const user = useUserStore();
const feedback = reactive({ message: '', success: false });
const isLoading = reactive({ button: false });

// Logout user
const logoutUser = async () => {
    isLoading.button = true;

    try {
        const response = await axios.post('/api/authentication/logout');
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        user.user.id = null;    // clear id
        router.push({ name: 'home' });  // Reroute to the home page

    } catch (error) {
        console.error(`An error occured while logging out user`);
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
        isLoading.button = false;
    }
}
</script>