OsciTk.views.ReferenceImage = OsciTk.views.BaseView.extend({
	id: 'referenceImage',
	template: OsciTk.templateManager.get('aic-reference-image'),
	initialize: function() {
		this.imageUrl = null;
		this.figureId = null;
		this.sectionUrl = null;
		
		this.listenTo(Backbone, 'figuresLoaded', function(figures) {
			if (figures.models.length > 0) {
				var content = $(figures.models[0].get('rawData'));
				var img = content.find('img');
				if (img.length > 0) {
					this.imageUrl = this.sectionImageUrl = img.attr('src');
					this.figure_id = figures.models[0].id;
					Backbone.trigger('referenceImageLoaded', this);
				}
			}
			this.render();
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