let TAs = [
    ['C',                    'Hengfeng Wei', ['2021 Fall', '2022 Fall', '2023 Fall']],
    ['Python',               'Ye Tao',       ['2021 Fall']],
    ['Python',               'Li Zhang',     ['2022 Spring', '2022 Fall', '2023 Spring', '2024 Spring']],
    ['Programming Training', 'Zhen Wu',      ['2024 Summer']]
];

let TAs_div = new Div([
    new Head('🧑‍🏫 Teaching Assistants', 2),
    new Div(TAs.map(TA => new TAItem(...TA)), {'class' : ['basic-items', 'TAs']})
], {'class' : ['column', 'sub-column']});

let Volunteers = [
    [
        '🏓 Table Tennis Umpires', [
            'NJU Staff Table Tennis Competition (2021, 2022, 2023, 2024)',                          // 南大教职工乒乓球比赛 (2021.11.26, 2022.12, 2023.12.10, 2024-11-30)
            'NJU Chem. Staff Table Tennis Competition (2022, 2023, 2024)',                          // 南大化院教职工乒乓球比赛 (2022.11.19, 2023.12.02, 2024-11-23)
            'NJU C.S. & Chem. Table Tennis Friendship Competition (2022)',                          // 南大计科化院乒乓球联谊赛 (2022.12.17)
            'NJU Lit. & J.C. Table Tennis Friendship Competition (2023)',                           // 南大文院新传乒乓球联谊赛 (2023.05)
            'Nanjing Enterprise & Institution Table Tennis Friendship Competition (2023)'  // 南大杯：南京企事业、机关乒乓球联谊赛 (2023.11.11~12)
        ]
    ],
    [
        '🙋‍♂️ Meeting Volunteers', [
            getAnchor('riken'),
            getAnchor('mla23')
        ]
    ]
];

let Volunteers_div = new Div([
    new Head('🙋‍♂️ Volunteers', 2),
    new Div(Volunteers.map(vol => new VolunteerItem(...vol)), {'class' : ['basic-items', 'Volunteers']})
], {'class' : ['column', 'sub-column']});

let Reviewers = [
    ['AAAI', getAnchor('AAAI2026')],
]

let Reviewers_div = new Div([
    new Head('🧑‍⚖️ Reviewers', 2),
    new Div(Reviewers.map(rev => new ReviewerItem(...rev)), {'class' : ['basic-items', 'Reviewers']})
], {'class' : ['column', 'sub-column']});

append_elem('page', new Div(
    [new Head('⚡ Services'), TAs_div, Volunteers_div, Reviewers_div],
    {'class' : 'column'}
));
