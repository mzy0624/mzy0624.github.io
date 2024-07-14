let music_names  = ['七里香 - 周杰伦', '海阔天空 - BEYOND', '愿与愁 - 林俊杰'];
let music_count  = music_names.length;
let cur_music    = 0;
let init         = false;
let audio        = new BaseElement('audio');
let cover        = new Img('',                   {'class' : 'cover', 'style' : {'width' : '95px', 'border-radius' : '50%'}});
let music_name   = new Small('点击播放音乐');
let prev_music   = new Button('⏪',              {'style' : {'background' : 'transparent', 'border' : 'none'}});
let play_pause   = new Button('▶️',               {'style' : {'background' : 'transparent', 'border' : 'none'}});
let next_music   = new Button('⏩',              {'style' : {'background' : 'transparent', 'border' : 'none'}});
let progress     = new BaseElement('input', '',  { 'type' : 'range', 'value' : '0', 'disabled' : 'true'});
let cur_time     = new Span('0:00',              {'style' : {'font-size' : '14px', 'margin-right' : '2px'}});
let total_time   = new Span('0:00',              {'style' : {'font-size' : '14px', 'margin-left' : '2px'}});
let cur_lyric    = new Para('',                  {'style' : {'margin' : '0 10px', 'font-size' : '10px'}});
let next_lyric   = new Para('',                  {'style' : {'margin' : '0 10px', 'font-size' : '10px', 'color' : '#9c9c9c'}});
let is_seeking   = false;
let lyrics       = [];

let music_player = new Table([[
    cover, new Div([
        audio, music_name,
        new Div([prev_music, play_pause, next_music], {'style' : {'margin-top' : '-6px'}}),
        new Div([cur_time, progress, total_time], {'class' : 'music_controller'}),
        new Div([cur_lyric, next_lyric], {'class' : 'lyrics'})
    ], {'class' : 'music_player'})
]], {'style' : {'min-width' : '100px', 'min-height' : '105px'}});
append_elem('masthead', music_player);

audio = audio.elem;
cover = cover.elem;
progress = progress.elem;

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
    cover.classList.remove('cover');
    cover.classList.add('rotate');
    cur_lyric.cover_innerhtml('正在加载歌曲 ...');
    progress.disabled = false;  // Enable progress bar
    init = true;
}

function change_music() {
    // update audio
    audio.src = `files/musics/${cur_music}.mp3`;
    audio.addEventListener('loadedmetadata', () => {
        total_time.cover_innerhtml(format_time(audio.duration));
    });
    audio.play();
    // update cover
    cover.src = `files/musics/${cur_music}.png`;
    cover.classList.remove('rotate');
    setTimeout(() => { cover.classList.add('rotate'); }, 1);    // A small timeout is needed
    music_name.cover_innerhtml(music_names[cur_music]);         // update music name
    play_pause.cover_innerhtml('⏸️');                           // update play/pause button
    cur_time.cover_innerhtml('0:00');                           // update current time
    total_time.cover_innerhtml(format_time(audio.duration));    // update total time
    progress.value = 0;                                         // reset progress bar
    cur_lyric.cover_innerhtml('');                              // update current lyrics
    next_lyric.cover_innerhtml('');                             // update next lyrics
    fetch(`files/musics/${cur_music}.lrc`).then(response => response.text()).then(data => parse_lrc(data));
}

// Add event listener for play/pause button
play_pause.add_event_listener('click', () => {
    if (!init) {
        initialize();
        return;
    }
    if (audio.paused) {
        audio.play();
        play_pause.cover_innerhtml('⏸️');
    } 
    else {
        audio.pause();
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
audio.addEventListener('play',  () => { cover.style.animationPlayState = 'running'; });

audio.addEventListener('pause', () => { cover.style.animationPlayState = 'paused';  });

// Add event listener for when the audio ends
audio.addEventListener('ended', () => { next_music.click(); });

audio.addEventListener('timeupdate', () => { 
    if (!is_seeking && init) {
        const currentTime = audio.currentTime;
        const duration = audio.duration;

        progress.value = (currentTime / duration) * 100;
        cur_time.cover_innerhtml(format_time(currentTime));

        update_lyrics(currentTime);
    }
});

// Add event listener for progress bar input
progress.addEventListener('input', () => {
    if (init) {
        is_seeking = true;
    }
});

// Add event listener for progress bar change
progress.addEventListener('change', () => {
    if (init) {
        let duration = audio.duration;
        let value = progress.value;
        audio.currentTime = (value / 100) * duration;
        is_seeking = false;
    }
});