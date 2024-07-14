let avatar  = new Img('./files/avatar.png', {'class' : 'avatar'});
let tooltip = new Button('❓', {'class' : 'tooltip-btn'});
let meaning = new Span('因为到哪都喜欢呆在没人的角落', {'class' : 'tooltip-text'});
tooltip.add_event_listener('mouseenter', function() { set_style_for_element(meaning, {'visibility' : 'visible'}); });
tooltip.add_event_listener('mouseleave', function() { set_style_for_element(meaning, {'visibility' : 'hidden'}); });
let masthead_left = new Div([
    avatar,
    new Div([
        new Head(['Haibara AI 的角落', tooltip, meaning]),
        new Small('记录一些乱七八糟的东西，你居然能找到这里 o(￣▽￣)=b')
    ], {'style' : {'padding-left' : '1em'}})
], {'class' : 'masthead-left'});
append_elem('masthead', masthead_left);

// masthead_right is in 'music.js'