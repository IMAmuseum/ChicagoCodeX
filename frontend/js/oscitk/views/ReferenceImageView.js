OsciTk.views.ReferenceImage = OsciTk.views.BaseView.extend({
	id: 'referenceImage',
	template: OsciTk.templateManager.get('aic-reference-image'),
	events: {'click': 'fullscreen'},
	initialize: function() {
		this.imageUrl = null;
		this.refUrl = null;

		this.listenTo(Backbone, 'referenceImageLoaded', function(options) {
			this.imageUrl = options.imageUrl;
			this.refUrl = options.refUrl;
			this.section_id = options.section_id;
			this.figure_index = options.figure_index;
			this.render();
		});
	},
	render: function() {
		//if there's a reference image
		if (this.refUrl !== "") {
			this.$el.html(this.template({
				imageUrl: this.refUrl,
				figure_id: this.figure_id
			})).show();
		} else {
			//otherwise check if there's a plate image to use
			if (this.imageUrl === "") {
				this.$el.hide();
			} else {
				this.$el.html(this.template({
					imageUrl: this.imageUrl,
					figure_id: this.figure_id
				})).show();
			}
		}
	},
	fullscreen: function() {
		var url = app.config.get("baseUrl") + '/figure/window/' + this.section_id + '/0';
		//if it's always 0, then do we need all this? replacing with above for now 9/5/2014
		/*var url = app.config.get("baseUrl") + '/figure/window/' + this.section_id;
		if (this.figure_index) {
			url += '/' + this.figure_index; 
			
		}*/
		window.open(url);
	}
});