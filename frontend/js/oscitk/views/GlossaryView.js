OsciTk.views.Glossary = OsciTk.views.BottomDrawerView.extend({
	id: 'glossary',
	template: OsciTk.templateManager.get('aic-glossary'),
	events: {
		'click .drawer-handle': 'toggleDrawer',
		'keyup #glossary-filter': 'filterTerms',
		'click #glossary-filter-clear': 'clearFilter',
		'click #glossary-term-listing li': 'selectTerm',
		'click #glossary-term-listing-mobile li': 'expandTerm'
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
		var that = this;
		this.$el.html(this.template({hasResults: !_.isEmpty(app.collections.glossaryTerms.models)}));

		_.each(app.collections.glossaryTerms.models, function(item) {
			var termView = OsciTk.templateManager.get('aic-glossary-term');
			that.$el.find('#glossary-term-listing').append(termView({item: item}));

			var termViewMobile = OsciTk.templateManager.get('aic-glossary-term-mobile');
			that.$el.find('#glossary-term-listing-mobile').append(termViewMobile({item: item}));
		});
	},
	filterTerms: function() {
		var that = this,
			keyword = $('#glossary-filter').val();

		if (!keyword.length) {
			$('#glossary-filter-clear').hide();
		} else {
			$('#glossary-filter-clear').show();
		}

		var terms;
		if (_.isEmpty(keyword)) {
			terms = app.collections.glossaryTerms.models;
		} else {
			terms = app.collections.glossaryTerms.filterByKeyword(keyword);
		}

		// clear out list
		$('#glossary-term-listing').empty();
		$('#glossary-term-listing-mobile').empty();

		// re-add terms to list
		_.each(terms, function(item) {
			var termView = OsciTk.templateManager.get('aic-glossary-term');
			that.$el.find('#glossary-term-listing').append(termView({item: item}));

			var termViewMobile = OsciTk.templateManager.get('aic-glossary-term-mobile');
			that.$el.find('#glossary-term-listing-mobile').append(termViewMobile({item: item}));
		});
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
	},
	expandTerm: function(e) {
		$(e.target).removeClass('active-term');
		if ($(e.target).find('ul').is(":visible")) {
			$(e.target).find('ul').hide();
		} else {
			this.$el.find('#glossary-term-listing-mobile ul').hide();
			$(e.target).find('ul').show();
			$(e.target).addClass('active-term');
		}
	}
});
