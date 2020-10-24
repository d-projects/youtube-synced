
// to-do: broadcast the controller
// toggle classList
// disable buttons while processing

const socket = io();

let state;
let chatWindow = document.querySelector('.chat');

socket.on('join', message => {
    document.querySelector("#message").innerText = message.joinMessage;
});

socket.on('getTime', ({to}) => {
    const time = player.getCurrentTime();
    socket.emit('sendTime', {time, state, to});
    console.log(to)
    console.log(state);
});

socket.on('setTime', ({time, state: s}) => {
    player.seekTo(time);
    if (s == YT.PlayerState.PLAYING){
        player.playVideo();
        state = s;   
    } else if (s == YT.PlayerState.PAUSED) {
        player.pauseVideo();
        state = s;
    }
});

socket.on('chatUpdated', message => {
    let p = document.createElement('p');   
    p.innerText = message;
    p.classList.add('messageOther');
    chatWindow.appendChild(p);
});

const updateState = (e) => {
    
    if (e.data == YT.PlayerState.BUFFERING){
    }
    else if (e.data == YT.PlayerState.PLAYING){
        state = YT.PlayerState.PLAYING       
    } else if (e.data == YT.PlayerState.PAUSED) {
        state = YT.PlayerState.PAUSED   
    }
}

const getVideoId = () => {
    return videoID;
}

const syncUp = () => {
    socket.emit('sync');
}

document.querySelector('#msgForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const message = e.target.elements.chatInput.value;
    e.target.elements.chatInput.value = '';
    let p = document.createElement('p');   
    p.innerText = message;
    p.classList.add('messageSelf');
    chatWindow.appendChild(p);
    socket.emit('updateChat', message);
});

document.querySelector('.sync').addEventListener('click', (e) => {
    syncUp();
})

