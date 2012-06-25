// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.TextReduce = OsciTk.views.BaseView.extend({
	id: 'toolbar-item-textReduce',
	initialize: function() {
		if (app.config.get('currentFontSize') === undefined) {
			app.config.set('currentFontSize', 100);
		}
	},
	render: function() {
		app.config.set('currentFontSize', app.config.get('currentFontSize') - 25);
		app.views.sectionView.$el.css({
			'font-size': app.config.get('currentFontSize') + '%'
		});
		app.dispatcher.trigger("windowResized");
	}
});