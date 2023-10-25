const toastTrigger = document.getElementById('liveToastBtn')
const toastLiveExample = document.getElementById('liveToast')
if (toastTrigger) {
  toastTrigger.addEventListener('click', () => {
    const toast = new bootstrap.Toast(toastLiveExample)

    toast.show()
  })
}

const tabs = document.querySelectorAll('.tabNavigator .tab');
const screens = document.querySelectorAll(".screen");
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    tabs.forEach((tab) => {
      tab.classList.remove('active')
    })
    screens.forEach(screen => {
      screen.classList.add('d-none')
    })
    tab.classList.add('active')
    screens[index].classList.remove('d-none')
  })
})

const copyBtn = document.querySelector('#copy-btn');
copyBtn.addEventListener('click', () => {
  const clipboardText = document.querySelector('#copy-btn')
    .getAttribute('data-clipboard-text');
  navigator.clipboard.writeText(clipboardText)
  copyBtn.textContent = "Copied to clipboard"
  setTimeout(() => {
    copyBtn.textContent = "Copy link again"
  }, 2000)
});
const data = document.querySelector('.headingContainer')
const id = data.dataset.cardId;
fetch(`/viewcount/${id}`).then(response => response.json()).then(data => {
  const ctx = document.getElementById('viewCounter');
  new Chart(ctx, {
    type: 'bar',
    data: {
      datasets: [{
        label: "Views",
        data: data,
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
})
fetch(`/savecount/${id}`).then(response => response.json()).then(data => {
  const ctx = document.getElementById('saveCount');
  new Chart(ctx, {
    type: 'bar',
    data: {
      datasets: [{
        label: "Saved Contacts",
        data: data,
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
})
fetch(`/contactcount/${id}`).then(response => response.json()).then(data => {
  const ctx = document.getElementById('contactCount');
  new Chart(ctx, {
    type: 'bar',
    data: {
      datasets: [{
        label: "Added to Contacts",
        data: data,
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
})

const renewLink = document.getElementById('renewLink');
renewLink.addEventListener('click', function (event) {
  const inputRenew = document.getElementById('inputRenew')
  if (inputRenew.value !== 'renew') {
    alert('Please enter "renew" as input value')
    event.preventDefault()
  }
})