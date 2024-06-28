let lyrics_list = {
    0:   "词：方文山",
    13:  "曲：周杰伦",
    20:  "编曲：钟兴民",
    28:  "窗外的麻雀 在电线杆上多嘴",
    35:  "你说这一句 很有夏天的感觉",
    41:  "手中的铅笔 在纸上来来回回",
    48:  "我用几行字 形容你是我的谁",
    54:  "秋刀鱼的滋味 猫跟你都想了解",
    62:  "初恋的香味就这样被我们寻回",
    68:  "那温暖的阳光 像刚摘的鲜艳草莓",
    74:  "你说你舍不得吃掉这一种感觉",
    81:  "雨下整夜 我的爱溢出就像雨水",
    88:  "院子落叶 跟我的思念厚厚一叠",
    95:  "几句是非 也无法将我的热情冷却",
    102: "你出现在我诗的每一页",
    108: "雨下整夜 我的爱溢出就像雨水",
    115: "窗台蝴蝶 像诗里纷飞的美丽章节",
    122: "我接着写 把永远爱你写进诗的结尾",
    129: "你是我唯一想要的了解",
    162: "雨下整夜 我的爱溢出就像雨水",
    169: "院子落叶 跟我的思念厚厚一叠",
    175: "几句是非 也无法将我的热情冷却",
    183: "你出现在我诗的每一页",
    189: "那饱满 的稻穗",
    193: "幸福了这个季节",
    197: "而你的脸颊像田里熟透的番茄",
    203: "你突然 对我说",
    206: "七里香的名字很美",
    210: "我此刻却只想亲吻你倔强的嘴",
    216: "雨下整夜 我的爱溢出就像雨水",
    223: "院子落叶 跟我的思念厚厚一叠",
    230: "几句是非 也无法将我的热情冷却",
    237: "你出现在我诗的每一页",
    244: "整夜 我的爱溢出就像雨水",
    250: "窗台蝴蝶 像诗里纷飞的美丽章节",
    257: "我接着写 把永远爱你写进诗的结尾",
    264: "你是我唯一想要的了解"
};

let started = false;
let audio = new BaseElement('audio', '', [['src', 'files/music.mp3']]);
let music_name = new Small('');
let play_pause_button = new Button('▶️', [['style', 'background: transparent; border: none']]);
let progress = new BaseElement('input', '', [['type', 'range'], ['disabled', 'true'], ['value', '0']]);
let cur_time = new BaseElement('span', '0:00',   [['style', 'font-size: 14px; margin-right: 2px']]);
let total_time = new BaseElement('span', '0:00', [['style', 'font-size: 14px; margin-left:  2px']])
let cur_lyric  = new Para('', [['style', 'margin: 0 10px; font-size: 10px']]);
let next_lyric = new Para('', [['style', 'margin: 0 10px; font-size: 10px']]);

let music_player = new Div([
    audio, music_name,
    new Div([play_pause_button, cur_time, progress, total_time], [['class', 'music_controller']]),
    new Div([cur_lyric, next_lyric], [['class', 'lyrics']]),
], [['class', 'music_player']])
append_elem('masthead', music_player);

let is_seeking = false;
play_pause_button.elem.addEventListener('click', () => {
    if (started == false) {
        music_name.cover_innerhtml('七里香 - 周杰伦');
        total_time.cover_innerhtml(format_time(audio.elem.duration));
        started = true;
        progress.elem.disabled = false;
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
    if (is_seeking == false && started) {
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

function get_lyrics(time) {
    let currentLyric = '';
    let nextLyric = '';
    const lyricTimes = Object.keys(lyrics_list).map(Number);

    for (let i = 0; i < lyricTimes.length; i++) {
        if (time >= lyricTimes[i]) {
            currentLyric = lyrics_list[lyricTimes[i]];
            nextLyric = lyrics_list[lyricTimes[i + 1]] || '';
        } 
        else {
            break;
        }
    }

    return { currentLyric, nextLyric };
}
