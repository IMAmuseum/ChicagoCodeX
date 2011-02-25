( function($) {
    function figureDialog(editor) {
        var buttons = [ CKEDITOR.dialog.okButton, CKEDITOR.dialog.cancelButton ];
        var figures = $('#' + editor.name)
            .parents('.field-type-osci-body-copy')
            .find('.figure-wrapper:not(:last)');
        var items = [['', '']];
    
        figures.each(function(idx) {
            items.push([(idx + 1) + ' (' + $(this).attr('id') + ')', $(this).attr('id')]);
        });

        var elements = [{
            type:           'text',
            id:             'figureId',
            label:          'Enter a figure ID',
            labelLayout:    'horizontal'
        },
        {
            type:           'html',
            html:           '<b>OR</b>'
        },
        {
            type:           'select',
            id:             'existingFigure',
            items:          items,
            label:          'Select an existing figure',
            labelLayout:    'horizontal'
        }];

        var contents = [{
            id:     'figure',
            label:  'Add figure',
            elements:   elements
        }] 
        
        return {
            title: 'Add a figure',
            minWidth:   400,
            minHeight:  100,
            buttons:    buttons,
            resizable:  'none',
            contents:   contents,
            onOk:       figureOk,
        }
    }

    function figureOk(data) {
        var editor = this.getParentEditor();
        var dialog = CKEDITOR.dialog.getCurrent();
        var figureId = dialog.getValueOf('figure', 'figureId');
        var existingFigure = dialog.getValueOf('figure', 'existingFigure');
    
        if (existingFigure != '') {
            var replace = existingFigure;
        } else if (figureId != '') {
            var replace = figureId;
        }

        editor.insertText('[figure:' + replace + ']');
    }

    CKEDITOR.dialog.add('figure', function(editor) {
        return figureDialog(editor);
    });
})(jQuery);
