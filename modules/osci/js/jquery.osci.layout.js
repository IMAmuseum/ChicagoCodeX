(function($)
{
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.layout = function(el, data, options)
    {
        var base = this;

        base.$el = $(el);
        base.el = el;

        base.$el.data("osci.layout", base);

        base.init = function()
        {
            var pCount = 0, dataCount = 0, i, isP, $elem, parentId;
            //Trigger event so we know layout is begining
            $(document).trigger("osci_layout_start");

            base.options = $.extend({}, $.osci.layout.defaultOptions, options);
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
            
            //No cache process content for layout
            if (cache === null) {
                //Get the data from the HTML body copy output we only want section content
                base.data = data.children("section:not(#field_osci_figures)").children("section.content").children();
                
                //Collect the figures from the content
                base.figures = data.children("#field_osci_figures").find("figure");
                
                base.render();
            } else {
                //Cache found load layout from localstorage
                base.options = cache.data.options;
                base.viewer.append(cache.data.content);
            }
            
            //Trigger event to let other features know layout is complete
            setTimeout(
                function(){$(document).trigger("osci_layout_complete");},
                1
            );
            
            //Remove base data
            delete base.data;
            delete base.figures;
        };

        base.render = function()
        {
            var i = 0, totalElements = 0, page, currentElement, pageElementCount, 
                figureLinks, overflow, contentOffset = 0, cache = null, heightRemain = 0, 
                figureCarryover, figureCarryoverCount, figureCarryoverI = 0, plateFigure, parentId, originalElement;

            base.viewer.pages = $("<div>", {id : "osci_pages"}).appendTo(base.viewer);

            //Add the plate figure if found
            plateFigure = base.figures.filter("#osci_plate_fig");
            if (plateFigure.length) {
                figureCarryover = ["#osci_plate_fig"];
            }
            
            totalElements = base.data.length;
            //Loop over the elements to add them to the layout
            while (i < totalElements) {
                originalElement = $(base.data[i]);
                currentElement = originalElement.clone();
                
                parentId = originalElement.parents("section[id]").attr("id");
                if (parentId) {
                    currentElement.addClass(parentId);
                }
                delete originalElement;

                //If no page is defined or the page is full create a new page
                if (page === undefined || page.data("process") === 'done') {
                    //If a previous page is defined and content overflowed the page set the starting offset
                    if (page !== undefined) {
                        contentOffset = page.data("contentNextOffset");
                        figureCarryover = page.data("figure_carryover");
                    }
                    
                    //Get a new page and append it to the viewer
                    page = _newPage().appendTo(base.viewer.pages);

                    page.data({
                        contentStartOffset : contentOffset,
                        current_column : 0
                    });
                    pageElementCount = 0;
                    
                    //Add any figures that were carried over from the previous page
                    if (figureCarryover !== undefined && figureCarryover.length) {
                        figureCarryoverCount = figureCarryover.length;
                        for (figureCarryoverI = 0; figureCarryoverI < figureCarryoverCount; figureCarryoverI++) {
                            _process_figure(figureCarryover[figureCarryoverI], page);
                        }
                        _reset_page(page);
                    }
                }
                
                //Add element to the page
                overflow = _addPageContent(currentElement, page);
                
                //If there was no overflow continue to the next element
                if (!overflow) {
                    i++;
                    pageElementCount++;
                }

                //Restart page processing if necessary (if a figure was processed)
                if (page.data("process") === "restart") {
                    //Reset the page data
                    _reset_page(page);
                    //Backup the counter to the first element processed on this page
                    i = i - pageElementCount;
                    pageElementCount = 0;
                } else {
                    //Determine if we are at the end of a page
                    heightRemain = page.data("column_data")[page.data("current_column")].heightRemain;
                    page.data("contentNextOffset", heightRemain);
                    
                    if (parseInt(page.data("current_column"), 10) === (base.options.columnsPerPage - 1) && heightRemain <= 0) {
                        page.data("process", "done");
                    }
                }
            }

            //Store the layout in localstorage for faster load times
            $.osci.storage.set('osci_layout_cache:' + base.options.cacheId, {options : base.options, content : base.viewer.html()}, base.options.layoutCacheTime);
        };

        //Add content to the current page
        function _addPageContent(content, page)
        {
            var column, pageColumnData, pageColumnDataCount = 0, pageColumnNumber = 0, heightRemain = 0, offset = 0, 
                lineHeight, colHeight, overflow = false, paragraphIdentifier, figureProcessed = false, columnContentCount, isP = true,
                numLines, visibleLines, figureLinks, contentHeight, i;

            isP = content.is("p");
            
            //Determine which column to put content into
            pageColumnData = page.data("column_data");
            pageColumnDataCount = pageColumnData.length;
            for (var i = 0; i < pageColumnDataCount; i++) {
                //If there is height remaining in the column, get it
                if (pageColumnData[i].heightRemain > 0) {
                    //check for exising column
                    column = page.find("div.column_" + i);
                    pageColumnNumber = i;
                    page.data("current_column", pageColumnNumber);
                    //if column doesnt exist, create it
                    if (!column.length) {
                        //create the column
                        column = _newColumn(page).appendTo(page);
                        //if not first column, use offset from previous column. first column, use offset from previous page
                        for(i = (pageColumnNumber - 1); i >= -1; i--) {
                            if (i === -1) {
                                offset = page.data("contentStartOffset");
                                break;
                            }
                            
                            if (pageColumnData[i].height > 0) {
                                offset = pageColumnData[i].heightRemain;
                                break;
                            }
                        }
                    }
                    break;
                }
            }

            //if no column found page is full
            if (column === undefined) {
                page.data("process", "done");
                return true;
            }

            //Add content to the column
            column.append(content);
            contentHeight = content.outerHeight(true);

            lineHeight = parseFloat(content.css("line-height"));

            //If all of the content is overflowing the column remove it and move to next column
            if (column.height() - content.position().top < lineHeight) {
                content.remove();
                pageColumnData[pageColumnNumber].heightRemain = heightRemain;
                page.data("column_data", pageColumnData);
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
            if (figureLinks.length) {
                figureLinks.each(function(i, l){
                    var linkLocation, $l = $(l);

                    //make sure the figure link is in the viewable area of the current column
                    linkLocation = $l.position().top;
                    if (linkLocation >= 0 && linkLocation <= pageColumnData[pageColumnNumber].height) {
                        //process the figure
                        figureProcessed = _process_figure($l.attr("href"), page);

                        //Add a class to the figure link (in current content and the prerendered content) so it is only processed once
                        //$("a[href=" + $l.attr("href") + "]", base.prerender).addClass("processed");
                        base.data.find("a[href=" + $l.attr("href") + "]").addClass("processed");
                        $l.addClass("processed");
                        
                        //if a figure was processed and not carried over exit the loop
                        if (figureProcessed) {
                            return false;
                        }
                    }
                });

                //If a figure has been processed and not carried over, start the current page processing over
                if (figureProcessed) {
                    page.data("process", "restart");
                    return true;
                }
            }

            // Position Paragraph Identifiers in the gutter
            paragraphIdentifier = content.find("span.osci_paragraph_identifier").remove();
            if (paragraphIdentifier.length) {
                if (page.find("span.osci_paragraph_" + paragraphIdentifier.data("paragraph_id")).length === 0) {
                    paragraphIdentifier.appendTo(page).css({
                        "margin-left" : (parseFloat(column.css("margin-left")) - Math.ceil(base.options.gutterWidth / 2) - 4) + "px",
                        "margin-top" : content.position().top + parseInt(column.css("margin-top"), 10) + "px"
                    });
                }
            }

            //Update how much vertical height remains in the column
            heightRemain = pageColumnData[pageColumnNumber].heightRemain - content.outerHeight(true);
            if (heightRemain > 0 && heightRemain < lineHeight) {
                heightRemain = 0;
            } else if (heightRemain < 0 && heightRemain >= (parseInt(content.css("margin-bottom"), 10) * -1)) {
                heightRemain = 0;
            }
            
            //If we have negative height remaining, the content must be repeated in the next column
            if (heightRemain < 0) {
                //Adjust the column height so partial lines of text are removed
                numLines = contentHeight / lineHeight;
                visibleLines = Math.floor((pageColumnData[pageColumnNumber].height - (content.offset().top - column.offset().top)) / lineHeight);
                colHeight = pageColumnData[pageColumnNumber].height - ((pageColumnData[pageColumnNumber].height - (content.offset().top - column.offset().top)) % lineHeight);
                column.height(colHeight + "px");

                heightRemain = (numLines - visibleLines) * lineHeight * -1;

                overflow = true;
            }
            
            if (!isP && heightRemain < lineHeight) {
                content.remove();
                heightRemain = 0;
                overflow = true;
            }
            
            pageColumnData[pageColumnNumber].heightRemain = heightRemain;
            page.data("column_data", pageColumnData);
           
            return overflow;
        }

        //process a figure
        function _process_figure(figureId, page)
        {
            var figure, aspect, columns, position, verticalPosition, horizontalPosition, column, addLeftPadding = 0,
                offsetLeft, offsetTop, width, height, captionHeight, columnCoverage = [], colStart, colEnd, pageFigures,
                figureOffset, figureX, figureY, placed = false, placementAttempts = 0, pageData, i, checkWidth,
                availableWidth, figureContent, figureType;

            //get the actual figure
            figure = base.figures.filter(figureId);

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
            figure.appendTo(page);
            
            //if figure is not displayed in the content hide it (ignore placement and sizing code)
            if (position === 'n') {
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
                        column = page.data("current_column");
                }
                
                //Get the figures currently on the page to check if current figure can fit
                pageFigures = page.find("figure:not(#" + figureId + "):visible");
                
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
                    for (var i = 0; i < base.options.columnsPerPage; i++) {
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
                        pageFigures.each(function(i, elem) {
                            var $elem = $(elem),
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
                                return false;
                            }
                        });
                    }
    
                    placementAttempts++;
                }
                
                //figure was not placed on page... carryover
                if (!placed) {
                    figure.detach().prepend(figureContent);
                    pageData = page.data();
                    if (pageData.figure_carryover !== undefined) {
                        pageData.figure_carryover.push(figureId);
                    } else {
                        pageData.figure_carryover = [figureId];
                    }
                    page.data(pageData);
                    return false;
                }
            }
            
            if (base.options.processFigureCallback !== undefined && $.isFunction(base.options.processFigureCallback[figureType])) {
                if (!base.options.processFigureCallback[figureType](figure, figureContent)) {
                    figure.data("sized", false);
                    _process_figure(figureId, page);
                }
            } else {
                figure.prepend(figureContent);
            }
            
            return true;
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
            var viewerHeight = 0;

            //Set the height of the container to the window height minus any margin on the container element
            base.$el.height($(window).height() - (base.$el.outerHeight() - base.$el.height()));
            
            //Calc viewer height by taking the height of the container minus all non-absolute positioned children inside the container.
            viewerHeight = base.$el.height();
            base.$el.children(":not(#" + base.viewer.attr("id") + ")").each(function(i, elem){
                var $elem = $(elem);
                if ($elem.css("position") !== "absolute") {
                    viewerHeight -= $elem.outerHeight(true);
                }
            });
            
            //Set the height of the viewer to the calculated height
            base.viewer.height(viewerHeight);
        }

        //Create a new column
        function _newColumn(page)
        {
            var topOffset, leftOffset, pageFigures, heightLength = 0, colNumber = 1, columnData, height;

            //Get the column data stored on the page
            columnData = page.data("column_data");

            //Loop over page column data to determine if a column can be created with height remaining
            heightLength = columnData.length;
            for(var i = 0; i < heightLength; i++) {
                if (columnData[i].heightRemain > 0) {
                    colNumber = i;
                    leftOffset = (i * base.options.columnWidth) + (base.options.gutterWidth * i) + base.options.innerPageGutter[3];
                    topOffset = columnData[i].topOffset;
                    height = columnData[i].height;
                    break;
                }
            }

            //create the column
            return $("<div>", {
                "class" : "column column_" + colNumber,
//                data : {column : colNumber},
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
            var data, colDataArray, leftGutterOffset = base.options.outerPageGutter[3];

            //New page being created so up the page count
            base.options.pageCount++;
            
            //Determine where the left edge of the page should be
            if (base.options.pageCount > 1) {
                leftGutterOffset = base.options.outerPageGutter[3] + ((base.options.outerPageGutter[1] + base.options.outerPageGutter[3]) * (base.options.pageCount - 1));
            }

            data = {
                page : base.options.pageCount
            };

            //Set base column data
            colDataArray = [];
            for (var i = 0; i < base.options.columnsPerPage; i++) {
                colDataArray[i] = {height : base.options.innerPageHeight, topOffset : base.options.innerPageGutter[0], heightRemain : base.options.innerPageHeight};
            }
            data.column_data = colDataArray;

            //Create and return the page div
            return $("<div>",{
                "class" : "osci_page osci_page_" + base.options.pageCount,
                data : data,
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
        function _reset_page(page)
        {
            var data, figures, columnCoverage, height, topOffset, pageNum = page.data("page"), lineHeight, minHeight, colDataArray;

            lineHeight = parseInt(page.css("line-height"), 10);
            minHeight = lineHeight * base.options.minLinesPerColumn;

            data = {
                page : pageNum,
                process : "start"
            };

            //Remove all columns and identifiers
            $("div.column", page).remove();
            $("span.osci_paragraph_identifier", page).remove();

            //Grab all of the figures currently on the page
            figures = $("figure:visible", page);

            //Loop for number of columns per page to setup layout data
            colDataArray = [];
            for (var i = 0; i < base.options.columnsPerPage; i++) {
                height = base.options.innerPageHeight;
                topOffset = base.options.innerPageGutter[0];

                //Determine where figures are placed on the page and adjust column heights accordingly
                if (figures.length) {
                    figures.each(function(j, fig) {
                        var $fig = $(fig);
                        columnCoverage = $fig.data("column_coverage");

                        //If figure is located in the current column adjust the height
                        if (columnCoverage[i]) {
                            //Remove figure height from the column
                            height = height - ($fig.height() + base.options.innerPageGutter[0]);

                            //Don't allow text if minHeight not met
                            if (height < minHeight) {
                                height = 0;
                                return;
                            }

                            //Adjust column top offset based on vertical location of the figure
                            switch ($fig.data("vertical_position")) {
                                //top
                                case 't':
                                //fullpage
                                case 'p':
                                    topOffset = topOffset + $fig.height() + base.options.innerPageGutter[0];
                                    break;
                                //bottom
                                case 'b':
                                    topOffset = topOffset;
                                    break;
                            }

                        }
                    });
                }
                
                //Add column data to array
                colDataArray[i] = {height : height, topOffset : topOffset, heightRemain : height};
            }
            
            //reset the page data with the new values
            data.column_data = colDataArray;
            page.data(data);
        }

        base.init();
    };

    $.osci.layout.defaultOptions = {
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

    $.fn.osci_layout = function( data, options )
    {
        return this.each(function()
        {
            (new $.osci.layout(this, data, options)); 
        });
    };

})(jQuery);