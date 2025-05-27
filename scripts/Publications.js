let publications = [
    {
        "title": "The Title of Paper",
        "publish": [
            "The 42-nd International Conference on Machine Learning", // The full name of conference or journal (optional year)
            "ICML 2025", // The short name of it (optional year)
            "A" // A/B/C or empty
        ],
        "authors": "Author1, Author2, ...",
        "type": "e.g., Learnware / ABL / Code",
        "abstract": "The abstract of the paper (LaTeX is not currently supported).",
        "bib": "Citation information (Click to copy, TBD)",
        "pdf": "Optional",
        "code": "Optional (e.g. Github repository)",
        "link": "The link of the paper (e.g. https://arxiv.org/abs/xxxxx)"
        // image: select one and only one image to ./images, and name it as pub_i.png (e.g. pub_2.png)
    }
];

function publication_parser(pub) {
    let title    = new Head(pub.title, 2);
    let authors  = new Div(pub.authors, {'class' : 'row'});
    let conf_jnl = new Div(pub.publish[0], {'class' : 'row', 'style' : {'font-style' : 'italic'}});
    let image    = new Img(`images/pub_${pub.id}.png`, {'class' : 'image'});
    let abs_btn  = new Button('ABS', {'class' : ['button', 'link']});
    let bib_btn  = new Button('BIB', {'class' : ['button', 'link']});
    let pub_btn  = new Button(pub.publish[1], { 'class' : 'button', 'onclick' : `window.open('${pub.link}')` });
    let rank = pub.publish[2];
    if (rank) {
        add_class(pub_btn, rank);
    }
    move_popup_to(abs_btn, pub.abstract);
    move_popup_to(bib_btn, pub.bib);
    let buttons = new Div([abs_btn, bib_btn, pub_btn]);
    // let buttons = new Div([abs_btn, bib_btn, pub_btn], {'class' : 'row'}); // pub_info (e.g., ICML 2025) will be float to right
    let content = new Div([title, authors, conf_jnl, buttons], {'class' : 'content'});
    return new Div([image, content], {'class' : ['flex-information', 'publication']});
}


let pub_div = new Div(new Head('📄 Publications'), {'class' : 'column'});
/* If there's no paper */
pub_div.append(new Div(new Head("There's nothing here 😭", 3), {'class' : ['flex-information', 'publication']}));
/* If there exists paper(s) */
// publications.map((pub, idx) => {pub['id'] = publications.length - idx;});
// publications.forEach(pub => pub_div.append(publication_parser(pub)));
append_elem('page', pub_div);
