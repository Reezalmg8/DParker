// userProfile.js
fetch('http://52.77.246.223:3000/user-profile', {
    method: 'GET',
})
.then(response => response.json())
.then(data => {
    document.getElementById('user-name').textContent = data.name;
    // Update other elements with user data
})
.catch(error => console.error('Error:', error));
