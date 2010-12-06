( function() {
    function footnoteDialog(editor) {
        var buttons = [{
            type:       'button',
            id:         'newFootnote',
            label:      'New Footnote',
            onClick:    footnoteNew 

        }, CKEDITOR.dialog.okButton, CKEDITOR.dialog.cancelButton]

        var contents = [{
            id:     'footnote',
            label:  'Add footnote',
            elements:   [{
                type:           'text',
                id:             'addFootnote',
                label:          'Footnote ID',
                labelLayout:    'horizontal'
            }]
        }] 
        
        return {
            title: 'Add a footnote',
            minWidth:   400,
            minHeight:  300,
            buttons:    buttons,
            resizable:  'none',
            contents:   contents,
            onOk:       footnoteOk,
        }
    }

    function footnoteOk(data) {
console.log(data);
    }

    function footnoteNew(data) {
console.log(data);
    }

    CKEDITOR.dialog.add('footnote', function(editor) {
        return footnoteDialog(editor);
    });
})();
