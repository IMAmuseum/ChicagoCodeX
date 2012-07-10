// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.ContentBar = OsciTk.views.BaseView.extend({
	id: 'content-bar',
	template: OsciTk.templateManager.get('content-bar'),
	initialize: function() {
		this.isOpen = false;
		
		app.dispatcher.on('figuresLoaded', function(figures) {
			console.log('draw a figures tab');
			this.render();
		}, this);

		app.dispatcher.on('footnotesLoaded', function(footnotes) {
			console.log('draw a footnotes tab');
			this.render();
		}, this);

		app.dispatcher.on('drawersClose', function(caller) {
			if (caller !== this) {
				this.closeDrawer();
			} 
		}, this);
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
		if (this.isOpen) {
			// close drawer
			this.closeDrawer();
		}
		else {
			// open drawer
			this.openDrawer();
		}
	},
	openDrawer: function() {
		// tell other drawers to close
		app.dispatcher.trigger('drawersClose', this);
		this.$el.animate({
			height: '300px'
		},
		{
			step: function() {
				$(this).css("overflow","visible");
			},
			complete: function() {
				$(this).css("overflow","visible");
			}
		});
		this.isOpen = true;
	},
	closeDrawer: function() {
		this.$el.animate({
			height: '0'
		},
		{
			step: function() {
				$(this).css("overflow","visible");
			},
			complete: function() {
				$(this).css("overflow","visible");
			}
		});
		this.isOpen = false;
	}
});