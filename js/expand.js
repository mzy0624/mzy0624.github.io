class Expand extends Div {
    constructor(contents, expands, attributes={}) {
        super(contents, attributes);
        this.expands = expands;
        this.expand();
    }
    
    expand() {
        let expands = this.expands;
        if (expands != 0) {
            if (Array.isArray(expands)) {
                expands = new Ul(expands, {'class' : 'hidden', 'style' : {'font-size' : 'smaller'}});
            }
            else {
                expands = new Div(expands, {'class' : 'hidden'});
            }
            let button = this.get_button();
            button.addEventListener('click', function () {
                button.classList.toggle('rotated');
                expands.toggle_class('visible');
            });
            this.append(button);
            this.append(expands);
        }
        else {
            set_style_for_element(this, {'margin-bottom' : '.9333em'})
        }
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