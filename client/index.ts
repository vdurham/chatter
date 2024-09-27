import axios, { AxiosResponse } from 'axios';

function goToAuth() {
  window.location.href = '../../pages/auth.html';
  alert(
    'You you must be logged in to access this page. Redirecting to login page.'
  );
}

async function isLoggedIn(): Promise<boolean> {
  const T = localStorage.getItem('token');
  const CU = localStorage.getItem('currentUser');

  if (T === null || CU === null) {
    goToAuth();
    return false;
  } else {
    try {
      const res: AxiosResponse = await axios.request({
        method: 'GET',
        headers: { Authorization: `Bearer ${T}` },
        url: `/chat/users/${CU}`,
        validateStatus: () => true
      });
      if (res.status >= 200 && res.status < 300) {
        if (res.data.payload.credentials.username == CU) {
          window.location.href = '../../pages/chat.html';
        }
      } else {
        goToAuth();
        return false;
      }
    } catch (err) {
      goToAuth();
      return false;
    }
    return true;
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const chatLink = document.getElementById('chatLink');
  if (chatLink) {
    chatLink.addEventListener('click', isLoggedIn);
  }
});
