import { reactive } from 'vue';
import { defineStore } from 'pinia';

export const useSignupStore = defineStore('sign-up', () => {
	const signup = reactive({
		email: '',
		password: '',
		confirm_password: '',
		verification_code: '',
		timer: {
			start: false,
			key: 0
		}
	});

	const resetSignup = () => {
		signup.email = '';
		signup.password = '';
		signup.confirm_password = '';
		signup.verification_code = '';
		signup.timer.start = false;
		signup.timer.key = 0;
	}

	return { signup, resetSignup }
}, { persist: { enabled: true } });
