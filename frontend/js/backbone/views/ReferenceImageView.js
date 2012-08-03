// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.ReferenceImage = OsciTk.views.BaseView.extend({
	id: 'referenceImage',
	template: OsciTk.templateManager.get('reference-image'),
	initialize: function() {
		this.imageUrl = null;
		this.sectionUrl = null;
		
		app.dispatcher.on('figuresLoaded', function(figures) {
			for (var i=0; i < figures.models.length; i++) {
				var content = $(figures.models[i].get('rawData'));
				// look for an image first, simple to handle
				var img = content.find('img');
				if (img.length > 0) {
					this.imageUrl = this.sectionImageUrl = img.attr('src');
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
			destination: this.imageUrl
		}));
	},
	onClick: function() {

	}
});