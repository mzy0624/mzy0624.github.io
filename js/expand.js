class Expand extends Div {
    constructor(contents='', lists=[], attributes={}) {
        super(contents, attributes);
        this.lists = lists;
        this.expand();
    }
    
    expand() {
        let lists = this.lists;
        lists = new Ul(lists, {'class' : 'hidden'});
        let small = new Small(lists);
        if (this.lists.length > 0) {
            let button = this.get_button();
            button.addEventListener('click', function () {
                lists.toggle_class('visible');
                button.classList.toggle('rotated');
            });
            this.append(button);
        }
        this.append(small);
    }

    get_button() {
        // UPDATE ME
        let button = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        set_attributes_for_element(button, {
            'id' : 'toggleButton',
            'style' : {
                'margin-left' : '5px',
                'height' : '25px',
                'vertical-align' : 'middle',
                'transition' : 'all 0.3s'
            },
            'viewBox' : '0 0 10 10',
        });
        this.set_shape_for_button(button);
        return button;
    }
    
    set_shape_for_button(button) {
        let triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        set_attributes_for_element(triangle, {
            'points' : '3.27,2 3.27,8 8.46,5',
            'fill'   : '#52adc8',
        });
        button.append(triangle);
    }
}

class SH extends Expand {
    constructor(name, since='', list=[]) {
        super(`${icons(name)} ${name} ${since != '' ? `<small>(since ${since})</small>` : ''}`, list);
    }
};

class TA extends Expand {
    constructor(name, list=[]) {
        super(`${icons(name)} ${getAnchor(name)}`, list);
    }
}