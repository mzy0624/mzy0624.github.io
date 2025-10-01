function social_media(src) {
    let icon = new Button(
        URLs[src][0],
        {
            'class' : ['button', 'no-border'],
            'onclick' : `window.open('${URLs[src][1]}')`,
            'style' : {
                'border' : 'none',
                'background' : 'inherit'
            }
        }
    );
    return icon;
}

function logo_image(name, url, id='') {
    let logo = new Img(`./images/${name}.png`, {'id': id});
    let anchor = new Anchor(url, logo);
    return anchor;
}

const logos = [
    [new Img('./images/lamda.png'), 'https://www.lamda.nju.edu.cn/CH.MainPage.ashx'],
    [new Img('./images/njuai.png'), 'https://ai.nju.edu.cn/'],
    [new Img('./images/nju.png'),   'https://www.nju.edu.cn']
];
const name_img = new Img('./images/name-light.png', {'class' : 'name'});

append_elem('page', new Div([
    new Img('./images/avatar.png', {'class' : ['avatar', 'thumbnail'], 'onclick' : `enlarge_img('images/avatar.png')`}),
    new Div([
        new Head(['Zi-Yu Mao', name_img]),
        new Div([
            new Span([
                '🧑‍🎓 Ph.D. Student ',
                social_media('github'),
                social_media('zhihu'),
                social_media('bilibili'),
                social_media('ins')
            ]),                       new Br(),
            getAnchor('lamda'),       new Br(),
            getAnchor('ai'),          new Br(),
            getAnchor('skl'),         new Br(),
            getAnchor('nju')
        ], {'style' : {'margin' : '0.6vw 0 1vw 0'}}),
        new Div([
            getAnchor('lamdamail'),   new Br(),
            getAnchor('smail'),       new Br(),
            getAnchor('gmail')
        ], {'style' : {'margin' : '0 0 1vw 0'}}),
        new Head(`Supervisor: Professor ${getAnchor('lim')}`, 3)
    ], {'class' : 'icontent'}),
    new Div(logos.map(logo => new Anchor(logo[1], logo[0])), {'class' : 'logos'}),
], {'class' : 'flex-information'}));

append_elem('page', new Div([
    new Head('🪪 About Me'),
    new Para(`I am a third-year Ph.D. student in the ${getAnchor('njuai')}, and a member of ${getAnchor('lamda')}, led by Professor ${getAnchor('zhouzh')}.`, {'style' : {'margin' : '0'}}),
    new Para(`I got my Bachelor of Science (B.Sc.) degree from ${getAnchor('cs')} in June 2023. In the same year, I was admitted to pursue Ph.D. degree in Nanjing University without entrance examination.`, {'style' : {'margin' : '0'}}),
    new Para('My research interests include <b>Machine Learning</b> and <b>Data Mining</b>, especially <b>Learnware Paradigm</b>.', {'style' : {'margin' : '0'}})
], {'class' : 'column'}));