// This page sends validation requests from the home page to the backend API

/**
 * Checks that the room id is valid
 */
document.querySelector('#joinForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const room = e.target.room.value;
    const warningMsg = document.querySelector('.warning-msg');
  
    fetch('/checkRoom?room='+room)
    .then (result => result.json())
    .then( response => {
      if (response === 'Valid') {
        $('#nameModal').modal('show');
        $('#nameModal').find('#name').focus();
        $('#room').val(room);
        $('#url').val('');
      } else {
        throw new Error('Please enter a valid room ID');
      }
      if (!warningMsg.classList.contains('d-none')){
        warningMsg.classList.add('d-none');
      }
    })
    .catch( err => {
      warningMsg.classList.remove('d-none');
      warningMsg.innerHTML = `<h4> ${err} </h4>`;
    })
  
 });


/**
 * Checks that the Youtube video URL is valid
 */
document.querySelector('#startForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const url = e.target.url.value;
    const warningMsg = document.querySelector('.warning-msg');

    fetch('/checkURL?url='+url)
    .then (result => result.json())
    .then( response => {
        if (response === 'Valid') {
        $('#nameModal').modal('show');
        $('#nameModal').find('#name').focus();
        $('#url').val(url);
        $('#room').val('');
        } else {
        throw new Error(response);
        }
        if (!warningMsg.classList.contains('d-none')){
        warningMsg.classList.add('d-none');
        }
    })
    .catch( err => {
        warningMsg.classList.remove('d-none');
        warningMsg.innerHTML = `<h4> ${err} </h4>`;
    });

});