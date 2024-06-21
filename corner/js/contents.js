let avatar  = new Img('./files/avatar.png', [['class', 'avatar']]);
let tooltip = new Button('❓', [['class', 'tooltip-btn']]);
let meaning = new BaseElement('span', '因为到哪都喜欢呆在没人的角落', [['class', 'tooltip-text']]);
tooltip.elem.addEventListener('mouseenter', function() { setAttributesForElement(meaning, {'style' : 'visibility: visible;'}); });
tooltip.elem.addEventListener('mouseleave', function() { setAttributesForElement(meaning, {'style' : 'visibility: hidden;'});  });
let masthead_left = new Div([
    avatar, 
    new Div([
        new Head(['Haibara AI 的角落', tooltip, meaning]),
        new Small('记录一些乱七八糟的东西，你居然能找到这里 o(￣▽￣)=b')
    ], [['style', 'padding-left: 1em']])
], [['class', 'masthead-left']]);
append_elem('masthead', masthead_left);

// masthead_right is in 'music.js'

fetch('articles/top.txt').then(
    response => response.text()
).then(data => {
    let title = new Head('🔝 置顶简介');
    let contents = new Ul(data.split('\n'));
    let button = new Button('详细介绍 >', [['class', 'readmore'], ['onclick', 'open_popup("full-top")']]);
    full_article(
        'full-top',
        new Head(new Div('🪪 详细介绍', [['class', 'title']])),
        new Small(new Div('2099.12.31',  [['class', 'date']]))
    );
    append_elem('top', title, contents, button, new Hr());
});

let titles = {
    'study'   : '📚 学习科研',
    'life'    : '🕒 生活 P 事',
    'tech'    : '🛠️ 技术相关',
    'mood'    : '🤔 心情随想',
    'hobbies' : '🧩 兴趣爱好',
};

document.addEventListener('DOMContentLoaded', function() {
    MathJax.startup.promise.then(() => {
        MathJax.typeset();
    });
});

for (let item in titles) {
    fetch(`articles/${item}.json`).then(
        response => response.json()
    ).then(data => {
        let head    = new Head(titles[item]);
        let article = new Ul(data.map(article_json_parser));
        let count   = new Small(data.length, [['class', 'article_count']]);
        let button  = new Button('查看全部 > ', [['class', 'showall']]);
        button.elem.addEventListener('click', function() {
            const divs = this.parentElement;
            const ul = divs.querySelector('ul');
            if (this.textContent[0] === '查') {
                ul.querySelectorAll('li').forEach(li => li.style.display = 'list-item');
                this.textContent = '返回首页';
                other_divs_display(divs.id, 'none');
            } 
            else {
                ul.querySelectorAll('li:nth-child(n+6)').forEach(li => li.style.display = 'none');
                this.textContent = '查看全部 >';
                other_divs_display(divs.id, 'block');
            }
            scroll_to_top();
        });
        let _item = append_elem(item, head, article, count, button, new Hr());
        MathJax.typesetPromise([_item]);    // Process MathJax manually
    });
}

// only for large images that in json files
setTimeout(function () { 
    Array.from(
        document.getElementsByClassName('large_image')
    ).forEach(
        span => add_large_image(span, span.id)
    ); 
}, 1000);