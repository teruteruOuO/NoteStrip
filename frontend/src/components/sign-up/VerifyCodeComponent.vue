<template>
<section id="verify-code" class="component">
    <SignupTimerComponent v-if="signup.component.timer.start" :key="signup.component.timer.id"/>

    <form @submit.prevent="verifyVerificationCode">
        <ul>
            <li>
                <label for="verification-code">Verification Code: </label>
                <input 
                type="text" 
                name="verification-code" 
                id="verification-code" 
                v-model="signup.signup.verification_code" 
                min=6 
                max=6 
                placeholder="required"
                required />
            </li>
            <li>
                <button type="submit" :disabled="isLoading.verify" :class="{ 'button-loading': isLoading.verify }">
                    <span v-if="!isLoading.verify">Verify Code</span>
                    <span v-else>Verifying Code...</span>
                </button>
            </li>
            <li>
                <button type="button" @click="resetEmail" :disabled="isLoading.reset" :class="{ 'button-loading': isLoading.reset }">
                    <span v-if="!isLoading.reset">Reset Email</span>
                    <span v-else>Resetting Email...</span>
                </button>
            </li>
            <li>
                <button type="button" @click="resendVerificationCode" :disabled="isLoading.resend" :class="{ 'button-loading': isLoading.resend }">
                    <span v-if="!isLoading.resend">Resend Verification Code</span>
                    <span v-else>Resending Verification Code...</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="feedback" ref="feedbackScroll" :class="{ 'success': feedback.success, 'fail': !feedback.success }" v-if="feedback.message">
        <p>{{ feedback.message }}</p>
    </section>

    <LeaveDetectorComponent />
</section>
</template>

<script setup>
import { useSignupStore } from '@/stores/sign-up';
import SignupTimerComponent from './SignupTimerComponent.vue';
import LeaveDetectorComponent from './LeaveDetectorComponent.vue';
import { reactive, ref, nextTick } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const signup = useSignupStore();
const router = useRouter();
const feedback = reactive({ message: '', success: false });
const feedbackScroll = ref(null);
const isLoading = reactive({
    reset: false,
    resend: false,
    verify: false
});

// Reset email
const resetEmail = async () => {
    isLoading.reset = true;

    // Ask user if they want to proceed
    const answer = window.confirm("Are you sure you want to reset your email and restart the sign-up process?");
    if (!answer) {
        isLoading.reset = false;
        return;
    }
    console.log(`User wants to reset their sign-up process`);

    try {
        const body = {
            email: signup.signup.email,
            reason: 'reset email'
        }
        const response = await axios.post('/api/sign-up/reset-progress', body);
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        // Reset signup progress
        signup.resetComponent();
        signup.resetSignup();

    } catch (error) {
        console.error(`An error occured while resetting the user's sign-up process`);
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
        isLoading.reset = false;
    }
}

// Resend a new verification code
const resendVerificationCode = async () => {
    isLoading.resend = true;

    try {
        const response = await axios.post('/api/sign-up/resend-code', { email: signup.signup.email });
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        // Reset timer
        signup.component.timer.start = false;
        signup.component.timer.start = true;
        signup.component.timer.id++
        signup.component.timer.time_left = signup.component.timer.clock;

        feedback.success = true;
        feedback.message = response.data.message;

    } catch (error) {
        console.error(`An error occured while resending a new verification code to the user`);
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
        await nextTick();
        feedbackScroll.value?.scrollIntoView({ behavior: "smooth", block: "center" });

        isLoading.resend = false;
    }
}

// Verify the form
const verifyVerificationCode = async () => {
    isLoading.verify = true;

    try {
        const body = {
            email: signup.signup.email,
            verification_code: signup.signup.verification_code
        }
        const response = await axios.post('/api/sign-up/verify-code', body);
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        alert(response.data.message);

        // Ensure store is reset before navigation
        await Promise.resolve(signup.resetSignup());
        await Promise.resolve(signup.resetComponent());

        // Navigate only after clearing data
        router.push({ name: 'login' });

    } catch (error) {
        console.error(`An error occured while verifying the submitted code`);
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
        isLoading.verify = false;

    }
}
</script>