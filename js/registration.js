document.querySelector('.register-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    axios.post('http://52.77.246.223:3002/register', data)
        .then(response => {
            const result = response.data;
            if (result.message === 'User registered successfully!') {
                alert(result.message);
                location.href = 'login.html'; // Redirect to login page
            } else {
                alert('Registration failed: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Registration failed. Please try again.');
        });
});
