let skills_and_hobbies = [
    ['C',   '2019'],
    ['C++', '2019'],
    ['LaTeX', '2019'], //`My first encounter with LaTeX was in ${getAnchor('ps')} class, where homework needs to be done in LaTeX.`],
    ['Vim', '2020'],
    ['Linux', '2020', `Especially Ubuntu.`],
    ['Python', '2021'],
    ['HTML', '2023'],
    ['JavaScript', '2023'],
    ['Java', '2023'],
    ['Table Tennis', 'Primary School', new Ul([
        'Playing Style: Right-hand, Handshake Grip, Offensive.',
        'Favorite players: Ma Long, Fan Zhendong, Zhang Jike.',
        new Div([
            'Racket Configurations',
            new Ul([
                `Blade: ${getAnchor('fzd')}.<br>
                 Rubber: ${getAnchor('neo')} (Forehand); ${getAnchor('d09c')} (Backhand).`,
                `Previously used: ${getAnchor('5X')}, ${getAnchor('yinhe')}.`
            ])
        ]),
    ])],
    ['Singing', '2014', 'Favorites: Jay Chou, JJ Lin, Jason Zhang, BEYOND, Eason Chan, Taylor Swift, ...'],
    ['Body Building', '2018'],
    ['Running', '2022', new Ul([
        '1km:  PB 3m16s (2024-01-12).',
        '10km: PB 44m43s (2023-08-07).',
        'Recovering from knee injury (2024-07)'
    ])],
    ['Card Magic', '2023']
];

let skills_and_hobbies_div = new Div(
    [
        new Head('🪄 Skills and Hobbies'),
        new Div(skills_and_hobbies.map(SH => new SHItem(...SH)), {'class' : ['basic-items', 'SHs']})
    ],
    {'class' : 'column'}
);

append_elem('page', skills_and_hobbies_div);

