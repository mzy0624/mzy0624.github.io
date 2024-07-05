let song_name    = ['七里香 - 周杰伦', '海阔天空 - BEYOND'];
let song_count   = song_name.length;
let cur_song     = 0;
let started      = false;
let audio        = new BaseElement('audio', '',  {'src' : 'files/musics/0.mp3'});
let cover        = new Img('files/musics/0.png', {'id' : 'cover', 'class' : 'hidden', 'style' : 'height: 95px'});
let music_name   = new Small('点击播放音乐',       {'style' : 'margin-bottom: -1em'});
let prev_song    = new Button('⏪',              {'style' : 'background: transparent; border: none'})
let play_pause   = new Button('▶️',               {'style' : 'background: transparent; border: none'});
let next_song    = new Button('⏩',              {'style' : 'background: transparent; border: none'});
let progress     = new BaseElement('input', '',  {'type'  : 'range', 'value' : '0', 'disabled' : 'true'});
let cur_time     = new Span('0:00',              {'style' : ['font-size: 14px', 'margin-right: 2px']});
let total_time   = new Span('0:00',              {'style' : ['font-size: 14px', 'margin-left: 2px']});
let cur_lyric    = new Para('',                  {'style' : ['margin: 0 10px', 'font-size: 10px']});
let next_lyric   = new Para('',                  {'style' : ['margin: 0 10px', 'font-size: 10px', 'color: #9c9c9c;']});
let is_seeking   = false;
let lyrics       = [];
let music_player = new Table([[
    cover, new Div([
        audio, music_name,
        new Div([prev_song, play_pause, next_song]),
        new Div([cur_time, progress, total_time], {'class' : 'music_controller'}),
        new Div([cur_lyric, next_lyric], {'class' : 'lyrics'})
    ], {'class' : 'music_player'})
]], {'style' : 'min-height: 100px'});
append_elem('masthead', music_player);

function change_song() {
    audio.elem.src = `files/musics/${cur_song}.mp3`;
    cover.elem.src = `files/musics/${cur_song}.png`;
    music_name.cover_innerhtml(song_name[cur_song]);
    play_pause.cover_innerhtml('⏸️');
    cur_time.cover_innerhtml('0:00');
    total_time.cover_innerhtml(format_time(audio.elem.duration));
    progress.elem.value = 0;
    cur_lyric.cover_innerhtml('');
    next_lyric.cover_innerhtml('');
    fetch(`files/musics/${cur_song}.lrc`).then(
        response => response.text()
    ).then(
        data => parse_lrc(data)
    );
    audio.elem.addEventListener('loadedmetadata', () => {
        total_time.cover_innerhtml(format_time(audio.elem.duration));
    });
    audio.elem.play();
}

function initialize() {
    cover.elem.classList.remove('hidden');
    music_name.cover_innerhtml(song_name[cur_song]);
    total_time.cover_innerhtml(format_time(audio.elem.duration));
    progress.elem.disabled = false;  // Enable progress bar
    fetch('files/musics/0.lrc').then(response => response.text()).then(data => parse_lrc(data));
    started = true;
}

// Add event listener for play/pause button
play_pause.elem.addEventListener('click', () => {
    if (!started) {
        initialize();
    }
    if (audio.elem.paused) {
        audio.elem.play();
        play_pause.cover_innerhtml('⏸️');
    } 
    else {
        audio.elem.pause();
        play_pause.cover_innerhtml('▶️');
    }
});

// Add event listener for prev song button
prev_song.elem.addEventListener('click', () => {
    if (started) {
        cur_song = (cur_song + song_count - 1) % song_count;
        change_song();
    }
});

// Add event listener for next song button
next_song.elem.addEventListener('click', () => {
    if (started) {
        cur_song = (cur_song + 1) % song_count;
        change_song();
    }
});

function change_song() {
    audio.elem.src = `files/musics/${cur_song}.mp3`;
    cover.elem.src = `files/musics/${cur_song}.png`;
    audio.elem.play();
    music_name.cover_innerhtml(song_name[cur_song]);
    play_pause.cover_innerhtml('⏸️');
    cur_time.cover_innerhtml('0:00');
    total_time.cover_innerhtml(format_time(audio.elem.duration));
    progress.elem.value = 0;
    cur_lyric.cover_innerhtml('');
    next_lyric.cover_innerhtml('');

    fetch(`files/musics/${cur_song}.lrc`).then(response => response.text()).then(data => parse_lrc(data));

    audio.elem.addEventListener('loadedmetadata', () => {
        total_time.cover_innerhtml(format_time(audio.elem.duration));
    });
}

// Add event listener for when the audio ends
audio.elem.addEventListener('ended', () => {
    play_pause.cover_innerhtml('▶️');
});

audio.elem.addEventListener('timeupdate', () => {
    if (!is_seeking && started) {
        const currentTime = audio.elem.currentTime;
        const duration = audio.elem.duration;

        progress.elem.value = (currentTime / duration) * 100;
        cur_time.cover_innerhtml(format_time(currentTime));

        update_lyrics(currentTime);
    }
});

// Add event listener for progress bar input
progress.elem.addEventListener('input', () => {
    if (started) {
        is_seeking = true;
    }
});

// Add event listener for progress bar change
progress.elem.addEventListener('change', () => {
    if (started) {
        let duration = audio.elem.duration;
        let value = progress.elem.value;
        audio.elem.currentTime = (value / 100) * duration;
        is_seeking = false;
    }
});

// Format time to mm:ss
function format_time(time) {
    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Parse LRC lyrics
function parse_lrc(lrc) {
    let lines = lrc.split('\n');
    lyrics = [];

    for (let line of lines) {
        let match = line.match(/\[(\d+):(\d+).(\d+)\](.*)/);
        if (match) {
            let minutes = parseInt(match[1], 10);
            let seconds = parseInt(match[2], 10);
            let milliseconds = parseInt(match[3], 10);
            let text = match[4];
            let time = minutes * 60 + seconds + milliseconds / 100;
            lyrics.push({ time, text });
        }
    }
    
    lyrics.sort((a, b) => a.time - b.time);
}

// Update current and next lyrics based on current time
function update_lyrics(time) {
    let i = 0;
    for (; i < lyrics.length; i++) {
        if (time < lyrics[i].time) {
            break;
        }
    }
    cur_lyric.cover_innerhtml(lyrics[i - 1].text);
    next_lyric.cover_innerhtml(lyrics[i] ? lyrics[i].text : '');
}