OsciTk.views.Search = OsciTk.views.BaseView.extend({
	id: 'search',
	template: OsciTk.templateManager.get('aic-search'),
	events: {
		'click .results-content-tab': 'toggleResultsType',
		'click #search-close-button': 'close'
	},
	initialize: function() {
		var that = this;

		// define defaults for the query
		this.query = {
			page: 0,
			keyword: null,
			filters: [],
			sort: 'score'
		};

		// define results object
		this.response = {
			numFound: 0,
			docs: new OsciTk.collections.SearchResults(),
			facets: null
		};
		this.results = null;
		this.hasSearched = false;
		this.isLoading = false;

		this.render();

		$('.search-form').on('submit', function(e) {
			e.preventDefault();
			that.search();
		});
		$('.search-submit').on('click', function(e) {
			that.search();
		});
	},
	render: function() {
		this.$el.html(this.template(this));
		// add search to toolbar
		$('#toolbar-items').append(OsciTk.templateManager.get('aic-search-bar'));
	},
	search: function() {
		if (!this.$el.is(":visible")) this.$el.show();
	},
	toggleResultsType: function(e) {
		e.preventDefault();

		// remove active class
		this.$el.find('.results-content-tab').removeClass('active');
		// hide all content
		this.$el.find('.search-results-content').hide();
		// set tab to active and show content
		var targetId = $(e.target).addClass('active').attr('href');
		$(targetId).show();
	},
	close: function() {
		this.$el.hide();
	}
});