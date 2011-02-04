(function($)
{
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.navigation = function(el, options)
    {
        var base = this;

        base.$el = $(el);
        base.el = el;

        base.$el.data("osci.navigation", base);
 
        base.init = function()
        {
            var toc;
            
            $.osci.storage.clearCache("osci_layout_cache:");
            
            base.options = $.extend({}, $.osci.navigation.defaultOptions, options);
            
            base.options.bid = (base.options.bid) ? base.options.bid : parseInt(Drupal.settings.osci.bid);
            base.options.nid = (base.options.nid) ? base.options.nid : parseInt(Drupal.settings.osci.nid);
            base.options.mlid = (base.options.mlid) ? base.options.mlid : parseInt(Drupal.settings.osci.mlid);
            
            base.navigation = {
                nid : base.options.nid,
                mlid : base.options.mlid,
                currentPage : 0,
                pageCount : 0,
                to : {operation : "page", value : "first"}
            }
            
            _update_history(true);
            
            toc = _get_table_of_contents(base.options.nid, base.options.bid);
            base.navigation.toc = toc.data;
            
            $(document).bind("osci_layout_complete",function(){
                _reset_navigation();
            });
            
            $(window).bind("popstate",function(e){
                if (e.originalEvent.state !== null && e.originalEvent.state.nid) {
                    if (base.navigation.nid !== e.originalEvent.state.nid) {
                        base.navigation.nid = e.originalEvent.state.nid;
                        base.navigation.to = {operation : "page", value : "first"};
                        _load_section();
                    }
                }
            });
            
            $("#" + base.options.prevLinkId).click(function (e){
                e.preventDefault();
                _navigateTo({
                    operation : "prev"
                });
            });
            
            $("#" + base.options.nextLinkId).click(function (e){
                e.preventDefault();
                _navigateTo({
                    operation : "next"
                });
            });
            
            $(document).keydown(function(e){
                var keyCode = e.keyCode || e.which;

                switch(keyCode) {
                    case 37:
                        $("#" + base.options.prevLinkId).click();
                        break;
                    case 39:
                        $("#" + base.options.nextLinkId).click();
                        break;
                }
            });
            
            //Not sure if this fits here but prevents this getting assigned more than once in the layout module
            if (!window.resizeTimer) {
                $(window).resize(function(){
                    if (window.resizeTimer) clearTimeout(window.resizeTimer);
                    window.resizeTimer = setTimeout(_osci_resize, 100);
                });
            }
            
            _load_section();
        };    
        
        function _get_table_of_contents(nid, bid)
        {
            return $.osci.storage.getUrl({
                url : base.options.apiEndpoint + nid + "/book.json",
                key : "bid_" + bid,
                type : "json"
            });
        };
        
        function _osci_resize()
        {
            var firstParagraph = $("p.osci_paragraph:first", "div.osci_page_" + (base.navigation.currentPage + 1));
            base.navigation.to = { operation : "paragraph", value : firstParagraph.data("paragraph_id")};
            
            $.osci.storage.clearCache("osci_layout_cache:");
            _load_section(false);
        }
        
        function _load_section(changeState)
        {
            if (changeState === undefined) {
                changeState = true;
            }
            
            var content = $.osci.storage.getUrl({
                url :  base.options.contentEndpoint.replace("{$nid}", base.navigation.nid),
                expire : base.options.cacheTime
            });
            
            $("#" + base.options.readerId).osci_layout(content.data, {
                cacheId : base.navigation.nid,
                minColumnWidth : Drupal.settings.osci_layout.min_column_width,
                maxColumnWidth : Drupal.settings.osci_layout.max_column_width,
                gutterWidth : Drupal.settings.osci_layout.gutter_width,
                innerPageGutter : Drupal.settings.osci_layout.inner_page_gutter,
                outerPageGutter : Drupal.settings.osci_layout.outer_page_gutter,
                viewerId : Drupal.settings.osci_layout.viewer_id,
                minLinesPerColumn : Drupal.settings.osci_layout.min_lines_per_column,
                layoutCacheTime : Drupal.settings.osci_layout.cache_time
            });
            
            if (changeState) {
                _update_history();
            }
        };
        
        function _reset_navigation()
        {
            var paragraphData, page,
                layoutData = $("#" + base.options.readerId).data("osci.layout");

            base.navigation.currentPage = 0;
            base.navigation.pageCount = layoutData.options.pageCount;
            base.navigation.layoutData = layoutData.options;
            base.navigation.length = parseInt(base.navigation.toc["nid_" + base.navigation.nid].length);

            _update_title();
            _create_section_navigation_bar();
            _navigateTo(base.navigation.to);
        };
        
        function _update_title()
        {
            var hasParent = true,
                header = $("#" + base.options.headerId),
                titleParts = [],
                nid = base.navigation.nid,
                titleLength = 0,
                bookTitle = "",
                subTitle = "";
            
            while (hasParent) {
                titleParts.push(base.navigation.toc["nid_" + nid].title);
                
                if (base.navigation.toc["nid_" + nid].parent.nid) {
                    nid = base.navigation.toc["nid_" + nid].parent.nid;
                } else {
                    hasParent = false;
                }
            }
            
            titleLength = titleParts.length;
            for (var i = 0; i < titleLength; i++) {
                if (i == titleLength - 1) {
                    bookTitle = titleParts[i];
                } else {
                    if (subTitle.length) {
                        subTitle = titleParts[i] + ": " + subTitle;
                    } else {
                        subTitle = titleParts[i];
                    }
                }
            }

            $("h1.osci_book_title").text(bookTitle);
            $("h2.osci_book_section_title").text(subTitle);
        }
        
        function _update_history(replace)
        {
            if (window.history) {
                if (replace) {
                    window.history.replaceState({nid:base.navigation.nid}, document.title);
                } else {
                    window.history.pushState(
                        {nid : base.navigation.nid},
                        document.title, 
                        "/node/" + base.navigation.nid + "/reader"
                    );
                }
            }
        }
        
        function _navigateTo(to)
        {
            var totalColumns, newPage, tocData, newOffset;

            switch(to.operation) {
                case "next":
                    base.navigation.currentPage++;
                    if (base.navigation.currentPage >= base.navigation.pageCount) {
                        tocData = base.navigation.toc["nid_" + base.navigation.nid].next;
                        if (tocData.nid) {
                            base.navigation.nid = tocData.nid;
                            base.navigation.to = {operation : "page", value : "first"};
                        }

                        _load_section();
                        return;
                    }
                    break;

                case "prev":
                    if (base.navigation.currentPage < 1) {
                        tocData = base.navigation.toc["nid_" + base.navigation.nid].prev;
                        if (tocData.nid) {
                            base.navigation.nid = tocData.nid;
                            base.navigation.to = {operation : "page", value : "last"};
                        }

                        _load_section();
                        return;
                    }
                    base.navigation.currentPage--;
                    break;

                case "page":
                    if (to.value === "first") {
                        base.navigation.currentPage = 0;
                    } else if (to.value === "last") {
                        base.navigation.currentPage = base.navigation.pageCount - 1;
                    } else if (to.value > base.navigation.pageCount || to.value < 1) {
                        return;
                    } else {
                        base.navigation.currentPage = to.value - 1;
                    }
                    break;

                case "column":
                    totalColumns = base.navigation.layoutData.columnsPerPage * base.navigation.pageCount;
                    if (to.value > totalColumns || to.value < 1) {
                        return;
                    }

                    newPage = Math.ceil(to.value / base.navigation.layoutData.columnsPerPage);
                    _navigateTo({operation:"page",value:newPage});
                    return;
                    break;
                    
                case "paragraph":
                    newPage = $("p.osci_paragraph_" + to.value + ":first","#" + base.navigation.layoutData.viewerId).parents(".osci_page").data("page");
                    _navigateTo({operation:"page",value:newPage});
                    return;
                    break;
            }

            newOffset = 0;
            if (base.navigation.currentPage > 0) {
                newOffset = -1 * ((base.navigation.currentPage * base.navigation.layoutData.pageWidth) + 
                    ((base.navigation.layoutData.outerPageGutter[1] + base.navigation.layoutData.outerPageGutter[3]) * (base.navigation.currentPage)));
            }

            $("#" + base.options.sectionNavId).trigger("osci_update_navigation_section", base.navigation.currentPage);

            jQuery(".osci_page", "#osci_viewer").css({
                "-webkit-transform" : "translate(" + newOffset + "px, 0)",
                "-moz-transform" : "translate(" + newOffset + "px, 0)",
                "transform" : "translate(" + newOffset + "px, 0)"
            });
        };
        
        function _create_section_navigation_bar()
        {
            var container = $("#" + base.options.sectionNavId),
                parts = base.navigation.pageCount,
                partWidth = Math.floor(container.width() / base.navigation.pageCount),
                navBar, i, classes = "", heightRemain = 0, genWidth = 0, li;

            heightRemain = container.width() - (parts * partWidth) - 1;
            
            navBar = $("#osci_navigation_section_list", container);
            if (!navBar.length) {
                navBar = $("<ul>", {
                    id : "osci_navigation_section_list"
                }).appendTo(container);
            }
            navBar.empty();
            
            i = 1;
            while (i <= parts) {
                classes = "";
                if (i === 1) {
                    classes += "first active";
                } else if (i === parts) {
                    partWidth += heightRemain;
                    classes += "last";
                }
                
                li = $("<li>",{
                    css : { width : partWidth + "px" },
                    data : { navigateTo : i },
                    "class" : classes,
                    click : function (e) {
                        e.preventDefault();
                        
                        var page, $this;
                        
                        $this = $(this);
                        page = $this.data("navigateTo");
                        
                        $this.siblings().removeClass("active");
                        $this.addClass("active");
                        _navigateTo({operation : "page", value : page});
                    }
                }).appendTo(navBar);
                
                if (li.outerWidth() > li.width()) {
                    li.width((li.width() - (li.outerWidth() - li.width())) + "px");
                }
                i++;
            }
            
            container.bind("osci_update_navigation_section", function(e, page){
                $("li", this).removeClass("active");
                $("li:eq(" + page + ")", this).addClass("active");
            });
        }

        base.init();
    };

    $.osci.navigation.defaultOptions = {
        readerId : "osci_viewer_wrapper",
        headerId : "osci_header",
        apiEndpoint : "http://osci.localhost/api/navigation/",
        contentEndpoint : "http://osci.localhost/node/{$nid}/bodycopy",
        sectionNavId : "osci_navigation_section",
        bid : 0,
        nid : 0,
        mlid : 0,
        prevLinkId : "osci_nav_prev",
        nextLinkId : "osci_nav_next",
        cacheTime : 86400
    };

    $.fn.osci_navigation = function( options )
    {
        return this.each(function()
        {
            (new $.osci.navigation(this, options)); 
        });
    };

})(jQuery);

/*
var currentPage = 0;

jQuery(document).ready(function() {

    jQuery("#osci_viewer_wrapper").swipe({
        swipeLeft : function () { $("a.next","#osci_navigation").click(); },
        swipeRight : function () { $("a.prev","#osci_navigation").click(); }
    });

    jQuery("a.footnote-link, a.figure-link","#osci_viewer").live('click',function(e){
        e.preventDefault();
        var $this = jQuery(this);

        navigateTo({
	    operation : 'page',
            value : jQuery($this.attr("href")).parents(".osci_page").data("page")
        });

        jQuery($this.attr("href")).effect("pulsate", { times : 3 }, 1000);
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

    var content = jQuery.osci.getUrl({ url: url, clear : true });
    jQuery("#osci_reader_content").osci_layout(content.data, {});

});
*/
