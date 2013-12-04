OsciTk.views.Footnotes = OsciTk.views.BottomDrawerView.extend({
    id: 'footnotes',
    template: OsciTk.templateManager.get('aic-footnotes'),
    events: {
        "click .drawer-handle": "toggleDrawer",
        "click #footnotes-nav-next .footnotes-indicator": "onNextPageClicked",
        "click #footnotes-nav-prev .footnotes-indicator": "onPrevPageClicked",
        "click a.view-in-context": "onViewInContextClicked"
    },
    initialize: function() {
        this._super('initialize');
        this.collection = app.collections.footnotes;
        this.page = 1;

        // draw the footnotes ui only if footnotes become available
        this.listenTo(Backbone, 'footnotesLoaded', function(footnotes) {
            this.render();
        });

        // re-render this view when collection changes
        this.listenTo(this.collection, 'add remove reset', function() {
            this.render();
        });

        // listen for section layout complete, and link footnotes to drawer action
        this.listenTo(Backbone, 'layoutComplete', function(meta) {
            var i,
                that = this,
                refs = app.views.sectionView.$el.find('.footnote-reference');
            for (i = 0; i < refs.length; i++) {
                var ref = $(refs[i]);
                ref.off('click');
                ref.bind('click', {'caller': this}, this.onFootnoteRefClicked);
            }
        });
    },
    render: function() {
        if (this.collection.length === 0) {
            this.$el.hide();
            this.setDrawerHandlePosition();
            return;
        }

        this.$el.css('display', 'block');
        var data = { footnotes: this.collection.models };
        this.$el.html(this.template(data));

        // set footnotes list width
        var containerWidth = this.$el.find('#footnotes-list-container').width();
        var listWidth = containerWidth * this.collection.length;
        this.$el.find('#footnotes-list').width(listWidth);
        this.$el.find('#footnotes-list li').outerWidth(containerWidth);

        this.setDrawerLastPosition();
        this.setDrawerHandlePosition();
    },
    translateToPage: function() {
        var width = this.$el.find('#footnotes-list-container').width();
        var list = this.$el.find('#footnotes-list');
        var pos = -(width * (this.page - 1));
        list.css({
            '-webkit-transition-duration': '400ms',
            '-moz-transition-duration': '400ms',
            '-ms-transition-duration': '400ms',
            '-o-transition-duration': '400ms',
            'transition-duration': '400ms',
            '-webkit-transform': 'translate3d(' + pos + 'px, 0px, 0px)',
            '-moz-transform': 'translate3d(' + pos + 'px, 0px, 0px)',
            '-ms-transform': 'translate3d(' + pos + 'px, 0px, 0px)',
            '-o-transform': 'translate3d(' + pos + 'px, 0px, 0px)',
            'transform': 'translate3d(' + pos + 'px, 0px, 0px)'
        });
    },
    onNextPageClicked: function() {
        if (this.page < this.collection.length) {
            this.page++;
            this.translateToPage();
        }
    },
    onPrevPageClicked: function() {
        if (this.page > 1) {
            this.page--;
            this.translateToPage();
        }
    },
    onFootnoteRefClicked: function(event) {
        event.preventDefault();
        var matches = event.target.hash.match(/#(fn-\d+-\d+)/);
        var id = matches[1];
        event.data.caller.navigateTo(id);
    },
    navigateTo: function(id) {
        // open drawer and make active
        if (!this.isOpen) this.openDrawer();
        if (!this.isActive) this.setActive();

        // figure out which page this footnote is on based on delta
        var delta = parseInt(app.collections.footnotes.get(id).get('delta'), 10);
        this.page = delta + 1;
        this.translateToPage();
    },
    onViewInContextClicked: function(event_data) {
        event_data.preventDefault();
        // find the footnote identifier
        var footId = $(event_data.target).attr('data-footnote-id');
        // find the reference elements that match this footId
        var footRefs = app.views.sectionView.$el.find('a.footnote-reference[href="#'+footId+'"]');

        // determine which of these elements are currently visible
        var visibleRefs = [];
        _.each(footRefs, function(footRef) {
            var visible = app.views.sectionView.isElementVisible(footRef);
            if (visible) {
                visibleRefs.push(footRef);
            }
        }, this);

        if (visibleRefs.length > 0) {
            // navigate to the first instance and highlight
            this.navigateAndHighlightRef(footId, visibleRefs);
        }
        return false;
    },
    navigateAndHighlightRef: function(identifier, visibleRefs) {
        // navigate to figure reference
        Backbone.trigger('navigate', { identifier: identifier });

        var ref = $(visibleRefs).first();
        Backbone.trigger('drawersClose');
        this.pulsateText(ref);
    },
    pulsateText: function(element) {
        var offset = element.offset(),
            width = element.width(),
            temp = $("<div>", {
                css : {
                    "position": "absolute",
                    "top": (offset.top - 90) + "px",
                    "left": offset.left - 160 + (width / 2) + "px",
                    "margin": 0,
                    "width": "80px",
                    "height": "80px",
                    "border": "6px solid #F00",
                    "border-radius" : "46px",
                    "-webkit-animation-duration" : "400ms",
                    "-moz-animation-duration": "400ms",
                    "-ms-animation-duration" : "400ms",
                    "-o-animation-duration" : "400ms",
                    "animation-duration" : "400ms",
                    "-webkit-animation-iteration-count" : "1",
                    "-moz-animation-iteration-count" : "1",
                    "-ms-animation-iteration-count" : "1",
                    "-o-animation-iteration-count" : "1",
                    "animation-iteration-count" : "1",
                    "-webkit-animation-name" : "pulse",
                    "-moz-animation-name" : "pulse",
                    "-ms-animation-name" : "pulse",
                    "-o-animation-name" : "pulse",
                    "animation-name" : "pulse",
                    "-webkit-animation-direction" : "normal",
                    "-moz-animation-direction" : "normal",
                    "-ms-animation-direction" : "normal",
                    "-o-animation-direction" : "normal",
                    "animation-direction" : "normal",
                    "-webkit-box-shadow": "0px 0px 10px #888",
                    "-moz-box-shadow": "0px 0px 10px #888",
                    "-ms-box-shadow": "0px 0px 10px #888",
                    "-o-box-shadow": "0px 0px 10px #888",
                    "box-shadow": "0px 0px 10px #888"
                }
            }).appendTo("#section");

        setTimeout(function(){temp.remove();}, 1100);
    }
});