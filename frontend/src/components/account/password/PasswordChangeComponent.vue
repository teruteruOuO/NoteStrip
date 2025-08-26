<template>
<section id="password-change" class="component">
    <form @submit.prevent="changePassword">
        <ul>
            <li>
                <label for="old-password">Current Password: </label>
                <input type="password" name="old-password" id="old-password" v-model="password.old" required />
            </li>
            <li>
                <label for="new-password">New Password: </label>
                <input type="password" name="new-password" id="new-password" v-model="password.new" required />
            </li>
            <li>
                <label for="confirm-new-password">Confirm New Password: </label>
                <input type="password" name="confirm-new-password" id="confirm-new-password" v-model="password.confirm" required />
            </li>
            <li>
                <button type="submit" :disabled="isLoading.form" :class="{ 'button-loading': isLoading.form }">
                    <span v-if="!isLoading.form">Change Password</span>
                    <span v-else>Changing...</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="feedback" ref="feedbackScroll" v-if="feedback.message || passwordMatch || passwordRegEx">
        <p :class="{ 'success': feedback.success, 'fail': !feedback.success }">{{ feedback.message }}</p>
        <p class="fail">{{ passwordRegEx }}</p>
        <p class="fail">{{ passwordMatch }}</p>
    </section>
</section>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import { reactive, computed, ref, nextTick } from 'vue';
import axios from 'axios';

const user = useUserStore();
const feedback = reactive({ message: '', success: false });
const feedbackScroll = ref(null);
const isLoading = reactive({ form: false });
const password = reactive({
    old: '',
    new: '',
    confirm: ''
});

/* Computed Variables */
// Informs user that their password must match the following criteria
// Contains at least one uppercase letter.
// Contains at least one lowercase letter.
// Contains at least one number.
// Contains at least one special character (@, #, $, %, etc.).
const passwordRegEx = computed(() => {
    const newPassword = password.new;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (newPassword && !regex.test(newPassword)) {
        return "* Password must contain at least one upper case and lowercase letters, one number, and one special character";
    }
    return null;
});

// Informs user password and confirm password do not match
const passwordMatch = computed(() => {
    const newPassword = password.new;
    const confirmPassword = password.confirm;
    if ((newPassword && confirmPassword) && (newPassword !== confirmPassword)) {
        return "* Both passwords must match";
    } else {
        return null;
    }
});

const changePassword = async () => {
    isLoading.form = true;

    try {
        // If the error messages for password constraints still exist, refuse to continue
        if (passwordMatch.value || passwordMatch.value) {
            console.error("The password must follow the password rules before you can continue.");

            await nextTick();
            feedbackScroll.value?.scrollIntoView({ behavior: "smooth", block: "center" });

            return;
        }

        const body = {
            old_password: password.old,
            new_password: password.new
        }
        const response = await axios.post(`/api/account/password/${user.user.id}`, body);
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        feedback.success = true;
        feedback.message = response.data.message;

        alert(response.data.message);

        // Reset fields
        password.old = '';
        password.new = '';
        password.confirm = '';

        await nextTick();
        feedbackScroll.value?.scrollIntoView({ behavior: "smooth", block: "center" });

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