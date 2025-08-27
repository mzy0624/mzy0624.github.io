let publications = [
    {
        "title": "Identifying Useful Learnwares via Reduced Neural Conditional Mean Embedding",
        "publish": [
            "The 40th Annual AAAI Conference on Artificial Intelligence", // The full name of conference or journal (optional year)
            "Under review", // The short name of it (optional year)
            "" // A/B/C or empty
        ],
        "authors": "<u><b>Zi-Yu Mao</b></u>, Ming Li.",
        "type": "Learnware",
        // "abstract": "The abstract of the paper (LaTeX is not currently supported).",
        "abstract": "The learnware paradigm aims to establish a market of learnwares, each of which is a well-trained model combined with a specification that describes its functionality without leaking data privacy. The market enables users to efficiently reuse relevant models based on specifications on their own tasks instead of training models from scratch. Recent works have attempted to generate specifications using Reduced Kernel Mean Embedding (RKME), which maps input distributions into Reproducing Kernel Hilbert Space (RKHS) while ignoring the output space, causing models trained on similar input spaces to yield similar specifications, even when their functionalities differ. Many labeled-RKME improvements attempt to address this by indirectly modeling the input-output conditional distributions, but they remain limited to classification tasks and lack clear theoretical explanations. In this work, we propose Reduced Neural Conditional Mean Embedding (RNCME), a novel specification generation method that directly models input-output conditional distributions via Conditional Mean Embedding (CME). Our RNCME method has a clear theoretical understanding based on CME and is applicable to both regression and classification tasks. Empirical experiments demonstrate the effectiveness of our RNCME method for learnware recommendation.",
        "bib": "Citation information (Click to copy, TBD)",
        "pdf": "Optional",
        "code": "Optional (e.g. Github repository)",
        "link": "https://openreview.net/forum?id=TLo6EUe4Fi"
        // image: select one and only one image to ./images, and name it as pub_i.png (e.g. pub_2.png)
    }
];

function copy2clipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Copied to clipboard!");
    });
}

function publication_parser(pub) {
    let title    = new Head(pub.title, 2);
    let authors  = new Div(pub.authors, {'class' : 'row'});
    let conf_jnl = new Div(pub.publish[0], {'class' : 'row', 'style' : {'font-style' : 'italic'}});
    let image    = new Img(`images/pub_${pub.id}.png`, {'class' : 'image'});
    let abs_btn  = new Button('ABS', {'class' : ['button', 'link']});
    let bib_btn  = new Button('BIB', {'class' : ['button', 'link'], 'onclick' : `copy2clipboard('${pub.bib}')`});
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
pub_div.append(new Div(new Head("A learnware paper is under review ...", 3), {'class' : ['flex-information', 'publication']}));
/* If there exists paper(s) */
// publications.map((pub, idx) => {pub['id'] = publications.length - idx;});
// publications.forEach(pub => pub_div.append(publication_parser(pub)));
append_elem('page', pub_div);
