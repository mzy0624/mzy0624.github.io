let theme_button = new Img('./icons/dark.svg', {
    'class' : 'icon',
    'style' : {
        'float' : 'right',
        'pointer-events': 'auto'
    }
});

theme_button.addEventListener('click', () => {
    const html = document.documentElement;
    const is_dark = html.getAttribute('data-theme') === 'dark';
    name_img.update_src(is_dark ? './images/name_light.png' : './images/name_dark.png');
    logos[0][0].update_src(is_dark ? './images/lamda.png' : './images/lamda-dark.png');
    logos[2][0].update_src(is_dark ? './images/nju.png' : './images/nju-dark.png');
    theme_button.update_src(is_dark ? './icons/dark.svg' : './icons/light.svg');
    html.setAttribute('data-theme', is_dark ? 'light' : 'dark');
});
append_elem('masthead', theme_button);
