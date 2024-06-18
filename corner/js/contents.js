let avatar = new Img('./files/avatar.png', [['class', 'avatar']]);
let tooltip = new BaseElement('button', [['class', 'tooltip-btn']]);
tooltip.append('❓');
let meaning = new BaseElement('span', [['class', 'tooltip-text']]);
meaning.append('因为到哪都喜欢呆在没人的角落');
tooltip.elem.addEventListener('mouseenter', function() { setAttributesForElement(meaning, {'style' : 'visibility: visible;'}); });
tooltip.elem.addEventListener('mouseleave', function() { setAttributesForElement(meaning, {'style' : 'visibility: hidden;'});  });

let masthead = new Div([
    new Head(['Haibara AI 的角落', tooltip, meaning]),
    new Small('记录一些乱七八糟的东西，什么都写，入口不是那么明显，你居然能找到这里 o(￣▽￣)=b')
], [['style', 'padding-left: 1em']]);

append_elem('masthead', new Table([[avatar, masthead]]));

fetch('articles/top.txt').then(
    response => response.text()
).then(data => {
    let title = new Head('🔝 置顶简介');
    let contents = new Ul(data.split('\n'));
    let button = new BaseElement('button', [['class', 'readmore'], ['onclick', 'open_popup("full-top")']]);
    button.append('详细介绍 >');
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

for (let item in titles) {
    fetch(`articles/${item}.json`).then(
        response => response.json()
    ).then(data => {
        let head    = new Head(titles[item]);
        let article = new Ul(data.map(article_json_parser));
        let count   = new Small(data.length, [['class', 'article_count']]);
        let button  = new BaseElement('button', [['class', 'showall']]);
        button.append('查看全部 > ');
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
        append_elem(item, head, article, count, button, new Hr());
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