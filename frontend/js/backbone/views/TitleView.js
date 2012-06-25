// OsciTk Namespace Initialization //
if (typeof OsciTk === 'undefined'){OsciTk = {};}
if (typeof OsciTk.views === 'undefined'){OsciTk.views = {};}
// OsciTk Namespace Initialization //

OsciTk.views.Title = OsciTk.views.BaseView.extend({
	id: 'title-view',
	template: OsciTk.templateManager.get('title'),
	initialize: function() {
		app.dispatcher.on('routedToSection', function(params) {
			// load the section provided, or the first one if none provided
			var section;
			if (typeof(params.section_id) === 'undefined') {
				section = app.collections.navigationItems.at(0);
			}
			else {
				section = app.collections.navigationItems.where({id: params.section_id})[0];
			}
			this.$el.find('#section-title').text(section.get('title'));
			
		}, this);

		this.render();
	},
	render: function() {
		this.$el.html(this.template());
		return this;
	},
	events: {
		"click #section-title": function(e) {
			e.preventDefault();
			app.dispatcher.trigger('navigate', {identifier: "start"});
		}
	}
});