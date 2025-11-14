let publications = [
    {
        "title": "JJLin: Jointed-Junctional Learnware Chain",
        "publish": [
            "The 43rd International Conference on Machine Learning.",
            "ICML 2026",
            "A"
        ],
        "authors": "<u><b>Zi-Yu Mao</b></u>, Zhi-Hao Tan, Ming Li.",
        "type": "Learnware",
        "image": "JJLin.png",
        "abstract": "TBD",
        "bib": "TBD",
        "pdf": "files/JJLin.pdf",
        "code": "Optional (e.g. Github repository)",
        "poster": "Optional (e.g. Poster link)",
        "oral": "Optional (e.g. Oral link)",
        "link": ""
    },
    {
        "title": "Identifying Useful Learnwares via Reduced Neural Conditional Mean Embedding",
        "publish": [
            "The 43rd International Conference on Machine Learning.", // The full name of conference or journal (optional year)
            "ICML 2026", // The short name of it (optional year)
            "A" // A/B/C or empty
        ],
        "authors": "<u><b>Zi-Yu Mao</b></u>, Ming Li.",
        "type": "Learnware",
        "image": "RNCME.png",
        "abstract": "The learnware paradigm aims to establish a market of learnwares, each of which is a well-trained model combined with a specification that describes its functionality without leaking data privacy. The market enables users to efficiently reuse relevant models based on specifications on their own tasks instead of training models from scratch. Recent works have attempted to generate specifications using Reduced Kernel Mean Embedding (RKME), which maps input distributions into Reproducing Kernel Hilbert Space (RKHS) while ignoring the output space, causing models trained on similar input spaces to yield similar specifications, even when their functionalities differ. Many labeled-RKME improvements attempt to address this by indirectly modeling the input-output conditional distributions, but they remain limited to classification tasks and lack clear theoretical explanations. In this work, we propose Reduced Neural Conditional Mean Embedding (RNCME), a novel specification generation method that directly models input-output conditional distributions via Conditional Mean Embedding (CME). Our RNCME method has a clear theoretical understanding based on CME and is applicable to both regression and classification tasks. Empirical experiments demonstrate the effectiveness of our RNCME method for learnware recommendation.",
        "bib": "@inproceedings{mao2026identifying,\n    title={Identifying Useful Learnwares via Reduced Neural Conditional Mean Embedding},\n    author={Mao, Zi-Yu and Li, Ming},\n    booktitle={},\n    year={2026},\n    organization={}\n}",
        "pdf": "files/RNCME.pdf",
        "code": "Optional (e.g. Github repository)",
        "poster": "Optional (e.g. Poster link)",
        "oral": "Optional (e.g. Oral link)",
        "link": "https://openreview.net/forum?id=TLo6EUe4Fi"
    }
];

function publication_parser(pub) {
    let title    = new Head(pub.title, 2);
    let authors  = new Div(pub.authors);
    let conf_jnl = new Div(pub.publish[0], {'style' : {'font-style' : 'italic'}});
    let imagesrc = `images/publications/${pub.image}`;
    let image    = new Img(imagesrc, {'class' : ['paper-image', 'thumbnail'], 'onclick' : `enlarge_img('${imagesrc}')`});
    let abs_btn  = new Button('ABS', {'class' : ['button', 'link']});
    let pdf_btn  = new Button('PDF', {'class' : ['button', 'link'], 'onclick' : `window.open('${pub.pdf}')`});
    let bib_btn  = new Button('BIB', {'class' : ['button', 'link']});
    bib_btn.addEventListener('click', async (e) => {
        navigator.clipboard.writeText(`${pub.bib.replace(/\n/g, '\\n')}`);
        update_html(e.target, 'COPIED');
        await sleep(1000);
        update_html(e.target, 'BIB');
    });
    let pub_btn  = new Button(pub.publish[1], {'class' : ['button', 'link'], 'onclick' : `window.open('${pub.link}')`, style : {'background' : 'blue'}});
    let rank = pub.publish[2];
    move_popup_to(abs_btn, pub.abstract);
    move_popup_to(bib_btn, `<pre class="bib-text">(Click to copy)\n${pub.bib}</pre>`);

    let buttons = new Div([abs_btn, pdf_btn, bib_btn, pub_btn]);
    let content = new Div([title, authors, conf_jnl, buttons], {'class' : 'paper-info'});
    let publication = new Div([image, content], {'class' : ['flex-information', 'publication']});
    if (rank) {
        let ccf_rank = new Div(`CCF ${rank}`, {'class' : ['ccf-rank', rank]});
        publication.append(ccf_rank);
    }
    return publication;
}


let pub_div = new Div(new Head('📄 Publications'), {'class' : 'column'});

/* If there is no paper */
pub_div.append(new Div(new Head("Under review ...", 3), {'class' : ['flex-information', 'publication']}));
/* Else */
// publications.forEach(pub => pub_div.append(publication_parser(pub)));
/* EndIf */

append_elem('page', pub_div);
