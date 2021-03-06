OsciTk.views.PersistentNotesView = OsciTk.views.BaseView.extend({
    id: 'persistent-notes',
    template: OsciTk.templateManager.get('aic-persistent-notes'),
    initialize: function() {
        this.notesToRender = [];
        this.page = 0;

        // when the page changes, display any notes for paragraphs on this page
        this.listenTo(Backbone, 'pageChanged', function(params) {
            this.page = params.page;
            this.render();
        });

        // when the notes collection changes, re-render
        this.listenTo(app.collections.notes, 'change', this.render);
    },
    events: {
        'click .note'     : 'onClick',
        'mouseenter .note': 'onMouseEnter',
        'mouseleave .note': 'onMouseLeave',
        'click .note-edit': 'onEditClick',
        'click .note-delete': 'onDeleteClick'
    },
    render: function() {
        // clear the notesToRender array
        this.notesToRender = [];
        // find the element for this page number
        var page = app.views.sectionView.$el.find('.page-num-' + this.page);
        // check the elements content for our note's content id
        _.each(app.collections.notes.models, function(note) {
            var para = page.find('[data-osci_content_id="' + note.get('content_id') + '"]');
            if (para.length > 0) {
                // found, add this notes to the render array
                this.notesToRender.push(note);
            }
        }, this);

        this.$el.html(this.template({notes: this.notesToRender}));
    },
    onClick: function(e) {
        // expand note
        var note = $(e.currentTarget);
        note.toggleClass("expand");
    },
    onEditClick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        var note = $(e.currentTarget).parents('.note');
        var contentId = note.attr('data-osci_content_id');
        note.toggleClass("expand");
        Backbone.trigger('toggleNoteDialog', {contentId: contentId});
    },
    onDeleteClick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        var noteDiv = $(e.currentTarget).parents('.note');
        var noteId = noteDiv.attr('data-osci_note_id');
        var that = this;
        var note = app.collections.notes.get(noteId);
        console.log(note);

        $.ajax({
            url: app.config.get('endpoints').OsciTkNote,
            data: {
                section_id: note.get('section_id'),
                id: note.get('id'),
                content_id: note.get('content_id'),
                note: 'delete',
                'delete': 1
            },
            type: 'POST',
            dataType: 'json',
            success: function(data) {
                if (data.success === true) {
                    app.collections.notes.remove(note);
                    that.render();
                }
            }
        });
    },
    onMouseEnter: function(e) {
        // find the associate paragraph control and apply a hover class
        content_id = $(e.target).attr('data-osci_content_id');
        app.views.sectionView.$el.find('.paragraph-controls[data-osci_content_id="' + content_id + '"] span')
            .addClass('hovered');
    },
    onMouseLeave: function(e) {
        // find the associated paragraph control and remove the hover class
        content_id = $(e.target).attr('data-osci_content_id');
        app.views.sectionView.$el.find('.paragraph-controls[data-osci_content_id="' + content_id + '"] span')
            .removeClass('hovered');
    }
});
