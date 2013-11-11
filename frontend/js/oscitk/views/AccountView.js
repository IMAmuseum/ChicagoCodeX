OsciTk.views.Account = OsciTk.views.BaseView.extend({
	id: 'toolbar-item-account',
	template: OsciTk.templateManager.get('aic-login'),
	click: function(e) {
		
		var content;
		var destination = window.location.pathname.substring(1) + window.location.hash;
		
		// determine content based on login status
		if (parseInt(app.account.id, 10) > 0) {
			// user logged in
			content = 'Welcome, <span class="cap">' + app.account.get('username') + '</span>' +
				' - <a href="/user/logout?destination=' + destination + '">Log Out</a>';
		}
		else {
			// no current user
			content = this.template();
		}
		// set up the tooltip, show immediately
		$('.Account-toolbar-item').qtip({
			prerender: true,
			content: content,
			show: { 
				event: false,
				ready: true
			},
			position: {
				my: 'top center',
				at: 'bottom center'
			},
			style: {
				classes: 'ui-tooltip-toolbar ui-tooltip-toolbar-login'
			},
			hide: {
				fixed: true,
				event: 'unfocus'
			}
		});

		// if the login form is shown, capture the form submission
		$(document).delegate('#loginSubmit', 'click', function(e) {
			$('#loginError').empty();
			// attempt to log in
			$.ajax({
				url: '/api/users',
				type: 'POST',
				data: {
					'action': 'login',
					'username': $('#loginUsername').val(),
					'password': $('#loginPassword').val()
				},
				dataType: 'json',
				success: function(data, textStatus) {
					if (!data.success) {
						$('#loginError').html('Error: ' + data.error);
					}
					else {
						window.location.reload();
					}
				},
				error: function(data, textStatus) {
					$('#loginError').html('Sorry, could not contact the server');
				}
			});
		});
	}
});