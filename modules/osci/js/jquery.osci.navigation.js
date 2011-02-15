(function($)
{
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.navigation = function(options)
    {
        var base = this;
 
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
            
            _create_table_of_contents();
            _load_section();
        };    
        
        function _get_table_of_contents(nid, bid)
        {
            return $.osci.storage.getUrl({
                url : base.options.apiEndpoint + nid + "/book.json",
                key : "bid_" + bid,
                type : "json",
                expire : base.options.cacheTime
            });
        };
        
        function _osci_resize()
        {
            var firstParagraph = $("p.osci_paragraph:first", "div.osci_page_" + (base.navigation.currentPage + 1));
            base.navigation.to = { operation : "paragraph", value : firstParagraph.data("paragraph_id")};
            
            $("ul", "#" + base.options.tocId).trigger("osci_toc_update_heights");
            
            $.osci.storage.clearCache("osci_layout_cache:");
            _load_section(false);
        }
        
        function _load_section(changeState)
        {
            if (changeState === undefined) {
                changeState = true;
            }
            
            var footnotes, data, more
                content = $.osci.storage.getUrl({
                    url :  base.options.contentEndpoint.replace("{$nid}", base.navigation.nid),
                    expire : base.options.cacheTime
                });
            
            data = $(content.data);
            footnotes = $("#field_osci_footnotes", data).remove();
            
            more = $("#osci_more_wrapper").data("osci.more");
            more.add_content("footnotes", $(".footnote", footnotes), true);
            
            $("#" + base.options.readerId).osci_layout(data, {
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
            _update_reference_image();
            _create_section_navigation_bar();
            _navigateTo(base.navigation.to);
        };
        
        function _update_reference_image()
        {
            var nid = base.navigation.nid,
                tocContainer = $("#" + base.options.tocId),
                tocData = $("#osci_toc_node_" + nid, tocContainer).data(),
                navImageWrapper = $("#osci_navigation_ref_image", tocContainer);
            
            if (tocData.plate_image && tocData.plate_image.full_image_url && tocData.plate_image.thumbnail_165w_url) {
                if (!navImageWrapper.children().length) {
                    navImageWrapper.append($("<a>", {
                        html : $("<img>").bind("osci_nav_ref_image_alter", function(e){
                            var $this = $(this);
                            
                            if (e.osci_nav_hover_image) {
                                $this.attr("src", e.osci_nav_hover_image);
                            } else {
                                $this.attr("src", $this.data("default_src"));
                            }
                        })
                    }));
                }
                
                $("a", navImageWrapper).attr("href", tocData.plate_image.full_image_url);
                $("img", navImageWrapper).attr("src", tocData.plate_image.thumbnail_165w_url).data("default_src", tocData.plate_image.thumbnail_165w_url);
            } else {
                navImageWrapper.empty();
            }
        }
        
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
            if (window.history && window.history.pushState) {
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
                partWidth = Math.round((1 / base.navigation.pageCount)  * 100),
                addPixels = Math.abs(Math.round(100 - (parts * partWidth))),
                navBar, i, classes = "", heightRemain = 0, li, finalWidth,
                addSubPixels = (100 - (parts * partWidth)) > 0 ? 1 : -1;
           
            navBar = $("#osci_navigation_section_list", container);
            if (!navBar.length) {
                navBar = $("<ul>", {
                    id : "osci_navigation_section_list",
                    width : "100%"
                }).appendTo(container);
            }
            navBar.empty();
            
            i = 1;
            while (i <= parts) {
                classes = "";
                if (i === 1) {
                    classes += "first active";
                } 

                if (i === parts) {
                    classes += " last";
                }
                
                if (i > (parts - Math.floor(addPixels / 2)) || i < (1 + Math.ceil(addPixels / 2))) {
                    finalWidth = partWidth + addSubPixels;
                } else {
                    finalWidth = partWidth;
                }
                
                li = $("<li>",{
                    css : { width : finalWidth + "%" },
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
                
                i++;
            }
            
            container.bind("osci_update_navigation_section", function(e, page){
                $("li", this).removeClass("active");
                $("li:eq(" + page + ")", this).addClass("active");
            });
        }
        
        function _create_table_of_contents()
        {
            var container = $("#" + base.options.tocId), i, toc, node, rootNid, tocItem, subMenu;

            toc = $("#osci_navigation_toc", container);
            if (!toc.length) {
                $("<h2>", {
                    text : "Reference Image"
                }).appendTo(container);
                
                $("<div>", {
                    id : "osci_navigation_ref_image"
                }).appendTo(container);
                
                $("<h2>",{
                    text : "Navigation"
                }).appendTo(container);
                
                toc = $("<ul>", {
                    id : "osci_navigation_toc",
                    width : "100%"
                }).appendTo(container);
                
                $(container).bind("osci_nav_toggle", function(e){
                    var $this = $(this);

                    if (($this.hasClass("open") && !e.osci_nav_open) || e.osci_nav_close) {
                        $this.css({
                            "-webkit-transform" : "translate(-" + $this.outerWidth() + "px, 0)",
                            "-moz-transform" : "translate(-" + $this.outerWidth() + "px, 0)",
                            "transform" : "translate(-" + $this.outerWidth() + "px, 0)"
                        });
                        $this.removeClass("open");
                    } else {
                        $this.css({
                            "-webkit-transform" : "translate(0px, 0)",
                            "-moz-transform" : "translate(0px, 0)",
                            "transform" : "translate(0px, 0)"
                        });
                        $this.addClass("open");
                    }
                }).addClass("open");
  
                $(".osci_table_of_contents_handle", container).click(function(e){
                    e.preventDefault();
                    container.trigger({type : "osci_nav_toggle"});
                });
            }
            toc.empty();
            
            for (i in base.navigation.toc) {
                node = base.navigation.toc[i];
                
                if (!node.parent.nid) {
                    rootNid = node.nid;
                    continue;
                }
                
                tocItem = $("<li>", {
                    id : "osci_toc_node_" + node.nid,
                    data : node
                }).append(
                    $("<a>", {
                        text : node.title,
                        href : "#",
                        data : {
                            nid : node.nid
                        },
                        click : function(e) {
                            e.preventDefault();
                            
                            var $this = $(this),
                                expander = $this.next(),
                                parent = $this.parents("ul");

                            if (parent.data("dragging")) {
                                return;
                            }

                            if (!expander.hasClass("expanded")) {
                                expander.click();
                            }
                            
                            base.navigation.nid = $(this).data("nid");
                            _load_section(true);
                        }
                    })
                ).append(
                    $("<a>", {
                       "class" : "osci_toc_arrow",
                       href : "#",
                       text : "+",
                       click : function (e) {
                           e.preventDefault();
                           
                           var checkElement,
                               $this = $(this),
                               parent = $this.parents("ul");
                           
                           if (parent.data("dragging")) {
                               return;
                           }
                           
                           checkElement = $this.siblings("ul");
                           
                           if (checkElement.length) {
                               if (!checkElement.is(":visible")) {
                                   $("ul", toc).slideUp("normal");
                                   $(".expanded", toc).removeClass("expanded");
                                   checkElement.slideDown("normal");
                               } else {
                                   checkElement.slideUp("normal");
                               }
                               $this.toggleClass("expanded");
                           } else {
                               $this.toggleClass("expanded");
                               $this.prev().click();
                           }
                       }
                    })
                ).hover(
                    function(e){
                        var data = $(this).data();
                            
                        if (data.plate_image && data.plate_image.thumbnail_165w_url) {
                            $("#osci_navigation_ref_image img").trigger({
                                type : "osci_nav_ref_image_alter",
                                osci_nav_hover_image : data.plate_image.thumbnail_165w_url
                            });
                        }
                    },
                    function(e){
                        $("#osci_navigation_ref_image img").trigger({
                            type : "osci_nav_ref_image_alter"
                        });
                    }
                );
                
                if (rootNid == node.parent.nid) {
                    toc.append(tocItem);
                } else {
                    subMenu = $("#osci_toc_node_" + node.parent.nid + "_submenu", toc);
                    if (!(subMenu.length)) {
                        subMenu = $("<ul>", {
                            id : "osci_toc_node_" + node.parent.nid + "_submenu"
                        }).appendTo($("#osci_toc_node_" + node.parent.nid)).hide().bind("osci_toc_update_heights", function(){
                            var $this = $(this),
                                container = $("#" + base.options.tocId),
                                toc = $("#osci_navigation_toc", container),
                                maxHeight = $(window).height() - toc.position().top - parseInt(container.css("padding-bottom")) - toc.data("full_height"),
                                fullHeight = $this.data("full_height");

                            if ($this.height() > maxHeight) {
                                $this.height(maxHeight + "px");
                            } else if ($this.height() < maxHeight) {
                                if (fullHeight > maxHeight) {
                                    $this.height(maxHeight + "px");
                                } else {
                                    $this.height(fullHeight + "px");
                                }
                            }
                        });
                    }
                    
                    subMenu.append(tocItem);
                }
            }
            
            container.trigger("osci_nav_toggle");
            
            toc.data("full_height", toc.height());
            
            $("ul", toc).each(function(i, elem){
                var $elem = $(elem);
                $elem.data("full_height", $elem.height());
                $elem.overscroll({showThumbs: false}).trigger("osci_toc_update_heights");
            });
        }

        base.init();
    };

    $.osci.navigation.defaultOptions = {
        readerId : "osci_viewer_wrapper",
        headerId : "osci_header",
        tocId : "osci_table_of_contents_wrapper",
        navId : "osci_navigation_wrapper",
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
