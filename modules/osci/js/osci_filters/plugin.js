CKEDITOR.plugins.add('osci_filters', {
    init: function(editor) {
        // Footnote
        CKEDITOR.dialog.add('footnote', Drupal.settings.osci_filters.modulePath + '/js/dialogs/footnote.js');
        editor.addCommand('footnote', new CKEDITOR.dialogCommand('footnote'));
        editor.ui.addButton('footnote', {
            label: 'Footnote',
            icon: Drupal.settings.osci_filters.modulePath + '/images/footnote_edit.png',
            command: 'footnote'
        });
    }
});

