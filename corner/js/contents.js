let information = {
    'study' : { 'title' : '📚 学习科研' },
    'life'  : { 'title' : '🕒 生活 P 事'},
    'tech'  : { 'title' : '🛠️ 技术相关'},
    'mood'  : { 'title' : '🤔 心情随想'},
    'hobby' : { 'title' : '🧩 兴趣爱好'}
}

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

async function process_articles(data, articles) {
    for (let i = 0; i < data.length; i++) {
        let article = article_json_parser(data[i]);
        if (i >= 5) {
            article.elem.classList.add('hidden');
        }
        articles.push(article);
    }
}

async function process_item(item) {
    let info = information[item];
    let response = await fetch(`articles/${item}.json`);
    let data = await response.json();
    let title = new Head(info['title'], 1, {'id' : `${item}-title`});
    info['article_count'] = data.length;
    info['page_count'] = Math.ceil(data.length / 5);
    info['cur_page'] = 1;
    let articles = [];
    await process_articles(data, articles);
    await MathJax.typesetPromise([append_elem(item, title, new Ul(articles), new Hr())]);
}

async function fetch_articles() {
    document.addEventListener('DOMContentLoaded', function() {
        MathJax.startup.promise.then(() => {
            MathJax.typeset();
        });
    });
    // Parallel
    const promises = [];
    for (let item in information) {
        promises.push(process_item(item));
    }
    await Promise.all(promises);
}

async function main() {
    await fetch_articles();
    // Pages
    function show_page(item, page) {
        let page_count = information[item]['page_count'];
        if (page == -1) {
            page = page_count;
        }
        if (page < 1 || page > page_count) {
            return;
        }
        let articles = document.querySelector(`#${item} ul`);
        let cur_page = information[item]['cur_page'];
        for (let i = 1; i <= 5; i++) {
            try {
                let article = articles.querySelector(`li:nth-child(${i + (cur_page - 1) * 5})`);
                article.classList.add('hidden');
            }
            catch (e) {}
            try {
                let article = articles.querySelector(`li:nth-child(${i + (page - 1) * 5})`);
                article.classList.remove('hidden');
            }
            catch (e) {}
        }
        let cur_page_div = document.getElementById(`${item}-cur-page`);
        cur_page_div.innerHTML = page;
        information[item]['cur_page'] = page;
    }
    function prev_page(item) {
        let cur_page = information[item]['cur_page'];
        show_page(item, cur_page - 1);
    }
    function next_page(item) {
        let cur_page = information[item]['cur_page'];
        show_page(item, cur_page + 1);
    }
    for (let item in information) {
        let info = information[item];
        let article_count = new Small(info['article_count'], {'class' : 'article_count'});
        let page_count = new Small(info['page_count'], {'class' : 'page_count'});
        let cur_page = new Small(info['cur_page'], {'id' : `${item}-cur-page`, 'class' : 'cur_page'});
        let first = new Button('首页',  {'class' : 'page_button'});
        let prev  = new Button('上一页', {'class' : 'page_button'});
        let next  = new Button('下一页', {'class' : 'page_button'});
        let last  = new Button('末页',  {'class' : 'page_button'});
        first.elem.addEventListener('click', function() { show_page(item, 1); });
        prev.elem.addEventListener('click', function() { prev_page(item); });
        next.elem.addEventListener('click', function() { next_page(item); });
        last.elem.addEventListener('click', function() { show_page(item, -1); });
        append_elem(`${item}-title`, first, prev, cur_page, page_count, article_count, next, last);
    }
    // Large Images
    document.querySelectorAll('.large_image').forEach(span => {
        let button = new Button('查看大图', {'class' : 'readmore'});
        let img = new Div(
            new Img(span.id, {'width' : '65%'}),
            {'class' : 'image-container', 'style' : ['display: none', 'text-align: center']}            
        );
        button.elem.addEventListener('click', function() {
            if (img.elem.style.display === 'none' || img.elem.style.display === '') {
                img.elem.style.display = 'block';
                button.cover_innerhtml('收起');
            }
            else {
                img.elem.style.display = 'none';
                button.cover_innerhtml('查看大图');
            }
        });
        append_elem(span, button, img);
    });
}

main();
