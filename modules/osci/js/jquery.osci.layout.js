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
            base.data = $("section > *:not(section, header)", data);
            base.options = $.extend({}, $.osci.layout.defaultOptions, options);
            base.viewer = $("#" + base.options.viewerId);
            base.prerender = $("#osci_reader_content");
            
            if (!base.prerender.length) {
                base.prerender = $("<div>", {id : "osci_reader_content"});
                base.$el.append(base.prerender);
            }
// Moved to the navigation module so that it does not get triggerd multiple times after more than one node has been loaded
//            if (!window.resizeTimer) {
//                $(window).resize(function(){
//                    if (window.resizeTimer) clearTimeout(window.resizeTimer);
//                    window.resizeTimer = setTimeout(base.render, 100);
//                });
//            }

            base.render();
        };

        base.render = function()
        {
            var i = 0, elements, totalElements = 0, page, currentElement, pageElementCount, 
                figureLinks, overflow, contentOffset = 0, cache = null;

            $(document).trigger("osci_layout_start");
            _updateHeights();
            base.viewer.empty();
            
            cache = $.osci.storage.get('osci_layout_cache:' + base.options.cacheId);
            
            if (cache == null) {
                base.prerender.append(base.data);
                base.figures = $("figure", base.prerender);
                
                base.options.viewHeight = base.viewer.height();
                base.options.viewWidth  = base.viewer.width();
                base.options.columnCount = 1;
                base.options.pageCount = 0;
    
                _calcViewerInfo();
    
                base.prerender.css("width", base.options.columnWidth + "px");
    
                elements = base.prerender.children();
                totalElements = elements.length;
    
                elements.filter("p").each(function(i, elem){
                    $(elem).prepend($("<span>",{
                        html : i + 1,
                        "class" : "osci_paragraph_identifier osci_paragraph_" + (i + 1),
                        "data-paragraph_id" : i + 1 
                    })).addClass("osci_paragraph_" + (i + 1) + " osci_paragraph").attr("data-paragraph_id", i + 1);
                });
    
                while (i < totalElements) {
                    currentElement = $(elements[i]).clone();
    
                    if (currentElement.text() == 'Figures') {
                        break;
                    }
    
                    if (page == undefined || page.data("process") == 'done') {
                        if (page !== undefined) {
                            contentOffset = page.data("contentStartOffset");
                        }
                        base.options.pageCount++;
                        page = _newPage().appendTo(base.viewer);
                        page.data("contentStartOffset", contentOffset);
                        pageElementCount = 0;
                    }
                    
                    if (_addPageContent(currentElement, page)) {
                        i--;
                    } else {
                        pageElementCount++;
                    }
                    i++;
    
                    if (page.data("process") == "restart") {
                        _reset_page(page);
                        i = i - pageElementCount;
                        pageElementCount = 0;
                    }
                }

                base.prerender.empty();
    
                $.osci.storage.set('osci_layout_cache:' + base.options.cacheId, {options : base.options, content : base.viewer.html()}, base.options.layoutCacheTime);
            } else {
                base.options = cache.data.options;
                base.viewer.append(cache.data.content);
            }
            
            delete base.data;
            
            $(document).trigger("osci_layout_complete");
        };

        function _addPageContent(content, page)
        {
            var column, pageColumnData, pageColumnDataCount = 0, pageColumnNumber = 0, heightRemain = 0, offset = 0, 
                lineHeight, colHeight, overflow = false, paragraphIdentifier, figureProcessed = false, columnContentCount;

            pageColumnData = page.data("column_data")
            pageColumnDataCount = pageColumnData.length;
            for (var i = 0; i < pageColumnDataCount; i++) {
                if (pageColumnData[i].heightRemain > 0) {
                    column = $("div.column_" + i, page);
                    pageColumnNumber = i;
                    page.data("current_column", pageColumnNumber);
                    if (!column.length) {
                        column = _newColumn(page).appendTo(page);
                        if (pageColumnNumber > 0) {
                            offset = pageColumnData[(pageColumnNumber-1)].heightRemain;
                        } else {
                            offset = page.data("contentStartOffset");
                        }
                    }
                    break;
                }
            }

            if (column == undefined) {
                page.data("process", "done");
                return true;
            }

            column.append(content);

            lineHeight = parseFloat(content.css("line-height"));

            if (offset !== 0) {
                offset = content.outerHeight() + offset;
                //if (offset % lineHeight !== 0) {
                //    offset = (Math.ceil(offset / lineHeight) * lineHeight) + lineHeight;
                //} else {
                //    offset += lineHeight;
                //}
            }

            content.css("margin-top", "-" + offset + "px");

            figureLinks = $("a.figure-link:not(.processed)", content);
            if (figureLinks.length) {
                figureLinks.each(function(i, l){
                    var linkLocation;

                    linkLocation  = $(l).position().top;
                    if (linkLocation >= 0 && linkLocation <= pageColumnData[pageColumnNumber].height) {
                        _process_figure(l, page);
                        figureProcessed = true;
                    }
                });

                if (figureProcessed) {
                    page.data("process", "restart");
                    return true;
                }
            }

            // Position Paragraph Identifiers in the gutter
            paragraphIdentifier = $("span.osci_paragraph_identifier", content).remove();

            if (paragraphIdentifier.length) {
                if ($("span.osci_paragraph_" + paragraphIdentifier.data("paragraph_id"), page).length == 0) {
                    paragraphIdentifier.appendTo(page).css({
                        "margin-left" : (parseFloat(column.css("margin-left")) - Math.ceil(base.options.gutterWidth / 2)) + "px",
                        "margin-top" : content.position().top + parseInt(column.css("margin-top")) + "px"
                    });
                }
            }

            heightRemain = pageColumnData[pageColumnNumber].height - column.height() + offset;
            if (heightRemain > 0 && heightRemain < lineHeight) {
                heightRemain = 0;
            }
            pageColumnData[pageColumnNumber].heightRemain = heightRemain;

            if (heightRemain < 0) {
                colHeight = content.position().top + (Math.floor((pageColumnData[pageColumnNumber].height - content.position().top - parseInt($("*:first",column).css("margin-top"))) / lineHeight) * lineHeight);
                while (colHeight > pageColumnData[pageColumnNumber].height) {
                    colHeight -= lineHeight;
                }
                column.height(colHeight + "px");
                columnContentCount = column.children().length ? offset : 0;
                heightRemain = -1 * (content.outerHeight() - (colHeight - content.position().top) - columnContentCount);
                pageColumnData[pageColumnNumber].heightRemain = heightRemain;
                overflow = true;
            }

            if (pageColumnNumber == (base.options.columnsPerPage - 1) && heightRemain <= 0) {
                page.data("process", "done");
                page.data("contentStartOffset", heightRemain);
            }
            
            return overflow;
        }

        function _process_figure(figureLink, page)
        {
            var figure;

            figureLink = $(figureLink);
            $("a[href=" + figureLink.attr("href") + "]", base.prerender).addClass("processed");
            figureLink.addClass("processed");

            figure = base.figures.filter(figureLink.attr("href"));

            figure.addClass("processed").appendTo(page);

            _calcFigureInfo(figure, page.data("current_column"));
        }

        function _calcViewerInfo()
        {
            var colWidth = 0,
                perPage = 1,
                gutterCheck = 0;

            base.options.pageWidth = base.options.viewWidth - (base.options.outerPageGutter[1] + base.options.outerPageGutter[3]);
            base.options.pageHeight = base.options.viewHeight - (base.options.outerPageGutter[0] + base.options.outerPageGutter[2]);
            base.options.innerPageHeight = base.options.pageHeight - (base.options.innerPageGutter[0] + base.options.innerPageGutter[2]);
            base.options.innerPageWidth = base.options.pageWidth - (base.options.innerPageGutter[1] + base.options.innerPageGutter[3]);

            if (base.options.innerPageWidth < base.options.maxColumnWidth) {
                colWidth = base.options.innerPageWidth;
            } else {
                colWidth = base.options.maxColumnWidth;
            }

            base.options.columnWidth = colWidth;

            perPage = Math.floor(base.options.innerPageWidth / colWidth);
            if (base.options.innerPageWidth < (perPage * colWidth) + ((perPage - 1) * base.options.gutterWidth)) {
                perPage = perPage - 1;
            }

            gutterCheck = (base.options.innerPageWidth - (perPage * colWidth)) / (perPage - 1);

            if (gutterCheck > base.options.gutterWidth) {
                base.options.columnWidth = (base.options.innerPageWidth - (base.options.gutterWidth * (perPage - 1))) / perPage;
            }

            base.options.columnsPerPage = perPage;
        };

        function _updateHeights()
        {
            var container, viewerHeight = 0;

            container = base.viewer.parent();

            container.height($(window).height() - (container.outerHeight() - container.height()));
            
            viewerHeight = container.height();
            container.children(":not(#osci_viewer)").each(function(i, elem){
                if ($(elem).css("position") != "absolute") {
                    viewerHeight -= $(elem).height();
                }
            });
            base.viewer.height(viewerHeight - 20);
            //base.viewer.height(container.height() - container.children(":not(#osci_viewer)").height() - 20);
        }

        function _newColumn(page)
        {
            var topOffset, leftOffset, pageFigures, heightLength = 0, colNumber = 1, columnData;

            columnData = page.data("column_data");

            heightLength = columnData.length;
            for(var i = 0; i < heightLength; i++) {
                if (columnData[i].heightRemain > 0) {
                    colNumber = i;
                    leftOffset = (i * base.options.columnWidth) + (base.options.gutterWidth * i) + base.options.innerPageGutter[3];
                    topOffset = columnData[i].topOffset;
                    break;
                }
            }

            return $("<div>", {
                "class" : "column column_" + colNumber,
                data : {column : colNumber},
                css : {
                    width : base.options.columnWidth + "px",
                    "margin-left" : leftOffset + "px",
                    "margin-top" : topOffset + "px"
                } 
            });
        }

        function _newPage()
        {
            var data, colDataArray, leftGutterOffset = base.options.outerPageGutter[3];

            if (base.options.pageCount > 1) {
                leftGutterOffset = base.options.outerPageGutter[3] + ((base.options.outerPageGutter[1] + base.options.outerPageGutter[3]) * (base.options.pageCount - 1));
            }

            data = {
                page : base.options.pageCount
            };

            colDataArray = []
            for (var i = 0; i < base.options.columnsPerPage; i++) {
                colDataArray[i] = {height : base.options.innerPageHeight, topOffset : base.options.innerPageGutter[0], heightRemain : base.options.innerPageHeight};
            }
            data["column_data"] = colDataArray;

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

        function _reset_page(page)
        {
            var data, figures, columnCoverage, height, topOffset, heightRemain, pageNum = page.data("page"), lineHeight, minHeight;

            lineHeight = parseInt(page.css("line-height"));
            minHeight = lineHeight * base.options.minLinesPerColumn;

            data = {
                page : pageNum,
                process : "start"
            }

            $("div.column", page).remove();
            $("span.osci_paragraph_identifier", page).remove();

            figures = $("figure", page);

            colDataArray = []
            for (var i = 0; i < base.options.columnsPerPage; i++) {
                height = base.options.innerPageHeight;
                topOffset = base.options.innerPageGutter[0];
                heightRemain = height;

                if (figures.length) {
                    figures.each(function(j, fig) {
                        var $fig = $(fig);
                        columnCoverage = $fig.data("column_coverage");

                        if (columnCoverage[i]) {
                            height -= $fig.height() + base.options.innerPageGutter[0];
                            heightRemain -= $fig.height() + base.options.innerPageGutter[0];

                            if (height < minHeight) {
                                height = 0;
                                heightRemain = 0;
                                return;
                            }

                            switch ($fig.data("vertical_position")) {
                                case 't':
                                case 'p':
                                    topOffset += $fig.height() + base.options.innerPageGutter[0];
                                    break;
                                case 'b':
                                    topOffset = topOffset;
                                    break;
                            }

                        }
                    });
                }
                colDataArray[i] = {height : height, topOffset : topOffset, heightRemain : heightRemain};
            }

            data["column_data"] = colDataArray;

            page.data(data);
        }

        function _calcFigureInfo(figure, column)
        {
            var aspect, columns, position, verticalPosition, horizontalPosition, offsetLeft, offsetTop, width, height, captionHeight, columnCoverage = [], colStart, colEnd;

            columns = figure.data("columns");
            position = figure.data("position");
            aspect = figure.data("aspect");

            verticalPosition = position.substr(0,1);
            horizontalPosition = (position.length == 2) ? position.substr(1,1) : position.substr(0,1); 

            figure.data("vertical_position", verticalPosition);
            figure.data("horizontal_position", horizontalPosition);

            if (typeof(columns) == 'string' && columns.indexOf("%") > 0) {
                columns = Math.ceil((parseInt(columns) / 100) * base.options.columnsPerPage);
            }

            if (columns > base.options.columnsPerPage || position == 'p') {
                width = base.options.innerPageWidth;
                columns = base.options.columnsPerPage;
            } else {
                width = (columns * base.options.columnWidth) + (base.options.gutterWidth * (columns - 1));
            }
            figure.css("width", width + "px");

            captionHeight = $("figcaption", figure).height();
            height = (width / aspect) + captionHeight;

            if (height > base.options.innerPageHeight) {
                height = base.options.innerPageHeight;

                width = (height - captionHeight) * aspect;
            }
            figure.css({ height :  height + "px", width : width + "px"});

            $(".figureContent", figure).css({
                width : width,
                height : height - captionHeight
            });

            switch (horizontalPosition) {
                case 'r':
                    offsetLeft = ((base.options.columnsPerPage - columns) * base.options.columnWidth) + (((base.options.columnsPerPage - 1) - (columns - 1)) * base.options.gutterWidth) + base.options.innerPageGutter[3];
                    break;
                case 'l':
                case 'p':
                    offsetLeft = base.options.innerPageGutter[3];
                    break;
                default:
                    if ((column + columns) > base.options.columnsPerPage) {
                        column -= (column + columns) - base.options.columnsPerPage;
                    }
                    offsetLeft = base.options.innerPageGutter[3] + (column * base.options.columnWidth) + (column * base.options.gutterWidth);
            }
            figure.css("margin-left", offsetLeft);

            switch (verticalPosition) {
                case 't':
                case 'p':
                    offsetTop = base.options.innerPageGutter[0];
                    break;
                case 'b':
                    offsetTop = base.options.innerPageHeight - height + base.options.innerPageGutter[0];
                    break;
            }
            figure.css("margin-top", offsetTop);

            for (var i = 0; i < base.options.columnsPerPage; i++) {
                colStart = (base.options.columnWidth * i) + (base.options.gutterWidth * i) + base.options.innerPageGutter[3];
                colEnd = (base.options.columnWidth * (i + 1)) + (base.options.gutterWidth * i) + base.options.innerPageGutter[3];

                if (offsetLeft <= colStart && (offsetLeft + width) >= colStart) {
                    columnCoverage[i] = true;
                } else {
                    columnCoverage[i] = false;
                }
            }
            figure.data("column_coverage", columnCoverage);
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