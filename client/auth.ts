import axios, { AxiosResponse } from 'axios';
import { IResponse, isSuccess } from '../common/server.responses';
import { IUser } from '../common/user.interface';
import { log } from 'console';

async function login(email: string, password: string) {
  try {
    const res: AxiosResponse = await axios.request({
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: { password: password },
      url: `/auth/tokens/${email}`,
      validateStatus: () => true
    });

    if (res.status >= 200 && res.status < 300) {
      // Successful login
      localStorage.setItem('token', res.data.payload.token); // Save token to local storage
      localStorage.setItem(
        'currentUser',
        res.data.payload.user.credentials.username
      ); // Save current user to local storage
      alert('Login successful! You will be redirected to the chat page.');
      window.location.href = '../../pages/chat.html';
    } else {
      alert(res.data.message); // Display error message to the user
    }
  } catch (error) {
    alert(`An error occurred during login. ${error.message}`);
  }
}

async function register(email: string, name: string, password: string) {
  // TODO: register the user
  const res: AxiosResponse = await axios.request({
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    data: { credentials: { username: email, password: password }, extra: name },
    url: '/auth/users',
    validateStatus: () => true
  });

  if (res.status >= 200 && res.status < 300) {
    // Successful registration
    alert('Registration successful!');
    login(email, password); // Log in the user after successful registration

    const form = document.getElementById('authForm') as HTMLFormElement;
    form.reset(); // Clear the form after successful registration
  } else {
    // Failed registration
    const errorMessage = res.data.message; // Extract error message from response body
    alert(errorMessage); // Display error message to the user
  }
}

async function onSubmitForm(e: SubmitEvent) {
  // form submission event handler
  e.preventDefault(); // prevent default form submission

  //extract form data
  const formData = new FormData(e.target as HTMLFormElement);
  const email = formData.get('myEmail') as string;
  const name = formData.get('myName') as string;
  const password = formData.get('myPassword') as string;
  //const whichButtonId = formData.get('submit') as string;

  const whichButton: HTMLButtonElement = e.submitter as HTMLButtonElement;
  if (whichButton.id === 'loginBtn') {
    // login button clicked
    // TODO
    login(email, password);
  } else if (whichButton.id === 'registerBtn') {
    // register button clicked
    // TODO
    register(email, name, password);
  } else {
    // TODO
  }
}

function togglePasswordVisibility(): void {
  const passwordInput = document.getElementById(
    'myPassword'
  ) as HTMLInputElement;
  const toggle = document.getElementById('passwordToggle') as HTMLElement;
  const eyeIcon = toggle.querySelector('i');

  if (passwordInput && eyeIcon) {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      eyeIcon.classList.remove('fa-eye');
      eyeIcon.classList.add('fa-eye-slash');
      eyeIcon.setAttribute('title', 'Hide Password');
    } else {
      passwordInput.type = 'password';
      eyeIcon.classList.remove('fa-eye-slash');
      eyeIcon.classList.add('fa-eye');
      eyeIcon.setAttribute('title', 'Show Password');
    }
  }
}

document.addEventListener('DOMContentLoaded', function (e: Event) {
  // document-ready event handler
  console.log('Page loaded successfully');

  // add event listener to the form
  const authForm = document.getElementById('authForm');
  if (authForm) {
    authForm.addEventListener('submit', onSubmitForm);
  }

  // add event listener to the password visibility toggle
  const passwordToggle = document.getElementById('passwordToggle');
  if (passwordToggle) {
    passwordToggle.addEventListener('click', togglePasswordVisibility);
  }
});
