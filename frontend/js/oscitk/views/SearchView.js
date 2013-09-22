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
        this.noteResponse = {
            numFound: 0,
            docs: new OsciTk.collections.SearchResults(),
            facets: null
        };
        this.noteResults = null;
        this.hasSearched = false;
        this.searchComplete = false;
        this.noteSearchComplete = false;
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

        this.listenTo(Backbone, 'searchComplete', this.renderResults);
        this.listenTo(Backbone, 'noteSearchComplete', this.renderResults);
    },
    render: function() {
        this.$el.html(this.template(this));
        // add search to toolbar
        $('#toolbar-items').append(OsciTk.templateManager.get('aic-search-bar'));
    },
    renderResults: function() {
        if (this.searchComplete && this.noteSearchComplete) {
            this.prepareResults();
            this.$el.find("#search-results-container").html(this.resultsTemplate(this));
        }
    },
    prepareResults: function() {
        this.results = _.groupBy(this.response.docs.models, function(doc) {
            return doc.get('ss_section_id');
        });
        _.each(this.results, function(elem, index, list) {
            var navItem = app.collections.navigationItems.get(index);
            var thumbnail = !_.isUndefined(navItem) ? navItem.get("thumbnail") : "";
            var firstElem = _.first(elem);
            firstElem.set("thumbnail", thumbnail);
        });
        this.noteResults = this.noteResponse.docs.models;
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

        this.searchComplete = false;
        this.noteSearchComplete = false;

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

        queryParams['filters'] = queryParams['filters'] + ' type:!notes';

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

                that.searchComplete = true;
                Backbone.trigger('searchComplete');
            },
            error: function() {
                // error handling
            }
        });

        queryParams['filters'] = queryParams['filters'].replace(' type:!notes', ' type:notes');

        // send search query
        $.ajax({
            url: app.config.get('endpoints')['OsciTkSearch'],
            data: queryParams,
            success: function(data) {
                data = JSON.parse(data);
                // add the incoming docs to the results collection
                that.noteResponse.docs.reset(data.docs);
                that.noteResponse.facets = data.facets;
                that.noteResponse.numFound = data.numFound;

                that.noteSearchComplete = true;
                Backbone.trigger('noteSearchComplete');
            },
            error: function() {
                // error handling
            }
        });
    },
    gotoSection: function(e) {
        var $elem = $(e.currentTarget);
        var resultModel;
        var route;

        if ($elem.data("type") === "content") {
            resultModel = this.response.docs.get($elem.data("id"));
        } else {
            resultModel = this.noteResponse.docs.get($elem.data("id"));
        }

        app.router.navigate("section/" + resultModel.get("ss_section_id"), {trigger:true});
        this.close();
    },
    gotoResult: function(e) {
        var $elem = $(e.currentTarget);
        var resultModel;
        var route;

        if ($elem.data("type") === "content") {
            resultModel = this.response.docs.get($elem.data("id"));
            route = "section/" + resultModel.get("ss_section_id") + "/" + resultModel.get("id");
        } else {
            resultModel = this.noteResponse.docs.get($elem.data("id"));
            route = "section/" + resultModel.get("ss_section_id") + "/" + resultModel.get("ss_content_id");
        }

        app.router.navigate(route, {trigger: true});
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
        var item = $(e.currentTarget);
        $(".facet-section").removeClass("active");
        var facet = item.data('filter');
        var fExists = _.indexOf(this.query.filters, facet);
        if (fExists > -1) {
            this.query.filters.splice(fExists, 1);
        } else {
            this.query.filters.push(facet);
            item.parent().addClass("active");
        }

        if (this.hasSearched) {
            this.search();
        }
    },
});
