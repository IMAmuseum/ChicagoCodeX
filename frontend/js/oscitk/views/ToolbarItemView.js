OsciTk.views.ToolbarItem = OsciTk.views.BaseView.extend({
	className: 'toolbar-item',
	template: OsciTk.templateManager.get('toolbar-item'),
	initialize: function(options) {
		this.options = options;
		// add a class to this element based on view button uses
		this.$el.addClass(this.options.toolbarItem.view + '-toolbar-item');
	},
	events: {
		'click': 'itemClicked',
		'touch': 'itemClicked'
	},
	render: function() {
		this.contentView = new OsciTk.views[this.options.toolbarItem.view]({parent: this});
		this.$el.html(this.template({
			text: this.options.toolbarItem.text
		}));
	},
	itemClicked: function(e) {
		this.contentView.click(e);
	}
});