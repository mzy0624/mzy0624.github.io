let biography = new Ul([
    `Currently, I am a first-year Ph.D. student in ${getAnchor('njuai')}, and also a member of ${getAnchor('lamda')}, led by Prof. ${getAnchor('zhouzh')}.`,
    `I got my Bachelor of Science (B.Sc.) degree from ${getAnchor('cs')} in June 2023. In the same year, I was admitted to pursue Ph.D. degree in Nanjing University without entrance examination.`,
]);

let interests = new Ul([
    `My research interests include <b>Machine Learning</b> and <b>Data Mining</b>, especially <b>Software Mining</b>.`
]);

let TAs = new Ul([
    new TA('CPL',    ['Teacher: Hengfeng Wei. (<i>2021 Fall, 2022 Fall, 2023 Fall</i>).']),
    new TA('Python', ['Teacher: Ye Tao. (<i>2021 Fall</i>).', 'Teacher: Li Zhang. (<i>2022 Spring, 2022 Fall, 2023 Spring, 2024 Spring</i>).']),
]);

let Skills = new Ul([
    new SH('C',          '2019'),
    new SH('C++',        '2019'),
    new SH('LaTeX',      '2019', [`My first encounter with LaTeX was in ${getAnchor('ps')} class, where homework needs to be done in LaTeX.`/*, 'How do you pronounce LaTeX?'*/]),
    new SH('Vim',        '2020'),
    new SH('Linux',      '2020', [`Especially ${icons('ubuntu')} Ubuntu (installation, use and repair).`, `"Linux" should be pronounced as /'liniks/ or /'linэks/.`]),
    new SH('Python',     '2021'),
    new SH('Octave',     '2021', [`Think of it as a shrunken version of ${icons('matlab')} MATLAB.`]),
    new SH('HTML',       '2023', [`With a little ${icons('CSS')} CSS.`]),
    new SH('JavaScript', '2023'),
    new SH('Java',       '2023'),
]);

let Hobbies = new Ul([
    new SH('Table Tennis', 'primary school', [
        `Favorite player: <big>${icons('China')}</big> Ma Long.`,
        'Play Style: Right-hand, Handshake Grip, Offensive.',
        new Expand('Racket Configurations', [
            `Blade: ${getAnchor('fzd')}.<br>
             Rubber: ${getAnchor('neo')} (Forehand); ${getAnchor('d09c')} (Backhand).`,
            `Previously used: ${getAnchor('5X')}, ${getAnchor('yinhe')}.`,
        ]),
        // 裁判
        // 2021 南大教职工比赛 (2021.11.26) 2022 南大教职工比赛 (2022.12) 2023 南大教职工比赛 (2023.12.10)
        // 2022 南大化院师生联谊赛 (2022.11.19) 2023 南大化院校友杯 (2023.12.02) 2022 南大计科化院联谊赛 (2022.12.17) 2023 南大文院新传师生联谊赛 (2023.05)
        // 2023 南大杯-南京企事业、机关联谊赛 (2023.11.11~12)
    ]),
    new SH('Singing', 'junior high school', [`Favorites: Jay Chou, JJ Lin, Jason Zhang, BEYOND, Eason Chan, Taylor Swift, ...`]),
    new SH('Body Building', 'senior high school'), // Pull-Up: PB 18 (Nov 25, 2022), Push-Up: PB 80 (Aug 24, 2023), Dips: PB 25 (April 13, 2023).
    new SH('Running', '2022', ['1km: PB 3m16s (Jan 12, 2024).', '10km: PB 44m43s (Aug 7, 2023).']),
]);

let lab     = `<address>${getAnchor('lab')} 810, Jingwen Student Activity Center, Nanjing University Xianlin Campus.</address>`;
let address = `<address>Zi-Yu Mao<br>
               State Key Laboratory for Novel Software Technology,<br>
               Nanjing University Xianlin Campus Mailbox 603,<br>
               163 Xianlin Avenue, Qixia District, Nanjing 210023, China.</address>`;
               
let correspondence = new Ul([
    ['Laboratory', lab],
    ['Mail Address', address]
].map(item => `<strong>${item[0]}</strong><br><small>${item[1]}</small>`));

let remarks = {
    'Awards and Honors':  'During Ph.D.',
    'Skills and Hobbies': 'Little of each but not much',
}

let main_items = {
    'About Me':             biography,
    'Research Interests':   interests,
    'Publications':         new Ul(['QAQ']),
    // 'Awards and Honors':    new Ul(['QAQ']),
    'Teaching Assistants':  TAs,
    'Skills and Hobbies':   new Table([[
                                [Skills,  {'style' : {'vertical-align' : 'top'}}],
                                [Hobbies, {'style' : {'vertical-align' : 'top'}}]
                            ]]),
    'Correspondence':       correspondence
}

let avatar = new Div(
    new Img('./images/avatar.png', {'width' : '250'}),
    {'style' : 'position: relative;'}
);

let socials = new Small([
    getAnchor('github',   {'style' : {'text-decoration' : 'none'}, 'title' : 'GitHub'}),
    getAnchor('zhihu',    {'style' : {'text-decoration' : 'none'}, 'title' : 'Zhihu'}),
    getAnchor('bilibili', {'style' : {'text-decoration' : 'none'}, 'title' : 'Bilibili'}),
    getAnchor('ins',      {'style' : {'text-decoration' : 'none'}, 'title' : 'Instagram'})
]);

let lamda_nju = new Div([getAnchor('lamdalogo'), new Br(), getAnchor('njulogo')]);

let information = new Div([
    new Head(['Zi-Yu Mao (毛子钰)&nbsp;', socials]),
    new Div([
        `Ph.D. Student<br>
        ${getAnchor('lamda')}<br>
        ${getAnchor('ai')}<br>
        ${getAnchor('skl')}<br>
        ${getAnchor('nju')}<br><br>
        ${getAnchor('lamdamail')}<br>
        ${getAnchor('smail')}<br>
        ${getAnchor('gmail')}`,
    ]),
    new Head(`Supervisor: Prof. ${getAnchor('lim')}`, 2)
]);


let information_table = new Table([[
    avatar,
    [information, {'style' : {'padding' : '0 2em'}}],
    lamda_nju
]]);

append_elem('information', information_table);

let page_items = document.getElementById('page_content');
for (let item in main_items)
{
    let head = `${icons(item)} ${item}`;
    if (item in remarks) {
        head += ` <small>(${remarks[item]})</small>`;
    }
    append_elem('page_content', new Div([new Head(head), main_items[item]]));
}
