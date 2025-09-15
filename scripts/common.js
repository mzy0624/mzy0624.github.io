function icons(str, suffix='svg') {
    // return new Img(`icons/${str}.svg`, {'class' : 'icons'});
    return `<img class="icon" src="icons/${str}.${suffix}"/>`;
}

let URLs = {
    'AAAI2026'  : ['2026 (Program Committee)',                                            'https://aaai.org/conference/aaai/aaai-26/'],
    'AI'        : ['Artificial Intelligence',                                             'https://ai.nju.edu.cn'],
    'ai'        : ['School of Artificial Intelligence',                                   'https://ai.nju.edu.cn'],
    'bilibili'  : [icons('bilibili'),                                                     'https://space.bilibili.com/454302264'],
    'C'         : ['C Programming Language',                                              'http://docs.cpl.icu/'],
    'cs'        : ['Department of Computer Science and Technology at Nanjing University', 'https://cs.nju.edu.cn'],
    'd09c'      : ['Dignics 09C',                                                         'https://www.butterfly-global.com/cn/products/detail/06070.html'],
    'fzd'       : ['Fan Zhendong ALC',                                                    'https://www.butterfly-global.com/cn/products/detail/37221.html'],
    'github'    : [icons('github'),                                                       'https://github.com/mzy0624'],
    'gmail'     : [`${icons('gmail')} mzy0624@gmail.com`,                                 'mailto:mzy0624@gmail.com'],
    'H3'        : [`Hurricane 3`,                                                         'http://www.dhs-sports.com/c8f809c3-110f-5b2c-3afc-89deed24c7a1/114ae0da-41c7-3b21-7d94-9c860cecbab5.shtml'],
    'ins'       : [icons('ins'),                                                          'https://www.instagram.com/mzy0624/'],
    'lamda'     : ['LAMDA Group',                                                         'https://www.lamda.nju.edu.cn/CH.MainPage.ashx'],
    'lamdalogo' : ['<img src="images/lamda.png" class="logoimage">',                      'https://www.lamda.nju.edu.cn/CH.MainPage.ashx'],
    'lamdadark' : ['<img src="images/lamda-dark.png" class="logoimage">',                 'https://www.lamda.nju.edu.cn/CH.MainPage.ashx'],
    'lamdamail' : [`${icons('lamda')} maozy@lamda.nju.edu.cn`,                            'mailto:maozy@lamda.nju.edu.cn'],
    'lim'       : ['Ming Li',                                                             'https://ai.nju.edu.cn/lim/index.htm'],
    'neo'       : ['NEO Hurricane 3',                                                     'http://www.dhs-sports.com/c8f809c3-110f-5b2c-3afc-89deed24c7a1/38909872-582a-5564-0e9e-ead1085c2b85.shtml'],
    'nju'       : ['Nanjing University',                                                  'https://www.nju.edu.cn'],
    'njuai'     : ['School of Artificial Intelligence at Nanjing University',             'https://ai.nju.edu.cn'],
    'njuailogo' : ['<img src="images/njuai.png" class="logoimage">',                      'https://ai.nju.edu.cn'],
    'njulogo'   : ['<img src="images/nju_name.jpg" class="logoimage">',                   'https://www.nju.edu.cn'],
    'orcid'     : [`${icons('orcid')} ORCID`,                                             'https://orcid.org/0000-0002-2143-2625'],
    'ps'        : ['Problem Solving',                                                     'http://cslabcms.nju.edu.cn/problem_solving/index.php/%E9%A6%96%E9%A1%B5'],
    'Rozena'    : [`Rozena`,                                                              'https://www.butterfly-global.com/cn/products/detail/06020.html'],
    'skl'       : ['State Key Laboratory for Novel Software Technology',                  'https://keysoftlab.nju.edu.cn'],
    'smail'     : [`${icons('nju', 'png')} maozy@smail.nju.edu.cn`,                       'mailto:maozy@smail.nju.edu.cn'],
    'yinhe'     : ['Yinhe MC-2',                                                          'http://www.yinhe1986.cn/prod_view.aspx?TypeId=678&Id=750'],
    'zhihu'     : [icons('zhihu'),                                                        'https://www.zhihu.com/people/mzy0624'],
    'zhouzh'    : ['Zhi-Hua Zhou',                                                        'https://cs.nju.edu.cn/zhouzh/index.htm'],
    '5X'        : [`Hurricane Long 5X`,                                                   'http://www.dhs-sports.com/malong/89d3c98d-55d1-5bc1-3472-918d14e86045.shtml'],
    'riken'     : ['2024 LAMDA & RIKEN-AIP Joint Workshop',                               'https://www.lamda.nju.edu.cn/news_240605.ashx'],
    'mla23'     : ['2023 China Symposium on Machine Learning and Applications (MLA)',     'https://www.lamda.nju.edu.cn/conf/mla23/'],
};

function getAnchor(url, attributes={}) {
    if (url in URLs) {
        return new Anchor(URLs[url][1], URLs[url][0], attributes);
    }
    return url;
}

function get_style(element, key) {
    if (typeof(element) == 'string') {
        element = document.getElementById(element);
    }
    let styles = element.getAttribute('style');
    if (styles == null) {
        return '';
    }
    styles = styles.split(';');
    for (let style of styles) {
        key_value = style.split(':');
        if (key_value[0] == key) {
            return key_value[1].trim();
        }
    }
    return '';
}

function get_attribute(element, key) {
    if (typeof(element) == 'string') {
        element = document.getElementById('string');
    }
    return element.getAttribute(key);
}

function update_styles(styles, key, value) {
    let new_style = `${key}: ${value}`;
    for (let i in styles) {
        let [style_key, _] = styles[i].split(':').map(s => s.trim()); // 去掉前后空格
        if (style_key === key) {
            if (value === '') {
                styles.splice(i, 1);
            }
            else {
                styles[i] = new_style;
            }
            return;
        }
    }
    styles.push(new_style);
}

function set_style(element, styles) {
    if (typeof(element) == 'string') {  // id
        element = document.getElementById(element);
    }
    // element.getAttribute and element.setAttribute are visible even if type(element) != BaseElement
    let existing_styles = element.getAttribute('style');    // 'k1: v1; k2: v2'
    if (existing_styles == null || existing_styles == '') {
        existing_styles = [];
    }
    else {
        existing_styles = existing_styles.split('; ');   // ['k1: v1', 'k2: v2']
    }
    for (let key in styles) {
        update_styles(existing_styles, key, styles[key]);
    }
    element.setAttribute('style', existing_styles.join('; '));
}


function set_display(element, display) {
    set_style(element, {'display' : display});
}

function get_display(element) {
    return get_style(element, 'display');
}

function set_attributes(element, attributes) {
    /**
     * attributes = {
     *     'style' : {      // map
     *         'display' : 'block',
     *         'vertical-align' : 'middle',
     *         ...
     *     },
     *     'class' : ['class1', 'class2'], // list or
     * //  'class' : 'class1',             // string
     *     'id'    : 'main',               // string
     *     ...
     * }
     */
    if (typeof(element) == 'string') {  // id
        element = document.getElementById(element);
    }
    if (element instanceof BaseElement) {
        element = element.elem;
    }
    for (let key in attributes) {
        if (key == 'style') {
            set_style(element, attributes[key]);
        }
        else if (key == 'class') {
            let classes = attributes[key];
            if (!Array.isArray(classes)) {
                classes = [classes];
            }
            classes.forEach(cls => element.classList.add(cls));
        }
        else {
            let value = attributes[key];    // value is a string
            if (value === false) {  // false not 'false'
                element.removeAttribute(key);
            }
            else {
                element.setAttribute(key, value);
            }
        }
    }
}

class BaseElement {
    constructor(tagName, contents='', attributes={}) {
        if (tagName.startsWith('id:')) {
            // E.g. id: study
            this.elem = document.getElementById(tagName.slice(4));
        }
        else {
            // create element
            this.elem = document.createElement(tagName);
            // contents
            if (contents != '') {
                this.append(contents);
            }
            // set attributes
            set_attributes(this, attributes);
        }

        return new Proxy(this, {
            get(target, prop, receiver) {
                if (prop in target) {
                    return Reflect.get(target, prop, receiver);
                }
                if (prop in target.elem) {
                    const val = target.elem[prop];
                    // 若是函数，绑定 elem 保持上下文正确
                    return typeof val === 'function' ? val.bind(target.elem) : val;
                }
                return undefined;
            }
        });
    }

    append(contents) {
        if (Array.isArray(contents)) {
            contents.forEach(content => this.append(content));
        }
        else if (contents instanceof BaseElement) {
            this.elem.append(contents.elem);
        }
        else if (typeof(contents) == 'string') {
            this.elem.innerHTML += contents;
        }
        else {
            this.elem.append(contents);
        }
    }

    toString() {
        return this.outerHTML;
    }
}

function append_elem(target, ...elems) {
    if (typeof(target) == 'string') {
        target = document.getElementById(target);
    }
    elems.forEach(elem => {
        if (elem instanceof BaseElement) {
            target.append(elem.elem);
        }
        else {
            target.append(elem);
        }
    });
    return target;
}

function get_elem(elem) {
    if (typeof(elem) == 'string') {
        // elem: id
        return document.getElementById(elem);
    }
    else if (elem instanceof BaseElement) {
        return elem.elem;
    }
    else {
        return elem;
    }
}

function update_html(target, html) {
    target = get_elem(target);
    target.innerHTML = html;
}

function add_class(target, ...classes) {
    target = get_elem(target);
    classes.forEach(cls => target.classList.add(cls));
}

function remove_class(target, ...classes) {
    target = get_elem(target);
    classes.forEach(cls => target.classList.remove(cls));
}

function toggle_class(target, force, ...classes) {
    target = get_elem(target);
    if (force != '') {
        classes.forEach(cls => target.classList.toggle(cls, force()));
    }
    else {
        classes.forEach(cls => target.classList.toggle(cls));
    }
}

class Hr extends BaseElement {
    constructor(attributes={}) {
        super('hr', '', attributes);
    }
}

class Br extends BaseElement {
    constructor() {
        super('br');
    }
}

class Button extends BaseElement {
    constructor(contents='', attributes={}) {
        super('button', contents, attributes);
    }
}

class Center extends BaseElement {
    constructor(contents='', attributes={}) {
        super('div', contents, attributes);
        set_style(this, {'text-align' : 'center'});
    }
}

class Option extends BaseElement {
    constructor(contents='', value='', attributes={}) {
        attributes['value'] = value;
        super('option', contents, attributes);
    }
}

class Select extends BaseElement {
    constructor(contents='', options=[], attributes={}) {
        super('select', contents, attributes);
        this.add_options(options);
        // this.n_options = options.length;
    }
    update_options(options=[]) {
        // options: [[option1, value1], [option2, value2], ...]
        this.elem.innerHTML = '';
        this.add_options(options);
    }
    add_options(options=[]) {
        this.append(options.map(option => new Option(option[0], option[1])));
    }
    reset() {
        this.elem.selectedIndex = 0;
    }
}

class Img extends BaseElement {
    constructor(src, attributes={}) {
        attributes['src'] = src;
        super('img', '', attributes);
    }
    update_src(src) {
        set_attributes(this, {'src' : src});
    }
}

class Head extends BaseElement {
    constructor(contents='', h=1, attributes={}) {
        super(`h${h}`, contents, attributes);
    }
}

class Anchor extends BaseElement {
    constructor(url, content, attributes={}, target="_blank") {
        attributes['href'] = url;
        attributes['target'] = target;
        super('a', content, attributes);
    }
}

class Para extends BaseElement {
    constructor(contents='', attributes={}) {
        super('p', contents, attributes);
    }
}

class Small extends BaseElement {
    constructor(contents='', attributes={}) {
        super('small', contents, attributes);
    }
}

class Span extends BaseElement {
    constructor(content='', attributes={}) {
        super('span', content, attributes);
    }
}

class Div extends BaseElement {
    constructor(contents='', attributes={}) {
        super('div', contents, attributes);
    }
}

class Li extends BaseElement {
    /**
     * List <li>
     * new Li(contents:String)
     */
    constructor(contents='', attributes={}) {
        super('li', contents, attributes);
    }
}

class List extends BaseElement {
    /**
     * (Un)Ordered List <ul> or <ol>
    */
    constructor(type, contents, attributes) {
        super(type, '', attributes);
        /**
         * object
         * [li1, l2, ...]
         * [
         *  [li1, a1],
         *  [li2, a2],
         *  ...
         * ]
         */
        this.append_li(contents);
    }
    append_li(contents) {
        if (!Array.isArray(contents)) {
            contents = [contents];
        }
        contents = contents.map((li) => {
            return li instanceof Li ? li : new Li(li);
        });
        this.append(contents);
    }

}

class Ul extends List {
    /**
     * Unordered List <ul><li>...</li>...</ul>
     * new Ul(contents:String, [li1, li2, ...]/li)
     * */
    constructor(contents=[], attributes={}) {
        super('ul', contents, attributes);
    }
}

class Ol extends List {
    /**
     * Ordered List <ol><li>...</li>...</ol>
     * new Ol(contents:String, [li1, li2, ...]/li)
     * */
    constructor(contents=[], attributes={}) {
        super('ol', contents, attributes);
    }
}

class Th extends BaseElement {
    // Table Header <th>
    constructor(contents, attributes={}) {
        super('th', contents, attributes);
    }
}

class Td extends BaseElement {
    // Table Datacell <td>
    constructor(contents, attributes={}) {
        super('td', contents, attributes);
    }
}

class Tr extends BaseElement {
    /*
       Table Row <tr>
        new Tr([td1, td2, ...]) or
        new Tr([[td1, attr1], [td2, attr2]]) or mixed
    */
    constructor(contents, attributes={}, data_type=Td) { // data_type: Td or Th
        super('tr', '', attributes);
        this.append(contents.map(data =>
            Array.isArray(data) ?
            new data_type(data[0], attributes=data[1]) :
            new data_type(data)
        ));
    }
}

class Tbody extends BaseElement {
    // Table Body
    constructor(contents, attributes={}, has_header=false) {
        super('tbody', '', attributes);
        if (has_header == true) {
            this.append(new Tr(contents[0], [], Th));
            contents = contents.slice(1);
        }
        this.append(contents.map(tr => new Tr(tr)));
    }
}

class Table extends BaseElement {
    /**
     * Table
     * new Table([
     *     [data1, data2, ...],  // row1
     *     [data3, data4, ...],  // row2
     *                           // ...
     *     [data5, data6, ...]   // rown
     * ])
     *
     * A data may be a string, or an array: [td, attrs],
     * where attrs is the attributes of this data
     */
    constructor(contents, attributes={}, has_header=false) {
        super('table', '', attributes);
        this.append(new Tbody(contents, attributes, has_header=has_header));
    }
}

function new_NS_element(namespace_URI, qualified_name, attributes={}) {
    let elem = document.createElementNS(namespace_URI, qualified_name);
    set_attributes(elem, attributes);
    return elem;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}