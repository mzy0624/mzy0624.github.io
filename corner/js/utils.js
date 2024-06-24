function open_popup(popup_id) {
    document.getElementById(popup_id).style.display = 'flex'; 
}

function close_popup(popup_id) { 
    document.getElementById(popup_id).style.display = 'none'; 
}

function execute_scripts_sync(element) {
    // This function is generated by GPT-4o
    const scripts = Array.from(element.querySelectorAll('script'));
    let promise = Promise.resolve();

    scripts.forEach(script => {
        promise = promise.then(() => {
            return new Promise((resolve, reject) => {
                const new_script = document.createElement('script');
                if (script.src) {
                    new_script.src = script.src;
                    new_script.async = false;
                    new_script.onload = () => {
                        document.body.appendChild(new_script);
                        document.body.removeChild(new_script);
                        resolve();
                    };
                    new_script.onerror = reject;
                } else {
                    new_script.textContent = script.textContent;
                    document.body.appendChild(new_script);
                    document.body.removeChild(new_script);
                    resolve();
                }
            });
        });
    });

    return promise;
}

function full_article(file, title, date) {
    fetch(`articles/${file}.html`).then(
        response => response.text()
    ).then(data => {
        let close = new BaseElement('span', '', [['class', 'close-btn'], ['onclick', `close_popup('${file}')`]]);
        let article = new Div(data, [['class', 'popup-content; full-article']]);
        // let article = new Div(marked.parse(data), [['class', 'popup-content; full-article']]);
        let full = new Div(
            new Div(
                [title, close, date, new Br(), new Hr(), article],
                [['class', 'popup'], ['onclick', 'event.stopPropagation();']]
            ),
            [['class', 'overlay'], ['id', file], ['onclick', `close_popup('${file}')`]]
        );
        append_elem(document.body, full);
        execute_scripts_sync(article.elem).then(() => {
            MathJax.typesetPromise([title.elem, article.elem]); // 手动 typeset 新插入的内容
        });
    });
}


function article_json_parser(json) {
    let date    = new Div(json.date,    [['class', 'date']]);
    let title   = new Div(json.title,   [['class', 'title']]);
    let content = new Div(json.content, [['class', 'article']]);
    // execute_scripts(content.elem);
    execute_scripts_sync(content.elem);
    let article = [date, title, content];
    if ("file" in json) {
        let file = json.file;
        let button_attributes = [['class', 'readmore']];
        let button_content = '阅读全文 >';
        if (file.includes('http')) {    // url
            button_content = new Anchor(file, button_content);
        }
        else {
            let new_title = new Head(new Div(json.title, [['class', 'title']]));
            let new_date  = new Small(new Div(json.date,  [['class', 'date']]));
            full_article(file, new_title, new_date);
            button_attributes.push(['onclick', `open_popup('${file}')`]);
        }
        let button = new Button(button_content, button_attributes);
        article.push(button);
    }
    return article;
}

function other_divs_display(id, display) {
    let other_divs = document.querySelectorAll(`.flexible:not(#${id})`);
    let top_div = document.getElementById('top');
    other_divs.forEach(div => div.style.display = display);
    top_div.style.display = display;
}

function scroll_to_top(time=0.3) {
    let scroll_step = -window.scrollY / (time * 60);
    let scroll_interval = setInterval(
        function(){
            if (window.scrollY != 0) {
                window.scrollBy(0, scroll_step);
            }
            else {
                clearInterval(scroll_interval);
            }
        },
        1000 / 60
    );
}

function add_large_image(target, img) {
    let button = new Button('', [['class', 'readmore']]);
    button.cover_innerhtml('查看大图');
    img = new Div(
        new Img(img, [['width', '65%']]),
        [['class', 'image-container'], ['style', 'display:none; text-align:center']]
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
    append_elem(target, button, img);
}

function render_pseudocode(id, reset=false) {
    let option = { noEnd: true };
    if (reset == true) {
        option['captionCount'] = 0;
    }
    pseudocode.renderElement(document.getElementById(id), option);
}

function create_game_table(U, A=[], name=[], mixed=false, p=[]) {
    // Two players
    U = U.map(u => u.map(String));
    let shape = [U.length, U[0].length];
    if (A.length == 0) {
        [1, 2].forEach(i => A.push(Array.from({ length : shape[i - 1] }, (_, j) => `\$a_{${i}${j + 1}}\$`)));
    }
    if (mixed) {
        if (p.length == 0) {
            [1, 2].forEach(i => p.push(Array.from({ length : shape[i - 1] }, (_, j) => `\$p_{${i}${j + 1}}\$`)));
        }
        A = A.map((a, i) => a.map((_, j) => _ + ' ' + p[i][j]));
    }
    if (name.length == 0) {
        [1, 2].forEach(i => name.push(`Player ${i}`));
    }
    let blank = ['', [['style', 'border: none;']]];
    let table = [];
    table.push([blank, blank, [name[1], [
        ['colspan', shape[1]], 
        ['style', 'border: none; padding: 0']
    ]]]);
    table.push([blank, blank].concat(A[1].map(a => [a, blank[1]])));
    for (let i = 0; i < shape[0]; i++) {
        let _ = [];
        if (i == 0) {
            _.push([name[0], [
                ['rowspan', shape[0]],
                ['style', 'border: none; vertical-align: middle; padding: 0']
            ]]);
        }
        table.push(_.concat([[A[0][i], blank[1]]].concat(U[i])));
    }
    return new Table(table, [['class', 'game-table']]);
}