// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.Figures = OsciTk.views.BaseView.extend({
	id: 'figures',
	template: OsciTk.templateManager.get('figures'),
	events: {
		"click #figures-handle": "toggleDrawer",
		"click .figure-preview": "onFigurePreviewClicked",
		"click a.view-in-context": "onViewInContextClicked",
		"click #figures-nav-next .figures-indicator": "onNextPageClicked",
		"click #figures-nav-prev .figures-indicator": "onPrevPageClicked"
	},
	initialize: function() {
		this.isOpen = false;
		this.isActive = false;
		this.collection = app.collections.figures;
		this.page = 1;
		this.maxPage = 1;

		// draw the figures ui only if figures become available
		app.dispatcher.on('figuresLoaded', function(figures) {
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
			var handle = this.$el.find('#figures-handle');
			var left = parseInt(handle.css('left'), 10);
			handle.animate({'left': (left + 200) + 'px'});
		}, this);
		app.dispatcher.on('tocClosing', function() {
			var handle = this.$el.find('#figures-handle');
			var left = parseInt(handle.css('left'), 10);
			handle.animate({'left': (left - 200) + 'px'});
		}, this);

		app.dispatcher.on("windowResized", function() {
			this.render();
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
		var leftPadding = parseInt(this.$el.find('#figures-list li').css('padding-left'), 10);
		var rightPadding = parseInt(this.$el.find('#figures-list li').css('padding-right'), 10);
		var currentPadding = leftPadding + rightPadding;
		var newPadding = Math.floor((currentPadding + paddingToAdd) / 2);
		var extra = 0;
		if ((newPadding * 2) < (currentPadding + paddingToAdd)) {
			extra = ((currentPadding + paddingToAdd) - (newPadding * 2)) * numToFit;
		}
		this.$el.find('#figures-list li').css({
			'padding-left': newPadding + 'px',
			'padding-right': newPadding + 'px'
		});
		this.$el.find('#figures-list li:nth-child('+numToFit+'n+'+numToFit+')').css({
			'padding-right': newPadding + extra + 'px'
		});

		// item width has changed, get it again
		itemWidth = this.$el.find('#figures-list li').outerWidth();
		
		// reset list width now that padding has been added
		this.$el.find('#figures-list').width((itemWidth + paddingToAdd) * itemCount);

		// set the max page value
		this.maxPage = Math.ceil((itemWidth * itemCount) / containerWidth);
	},
	onFigurePreviewClicked: function(event_data) {
		app.dispatcher.trigger('showFigureFullscreen', $(event_data.target).parent('figure').attr('data-figure-id'));
		return false;
	},
	onViewInContextClicked: function(event_data) {
		app.dispatcher.trigger('navigate', { identifier: $(event_data.target).parent('figure').attr('data-figure-id') });
		this.closeDrawer();
		return false;
	},
	translateToPage: function() {
		var width = this.$el.find('#figures-list-container').width();
		var list = this.$el.find('#figures-list');
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
			if (this.isActive) {
				// close drawer
				app.dispatcher.trigger('tabClosing', this);
				this.closeDrawer();
			}
			else {
				// make active
				this.setActive();
			}
		}
		else {
			// open drawer and make active
			app.dispatcher.trigger('tabOpening', this);
			this.openDrawer();
			this.setActive();
		}
	},
	openDrawer: function() {
		// tell toc drawer to close
		app.dispatcher.trigger('tocClose');
		this.$el.find('#figures-content').animate({
			height: '300px'
		});
		this.isOpen = true;
	},
	closeDrawer: function() {
		var $this = this;
		this.$el.find('#figures-content').animate({
			height: '0'
		}, null, null, function() {
			$this.setInactive();
		});
		this.isOpen = false;
	},
	setActive: function() {
		app.dispatcher.trigger('tabActive', this);
		this.$el.css({'z-index': '101'});
		this.isActive = true;
	},
	setInactive: function() {
		this.$el.css({'z-index': '100'});
		this.isActive = false;
	}
});