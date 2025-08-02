import { reactive } from 'vue';
import { defineStore } from 'pinia';

export const useSignupStore = defineStore('sign-up', () => {
	const signup = reactive({
		email: '',
		password: '',
		confirm_password: '',
		verification_code: '',
	});

	const component = reactive({
		signup_form: true,
		verification_form: false,
		timer: {
			time_left: 0,
			start: false,
			id: 0
		}
	});

	const resetSignup = () => {
		signup.email = '';
		signup.password = '';
		signup.confirm_password = '';
		signup.verification_code = '';
	}

	const resetComponent = () => {
		component.signup_form = true;
		component.verification_form = false,
		component.timer.time_left = 0,
		component.timer.start = false
		component.timer.id = 0;
	}

	return { signup, component, resetSignup, resetComponent }
}, { persist: { enabled: true } });
