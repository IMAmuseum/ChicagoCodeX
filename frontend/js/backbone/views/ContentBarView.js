// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.ContentBar = OsciTk.views.BaseView.extend({
	id: 'content-bar-wrapper',
	template: OsciTk.templateManager.get('content-bar'),
	initialize: function() {
		this.isOpen = false;
		
		app.dispatcher.on('figuresLoaded', function(figures) {
			console.log('draw a figures tab');
		}, this);

		app.dispatcher.on('footnotesLoaded', function(footnotes) {
			console.log('draw a footnotes tab');
		}, this);

		//this.render();
	},
	render: function() {
		this.$el.show();
		this.$el.html(this.template());

		// bind handle to toggle drawer
		this.$el.find('#content-bar-handle').on('click', this, function(event) {
			var $this = event.data;
			$this.toggleDrawer();
		});
	},
	toggleDrawer: function() {
		
	}
});