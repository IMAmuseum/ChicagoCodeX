(function($) {
    $(document).ready(function() {
        $("#osci_more_wrapper").osci_more();
        
        $.osci.navigation({
            readerId : Drupal.settings.osci_navigation.reader_id,
            headerId : Drupal.settings.osci_navigation.header_id,
            navId : Drupal.settings.osci_navigation.nav_id,
            tocId : Drupal.settings.osci_navigation.toc_id,
            apiEndpoint : Drupal.settings.osci_navigation.api_endpoint,
            contentEndpoint : Drupal.settings.osci_navigation.content_endpoint,
            prevLinkId : Drupal.settings.osci_navigation.prev_link_id,
            nextLinkId : Drupal.settings.osci_navigation.next_link_id,
            cacheTime : Drupal.settings.osci_navigation.cache_time
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
        
        $("div.figureThumbnail > img", "#osci_more_wrapper").live("click", function(e){
            e.preventDefault();
            var id = $(this).data("figure_id");
            
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