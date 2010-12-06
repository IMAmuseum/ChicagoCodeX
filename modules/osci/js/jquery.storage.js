jQuery.fn.urlStorage = function(config) {
    var settings = jQuery.extend({
        url:    '',
        expire: 86400 // One day
    }, config);

    // return if a url is not set
    if (settings.url == '') return false;

    // if browser supports localStorage proceed
    if ('localStorage' in window && window['localStorage'] !== null) {
        var store = window.localStorage;

        var item = store.getItem(settings.url);
        console.log(item);

        
    }
    var urlStorage = {
        getItem: function() {

        },
    }
    
};
