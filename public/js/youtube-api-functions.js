let player;
function onYouTubeIframeAPIReady() {
    fetch('videoID', {
        credentials: 'include'
    })
    .then( response => {
        return response.json();
    })
    .then( data => {
        const videoID = data;
        console.log('yay')
        player = new YT.Player('video-container', {
            height: '600',
            width: '1000',
            videoId: videoID,
            // playerVars: {
            //     controls: 0,
            //     disablekb: 1,
            //     rel : 0,
            //     fs : 0,
            // },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        })
        
        setTimeout( () => {
            syncUp();
        }, 500);
        document.querySelector('iframe').classList.add('.responsive-iframe');
    })
    .catch( err => {
        console.log(err);
    });
    const tag = document.createElement('script')
    tag.src = "/js/handle.js";
    tag.type = 'text/javascript'
    var scriptLoc = document.querySelector('.chat-script');
    scriptLoc.appendChild(tag);
    
}
// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    //syncUp()
}
// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
let done = false;
let previous_state = 0;
let current_state = 0;
function onPlayerStateChange(event) {
    updateState(event);
}
function stopVideo() {
    player.stopVideo();
}