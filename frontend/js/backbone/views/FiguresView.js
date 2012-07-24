// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.Figures = OsciTk.views.BaseView.extend({
	id: 'figures',
	template: OsciTk.templateManager.get('figures'),
	initialize: function() {
		this.isOpen = false;
		this.collection = app.collections.figures;
		this.page = 1;
		this.maxPage = 1;

		// draw the figures ui only if figures become available
		app.dispatcher.on('figuresLoaded', function(figures) {
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
					var handle = this.$el.find('#figures-handle');
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
		var data = { figures: this.collection.models };
		this.$el.html(this.template(data));

		// set figures list width
		var itemWidth = this.$el.find('#figures-list li').outerWidth();
		var itemCount = this.collection.length;
		this.$el.find('#figures-list').width(itemWidth * itemCount);
		
		// justify contents across container width
		var containerWidth = this.$el.find('#figures-list-container').width();
		var numToFit = Math.floor(containerWidth / itemWidth);
		var paddingToAdd = (containerWidth - (numToFit * itemWidth)) / numToFit;
		var currentPadding = parseInt(this.$el.find('#figures-list li').css('padding-left'), 10) * 2;
		var newPadding = (currentPadding + paddingToAdd) / 2;
		this.$el.find('#figures-list li').css({
			'padding-left': newPadding + 'px',
			'padding-right': newPadding + 'px'
		});

		// css has changed, get item width again
		itemWidth = this.$el.find('#figures-list li').outerWidth();
		
		// reset list length now that padding has been added
		this.$el.find('#figures-list').width(itemWidth * itemCount);

		// set the max page value
		this.maxPage = Math.ceil((itemWidth * itemCount) / containerWidth);
		
		// bind handle to toggle drawer
		this.$el.find('#figures-handle').on('click', this, function(event) {
			var $this = event.data;
			$this.toggleDrawer();
		});

		// bind previous button
		this.$el.find('#figures-nav-prev .figures-indicator').on('click', this, function(event) {
			var $this = event.data;
			if ($this.page > 1) {
				$this.page--;
				$this.translateToPage();
			}
		});

		// bind next button
		this.$el.find('#figures-nav-next .figures-indicator').on('click', this, function(event) {
			var $this = event.data;
			if ($this.page < $this.maxPage) {
				$this.page++;
				$this.translateToPage();
			}
		});
	},
	translateToPage: function() {
		var width = this.$el.find('#figures-list-container').width();
		var list = this.$el.find('#figures-list');
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
		this.$el.find('#figures-content').animate({
			height: '300px'
		});
		this.isOpen = true;
	},
	closeDrawer: function() {
		this.$el.find('#figures-content').animate({
			height: '0'
		});
		this.isOpen = false;
	}
});