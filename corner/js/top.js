fetch('articles/top.txt').then(
    response => response.text()
).then(data => {
    let title = new Head('🔝 置顶简介');
    let contents = new Ul(data.split('\n'));
    let button = new Button('详细介绍 >', {'class' : 'readmore', 'onclick' : 'open_popup("full-top")'});
    full_article(
        'full-top',
        new Head(new Div('🪪 详细介绍', {'class' : 'title'})),
        new Small(new Div('2099.12.31',  {'class' : 'date'}))
    );
    append_elem('top', title, contents, button, new Hr());
});