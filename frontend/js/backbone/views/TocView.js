// Aic Namespace Initialization //
if (typeof OsciTk === 'undefined'){OsciTk = {};}
if (typeof OsciTk.views === 'undefined'){OsciTk.views = {};}
// Aic Namespace Initialization //

Aic.views.Toc = OsciTk.views.BaseView.extend({
	id: 'toc-view',
	template: OsciTk.templateManager.get('toc'),
	initialize: function() {
		this.isOpen = false;
		this.$el.addClass('closed');
		app.dispatcher.on('referenceImageLoaded', function(referenceImageView) {
			this.referenceImageUrl = referenceImageView.imageUrl;
			this.render();
		}, this);
	},
	render: function() {
		this.$el.html(this.template({
			referenceImageUrl: this.referenceImageUrl
		}));
		// bind handle to open/close panel
		this.$el.find('#toc-handle').on('click', this, function(e) {
			e.data.switchDrawer(); 
		});
	},
	switchDrawer: function() {
		if (this.isOpen) {
			this.$el.animate({ left: '-180px' });
			this.isOpen = false;
		}
		else {
			this.$el.animate({ left: '0px'});
			this.isOpen = true;
		}
	}
});