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
            
            base.$el.bind({
                "osci_more_toggle" : function(e){
                    var $this = $(this);

                    if (($this.hasClass("open") && !e.osci_more_open) || e.osci_more_close) {
                        if (base.options.moreToggleCallback !== undefined) {
                            base.options.moreToggleCallback($this, "close");
                        }
                        $this.removeClass("open");
                    } else {
                        if (base.options.moreToggleCallback !== undefined) {
                            base.options.moreToggleCallback($this, "open");
                        }
                        $this.addClass("open");
                    }
                },
                "osci_more_goto" : function(e){
                    var $this = $(this), tabNum, tabData, tab, itemNumber, gotoPage,
                        tabs = $("#" + base.options.tabContainerId, base.$el);
                    
                    if (base.tab_map[e.tab_name] !== undefined) {
                        tabNum = base.tab_map[e.tab_name];
                        
                        tabs.tabs("select", tabNum);
                        
                        tab = $("div.ui-tabs-panel:not(.ui-tabs-hide)", $this);
                        tabData = tab.data();
                        
                        itemNumber = $(e.selector, tab).index();
    
                        if (tabData.osci_pager_per_page > 1) {
                            gotoPage = Math.ceil(itemNumber / tabData.osci_pager_per_page) - 1;
                        } else {
                            gotoPage = itemNumber;
                        }
                        $("li.osci_pager_item:eq(" + gotoPage + ")", tab).children().click();
                        
                        $this.trigger({ type : "osci_more_toggle", osci_more_open : true});
                    }
                }
            }).addClass("open");
            
            base.$el.find("a.osci_more_handle").click(function(e){
                e.preventDefault();
                base.$el.trigger({type : "osci_more_toggle"});
            }).click();
            
            tabs = $("<div>", {
                id : base.options.tabContainerId
            }).append('<ul><li class="placeholder_tab"><a href="#osci_more_tab_1">placeholder</a></li></ul><div id="osci_more_tab_1"></div>').appendTo(base.$el).tabs();
            tabs.tabs("remove", 0);
        };
        
        base.add_content = function(tabName, data, paginate, perPage, callback)
        {
            var tabNum, tabId = "osci_tab_" + tabName, tab, total, i, pager, item, maxPagesDisplay = 5, totalPages,
                tabs = $("#" + base.options.tabContainerId, base.$el), tabWidth, calcWidth, pagerItemText, maxPagerItemText,
                pagerItems = [], hasPagerDisplayData = false;

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
            } else {
                tab = $("#" + tabId, tabs);
            }
            
            tab.empty();
            tabs.tabs("select", tabNum);
            
            if (data.length) {
                if (paginate === true) {   
                    total = data.length;
                    tab.append($("<div>",{"class" : "osci_pager_display_item"}).append(data).overscroll());
                    
                    if (perPage === undefined) {
                        tabWidth = tab.width();
                        calcWidth = 0;
                        perPage = 0;
                        data.each(function(i, elem) {
                            var $elem = $(elem),
                                elemWidth = $elem.outerWidth(true);
                            
                            calcWidth = calcWidth + elemWidth;
                            if (calcWidth <= tabWidth) {
                                perPage = perPage + 1;
                            } else {
                                return false;
                            }
                        });
                    }
                    
                    data.hide();
                    
                    if (data.filter(":first").data("pager_display")) {
                        hasPagerDisplayData = true;
                    }
                    
                    totalPages = Math.ceil(total / perPage);
                    maxPagesDisplay = Math.min(maxPagesDisplay, totalPages);
                    
                    pager = $("<ul>", {
                        id : tabId + "_pager",
                        "class" : "osci_pager"
                    });
                    
                    pagerItems.push($("<li>", {
                        html : $("<a>", {
                            text : "first",
                            data : {page_number : 0},
                            "class" : "osci_pager_nav_first"
                        }),
                        "class" : "osci_pager_nav_first"
                    }));
                    
                    pagerItems.push($("<li>", {
                        html : $("<a>", {
                            text : "prev",
                            data : {page_number : -1},
                            "class" : "osci_pager_nav_prev"
                        }),
                        "class" : "osci_pager_nav_prev"
                    }));
                    
                    pagerItems.push($("<li>", {
                        html : $("<span>", {
                            text : "..."
                        }),
                        "class" : "less"
                    }).hide());
                    
                    for (i = 1; i <= totalPages; i++) {
                        if (hasPagerDisplayData) {
                            if (perPage > 1) {
                                maxPagerItemText = (i * perPage) > total ? data.filter(":eq(" + (total - 1) + ")").attr("data-pager_display") : data.filter(":eq(" + ((i * perPage) - 1) + ")").attr("data-pager_display");
                                pagerItemText = data.filter(":eq(" + ((i * perPage) - perPage) + ")").attr("data-pager_display") + " - " + maxPagerItemText;
                            } else {
                                pagerItemText = data.filter(":eq(" + (i - 1) + ")").data("pager_display");
                            }
                        } else {
                            if (perPage > 1) {
                                maxPagerItemText = (i * perPage) > total ? total : (i * perPage);
                                pagerItemText = ((i * perPage) - perPage + 1) + " - " + maxPagerItemText;
                            } else {
                                pagerItemText = i;
                            }
                        }
                        
                        item = $("<li>",{
                            html : $("<a>",{
                                text : pagerItemText,
                                data : {page_number : i - 1},
                                href : "#"                            
                            }),
                            "class" : "osci_pager_item"
                        }).hide();
                        
                        if (i <= maxPagesDisplay) {
                            item.show();
                        }
                        
                        if (i === 1) {
                            item.addClass("first");
                        }
                        
                        if (i === totalPages) {
                            item.addClass("last");
                        }
                        
                        pagerItems.push(item);
                    } 
                    
                    pagerItems.push($("<li>", {
                        html : $("<span>", {
                            text : "..."
                        }),
                        "class" : "more"
                    }).hide());
                    
                    pagerItems.push($("<li>", {
                        html : $("<a>", {
                            text : "next",
                            data : {page_number : 1},
                            "class" : "osci_pager_nav_next"
                        }),
                        "class" : "osci_pager_nav_next"
                    }));
                    
                    pagerItems.push($("<li>", {
                        html : $("<a>", {
                            text : "last",
                            data : {page_number : totalPages - 1},
                            "class" : "osci_pager_nav_last"
                        }),
                        "class" : "osci_pager_nav_last"
                    }));
                    
                    pager.append.apply(pager, pagerItems);
                    
                    pager.delegate("a", "click", function(e) {
                        e.preventDefault();
                        var $this = $(this),
                            pageNum = $this.data("page_number"),
                            container = $this.parents(".ui-tabs-panel"),
                            currentPage = container.data("osci_pager_current_page"),
                            totalItems = container.data("osci_pager_total_items"),
                            totalPages = container.data("osci_pager_total_pages"),
                            perPage = container.data("osci_pager_per_page"),
                            pagerItems = container.find("li.osci_pager_item"),
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
    
                        pagerItem = container.find("li.osci_pager_item:eq(" + pageNum + ")");
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
                            container.find("li.more").hide();
                        } else {
                            container.find("li.more").show();
                        }
                        
                        if (pagerItems.filter(".first:visible").length){
                            container.find("li.less").hide();
                        } else {
                            container.find("li.less").show();
                        }
                        
                        startItem = pageNum * perPage;
                        endItem = startItem + perPage;
                        
                        container.find("div.osci_pager_display_item").children().hide().slice(startItem, endItem).show();
                    });
                    
                    tab.data({
                       osci_pager_total_items : total,
                       osci_pager_total_pages : totalPages,
                       osci_pager_per_page : perPage,
                       osci_pager_current_page : 1,
                       osci_pager_max_pages_display : maxPagesDisplay
                   }).append(pager);
                    
                    $("#" + tabId).find("a.osci_pager_nav_first").click();
                } else {
                    tab.html(data);
                }
                
                if ($.isFunction(callback)) {
                    callback(tab);
                }
            }
        }
        
        base.init();
    };

    $.osci.more.defaultOptions = {
        tabContainerId : "osci_more_tabs",
        defaultTabs : ["footnotes"],
        moreToggleCallback : undefined
    };

    $.fn.osci_more = function( options )
    {
        return this.each(function()
        {
            (new $.osci.more(this, options)); 
        });
    };

})(jQuery);
