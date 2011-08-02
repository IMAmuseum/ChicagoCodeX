( function($) {
    function footnoteDialog(editor) {
        var buttons = [ CKEDITOR.dialog.okButton, CKEDITOR.dialog.cancelButton ];
        var footnotes = $('#' + editor.name)
            .parents('.field-type-osci-body-copy')
            .find('.footnote-wrapper:not(:first)');
        var items = [['', '']];
    
        footnotes.each(function(idx) {
            items.push([(idx + 1) + ' (' + $(this).attr('id') + ')', $(this).attr('id')]);
        });

        var elements = [{
            type:           'text',
            id:             'footnoteId',
            label:          'Enter a footnote ID',
            labelLayout:    'horizontal'
        },
        {
            type:           'html',
            html:           '<b>OR</b>'
        },
        {
            type:           'select',
            id:             'existingFootnote',
            items:          items,
            label:          'Select an existing footnote',
            labelLayout:    'horizontal'
        }];

        var contents = [{
            id:     'footnote',
            label:  'Add footnote',
            elements:   elements
        }] 
        
        return {
            title: 'Add a footnote',
            minWidth:   400,
            minHeight:  100,
            buttons:    buttons,
            resizable:  'none',
            contents:   contents,
            onOk:       footnoteOk,
        }
    }

    function footnoteOk(data) {
        var editor = this.getParentEditor();
        var dialog = CKEDITOR.dialog.getCurrent();
        var footnoteId = dialog.getValueOf('footnote', 'footnoteId');
        var existingFootnote = dialog.getValueOf('footnote', 'existingFootnote');
    
        if (existingFootnote != '') {
            var replace = existingFootnote;
        } else if (footnoteId != '') {
            var replace = footnoteId;
        }

        editor.insertText('[footnote:' + replace + ']');
    }

    CKEDITOR.dialog.add('footnote', function(editor) {
        return footnoteDialog(editor);
    });
})(jQuery);
