let started = false;
let audio = new BaseElement('audio', '', {'src' : 'files/music.mp3'});
let music_name = new Small('点击播放音乐');
let play_pause_button = new Button('▶️', {'style' : 'background: transparent; border: none'});
let progress = new BaseElement('input', '', {'type' : 'range', 'value' : '0', 'disabled' : 'true'});
let cur_time = new BaseElement('span', '0:00', {'style' : ['font-size: 14px', 'margin-right: 2px']});
let total_time = new BaseElement('span', '0:00', {'style' : ['font-size: 14px', 'margin-left: 2px']});
let cur_lyric = new Para('', {'style' : ['margin: 0 10px', 'font-size: 10px']});
let next_lyric = new Para('', {'style' : ['margin: 0 10px', 'font-size: 10px', 'color: #9c9c9c;']});

let music_player = new Div([
    audio, new Div([music_name, play_pause_button]),
    new Div([cur_time, progress, total_time], {'class' : 'music_controller'}),
    new Div([cur_lyric, next_lyric], {'class' : 'lyrics'}),
], {'class' : 'music_player'});
append_elem('masthead', music_player);

let is_seeking = false;
let lyrics = [];

fetch('files/lyrics.lrc').then(
    response => response.text()
).then(data => {
    lyrics = parse_lrc(data);
});

play_pause_button.elem.addEventListener('click', () => {
    if (!started) {
        music_name.cover_innerhtml('七里香 - 周杰伦');
        total_time.cover_innerhtml(format_time(audio.elem.duration));
        started = true;
        progress.elem.disabled = false;  // Enable progress bar
    }
    if (audio.elem.paused) {
        audio.elem.play();
        play_pause_button.cover_innerhtml('⏸️');
    } 
    else {
        audio.elem.pause();
        play_pause_button.cover_innerhtml('▶️');
    }
});

audio.elem.addEventListener('timeupdate', () => {
    if (!is_seeking && started) {
        const currentTime = audio.elem.currentTime;
        const duration = audio.elem.duration;

        progress.elem.value = (currentTime / duration) * 100;
        cur_time.cover_innerhtml(format_time(currentTime));

        const { currentLyric, nextLyric } = get_lyrics(currentTime);
        cur_lyric.cover_innerhtml(currentLyric);
        next_lyric.cover_innerhtml(nextLyric);
    }
});

progress.elem.addEventListener('input', () => {
    if (started) {
        is_seeking = true;
    }
});

progress.elem.addEventListener('change', () => {
    if (started) {
        let duration = audio.elem.duration;
        let value = progress.elem.value;
        audio.elem.currentTime = (value / 100) * duration;
        is_seeking = false;
    }
});

function format_time(time) {
    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function parse_lrc(lrc) {
    let lines = lrc.split('\n');
    let lyrics = [];

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

    return lyrics.sort((a, b) => a.time - b.time);
}

function get_lyrics(time) {
    let currentLyric = '';
    let nextLyric = '';

    for (let i = 0; i < lyrics.length; i++) {
        if (time >= lyrics[i].time) {
            currentLyric = lyrics[i].text;
            nextLyric = lyrics[i + 1] ? lyrics[i + 1].text : '';
        } else {
            break;
        }
    }

    return { currentLyric, nextLyric };
}
