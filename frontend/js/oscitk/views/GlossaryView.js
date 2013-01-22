OsciTk.views.Glossary = OsciTk.views.BottomDrawerView.extend({
	id: 'glossary',
	template: OsciTk.templateManager.get('aic-glossary'),
	events: {
		'click .drawer-handle': 'toggleDrawer',
		'keyup #glossary-filter': 'filterTerms',
		'click #glossary-filter-clear': 'clearFilter',
		'click li': 'selectTerm'
	},
	initialize: function() {
		this.listenTo(Backbone, 'osci.glossary.loaded', function(glossary) {
			this.collection = glossary;
			this.render();
		});
		this._super('initialize');
	},
	render: function() {
		this.$el.css('display', 'block');
		this.$el.html(this.template({glossary: app.collections.glossaryTerms.models}));
	},
	filterTerms: function() {
		var keyword = $('#glossary-filter').val();

		var terms;
		if (_.isEmpty(keyword)) {
			terms = app.collections.glossaryTerms.models;
		} else {
			terms = app.collections.glossaryTerms.filterByKeyword(keyword);
		}

		// clear out list
		$('#glossary-term-listing').empty();

		// re-add terms to list
		_.each(terms, function(item) {
			var view = new Backbone.View();
			var el = view.make('li', {'data-tid': item.get('id')}, item.get('term'));
			$('#glossary-term-listing').append(el);
		});

		if (!$('#glossary-filter').val().length) {
			$('#glossary-filter-clear').hide();
		} else {
			$('#glossary-filter-clear').show();
		}
	},
	clearFilter: function() {
		$('#glossary-filter').val('');
		this.filterTerms();
	},
	selectTerm: function(e) {
		var tid = $(e.target).data('tid');
		var item = app.collections.glossaryTerms.get(tid);

		this.$el.find('h4').html(item.get('term'));
		this.$el.find('p').html(item.get('definition'));
	}
});
