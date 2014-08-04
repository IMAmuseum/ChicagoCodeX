OsciTk.views.ReferenceImage = OsciTk.views.BaseView.extend({
	id: 'referenceImage',
	template: OsciTk.templateManager.get('aic-reference-image'),
	events: {'click': 'fullscreen'},
	initialize: function() {
		this.imageUrl = null;

		this.listenTo(Backbone, 'referenceImageLoaded', function(options) {
			this.imageUrl = options.imageUrl;
			this.section_id = options.section_id;
			this.figure_index = options.figure_index;
			this.render();
		});
	},
	render: function() {
		if (this.imageUrl === "") {
			this.$el.hide();
		} else {
			this.$el.html(this.template({
				imageUrl: this.imageUrl,
				figure_id: this.figure_id
			})).show();
		}
	},
	fullscreen: function() {
		var url = app.config.get("baseUrl") + '/figure/window/' + this.section_id;
		if (this.figure_index) {
			url += '/' + this.figure_index;
		}
		window.open(url);
	}
});