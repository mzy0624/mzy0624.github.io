let popup = new BaseElement('id: popup');
popup.addEventListener('mouseenter', () => {});
popup.addEventListener('mouseleave', () => { set_display(popup, 'none')});
function move_popup_to(elem, popup_content) {
    elem.addEventListener('mouseenter', () => {
        const item_top = elem.offsetTop;
        const item_left = elem.offsetLeft;
        const item_bottom = item_top + elem.offsetHeight;
        const item_right = item_left + elem.offsetWidth;
        const window_width = window.innerWidth;
        update_html(popup, popup_content);
        set_style(popup, {
            'display' : 'block',
            'top' : `${item_bottom}px`,
            'left': '0' // temperarily set to 0, will be adjusted later
        });
        void popup.offsetWidth;
        const popup_width = popup.offsetWidth;
        set_style(popup, {
            'left' : item_left + popup_width >= window_width ?
                     `${item_right - popup_width}px` :
                     `${item_left}px`
        });
    });
    elem.addEventListener('mouseleave', () => {
        if (!popup.matches(':hover')) {
            set_display(popup, 'none');
        }
    });
}

class PopupItem extends Div{
    constructor(title, popup_content='', more=[]) {
        super([title, ...more], {'class' : 'basic-item'});
        if (popup_content) {
            add_class(this, 'more');
            move_popup_to(this, popup_content);
        }
    }
}

class SHItem extends PopupItem {
    constructor(name, time, popup_content='') {
        super(
            new Head(`${icons(name)} ${name}`, 3),
            popup_content,
            [new Div(`Since ${time}`)]
        );
        // add_class(this, 'SH');
    }
}

class TAItem extends PopupItem {
    constructor(name, teacher, terms) {
        super(
            new Head(`${icons(name)} ${getAnchor(name)}`, 3),
            new Div(`${terms.join(', ')}`),
            [new Div(`Teacher: ${teacher}`)],
        )
        // add_class(this, 'TA');
    }
}

class VolunteerItem extends PopupItem {
    constructor(v_type, activities) {
        super(
            new Head(v_type, 3),
            new Ul(activities)
        );
        // add_class(this, 'Volunteer');
    }
}

class ReviewerItem extends PopupItem {
    constructor(item, years) {
        super(new Head(`${icons(item)} ${item}`, 3), new Ul(years));
    }
}

class CorrItem extends PopupItem {
    constructor(c_type, content) {
        super(new Head(c_type, 3), '', [content]);
        // add_class(this, 'Correspondence');
    }
}