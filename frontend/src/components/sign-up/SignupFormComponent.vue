<template>
<section id="sign-up-form" class="component">
    <form @submit.prevent="signupUser">
        <ul>
            <li>
                <label for="email">Email: </label>
                <input type="email" name="email" id="email" v-model="signup.signup.email" placeholder="something@gmail.com" required/>
            </li>
            <li>
                <label for="password">Password: </label>
                <input type="password" name="password" id="password" v-model="signup.signup.password" required/>
            </li>
            <li>
                <label for="confirm-password">Confirm Password: </label>
                <input type="password" name="confirm-password" id="confirm-password" v-model="signup.signup.confirm_password" required/>
            </li>
            <li>
                <button type="submit" :disabled="isLoading.form" :class="{ 'button-loading': isLoading.form }">
                    <span v-if="!isLoading.form">Sign Up</span>
                    <span v-else>Sending Verification Code...</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="feedback fail">
        <p>{{ feedback.message }}</p>
        <p>{{ passwordRegEx }}</p>
        <p>{{ passwordMatch }}</p>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { useSignupStore } from '@/stores/sign-up';
import { reactive, computed } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

const signup = useSignupStore();
const feedback = reactive({ message: '', success: false });
const isLoading = reactive({ form: false });

/* Computed Variables */
// Informs user that their password must match the following criteria
// Contains at least one uppercase letter.
// Contains at least one lowercase letter.
// Contains at least one number.
// Contains at least one special character (@, #, $, %, etc.).
const passwordRegEx = computed(() => {
    const password = signup.signup.password;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (password && !regex.test(password)) {
        return "* Password must contain at least one upper case and lowercase letters, one number, and one special character";
    }
    return null;
});

// Informs user password and confirm password do not match
const passwordMatch = computed(() => {
    const password = signup.signup.password;
    const confirmPassword = signup.signup.confirm_password;
    if ((password && confirmPassword) && (password !== confirmPassword)) {
        return "* Both passwords must match";
    } else {
        return null;
    }
});

// Send sign-up form information to the backend
const signupUser = async() => {
    isLoading.form = true;

    try {
        // If the error messages for password constraints still exist, refuse to continue
        if (passwordMatch.value || passwordMatch.value) {
            console.error("The password must follow the password rules before you can continue.");
            return;
        }

        const body = {
            email: signup.signup.email,
            password: signup.signup.password,
        }

        const response = await axios.post('/api/sign-up', body);
        alert(response.data.message);
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        // Reset the signup form
        signup.resetSignup();
        signup.signup.email = response.data.email; // Store the email in the local storage for the meantime

        // Switch from this component to VerifyCodeComponent.vue
        signup.component.signup_form = false;
        signup.component.verification_form = true;

        // Start the timer for SignupTimerComponent.vue for 600 seconds
        signup.component.timer.start = true;
        signup.component.timer.time_left = 600;

    } catch (error) {
        console.error(`An error occured while signing up the user's information`);
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

// Reset sign-up pinia store ONLY if switching to another route
onBeforeRouteLeave(() => {
    signup.resetComponent();
    signup.resetSignup();
})
</script>