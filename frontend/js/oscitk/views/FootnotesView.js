OsciTk.views.Footnotes = OsciTk.views.BottomDrawerView.extend({
	id: 'footnotes',
	template: OsciTk.templateManager.get('aic-footnotes'),
	events: {
		"click .drawer-handle": "toggleDrawer",
		"click #footnotes-nav-next .footnotes-indicator": "onNextPageClicked",
		"click #footnotes-nav-prev .footnotes-indicator": "onPrevPageClicked"
	},
	initialize: function() {
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

		this._super('initialize');
	},
	render: function() {
		this.$el.css('display', 'block');
		var data = { footnotes: this.collection.models };
		this.$el.html(this.template(data));

		// set footnotes list width
		var containerWidth = this.$el.find('#footnotes-list-container').width();
		var listWidth = containerWidth * this.collection.length;
		this.$el.find('#footnotes-list').width(listWidth);
		this.$el.find('#footnotes-list li').width(containerWidth);

		this.setDrawerLastPosition();
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
	}
});