<template>
<section id="login-form" class="component">
    <form @submit.prevent="loginUser">
        <ul>
            <li>
                <label for="email">Email: </label>
                <input type="email" id="email" name="email" v-model="account.email" required />
            </li>
            <li>
                <label for="password">Password: </label>
                <input type="password" id="password" name="password" v-model="account.password" required />
            </li>
            <li>
                <button type="submit" :disabled="isLoading.form" :class="{ 'button-loading': isLoading.form }">
                    <span v-if="!isLoading.form">Log in</span>
                    <span v-else>Loggin in...</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="feedback fail" ref="feedbackScroll" v-if="feedback.message">
        <p>{{ feedback.message }}</p>
    </section>

    <section>
        <p><RouterLink :to="{ name: 'password-recovery' }">Forgot Password?</RouterLink></p>
        <p><RouterLink :to="{ name: 'sign-up' }">Sign Up</RouterLink></p>
    </section>
</section>
</template>

<script setup>
import { reactive, ref, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { RouterLink } from 'vue-router';

const user = useUserStore();
const router = useRouter();
const account = reactive({ email: '', password: '' });
const feedback = reactive({ message: '', success: false });
const feedbackScroll = ref(null);
const isLoading = reactive({ form: false });

// Login user
const loginUser = async () => {
    isLoading.form = true;

    try {
        const body = { 
            email: account.email, 
            password: account.password 
        }
        const response = await axios.post('/api/authentication/login', body);
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        user.user.id = response.data.id;    // Store user's id in the local storage
        router.push({ name: 'dashboard' })  // Reroute to the dashboard page

    } catch (error) {
        console.error(`An error occured while logging in user`);
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

        await nextTick();
        feedbackScroll.value?.scrollIntoView({ behavior: "smooth", block: "center" });

    } finally {
        isLoading.form = false;
    }
}
</script>