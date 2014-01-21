OsciTk.views.GlossaryTooltip = OsciTk.views.BaseView.extend({
    initialize: function() {
        this.listenTo(Backbone, 'layoutComplete', function() {
            if (app.collections.glossaryTerms.length !== 0) {
                $('.glossary-term').qtip({
                    content: {
                        title: ' ',
                        text: ' '
                    },
                    position: {
                        viewport: $(window)
                    },
                    style: {
                        classes: 'glossary-tooltip',
                        def: false,
                        width: app.views.sectionView.dimensions.columnWidth + 'px'
                    },
                    events: {
                        show: function(event, api) {
                            var tid = $(event.originalEvent.target).data('tid');
                            var item = app.collections.glossaryTerms.get(tid);
                            // set the tooltip contents
                            api.set('content.title', item.get('term'));
                            api.set('content.text', item.get('definition'));
                        }
                    }
                }).click(function(e) {
                    e.preventDefault();
                    e.stopPropogation();
                    app.views.glossaryView.selectTerm(e);
                });
            }
        });

        this.listenTo(Backbone, 'routedToSection', function(section) {
            $('.glossary-tooltip').qtip('destroy');
        });
    }
});