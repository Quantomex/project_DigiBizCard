const agreedCheckbox = document.getElementById("agreedTerms");
const passwordValue = document.getElementById('password')
const confirmPassword = document.getElementById('passwordConfirm')

const showPassBtn = document.getElementById('showPassBtn');
showPassBtn.addEventListener('change', (event) => {
    if (event.currentTarget.checked) {
        document.getElementById('password').type = 'text'
        document.getElementById('passwordConfirm').type = 'text'
    } else {
        document.getElementById('password').type = 'password'
        document.getElementById('passwordConfirm').type = 'password'
    }
})


function checkVerify(event){
        var error = document.getElementById('passwordVerifyError')
        if(event.currentTarget.value !== passwordValue.value){
            error.innerHTML = 'Password does not match'
            error.classList.remove('d-none')
        }else{
            // error.classList.add('valid-feedback')
            error.innerHTML = 'Password Matched!'
            error.style.color = 'green'
        }
}

var submitButton = document.getElementById('submitButton');
agreedCheckbox.addEventListener('change', () => {
    if (agreedCheckbox.checked === true) {
        submitButton.classList.remove('disabledbtn');
        submitButton.classList.add('activeBtn')
        submitButton.disabled = false
    } else {
        submitButton.classList.remove('activeBtn')
        submitButton.classList.add('disabledbtn')
        submitButton.disabled = true
    }        
})