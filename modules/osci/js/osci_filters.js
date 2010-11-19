(function ($) {
    $(document).ready(function() {

/*
CKEDITOR.plugin.add('osci_filters', {
    init:   function(editor) {
        editor.ui.addButton('footnote', {
            label: 'Footnote',
            icon: this.path + 'footnote_edit.png',
            command: b
        });
    }
});
*/
        var editor = CKEDITOR.instances[Drupal.wysiwyg.activeId];

        editor.on('paste', function(evt) {
            var data    = $('<span>' + evt.data.html + '</span>');
            var anchors = [];
            $('a', data).each(function(idx, val) {
                anchors[idx] = val;
                var link = $(val);
                link.replaceWith('[footnote:' + idx + ']');
            }); 
            evt.data.html = data.html();
        });

    });
})(jQuery);
