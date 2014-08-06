OsciTk.views.Print = OsciTk.views.BaseView.extend({
	id: 'toolbar-item-print',
	click: function(e) {
		var pubId = app.models.docPackage.getPubId();
		var sectionId = app.models.section.get('id')
        window.location = app.config.get("baseUrl") + "/api/epub/" + pubId + "/" + sectionId + "/print_view";
	}
});