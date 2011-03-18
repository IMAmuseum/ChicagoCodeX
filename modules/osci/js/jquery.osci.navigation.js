(function($)
{
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.navigation = function(options)
    {
        var base = this.navigation;
 
        base.init = function()
        {
            var toc;
            
            $.osci.storage.clearCache("osci_layout_cache:");
            
            base.options = $.extend({}, $.osci.navigation.defaultOptions, options);
            
            base.data = {
                nid : base.options.nid,
                mlid : base.options.mlid,
                currentPage : 0,
                pageCount : 0,
                to : {operation : "page", value : "first"}
            };
            
            toc = _get_table_of_contents(base.options.nid, base.options.bid);
            base.data.toc = toc.data;
            
            $(document).bind({
                osci_layout_complete : function() {
                    _reset_navigation();
                },
                osci_navigation : function(e) {
                    base.navigateTo(e.osci_to, e.osci_value);
                }
            });
            
            $(window).bind("popstate",function(e){
                if (e.originalEvent.state !== null && e.originalEvent.state.nid) {
                    if (base.data.nid !== e.originalEvent.state.nid) {
                        base.data.nid = e.originalEvent.state.nid;
                        base.data.to = {operation : "page", value : "first"};
                        base.loadContent();
                    }
                }
            });
            
            $("#" + base.options.prevLinkId).click(function (e){
                e.preventDefault();
                base.navigateTo("prev");
            });
            
            $("#" + base.options.nextLinkId).click(function (e){
                e.preventDefault();
                base.navigateTo("next");
            });
            
            $(window).keydown(function(e){
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
                    if (window.resizeTimer) {
                        clearTimeout(window.resizeTimer);
                    }
                    window.resizeTimer = setTimeout(_osci_resize, 100);
                });
            }
            
            _create_table_of_contents();
            base.loadContent(true);
        };   
        
        base.loadContent = function(updateHistory)
        {
            if ($.isFunction($.osci.navigation.options.loadFunction)) {
                $.osci.navigation.options.loadFunction($.osci.navigation.data);
            }
            
            if (updateHistory) {
                $.osci.navigation.updateHistory($.osci.navigation.data.nid);
            }
        };
        
        function _get_table_of_contents(nid, bid)
        {
            return $.osci.storage.getUrl({
                url : base.options.apiEndpoint + nid + "/book.json",
                key : "bid_" + bid,
                type : "json",
                expire : base.options.cacheTime
            });
        }
        
        function _osci_resize()
        {
            var firstParagraph = $("p.osci_paragraph:first", "div.osci_page_" + (base.data.currentPage + 1));
            base.data.to = { operation : "paragraph", value : firstParagraph.data("paragraph_id")};
            
            //$("ul", "#" + base.options.tocId).trigger("osci_toc_update_heights");
            
            $.osci.storage.clearCache("osci_layout_cache:");
            base.loadContent();
        }
        
        function _reset_navigation()
        {
            var paragraphData, page,
                layoutData = $("#" + base.options.readerId).data("osci.layout");

            base.data.currentPage = 0;
            base.data.pageCount = layoutData.options.pageCount;
            base.data.layoutData = layoutData.options;
            base.data.length = parseInt(base.data.toc["nid_" + base.data.nid].length, 10);

            _update_title();
            _update_reference_image();
            _create_section_navigation_bar();
            $("#" + base.options.tocId).trigger({type:"osci_toc_update"});
            base.navigateTo(base.data.to.operation, base.data.to.value);
        }
        
        function _update_reference_image()
        {
            var nid = base.data.nid,
                tocData = $("#osci_toc_node_" + nid).data(),
                navImageWrapper = $(".osci_reference_image"),
                largeUrl = "#", thumbUrl = "";
            
            
            if (navImageWrapper.length) {
                navImageWrapper.each(function(i, elem) {
                    var $elem = $(elem),
                        imagePreset = $elem.data("image_preset");
                    
                    if (!$elem.children().length) {
                        $elem.append($("<a>", {
                            html : $("<img>").bind("osci_reference_image_alter", function(e){
                                var $this = $(this);
                                
                                if (e.osci_nav_hover_image) {
                                    $this.attr("src", e.osci_nav_hover_image);
                                } else {
                                    $this.attr("src", $this.data("default_src"));
                                }
                            })
                        }));
                    }
                    
                    if (tocData.plate_image && tocData.plate_image.full_image_url && tocData.plate_image[imagePreset]) {
                        largeUrl = tocData.plate_image.full_image_url;
                        thumbUrl = tocData.plate_image[imagePreset];
                        
                        $("a", $elem).attr("href", largeUrl);
                        $("img", $elem).attr("src", thumbUrl).data("default_src", thumbUrl);
                    }
                });
            }
        }
        
        function _update_title()
        {
            var hasParent = true,
                header = $("#" + base.options.headerId),
                titleParts = [],
                nid = base.data.nid,
                titleLength = 0,
                bookTitle = "",
                subTitle = "";
            
            while (hasParent) {
                titleParts.push(base.data.toc["nid_" + nid].title);
                
                if (base.data.toc["nid_" + nid].parent.nid) {
                    nid = base.data.toc["nid_" + nid].parent.nid;
                } else {
                    hasParent = false;
                }
            }
            
            titleLength = titleParts.length;
            for (var i = 0; i < titleLength; i++) {
                if (i === titleLength - 1) {
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
        
        base.updateHistory = function (nid, replace)
        {
            var tocData;
            
            if (window.history && window.history.pushState) {
                if (replace) {
                    window.history.replaceState({"nid":nid}, document.title);
                } else {
                    tocData = base.data.toc["nid_" + nid]
                    
                    window.history.pushState(
                        {"nid" : nid},
                        document.title, 
                        tocData.href
                    );
                }
            }
        };
        
        base.navigateTo = function(to, value)
        {
            var totalColumns, newPage, tocData, newOffset, identifier, tocContainer;

            switch(to) {
                case "next":
                    base.data.currentPage++;
                    if (base.data.currentPage >= base.data.pageCount) {
                        tocData = base.data.toc["nid_" + base.data.nid].next;
                        if (tocData.nid) {
                            base.data.nid = tocData.nid;
                            base.data.to = {operation : "page", value : "first"};
                        }

                        base.loadContent(true);
                        return;
                    }
                    break;

                case "prev":
                    base.data.currentPage--;
                    if (base.data.currentPage < 0) {
                        tocData = base.data.toc["nid_" + base.data.nid].prev;
                        if (tocData.nid) {
                            base.data.nid = tocData.nid;
                            base.data.to = {operation : "page", value : "last"};
                        }

                        base.loadContent(true);
                        return;
                    }
                    break;

                case "page":
                    if (value === "first") {
                        base.data.currentPage = 0;
                    } else if (value === "last") {
                        base.data.currentPage = base.data.pageCount - 1;
                    } else if (value > base.data.pageCount || value < 1) {
                        return;
                    } else {
                        base.data.currentPage = value - 1;
                    }
                    break;

                case "column":
                    totalColumns = base.data.layoutData.columnsPerPage * base.data.pageCount;
                    if (value > totalColumns || value < 1) {
                        return;
                    }

                    newPage = Math.ceil(value / base.data.layoutData.columnsPerPage);
                    if (newPage !== undefined) {
                        base.navigateTo("page", newPage);
                    }
                    return;
                    break;
                    
                case "paragraph":
                    newPage = $("p.osci_paragraph_" + value + ":first","#" + base.data.layoutData.viewerId).parents(".osci_page").data("page");
                    if (newPage !== undefined) {
                        base.navigateTo("page", newPage);
                    }
                    return;
                    break;
                    
                case "selector":
                    newPage = $(value + ":first","#" + base.data.layoutData.viewerId).parents(".osci_page").data("page");
                    if (newPage !== undefined) {
                        base.navigateTo("page", newPage);
                    }
                    return;
                    break;
                    
                case "node":
                    if (value.indexOf("#")) {
                        value = value.split("#");
                        identifier = "#" + value[1];
                        value = parseInt(value[0], 10);
                    }
                    
                    if (base.data.nid !== value) {
                        base.data.nid = value;
                        base.loadContent(true);
                    }

                    if (identifier !== undefined) {
                        base.navigateTo("selector", identifier);
                    }
                    return;
                    break;
            }

            newOffset = 0;
            
            if (base.data.currentPage > 0) {
                newOffset = -1 * ((base.data.currentPage * base.data.layoutData.pageWidth) + 
                    ((base.data.layoutData.outerPageGutter[1] + base.data.layoutData.outerPageGutter[3]) * (base.data.currentPage)));
            }

            if (!base.options.tocOverlay) {
                tocContainer = $("#" + base.options.tocId);
                if (tocContainer.hasClass("open") && tocContainer.outerWidth() > base.data.layoutData.outerPageGutter[3]) {
                    newOffset += tocContainer.outerWidth() - base.data.layoutData.outerPageGutter[3] + base.data.layoutData.innerPageGutter[3];
                }
            }

            $("#" + base.options.sectionNavId).trigger("osci_update_navigation_section", base.data.currentPage);

            $("#osci_pages", "#osci_viewer").css({
                "-webkit-transform" : "translate(" + newOffset + "px, 0)",
                "-moz-transform" : "translate(" + newOffset + "px, 0)",
                "transform" : "translate(" + newOffset + "px, 0)"
            });
        };
        
        function _create_section_navigation_bar()
        {
            var container = $("#" + base.options.sectionNavId),
                parts = base.data.pageCount,
                partWidth = Math.floor(container.width() / parts),
                addPixels = Math.abs(Math.round(container.width() - (parts * partWidth))),
                navBar, i, classes = "", heightRemain = 0, li, finalWidth,
                addSubPixels = (container.width() - (parts * partWidth)) > 0 ? 1 : -1;
           
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
                    css : { width : finalWidth + "px" },
                    data : { navigateTo : i },
                    "class" : classes,
                    click : function (e) {
                        e.preventDefault();
                        
                        var page, $this;
                        
                        $this = $(this);
                        page = $this.data("navigateTo");
                        
                        $this.siblings().removeClass("active");
                        $this.addClass("active");
                        base.navigateTo("page", page);
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
            var container = $("#" + base.options.tocId), i, toc, node, rootNid, tocItem, subMenu, j, subItem, subItemCount, wrap;

            toc = $("#osci_navigation_toc", container);
            if (!toc.length) {
                $("<h2>", {
                    text : "Reference Image"
                }).appendTo(container);
                
                $("<div>", {
                    "class" : "osci_reference_image",
                    data : {
                        image_preset : base.options.referenceImagePreset
                    }
                }).appendTo(container);
                
                $("<h2>",{
                    text : "Navigation"
                }).appendTo(container);
                
                toc = $("<ul>", {
                    id : "osci_navigation_toc",
                    width : "100%"
                }).appendTo(container).wrap($("<div>",{id : "osci_navigation_toc_wrapper"}));
                
                container.bind({
                    "osci_nav_toggle" : function(e){
                        var $this = $(this), i, eventLen;

                        if (($this.hasClass("open") && !e.osci_nav_open) || e.osci_nav_close) {
                            if (base.options.tocToggleCallback !== undefined) {
                                base.options.tocToggleCallback($this, "close");
                            }
                            $this.removeClass("open");
                        } else {
                            if (base.options.tocToggleCallback !== undefined) {
                                base.options.tocToggleCallback($this, "open");
                            }
                            $this.addClass("open");
                        }
                        
                        if (!base.options.tocOverlay) {
                            base.navigateTo("page", base.data.currentPage + 1);
                        }
                    }, 
                    "osci_toc_update" : function(e){
                        var toc = $("#osci_navigation_toc", this),
                            activeLi = $("#osci_toc_node_" + base.data.nid, toc);
                        
                        $("li, a", toc).removeClass("active");
                        
                        activeLi.addClass("active");
                        activeLi.parents("li").addClass("active");
                        
                        $("li.active", toc).children("a").addClass("active");
                    }
                }).addClass("open");
  
                $(".osci_table_of_contents_handle", container).click(function(e){
                    e.preventDefault();
                    container.trigger({type : "osci_nav_toggle"});
                });
            }
            toc.empty();
            wrap = toc.parent();

            for (i in base.data.toc) {
                node = base.data.toc[i];
                
                if (!node.parent.nid) {
                    rootNid = node.nid;
                    continue;
                }
                
                tocItem = _create_menu_item(node);
                                
                if (rootNid === node.parent.nid) {
                    toc.append(tocItem);
                } else {
                    subMenu = $("#osci_toc_node_" + node.parent.nid + "_submenu", toc);
                    if (!(subMenu.length)) {
                        subMenu = _create_sub_menu(node.parent.nid);
                    }
                    
                    subMenu.append(tocItem);
                }
                
                if (node.sub_sections && node.sub_sections.length) {
                    subMenu = $("#osci_toc_node_" + node.nid + "_submenu", toc);
                    if (!(subMenu.length)) {
                        subMenu = _create_sub_menu(node.nid);
                    }
                    
                    subItemCount = node.sub_sections.length;
                    for (j = 0; j < subItemCount; j++) {
                        subMenu.append(_create_menu_item(node.sub_sections[j]));
                    }
                }
            }
            
            $("a.osci_toc_arrow", toc).each(function(i, elem){
                var $this = $(elem);
                if (!$this.siblings("ul").length) {
                    $this.remove();
                }
            });
            
            container.trigger("osci_nav_toggle");
            
//            toc.data("full_height", toc.height());
            
//            $("ul", toc).each(function(i, elem){
//                var $elem = $(elem);
//                $elem.data("full_height", $elem.height());
//                //$elem.overscroll({showThumbs: false}).trigger("osci_toc_update_heights");
//            });
         
              wrap.height(($(window).height() - wrap.position().top - 40) + "px").overscroll({direction : "vertical", showThumbs : true});
              $("ul", toc).hide();
        }
        
        function _create_menu_item(node)
        {
            var tocItem, id = node.nid, link = node.nid;
            
            if (node.field) {
                id = node.nid + "_" + node.field;
                link = node.nid + "#" + node.field + "_anchor";
            }

            tocItem = $("<li>", {
                id : "osci_toc_node_" + id,
                data : node
            }).append(
                $("<a>", {
                    text : node.title,
                    href : "#",
                    data : {
                        nid : link
                    },
                    click : function(e) {
                        e.preventDefault();
                        
                        var $this = $(this),
                            expander = $this.next(),
                            container = $this.parents("#osci_navigation_toc_wrapper");

                        if (container.data("dragging")) {
                            return;
                        }

                        if (!expander.hasClass("expanded")) {
                            expander.click();
                        }

                        base.navigateTo("node", $(this).data("nid"));
                    }
                }).hover(
                    function(e){
                        var $this = $(this),
                            data = $this.parent("li").data(),
                            parents;
                            
                        if (data.plate_image && data.plate_image.thumbnail_165w_url) {
                            $(".osci_reference_image img", "#" + base.options.tocId).trigger({
                                type : "osci_reference_image_alter",
                                osci_nav_hover_image : data.plate_image.thumbnail_165w_url
                            });
                        } else {
                            parents = $this.parents("li");

                            if (parents && parents.length) {
                                parents.each(function(i, elem){
                                    data = $(elem).data();

                                    if (data.plate_image && data.plate_image.thumbnail_165w_url) {
                                        $(".osci_reference_image img", "#" + base.options.tocId).trigger({
                                            type : "osci_reference_image_alter",
                                            osci_nav_hover_image : data.plate_image.thumbnail_165w_url
                                        });
                                        return false;
                                    }
                                });
                            }
                        }
                    },
                    function(e){
                        $(".osci_reference_image img", "#" + base.options.tocId).trigger({
                            type : "osci_reference_image_alter"
                        });
                    }
                )
            ).append(
                $("<a>", {
                   "class" : "osci_toc_arrow",
                   href : "#",
                   text : "+",
                   click : function (e) {
                       e.preventDefault();
                       
                       var checkElement,
                           $this = $(this),
                           parent = $this.parents("ul:first"),
                           container = $this.parents("#osci_navigation_toc_wrapper"),
                           toc = $("#" + base.options.tocId + " > ul");
                       
                       if (container.data("dragging")) {
                           return;
                       }

                       checkElement = $this.siblings("ul");

                       $("ul", parent).slideUp("normal");
                       $(".expanded", parent).removeClass("expanded").text("+");
                       
                       if (checkElement.length) {
                           if (!checkElement.is(":visible")) {
                               checkElement.slideDown("normal");
                               $this.text("-").addClass("expanded");
                           } else {
                               checkElement.slideUp("normal");
                               $this.text("+");
                           }
                       }
                   }
                })
            );
            
            return tocItem;
        }
        
        function _create_sub_menu(nid)
        {
            var subMenu = $("<ul>", {
                id : "osci_toc_node_" + nid + "_submenu"
//            }).appendTo($("#osci_toc_node_" + nid)).hide().bind("osci_toc_update_heights", function(){
//                var $this = $(this),
//                    container = $("#" + base.options.tocId),
//                    toc = $("#osci_navigation_toc", container),
//                    maxHeight = $(window).height() - toc.position().top - parseInt(container.css("padding-bottom"), 10) - toc.data("full_height"),
//                    fullHeight = $this.data("full_height");
//
//                if ($this.height() > maxHeight) {
//                    $this.height(maxHeight + "px");
//                } else if ($this.height() < maxHeight) {
//                    if (fullHeight > maxHeight) {
//                        $this.height(maxHeight + "px");
//                    } else {
//                        $this.height(fullHeight + "px");
//                    }
//                }
//            });
            }).appendTo($("#osci_toc_node_" + nid)).hide();
//            }).appendTo($("#osci_toc_node_" + nid));
            
            return subMenu;
        }

        base.init();
    };

    $.osci.navigation.defaultOptions = {
        readerId : "osci_viewer_wrapper",
        headerId : "osci_header",
        tocId : "osci_table_of_contents_wrapper",
        tocOverlay : false,
        referenceImagePreset : "thumbnail_165w_url",
        navId : "osci_navigation_wrapper",
        apiEndpoint : "http://osci.localhost/api/navigation/",
        sectionNavId : "osci_navigation_section",
        bid : 0,
        nid : 0,
        mlid : 0,
        prevLinkId : "osci_nav_prev",
        nextLinkId : "osci_nav_next",
        cacheTime : 86400,
        tocToggleCallback : undefined,
        loadFunction : undefined
    };

})(jQuery);

/*
var currentPage = 0;

jQuery(document).ready(function() {

    jQuery("#osci_viewer_wrapper").swipe({
        swipeLeft : function () { $("a.next","#osci_navigation").click(); },
        swipeRight : function () { $("a.prev","#osci_navigation").click(); }
    });

});
*/
