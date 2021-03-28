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
        player = new YT.Player('video-container', {
            height: '600',
            width: '1000',
            videoId: videoID,
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        })
        
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

function onPlayerReady(event) {
    syncUp();
}

function onPlayerStateChange(event) {
    updateState(event);
}

function stopVideo() {
    player.stopVideo();
}