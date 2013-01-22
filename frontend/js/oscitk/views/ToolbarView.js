OsciTk.views.Toolbar = OsciTk.views.BaseView.extend({
	id: 'toolbar',
	template: OsciTk.templateManager.get('aic-toolbar'),
	initialize: function() {
		// if toolbar items were provided, store them in the view
		this.toolbarItems = app.config.get('toolbarItems') ? app.config.get('toolbarItems') : [];
		this.toolbarItemViews = [];
		this.render();
		
		// put publication title in place once it is available
		this.listenTo(Backbone, 'packageLoaded', function(docPackage) {
			var title = docPackage.get('metadata')['dc:title']['value'];
			this.$el.find('#toolbar-pub-title').html(title);
		});
	},
	render: function() {
		this.$el.html(this.template());
		_.each(this.toolbarItems, function(toolbarItem) {
			var item = new OsciTk.views.ToolbarItem({toolbarItem: toolbarItem});
			this.toolbarItemViews.push(item);
			this.addView(item, '#toolbar-items');
			item.render();
		}, this);
	}
});