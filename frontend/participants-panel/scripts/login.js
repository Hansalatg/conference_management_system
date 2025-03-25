document.getElementById('loginButton').addEventListener('click', async function () {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Hardcoded admin login details
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';

    if (email && password) {
        if (email === adminEmail && password === adminPassword) {
            // If admin login is correct, redirect to the admin dashboard
            localStorage.setItem('adminName', 'Admin');
            window.location.href = '../admin-panel/admin.html'; // Change this to the correct admin dashboard page
        } else {
            try {
                // If it's not an admin login, send a request to the participant login API
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Store the participant's name and participantId in localStorage for later use
                    localStorage.setItem('participantName', data.user.name);
                    localStorage.setItem('participantId', data.user.participantId);

                    console.log('Participant ID stored:', localStorage.getItem('participantId'));

                    // Redirect to the participant's welcome page
                    window.location.href = 'participant-welcome.html'; // Change this to the correct participant welcome page
                } else {
                    // Display error message if the login fails
                    document.getElementById('loginMessage').textContent = data.error || 'Invalid credentials';
                }
            } catch (error) {
                console.error('Error logging in:', error);
                document.getElementById('loginMessage').textContent = 'An error occurred. Please try again.';
            }
        }
    } else {
        // Display message if email or password is not provided
        document.getElementById('loginMessage').textContent = 'Please fill in both fields.';
    }
});
