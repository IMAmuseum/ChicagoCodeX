(function($)
{
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.more = function(el, options)
    {
        var base = this;

        base.$el = $(el);
        base.el = el;

        base.$el.data("osci.more", base);
        base.tab_map = {};
        
        base.init = function()
        {
            var tabs
            
            base.options = $.extend({}, $.osci.more.defaultOptions, options);
            
            base.$el.bind("osci_more_toggle", function(e){
                var $this = $(this);

                if (($this.hasClass("open") && !e.osci_more_open) || e.osci_more_close) {
                    $this.css({
                        "-webkit-transform" : "translate(0, " + $this.outerHeight() + "px)",
                        "-moz-transform" : "translate(0, " + $this.outerHeight() + "px)",
                        "transform" : "translate(0, " + $this.outerHeight() + "px)",
                    });
                    $this.removeClass("open");
                } else {
                    $this.css({
                        "-webkit-transform" : "translate(0, 0)",
                        "-moz-transform" : "translate(0, 0)",
                        "transform" : "translate(0, 0)"
                    });
                    $this.addClass("open");
                }
            }).addClass("open");
            
            $(".osci_more_handle", base.$el).click(function(e){
                e.preventDefault();
                base.$el.trigger({type : "osci_more_toggle"});
            });
            
            tabs = $("<div>", {
                id : base.options.tab_container_id
            }).append('<ul><li class="placeholder_tab"><a href="#osci_more_tab_1">placeholder</a></li></ul><div id="osci_more_tab_1"></div>').appendTo(base.$el).tabs();
            tabs.tabs("remove", 0);
        };
        
        base.add_content = function(tabName, data, paginate, perPage)
        {
            var tabNum, tabId = "osci_tab_" + tabName, tab, total, i, pager, item, maxPagesDisplay = 5, totalPages,
                tabs = $("#" + base.options.tab_container_id, base.$el);

            if (base.tab_map[tabName] !== undefined) {
                tabNum = base.tab_map[tabName];
            }
            
            if (tabNum == undefined) {
                tab = $("<div>",{
                    id : tabId
                }).appendTo(tabs);
                
                tabs.tabs("add", "#" + tabId, tabName);

                tabNum = tabs.tabs("length") - 1;
                base.tab_map[tabName] = tabNum;
            }
            
            tabs.tabs("select", tabNum);
            
            if (paginate === true) {   
                total = data.length;
                
                if (perPage === undefined) {
                    perPage = 1;
                }
                
                totalPages = Math.ceil(total / perPage);
                maxPagesDisplay = Math.min(maxPagesDisplay, totalPages);
                
                pager = $("<ul>", {
                    id : tabId + "_pager"
                });
                
                $("<li>", {
                    html : $("<a>", {
                        text : "first",
                        data : {page_number : 0},
                        "class" : "osci_pager_nav_first"
                    }),
                    "class" : "osci_pager_nav_first"
                }).appendTo(pager);
                
                $("<li>", {
                    html : $("<a>", {
                        text : "prev",
                        data : {page_number : -1},
                        "class" : "osci_pager_nav_prev"
                    }),
                    "class" : "osci_pager_nav_prev"
                }).appendTo(pager);
                
                $("<li>", {
                    html : $("<span>", {
                        text : "..."
                    }),
                    "class" : "less"
                }).appendTo(pager).hide();
                
                for (i = 1; i <= totalPages; i++) {
                    item = $("<li>",{
                        html : $("<a>",{
                            text : i,
                            data : {page_number : i - 1},
                            href : "#"                            
                        }),
                        "class" : "osci_pager_item"
                    }).appendTo(pager).hide();
                    
                    if (i <= maxPagesDisplay) {
                        item.show();
                    }
                    
                    if (i === 1) {
                        item.addClass("first");
                    }
                    
                    if (i === totalPages) {
                        item.addClass("last");
                    }
                } 
                
                $("<li>", {
                    html : $("<span>", {
                        text : "..."
                    }),
                    "class" : "more"
                }).appendTo(pager).hide();
                
                $("<li>", {
                    html : $("<a>", {
                        text : "next",
                        data : {page_number : 1},
                        "class" : "osci_pager_nav_next"
                    }),
                    "class" : "osci_pager_nav_next"
                }).appendTo(pager);
                
                $("<li>", {
                    html : $("<a>", {
                        text : "last",
                        data : {page_number : totalPages - 1},
                        "class" : "osci_pager_nav_last"
                    }),
                    "class" : "osci_pager_nav_last"
                }).appendTo(pager);
                
                $("a", pager).bind("click", function(e) {
                    e.preventDefault();
                    var $this = $(this),
                        pageNum = $this.data("page_number"),
                        container = $this.parents(".ui-tabs-panel"),
                        currentPage = container.data("osci_pager_current_page"),
                        totalItems = container.data("osci_pager_total_items"),
                        totalPages = container.data("osci_pager_total_pages"),
                        perPage = container.data("osci_pager_per_page"),
                        pagerItems = $("li.osci_pager_item", container),
                        maxPagesDisplay = container.data("osci_pager_max_pages_display"),
                        pagerItem, displayItem, startItem, endItem;
                    
                    if ($this.hasClass("osci_pager_nav_next")) {
                        pageNum = currentPage + 1;
                        if (pageNum >= totalPages) {
                            pageNum = totalPages - 1;
                        }
                    } else if ($this.hasClass("osci_pager_nav_prev")) {
                        pageNum = currentPage - 1;
                        if (pageNum < 0) {
                            pageNum = 0;
                        }
                    }

                    pagerItem = $("li.osci_pager_item:eq(" + pageNum + ")", container);
                    container.data("osci_pager_current_page", pageNum);
                    pagerItems.removeClass("active");
                    pagerItem.addClass("active");
                    
                    if (pagerItem.css("display") == 'none') {
                        if (pageNum > currentPage) {
                            pagerItems.hide().slice(pageNum - maxPagesDisplay + 1, pageNum  + 1).show();
                        } else {
                            pagerItems.hide().slice(pageNum, pageNum + maxPagesDisplay).show();
                        }
                    }
                    
                    if (pagerItems.filter(".last:visible").length){                   
                        $(".more", container).hide();
                    } else {
                        $(".more", container).show();
                    }
                    
                    if (pagerItems.filter(".first:visible").length){
                        $(".less", container).hide();
                    } else {
                        $(".less", container).show();
                    }
                    
                    startItem = pageNum * perPage;
                    endItem = startItem + perPage;
                    
                    $(".osci_pager_display_item", container).children().hide().slice(startItem, endItem).show();
                });
                
                $("#" + tabId, tabs)
                    .empty()
                    .data({
                        osci_pager_total_items : total,
                        osci_pager_total_pages : totalPages,
                        osci_pager_per_page : perPage,
                        osci_pager_current_page : 1,
                        osci_pager_max_pages_display : maxPagesDisplay
                    })
                    .append(pager)
                    .append($("<div>",{"class" : "osci_pager_display_item"}).append(data.hide()));
                
                $("a.osci_pager_nav_first", "#" + tabId).click();
            } else {
                $("#" + tabId, tabs).html(data);
            }
        }
        
        base.init();
    };

    $.osci.more.defaultOptions = {
        tab_container_id : "osci_more_tabs",
        default_tabs : ["footnotes"]
    };

    $.fn.osci_more = function( options )
    {
        return this.each(function()
        {
            (new $.osci.more(this, options)); 
        });
    };

})(jQuery);