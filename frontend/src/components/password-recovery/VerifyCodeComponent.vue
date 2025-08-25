<template>
<section id="verify-code" class="component">
    <PasswordRecoveryTimerComponent v-if="passwordRecovery.component.timer.start" :key="passwordRecovery.component.timer.id"/>

    <form @submit.prevent="verifyVerificationCode">
        <ul>
            <li>
                <label for="verification-code">Verification Code: </label>
                <input 
                type="text" 
                name="verification-code" 
                id="verification-code" 
                v-model="passwordRecovery.passwordRecovery.verification_code" 
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
import PasswordRecoveryTimerComponent from './PasswordRecoveryTimerComponent.vue';
import LeaveDetectorComponent from './LeaveDetectorComponent.vue';
import { usePasswordRecoveryStore } from '@/stores/password-recovery';
import { reactive, ref, nextTick } from 'vue';
import axios from 'axios';

const passwordRecovery = usePasswordRecoveryStore();
const isLoading = reactive({ verify: false, resend: false });
const feedback = reactive({ message: '', success: false });
const feedbackScroll = ref(null);

// Resend a new verification code
const resendVerificationCode = async () => {
    isLoading.resend = true;

    try { 
        const response = await axios.post('/api/password-recovery/resend-verification-code', { email: passwordRecovery.passwordRecovery.email });
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        // Reset timer
        passwordRecovery.component.timer.start = false;
        passwordRecovery.component.timer.start = true;
        passwordRecovery.component.timer.id++
        passwordRecovery.component.timer.time_left = passwordRecovery.component.timer.clock;

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

// Verify verification code
const verifyVerificationCode = async () => {
    isLoading.verify = true;

    try {
        const body = {
            email: passwordRecovery.passwordRecovery.email,
            verification_code: passwordRecovery.passwordRecovery.verification_code
        }
        const response = await axios.post('/api/password-recovery/verify-verification-code', body);
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        alert(response.data.message);

        // Reset timers
        passwordRecovery.component.timer.id = 0;
        passwordRecovery.component.timer.start = false;
        passwordRecovery.component.timer.time_left = 0;

        // Change component to ChangePasswordComponent
        passwordRecovery.component.verification_form = false;
        passwordRecovery.component.password_form = true;

    } catch (error) {
        console.error(`An error occured while verifying the verification code of the user`);
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