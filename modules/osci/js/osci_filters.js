(function ($) {
/*
    CKEDITOR.plugin.add('osci_filters', {
        init:   function(editor) {
            editor.ui.addCommand('addfootnote', new CKEDITOR.dialogCommand('addfootnote');
            editor.ui.addButton('footnote', {
                label: 'Footnote',
                icon: this.path + 'footnote_edit.png',
                command: 'addfootnote' 
            });
        }
    });
*/

    $(document).ready(function() {
        $('.field-type-osci-body-copy').each(function() {
            var id = $(this).attr('id');
            listenForPaste($('#' + id + ' textarea').attr('id'));
        });

        function listenForPaste(selector) {
            var editor = CKEDITOR.instances[selector];

            // Load paste from word function if we don't already have it
            if (!CKEDITOR.cleanWord) {
                CKEDITOR.scriptLoader.load('/osci/sites/all/libraries/ckeditor/plugins/pastefromword/filter/default.js');
            }

            editor.on('paste', function(evt) {
                //  replace footnotes with data
                var data = $('<span>' + evt.data.html + '</span>');
                // Search for footnote links in body text
                $('a', data).each(function(idx, val) {
                    var name = $(this).attr('name');

                    if (name.indexOf('_ftnref') === 0) {
                        $('#' + selector).parents('.fieldset-wrapper').find('.footnote-add-another').trigger('click', true);
                        var footnote = name.replace('ref', '');
                        var content  = data.find('[name=' + footnote + ']').next().html();
                        content = CKEDITOR.cleanWord(content, editor);

                        $(val).replaceWith('[footnote:' + newIdSelector.replace('#', '') + ']');
                        $(newIdSelector + ' textarea').html(content);
                        data.find('#' + footnote.replace('_', '')).remove();
                    } else {
                        $(this).next().html('');
                        $(this).html('');
                    }
                }); 
                evt.data.html = data.html();
            });
        }

    });
})(jQuery);
