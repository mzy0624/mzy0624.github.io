append_elem('page', new Div([
    new Head('🏫 Correspondence'),
    new Div([
        new CorrItem(
            '🪦 Laboratory',
            new BaseElement('address', [
                '810, Jingwen Student Activity Center', new Br(),
                'Nanjing University Xianlin Campus.'
            ])
        ),
        new CorrItem(
            '📬 Mail Address',
            new BaseElement('address', [
                'Zi-Yu Mao', new Br(),
                'State Key Laboratory for Novel Software Technology', new Br(),
                'Nanjing University Xianlin Campus Mailbox 603', new Br(),
                '163 Xianlin Avenue, Qixia District, Nanjing 210023, China.'
            ])
        )
    ], {'class' : ['basic-items', 'Correspondence']})
], {'class' : 'column'}));