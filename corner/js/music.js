let music_names  = [
    '七里香 - 周杰伦', 
    '晴天 - 周杰伦', 
    '海阔天空 - BEYOND', 
    '光辉岁月 - BEYOND', 
    '愿与愁 - 林俊杰', 
    '交换余生 - 林俊杰'
];
let music_count  = music_names.length;
let shuffled     = random_permutation(music_count);
let cur_mode     = 0;
let cur_music    = 0;
let init         = false;
let audio        = new BaseElement('audio');
let cover        = new Img('',                   {'class' : 'cover', 'style' : {'width' : '95px', 'border-radius' : '50%'}});
let music_name   = new Small('点击播放歌曲');
let play_mode    = new Button('🔁',              {'style' : {'background' : 'transparent', 'border' : 'none'}});
let prev_music   = new Button('⏪',              {'style' : {'background' : 'transparent', 'border' : 'none'}});
let play_pause   = new Button('▶️',               {'style' : {'background' : 'transparent', 'border' : 'none'}});
let next_music   = new Button('⏩',              {'style' : {'background' : 'transparent', 'border' : 'none'}});
let music_list   = new Button('🔽',              {'style' : {'background' : 'transparent', 'border' : 'none'}});
let selector     = new Div('',                   {'class' : 'music_selector'});
let progress     = new BaseElement('input', '',  { 'type' : 'range', 'value' : '0', 'disabled' : 'true'});
let cur_time     = new Span('0:00',              {'style' : {'font-size' : '14px', 'margin-right' : '2px'}});
let total_time   = new Span('0:00',              {'style' : {'font-size' : '14px', 'margin-left' : '2px'}});
let cur_lyric    = new Para('',                  {'style' : {'margin' : '0 10px', 'font-size' : '10px'}});
let next_lyric   = new Para('',                  {'style' : {'margin' : '0 10px', 'font-size' : '10px', 'color' : '#9c9c9c'}});
let is_seeking   = false;
let lyrics       = [];

append_elem('masthead', new Table([[
    cover, new Div([
        audio, music_name,
        new Div([play_mode, prev_music, play_pause, next_music, music_list, selector], {'style' : {'margin-top' : '-6px'}}),
        new Div([cur_time, progress, total_time],                                      {'class' : 'music_controller'}),
        new Div([cur_lyric, next_lyric],                                               {'class' : 'lyrics'})
    ], {'class' : 'music_player'})
]], {'style' : {'min-width' : '100px', 'min-height' : '105px', 'user-select' : 'none'}}));

audio = audio.elem;
cover = cover.elem;
progress = progress.elem;

for (let i = 0; i < music_count; i++) {
    let music_line = new Div(music_names[i], {'class' : 'music_line'});
    music_line.add_event_listener('click', () => {
        cur_music = i;
        music_list.click();
        if (!init) {
            initialize();
        }
        else {
            change_music(cur_music);
        }
    });
    selector.append(music_line);
}

function initialize() {
    change_music(cur_music);
    cover.classList.remove('cover');
    cover.classList.add('rotate');
    progress.disabled = false;  // Enable progress bar
    play_pause.cover_innerhtml('⏸️');
    init = true;
}

function change_music(music) {
    // update audio
    audio.src = `files/musics/${music}.mp3`;
    audio.play();
    
    music_name.cover_innerhtml(music_names[music]);
    cover.src = `files/musics/${music}.png`;
    cur_time.cover_innerhtml('0:00');
    progress.value = 0;
    cover.classList.remove('rotate');
    
    setTimeout(() => {      // A small timeout is needed
        cur_lyric.cover_innerhtml('正在加载歌曲...');
        next_lyric.cover_innerhtml('');
        cover.classList.add('rotate');
    }, 1);
    fetch(`files/musics/${music}.lrc`).then(response => response.text()).then(data => parse_lrc(data));
}

// Add event listener for mode button
play_mode.add_event_listener('click', () => {
    cur_mode = (cur_mode + 1) % 3;
    let mode_list = ['🔁', '🔀', '🔂']; // Don't use '🔁🔀🔂'
    play_mode.cover_innerhtml(mode_list[cur_mode]);
});

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
        if (cur_mode == 1) {
            cur_music = find_index(shuffled, cur_music);
            cur_music = (cur_music + music_count - 1) % music_count;
            cur_music = shuffled[cur_music];
        }
        else {
            cur_music = (cur_music + music_count - 1) % music_count;
        }
        change_music(cur_music);
    }
});

// Add event listener for next music button
next_music.add_event_listener('click', () => {
    if (init) {
        if (cur_mode == 1) {
            cur_music = find_index(shuffled, cur_music);
            cur_music = (cur_music + 1) % music_count;
            cur_music = shuffled[cur_music];
        }
        else {
            cur_music = (cur_music + 1) % music_count;
        }
        change_music(cur_music);
    }
});

music_list.add_event_listener('click', () => {
    let display = get_style_for_element(selector, 'display');
    if (display == 'none' || display == '') {
        set_style_for_element(selector, {'display' : 'block'});
        music_list.cover_innerhtml('🔼');
    }
    else {
        set_style_for_element(selector, {'display' : 'none'});
        music_list.cover_innerhtml('🔽');
    }
});

// Add event listener for play event
audio.addEventListener('play',  () => { cover.style.animationPlayState = 'running'; });

audio.addEventListener('pause', () => { cover.style.animationPlayState = 'paused';  });

// Add event listener for when the audio ends
audio.addEventListener('ended', () => {
    if (cur_mode == 2) {
        change_music(cur_music);
    }
    else {
        next_music.click();
    }
});

audio.addEventListener('timeupdate', () => { 
    if (!is_seeking && init) {
        const currentTime = audio.currentTime;
        const duration = audio.duration;
        progress.value = (currentTime / duration) * 100;
        cur_time.cover_innerhtml(format_time(currentTime));
        update_lyrics(currentTime);
    }
});

audio.addEventListener('loadedmetadata', () => {
    total_time.cover_innerhtml(format_time(audio.duration));
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

// *************** Helper functions *******************
// Find the index of n in array
function find_index(array, n) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] == n) {
            return i;
        }
    }
    return -1;
}

// Generate a random permutation from 0 to n - 1
function random_permutation(n) {
    let array = Array.from({length : n}, (_, index) => index);
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

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