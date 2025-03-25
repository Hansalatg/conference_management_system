form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Hardcoded admin credentials
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';

  try {
      if (email === adminEmail && password === adminPassword) {
          // If admin login is correct, redirect to the admin dashboard
          localStorage.setItem('adminName', 'Admin');
          window.location.href = '/frontend/admin-panel/admin.html';  // Redirect to admin panel
      } else {
          // Check participant credentials from the database
          const response = await fetch('http://localhost:3000/api/participant-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
          });

          const result = await response.json();

          if (response.ok) {
              // Store the participant's information in localStorage
              localStorage.setItem('participantName', result.user.name);
              localStorage.setItem('participantId', result.user.participantId);

              // Redirect to the participant dashboard
              window.location.href = 'participant-welcome.html';
          } else {
              // Show an error message if the participant login fails
              alert(result.error || 'Invalid credentials!');
          }
      }
  } catch (error) {
      console.error('Error:', error);
      alert('Login failed! An error occurred.');
  }
});
