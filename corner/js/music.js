let music_names  = ['七里香 - 周杰伦', '海阔天空 - BEYOND', '愿与愁 - 林俊杰'];
let music_count  = music_names.length;
let cur_music    = 0;
let init         = false;
let audio        = new BaseElement('audio');
let cover        = new Img('',                   {'class' : 'cover', 'style' : ['width: 95px', 'border-radius: 50%']});
let music_name   = new Small('点击播放音乐');
let prev_music   = new Button('⏪',              {'style' : 'background: transparent; border: none'})
let play_pause   = new Button('▶️',               {'style' : 'background: transparent; border: none'});
let next_music   = new Button('⏩',              {'style' : 'background: transparent; border: none'});
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
        new Div([prev_music, play_pause, next_music], {'style' : 'margin-top: -6px'}),
        new Div([cur_time, progress, total_time], {'class' : 'music_controller'}),
        new Div([cur_lyric, next_lyric], {'class' : 'lyrics'})
    ], {'class' : 'music_player'})
]], {'style' : ['min-width: 100px', 'min-height: 105px']});
append_elem('masthead', music_player);

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
    cur_lyric.cover_innerhtml(i ? lyrics[i - 1].text : '');
    next_lyric.cover_innerhtml(lyrics[i] ? lyrics[i].text : '');
}

function initialize() {
    change_music();
    // audio.elem.src = 'files/musics/0.mp3';
    // cover.elem.src = 'files/musics/0.png';
    cover.remove_class('cover');
    cover.add_class('rotate');
    cur_lyric.cover_innerhtml('正在加载歌曲 ...');
    // music_name.cover_innerhtml(music_names[cur_music]);
    // total_time.cover_innerhtml(format_time(audio.elem.duration));
    progress.elem.disabled = false;  // Enable progress bar
    // fetch('files/musics/0.lrc').then(response => response.text()).then(data => parse_lrc(data));
    init = true;
}

function change_music() {
    // change audio
    audio.elem.src = `files/musics/${cur_music}.mp3`;
    audio.add_event_listener('loadedmetadata', () => {
        total_time.cover_innerhtml(format_time(audio.elem.duration));
    });
    audio.elem.play();
    // change cover
    cover.elem.src = `files/musics/${cur_music}.png`;
    cover.remove_class('rotate');
    setTimeout(() => { cover.add_class('rotate'); }, 1);   // A small timeout is needed
    // change music name
    music_name.cover_innerhtml(music_names[cur_music]);
    // change play/pause button
    play_pause.cover_innerhtml('⏸️');
    // change times
    cur_time.cover_innerhtml('0:00');
    total_time.cover_innerhtml(format_time(audio.elem.duration));
    // change progress bar
    progress.elem.value = 0;
    // change lyrics
    cur_lyric.cover_innerhtml('');
    next_lyric.cover_innerhtml('');
    fetch(`files/musics/${cur_music}.lrc`).then(response => response.text()).then(data => parse_lrc(data));
}

// Add event listener for play/pause button
play_pause.add_event_listener('click', () => {
    if (!init) {
        initialize();
        return;
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

// Add event listener for prev music button
prev_music.add_event_listener('click', () => {
    if (init) {
        cur_music = (cur_music + music_count - 1) % music_count;
        change_music();
    }
});

// Add event listener for next music button
next_music.add_event_listener('click', () => {
    if (init) {
        cur_music = (cur_music + 1) % music_count;
        change_music();
    }
});

// Add event listener for play event
audio.add_event_listener('play', () => {
    cover.elem.style.animationPlayState = 'running';
});

audio.add_event_listener('pause', () => {
    cover.elem.style.animationPlayState = 'paused';
});

// Add event listener for when the audio ends
audio.add_event_listener('ended', () => {
    next_music.click();
});

audio.add_event_listener('timeupdate', () => {
    if (!is_seeking && init) {
        const currentTime = audio.elem.currentTime;
        const duration = audio.elem.duration;

        progress.elem.value = (currentTime / duration) * 100;
        cur_time.cover_innerhtml(format_time(currentTime));

        update_lyrics(currentTime);
    }
});

// Add event listener for progress bar input
progress.add_event_listener('input', () => {
    if (init) {
        is_seeking = true;
    }
});

// Add event listener for progress bar change
progress.add_event_listener('change', () => {
    if (init) {
        let duration = audio.elem.duration;
        let value = progress.elem.value;
        audio.elem.currentTime = (value / 100) * duration;
        is_seeking = false;
    }
});