let avatar  = new Img('./files/avatar.png', {'class' : 'avatar'});
let tooltip = new Button('❓', {'class' : 'tooltip-btn'});
let meaning = new Span('因为到哪都喜欢呆在没人的角落', {'class' : 'tooltip-text'});
tooltip.add_event_listener('mouseenter', function() { set_style_for_element(meaning, {'visibility' : 'visible'}); });
tooltip.add_event_listener('mouseleave', function() { set_style_for_element(meaning, {'visibility' : 'hidden'}); });
let masthead_left = new Div([
    avatar,
    new Div([
        new Head(['Haibara AI 的角落', tooltip, meaning]),
        new Small('记录一些乱七八糟的东西，你居然能找到这里 o(￣▽￣)=b'),
        new Div([
            new Anchor('#study', '📚 ', {'title' : '学习科研'},  target='_self'),
            new Anchor('#life',  '🕒 ', {'title' : '生活 P 事'}, target='_self'),
            new Anchor('#mood',  '🤔 ', {'title' : '心情随想'},  target='_self'),
            new Anchor('#hobby', '🧩 ', {'title' : '兴趣爱好'},  target='_self'),
            new Anchor('#tech',  '🛠️ ', {'title' : '技术相关'},  target='_self'),
            new Anchor('#log',   '🆕 ', {'title' : '更新日志'},  target='_self')
        ])
    ], {'style' : {'padding-left' : '1em', 'user-select' : 'none'}})
], {'class' : 'masthead-left'});
append_elem('masthead', masthead_left);

// masthead_right is in 'music.js'