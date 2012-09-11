OsciTk.views.TextReduce = OsciTk.views.BaseView.extend({
	id: 'toolbar-item-textReduce',
	initialize: function() {
		if (app.config.get('currentFontSize') === undefined) {
			app.config.set('currentFontSize', 100);
		}
	},
	click: function(e) {
		app.config.set('currentFontSize', app.config.get('currentFontSize') - 25);
		app.views.sectionView.$el.css({
			'font-size': app.config.get('currentFontSize') + '%'
		});
		app.dispatcher.trigger("windowResized");
	}
});