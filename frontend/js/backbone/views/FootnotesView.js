// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.Footnotes = OsciTk.views.BaseView.extend({
	id: 'footnotes',
	template: OsciTk.templateManager.get('footnotes'),
	initialize: function() {
		this.isOpen = false;
		this.collection = app.collections.footnotes;
		this.page = 1;

		// draw the footnotes ui only if footnotes become available
		app.dispatcher.on('footnotesLoaded', function(footnotes) {
			this.render();
		}, this);

		// close the drawer when requested
		app.dispatcher.on('drawersClose', function(caller) {
			if (caller !== this) {
				this.closeDrawer();
			}
		}, this);

		// move the drawer handle when a UI shift happens
		app.dispatcher.on('uiShift', function(params) {
			if (params.caller != this) {
				if (typeof(params.x) !== 'undefined') {
					// move the content bar handle
					var handle = this.$el.find('#footnotes-handle');
					var left = parseInt(handle.css('left'), 10);
					handle.animate({
						left: (left + params.x) + 'px'
					});
				}
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

		// bind handle to toggle drawer
		this.$el.find('#footnotes-handle').on('click', this, function(event) {
			var $this = event.data;
			$this.toggleDrawer();
		});

		// bind previous button
		this.$el.find('#footnotes-nav-prev .footnotes-indicator').on('click', this, function(event) {
			var $this = event.data;
			if ($this.page > 1) {
				$this.page--;
				$this.translateToPage();
			}
		});

		// bind next button
		this.$el.find('#footnotes-nav-next .footnotes-indicator').on('click', this, function(event) {
			var $this = event.data;
			if ($this.page < $this.collection.length) {
				$this.page++;
				$this.translateToPage();
			}
		});
	},
	translateToPage: function() {
		var width = this.$el.find('#footnotes-list-container').width();
		var list = this.$el.find('#footnotes-list');
		var pos = -(width * (this.page - 1));

		list.css({
			'-webkit-transform': 'translate3d(' + pos + 'px, 0px, 0px)'
		});
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
		// tell other drawers to close
		app.dispatcher.trigger('drawersClose', this);
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