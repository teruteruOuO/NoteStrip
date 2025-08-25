<template>
<section id="contact" class="component">
    <p>Got a feedback? Share it with us!</p>

    <section class="feedback" :class="{ 'success': feedback.success, 'fail': !feedback.success }" v-if="feedback.message">
        <p>{{ feedback.message }}</p>
    </section>

    <form @submit.prevent="submitFeedback">
        <ul>
            <li>
                <label for="email">Email: </label>
                <input type="email" name="email" id="email" v-model="contactForm.email" placeholder="Optional" />
            </li>
            <li>
                <label for="title">Title: </label>
                <input type="text" name="title" id="title" v-model="contactForm.title" placeholder="Required" required />
            </li>
            <li>
                <label for="content" class="text-area">Feedback: </label>
                <textarea name="content" id="content" v-model="contactForm.content" placeholder="Required" required>
                </textarea>
            </li>
            <li>
                <button type="submit" :disabled="isLoading.form" :class="{ 'button-loading': isLoading.form }">
                    <span v-if="!isLoading.form">Submit</span>
                    <span v-else>Submitting...</span>
                </button>
            </li>
        </ul>
    </form>
</section>    
</template>

<script setup>
import { reactive } from 'vue';
import axios from 'axios';

const feedback = reactive({ message: '', success: false });
const isLoading = reactive({ form: false });
const contactForm = {
    email: '',
    title: null,
    content: null
}

const submitFeedback = async () => {
    isLoading.form = true;

    try {
        const body = {
            email: contactForm.email.trim() === '' ? 'anonymous' : contactForm.email,
            title: contactForm.title,
            content: contactForm.content
        }
        const response = await axios.post(`/api/authentication/contact-us`, body);
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        feedback.success = true;
        feedback.message = response.data.message;

        contactForm.email = '';
        contactForm.title = null;
        contactForm.content = null;

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

    } finally {
        isLoading.form = false;
    }
}
</script>