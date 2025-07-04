let theme_button = new Img('./icons/dark.svg',
    {
        'class' : 'icon',
        'style' : {
            'float' : 'right',
            'pointer-events': 'auto'
        }
    }
);
theme_button.addEventListener('click', () => {
    let theme_link = new BaseElement('id: theme-style');
    let cur_theme = get_attribute(theme_link, 'href');

    if (cur_theme == 'styles/light.css') {
        logos[0][0].update_src('./images/lamda-dark.png');
        logos[2][0].update_src('./images/nju-dark.png');
        set_attributes(theme_link, {'href' : 'styles/dark.css'});
        theme_button.update_src('./icons/light.svg');
    }
    else {
        logos[0][0].update_src('./images/lamda.png');
        logos[2][0].update_src('./images/nju.png');
        set_attributes(theme_link, {'href' : 'styles/light.css'});
        theme_button.update_src('./icons/dark.svg');
    }
});
append_elem('masthead', theme_button);