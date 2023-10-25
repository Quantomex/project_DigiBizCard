const search = () => {
  const searchbox = document.getElementById('search-item').value.toLowerCase();
  const cards = document.querySelectorAll('.rowTabs');
  const cardName = document.getElementsByTagName('h1');
  for(var i=0; i< cardName.length; i++){
    let match = cards[i].getElementsByTagName('h1')[0];
    if(match){
      let textValue =  match.textContent || match.innerHTML;
      if(textValue.toLowerCase().indexOf(searchbox) > -1){
        cards[i].style.display = "";
      }else{
        cards[i].style.display = 'none';
      }
    }
  }

// console.log(cardName)
}