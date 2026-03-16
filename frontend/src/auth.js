function login() {
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!email || !password) {
      loginError.textContent = 'Email and password are required.';
      return;
    }

    // Local mode (no backend)
    window.location.href = 'home.html';

    // Backend mode (uncomment to restore):
    // try {
    //   const resp = await fetch('http://localhost:4000/users/login', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email, password }),
    //     credentials: 'include',
    //   });
    //   const data = await resp.json();
    //   if (!resp.ok) throw new Error(data.message || 'Login failed');
    //   window.location.href = 'home.html';
    // } catch (err) {
    //   loginError.textContent = err.message || 'Login failed';
    // }
  });
}

function signup() {
  const signupForm = document.getElementById('signupForm');
  const signupError = document.getElementById('signupError');
  signupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    if (!name || !email || !password) {
      signupError.textContent = 'Please fill in all fields.';
      return;
    }

    // Local mode
    alert('Account created. Please login.');
    window.location.href = 'index.html';

    // Backend mode (uncomment to restore):
    // try {
    //   const resp = await fetch('http://localhost:4000/users/register', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ name, email, password }),
    //   });
    //   const data = await resp.json();
    //   if (!resp.ok) throw new Error(data.message || 'Signup failed');
    //   alert('Account created. Please login.');
    //   window.location.href = 'index.html';
    // } catch (err) {
    //   signupError.textContent = err.message || 'Signup failed';
    // }
  });
}

login();
signup();
