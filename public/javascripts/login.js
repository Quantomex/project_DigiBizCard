const checked = document.getElementById("showPasswordInput");
checked.addEventListener('change', (event) => {
    if (event.currentTarget.checked) {
        document.getElementById('password').type = 'text'
    } else {
        document.getElementById('password').type = 'password'
    }
});