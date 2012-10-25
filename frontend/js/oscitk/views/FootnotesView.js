OsciTk.views.Footnotes = OsciTk.views.BaseView.extend({
	id: 'footnotes',
	template: OsciTk.templateManager.get('aic-footnotes'),
	events: {
		"click #footnotes-handle": "toggleDrawer",
		"click #footnotes-nav-next .footnotes-indicator": "onNextPageClicked",
		"click #footnotes-nav-prev .footnotes-indicator": "onPrevPageClicked"
	},
	initialize: function() {
		this.isOpen = false;
		this.isActive = false;
		this.collection = app.collections.footnotes;
		this.page = 1;

		// draw the footnotes ui only if footnotes become available
		app.dispatcher.on('footnotesLoaded', function(footnotes) {
			this.render();
		}, this);

		// re-render this view when collection changes
		this.collection.on('add remove reset', function() {
			this.render();
		}, this);
		
		// close the drawer when requested
		app.dispatcher.on('drawersClose', function(caller) {
			if (caller !== this && this.isOpen === true) {
				this.closeDrawer();
			}
		}, this);

		// move the drawer handle when the table of contents opens or closes
		app.dispatcher.on('tocOpening', function() {
			var handle = this.$el.find('#footnotes-handle');
			var left = parseInt(handle.css('left'), 10);
			handle.animate({'left': (left + 200) + 'px'});
		}, this);
		
		app.dispatcher.on('tocClosing', function() {
			var handle = this.$el.find('#footnotes-handle');
			var left = parseInt(handle.css('left'), 10);
			handle.animate({'left': (left - 200) + 'px'});
		}, this);

		// listen for other tabs going active
		app.dispatcher.on('tabActive', function(caller) {
			if (caller !== this) {
				this.setInactive();
			}
		}, this);

		// listen for other tabs opening or closing
		app.dispatcher.on('tabOpening', function(caller) {
			if (caller !== this) {
				this.openDrawer();
			}
		}, this);
		app.dispatcher.on('tabClosing', function(caller) {
			if (caller !== this) {
				this.closeDrawer();
			}
		}, this);

		// listen for section layout complete, and link footnotes to drawer action
		app.dispatcher.on('layoutComplete', function(meta) {
			var i,
				that = this,
				refs = app.views.sectionView.$el.find('.footnote-reference');
			for (i = 0; i < refs.length; i++) {
				var ref = $(refs[i]);
				ref.off('click');
				ref.bind('click', {'caller': this}, this.onFootnoteRefClicked);
			}
		}, this);
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
	},
	translateToPage: function() {
		var width = this.$el.find('#footnotes-list-container').width();
		var list = this.$el.find('#footnotes-list');
		var pos = -(width * (this.page - 1));
		list.css({
			'-webkit-transform': 'translate3d(' + pos + 'px, 0px, 0px)'
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
	toggleDrawer: function() {
		if (this.isOpen) {
			if (this.isActive) {
				// close drawer
				this.closeDrawer();
			}
			else {
				// make active
				this.setActive();
			}
		}
		else {
			// open drawer and make active
			this.openDrawer();
			this.setActive();
		}
	},
	openDrawer: function() {
		// tell toc to close
		app.dispatcher.trigger('tocClose');
		app.dispatcher.trigger('tabOpening', this);
		this.$el.find('#footnotes-content').animate({
			height: '300px'
		});
		this.isOpen = true;
	},
	closeDrawer: function() {
		var $this = this;
		app.dispatcher.trigger('tabClosing', this);
		this.$el.find('#footnotes-content').animate({
			height: '0'
		}, null, null, function() {
			$this.setInactive();
		});
		this.isOpen = false;
	},
	setActive: function() {
		this.$el.css({'z-index': '101'});
		app.dispatcher.trigger('tabActive', this);
		this.isActive = true;
	},
	setInactive: function() {
		this.$el.css({'z-index': '100'});
		this.isActive = false;
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