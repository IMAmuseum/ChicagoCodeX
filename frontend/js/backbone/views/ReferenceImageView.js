// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.ReferenceImage = OsciTk.views.BaseView.extend({
	id: 'referenceImage',
	template: OsciTk.templateManager.get('reference-image'),
	initialize: function() {
		this.imageUrl = null;
		
		app.dispatcher.on('figuresLoaded', function(figures) {
			for (var i=0; i < figures.models.length; i++) {
				var content = $(figures.models[i].get('rawData'));
				// look for an image first, simple to handle
				var img = content.find('img');
				if (img.length > 0) {
					this.imageUrl = img.attr('src');
					this.render();
					app.dispatcher.trigger('referenceImageLoaded', this);
					break;
				}
				// look for a figure with a preview url next
				// TODO: finish parsing previewUri from figure options and use that if available				
//				var figure = content.find('figure');
//				if (figure.length > 0) {
//					var options = JSON.parse(figure.attr('data-options'));
//					if (options.previewUri) {
//				
//					}
//				}
			}
		}, this);
	},
	render: function() {
		this.$el.html(this.template({
			destination: this.imageUrl,
			navTree: this.navTree
		}));
	}
});