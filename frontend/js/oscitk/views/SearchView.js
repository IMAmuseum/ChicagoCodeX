OsciTk.views.Search = OsciTk.views.BaseView.extend({
    id: 'search',
    template: OsciTk.templateManager.get('aic-search'),
    events: {
        'click .results-content-tab': 'toggleResultsType',
        'click #search-close-button': 'close',
        'click .search-submit': 'submitSearch',
        'submit .search-form': 'submitSearch',
        'click .search-result-title': 'gotoSection',
        'click .search-result-content-entry': 'gotoResult',
        'click .facet': 'addFacet'
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
        this.resultsTemplate = OsciTk.templateManager.get('aic-search-results');

        this.render();

        $('.search-form').on('submit', function(e) {
            e.preventDefault();
            var topFormVal = $("#search-toolbar-item").find(".search-keyword").val();
            that.$el.find('.search-keyword').val(topFormVal);
            that.search(true);
        });
        $('.search-submit').on('click', function(e) {
            var topFormVal = $("#search-toolbar-item").find(".search-keyword").val();
            that.$el.find('.search-keyword').val(topFormVal);
            that.search(true);
        });
    },
    render: function() {
        this.$el.html(this.template(this));
        // add search to toolbar
        $('#toolbar-items').append(OsciTk.templateManager.get('aic-search-bar'));
    },
    renderResults: function() {
        this.prepareResults();
        this.$el.find("#search-results-container").html(this.resultsTemplate(this));
    },
    prepareResults: function() {
        this.results = _.groupBy(this.response.docs.models, function(doc) {
            return doc.get('ss_section_id');
        });
    },
    submitSearch: function(e) {
        e.preventDefault();
        this.search(true);
    },
    search: function(clearFilters) {
        if (!this.$el.is(":visible")) this.$el.show();

        if (!_.isUndefined(clearFilters)) {
            this.query.filters = [];
        }

        var that = this;
        // set keyword
        this.query.keyword = this.$el.find('.search-keyword').val();
        // reset collection
        this.response.docs.reset();
        // let the template know that we can now display results
        this.hasSearched = true;

        // build query params to send to api
        var queryParams = {
            key: this.query.keyword,
            group: 'true',
            page: this.query.page,
            sort: this.query.sort
        };

        var publicationId = 'pid:' + app.models.docPackage.get('id');
        // check if publication filter already exists
        if (_.indexOf(this.query.filters, publicationId) === -1) {
            // filter by publication id
            this.query.filters.push(publicationId);
        }

        if (this.query.filters.length) {
            queryParams['filters'] = this.query.filters.join(' ');
        }

        // send search query
        $.ajax({
            url: app.config.get('endpoints')['OsciTkSearch'],
            data: queryParams,
            success: function(data) {
                data = JSON.parse(data);
                // add the incoming docs to the results collection
                that.response.docs.reset(data.docs);
                that.response.facets = data.facets;
                that.response.numFound = data.numFound;
                // re-render the search view
                that.renderResults();
                // handle container resizing
                //that.resizeContainers();
            },
            error: function() {
                // error handling
            }
        });
    },
    gotoSection: function(e) {
        var $elem = $(e.currentTarget);
        var resultModel = this.response.docs.get($elem.data("id"));

        app.router.navigate("section/" + resultModel.get("ss_section_id"), {trigger:true});
        this.close();
    },
    gotoResult: function(e) {
        var $elem = $(e.currentTarget);
        var resultModel = this.response.docs.get($elem.data("id"));

        app.router.navigate("section/" + resultModel.get("ss_section_id") + "/" + resultModel.get("id"), {trigger: true});
        this.close();
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
    },
    addFacet: function(e) {
        e.preventDefault();
        var facet = $(e.currentTarget).data('filter');
        var fExists = _.indexOf(this.query.filters, facet);
        if (fExists > -1) {
            this.query.filters.splice(fExists, 1);
        } else {
            this.query.filters.push(facet);
        }

        if (this.hasSearched) {
            this.search();
        }
    },
});
