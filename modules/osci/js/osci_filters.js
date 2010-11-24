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

            editor.on('paste', function(evt) {
                //  replace footnotes with data
                var data = $('<span>' + evt.data.html + '</span>');
                // Search for footnote links in body text
                $('a', data).each(function(idx, val) {
                    var name = $(this).attr('name');
                    var id = idx + 1;

                    if (name.indexOf('_ftnref') === 0) {
                        $('#' + selector).parents('.fieldset-wrapper').find('.footnote-add-another').click();
                        var footnote = name.replace('ref', '');
                        var content  = data.find('[name=' + footnote + ']').next().html();

                        $(val).replaceWith('[footnote:' + newIdSelector + ']');
                        $(newIdSelector.replace('#','') + ' textarea').html(content);
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
