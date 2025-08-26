<template>
<section id="email-change" class="component">
    <!-- Show if component is retrieving the necessary resources -->
    <section class="loader" v-if="isLoading.page">
    </section>

    <!-- Show if retrieving the email failed -->
    <section class="retrieve-fail fail" v-else-if="!feedback.retrieve_email.success">
        <p>{{ feedback.retrieve_email.message }}</p>
    </section>

    <!-- Show when retrieve success -->
    <section class="retrieve-success" v-else>
        <form @submit.prevent="sendVerificationCode">
            <ul>
                <li>
                    <label for="current-email">Current Email: </label>
                    <input type="email" name="current-email" id="current-email" v-model="userInformation.current_email" disabled />
                </li>
                <li>
                    <!-- Disabled if the verification form is up or if processing the submission-->
                    <label for="new-email">New Email: </label>
                    <input 
                    type="email" 
                    name="new-email" 
                    id="new-email" 
                    v-model="user.changeEmail.form.new_email" 
                    required 
                    :disabled="isLoading.new_email_form || user.changeEmail.section.verification_form"/>
                </li>
                <li>
                    <!-- Disabled if the verification form is up or if processing the submission-->
                    <button 
                    type="submit" 
                    :disabled="isLoading.new_email_form || user.changeEmail.section.verification_form" 
                    :class="{ 'button-loading': isLoading.new_email_form }">
                        <span v-if="user.changeEmail.section.verification_form">Waiting to verify...</span>
                        <span v-else-if="!isLoading.new_email_form">Send Verification Code</span>
                        <span v-else>Sending...</span>
                    </button>
                </li>
            </ul>
        </form>

        <section
        ref="feedbackNewEmailScroll" 
        class="feedback" 
        :class="{ 'success': feedback.new_email_form.success, 'fail': !feedback.new_email_form.success}"
        v-if="feedback.new_email_form.message"
        >
            <p>{{ feedback.new_email_form.message }}</p>
        </section>

        <EmailTimerComponent v-if="user.changeEmail.timer.start" :key="user.changeEmail.timer.id"/>

        <section id="verification-code-form" ref="verificationCodeFormScroll" v-if="user.changeEmail.section.verification_form">
            <form @submit.prevent="verifyVerificationCode">
                <ul>
                    <li>
                        <label for="verification-code">Verification Code: </label>
                        <input type="text" 
                        name="verification-code" 
                        id="verification-code" 
                        v-model="user.changeEmail.form.verification_code" 
                        min=6 
                        max=6 
                        placeholder="required"
                        required />
                    </li>
                    <li>
                        <button type="submit" :disabled="isLoading.verification.form" :class="{ 'button-loading': isLoading.verification.form }">
                            <span v-if="!isLoading.verification.form">Verify Code</span>
                            <span v-else>Verifying Code...</span>
                        </button>
                    </li>
                    <li>
                        <button type="button" @click="resetProcess" :disabled="isLoading.verification.reset" :class="{ 'button-loading': isLoading.verification.reset }">
                            <span v-if="!isLoading.verification.reset">Reset Process</span>
                            <span v-else>Resetting Process...</span>
                        </button>
                    </li>
                    <li>
                        <button type="button" @click="resendVerificationCode" :disabled="isLoading.verification.resend" :class="{ 'button-loading': isLoading.verification.resend }">
                            <span v-if="!isLoading.verification.resend">Resend Verification Code</span>
                            <span v-else>Resending Verification Code...</span>
                        </button>
                    </li>
                </ul>
            </form>

            <section 
            ref="feedbackVerificationCodeFormScroll"
            class="feedback" 
            :class="{ 'success': feedback.verification_code_form.success, 'fail': !feedback.verification_code_form.success}"
            v-if="feedback.verification_code_form.message">
                <p>{{ feedback.verification_code_form.message }}</p>
            </section>
        </section>
    </section>

    <LeaveDetectorComponent />
</section>
</template>

<script setup>
import LeaveDetectorComponent from './LeaveDetectorComponent.vue';
import EmailTimerComponent from './EmailTimerComponent.vue';
import { reactive, onMounted, ref, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import axios from 'axios';

const user = useUserStore();
const userInformation = reactive({ current_email: ''});
const isLoading = reactive({ 
    page: false , 
    new_email_form: false, 
    verification: {
        form: false,
        resend: false,
        reset: false
    }
 });
const feedback = reactive({ 
    retrieve_email: {
        message: '',
        success: false
    },
    new_email_form: {
        message: '',
        success: false
    },
    verification_code_form: {
        message: '',
        success: false
    }
});
const feedbackNewEmailScroll = ref(null);
const verificationCodeFormScroll = ref(null);
const feedbackVerificationCodeFormScroll = ref(null);

// Reset all variables in this component only
const resetVariables = () => {
    isLoading.page = false;
    isLoading.new_email_form = false;
    isLoading.verification.form = false;
    isLoading.verification.resend = false;
    isLoading.verification.reset = false;

    feedback.new_email_form.message = '';
    feedback.new_email_form.success = false;

    feedback.verification_code_form.message = '';
    feedback.verification_code_form.success = false;
}

// Retrieve the user's email
const retrieveEmail = async () => {
    isLoading.page = true;

    try {
        const response = await axios.get(`/api/account/email/${user.user.id}`);
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        feedback.retrieve_email.success = true;                 // Set to true if resource retrieval success
        userInformation.current_email = response.data.email;    // Store retrieved email

    } catch (error) {
        console.error(`An error occured while retrieving the user's email`);
        feedback.retrieve_email.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.retrieve_email.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.retrieve_email.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }

    } finally {
        isLoading.page = false;
    }
}

// Send verification code to the user's new email
const sendVerificationCode = async () => {
    isLoading.new_email_form = true;

    try {
        const response = await axios.post(`/api/account/email/send-verification-code/${user.user.id}`, { new_email: user.changeEmail.form.new_email });
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        feedback.new_email_form.success = true;
        feedback.new_email_form.message = response.data.message

        user.changeEmail.form.new_email = response.data.email;  // Store the new email temporarily in the local storage

        // verify-code section should appear
        user.changeEmail.section.verification_form = true;

        // Start the timer for EmailTimerComponent.vue for 600 seconds
        user.changeEmail.timer.start = true;
        user.changeEmail.timer.time_left = user.changeEmail.timer.clock;

        // Remove the feedback message after 5 seconds
        setTimeout(() => {
            feedback.new_email_form.success = false;
            feedback.new_email_form.message = '';
        }, 5000);

        await nextTick();
        verificationCodeFormScroll.value?.scrollIntoView({ behavior: "smooth", block: "center" });

    } catch (error) {
        console.error(`An error occured while sending a verification code to ${user.changeEmail.form.new_email}`);
        feedback.new_email_form.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.new_email_form.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.new_email_form.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }

        await nextTick();
        feedbackNewEmailScroll.value?.scrollIntoView({ behavior: "smooth", block: "center" });

    } finally {
        isLoading.new_email_form = false;
    }
}

// Resend a new verification code to the user's new email
const resendVerificationCode = async () => {
    isLoading.verification.resend = true;

    try {
        const response = await axios.post(`/api/account/email/resend-verification-code/${user.user.id}`, { new_email: user.changeEmail.form.new_email });
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        feedback.verification_code_form.success = true;
        feedback.verification_code_form.message = response.data.message;
        
        // Reset the timer
        user.changeEmail.timer.start = false;
        user.changeEmail.timer.start = true;
        user.changeEmail.timer.id++
        user.changeEmail.timer.time_left = user.changeEmail.timer.clock;

    } catch (error) {
        console.error(`An error occured while resending a verification code to ${user.changeEmail.form.new_email}`);
        feedback.verification_code_form.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.verification_code_form.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.verification_code_form.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }

    } finally {
        await nextTick();
        feedbackVerificationCodeFormScroll.value?.scrollIntoView({ behavior: "smooth", block: "center" });

        isLoading.verification.resend = false;
    }
}

// Reset the process
const resetProcess = async () => {
    isLoading.verification.reset = true;

    try {
        const response = await axios.post(`/api/account/email/cancel-verification-code/${user.user.id}`, { reason: 'cancel' });
        console.log(response.data.message);
        console.log(`Response data information:`, response);
        alert(`Successfully resetted email change process back to the beginning!`);

        // Reset change email process
        user.resetChangeEmail();
        resetVariables();

    } catch (error) {
        console.error(`An error occured while resetting the email change process for ${user.user.id}`);
        feedback.verification_code_form.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.verification_code_form.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.verification_code_form.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }
    } finally {
        isLoading.verification.reset = false;
    }
}

// Verify verification code
const verifyVerificationCode = async () => {
    isLoading.verification.form = true;

    try {
        const body = {
            new_email: user.changeEmail.form.new_email,
            verification_code: user.changeEmail.form.verification_code
        }
        const response = await axios.post(`/api/account/email/verify-verification-code/${user.user.id}`, body);
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        alert(response.data.message);

        // Reset change email process
        user.resetChangeEmail();
        resetVariables();

        await retrieveEmail();

    } catch (error) {
        console.error(`An error occured while verifying the verification code for user #${user.user.id}`);
        feedback.verification_code_form.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.verification_code_form.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.verification_code_form.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }

        await nextTick();
        feedbackVerificationCodeFormScroll.value?.scrollIntoView({ behavior: "smooth", block: "center" });
        
    } finally {

        isLoading.verification.form = false;
    }
}

onMounted(async () => {
    await retrieveEmail();
});
</script>