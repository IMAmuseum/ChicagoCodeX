OsciTk.views.Account = OsciTk.views.BaseView.extend({
	id: 'toolbar-item-account',
	template: OsciTk.templateManager.get('aic-login'),
	loggedInTemplate: OsciTk.templateManager.get('aic-profile'),
	initialize: function() {
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
						$('#loginError').html('Error: ' + data.error).show();
					}
					else {
						window.location.reload();
					}
				},
				error: function(data, textStatus) {
					$('#loginError').html('Sorry, could not contact the server').show();
				}
			});
		});

		$(document).delegate('#registerSubmit', 'click', function(e) {
			$('#registerError').empty();
			// attempt to log in
			$.ajax({
				url: app.config.get('endpoints').OsciTkAccount,
				type: 'POST',
				data: {
					'action': 'register',
					'username': $('#registerUsername').val(),
					'password': $('#registerPassword').val(),
					'email': $('#registerEmail').val()
				},
				dataType: 'json',
				success: function(data, textStatus) {
					if (!data.success) {
						$('#registerError').html('Error: ' + data.error).show();
					}
					else {
						window.location.reload();
					}
				},
				error: function(data, textStatus) {
					$('#registerError').html('Sorry, could not contact the server').show();
				}
			});
		});

		$(document).delegate('a.loginToggle', 'click', function(e) {
			e.preventDefault();
			e.stopPropagation();

			$this = $(e.target);
			var showForm = $this.attr("href");

			$this.addClass("active");
			$(showForm).show();

			switch(showForm) {
				case '#loginForm':
					$('#registerForm').hide();
					$('#showRegisterForm').removeClass("active");
					break;
				case '#registerForm':
					$('#loginForm').hide();
					$('#showLoginForm').removeClass("active");
					break;
			}
		});

		$(document).delegate('a.logout', 'click', function(e) {
			e.preventDefault();
			e.stopPropagation();

			$this = $(e.target);
			var logoutUrl = $this.attr("href");

			$.ajax({
				url: app.config.get('endpoints').OsciTkAccount,
				type: 'POST',
				data: {
					'action': 'logout'
				},
				dataType: 'json',
				success: function(data, textStatus) {
					window.location.reload();
				},
				error: function(data, textStatus) {
					$('#logoutError').html('Sorry, could not contact the server').show();
				}
			});
		});
	},
	click: function(e) {

		var content;
		var destination = window.location.pathname.substring(1) + window.location.hash;

		// determine content based on login status
		if (parseInt(app.account.id, 10) > 0) {
			// user logged in
			content = this.loggedInTemplate({
				'username': app.account.get('username'),
				'noteExportUrl': app.config.get('endpoints').OsciTkNote + 'export'
			});
		}
		else {
			// no current user
			content = this.template();
		}
		$('.ui-tooltip-toolbar-login').qtip("destroy");
		// set up the tooltip, show immediately
		$('.Account-toolbar-item').qtip({
			prerender: true,
			content: content,
			show: {
				event: false,
				ready: true,
				solo: true
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
	}
});