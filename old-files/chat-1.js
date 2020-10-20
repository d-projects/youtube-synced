
// to-do: broadcast the controler
// toggle classList
const socket = io();
let controller = false;


socket.on('join', message => {
    document.querySelector("#message").innerText = message.joinMessage;
    if (message.master){
        controller = true;

    } else {
        document.querySelector('iframe').classList.add('okok')
    }

});

function getVideoId() {
    return videoID
}

document.querySelector('#msgForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const message = e.target.elements.input.value;
    e.target.elements.input.value = '';
    socket.emit('update', message);
});

let chatWindow = document.querySelector('.chat');

socket.on('chatUpdated', message => {
    let p = document.createElement('p');   
    p.innerText = message;
    chatWindow.appendChild(p);
});

const dod = (time) => {
    //socket.emit('time', time);
    //if ()
}



const updateState = (e) => {
    
    console.log('here')
    if (e.data == YT.PlayerState.BUFFERING || controller === false){

    }
    else if (e.data == YT.PlayerState.PLAYING){
        socket.emit('play');
        //syncUp();

        
    } else if (e.data == YT.PlayerState.PAUSED) {
        socket.emit('pause');
        //syncUp();

        
    }
}

const syncUp = () => {
    socket.emit('sync');
}

socket.on('updatePlay', (time) => {
    controller = false;
    player.seekTo(time);
    player.playVideo();
    console.log('changed')
    //syncUp();
});

socket.on('updatePause', (time) => {
    controller = false;
    player.seekTo(time);
    player.pauseVideo();
});

socket.on('getTime', () => {
    const time = player.getCurrentTime();
    socket.emit('sendTime', time);
});

socket.on('setTime', (time) => {
    console.log(time)
    player.seekTo(time);
});

document.querySelector('#control').addEventListener('submit', (e) => {
    e.preventDefault();
    socket.emit('getControl');
    controller = true;
    document.querySelector('iframe').classList.remove('okok')

})

socket.on('loseControl', () => {
    controller = false;
    document.querySelector('iframe').classList.remove('okok')
})

