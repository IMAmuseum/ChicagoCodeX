OsciTk.views.ReferenceImage = OsciTk.views.BaseView.extend({
	id: 'referenceImage',
	template: OsciTk.templateManager.get('aic-reference-image'),
	initialize: function() {
		this.imageUrl = null;
		this.figureId = null;
		this.sectionUrl = null;
		
		app.dispatcher.on('figuresLoaded', function(figures) {
			for (var i=0; i < figures.models.length; i++) {
				var content = $(figures.models[i].get('rawData'));
				// look for an image first, simple to handle
				var img = content.find('img');
				if (img.length > 0) {
					this.imageUrl = this.sectionImageUrl = img.attr('src');
					this.figure_id = figures.models[i].id;
					this.render();
					app.dispatcher.trigger('referenceImageLoaded', this);
					break;
				}
			}
		}, this);

		// change the image when requested
		app.dispatcher.on('referenceImageChange', function(url) {
			this.imageUrl = url;
			this.render();
		}, this);

		// restore the original image set by the figuresLoaded event
		app.dispatcher.on('referenceImageRestore', function() {
			this.imageUrl = this.sectionImageUrl;
			this.render();
		}, this);
	},
	events: {
		'click': 'onClick'
	},
	render: function() {
		this.$el.html(this.template({
			destination: this.imageUrl,
			figure_id: this.figure_id
		}));
	},
	onClick: function() {
		// make the figure view full screen
		var figure_id = this.$el.find('img').attr('data-figure_id');
		var figureView = app.views.figures[figure_id];
		if (figureView && figureView.fullscreen) {
			figureView.fullscreen();
		}
		return false;
	}
});