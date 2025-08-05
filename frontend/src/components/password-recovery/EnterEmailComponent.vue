<template>
<main id="enter-code" class="component">
    <form @submit.prevent="sendVerificationCode">
        <ul>
            <li>
                <label for="email">Email: </label>
                <input type="email" id="email" name="email" v-model="passwordRecovery.passwordRecovery.email" placeholder="required" required />
            </li>
            <li>
                <button type="submit" :disabled="isLoading.form" :class="{ 'button-loading': isLoading.form }">
                    <span v-if="!isLoading.form">Send Verification Code</span>
                    <span v-else>Sending Verification Code...</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="feedback fail">
        <p>{{ feedback.message }}</p>
    </section>
</main>
</template>

<script setup>
import { reactive } from 'vue';
import { usePasswordRecoveryStore } from '@/stores/password-recovery';
import axios from 'axios';

const passwordRecovery = usePasswordRecoveryStore();
const isLoading = reactive({ form: false });
const feedback = reactive({ message: '', success: false });

// Send a make a verification code to the user
const sendVerificationCode = async () => {
    isLoading.form = true;

    try {
        const response = await axios.post('/api/password-recovery/send-verification-code', { email: passwordRecovery.passwordRecovery.email });
        alert(response.data.message);
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        passwordRecovery.passwordRecovery.email = response.data.email; // Store the email in the local storage for the meantime

        // Switch from this component to password-recovery's VerifyCodeComponent.vue
        passwordRecovery.component.email_form = false;
        passwordRecovery.component.verification_form = true;

        // Start the timer for 600 seconds
        passwordRecovery.component.timer.start = true;
        passwordRecovery.component.timer.id++;
        passwordRecovery.component.timer.time_left = 600;

    } catch (error) {
        console.error(`An error occured while sending a verification code to the user`);
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