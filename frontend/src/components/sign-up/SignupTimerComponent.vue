<template>
<section id="sign-up-timer" class="component">
    <p>Time remaining until the verification code expires: {{ formattedTime }}</p>
    <p v-if="signup.component.timer.time_left <= 0">
        Current verification code expired. Please resend a new one.
    </p>
</section>
</template>

<script setup>
import { onMounted, onBeforeUnmount, computed } from 'vue';
import { useSignupStore } from '@/stores/sign-up';
import axios from 'axios';

const signup = useSignupStore();
let intervalId = null // Used to store the timer so it can be stopped later.

// automatically updates whenever signup.component.timer.time_left changes and converts total seconds into minutes and seconds.
const formattedTime = computed(() => {
    const minutes = Math.floor(signup.component.timer.time_left / 60).toString().padStart(2, '0');
    const seconds = (signup.component.timer.time_left % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`
});

/*
When the component mounts:
setInterval runs every 1000ms (1 second).
Each second:
    If time is left, it decreases signup.component.timer.time_left by 1.
    If time hits 0, it stops the timer using clearInterval.
*/
onMounted(() => {
    // The function below triggers every 1 second
    intervalId = setInterval(async () => {
    if (signup.component.timer.start) { // Only decrement if timer is active
            if (signup.component.timer.time_left > 0) {
                signup.component.timer.time_left--
            } else {
                await expireVerificationCode();
                clearInterval(intervalId)
            }
        }
    }, 1000)
});

// When the component is removed from the page (unmounted), the timer is stopped to prevent memory leaks or unwanted updates.
onBeforeUnmount(() => {
    clearInterval(intervalId);
});

// Trigger when timer reaches 00:00
const expireVerificationCode = async () => {
    try {
        const response = await axios.post('/api/sign-up/expire-code', { email: signup.signup.email });

        console.log(response.data.message);
        console.log(`Response data information:`, response);

    } catch (error) {
        console.error(`An error occured while deleting all verification code for ${signup.signup.email}`);

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
        }
    }
}
</script>