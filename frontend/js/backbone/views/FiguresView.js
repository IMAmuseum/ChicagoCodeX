// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.Figures = OsciTk.views.BaseView.extend({
	id: 'figures',
	template: OsciTk.templateManager.get('figures'),
	initialize: function() {
		this.isOpen = false;

		// draw the footnotes ui only if footnotes become available
		app.dispatcher.on('footnotesLoaded', function(footnotes)
		{
			this.render();

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

			// bind handle to toggle drawer
			this.$el.find('#footnotes-handle').on('click', this, function(event) {
				console.log(event, 'event');
				var $this = event.data;
				$this.toggleDrawer();
			});
		}, this);
	},
	render: function() {
		this.$el.css('display', 'block');
		this.$el.html(this.template());
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
		this.$el.animate({
			height: '300px'
		},
		{
			step: function() {
				$(this).css("overflow","visible");
			},
			complete: function() {
				$(this).css("overflow","visible");
			}
		});
		this.isOpen = true;
	},
	closeDrawer: function() {
		this.$el.animate({
			height: '0'
		},
		{
			step: function() {
				$(this).css("overflow","visible");
			},
			complete: function() {
				$(this).css("overflow","visible");
			}
		});
		this.isOpen = false;
	}
	// className: 'figures-view',
	// template: OsciTk.templateManager.get('figures'),
	// initialize: function() {
	// 	// re-render this view when collection changes
	// 	app.collections.figures.on('add remove reset', function() {
	// 		console.log('rendering');	
	// 		this.render();
	// 	}, this);
	// },
	// events: {
	// 	"click .figure-preview": "onFigurePreviewClicked",
	// 	"click a.view-in-context": "onViewInContextClicked"
	// },
	// onFigurePreviewClicked: function(event_data) {
	// 	app.dispatcher.trigger('showFigureFullscreen', $(event_data.target).parent('figure').attr('data-figure-id'));
	// 	return false;
	// },
	// onViewInContextClicked: function(event_data) {
	// 	app.dispatcher.trigger('navigate', { identifier: $(event_data.target).parent('figure').attr('data-figure-id') });
	// 	app.views.toolbarView.contentClose();
	// 	return false;
	// },
	// active: function() {
	// 	var fig_data = app.collections.figures.toJSON();
	// 	// Set the width of the figure reel if there is more than one thumbnail
	// 	if (fig_data.length > 1) {
	// 		var thumbs = this.$el.find('figure.thumbnail');
	// 		this.$el.find('.figure-browser .figure-reel').width(thumbs.length * (thumbs.outerWidth(true)));
	// 	}
	// },
	// render: function() {
	// 	var fig_data = app.collections.figures.toJSON();
	// 	this.$el.html(this.template({figures: fig_data}));

	// 	// When the reader clicks on a figure thumbnail, show the preview for that figure...
	// 	this.$el.on('click', 'figure.thumbnail', {view: this},function(e) {
	// 		e.data.view.$el.find('.figure-browser').hide();
	// 		e.data.view.$el.find('.figure-previews figure.active').hide().removeClass('active');
	// 		var content = e.data.view.$el.find("figure.preview[data-figure-id='" + $(this).attr('data-figure-id') + "']");
	// 		content.show().addClass('active');
	// 		e.data.view.displayTitle();
	// 		e.data.view.$el.find('.figure-previews').show();
	// 		app.views.toolbarView.updateHeight();
	// 	});

	// 	// When going back to the grid, hide the current preview and replace the close button
	// 	this.$el.on('click', '.back-to-grid', {view: this}, function(e) {
	// 		e.data.view.$el.find('.figure-previews').hide();
	// 		e.data.view.$el.find('.figure-browser').show();
	// 		app.views.toolbarView.updateHeight();
	// 	});

	// 	this.$el.on('click', '.figure-nav.next', {view: this}, function(e) {
	// 		var new_fig = e.data.view.$el.find('figure.preview.active').hide().removeClass('active').next('figure.preview');
	// 		if (new_fig.length === 0) {
	// 			new_fig = e.data.view.$el.find('figure.preview').first();
	// 		}
	// 		new_fig.show().addClass('active');
	// 		e.data.view.displayTitle();
	// 	});

	// 	this.$el.on('click', '.figure-nav.prev', {view: this}, function(e) {
	// 		var new_fig = e.data.view.$el.find('figure.preview.active').hide().removeClass('active').prev('figure.preview');
	// 		if (new_fig.length === 0) {
	// 			new_fig = e.data.view.$el.find('figure.preview').last();
	// 		}
	// 		new_fig.show().addClass('active');
	// 		e.data.view.displayTitle();
	// 	});

	// 	return this;
	// },
	// displayTitle: function() {
	// 	var id = this.$el.find('figure.preview.active').attr('data-figure-id');
	// 	var figure = app.collections.figures.get(id);
	// 	this.$el.find('h2 span.title').html(figure.get('title'));
	// }
});