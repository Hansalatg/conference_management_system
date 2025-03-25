document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone_number = document.getElementById('phone_number').value;
    const password = document.getElementById('password').value;
  
    try {
      const response = await fetch('http://localhost:5000/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone_number, password }),
      });
  
      const result = await response.json();
      console.log(result); // Log the response for debugging
  
      if (response.ok) {
        alert(result.message);
        window.location.href = 'login_admin.html';
      } else {
        alert(result.message); // Show error messages from the backend
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Registration failed!');
    }
  });
  