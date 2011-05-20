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
            var toc, operation = "page", value = "first";
            
            //clear the layout cache
            $.osci.storage.clearCache("osci_layout_cache:");
            
            base.options = $.extend({}, $.osci.navigation.defaultOptions, options);

        	// get current url
        	var currentUrl = window.location.href;
        	
        	// determine whether or not this is linking to something
        	if(currentUrl.indexOf('#') >= 0) {
        		value = currentUrl.split("#");
                value = base.options.nid + "#" + value[1];
                operation = "node";
        	}            
            
            //setup the base data
            base.data = {
                nid : base.options.nid,
                mlid : base.options.mlid,
                currentPage : 1,
                pageCount : 0,
                to : {operation : operation, value : value}
            };
            
            $(document).bind({
            	//update the navigation when layout is complete
                osci_layout_complete : function() {

                    _reset_navigation();
                },
                //bind navigation to the document so it can be easily triggered
                osci_navigation : function(e) {
                    base.navigateTo(e.osci_to, e.osci_value);
                }
            });
            
            //bind function for handling html5 history back button
            $(window).bind("popstate",function(e){
                if (e.originalEvent.state !== null && e.originalEvent.state.nid) {
                    if (base.data.nid !== e.originalEvent.state.nid) {
                        base.data.nid = e.originalEvent.state.nid;
                        base.data.to = {operation : "page", value : "first"};
                        base.loadContent();
                    }
                }
            });
            
            // increase content font size
            $("#osci_increase_font").click(function (e) {
            	if($.osci.fontSize) {
            		$.osci.fontSize += 20;
            	} else {
            		$.osci.fontSize = 120;
            	}
            	
            	// reset content
            	_osci_resize()
            });
            
            // decrease content font size
            $("#osci_decrease_font").click(function (e) {
            	if($.osci.fontSize) {
            		// check against minimum font size
            		if(($.osci.fontSize - 20) <= 20) {
            			return;
            		}
            		$.osci.fontSize -= 20;
            	} else {
            		$.osci.fontSize = 60;
            	}
            	// reset content
            	_osci_resize()
            });
            
            //setup the prev button
            $("#" + base.options.prevLinkId).click(function (e){
                e.preventDefault();
                base.navigateTo("prev");
            });
            
            //setup the next button
            $("#" + base.options.nextLinkId).click(function (e){
                e.preventDefault();
                base.navigateTo("next");
            });
            
            //make the arrow keys available to navigation
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
            
            //get the table of contents and load the content of the current section
            $.osci.storage.getUrl({
                url : base.options.apiEndpoint + base.options.nid + "/book.json",
                key : "bid_" + base.options.bid,
                type : "json",
                expire : base.options.cacheTime,
                callback : function(data) {
                	base.data.toc = data.data;
                	_create_table_of_contents();
                	base.loadContent(true);
                }
            });
        };   
        
        //wrapper for the content loading function
        base.loadContent = function(updateHistory, navAfterLoadTo, navAfterLoadValue)
        {
        	//check if user defined load function is a function and call it
            if ($.isFunction($.osci.navigation.options.loadFunction)) {
                $.osci.navigation.options.loadFunction($.osci.navigation.data);
            }

            //update the browser history
            if (updateHistory) {
                $.osci.navigation.updateHistory($.osci.navigation.data.nid);
            }
            
            if (!(navAfterLoadTo === undefined) && !(navAfterLoadValue === undefined)) {
                base.navigateTo(navAfterLoadTo, navAfterLoadValue);
            }
        };
        
        //function to call when the browser is resized
        function _osci_resize()
        {
        	//get the first paragraph currently displayed so we can try to stay on the same page after the resize
            var firstParagraph = $("div.osci_page_" + (base.data.currentPage + 1)).find("p.osci_paragraph:first");
            base.data.to = { operation : "paragraph", value : firstParagraph.data("paragraph_id")};
            
            //$("ul", "#" + base.options.tocId).trigger("osci_toc_update_heights");
            
            //clear the layout cache and reload the content
            $.osci.storage.clearCache("osci_layout_cache:");
            base.loadContent();
        }
        
        //reset the navigation
        function _reset_navigation()
        {
            var paragraphData, page

            base.data.currentPage = 1;
            base.data.pageCount = $.osci.layout.options.pageCount;
            base.data.layoutData = $.osci.layout.options;
            base.data.length = parseInt(base.data.toc["nid_" + base.data.nid].length, 10);

            _update_title();
            _update_reference_image();
            _create_section_navigation_bar();
            $("#" + base.options.tocId).trigger({type:"osci_toc_update"});
            base.navigateTo(base.data.to.operation, base.data.to.value);
        }
        
        //update the reference images to the current section
        function _update_reference_image()
        {
            var nid = base.data.nid,
                tocData = $("#osci_toc_node_" + nid).data(),
                navImageWrapper = $(".osci_reference_image"),
                largeUrl = "#", thumbUrl = "";
            
            //make sure we have a place for the image
            if (navImageWrapper.length) {
            	//loop over each image placeholder
                navImageWrapper.each(function(i, elem) {
                    var $elem = $(elem),
                        imagePreset = $elem.data("image_preset");
                    
                    //update the link and image with the current section plate image data
                    if (tocData.plate_image && tocData.plate_image.full_image_url && tocData.plate_image[imagePreset]) {
                        largeUrl = tocData.plate_image.full_image_url;
                        thumbUrl = tocData.plate_image[imagePreset];
                    }
                    
                    $elem.empty().append($("<a>", {
                        "class" : "osci_reference_image_link",
                        href : largeUrl,
                        html : $("<img>",{ src : thumbUrl }).bind("osci_reference_image_alter", function(e){
                            var $this = $(this);
                            
                            if (e.osci_nav_hover_image) {
                                $this.attr("src", e.osci_nav_hover_image);
                            } else {
                                $this.attr("src", $this.data("default_src"));
                            }
                        })
                    }));
                });
            }
        }
        
        //update the page title to the current section
        function _update_title()
        {
            var hasParent = true,
                header = $("#" + base.options.headerId),
                titleParts = [],
                nid = base.data.nid,
                titleLength = 0,
                bookTitle = "",
                subTitle = "";
            
            //work our way up the table of contents heirarchy to get the title parts
            while (hasParent) {
                titleParts.push(base.data.toc["nid_" + nid].title);
                
                if (base.data.toc["nid_" + nid].parent.nid) {
                    nid = base.data.toc["nid_" + nid].parent.nid;
                } else {
                    hasParent = false;
                }
            }
            
            //build the title string
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

            //put the title parts into the page
            $("h1.osci_book_title").html(bookTitle);
            $("h2.osci_book_section_title").html(subTitle);
        }
        
        //update the HTML5 url history
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
        
        //handle reader navigation
        base.navigateTo = function(to, value)
        {
            var totalColumns, newPage, tocData, newOffset, identifier, tocContainer;

            switch(to) {
            	//go to the next page
                case "next":
                    base.data.currentPage++;
                    if (base.data.currentPage > base.data.pageCount) {
                        tocData = base.data.toc["nid_" + base.data.nid].next;
                        if (tocData.nid) {
                            base.data.nid = tocData.nid;
                            base.data.to = {operation : "page", value : "first"};
                        }

                        base.loadContent(true);
                        return;
                    }
                    break;
                //go to the previous page
                case "prev":
                    base.data.currentPage--;
                    if (base.data.currentPage < 1) {
                        tocData = base.data.toc["nid_" + base.data.nid].prev;
                        if (tocData.nid) {
                            base.data.nid = tocData.nid;
                            base.data.to = {operation : "page", value : "last"};
                        }

                        base.loadContent(true);
                        return;
                    }
                    break;
                //go to a specific page
                case "page":
                    if (value === "first") {
                        base.data.currentPage = 1;
                    } else if (value === "last") {
                        base.data.currentPage = base.data.pageCount;
                    } else if (value > base.data.pageCount || value < 1) {
                        return;
                    } else {
                        base.data.currentPage = value;
                    }
                    break;
                //go to a specfic column
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
                //go to a specific paragraph 
                case "paragraph":
                    newPage = $("#" + base.data.layoutData.viewerId).find("p.osci_paragraph_" + value + ":first").parents(".osci_page").data("page");
                    if (newPage !== undefined) {
                        base.navigateTo("page", newPage);
                    }
                    return;
                    break;
                //go to a jquery selector result
                case "selector":
                    newPage = $("#" + base.data.layoutData.viewerId).find(value + ":first").parents(".osci_page").data("page");
                    if (newPage !== undefined) {
                        base.navigateTo("page", newPage);
                    }
                    return;
                    break;
                //go to a specific node
                case "node":
                    if (!(!isNaN(parseFloat(value)) && isFinite(value)) && value.indexOf("#")) {
                        value = value.split("#");
                        identifier = "#" + value[1];
                        value = parseInt(value[0], 10);
                        
                        //handle special paragraph selector
                        if (identifier.indexOf("#para-") >= 0) {
                            identifier = "p.osci_paragraph_" + identifier.split("-")[1] + ":first";
                        }
                    }
                    
                    if (base.data.nid !== value) {
                        
                        base.data.nid = value;
                        base.data.to = {operation : "selector", value : identifier};
                        base.loadContent(true);
                    } else {
                        if (identifier !== undefined) {
                            base.navigateTo("selector", identifier);
                        }
                    }

                    return;
                    break;
            }

            newOffset = 0;
            //Calculate the new page container offset
            if (base.data.currentPage > 0) {
                newOffset = -1 * (((base.data.currentPage - 1) * base.data.layoutData.pageWidth) + 
                    ((base.data.layoutData.outerPageGutter[1] + base.data.layoutData.outerPageGutter[3]) * ((base.data.currentPage - 1))));
            }

            //if the table of contents is not overlaying the content shift the content to not be under the toc
            if (!base.options.tocOverlay) {
                tocContainer = $("#" + base.options.tocId);
                if (tocContainer.hasClass("open") && tocContainer.outerWidth() > base.data.layoutData.outerPageGutter[3]) {
                    newOffset += tocContainer.outerWidth() - base.data.layoutData.outerPageGutter[3] + base.data.layoutData.innerPageGutter[3];
                }
            }

            //update the paging navigation
            //$("#" + base.options.sectionNavId).trigger("osci_update_navigation_section", base.data.currentPage);

            //shift the page using css3
            $("#osci_pages", "#osci_viewer").css({
                "-webkit-transform" : "translate(" + newOffset + "px, 0)",
                "-moz-transform" : "translate(" + newOffset + "px, 0)",
                "transform" : "translate(" + newOffset + "px, 0)"
            });
            
            $(document).trigger("osci_navigation_complete", base.data.currentPage);
        };
        
        //create the paging navigation bar
        function _create_section_navigation_bar()
        {
            var container = $("#" + base.options.sectionNavId),
            	//how many pages are there
                parts = base.data.pageCount,
                //determine the width of each part to fill the container
                partWidth = Math.floor(container.width() / parts),
                //determine if we have pixels left over
                addPixels = Math.abs(Math.round(container.width() - (parts * partWidth))),
                navBar, i, classes = "", heightRemain = 0, li, finalWidth,
                //add or subtract pixels
                addSubPixels = (container.width() - (parts * partWidth)) > 0 ? 1 : -1;
           
            //get the navbar
            navBar = container.find("#osci_navigation_section_list");
            
            //if the navbar has not been created, create it
            if (!navBar.length) {
                navBar = $("<ul>", {
                    id : "osci_navigation_section_list",
                    width : "100%"
                }).hide().appendTo(container);
                
                //bind an event to update the navigation
                $(document).bind("osci_navigation_complete", function(e, page){
                    var secNav = $("#osci_navigation_section_list");
                    secNav.find("li").removeClass("active");
                    secNav.find("li:eq(" + (page - 1) + ")").addClass("active");
                });
                
                navBar.delegate("li", "click", function(e){
                    e.preventDefault();
                    
                    var page, $this;
                    
                    $this = $(this);
                    page = $this.data("navigateTo");
                    
                    $this.siblings().removeClass("active");
                    $this.addClass("active");
                    base.navigateTo("page", page);
                });
            }
            navBar.hide().empty();
            
            //create each navbar part
            i = 1;
            while (i <= parts) {
                classes = "";
                //first part add classes
                if (i === 1) {
                    classes += "first active";
                } 

                //add the last class to the last part
                if (i === parts) {
                    classes += " last";
                }
                
                //update the width of the part if there were leftover pixels
                if (i > (parts - Math.floor(addPixels / 2)) || i < (1 + Math.ceil(addPixels / 2))) {
                    finalWidth = partWidth + addSubPixels;
                } else {
                    finalWidth = partWidth;
                }
                
                //create the li
                li = $("<li>",{
                    css : { width : finalWidth + "px" },
                    data : { navigateTo : i },
                    "class" : classes
                }).appendTo(navBar);
                
                i++;
            }
            
            navBar.show();
        }
        
        function _create_table_of_contents()
        {
            var container = $("#" + base.options.tocId), i, toc, node, rootNid, tocItem, subMenu, 
                j, subItem, subItemCount, tocWrapper;

            toc = container.find("#osci_navigation_toc");
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
                
                tocWrapper = $("<div>",{id : "osci_navigation_toc_wrapper"}).appendTo(container);
                
                toc = $("<ul>", {
                    id : "osci_navigation_toc",
                    width : "100%"
                }).appendTo(tocWrapper);
                
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
                        var $this = $(this),
                            toc = $this.find("#osci_navigation_toc"),
                            activeLi = toc.find("#osci_toc_node_" + base.data.nid);
                        
                        toc.find("li, a").removeClass("active");
                        
                        activeLi.addClass("active");
                        activeLi.parents("li").addClass("active");
                        
                        toc.find("li.active").children("a").addClass("active");
                    }
                }).addClass("open");
  
                container.find(".osci_table_of_contents_handle").click(function(e){
                    e.preventDefault();
                    container.trigger({type : "osci_nav_toggle"});
                });
                
                toc.delegate("a", "click", function(e){
                    e.preventDefault();
                    
                    var checkElement,
                        $this = $(this),
                        parent = $this.parents("ul:first"),
                        container = $this.parents("#osci_navigation_toc_wrapper"),
                        isExpander = $this.hasClass("osci_toc_arrow"),
                        expander = isExpander ? $this : $this.next();
                    
                    if (container.data("dragging")) {
                        return;
                    }

                    if (expander.length && (isExpander || !expander.hasClass("expanded"))) {
                        checkElement = expander.siblings("ul");
    
                        parent.find("ul").slideUp("normal");
                        parent.find(".expanded").removeClass("expanded").text("+");
                        
                        if (checkElement.length) {
                            if (!checkElement.is(":visible")) {
                                checkElement.slideDown("normal");
                                expander.text("-").addClass("expanded");
                            } else {
                                checkElement.slideUp("normal");
                                expander.text("+");
                            }
                        }
                    }
                    
                    if (!isExpander) {
                        base.navigateTo("node", $(this).data("nid") + "#osci_plate_fig");
                    }
                });
                
                toc.delegate("a", "hover", function(e){
                    var $this, data, parents,
                        plateContainer = $("#" + base.options.tocId).find(".osci_reference_image img");
                    
                    switch (e.type) {
                        case "mouseenter":
                            $this = $(this);
                            data = $this.parent("li").data();
                                
                            if (data.plate_image && data.plate_image.thumbnail_165w_url) {
                                plateContainer.trigger({
                                    type : "osci_reference_image_alter",
                                    osci_nav_hover_image : data.plate_image.thumbnail_165w_url
                                });
                            } else {
                                parents = $this.parents("li");
    
                                if (parents && parents.length) {
                                    parents.each(function(i, elem){
                                        data = $(elem).data();
    
                                        if (data.plate_image && data.plate_image.thumbnail_165w_url) {
                                            plateContainer.trigger({
                                                type : "osci_reference_image_alter",
                                                osci_nav_hover_image : data.plate_image.thumbnail_165w_url
                                            });
                                            return false;
                                        }
                                    });
                                }
                            }
                            break;
                        case "mouseleave":
                            plateContainer.trigger({
                                type : "osci_reference_image_alter"
                            });
                            break;
                    }
                });
            }
            toc.empty();

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
                    subMenu = toc.find("#osci_toc_node_" + node.parent.nid + "_submenu");
                    if (!(subMenu.length)) {
                        subMenu = _create_sub_menu(node.parent.nid);
                    }
                    
                    subMenu.append(tocItem);
                }
                
                if (node.sub_sections && node.sub_sections.length) {
                    subMenu = toc.find("#osci_toc_node_" + node.nid + "_submenu");
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
         
            tocWrapper.height(($(window).height() - tocWrapper.position().top - 40) + "px").overscroll({direction : "vertical", showThumbs : true});
            toc.find("ul").hide();
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
                "class" : node.field,
                data : node
            }).append(
                $("<a>", {
                    html : node.title,
                    href : "#",
                    data : {
                        nid : link
                    }
                })
            ).append(
                $("<a>", {
                   "class" : "osci_toc_arrow",
                   href : "#",
                   text : "+"
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
            }).hide().appendTo($("#osci_toc_node_" + nid));
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
