function open_popup(popup_id) {
    document.getElementById(popup_id).style.display = 'flex'; 
}

function close_popup(popup_id) { 
    document.getElementById(popup_id).style.display = 'none'; 
}

function execute_scripts(element) {
    // This function is generated by GPT-4o
    const scripts = element.querySelectorAll('script');
    scripts.forEach(script => {
        const newScript = document.createElement('script');
        if (script.src) {
            newScript.src = script.src;
            newScript.async = false;
        } 
        else {
            newScript.textContent = script.textContent;
        }
        document.body.appendChild(newScript);
        document.body.removeChild(newScript);
    });
}

function full_article(file, title, date) {
    fetch(`articles/${file}.html`).then(
        response => response.text()
    ).then(data => {
        let close = new BaseElement('span', [['class', 'close-btn'], ['onclick', `close_popup('${file}')`]]);
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
        execute_scripts(article.elem);  // This line is generated by GPT-4o
    });
}

function article_json_parser(json) {
    let date  = new Div(json.date,  [['class', 'date']]);
    let title = new Div(json.title, [['class', 'title']]);
    let body  = new Div(json.body,  [['class', 'article']]);
    let article = [date, title, body];
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
        let button = new BaseElement('button', button_attributes);
        button.append(button_content);
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