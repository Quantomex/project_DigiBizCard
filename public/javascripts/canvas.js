const toastTrigger = document.getElementById('liveToastBtn')
const toastLiveExample = document.getElementById('liveToast')
if (toastTrigger) {
  toastTrigger.addEventListener('click', () => {
    const toast = new bootstrap.Toast(toastLiveExample)

    toast.show()
  })
}

const search = () => {
  const searchbox = document.getElementById('search-item').value.toLowerCase();
  const cardItems = document.getElementById('card-list');
  const cards = document.querySelectorAll('.customCard');
  const cardName = document.getElementsByTagName('h3');
  for(var i=0; i< cardName.length; i++){
    let match = cards[i].getElementsByTagName('h3')[0];
    if(match){
      let textValue =  match.textContent || match.innerHTML;
      if(textValue.toLowerCase().indexOf(searchbox) > -1){
        cards[i].style.display = "";
      }else{
        cards[i].style.display = 'none';
      }
    }
  }

}