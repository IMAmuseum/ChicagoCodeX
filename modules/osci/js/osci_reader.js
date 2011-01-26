jQuery(document).ready(function() {
    jQuery("#osci_navigation").osci_navigation({
        readerId : Drupal.settings.osci_navigation.reader_id,
        headerId : Drupal.settings.osci_navigation.header_id,
        apiEndpoint : Drupal.settings.osci_navigation.api_endpoint,
        contentEndpoint : Drupal.settings.osci_navigation.content_endpoint,
        prevLinkId : Drupal.settings.osci_navigation.prev_link_id,
        nextLinkId : Drupal.settings.osci_navigation.next_link_id,
        cacheTime : Drupal.settings.osci_navigation.cache_time
    });
});