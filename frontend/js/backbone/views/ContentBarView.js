// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.ContentBar = OsciTk.views.BaseView.extend({
	id: 'content-bar',
	template: OsciTk.templateManager.get('content-bar'),
	initialize: function() {
		this.render();
	},
	render: function() {
		this.$el.html(this.template());
	}
});