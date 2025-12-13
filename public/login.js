document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // DEBUG ALERT
    const debugMsg = 'Sedang menghubungkan ke server... Mohon tunggu sebentar.';
    console.log(debugMsg);
    // alert(debugMsg); // Optional: Un-comment if needed, but console is cleaner

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');
    const submitBtn = document.querySelector('button[type="submit"]');

    // Reset error state
    errorMsg.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memproses...';

    try {
        // Determine API URL (Localhost vs Production)
        const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
        const apiUrl = isLocal ? 'http://localhost:3000/api/auth/login' : '/api/auth/login';

        console.log('Fetching:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: username, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            // Save token and user info
            localStorage.setItem('admin_token', data.token);
            localStorage.setItem('admin_user', JSON.stringify(data.user));

            // Set flags for admin.js compatibility
            localStorage.setItem('viranet_admin_logged_in', 'true');
            localStorage.setItem('viranet_admin_username', data.user.username);

            // console.log('Login Berhasil! Mengalihkan ke Dashboard...');

            // Redirect
            window.location.href = 'admin.html';
        } else {
            console.error('Server Login Error:', data);
            throw new Error(data.error || 'Login failed');
        }

    } catch (error) {
        console.error('Login Exception:', error);

        errorMsg.textContent = error.message || 'Username atau password salah!';
        errorMsg.style.display = 'block';

        submitBtn.textContent = 'Masuk Dashboard';
        submitBtn.disabled = false;

        // alert('Gagal: ' + error.message);
    }
});
