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
            base.data = $(data).filter(".root");
            base.options = $.extend({}, $.osci.layout.defaultOptions, options);
            base.$el.append(base.data).hide();
            base.viewer = $("#" + base.options.viewerId);
 
            $.template("osci_viewer_column",'<div class="column column_${colNumber}" data-column="${colNumber}" style="width: ${width}px; left: ${left}px;"></div>');
            $.template("osci_viewer_page",'<div class="osci_page osci_page_${pageNumber}" data-page="${pageNumber}"></div>');

            $(window).resize(function(){
                clearTimeout(this.id);
                this.id = setTimeout(base.render(), 500);
            });

            base.render();
        };

        base.render = function()
        {
            base.options.viewHeight = base.viewer.height();
            base.options.viewWidth  = base.viewer.width();
            base.options.columnCount = 1;
            base.options.pageCount = 1;

            _calcColumnInfo();
           
            base.data.css("width", base.options.columnWidth + "px");

            _processData(base.data);

            base.options.totalPages = Math.ceil(base.options.columnCount / base.options.columnsPerPage);
        };

        function _processData(data, column)
        {
            var maxHeight, heightRemain, leftOffset, topOffset = 0, lineHeight = 0;

            leftOffset = (base.options.columnCount - 1) * base.options.columnWidth;

            if (column === undefined) {
                column = $.tmpl("osci_viewer_column", {width : base.options.columnWidth, colNumber : base.options.columnCount, left : leftOffset}).appendTo(base.viewer);
            }

            maxHeight = base.options.viewHeight;
            heightRemain = maxHeight - column.height() - parseInt(column.css("top"));

            data.each(function(i, elem){
                var clone, cloneCount = 0, colHeight, $elem = $(elem);

                switch(elem.tagName) {
                    case 'HEADER':
                    case 'SECTION':
                        column = _processData($elem.children(), column);
                        return true;
                        break;
                    default:
                        column.append($elem);
                        break;
                }

                lineHeight = parseFloat($elem.css("line-height"));
                heightRemain = maxHeight - column.height() - parseInt(column.css("top"));

                while (heightRemain <= 0) {
                    leftOffset = (base.options.columnCount * base.options.columnWidth) + (base.options.gutterWidth * base.options.columnCount);
                    base.options.columnCount++;

                    if (elem.tagName !== 'SECTION') {
                        colHeight = $elem.position().top + (Math.floor((maxHeight - $elem.position().top - parseInt(column.css("top"))) / lineHeight) * lineHeight);
                        column.height(colHeight);
                        heightRemain -= maxHeight - colHeight - parseInt(column.css("top"));
                    }

                    column = $.tmpl("osci_viewer_column", {width : base.options.columnWidth, colNumber : base.options.columnCount, left : leftOffset}).appendTo(base.viewer);
                    if (elem.tagName !== 'SECTION' && heightRemain < 0) {
                        topOffset = $elem.height() + heightRemain;
                        if (topOffset % lineHeight !== 0) {
                            topOffset = (Math.floor(topOffset / lineHeight) * lineHeight) + lineHeight;
                        }
                        clone = $elem.clone();
                        cloneCount++;
                        if (clone.attr("id")) {
                            clone.attr("id", clone.attr("id") + "-" + cloneCount);
                        }
                        column.append(clone).css("top", "-" + topOffset + "px");
                    }
                    heightRemain = maxHeight - column.height() + topOffset;
                }
            });

            return column;
        }

        function _calcColumnInfo()
        {
            var colWidth = 0,
                perPage = 1;

            if (base.options.viewWidth < base.options.maxColumnWidth) {
                colWidth = base.options.viewWidth;
            } else {
                colWidth = base.options.maxColumnWidth;
            }

            base.options.columnWidth = colWidth;

            perPage = Math.floor(base.options.viewWidth / colWidth);
            if (base.options.viewWidth < (perPage * colWidth) + ((perPage - 1) * base.options.minGutterWidth)) {
                perPage = perPage - 1;
            }

            base.options.gutterWidth = Math.floor((base.options.viewWidth - (perPage * colWidth)) / (perPage - 1));

            base.options.columnsPerPage = perPage;
        };

        base.init();
    };

    $.osci.layout.defaultOptions = {
        maxColumnWidth : 260,
        minGutterWidth : 6,
        viewerId : 'osci_viewer'
    };

    $.fn.osci_layout = function( data, options )
    {
        return this.each(function()
        {
            (new $.osci.layout(this, data, options)); 
        });
    };

})(jQuery);

var currentPage = 0;

jQuery(document).ready(function() {
    function navigateTo(to)
    {
        var newX, totalColumns, newPage, layoutData = jQuery("#osci_reader_content").data("osci.layout").options;
 
        switch(to.operation) {
            case 'first':
               currentPage = 0;
               break;

            case 'last':
               currentPage = layoutData.totalPages - 1;
               break;

            case 'next':
                currentPage++;
                if (currentPage >= layoutData.totalPages) {
                    currentPage--;
                    return;
                }
                break;

            case 'prev':
                if (currentPage < 1) {
                    return;
                }
                currentPage--;
                break;

            case 'page':
                if (to.value > layoutData.totalPages || to.value < 1) {
                    return;
                }
                currentPage = to.value - 1;
                break;

            case 'column':
                totalColumns = layoutData.columnsPerPage * layoutData.totalPages;
                if (to.value > totalColumns || to.value < 1) {
                    return;
                }

                newPage = Math.ceil(to.value / layoutData.columnsPerPage);
                navigateTo({operation:'page',value:newPage});
                return;
                break;
        }

        newX = -1 * (currentPage) * ((layoutData.columnWidth * layoutData.columnsPerPage) + ((layoutData.columnsPerPage) * layoutData.gutterWidth));

        jQuery(".column","#osci_viewer").css({
            "-webkit-transform" : "translate(" + newX + "px, 0)",
            "transform" : "translate(" + newX + "px, 0)",
            "-moz-transform" : "translate(" + newX + "px, 0)"
        });
    };

    jQuery("<a>", {
        href : "#",
        "class" : "first awesome",
        html : "&laquo; first",
        click : function(e) {
            var $this = jQuery(this);
            e.preventDefault();
            navigateTo({operation:'first'});
        }
    }).appendTo("#osci_navigation");

    jQuery("<a>", {
        href : "#",
        "class" : "prev awesome",
        html : "&lsaquo; prev",
        click : function(e) {
            var $this = jQuery(this);
            e.preventDefault();
            navigateTo({operation:'prev'});
        }
    }).appendTo("#osci_navigation");

    jQuery("<a>", {
        href : "#",
        "class" : "next awesome",
        html : "next &rsaquo;",
        click : function(e) {
            var $this = jQuery(this);
            e.preventDefault();
            navigateTo({operation:'next'});
        }
    }).appendTo("#osci_navigation");

    jQuery("<a>", {
        href : "#",
        "class" : "last awesome",
        html : "last &raquo;",
        click : function(e) {
            var $this = jQuery(this);
            e.preventDefault();
            navigateTo({operation:'last'});
        }
    }).appendTo("#osci_navigation");

    jQuery("a.footnote-link","#osci_viewer").live('click',function(e){
        e.preventDefault();
        var $this = jQuery(this);

        navigateTo({
	    operation : 'column',
            value : parseInt(jQuery($this.attr("href")).parent(".column").data("column"))
        });
    });

    jQuery(document).keydown(function(e){
        var keyCode = e.keyCode || e.which;

        switch(keyCode) {
            case 37:
                jQuery("a.prev").click();
                break;
            case 39:
                jQuery("a.next").click();
                break;
        }
    });

    var url = document.URL;
    url = url.replace("reader","bodycopy");

    var content = jQuery.osci.getUrl({ url: url });
    jQuery("#osci_reader_content").osci_layout(content.data, {maxColumnWidth : 300});
});
