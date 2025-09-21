const enlarged_img = new Img('', {'class' : 'enlarged-img'});
const overlay = new Div(enlarged_img, {'class' : 'overlay', 'onclick' : 'close_overlay()'});
append_elem('page', overlay);

function enlarge_img(src) {
    enlarged_img.update_src(src);
    add_class(overlay, 'active');
    set_style(document.body, {'overflow' : 'hidden'});
}

function close_overlay() {
    remove_class(overlay, 'active');
    set_style(document.body, {'overflow' : 'auto'});
}