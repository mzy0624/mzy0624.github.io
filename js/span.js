class Span extends Div {
    /**
     * A button with a spanable list
     */
    constructor(contents='', lists=[], attributes=[]) {
        super(contents, attributes);
        this.lists = lists;
        if (contents != '') {
            this.setSpan();
        }
    }
    
    setSpan() {
        let lists = this.lists;
        lists = new Ul(lists, [['class', 'hidden']]);
        let small = new Small(lists);
        if (this.lists.length > 0) {
            let button = this.getButton();
            button.addEventListener('click', function () {
                lists.elem.classList.toggle('visible');
                button.classList.toggle('rotated');
            });
            this.append(button);
        }
        this.append(small);
    }

    getButton() {
        let button = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        button.id = 'toggleButton';
        setAttributesForElement(button, {
            'style' : [
                ['margin-left',     '5px'],
                ['height',          '25px'],
                ['vertical-align',  'middle'],
                ['transition',      'all 0.3s']
            ],
            'viewBox' : '0 0 10 10',
        });
        this.setShapeForButton(button);
        return button;
    }
    
    setShapeForButton(button) {
        let triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        setAttributesForElement(triangle, {
            'points' : '3.27,2 3.27,8 8.46,5',
            'fill' :   '#52adc8',
        });
        button.append(triangle);
    }
}

class SpanDiv extends Span {
    constructor(contents, lists) {
        super(lists);
        this.prepend(contents);
        this.setSpan();
    }
}

class SH extends Span {
    constructor(name, since='', list=[], nameCN='') {
        super('', list);
        this.prepend(`${icons(name)} ${nameCN ? nameCN : name} ${since != '' ? `<small>(since ${since})</small>` : ''}`);
        this.setSpan();
    }
};

class TA extends Span {
    constructor(name, list=[]) {
        super('', list);
        this.prepend(`${icons(name)} ${getAnchor(name)}`);
        this.setSpan();
    }
}