(function($) {
    $(document).ready(function() {
        $("#osci_more_wrapper").osci_more({
            moreToggleCallback : function(more, state)
            {
                switch (state) {
                    case "open":
                        more.css({
                            "-webkit-transform" : "translate(0, 0)",
                            "-moz-transform" : "translate(0, 0)",
                            "transform" : "translate(0, 0)"
                        });
                        break;
                    case "close":
                        more.css({
                            "-webkit-transform" : "translate(0, " + more.outerHeight() + "px)",
                            "-moz-transform" : "translate(0, " + more.outerHeight() + "px)",
                            "transform" : "translate(0, " + more.outerHeight() + "px)",
                        });
                        break;
                }
            }
        });
        
        $.osci.layout.defaultOptions = {
            minColumnWidth : Drupal.settings.osci_layout.min_column_width,
            maxColumnWidth : Drupal.settings.osci_layout.max_column_width,
            gutterWidth : Drupal.settings.osci_layout.gutter_width,
            innerPageGutter : Drupal.settings.osci_layout.inner_page_gutter,
            outerPageGutter : Drupal.settings.osci_layout.outer_page_gutter,
            viewerId : Drupal.settings.osci_layout.viewer_id,
            minLinesPerColumn : Drupal.settings.osci_layout.min_lines_per_column,
            layoutCacheTime : Drupal.settings.osci_layout.cache_time
        };
        
        //$('#osci_note_panel_wrapper').overscroll();

        $.osci.note({
            notePanelId : "osci_note_panel_wrapper",
            panelPixelsClosed : 20,
            userNoteCallback : Drupal.settings.basePath + 'ajax/note',
            noteAddCallback : Drupal.settings.basePath + 'ajax/note/add',
            noteSaveCallback : Drupal.settings.basePath + 'ajax/note/save',
        });
        
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
                        toc.css({
                            "-webkit-transform" : "translate(0px, 0)",
                            "-moz-transform" : "translate(0px, 0)",
                            "transform" : "translate(0px, 0)"
                        });
                        
                        $("#osci_more_wrapper").trigger({
                            type : "osci_more_toggle",
                            osci_more_close : true
                        });
                        $("#osci_note_panel_wrapper").trigger({
                            type : "osci_note_toggle",
                            osci_note_close : true
                        });
                        break;
                    case "close":
                        toc.css({
                            "-webkit-transform" : "translate(-" + toc.outerWidth() + "px, 0)",
                            "-moz-transform" : "translate(-" + toc.outerWidth() + "px, 0)",
                            "transform" : "translate(-" + toc.outerWidth() + "px, 0)"
                        });
                        
                        $("#osci_note_panel_wrapper").trigger({
                            type : "osci_note_toggle",
                            osci_note_open : true
                        });
                        break;
                }
            },
            loadFunction : function (navData)
            {
                var footnotes, data, more, figures,
                    endpoint = Drupal.settings.osci_navigation.content_endpoint,
                    content = $.osci.storage.getUrl({
                        url :  endpoint.replace("{$nid}", navData.nid),
                        expire : Drupal.settings.osci_navigation.cache_time
                    });
                
                data = $(content.data);
                footnotes = $("#field_osci_footnotes", data).remove();

                more = $("#osci_more_wrapper").data("osci.more");
                more.add_content("footnotes", $(".footnote", footnotes), true, 1);
                
                figures = $("#field_osci_figures", data);
                more.add_content("figures", $(".figureThumbnail", figures).remove(), true, undefined, function(tab){
                    $(".figureThumbnail", tab).each(function(i, elem){
                        var $elem = $(elem);
                        $("<a>", {
                            text : "goto",
                            href : "#",
                            click : function(e) {
                                e.preventDefault();
                                var id = $("img", $(this).parent()).data("figure_id");
                                
                                $(document).trigger({
                                    type : "osci_navigation",
                                    osci_to : "selector",
                                    osci_value : "#" + id
                                });
                                
                                $("#osci_more_wrapper").trigger({
                                    type : "osci_more_toggle",
                                    osci_more_close : true
                                });
                            },
                            title : "goto figure in context",
                            "class" : "figure_goto"
                        }).appendTo($elem);
                        
                        $("<a>", {
                            text : "fullscreen",
                            href : "#",
                            click : function(e) {
                                e.preventDefault();
                                var id = $("img", $(this).parent()).data("figure_id");
                                
                                $("#" + id, "#osci_pages").trigger({
                                    type : "osci_figure_fullscreen"
                                });
                            },
                            title : "view fullscreen",
                            "class" : "figure_fullscreen"
                        }).appendTo($elem);
                    });
                });
                
                $("#" + Drupal.settings.osci_navigation.reader_id).osci_layout(data, {
                    cacheId : navData.nid
                });
            }
        });
        
        $("a.footnote-link","#" + Drupal.settings.osci_navigation.reader_id).live("click", function(e){
            e.preventDefault();
            var $this = $(this);

            $("#osci_more_wrapper").trigger({
                type : "osci_more_goto",
                tab_name : "footnotes",
                selector : $this.attr("href")
            });
        });
        
        $("span.footnote_number", "#osci_more_wrapper").live("click", function(e){
            e.preventDefault();
            var id = $(this).parent().attr("id");
            
            $(document).trigger({
                type : "osci_navigation",
                osci_to : "selector",
                osci_value : "a[href='#" + id + "']"
            });
            
            $("#osci_more_wrapper").trigger({
                type : "osci_more_toggle",
                osci_more_close : true
            });
        });
        
        $("a.figure-link","#" + Drupal.settings.osci_navigation.reader_id).live("click", function(e){
            e.preventDefault();
            var $this = $(this),
                visible;

            visible = $($this.attr("href") + ":visible", "#osci_pages");
            
            if (visible.length) {
                $(document).trigger({
                    type : "osci_navigation",
                    osci_to : "selector",
                    osci_value : $this.attr("href")
                });
            } else {
                $("#osci_more_wrapper").trigger({
                    type : "osci_more_goto",
                    tab_name : "figures",
                    selector : "div[data-figure_id=" + $this.attr("href").substr(1) + "]"
                });
            }
        });
        
        $("#" + Drupal.settings.osci_layout.viewer_id).click(function(e){
            $("#" + Drupal.settings.osci_navigation.toc_id).trigger({
                type : "osci_nav_toggle",
                osci_nav_close : true
            });
            
            $("#osci_more_wrapper").trigger({
                type : "osci_more_toggle",
                osci_more_close : true
            });
        });

        $(".osci_reference_image a", "#osci_table_of_contents_wrapper").fancybox();
        
        /***************************************
         * Hot key popup image
         */

        var keyCode = 70,
            checkKey = false,
            everpresent = $(".everpresent a", "#osci_note_panel_wrapper"),
            titleLink = '<a target="_blank" href="' + everpresent.attr('href') + '">Open in new window</a>';
        
        everpresent.fancybox({ 
            speedIn: 100, 
            speedOut: 100, 
            scroll: 'no',
            title: titleLink 
        });

        $(document).keydown(function(e) {
            if (e.keyCode == keyCode && e.ctrlKey === true && checkKey === false) {
                checkKey = true;
                $(".everpresent a").click();
                e.preventDefault();
            } else if (e.keyCode == keyCode && e.ctrlKey === true && checkKey === true) {
                checkKey = false;
                $('#fancybox-close').click();
                e.preventDefault();
            }
        });
        
        /****************************************
         * Figure Image Handling
         */
        $(document).bind("osci_layout_complete", function(e) {
            var figureImages = $("figure.image", "#osci_pages");

            $('.figureContent > a', figureImages).fancybox();
            
            $('.figureContent img', figureImages).each(function() {
                $(this).width($(this).parents('.figureContent').width());
                $(this).height($(this).parents('.figureContent').height());
            });

            figureImages.bind("osci_figure_fullscreen", function(e) {
                $('.figureContent > a', this).click();
            });
        });
    });
})(jQuery);