let information = {
    'study' : { 'title' : '📚 学习科研' },
    'life'  : { 'title' : '🕒 生活 P 事'},
    'tech'  : { 'title' : '🛠️ 技术相关'},
    'mood'  : { 'title' : '🤔 心情随想'},
    'hobby' : { 'title' : '🧩 兴趣爱好'}
}
let article_per_page = 5;

function article_json_parser(json) {
    // date
    let date  = new Div(json.date, {'class' : 'date'});

    // title
    let title_content = json.title;
    if ("publish" in json) {    // then "link" in json
        // paper
        let link = json.link;
        let publish = json.publish;
        let rank = '';
        if (publish != "Preprint") {
            rank = 'CCFNONE';
            if (publish.includes(',')) {
                // NAME YEAR, CCF RANK
                rank = `CCF${publish[publish.length - 1]}`;
            }
        }
        publish = `<span class="Paper ${rank}">${publish}</span><br>`
        title_content = `📝 论文 <a href="${link}" target="_blank">${title_content}</a> 阅读笔记`;
        let title_with_publish = `${title_content} ${publish}`;
        title = new Div(title_with_publish, {'class' : 'title'});
    }
    else {
        title = new Div(title_content, {'class' : 'title'});
    }

    // content
    let content = new Div(json.content, {'class' : 'article'});
    execute_scripts_sync(content.elem);

    // article
    let article = [date, title, content];

    // button
    if ("link" in json && !("publish" in json)) {
        article.push(new Button(
            new Anchor(json.link, '跳转链接 >'),
            {'class' : 'readmore'}
        ));
    }
    if ("file" in json) {
        article.push(readmore_button(
            json.file,
            new Head(new Div(title_content, {'class' : 'title'})),
            new Small(new Div(json.date, {'class' : 'date'}))
        ));
    }
    return new Li(article);
}

async function process_articles(data, articles) {
    for (let i = 0; i < data.length; i++) {
        let article = article_json_parser(data[i]);
        if (i >= article_per_page) {
            article.add_class('hidden');
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
    info['page_count'] = Math.ceil(data.length / article_per_page);
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
        for (let i = 1; i <= article_per_page; i++) {
            try {
                let article = articles.querySelector(`li:nth-child(${i + (cur_page - 1) * article_per_page})`);
                article.classList.add('hidden');
            }
            catch (e) {}
            try {
                let article = articles.querySelector(`li:nth-child(${i + (page - 1) * article_per_page})`);
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
        first.add_event_listener('click', function() { show_page(item, 1); });
        prev.add_event_listener('click', function() { prev_page(item); });
        next.add_event_listener('click', function() { next_page(item); });
        last.add_event_listener('click', function() { show_page(item, -1); });
        append_elem(`${item}-title`, first, prev, cur_page, page_count, article_count, next, last);
    }

    // Large Images
    document.querySelectorAll('.large_image').forEach(span => {
        let button = new Button('查看大图', {'class' : 'readmore'});
        let img = new Div(
            new Img(span.id, {'width' : '65%'}),
            {
                'class' : 'image-container', 
                'style' : {
                    'display' : 'none', 
                    'text-align' : 'center'
                }
            }
        );
        button.add_event_listener('click', function() {
            let display = get_style_for_element(img, 'display');
            if (display == 'none' || display == '') {
                set_style_for_element(img, {'display' : 'block'});
                button.cover_innerhtml('收起');
            }
            else {
                set_style_for_element(img, {'display' : 'none'});
                button.cover_innerhtml('查看大图');
            }
        });
        append_elem(span, button, img);
    });
}

main();
