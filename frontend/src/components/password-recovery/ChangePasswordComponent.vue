<template>
<section id="change-password" class="component">
    <form @submit.prevent="changePassword">
        <ul>
            <li>
                <label for="password">Password: </label>
                <input type="password" id="password" name="password" v-model="passwordRecovery.passwordRecovery.password" required />
            </li>
            <li>
                <label for="confirm-password">Confirm Password: </label>
                <input type="password" id="confirm-password" name="confirm-password" v-model="passwordRecovery.passwordRecovery.confirm_password" required />
            </li>
            <li>
                <button type="submit" :disabled="isLoading.form" :class="{ 'button-loading': isLoading.form }">
                    <span v-if="!isLoading.form">Change Password</span>
                    <span v-else>Changing password...</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="feedback fail">
        <p>{{ feedback.message }}</p>
        <p>{{ passwordRegEx }}</p>
        <p>{{ passwordMatch }}</p>
    </section>

    <LeaveDetectorComponent />
</section>
</template>

<script setup>
import LeaveDetectorComponent from './LeaveDetectorComponent.vue';
import { usePasswordRecoveryStore } from '@/stores/password-recovery';
import { reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const passwordRecovery = usePasswordRecoveryStore();
const router = useRouter();
const feedback = reactive({ message: '', success: false });
const isLoading = reactive({ form: false });

/* Computed Variables */
// Informs user that their password must match the following criteria
// Contains at least one uppercase letter.
// Contains at least one lowercase letter.
// Contains at least one number.
// Contains at least one special character (@, #, $, %, etc.).
const passwordRegEx = computed(() => {
    const password = passwordRecovery.passwordRecovery.password;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (password && !regex.test(password)) {
        return "* Password must contain at least one upper case and lowercase letters, one number, and one special character";
    }
    return null;
});

// Informs user password and confirm password do not match
const passwordMatch = computed(() => {
    const password = passwordRecovery.passwordRecovery.password;
    const confirmPassword = passwordRecovery.passwordRecovery.confirm_password;
    if ((password && confirmPassword) && (password !== confirmPassword)) {
        return "* Both passwords must match";
    } else {
        return null;
    }
});

// Send sign-up form information to the backend
const changePassword = async() => {
    isLoading.form = true;

    try {
        // If the error messages for password constraints still exist, refuse to continue
        if (passwordMatch.value || passwordMatch.value) {
            console.error("The password must follow the password rules before you can continue.");
            return;
        }

        const body = {
            email: passwordRecovery.passwordRecovery.email,
            password: passwordRecovery.passwordRecovery.password,
        }

        const response = await axios.post('/api/password-recovery', body);
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        alert(response.data.message);

        // Reset the entire password-recovery local storage and reroute back to the login page
        // Ensure store is reset before navigation
        await Promise.resolve(passwordRecovery.resetPasswordRecovery());
        await Promise.resolve(passwordRecovery.resetComponent());

        // Navigate only after clearing data
        router.push({ name: 'login' });

    } catch (error) {
        console.error(`An error occured while changing the user's password`);
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