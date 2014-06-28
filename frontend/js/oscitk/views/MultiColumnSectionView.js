OsciTk.views.MultiColumnSection = OsciTk.views.Section.extend({

    template: OsciTk.templateManager.get('multi-column-section'),

    initialize: function(options) {
        this._super('initialize');
        this.options = options;
        this.options.pageView = 'MultiColumnPage';

        this.listenTo(Backbone, "windowResized", function() {
			var that = this;
			$('body').append('<div id="loader">Loading...</div>');
			
			$('#loader').fadeTo(500, 0.7, function() {
            //get the identifier of the first element on the page to try and keep the reader in the same location
            var identifier;
            var page = that.getChildViewByIndex(app.views.navigationView.page - 1);
            var element = page.$el.find("[id]:first");
            if (element.length) {
                identifier = element.attr("id");
            }

            //update the navigationView identifier if found
            if (identifier) {
                app.views.navigationView.identifier = identifier;
            }

            that.render();
			$('#loader').remove();
			});
        });

        this.listenTo(Backbone, "navigate", function(data) {
            var matches, refs, occurrenceCount, j;
            var gotoPage = 1;
            if (data.page) {
                gotoPage = data.page;
            }
            else if (data.identifier) {
                switch (data.identifier) {
                    case 'end':
                        gotoPage = this.model.get('pages').length;
                        break;
                    case 'start':
                        gotoPage = 1;
                        break;
                    default:
                        var page_for_id = null;
                        if(data.identifier.search(/^p-[0-9]+/) > -1) {
                            var pid = data.identifier.slice(data.identifier.lastIndexOf('-') + 1, data.identifier.length);
                            page_for_id = this.getPageForParagraphId(pid);
                        } else if (data.identifier.search(/^fig-[0-9]+-[0-9]+-[0-9]+/) > -1) {
                            // Route for figure references
                            matches = data.identifier.match(/^(fig-[0-9]+-[0-9]+)-([0-9])+?/);
                            var figureId = matches[1];
                            var occurrence = matches[2] ? parseInt(matches[2],10) : 1;

                            refs = $(".figure_reference").filter("[href='#" + figureId + "']");
                            if (refs.length) {
                                if (refs.length === 1) {
                                    page_for_id = this.getPageNumberForSelector(refs[0]);
                                } else {
                                    //find visible occurence
                                    occurrenceCount = 0;
                                    for (j = 0, l = refs.length; j < l; j++) {
                                        if (this.isElementVisible(refs[j])) {
                                            occurrenceCount++;
                                            if (occurrenceCount === occurrence) {
                                                page_for_id = this.getPageNumberForSelector(refs[j]);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        } else if (data.identifier.search(/^fn-[0-9]+-[0-9]+/) > -1) {
                            // Route for footnote references
                            matches = data.identifier.match(/^fn-[0-9]+-[0-9]+/);
                            refs = $('a[href="#' + matches[0] + '"]');
                            if (refs.length === 1) {
                                page_for_id = this.getPageNumberForSelector(refs[0]);
                            }
                            else {
                                // find visible occurence
                                for (j = 0; j < refs.length; j++) {
                                    if (this.isElementVisible(refs[j])) {
                                        page_for_id = this.getPageNumberForSelector(refs[j]);
                                        break;
                                    }
                                }
                            }
                        } else {
                            page_for_id = this.getPageNumberForElementId(data.identifier);
                        }

                        if (page_for_id !== null) {
                            gotoPage = page_for_id;
                        } else {
                            gotoPage = 1;
                        }

                        break;
                }
            }

            //make the view visible
            this.getChildViewByIndex(gotoPage - 1).show();

            //calculate the page offset to move the page into view
            var offset = (gotoPage - 1) * (this.dimensions.innerSectionHeight) * -1;

            //TODO: add step to hide all other pages
            var pages = this.getChildViews();
            var numPages = pages.length;
            for(var i = 0; i < numPages; i++) {
                if (i !== (gotoPage - 1)) {
                    pages[i].hide();
                }
            }

            //move all the pages to the proper offset
            this.$el.find("#pages").css({
                "-webkit-transform": "translate3d(0, " + offset + "px, 0)",
                "-moz-transform": "translate3d(0, " + offset + "px, 0)",
                "transform": "translate3d(0, " + offset + "px, 0)"
            });

            //trigger event so other elements can update with current page
            Backbone.trigger("pageChanged", {page: gotoPage});

        });

        this.$el.addClass("oscitk_multi_column");

        //set the default options
        _.defaults(this.options, {
            minColumnWidth : 200,
            maxColumnWidth : 300,
            gutterWidth : 40,
            minLinesPerColumn : 5,
            defaultLineHeight: 16,
            figureContentGutter : 20,
            maxFigureWidth: 0
        });

        //initialize dimensions object
        this.dimensions = {};
    },

    isElementVisible: function(elem) {
        //determine if it is visible
        var $elem = $(elem);
        var inColumn = $elem.parents(".column");
        var checkContainer = null;
        var visible = true;

        if (inColumn.length) {
            checkContainer = inColumn;
        } else {
            checkContainer = $elem.parents(".page");
        }

        if (checkContainer.length) {
            var position = $elem.position();
            if (position.top < 0 || position.top > checkContainer.height()) {
                visible = false;
            }
        }

        return visible;
    },

    preRender: function() {
        //make sure no figure views are hanging around
        app.views.figures = {};
    },

    renderContent: function() {
        this.$el.html(this.template());

        this.calculateDimensions();

        //setup location to store layout housekeeping information
        this.layoutData = {
            data : this.model.get('content'),
            items : null
        };

        //remove unwanted sections & parse sections
        this.cleanData();

        //create a placeholder for figures that do not fit on a page
        this.unplacedFigures = [];

        //if there is a plate image, make sure it gets moved to the front
        var plateFigures = app.collections.figures.where({plate: true});
        if (plateFigures.length) {
            _.each(plateFigures, function(fig) {
                this.unplacedFigures.push(fig.id);
            }, this);
        }

        this.layoutData.items = this.layoutData.data.length;

        var i = 0;
        var firstOccurence = true;
        var paragraphNumber = 1;
        var paragraphsOnPage = 0;
        var itemsOnPage = 0;
        while(this.layoutData.items > 0 || this.unplacedFigures.length > 0) {
            var pageView = this.getPageForProcessing(undefined, "#pages");
            var layoutResults = null;
            var figureIds = [];

            if (!pageView.processingData.rendered) {
                itemsOnPage = 0;
                paragraphsOnPage = 0;
                pageView.render();

                //load any unplaced figures
                figureIds = figureIds.concat(this.unplacedFigures);
            }

            var content = $(this.layoutData.data[i]).clone();

            if (figureIds.length === 0 && content.length === 0) {
                if (this.unplacedFigures.length) {
                    figureIds = figureIds.concat(this.unplacedFigures);
                } else {
                    break;
                }
            }

            //Process any figures in the content
            var figureLinks = content.find("a.figure_reference");
            var numFigureLinks = figureLinks.length;
            var inlineFigures = content.find("figure");
            var numinlineFigures = inlineFigures.length;
            if (content.is("figure") || numFigureLinks || numinlineFigures || figureIds.length) {
                var j;

                if (content.is("figure")) {
                    figureIds.push(content.attr("id"));
                }

                if (numFigureLinks) {
                    for (j = 0; j < numFigureLinks; j++) {
                        figureIds.push($(figureLinks[j]).attr("href").substring(1));
                    }
                }

                if (numinlineFigures) {
                    for (j = 0; j < numinlineFigures; j++) {
                        var tempFigure = $(inlineFigures[j]).remove();
                        figureIds.push(tempFigure.attr("id"));
                    }
                }

                var numFigureIds = figureIds.length;
                for (j = 0; j < numFigureIds; j++) {
                    var figure = app.collections.figures.get(figureIds[j]);
                    var figureType = figure.get('type');
                    var figureViewType = OsciTk.views.figureTypeRegistry[figureType] ? OsciTk.views.figureTypeRegistry[figureType] : OsciTk.views.figureTypeRegistry['default'];
                    var figureViewInstance = this.getFigureView(figure.get('id'));

                    if (!figureViewInstance) {
                        //create instance and add it to app.views for ease of access
                        app.views.figures[figureIds[j]] = figureViewInstance = new OsciTk.views[figureViewType]({
                            model : figure,
                            sectionDimensions : this.dimensions
                        });
                    }

                    if (!figureViewInstance.layoutComplete) {
                        if (pageView.addFigure(figureViewInstance)) {
                            //figure was added to the page... restart page processing
                            layoutResults = 'figurePlaced';
                            var inUnplaced = _.indexOf(this.unplacedFigures, figureIds[j]);
                            if (inUnplaced > -1) {
                                this.unplacedFigures.splice(inUnplaced, 1);
                            }
                            break;
                        } else {
                            if (_.indexOf(this.unplacedFigures, figureIds[j]) === -1) {
                                this.unplacedFigures.push(figureIds[j]);
                            }
                            if (content.is("figure")) {
                                layoutResults = 'next';
                            }
                        }
                    } else {
                        if (content.is("figure")) {
                            layoutResults = 'next';
                        }
                    }
                }
            }

            if (layoutResults === null && content.length) {
                var contentId = 'osci-content-' + i;
                var existingId = content.attr('id') || "";
                if (firstOccurence && existingId.indexOf('_anchor') === -1) {
                    content.attr('id', contentId);
                }

                //add a data attribute for all content for when content is repeated it still has an identifier
                content.attr("data-osci_content_id", contentId);

                if (content.is("p")) {
                    content.attr("data-paragraph_number", paragraphNumber);
                }

                layoutResults = pageView.addContent(content).layoutContent(contentId);
            }

            switch (layoutResults) {
                case 'contentOverflow':
                    firstOccurence = false;
                    break;
                case 'figurePlaced':
                    pageView.resetPage();

                    paragraphNumber -= paragraphsOnPage;
                    paragraphsOnPage = 0;

                    this.layoutData.items += itemsOnPage;
                    i -= itemsOnPage;
                    itemsOnPage = 0;
                    break;
                default:
                    i++;
                    this.layoutData.items--;
                    itemsOnPage++;

                    if (content.is("p")) {
                        paragraphNumber++;
                        paragraphsOnPage++;
                    }

                    firstOccurence = true;

                    if (this.layoutData.items <= 0) {
                        pageView.processingComplete();
                    }
            }
        }
    },

    calculateDimensions: function() {
        var dimensions = this.dimensions;

        //get window height / width
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();

        //min width to prevent lockup
        if (windowWidth < 300) {
            windowWidth = 300;
        }

        //min height to prevent lockup
        if (windowHeight < 300) {
            windowHeight = 300;
        }

        //if the window size did not change, no need to recalculate dimensions
        if (dimensions.windowWidth && dimensions.windowWidth === windowWidth && dimensions.windowHeight && dimensions.windowHeight === windowHeight) {
            return;
        }

        //cache the window height/width
        dimensions.windowHeight = windowHeight;
        dimensions.windowWidth = windowWidth;

        //copy gutter width out of the options for easy access
        dimensions.gutterWidth = this.options.gutterWidth;

        //copy top column margin for easy access
        dimensions.figureContentGutter = this.options.figureContentGutter;

        //copy minLinesPerColumn out of options for eacy access
        dimensions.minLinesPerColumn = this.options.minLinesPerColumn;

        //get the margins of the section container
        dimensions.sectionMargin = {
            left : parseInt(this.$el.css("margin-left"), 10),
            top : parseInt(this.$el.css("margin-top"), 10),
            right : parseInt(this.$el.css("margin-right"), 10),
            bottom : parseInt(this.$el.css("margin-bottom"), 10)
        };

        //get the padding of the section container
        dimensions.sectionPadding = {
            left : parseInt(this.$el.css("padding-left"), 10),
            top : parseInt(this.$el.css("padding-top"), 10),
            right : parseInt(this.$el.css("padding-right"), 10),
            bottom : parseInt(this.$el.css("padding-bottom"), 10)
        };

        //determine the correct height for the section container to eliminate scrolling
        dimensions.outerSectionHeight = windowHeight - dimensions.sectionMargin.top - dimensions.sectionMargin.bottom;
        dimensions.innerSectionHeight = dimensions.outerSectionHeight - dimensions.sectionPadding.top - dimensions.sectionPadding.bottom;

        //determine the correct width for the section container
        dimensions.outerSectionWidth = this.$el.outerWidth();
        dimensions.innerSectionWidth = dimensions.outerSectionWidth - dimensions.sectionPadding.left - dimensions.sectionPadding.right;

        //column width
        if (dimensions.innerSectionWidth < this.options.maxColumnWidth) {
            dimensions.columnWidth = dimensions.innerSectionWidth;
        } else {
            dimensions.columnWidth = this.options.maxColumnWidth;
        }

        //Determine the number of columns per page
        dimensions.columnsPerPage = Math.floor(dimensions.innerSectionWidth / dimensions.columnWidth);
        if (dimensions.innerSectionWidth < (dimensions.columnsPerPage * dimensions.columnWidth) + ((dimensions.columnsPerPage) * this.options.gutterWidth))
        {
            dimensions.columnsPerPage = dimensions.columnsPerPage - 1;
        }

        //If we ended up with no columns, force it to one column
        if (dimensions.columnsPerPage === 0) {
            dimensions.columnsPerPage = 1;
            dimensions.columnWidth = dimensions.innerSectionWidth - this.options.gutterWidth;
        }

        //Large gutters look ugly... reset column width if gutters get too big
        var gutterCheck = (dimensions.innerSectionWidth - (dimensions.columnsPerPage * dimensions.columnWidth)) / (dimensions.columnsPerPage);
        if (gutterCheck > this.options.gutterWidth) {
            dimensions.columnWidth = (dimensions.innerSectionWidth - (this.options.gutterWidth * (dimensions.columnsPerPage))) / dimensions.columnsPerPage;
        }
        dimensions.columnWidth = Math.floor(dimensions.columnWidth);

        //If a percentage based width hint is specified, convert to number of columns to cover
        var maxFigureWidth = this.options.maxFigureWidth;
        if (typeof(maxFigureWidth) === 'string' && maxFigureWidth.indexOf("%") > 0) {
            maxFigureWidth = Math.ceil((parseInt(maxFigureWidth, 10) / 100) * dimensions.columnsPerPage);
        }
        dimensions.maxFigureWidth = maxFigureWidth;


        this.dimensions = dimensions;
        //set the height of the container
        //dont need this if styled correctly I think
        //this.$el.height(dimensions.pageHeight);
    },

    cleanData: function() {
        //remove the figure section
        this.layoutData.data.find("#figures").remove();

        //remove the footnotes section
        this.layoutData.data.find("#footnotes").remove();

        var finalItems = [];
        this.layoutData.data.find('section').each(function(i, section) {
            var $section = $(section);
            var sId = $section.attr('id');
            $section.children().each(function(j, c){
                var $c = $(c);
                var contentLen = $.trim($c.text()).length;
                if (contentLen > 0 || $c.hasClass("anchor-link")) {
                    $c.attr('data-sectionId', sId);
                    finalItems.push(c);
                }
            });
        });

        //chunk the data into managable parts
        this.layoutData.data = finalItems;
    },

    getFigureView: function(figureId) {
        if (app.views.figures[figureId]) {
            return app.views.figures[figureId];
        }
    }
});
