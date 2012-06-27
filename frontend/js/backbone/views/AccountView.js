// Aic Namespace Initialization //
if (typeof Aic === 'undefined'){Aic = {};}
if (typeof Aic.views === 'undefined'){Aic.views = {};}
// Aic Namespace Initialization //

Aic.views.Account = OsciTk.views.BaseView.extend({
	id: 'toolbar-item-account',
	click: function(e) {
		var content;
		var destination = window.location.pathname.substring(1) + window.location.hash;
		
		// determine content based on login status
		if (parseInt(app.account.id, 10) > 0) {
			// user logged in
			content = '<a href="/user/logout?destination=' + destination + '">Log Out</a>';
		}
		else {
			// no current user
			content = '<a href="/user?destination=' + destination + '">Please Log In</a>';
		}
		
		// set up the tooltip, show immediately
		$('.Account-toolbar-item').qtip('destroy').qtip({
			content: content,
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
			},
			hide: {
				fixed: true,
				delay: 500
			}
		});
	}
});