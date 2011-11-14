(function($) {
    
    function pulsateText(element)
    {
        var offset = element.offset(),
            width = element.width(),
            temp = $("<div>", {
                css : {
                    position : "absolute",
                    top : (offset.top - 62) + "px",
                    left : offset.left - 40 + (width / 2) + "px",
                    margin : 0,
                    width : "80px",
                    height : "80px",
                    border : "6px solid #F00",
                    "border-radius" : "46px",
                    "-webkit-animation-duration" : "400ms", 
                    "-webkit-animation-iteration-count" : "3",
                    "-webkit-animation-name" : "pulse",
                    "-webkit-animation-direction" : "normal",
                    "-webkit-box-shadow": "0px 0px 10px #888"
                }
            }).appendTo("#osci_viewer");
        
        setTimeout(function(){temp.remove();}, 1100);
    };
    
    function findAndGotoElement(selector, occurence) {
        var elem = $(selector);
            isFigLink = $(elem[0]).hasClass("figure-link"),
            validItem = undefined;
        
        if (occurence === undefined || occurence < 1) {
            occurence = 1;
        }
            
        elem.each(function(i){
            var $this = $(this),
                thisOccur = $this.data("occurence"),
                column = $this.parents(".column"),
                offset = $this.offset(),
                columnOffset = column.offset(),
                columnBottom = columnOffset.top + column.height(),
                page = 0;
            
            if (thisOccur === undefined || thisOccur < 1) {
                thisOccur = 1;
            }
            
            if (thisOccur === occurence && offset.top <= columnBottom && offset.top >= columnOffset.top) {
                page = $this.parents('.osci_page').data('page');
                amplify.publish("osci_navigation", {osci_to : "page", osci_value : page});

                pulsateText($this);
                validItem = $this;
                return false;
            }
        });
        
        if (isFigLink && validItem) {
            var figure = $(validItem.attr("href")),
                occurences = figure.data("occurences"),
                pos, linker, validItemOccur = validItem.data("occurence"),
                nextLink, prevLink;
            
            if (occurences > 1) {
                pos = validItem.offset();
                linker = $("#osci_figure_linker");
                
                if (linker.length === 0) {
                    linker = $("<div>", {
                        id : "osci_figure_linker",
                        html : "<a href=\"#\" class=\"prev\" title=\"Previous Reference\">&lt;</a><a href=\"#\" class=\"next\" title=\"Next Reference\">&gt;</a><a href=\"#\" class=\"close\" title=\"Close Reference Navigator\">x</a>"
                    }).delegate("a", "click", function(e) {
                        e.preventDefault();
                        var $this = $(this),
                            linkToOccur = 1,
                            container = $this.parent(),
                            occurences = parseInt(container.data("occurences"), 10),
                            currentOccur = parseInt(container.data("occurence"), 10),
                            selector = $this.attr("href");
                        
                        if ($this.hasClass("close")) {
                            container.remove();
                            return;
                        }
                        
                        if ($this.hasClass("next")) {
                            if (currentOccur != occurences) {
                                linkToOccur = ++currentOccur;
                            }
                        } else {
                            if (currentOccur == 1) {
                                linkToOccur = occurences;
                            } else {
                                linkToOccur = --currentOccur;
                            }
                        }
                        
                        container.data("occurence", linkToOccur);
                        findAndGotoElement(selector, linkToOccur)
                    }).appendTo("#osci_viewer");
                }
                
                nextLink = linker.find("a.next").show().attr("href", selector);
                prevLink = linker.find("a.prev").show().attr("href", selector);
                
                if (validItemOccur === occurences) {
                    nextLink.hide();
                }
                
                if (validItemOccur === 1) {
                    prevLink.hide();
                }

                linker.css({
                    position : "absolute",
                    top : pos.top + "px",
                    left : pos.left + "px"
                }).data({occurence : validItemOccur, occurences : occurences});
            }
        }
    };
    
    $(document).ready(function() {
        var $doc = $(this),
            reader = $("#" + Drupal.settings.osci_navigation.reader_id);
        
        amplify.subscribe("osci_loading_content", function(data) {
            $("span.loading").css({display:"inline-block"});
        },1);
        
        amplify.subscribe("osci_layout_complete", function(data) {
            $("span.loading").hide();
        });
        
    	$doc.bind({
        	"touchmove" : function(e) {
        	    e.preventDefault();
        	}
    	});    	
        
        $.osci.more({
            moreToggleCallback : function(more, state)
            {
                switch (state) {
                    case "open":
                        // Ensure the toc tab is closed
                        amplify.publish("osci_nav_toggle", {osci_nav_close : true});
                        
                        if ($.browser.msie) {
                            more.attr("style", "-ms-transform:translate(0, 0);");
                        } else {
                            more.css({
                                "-webkit-transform" : "translate(0, 0)",
                                "-moz-transform" : "translate(0, 0)",
                                //"-ms-transform" : "translate(0, 0)",
                                "transform" : "translate(0, 0)"
                            });
                        }
                        break;
                    case "close":
                        var moreHeight = more.outerHeight();
  
                        if ($.browser.msie) {
                            more.attr("style", "-ms-transform:translate(0, " + moreHeight + "px);");
                        } else {
                            more.css({
                                "-webkit-transform" : "translate(0, " + moreHeight + "px)",
                                "-moz-transform" : "translate(0, " + moreHeight + "px)",
                                //"-ms-transform" : "translate(0, " + moreHeight + "px)",
                                "transform" : "translate(0, " + moreHeight + "px)"
                            });
                        }
                        break;
                }
            }
        });
        
        var isIphone = false;
        if ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
            isIphone = true;
            Drupal.settings.osci_layout.inner_page_gutter = [4,4,4,4];
            Drupal.settings.osci_layout.outer_page_gutter = [6,6,30,30];
            $("h2.osci_book_section_title").hide();
            $("#osci_navigation_tools").hide();
            $("#osci_note_panel_wrapper").hide();
            $("#osci_header_controls").hide();
            $("#osci_nav_prev").css("top", "10px");
            $("#osci_nav_next").css("top", "10px");
        }
        
        $.osci.layout.defaultOptions = {
            minColumnWidth : Drupal.settings.osci_layout.min_column_width,
            maxColumnWidth : Drupal.settings.osci_layout.max_column_width,
            gutterWidth : Drupal.settings.osci_layout.gutter_width,
            innerPageGutter : Drupal.settings.osci_layout.inner_page_gutter,
            outerPageGutter : Drupal.settings.osci_layout.outer_page_gutter,
            viewerId : Drupal.settings.osci_layout.viewer_id,
            minLinesPerColumn : Drupal.settings.osci_layout.min_lines_per_column,
            layoutCacheTime : Drupal.settings.osci_layout.cache_time,
            processFigureCallback : {
                image : function(figure, content) {
                    var contentWidth = content.width(),
                        contentHeight = content.height(),
                        imageCacheSize = 0,
                        finalImage, finalImageWidth;
                    
                    $("a", content).fancybox();
                    
                    imageCacheSize = Math.pow(2, Math.ceil(Math.log(contentWidth) / Math.log(2)));
                    
                    if (imageCacheSize > 0 && imageCacheSize <= 1024) {
                        $("img:not(.osci_image_" + imageCacheSize + ")", content).remove();
                        finalImageWidth = imageCacheSize;
                    } else {
                        $("img:not(.osci_image_full)", content).remove();
                    } 
                    
                    finalImage = $("img", content);
                    finalImage.attr("src", finalImage.data("src"));
                    
                    if (finalImageWidth === undefined) {
                        finalImageWidth = finalImage.width();
                    }
                    
                    if (finalImageWidth > contentWidth) {
                        finalImage.width(contentWidth);
                    }
                    
                    figure.prepend(content);
                    
                    // Prevents fancybox from closing the tray
                    content.find("a").click(function(e) {
                        e.stopPropagation();
                    });

                    figure.bind("osci_figure_fullscreen", function(e) {
                        $('.figureContent > a', this).click();
                    });
                    
                    return true;
                },
                iip_image : function(figure, content) {
                    figure.prepend(content);
                    iipmap(content.find(".iipmap"));
                },
                conservation_asset: function(figure, content) {
                    figure.prepend(content);
                    content.find('.conservation-asset').each(function() {
                       new ConservationAsset(this); 
                    });

                    figure.bind("osci_figure_fullscreen", function(e) {
                        var assetId = $(this).find('.conservation-asset').attr("id");
                        var asset = window.caCollection.find(assetId);
                        asset.fullscreen(true);
                    });
                },
                image_asset: function(figure, content) {
                    figure.prepend(content);
                    content.find('.conservation-asset').each(function() {
                       new ConservationAsset(this); 
                    });
                    
                    figure.bind("osci_figure_fullscreen", function(e) {
                        var assetId = $(this).find('.conservation-asset').attr("id");
                        var asset = window.caCollection.find(assetId);
                        asset.fullscreen(true);
                    });
                },
                iip_asset: function(figure, content) {
                    figure.prepend(content);
                    content.find('.conservation-asset').each(function() {
                       new ConservationAsset(this); 
                    });
                    
                    figure.bind("osci_figure_fullscreen", function(e) {
                        var assetId = $(this).find('.conservation-asset').attr("id");
                        var asset = window.caCollection.find(assetId);
                        asset.fullscreen(true);
                    });
                },
                svg_asset: function(figure, content) {
                    figure.prepend(content);
                    content.find('.conservation-asset').each(function() {
                       new ConservationAsset(this); 
                    });
                    
                    figure.bind("osci_figure_fullscreen", function(e) {
                        var assetId = $(this).find('.conservation-asset').attr("id");
                        var asset = window.caCollection.find(assetId);
                        asset.fullscreen(true);
                    });
                },
                html_figure : function(figure, content) {
                    var contentHeight = 0, aspect = 0, contentWidth = 0, translate;
                    figure.prepend(content);
                    
//                    content.children().each(function(i, elem){
//                        var $elem = $(elem);
//                        contentHeight += $elem.outerHeight(true);
//                        contentWidth += $elem.outerWidth(true);
//                    });
//                    
//                    aspect = Math.round((contentWidth / contentHeight) * 1000) / 1000;
//                    figure.data("aspect", aspect);
                    
//                    if (!figure.data("aspect_determined")) {
//                        figure.data("aspect_determined", true);
//                        return false;
//                    } 

//                    if (aspect > 1) {
//                        translate = "translate(-" + ((contentWidth - (contentWidth / aspect)) / 2) + "px, 0)";
//                    } else {
//                        translate = "translate(0, " + ((contentHeight - (contentHeight * aspect)) / 2) + "px)";
//                    }
//                    
//                    content.children().css({
//                        "transform" : translate + " scale(" + aspect + ")",
//                        "-moz-transform" : translate + " scale(" + aspect + ")",
//                        "-webkit-transform" : translate + " scale(" + aspect + ")"
//                    });
                    
                    $("<a>", {
                        href : "#",
                        "class" : "figure_fullscreen"
                    }).appendTo($("figcaption", figure)).fancybox({
                        content : content.clone().css({
                            height : "auto",
                            width : "auto"
                            //transform : "translate(0px, 0px) scale(1)",
                            //"-moz-transform" : "translate(0px, 0px) scale(1)",
                            //"-webkit-transform" : "translate(0px, 0px) scale(1)"
                        }),
                        title : $("figcaption", figure).clone().html()
                    });
                    
                    figure.bind("osci_figure_fullscreen", function(e) {
                        $(this).find("a.figure_fullscreen").click();
                    });
                    
                    return true;
                }
            }
        };

        if (!isIphone) {
            $.osci.note({
                notePanelId : "osci_note_panel_wrapper",
                panelPixelsClosed : 20,
                userNoteCallback : Drupal.settings.basePath + 'ajax/note',
                noteAddCallback : Drupal.settings.basePath + 'ajax/note/add',
                noteSaveCallback : Drupal.settings.basePath + 'ajax/note/save'
            });
        }
        
        $.osci.navigation({
            readerId : Drupal.settings.osci_navigation.reader_id,
            headerId : Drupal.settings.osci_navigation.header_id,
            navId : Drupal.settings.osci_navigation.nav_id,
            tocId : Drupal.settings.osci_navigation.toc_id,
            apiEndpoint : Drupal.settings.osci_navigation.api_endpoint,
            prevLinkId : Drupal.settings.osci_navigation.prev_link_id,
            nextLinkId : Drupal.settings.osci_navigation.next_link_id,
            cacheTime : Drupal.settings.osci_navigation.cache_time,
            bid : parseInt(Drupal.settings.osci.bid, 10),
            nid : parseInt(Drupal.settings.osci.nid, 10),
            mlid : parseInt(Drupal.settings.osci.mlid, 10),
            tocOverlay : false,
            tocToggleCallback : function (toc, state)
            {
                switch (state) {
                    case "open":
                        var outerWidth = toc.outerWidth();

                        if ($.browser.msie) {
                            toc.attr("style", "-ms-transform:translate(" + outerWidth + "px, 0);");
                        } else {
                            toc.css({
                                "-webkit-transform" : "translate(" + outerWidth + "px, 0)",
                                "-moz-transform" : "translate(" + outerWidth + "px, 0)",
                                //"-ms-transform" : "translate(" + outerWidth + "px, 0)",
                                "transform" : "translate(" + outerWidth + "px, 0)"
                            });
                        }
                        
                        // When the toc tab is opened:
                        // close the more tab and slide it to the right
                        amplify.publish("osci_more_toggle", {osci_more_close : true});
                        
                        if ($.browser.msie) {
                            $("#osci_more_wrapper").attr("style", "-ms-transform:translate(" + outerWidth + "px, 300px);");
                        } else {
                            $("#osci_more_wrapper").css({
                                "-webkit-transform" : "translate(" + outerWidth + "px, 300px)",
                                "-moz-transform" : "translate(" + outerWidth + "px, 300px)",
                                //-ms-transform" : "translate(" + outerWidth + "px, 300px)",
                                "transform" : "translate(" + outerWidth + "px, 300px)"
	                    });
                        }
                        
                        amplify.publish("osci_note_toggle", {osci_note_close : true});
                        
                        break;
                    case "close":
                        if ($.browser.msie) {
                            toc.attr("style", "-ms-transform:translate(0, 0);");
                        } else {
                            toc.css({
                                "-webkit-transform" : "translate(0px, 0)",
                                "-moz-transform" : "translate(0, 0)",
                                //"-ms-transform" : "translate(0, 0)",
                                "transform" : "translate(0, 0)"
                            });
                        }
                        
                        // When the toc tab is closed:
                        // slide the more tab to the right
                        if ($.browser.msie) {
                            $("#osci_more_wrapper").attr("style", "-ms-transform:translate(0, 300px);");
                        } else {
                            $("#osci_more_wrapper").css({
                                "-webkit-transform" : "translate(0px, 300px)",
                                "-moz-transform" : "translate(0px, 300px)",
                                //"-ms-transform" : "translate(0px, 300px)",
                                "transform" : "translate(0px, 300px)"
	                    });
                        }
                        
                        amplify.publish("osci_note_toggle", {osci_note_open : true});
                        
                        break;
                }
            },
            loadFunction : function (navData)
            {
                var endpoint = Drupal.settings.osci_navigation.content_endpoint.replace("{$nid}", navData.nid);
                
                //Get the data
                $.osci.storage.getUrl({
                    url :  endpoint,
                    expire : Drupal.settings.osci_navigation.cache_time,
                    callback : function(content) {

                        var data = $(content.data),
                            footnotes = data.find("#field_osci_footnotes").remove(),
                            figures = data.find("#field_osci_figures").find(".figureThumbnail").remove(),
                            moreContainer = $("#" + $.osci.more.options.containerId).show();
                        
                        //Add footnotes to the more bar
                        footnotes = footnotes.find(".footnote");
                        if (footnotes.length) {
                            $.osci.more.add_content("footnotes", footnotes, true, 1);
                        }
                        
                        if (figures.length) {
                            //Remove plate image thumbnail
                            figures = figures.filter(function(){
                                if ($(this).data("figure_id") == "osci_plate_fig") {
                                    return false;
                                } else {
                                    return true;
                                }
                            });

                            //Add figures to the more bar
                            $.osci.more.add_content("figures", figures, true, undefined, function(tab){
                                $(".figureThumbnail", tab).each(function(i, elem){
                                    var $elem = $(elem),
                                        img = $elem.find("img"),
                                        gotoClass = (parseInt(img.data("occurences"), 10) > 1) ? "figure_goto-multi" : "figure_goto";

                                    $("<a>", {
                                        text : "goto",
                                        href : "#",
                                        click : function(e) {
                                            e.preventDefault();
                                            var id = $("img", $(this).parent()).data("figure_id");

                                            findAndGotoElement("a[href='#" + id + "']");

                                            amplify.publish("osci_more_toggle", {osci_more_close : true});
                                        },
                                        title : "Locate figure in text",
                                        "class" : gotoClass
                                    }).appendTo($elem);

                                    img.click(function(e){
                                        e.preventDefault();
                                        var id = $(this).data("figure_id");

                                        amplify.publish("osci_figure_load", {figure_id : "#" + id});

                                        $("#osci_pages").find("#" + id).trigger({
                                            type : "osci_figure_fullscreen"
                                        });
                                    });

                                    $("<a>", {
                                        text : "fullscreen",
                                        href : "#",
                                        click : function(e) {
                                            e.preventDefault();
                                            var id = $(this).parent().find("img").data("figure_id");

                                            amplify.publish("osci_figure_load", {figure_id : "#" + id});

                                            $("#osci_pages").find("#" + id).trigger({
                                                type : "osci_figure_fullscreen"
                                            });
                                        },
                                        title : "View full screen",
                                        "class" : "figure_fullscreen"
                                    }).appendTo($elem);
                                });
                            });
                        }

                        if (!footnotes.length && !figures.length) {
                            moreContainer.hide();
                        } else {
                            moreContainer.show();
                        }
                        
                        //Do the layout
                        $.osci.layout(data, {
                            readerId : Drupal.settings.osci_navigation.reader_id,
                            cacheId : navData.nid
                        });
                    }
                });
            }
        });
        
        //make cross linking work
//        reader.find("a.cross-link").live("click", function(e){
//        //$("a.cross-link","#" + Drupal.settings.osci_navigation.reader_id).live("click", function(e){
//            e.preventDefault();
//            var $this = $(this),
//                query = $this.data("query"),
//                link = $this.data("nid");
//
//            if (query !== undefined && query.length > 0) {
//                link += query;
//            }
//            
//            amplify.publish("osci_navigation", {osci_to : "node", osci_value : link});
//        });
        
        //make footnotes link to footnote text in more bar
        reader.find("a.footnote-link").live("click", function(e){
        //$("a.footnote-link","#" + Drupal.settings.osci_navigation.reader_id).live("click", function(e){
            e.preventDefault();
            e.stopPropagation();
            var $this = $(this);

            amplify.publish("osci_more_goto", {tab_name : "footnotes", selector : $this.attr("href")});
        });
        
        //make footnotes link in more bar to position in text
        $("span.footnote_number", "#osci_more_wrapper").live("click", function(e){
            e.preventDefault();
            var id = $(this).parent().attr("id");
            
            findAndGotoElement("a[href='#" + id + "']");

            amplify.publish("osci_more_toggle", {osci_more_close : true});
        });
        
        //make figure links open the fullscreen view
        reader.find("a.figure-link").live("click", function(e){
        //$("a.figure-link","#" + Drupal.settings.osci_navigation.reader_id).live("click", function(e){
            e.preventDefault();
            e.stopPropagation();
            var $this = $(this),
                figure;

            figure = $("#osci_pages").find($this.attr("href"));

//            if (figure.is(":visible")) {
//                amplify.publish("osci_navigation", {osci_to : "selector", osci_value : $this.attr("href")});
//            } else {
                figure.trigger({
                    type : "osci_figure_fullscreen"
                });
            //}
        });
        
        //make more & navigation bars close when viewer is clicked
        $("#" + Drupal.settings.osci_layout.viewer_id).click(function(e){
            amplify.publish("osci_nav_toggle", {osci_nav_close : true});
            amplify.publish("osci_more_toggle", {osci_more_close : true});
        });
        
        $(".osci_reference_image_link").live("click",function(e){
            e.preventDefault();
//            var $this = $(this),
//                fancyOptions = {
//                    speedIn : 100,
//                    speedOut : 100,
//                    scroll : 'no'
//                };
//                
//            if ($this.parent().hasClass("everpresent")) {
//                fancyOptions.title = '<a target="_blank" href="' + $this.attr('href') + '">Open in new window</a>';
//            }
//                
//            fancyOptions.href = $this.attr("href");
//            $.fancybox(fancyOptions);
            $("#osci_pages").find("#osci_plate_fig").trigger({
                type : "osci_figure_fullscreen"
            });
        });
        
        var checkKey = false;
        $doc.keydown(function(e) {
            if (e.keyCode == 70 && e.ctrlKey === true && checkKey === false) {
                checkKey = true;
                $(".everpresent a").click();
                e.preventDefault();
            } else if (e.keyCode == 70 && e.ctrlKey === true && checkKey === true) {
                checkKey = false;
                $('#fancybox-close').click();
                e.preventDefault();
            }
        });
        
        $("#user_link").tooltip({
            position : "bottom center"            
        });
        
        $("#osci_print").click(function(e){
            e.preventDefault();
            
            window.open($.osci.navigation.data.toc["nid_" + $.osci.navigation.data.nid].print);
        });
        
        amplify.subscribe("osci_navigation_complete", function(data) {
            var link = $("#osci_header_controls").find(".logout-link, .login-link"),
                url = link.attr("href");
            
            url = url.substr(0, url.indexOf("destination=") + 12);
            url = url + document.location.pathname.substr(1);
            link.attr("href", url);

            if (window._gaq) {
                window._gaq.push(['_trackEvent', 'Navigation', 'Navigated to new page', url, data.page]);
            }
        });
        
        amplify.subscribe("osci_toc_complete", function() {
            $("#osci_navigation_toc_wrapper").find("li.inactive > a").tipsy({
                gravity : "w",
                fade : true,
                html : true,
                title : function() {
                    return "The complete version of <em>" + $("#osci_header").find(".osci_book_title").text() + "</em> will include entries for the following works of art.";
                }
            });
        });
        
        $("#search").tipsy({
            gravity : "n",
            fade : true,
            fallback : "The publication's search capability is currently in development"
        });
        
        //function to call when the browser is resized
        function _osci_resize(force)
        {
            var $window = $(window),
                currentWidth = $window.width(),
                currentHeight = $window.height();
                
            if (!force && $.osci.windowSize.height == currentHeight && $.osci.windowSize.width == currentWidth) {
                return;
            } else {
                $.osci.windowSize = {
                    height : currentHeight,
                    width : currentWidth
                };
            }
            
        	//get the first paragraph currently displayed so we can try to stay on the same page after the resize
            var firstParagraph = $("div.osci_page_" + ($.osci.navigation.data.currentPage + 1)).find("p.osci_paragraph:first");

            //clear the layout cache and reload the content
            $.osci.storage.clearCache("osci_layout_cache:");
            $.osci.navigation.loadContent(false, "paragraph", firstParagraph.data("paragraph_id"));
        }
        
        //smooth out resizing
        if (!window.resizeTimer) {
            var $window = $(window);
            
            if (!$.osci.windowSize) {
                $.osci.windowSize = {
                    height : $window.height(),
                    width : $window.width()
                };
            }
            
            $window.resize(function(){
                if (window.resizeTimer) {
                    clearTimeout(window.resizeTimer);
                }

                window.resizeTimer = setTimeout(_osci_resize, 100);
            });
        }
        
        // increase content font size
        $("#osci_increase_font").click(function (e) {
            if($.osci.fontSize) {
                $.osci.fontSize += 20;
            } else {
                $.osci.fontSize = 120;
            }

            // reset content
            _osci_resize(true);
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
            _osci_resize(true);
        });
        
        
        
        var loggedOut = $("a.login-link");
        if (loggedOut.length) {
            var winWidth = $("body").outerWidth() * .9,
                maxWidth = 400,
                width = winWidth > maxWidth ? maxWidth : winWidth,
                content = $("body").append($('<div id="disclaimer"><h1>Welcome</h1><p>Please note that this publication represents a limited presentation of the digital catalogues <em>Monet Paintings and Drawings at the Art Institute of Chicago</em> and <em>Renoir Paintings and Drawings at the Art Institute of Chicago</em>, the first two volumes in the series <em>Paintings and Drawings by the Impressionist Circle in the Collection of the Art Institute of Chicago</em>. At this time, only the entries for Claude Monet’s <em>Beach at Sainte-Adresse</em> and <em>Cliff Walk at Pourville</em> and Pierre-Auguste Renoir’s <em>Laundress</em> are available, though the volumes will eventually include our comprehensive holdings of works by these artists. Certain other sections of the catalogues, such as the collector pages, will also be further expanded in the future.</p><p>This preview publication is currently in a usability-testing period and only functions fully in Chrome and Safari browsers.  A few functions, including the search feature, remain in the development stage.</p><p>We welcome you to view a short video to learn more about the catalogue features: <a href="http://youtu.be/Vyvt7h6cuj8">http://youtu.be/Vyvt7h6cuj8</a></p><p>Thank you for visiting! We welcome your questions and comments about the publication. <a href="https://www.surveymonkey.com/s/OnlineCatalogueFeedback">Fill out a survey to let us know what you think.</a></p></div>').hide());
            var tempLink = $("<a>", {"id" : "disclaimer-link"}).hide().appendTo("body").fancybox(
                {
                    'width' : width,
                    'autoDimensions' : false,
                    'height' : 'auto',
                    'content' : $("#disclaimer").clone().show()
                }
            );
            setTimeout(function(){
                jQuery("#disclaimer-link").click();
            }, 1000);
        }
    });
})(jQuery);
