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
            //base.data = $("section > *:not(section, header), header > *", data);
            
            //Get the data from the HTML body copy output we only want section content
            base.data = $("section > *:not(section, header)", data);
            
            base.options = $.extend({}, $.osci.layout.defaultOptions, options);
            base.viewer = $("#" + base.options.viewerId);
            
            //Create a div to load the content into prior to rendering. This is necessary for determining heights.
            base.prerender = $("#osci_reader_content");
            if (!base.prerender.length) {
                base.prerender = $("<div>", {id : "osci_reader_content"});
                base.$el.append(base.prerender);
            }
            
            // Moved to the navigation module so that it does not get triggerd multiple times after more than one node has been loaded
            // if (!window.resizeTimer) {
            //     $(window).resize(function(){
            //         if (window.resizeTimer) clearTimeout(window.resizeTimer);
            //         window.resizeTimer = setTimeout(base.render, 100);
            //     });
            // }

            base.render();
        };

        base.render = function()
        {
            var i = 0, elements, totalElements = 0, page, currentElement, pageElementCount, 
                figureLinks, overflow, contentOffset = 0, cache = null, heightRemain = 0;

            //Trigger event so we know layout is begining
            $(document).trigger("osci_layout_start");
            
            //Calculate height information
            _updateHeights();
            
            //Clear viewer div so we can insert new layout
            base.viewer.empty();
            
            //Check to see if layout has been cached in localstorage
            cache = $.osci.storage.get('osci_layout_cache:' + base.options.cacheId);
            
            //No cache process content for layout
            if (cache === null) {
                //Load content into prerender div
                base.prerender.append(base.data);
                
                //Collect the figures from the content
                base.figures = $("figure", base.prerender).remove();
                
                //Set some more data points
                base.options.viewHeight = base.viewer.height();
                base.options.viewWidth  = base.viewer.width();
                base.options.columnCount = 1;
                base.options.pageCount = 0;
    
                //Calculate the constraints of the viewer area
                _calcViewerInfo();
    
                //Set the width of the prerender div to a single column so heights can be calculated
                base.prerender.css("width", base.options.columnWidth + "px");
    
                elements = base.prerender.children();
                totalElements = elements.length;
    
                //Add the paragraph numbering
                elements.filter("p").each(function(i, elem){
                    $(elem).prepend($("<span>",{
                        html : i + 1,
                        "class" : "osci_paragraph_identifier osci_paragraph_" + (i + 1),
                        "data-paragraph_id" : i + 1 
                    })).addClass("osci_paragraph_" + (i + 1) + " osci_paragraph").attr("data-paragraph_id", i + 1);
                });
    
                //Loop over the elements to add them to the layout
                while (i < totalElements) {
                    currentElement = $(elements[i]).clone();
    
                    //Don't render figure elements, these are handled in the element where they are referenced
                    if (currentElement.text() === 'Figures') {
                        break;
                    }
    
                    //If no page is defined or the page is full create a new page
                    if (page === undefined || page.data("process") === 'done') {
                        //If a previous page is defined and content overflowed the page set the starting offset
                        if (page !== undefined) {
                            contentOffset = page.data("contentNextOffset");
                        }
                        
                        //Get a new page and append it to the viewer
                        page = _newPage().appendTo(base.viewer);
                        page.data("contentStartOffset", contentOffset);
                        pageElementCount = 0;
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

                //Remove prerendered data
                base.prerender.empty();
    
                //Store the layout in localstorage for faster load times
                $.osci.storage.set('osci_layout_cache:' + base.options.cacheId, {options : base.options, content : base.viewer.html()}, base.options.layoutCacheTime);
            } else {
                //Cache found load layout from localstorage
                base.options = cache.data.options;
                base.viewer.append(cache.data.content);
            }
            
            //Remove base data
            delete base.data;
            
            //Trigger event to let other features know layout is complete
            $(document).trigger("osci_layout_complete");
        };

        //Add content to the current page
        function _addPageContent(content, page)
        {
            var column, pageColumnData, pageColumnDataCount = 0, pageColumnNumber = 0, heightRemain = 0, offset = 0, 
                lineHeight, colHeight, overflow = false, paragraphIdentifier, figureProcessed = false, columnContentCount, isP = true,
                numLines, visibleLines, figureLinks;

            isP = content.is("p");
            
            //Determine which column to put content into
            pageColumnData = page.data("column_data");
            pageColumnDataCount = pageColumnData.length;
            for (var i = 0; i < pageColumnDataCount; i++) {
                //If there is height remaining in the column, get it
                if (pageColumnData[i].heightRemain > 0) {
                    //check for exising column
                    column = $("div.column_" + i, page);
                    pageColumnNumber = i;
                    page.data("current_column", pageColumnNumber);
                    //if column doesnt exist, create it
                    if (!column.length) {
                        //create the column
                        column = _newColumn(page).appendTo(page);
                        //if not first column, use offset from previous column. first column, use offset from previous page
                        if (pageColumnNumber > 0) {
                            offset = pageColumnData[(pageColumnNumber-1)].heightRemain;
                        } else {
                            offset = page.data("contentStartOffset");
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
                offset = content.outerHeight() + offset;
                
                //Set the top margin
                content.css("margin-top", "-" + offset + "px");
            }

            //find figure references and process the figure
            figureLinks = $("a.figure-link:not(.processed)", content);
            if (figureLinks.length) {
                figureLinks.each(function(i, l){
                    var linkLocation, $l = $(l);

                    //make sure the figure link is in the viewable area of the current column
                    linkLocation = $l.position().top;
                    if (linkLocation >= 0 && linkLocation <= pageColumnData[pageColumnNumber].height) {
                        //process the figure
                        _process_figure($l, page);
                        figureProcessed = true;
                    }
                });

                //If a figure has been processed, start the current page processing over
                if (figureProcessed) {
                    page.data("process", "restart");
                    return true;
                }
            }

            // Position Paragraph Identifiers in the gutter
            paragraphIdentifier = $("span.osci_paragraph_identifier", content).remove();
            if (paragraphIdentifier.length) {
                if ($("span.osci_paragraph_" + paragraphIdentifier.data("paragraph_id"), page).length === 0) {
                    paragraphIdentifier.appendTo(page).css({
                        "margin-left" : (parseFloat(column.css("margin-left")) - Math.ceil(base.options.gutterWidth / 2)) + "px",
                        "margin-top" : content.position().top + parseInt(column.css("margin-top"), 10) + "px"
                    });
                }
            }

            //Update how much vertical height remains in the column
            heightRemain = pageColumnData[pageColumnNumber].heightRemain - content.outerHeight() + offset;

            if (heightRemain > 0 && heightRemain < lineHeight) {
                heightRemain = 0;
            }
            
            //If we have negative height remaining, the content must be repeated in the next column
            if (heightRemain < 0) {
                
                //Adjust the column height so partial lines of text are removed
                numLines = content.height() / lineHeight;
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
        function _process_figure(figureLink, page)
        {
            var figure, aspect, columns, position, verticalPosition, horizontalPosition, column, addLeftPadding = 0,
                offsetLeft, offsetTop, width, height, captionHeight, columnCoverage = [], colStart, colEnd;

            //Add a class to the figure link (in current content and the prerendered content) so it is only processed once
            $("a[href=" + figureLink.attr("href") + "]", base.prerender).addClass("processed");
            figureLink.addClass("processed");

            //get the actual figure
            figure = base.figures.filter(figureLink.attr("href"));

            //give it a class for processing status
            figure.addClass("processed").appendTo(page);

            //Get the current column
            column = page.data("current_column");
            
            //Get figure layout hint data from data attributes on the figure element
            columns = figure.data("columns");
            position = figure.data("position");
            aspect = figure.data("aspect");

            //Split out the positioning queues
            verticalPosition = position.substr(0,1);
            horizontalPosition = (position.length === 2) ? position.substr(1,1) : position.substr(0,1); 

            //Add the split position data back onto the figure element
            figure.data("vertical_position", verticalPosition);
            figure.data("horizontal_position", horizontalPosition);

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
            captionHeight = $("figcaption", figure).height();
            
            //Calculate height of figure plus the caption
            height = (width / aspect) + captionHeight;

            //If the height of the figure is greater than the page height, scale it down
            if (height > base.options.innerPageHeight) {
                height = base.options.innerPageHeight;

                width = (height - captionHeight) * aspect;
                columns = Math.ceil(width / base.options.columnWidth);
            }
            figure.css({ height :  height + "px", width : width + "px"});

            //Set the size of the figure content div inside the actual figure element
            $(".figureContent", figure).css({
                width : width,
                height : height - captionHeight
            });
            
            if (width < (base.options.columnWidth * columns)) {
                addLeftPadding = Math.floor(((base.options.columnWidth * columns) - width) / 2);
            }

            //Detemine the left offset base on the layout hint
            switch (horizontalPosition) {
                //right
                case 'r':
                    offsetLeft = ((base.options.columnsPerPage - columns) * base.options.columnWidth) + (((base.options.columnsPerPage - 1) - (columns - 1)) * base.options.gutterWidth) + base.options.innerPageGutter[3] + addLeftPadding;
                    break;
                //left & fullpage
                case 'l':
                case 'p':
                    offsetLeft = base.options.innerPageGutter[3] + addLeftPadding;
                    break;
                //In the current column
                default:
                    if ((column + columns) > base.options.columnsPerPage) {
                        column -= (column + columns) - base.options.columnsPerPage;
                    }
                    offsetLeft = base.options.innerPageGutter[3] + (column * base.options.columnWidth) + (column * base.options.gutterWidth) + addLeftPadding;
            }
            figure.css("margin-left", offsetLeft);

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
            figure.css("margin-top", offsetTop);

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
            figure.data("column_coverage", columnCoverage);
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
                    viewerHeight -= $elem.outerHeight();
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
                data : {column : colNumber},
                css : {
                    width : base.options.columnWidth + "px",
                    "margin-left" : leftOffset + "px",
                    "margin-top" : topOffset + "px",
                    height : height
                } 
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
                }
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
            figures = $("figure", page);

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
                                    topOffset += $fig.height() + base.options.innerPageGutter[0];
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