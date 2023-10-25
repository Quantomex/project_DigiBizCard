const fullnameField = document.getElementById('fullname');
var click = false
fullnameField.addEventListener('click', (event) => {
    if (click == false) {
        document.getElementById('fullnameDropdown').classList.add("fullnameDropdownShow")
        document.getElementById('rotate').classList.add('rotate')
        click = true
    } else {
        document.getElementById('fullnameDropdown').classList.remove("fullnameDropdownShow")
        document.getElementById('rotate').classList.remove('rotate')
        click = false
    }
})

function addValue(colorCode, id) {
    const silentSubmit = document.getElementById('silentSubmit');
    silentSubmit.value = colorCode
    const submitBtn = document.getElementById('submit')
    submitBtn.style.backgroundColor = colorCode
    const path = document.getElementById('path')
    path.style.fill = colorCode
}

function addValuePro(event) {
    if (event.target.value) {
        const silentSubmit = document.getElementById('silentSubmit');
        silentSubmit.value = event.target.value
        const submitBtn = document.getElementById('submit')
        submitBtn.style.backgroundColor = event.target.value
        const path = document.getElementById('path')
        path.style.fill = event.target.value
    }
}

const loadFile = function (event) {
    var image = document.getElementById('output');
    image.src = URL.createObjectURL(event.target.files[0]);
};

function addMore(placeholder, inputType, name) {
    const setDisable = document.getElementById(name)
    setDisable.disabled = true;
    const container = document.getElementById('expandInputs');
    const li = document.createElement('li');
    const input = document.createElement('input');
    li.className = 'list-group-item';
    input.type = inputType;
    input.placeholder = placeholder
    input.id = "bottomInputs"
    input.name = name
    li.appendChild(input);
    container.appendChild(li)
}