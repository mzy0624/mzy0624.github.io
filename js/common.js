function icons(str) {
    let name = str == 'C++' ? 'Cpp' : str;
    return `<img class="icon" src="icons/${name}.svg"/>`;
}

let URLs = {
    'AI'        : ['Artificial Intelligence',                                           'https://ai.nju.edu.cn'],
    'ai'        : ['School of Artificial Intelligence',                                 'https://ai.nju.edu.cn'],
    'bilibili'  : [`${icons('bilibili')}  `,                                            'https://space.bilibili.com/454302264'],
    'CPL'       : ['C Programming Language',                                            'http://docs.cpl.icu/'],
    'cs'        : ['Department of Computer Science and Technology, Nanjing University', 'https://cs.nju.edu.cn'],
    'd09c'      : ['Dignics 09C',                                                       'https://www.butterfly-global.com/cn/products/detail/06070.html'],
    'fzd'       : ['Fan Zhendong ALC',                                                  'https://www.butterfly-global.com/cn/products/detail/37221.html'],
    'github'    : [`${icons('github')}  `,                                              'https://github.com/mzy0624'],
    'gmail'     : [`${icons('gmail')} mzy0624@gmail.com`,                               'mailto:mzy0624@gmail.com'],
    'H3'        : [`Hurricane 3`,                                                       'http://www.dhs-sports.com/c8f809c3-110f-5b2c-3afc-89deed24c7a1/114ae0da-41c7-3b21-7d94-9c860cecbab5.shtml'],
    'ins'       : [`${icons('ins')}  `,                                                 'https://www.instagram.com/mzy0624/'],
    'lab'       : [icons('Correspondence'),                                             'https://j.map.baidu.com/8a/A1aK'],
    'lamda'     : ['LAMDA Group',                                                       'https://www.lamda.nju.edu.cn/CH.MainPage.ashx'],
    'lamdalogo' : ['<img src="images/lamda.jpg" width="225">',                          'https://www.lamda.nju.edu.cn/CH.MainPage.ashx'],
    'lamdamail' : [`${icons('lamda')} maozy@lamda.nju.edu.cn`,                          'mailto:maozy@lamda.nju.edu.cn'],
    'lim'       : ['Ming Li',                                                           'https://ai.nju.edu.cn/lim/index.htm'],
    'neo'       : ['NEO Hurricane 3',                                                   'http://www.dhs-sports.com/c8f809c3-110f-5b2c-3afc-89deed24c7a1/38909872-582a-5564-0e9e-ead1085c2b85.shtml'],
    'nju'       : ['Nanjing University',                                                'https://www.nju.edu.cn'],
    'njuai'     : ['School of Artificial Intelligence, Nanjing University',             'https://ai.nju.edu.cn'],
    'njulogo'   : ['<img src="images/nju_name.jpg" width="240">',                       'https://www.nju.edu.cn'],
    'orcid'     : [`${icons('orcid')} ORCID`,                                           'https://orcid.org/0000-0002-2143-2625'],
    'ps'        : ['Problem Solving',                                                   'http://cslabcms.nju.edu.cn/problem_solving/index.php/%E9%A6%96%E9%A1%B5'],
    'Rozena'    : [`Rozena`,                                                            'https://www.butterfly-global.com/cn/products/detail/06020.html'],
    'skl'       : ['State Key Laboratory for Novel Software Technology',                'https://keysoftlab.nju.edu.cn'],
    'smail'     : [`${icons('nju')} maozy@smail.nju.edu.cn`,                            'mailto:maozy@smail.nju.edu.cn'],
    'zhihu'     : [`${icons('zhihu')}  `,                                               'https://www.zhihu.com/people/mzy0624'],
    'zhouzh'    : ['Zhi-Hua Zhou',                                                      'https://cs.nju.edu.cn/zhouzh/index.htm'],
    '5X'        : [`Hurricane Long 5X`,                                                 'http://www.dhs-sports.com/malong/89d3c98d-55d1-5bc1-3472-918d14e86045.shtml'],
};

function getAnchor(url, attributes=[]) {
    if (url in URLs) {
        return new Anchor(URLs[url][1], URLs[url][0], attributes);
    }
    return url;
}

function processSingleAttributeValue(value) {
    if (Array.isArray(value)) {
        // [k, v]
        return `${value[0]}: ${value[1]};`;
    }
    return value;
}

function processAttributeValues(values) {
    if (Array.isArray(values)) {
        // [value1, value2, ...]
        return values.map(processSingleAttributeValue).join(' ');
    }
    return processSingleAttributeValue(values);
}

function setAttributesForElement(element, attrMap) {
    /*
        attrMap = {
            key1 : [value1-1, value1-2, ...],
            // or
            key2 : value2
        }
     */
    if (element instanceof BaseElement) {
        element = element.elem;
    }
    for (let name in attrMap) {
        values = attrMap[name];
        element.setAttribute(name, processAttributeValues(values));
    }
}

function addAttribute(attributes, attribute) {
    for (let attr of attributes) {
        if (attr[0] == attribute[0]) {
            attr[1] += ';' + attribute[1];
            return attributes;
        }
    }
    attributes.push(attribute);
    return attributes;
}

function addAttributes(attributes, _attributes) {
    for (let attr of _attributes) {
        attributes = addAttribute(attributes, attr);
    }
    return attributes;
}

class BaseElement {
    constructor(tagName, attributes=[]) {
        // create element
        this.elem = document.createElement(tagName);
        // set attributes
        attributes.forEach(attr => this.elem.setAttribute(attr[0], attr[1]));
    }

    prepend(contents) {
        if (Array.isArray(contents)) {
            contents.reverse().forEach(content => this.prepend(content));
        }
        else if (contents instanceof BaseElement) {
            this.elem.insertBefore(contents.elem, this.elem.firstChild);
        }
        else if (typeof(contents) == 'string') {
            this.elem.innerHTML = contents + this.elem.innerHTML;
        }
        else {
            this.elem.insertBefore(contents, this.elem.firstChild);
        }
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
        return this.elem.outerHTML;
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
    })
}

class Hr extends BaseElement {
    constructor() {
        super('hr', []);
    }
}

class Br extends BaseElement {
    constructor() {
        super('br', []);
    }
}

class Center extends BaseElement {
    constructor(contents='', attributes=[]) {
        super('center', attributes);
        this.append(contents);
    }
}

class Img extends BaseElement {
    constructor(src, attributes=[]) {
        super('img', attributes);
        this.elem.src = src;
    }
}

class Head extends BaseElement {
    constructor(contents='', h=1, attributes=[]) {
        super(`h${h}`, attributes);
        this.append(contents);
    }
}

class Anchor extends BaseElement {
    constructor(url, content, attributes=[], target="_blank") {
        attributes = addAttributes(attributes, [['href', url], ['target', target]])
        super('a', attributes);
        this.append(content);
    }
}

class Para extends BaseElement {
    constructor(contents='', attributes=[]) {
        super('p', attributes);
        this.append(contents);
    }
}

class Small extends BaseElement {
    constructor(contents='', attributes=[]) {
        super('small', attributes);
        this.append(contents);
    }
}

class Div extends BaseElement {
    constructor(contents='', attributes=[]) {
        super('div', attributes);
        this.append(contents);
    }
}

class Li extends BaseElement {
    /**
     * List <li>
     * new Li(contents:String)
     */
    constructor(contents='', attributes=[]) {
        super('li', attributes);
        this.append(contents);
    }
}

class List extends BaseElement {
    /**
     * (Un)Ordered List <ul> or <ol>
    */
    constructor(type, contents, attributes) {
        super(type, attributes);
        if (!Array.isArray(contents)) {
            contents = [contents];
        }
        this.append(contents.map(list => new Li(list)));
    }
}

class Ul extends List {
    /** 
     * Unordered List <ul><li>...</li>...</ul>
     * new Ul(contents:String, [li1, li2, ...]/li)
     * */
    constructor(contents=[], attributes=[]) {
        super('ul', contents, attributes);
    }
}

class Ol extends List {
    /** 
     * Ordered List <ol><li>...</li>...</ol>
     * new Ol(contents:String, [li1, li2, ...]/li)
     * */
    constructor(contents=[], attributes=[]) {
        super('ol', contents, attributes);
    }
}

class Th extends BaseElement {
    // Table Header <th>
    constructor(contents, attributes=[]) {
        // attributes = addAttribute(attributes, ['style', 'vertical-align: top']);
        super('th', attributes);
        this.append(contents);
    }
}

class Td extends BaseElement {
    // Table Datacell <td>
    constructor(contents, attributes=[]) {
        // attributes = addAttribute(attributes, ['style', 'vertical-align: top']);
        super('td', attributes);
        this.append(contents);
    }
}

class Tr extends BaseElement {
    /*
       Table Row <tr>
        new Tr([td1, td2, ...]) or
        new Tr([[td1, attr1], [td2, attr2]]) or mixed
    */ 
    constructor(contents, attributes=[], data_type=Td) { // data_type: Td or Th
        super('tr', attributes);
        this.append(contents.map(data => 
            Array.isArray(data) ? 
            new data_type(data[0], attributes=data[1]) : 
            new data_type(data)
        ));
    }
}

class Tbody extends BaseElement {
    // Table Body
    constructor(contents, attributes=[], has_header) {
        super('tbody', attributes);
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
    constructor(contents, attributes=[], has_header=false) {
        super('table', attributes);
        this.append(new Tbody(contents, attributes, has_header=has_header));
    }
}
