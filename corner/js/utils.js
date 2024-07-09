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

function readmore_button(file, title, date) {
    let button = new Button('阅读全文 >', {'class' : 'readmore'});
    append_elem(document.body, new Div('', {'class' : 'overlay', 'id' : file, 'onclick' : `close_popup('${file}')`}));
    button.add_event_listener('click', function() {
        let div = document.getElementById(file);
        if (div.children.length == 0) {
            // The content has not been loaded
            full_article(file, title, date);
        }
        open_popup(file);
    });
    return button;
}

function full_article(file, title, date) {
    fetch(`articles/${file}.html`).then(
        response => response.text()
    ).then(data => {
        // let close = new Span('❌', {'class' : 'close-btn', 'onclick' : `close_popup('${file}')`});
        let article = new Div(data, {'class' : ['popup-content', 'full-article']});
        // append_elem(file, new Div([title, close, date, new Br(), new Hr(), article], {
        append_elem(file, new Div([title, date, new Br(), new Hr(), article], {
                'class' : 'popup', 
            'onclick' : 'event.stopPropagation();'
        }));
        execute_scripts_sync(article.elem).then(() => {
            MathJax.typesetPromise([title.elem, article.elem]); // 手动 typeset 新插入的内容
        });
    });
}

function render_pseudocode(id, reset=false) {
    let option = { 
        noEnd: true,
        commentDelimiter: '▷'
    };
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
    let blank = ['', {'style' : 'border: none;'}];
    let table = [];
    table.push([blank, blank, [name[1], {
        'colspan' : shape[1], 
        'style' : ['border: none', 'padding: 0']
    }]]);
    table.push([blank, blank].concat(A[1].map(a => [a, blank[1]])));
    for (let i = 0; i < shape[0]; i++) {
        let _ = [];
        if (i == 0) {
            _.push([name[0], {
                'rowspan' : shape[0],
                'style' : ['border: none', 'vertical-align: middle', 'padding: 0']
            }]);
        }
        table.push(_.concat([[A[0][i], blank[1]]].concat(U[i])));
    }
    return new Table(table, {'class' : 'game-table'});
}