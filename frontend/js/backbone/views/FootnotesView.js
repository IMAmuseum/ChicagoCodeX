// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.Footnotes = OsciTk.views.BaseView.extend({
	id: 'footnotes',
	template: OsciTk.templateManager.get('footnotes'),
	initialize: function() {
		this.isOpen = false;

		// draw the footnotes ui only if footnotes become available
		app.dispatcher.on('footnotesLoaded', function(footnotes) 
		{
			this.render();
		}, this);

		// close the drawer when requested
		app.dispatcher.on('drawersClose', function(caller) {
			if (caller !== this) {
				this.closeDrawer();
			}
		}, this);

		// move the drawer handle when a UI shift happens
		app.dispatcher.on('uiShift', function(params) {
			if (params.caller != this) {
				if (typeof(params.x) !== 'undefined') {
					// move the content bar handle
					var handle = this.$el.find('#footnotes-handle');
					var left = parseInt(handle.css('left'), 10);
					handle.animate({
						left: (left + params.x) + 'px'
					});
				}
			}
		}, this);

		// bind handle to toggle drawer
		this.$el.find('#footnotes-handle').on('click', this, function(event) {
			var $this = event.data;
			$this.toggleDrawer();
		});
	},
	render: function() {
		this.$el.css('display', 'block');
		this.$el.html(this.template());
	},
	toggleDrawer: function() {
		console.log('toggle');
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