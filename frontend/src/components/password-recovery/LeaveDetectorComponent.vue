<template>
<section>
</section>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { usePasswordRecoveryStore } from '@/stores/password-recovery';
import axios from 'axios';

const passwordRecovery = usePasswordRecoveryStore();

function handleBeforeUnload(event) {
    // This event only fires when the user tries to:
    // - Close the browser tab
    // - Reload/refresh the page
    event.preventDefault();
    event.returnValue = ''; // Required to show the browser's default confirmation dialog
}

// ------------------------
// Detect Tab Close or Page Reload
// ------------------------
onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
});

// ------------------------
// Detect Route Change (Same Website Navigation)
// ------------------------
onBeforeRouteLeave(async (to, from, next) => {
    
    // Skip the following lines if there's no existing email in the local storage
    if (!passwordRecovery.passwordRecovery.email) {
        next();
        return;
    }; 

    // This fires when:
    // - The user navigates to a different route in your Vue app
    // - Using router links or programmatic navigation (router.push, etc.)
    const answer = window.confirm(`Are you sure you want to leave? Your proces will reset`);

    if (answer) {   // If user says ok
        await resetProgress('cancel', next);

    } else {    // If user cancels
        next(false); // Cancel navigation
    }
});

// Function for resetting user progress 
const resetProgress = async (reason, next) => {
    try {
        const body = {
            email: passwordRecovery.passwordRecovery.email,
            reason: reason
        }
        const response = await axios.post('/api/password-recovery/cancel-verification-code', body);
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        // Reset password-recovery progress
        passwordRecovery.resetComponent();
        passwordRecovery.resetPasswordRecovery();

        next(); // Allow navigation

    } catch (error) {
        console.error(`An error occured while resetting the user's progress`);

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
        }
        
        next(false); // Refuse to leave if failed
    }
}
</script>
