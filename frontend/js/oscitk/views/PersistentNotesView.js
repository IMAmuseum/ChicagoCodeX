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
        'mouseleave .note': 'onMouseLeave'
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
        // trigger the note popup window for this note
        var note = $(e.currentTarget);
        var contentId = note.attr('data-osci_content_id');
        Backbone.trigger('toggleNoteDialog', {contentId: contentId});
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
