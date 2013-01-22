OsciTk.views.ReferenceImage = OsciTk.views.BaseView.extend({
	id: 'referenceImage',
	template: OsciTk.templateManager.get('aic-reference-image'),
	initialize: function() {
		this.imageUrl = null;
		this.figureId = null;
		this.sectionUrl = null;
		
		this.listenTo(Backbone, 'figuresLoaded', function(figures) {
			for (var i=0; i < figures.models.length; i++) {
				var content = $(figures.models[i].get('rawData'));
				// look for an image first, simple to handle
				var img = content.find('img');
				if (img.length > 0) {
					this.imageUrl = this.sectionImageUrl = img.attr('src');
					this.figure_id = figures.models[i].id;
					this.render();
					Backbone.trigger('referenceImageLoaded', this);
					break;
				}
			}
		});

		// change the image when requested
		this.listenTo(Backbone, 'referenceImageChange', function(url) {
			this.imageUrl = url;
			this.render();
		});

		// restore the original image set by the figuresLoaded event
		this.listenTo(Backbone, 'referenceImageRestore', function() {
			this.imageUrl = this.sectionImageUrl;
			this.render();
		});
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