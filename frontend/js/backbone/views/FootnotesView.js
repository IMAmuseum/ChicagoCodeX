// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.Footnotes = OsciTk.views.BaseView.extend({
	id: 'footnotes',
	template: OsciTk.templateManager.get('footnotes'),
	events: {
		"click #footnotes-handle": "toggleDrawer",
		"click #footnotes-nav-next .footnotes-indicator": "onNextPageClicked",
		"click #footnotes-nav-prev .footnotes-indicator": "onPrevPageClicked"
	},
	initialize: function() {
		this.isOpen = false;
		this.collection = app.collections.footnotes;
		this.page = 1;

		// draw the footnotes ui only if footnotes become available
		app.dispatcher.on('footnotesLoaded', function(footnotes) {
			// re-render this view when collection changes
			this.collection.on('add remove reset', function() {
				this.render();
			}, this);
			
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
		if (this.page < this.maxPage) {
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
	toggleDrawer: function() {
		if (this.isOpen) {
			// close drawer
			this.closeDrawer();
		}
		else {
			// open drawer
			this.openDrawer();
		}
	},
	openDrawer: function() {
		// tell toc to close
		app.dispatcher.trigger('tocClose');
		this.$el.find('#footnotes-content').animate({
			height: '300px'
		});
		this.isOpen = true;
	},
	closeDrawer: function() {
		this.$el.find('#footnotes-content').animate({
			height: '0'
		});
		this.isOpen = false;
	}
});