(function($)
{
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.layout = function(data, options)
    {
        var base = this.layout;

        base.init = function()
        {
            ////console.time("osci_layout_init");
            
            var pCount = 0, dataCount = 0, i, isP, $elem, parentId;
            //Trigger event so we know layout is begining
            amplify.publish("osci_layout_start");

            base.options = $.extend({}, $.osci.layout.defaultOptions, options);
            base.reader = $("#" + base.options.readerId);
            base.viewer = $("#" + base.options.viewerId).empty();
            
            //Check to see if layout has been cached in localstorage
            cache = $.osci.storage.get('osci_layout_cache:' + base.options.cacheId);
            
            //Calculate height information
            _updateHeights();
            
            //Set some more data points
            base.options.viewHeight = base.viewer.height();
            base.options.viewWidth  = base.viewer.width();
            base.options.columnCount = 1;
            base.options.pageCount = 0;

            //Calculate the constraints of the viewer area
            _calcViewerInfo();
            
            base.figureContent = {};
            
            //No cache process content for layout
            if (cache === null) {
                //Get the data from the HTML body copy output we only want section content
                base.data = data.children("section:not(#field_osci_figures)").children("section.content").children();
                
                //Collect the figures from the content
                base.figures = data.children("#field_osci_figures").find("figure");
                
                _render();
            } else {
                //Cache found load layout from localstorage
                base.options = cache.data.options;
                base.figures = $(cache.data.figures);
                base.viewer.append(cache.data.content);
            }
            
            amplify.subscribe("osci_navigation_complete", function(data) {
                var page = $(".osci_page_" + data.page);
                
                if (!page.hasClass("figures_processed")) {
                    var figures = page.find("figure:not(.content_loaded)"),
                        numFigures = figures.length, i = 0;
                    
                    if (numFigures) {
                        for (i = 0; i < numFigures; i++) {
                            _load_figure_content(figures[i])
                        }
                    }
                    
                    page.addClass("figures_processed");
                }
            });
            
            amplify.subscribe("osci_figure_load", function(data) {
                var figure = $(data.figure_id + ":not(.content_loaded)");
                
                if (figure.length) {
                    _load_figure_content(figure);
                }
                
                return;
            });
            
            amplify.subscribe("osci_layout_complete", function(data) {
                //Store the layout in localstorage for faster load times
                $.osci.storage.set('osci_layout_cache:' + base.options.cacheId, {options : base.options, content : base.viewer.html(), figures : base.figures.html()}, base.options.layoutCacheTime);
            }, 1);

            //Remove base data
            //delete base.render;
            //delete base.data;
            //delete base.viewer;
            //delete base.reader;
            //delete base.figures;
            //console.timeEnd("osci_layout_init");
        };

        function _render()
        {
            var i = 0, totalElements = 0, page, currentElement, pageElementCount, 
                figureLinks, overflow, contentOffset = 0, cache = null, heightRemain = 0, 
                figureCarryover, figureCarryoverCount, figureCarryoverI = 0, plateFigure, parentId, originalElement;

            base.viewer.pages = $("<div>", {id : "osci_pages"}).appendTo(base.viewer);
            base.render = {
                page : undefined,
                pageCount : 0,
                pageStatus : "processing",
                pageMinHeight : parseInt(base.viewer.pages.css("line-height"), 10) * base.options.minLinesPerColumn,
                figureCarryover : [],
                contentOffset : 0,
                column : undefined,
                currentColumn : 0
            };
            
            if ($.osci.fontSize) {
            	// apply user defined font size
                base.viewer.pages.css("font-size", $.osci.fontSize + "%");
            }            
            
            //Add the plate figure if found
            plateFigure = base.figures.filter("#osci_plate_fig");
            if (plateFigure.length) {
                base.render.figureCarryover.push(base.figures.filter("#osci_plate_fig"));
            }
            
            _renderPage();
        };
        
        function _renderPage()
        {
            var remainingContent = base.data.length, i = 0, pageElementCount = 0;
            
            if (remainingContent || base.render.figureCarryover.length) {
                base.render.page = _newPage().appendTo(base.viewer.pages);
                //console.time("osci_page" + base.render.pageCount);
                while (base.render.figureCarryover.length && _process_figure(base.render.figureCarryover.pop())) {
                    _reset_page();
                }
                
                while (i < remainingContent && base.render.pageStatus === "processing") {
                    var originalElement = $(base.data[i]);
                    var currentElement = originalElement.clone();
                  
                    var parentId = originalElement.parents("section[id]").attr("id");
                    if (parentId) {
                        currentElement.addClass(parentId);
                    }
                    delete originalElement;
                    
                    overflow = _renderContent(currentElement);
                    
                    //If there was no overflow continue to the next element
                    if (!overflow) {
                        i++;
                        pageElementCount++;
                    }
                      
                    //Restart page processing if necessary (if a figure was processed)
                    if (base.render.pageStatus === "restart") {
                        //Reset the page data
                        _reset_page();
                        //Backup the counter to the first element processed on this page
                        i = i - pageElementCount;
                        pageElementCount = 0;
                        base.render.pageStatus = "processing";
                    }
                }
            
                base.render.contentOffset = base.render.columnData[base.render.currentColumn].heightRemain;
                base.data.splice(0, pageElementCount);
                
                if (base.data.length) {
                    setTimeout(function(){
                        _renderPage();
                    }, 0);
                } else {
                    //Trigger event to let other features know layout is complete
                    amplify.publish("osci_layout_complete");
                }
            }
            //console.timeEnd("osci_page" + base.render.pageCount);
        }

        //Add content to the current page
        function _renderContent(content)
        {
            var column, pageColumnData, pageColumnDataCount = 0, pageColumnNumber = 0, heightRemain = 0, offset = 0, 
                lineHeight, colHeight, overflow = false, paragraphIdentifier, figureProcessed = false, columnContentCount, isP = true,
                numLines, visibleLines, figureLinks, contentHeight, i, contentMargin, contentPosition, contentOffset, columnPosition, columnOffset,
                topBound, bottomBound, completeLines, countFigureLinks;
            
            isP = content.is("p");
            
            //Determine which column to put content into
            pageColumnDataCount = base.render.columnData.length;
            for (i = 0; i < pageColumnDataCount; i++) {
                //If there is height remaining in the column, get it
                if (base.render.columnData[i].heightRemain > 0) {
                    //check for existing column
                    column = base.render.page.find("div.column_" + i);
                    pageColumnNumber = i;
                    base.render.currentColumn = pageColumnNumber;
                    //if column doesn't exist, create it
                    if (!column.length) {
                        //create the column
                        column = _newColumn().appendTo(base.render.page);
                        //if not first column, use offset from previous column. first column, use offset from previous page
                        for(i = (pageColumnNumber - 1); i >= -1; i--) {
                            if (i === -1) {
                                offset = base.render.contentOffset;
                                break;
                            }
                            
                            if (base.render.columnData[i].height > 0) {
                                offset = base.render.columnData[i].heightRemain;
                                break;
                            }
                        }
                    }
                    break;
                }
            }

            //if no column found page is full
            if (column === undefined) {
                base.render.pageStatus = "done";
                return true;
            }

            //Add content to the column
            column.append(content);
            contentHeight = content.outerHeight(true);

            lineHeight = parseFloat(content.css("line-height"));

            //If all of the content is overflowing the column remove it and move to next column
            if ((column.height() - content.position().top) < lineHeight) {
                content.remove();
                base.render.columnData[pageColumnNumber].heightRemain = heightRemain;
                return true;
            }
            
            //If offset defined (should always be negative) add it to the height of the content to get the correct top margin
            if (offset < 0) {
                offset = contentHeight + offset;

                //Set the top margin
                content.css("margin-top", "-" + offset + "px");
            }

            //find figure references and process the figure
            figureLinks = content.find("a.figure-link:not(.processed)");
            countFigureLinks = figureLinks.length;
            if (countFigureLinks) {
                var linkLocation, $l;
                for (i = 0; i < countFigureLinks; i++) {
                    $l = $(figureLinks[i]);

                    //make sure the figure link is in the viewable area of the current column
                    linkLocation = $l.position().top;
                    if (linkLocation >= 0 && linkLocation <= base.render.columnData[pageColumnNumber].height) {
                        //process the figure
                        figureProcessed = _process_figure(base.figures.filter($l.attr("href")));

                        //Add a class to the figure link (in current content and the prerendered content) so it is only processed once
                        //$("a[href=" + $l.attr("href") + "]", base.prerender).addClass("processed");
                        base.data.find("a[href=" + $l.attr("href") + "]").addClass("processed");
                        $l.addClass("processed");
                        
                        //if a figure was processed and not carried over exit the loop
                        if (figureProcessed === "processed") {
                            break;
                        }
                    }
                }

                //If a figure has been processed and not carried over, start the current page processing over
                if (figureProcessed === "processed") {
                    base.render.pageStatus = "restart";
                    return true;
                }
            }
            
            contentPosition = content.position();
            contentOffset = content.offset();
            columnPosition = column.position();
            columnOffset = column.offset();
            contentMargin = parseInt(contentHeight - content.height(), 10);

            // Position Paragraph Identifiers in the gutter
            paragraphIdentifier = content.find("a.osci_paragraph_identifier").remove();
            if (paragraphIdentifier.length) {
                if (base.render.page.find("a.osci_paragraph_" + paragraphIdentifier.data("paragraph_id")).length === 0) {
                    paragraphIdentifier.css({
                        "margin-left" : (parseFloat(column.css("margin-left")) - Math.ceil(base.options.gutterWidth / 2) - 4) + "px",
                        "margin-top" : contentPosition.top + parseInt(column.css("margin-top"), 10) + "px"
                    }).appendTo(base.render.page);
                }
            }
            
            //Update how much vertical height remains in the column
            heightRemain = base.render.columnData[pageColumnNumber].heightRemain - content.outerHeight(true);
            if (heightRemain > 0 && heightRemain < lineHeight) {
                heightRemain = 0;
            } else if (heightRemain < 0 && heightRemain >= (contentMargin * -1)) {
                heightRemain = 0;
            }
            
            //If we have negative height remaining, the content must be repeated in the next column
            if (heightRemain < 0) {
                var topBound = columnOffset.top > contentOffset.top ? columnOffset.top : contentOffset.top,
                    bottomBound = (columnOffset.top + base.render.columnData[pageColumnNumber].height) < (contentOffset.top + contentHeight - contentMargin) ? 
                                      (columnOffset.top + base.render.columnData[pageColumnNumber].height) : (contentOffset.top + contentHeight - contentMargin),
                    completeLines = Math.floor((bottomBound - contentOffset.top) / lineHeight);
               
                //Adjust the column height so partial lines of text are removed
                numLines = Math.floor((contentHeight - contentMargin) / lineHeight);
                colHeight = base.render.columnData[pageColumnNumber].height - ((base.render.columnData[pageColumnNumber].height - (contentOffset.top - columnOffset.top)) % lineHeight);
                visibleLines = Math.floor((bottomBound - topBound) / lineHeight);
                column.height(colHeight + "px");

                if (numLines === completeLines) {
                    heightRemain = 0;
                    overflow = false;
                } else {
                    heightRemain = ((numLines - completeLines) * lineHeight * -1) - contentMargin;
                    overflow = true;
                }
            }
            
            if (!isP && heightRemain < lineHeight) {
                content.remove();
                heightRemain = 0;
                overflow = true;
            }
            
            base.render.columnData[pageColumnNumber].heightRemain = heightRemain;
           
            if (base.render.currentColumn === (base.options.columnsPerPage - 1) && heightRemain <= 0) {
                base.render.pageStatus = "done";
            }
            
            return overflow;
        }
        
        //Wrapper function for loading the figure content
        function _load_figure_content(figure)
        {
            var pageFigure = $(figure),
                figureContent = base.figureContent[pageFigure.attr("id")],
                figureType = pageFigure.data("figure_type");
            
            if (base.options.processFigureCallback !== undefined && $.isFunction(base.options.processFigureCallback[figureType])) {
                base.options.processFigureCallback[figureType](pageFigure, figureContent);
            } else {
                pageFigure.prepend(figureContent);
            }
            
            pageFigure.addClass("content_loaded");
        }

        //process a figure
        function _process_figure(figure)
        {
            var figure, aspect, columns, position, verticalPosition, horizontalPosition, column, addLeftPadding = 0,
                offsetLeft, offsetTop, width, height, captionHeight, columnCoverage = [], colStart, colEnd, pageFigures,
                figureOffset, figureX, figureY, placed = false, placementAttempts = 0, pageData, i, checkWidth,
                availableWidth, figureContent, figureType, processingStatus = "not_processed";

            //get the actual figure
            //figure = base.figures.filter(figureId);
            var figureId = figure.attr("id");

            //Get figure layout hint data from data attributes on the figure element
            columns = figure.data("columns");
            position = figure.data("position");
            aspect = figure.data("aspect");
            verticalPosition = figure.data("vertical_position");
            horizontalPosition = figure.data("horizontal_position");
            figureType = figure.data("figure_type");

            //pull out the figure content before adding to the dom so images are not loaded
            figureContent = figure.find("div.figureContent").remove();

            //add new figure to the page
            figure.appendTo(base.render.page);
            
            //if figure is not displayed in the content hide it (ignore placement and sizing code)
            if (position === 'n') {
                processingStatus = "processed_no_display";
                figure.hide();
            } else {
                //Only process size data on first attempt to place this figure
                if (!figure.data("sized")) {
                    //If a percentage based width hint is specified, convert to number of columns to cover
                    if (typeof(columns) === 'string' && columns.indexOf("%") > 0) {
                        columns = Math.ceil((parseInt(columns, 10) / 100) * base.options.columnsPerPage);
                    }
    
                    //Calculate maximum width for a figure
                    if (columns > base.options.columnsPerPage || position === 'p') {
                        width = base.options.innerPageWidth;
                        columns = base.options.columnsPerPage;
                    } else {
                        width = (columns * base.options.columnWidth) + (base.options.gutterWidth * (columns - 1));
                    }
                    figure.css("width", width + "px");
                    
                    //Get the height of the caption
                    captionHeight = figure.find("figcaption").height();
                    
                    //Calculate height of figure plus the caption
                    height = (width / aspect) + captionHeight;
        
                    //If the height of the figure is greater than the page height, scale it down
                    if (height > base.options.innerPageHeight) {
                        height = base.options.innerPageHeight;
        
                        //set new width and the new column coverage number
                        width = (height - captionHeight) * aspect;
                        columns = Math.ceil((width + base.options.gutterWidth) / (base.options.gutterWidth + base.options.columnWidth));
                    }
                    figure.css({ height :  height + "px", width : width + "px"});
    
                    //Set the size of the figure content div inside the actual figure element
                    figureContent.css({
                        width : width,
                        height : height - captionHeight
                    });
                    
                    figure.data("sized", true);
                } else {
                    height = figure.height();
                    width = figure.width();
                }
                
                //If the figure is not as wide as the available space, center it
                availableWidth = (base.options.columnWidth * columns) + ((columns - 1) * base.options.gutterWidth);
                if (width < availableWidth) {
                    addLeftPadding = Math.floor((availableWidth - width) / 2);
                }

                //Detemine the start column based on the layout hint
                switch (horizontalPosition) {
                    //right
                    case 'r':
                        column = base.options.columnsPerPage - 1;
                        break;
                    //left & fullpage
                    case 'l':
                    case 'p':
                        column = 0;
                        break;
                    //In the current column
                    default:
                        column = base.render.currentColumn;
                }
                
                //Get the figures currently on the page to check if current figure can fit
                pageFigures = base.render.page.find("figure:not(#" + figureId + "):visible");
                
                while (!placed && placementAttempts < base.options.columnsPerPage) {
                    //Detemine the left offset start column and width of the figure
                    if ((column + columns) > base.options.columnsPerPage) {
                        column -= (column + columns) - base.options.columnsPerPage;
                    }

                    offsetLeft = base.options.innerPageGutter[3] + (column * base.options.columnWidth) + (column * base.options.gutterWidth) + addLeftPadding;
                    figure.css("left", offsetLeft + "px");

                    //Determine the top offset based on the layout hint
                    switch (verticalPosition) {
                        //top & fullpage
                        case 't':
                        case 'p':
                            offsetTop = base.options.innerPageGutter[0];
                            break;
                        //bottom
                        case 'b':
                            offsetTop = base.options.innerPageHeight - height + base.options.innerPageGutter[0];
                            break;
                    }
                    figure.css("top", offsetTop + "px");
        
                    //Determine which columns this figure will occupy and add it to the figure data
                    for (i = 0; i < base.options.columnsPerPage; i++) {
                        colStart = (base.options.columnWidth * i) + (base.options.gutterWidth * i) + base.options.innerPageGutter[3];
                        colEnd = (base.options.columnWidth * (i + 1)) + (base.options.gutterWidth * i) + base.options.innerPageGutter[3];
        
                        if (offsetLeft <= colEnd && (offsetLeft + width) >= colStart) {
                            columnCoverage[i] = true;
                        } else {
                            columnCoverage[i] = false;
                        }
                    }
                    figure.data("column_coverage", columnCoverage).addClass("processed");
        
                    //check if current placement overlaps any other figures
                    placed = true;
                    if (pageFigures.length) {
                        figureX = [offsetLeft, offsetLeft + figure.outerWidth()];
                        figureY = [offsetTop, offsetTop + figure.outerHeight()];
                        
                        for (i = 0; i < pageFigures.length; i++) {
                            var $elem = $(pageFigures[i]),
                                position = $elem.position(),
                                elemX = [position.left, position.left + $elem.outerWidth()],
                                elemY = [position.top, position.top + $elem.outerHeight()];
                            
                            if (figureX[0] < elemX[1] && figureX[1] > elemX[0] &&
                                figureY[0] < elemY[1] && figureY[1] > elemY[0]
                            ) {
                                placed = false;
                                //adjust the start column to see if the figure can be placed on the page
                                switch (horizontalPosition) {
                                    //right
                                    case 'r':
                                        column--;
                                        if (column < 0) {
                                            placementAttempts = base.options.columnsPerPage;
                                        }
                                        break;
                                    //left & fullpage
                                    case 'l':
                                    case 'p':
                                        column++;
                                        if (column >= base.options.columnsPerPage) {
                                            placementAttempts = base.options.columnsPerPage;
                                        }
                                        break;
                                    //no horizontal position
                                    default:
                                        column++;
                                        if ((column + columns) > base.options.columnsPerPage) {
                                            column = 0;
                                        }
                                }
                                break;
                            }
                        }
                    }
    
                    placementAttempts++;
                }
                
                processingStatus = "processed";
                
                //figure was not placed on page... carryover
                if (!placed) {
                    processingStatus = "not_processed";
                    figure.detach().prepend(figureContent);
                    base.render.figureCarryover.push(figure);
                }
            }
            
            if (!base.figureContent[figureId]) {
                base.figureContent[figureId] = figureContent;
            }
            
            return processingStatus;
        }

        //Calculate the constraints of the viewer area
        function _calcViewerInfo()
        {
            var colWidth = 0,
                perPage = 1,
                gutterCheck = 0;

            //Calculate page dimensions based on gutter settings
            base.options.pageWidth = base.options.viewWidth - (base.options.outerPageGutter[1] + base.options.outerPageGutter[3]);
            base.options.pageHeight = base.options.viewHeight - (base.options.outerPageGutter[0] + base.options.outerPageGutter[2]);
            base.options.innerPageHeight = base.options.pageHeight - (base.options.innerPageGutter[0] + base.options.innerPageGutter[2]);
            base.options.innerPageWidth = base.options.pageWidth - (base.options.innerPageGutter[1] + base.options.innerPageGutter[3]);

            //Calculate column width based on maxColumnWidth setting
            if (base.options.innerPageWidth < base.options.maxColumnWidth) {
                colWidth = base.options.innerPageWidth;
            } else {
                colWidth = base.options.maxColumnWidth;
            }

            base.options.columnWidth = colWidth;

            //Determine the number of columns per page
            perPage = Math.floor(base.options.innerPageWidth / colWidth);
            if (base.options.innerPageWidth < (perPage * colWidth) + ((perPage - 1) * base.options.gutterWidth)) {
                perPage = perPage - 1;
            }
            
            base.options.columnsPerPage = perPage;

            //Large gutters look ugly... reset column width if gutters get too big
            gutterCheck = (base.options.innerPageWidth - (perPage * colWidth)) / (perPage - 1);
            if (gutterCheck > base.options.gutterWidth) {
                base.options.columnWidth = (base.options.innerPageWidth - (base.options.gutterWidth * (perPage - 1))) / perPage;
            }
        }

        //Calculate the height information to remove any vertical scrolling
        function _updateHeights()
        {
            var viewerHeight = 0,
                absoluteElements,
                absoluteElementCount = 0,
                i;

            //Set the height of the container to the window height minus any margin on the container element
            base.reader.height($(window).height() - (base.reader.outerHeight() - base.reader.height()));
            
            //Calc viewer height by taking the height of the container minus all non-absolute positioned children inside the container.
            viewerHeight = base.reader.height();
            absoluteElements = base.reader.children(":not(#" + base.viewer.attr("id") + ")");
            absoluteElementCount = absoluteElements.length;
            
            if (absoluteElementCount) {
                for (i = 0; i < absoluteElementCount; i++) {
                    var $elem = $(absoluteElements[i]);
                    if ($elem.css("position") !== "absolute") {
                        viewerHeight -= $elem.outerHeight(true);
                    }
                }
            }
            
            //Set the height of the viewer to the calculated height
            base.viewer.height(viewerHeight);
        }

        //Create a new column
        function _newColumn()
        {
            var topOffset, leftOffset, pageFigures, heightLength = 0, colNumber = 1, height, i;

            //Loop over page column data to determine if a column can be created with height remaining
            heightLength = base.render.columnData.length;
            for (i = 0; i < heightLength; i++) {
                if (base.render.columnData[i].heightRemain > 0) {
                    colNumber = i;
                    leftOffset = (i * base.options.columnWidth) + (base.options.gutterWidth * i) + base.options.innerPageGutter[3];
                    topOffset = base.render.columnData[i].topOffset;
                    height = base.render.columnData[i].height;
                    break;
                }
            }

            //create the column
            return $("<div>", {
                "class" : "column column_" + colNumber,
                css : {
                    width : base.options.columnWidth + "px",
                    "margin-left" : leftOffset + "px",
                    "margin-top" : topOffset + "px",
                    height : height,
                },
                "data-column" : colNumber
            });
        }

        //Create a new page
        function _newPage()
        {
            var leftGutterOffset = base.options.outerPageGutter[3], i;

            //New page being created so up the page count
            base.options.pageCount++;
            
            base.render.pageCount = base.options.pageCount;
            base.render.pageStatus = "processing";
            base.render.currentColumn = 0;
            
            //Determine where the left edge of the page should be
            if (base.options.pageCount > 1) {
                leftGutterOffset = base.options.outerPageGutter[3] + ((base.options.outerPageGutter[1] + base.options.outerPageGutter[3]) * (base.options.pageCount - 1));
            }

            //Set base column data
            base.render.columnData = [];
            for (i = 0; i < base.options.columnsPerPage; i++) {
                base.render.columnData[i] = {height : base.options.innerPageHeight, topOffset : base.options.innerPageGutter[0], heightRemain : base.options.innerPageHeight};
            }
            
            //Create and return the page div
            return $("<div>",{
                "class" : "osci_page osci_page_" + base.options.pageCount,
                data : {
                    page : base.options.pageCount
                },
                css : {
                    width : base.options.pageWidth + "px",
                    left : ((base.options.pageCount - 1) * base.options.pageWidth) + leftGutterOffset + "px",
                    top : base.options.outerPageGutter[0] + "px",
                    height : base.options.pageHeight + "px"
                },
                "data-page" : base.options.pageCount
            });
        }

        //Reset page data for processing
        function _reset_page()
        {
            var data, figures, columnCoverage, height, topOffset, 
                i, j, $fig, numFigures, figHeight;

            //Remove all columns and identifiers
            base.render.page.find("div.column, a.osci_paragraph_identifier").remove();

            //Grab all of the figures currently on the page
            figures = base.render.page.find("figure:visible");
            numFigures = figures.length;

            //Loop for number of columns per page to setup layout data
            base.render.columnData = [];
            for (i = 0; i < base.options.columnsPerPage; i++) {
                height = base.options.innerPageHeight;
                topOffset = base.options.innerPageGutter[0];

                //Determine where figures are placed on the page and adjust column heights accordingly
                if (numFigures) {
                    for (j = 0; j < numFigures; j++) {
                        $fig = $(figures[j]);
                        columnCoverage = $fig.data("column_coverage");
                        figHeight = $fig.height();

                        //If figure is located in the current column adjust the height
                        if (columnCoverage[i]) {
                            //Remove figure height from the column
                            height = height - (figHeight + base.options.innerPageGutter[0]);

                            //Don't allow text if minHeight not met
                            if (height < base.render.pageMinHeight) {
                                height = 0;
                                continue;
                            }

                            //Adjust column top offset based on vertical location of the figure
                            switch ($fig.data("vertical_position")) {
                                //top
                                case 't':
                                //fullpage
                                case 'p':
                                    topOffset = topOffset + figHeight + base.options.innerPageGutter[0];
                                    break;
                                //bottom
                                case 'b':
                                    topOffset = topOffset;
                                    break;
                            }

                        }
                    }
                }
                
                //Add column data to array
                base.render.columnData[i] = {height : height, topOffset : topOffset, heightRemain : height};
            }
        }

        base.init();
    };

    $.osci.layout.defaultOptions = {
        readerId : "osci_viewer_wrapper",
        minColumnWidth : 200,
        maxColumnWidth : 300,
        gutterWidth : 40,
        innerPageGutter : [20, 40, 20, 40],
        outerPageGutter : [10, 10, 10, 10],
        viewerId : 'osci_viewer',
        minLinesPerColumn : 5,
        cacheId : null,
        layoutCacheTime : 86400
    };

})(jQuery);