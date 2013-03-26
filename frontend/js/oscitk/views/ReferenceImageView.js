OsciTk.views.ReferenceImage = OsciTk.views.BaseView.extend({
	id: 'referenceImage',
	template: OsciTk.templateManager.get('aic-reference-image'),
	initialize: function() {
		this.imageUrl = null;

		this.listenTo(Backbone, 'referenceImageLoaded', function(options) {
			this.imageUrl = options.imageUrl;
			this.render();
		});
	},
	render: function() {
		this.$el.html(this.template({
			imageUrl: this.imageUrl,
			figure_id: this.figure_id
		}));
	}
});