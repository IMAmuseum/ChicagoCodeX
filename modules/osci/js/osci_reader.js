(function($) {
    $(document).ready(function() {
        $("#osci_more_wrapper").osci_more();
        
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
        
        $.osci.citation({
            citationPanelId : "osci_citation_panel_wrapper",
            panelPixelsClosed : 20
        });
        
        $.osci.navigation({
            readerId : Drupal.settings.osci_navigation.reader_id,
            headerId : Drupal.settings.osci_navigation.header_id,
            navId : Drupal.settings.osci_navigation.nav_id,
            tocId : Drupal.settings.osci_navigation.toc_id,
            apiEndpoint : Drupal.settings.osci_navigation.api_endpoint,
            contentEndpoint : Drupal.settings.osci_navigation.content_endpoint,
            prevLinkId : Drupal.settings.osci_navigation.prev_link_id,
            nextLinkId : Drupal.settings.osci_navigation.next_link_id,
            cacheTime : Drupal.settings.osci_navigation.cache_time,
            bid : parseInt(Drupal.settings.osci.bid, 10),
            nid : parseInt(Drupal.settings.osci.nid, 10),
            mlid : parseInt(Drupal.settings.osci.mlid, 10),
            tocToggleElements : {
                open : [
                    {selector : "#osci_more_wrapper", event : "osci_more_toggle", eventData : {osci_more_close : true}},
                    {selector : "#osci_citation_panel_wrapper", event : "osci_citation_toggle", eventData : {osci_citation_close : true}}
                ],
                close : [
                    {selector : "#osci_citation_panel_wrapper", event : "osci_citation_toggle", eventData : {osci_citation_open : true}}
                ]
            }
        });
        
        $("a.footnote-link","#" + Drupal.settings.osci_navigation.reader_id).live("click", function(e){
            e.preventDefault();
            var $this = $(this);

            $("#osci_more_wrapper").trigger({
                type : "osci_more_goto",
                tab_name : "footnotes",
                id : $this.attr("href")
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
            var $this = $(this);

            $(document).trigger({
                type : "osci_navigation",
                osci_to : "selector",
                osci_value : $this.attr("href")
            });
        });
        
        $("div.figureThumbnail", "#osci_more_wrapper").live("click", function(e){
            e.preventDefault();
            var id = $("img", this).data("figure_id");
            
            $(document).trigger({
                type : "osci_navigation",
                osci_to : "selector",
                osci_value : "#" + id
            });
            
            $("#osci_more_wrapper").trigger({
                type : "osci_more_toggle",
                osci_more_close : true
            });
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
    });
})(jQuery);