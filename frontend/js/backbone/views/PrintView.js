// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.Print = OsciTk.views.BaseView.extend({
	id: 'toolbar-item-print',
	click: function(e) {
		$('.Print-toolbar-item').qtip('destroy').qtip({
			content: "Print functionality is still in development",
			show: { 
				event: '',
				ready: true
			},
			position: {
				my: 'top center',
				at: 'bottom center'
			},
			style: {
				classes: 'ui-tooltip-toolbar'
			}
		});
	}
});