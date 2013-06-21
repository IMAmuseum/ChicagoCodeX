OsciTk.views.Print = OsciTk.views.BaseView.extend({
	id: 'toolbar-item-print',
	click: function(e) {
		var pubId = app.models.docPackage.getPubId();
        window.location = app.config.get("baseUrl") + "/api/epub/" + pubId + "/print_view";
	}
});