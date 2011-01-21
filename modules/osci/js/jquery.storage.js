/*
EXAMPLE

$.osci.getURL({
    expire: 86400, // epoch time to hold onto cached object, defaults to 1 day
    clear: false, // if set to true localStorage cache will be cleared
    type: 'html', //see $.ajax() documentation
    url: 'path/to/url' // a path to the url you wish to cache
});

*/
(function($) {
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.getUrl = function(config) {
        //urlStorage:  function(config) {
        var settings = jQuery.extend({}, $.osci.getUrl.defaultSettings, config);

        // return if a url is not set
        if (settings.url == '') return false;

        // if browser supports localStorage proceed
        if ('localStorage' in window && window['localStorage'] !== null) {
            var store = window.localStorage,
                time = new Date(),
                start = new Date(),
                key = (settings.key == 'url') ? settings.url : settings.key;
                    
            time = Math.floor(time.getTime() / 1000);

            if (settings.clear === true) {
                store.clear();
            }

            var item = JSON.parse(store.getItem(key));
            if (item == null || item.expire <= time) {
                $.ajax({
                    url: settings.url,
                    cache: false,
                    async: false,
                    dataType: settings.type,
                    success: function(data) {
                        var time = new Date()
                        time = Math.floor(time.getTime() / 1000 + settings.expire);
                        item = {
                            data:   data,
                            expire: time 
                        };
                        jsonItem = JSON.stringify(item);
                        
                        store.setItem(key, jsonItem); 
                        item.cache = 'false';
                    },
                    error: function(arg1, arg2) {
                        console.log('An error has occurred');
                        return null;
                    }
                });

            } else {
                item.cache = 'true';
            }

            var finished = new Date();
            item.time = finished.getTime() - start.getTime();
            return item;
        
        }

    }

    $.osci.getUrl.clearCache = function() {
        if ('localStorage' in window && window['localStorage'] !== null) {
            window.localStorage.clear();
            $('.stat').html('Cache cleared');
            $('#returnResult').html('');
            return true;
        } 
    }
    
    $.osci.getUrl.defaultSettings = {
        url:    '',
        expire: 86400, // One day
        type:   'html',
        clear:  false,
        key:    'url'
    }
})(jQuery);

/*
(function ($) {
    $(document).ready(function() {
        $('#getText').click(function() {
            var config = {
                url: '/osci/node/9/bodycopy'
            };
            var content = $.osci.getUrl({ url: '/osci/node/9/bodycopy' });
            $('.stat').html('CACHE: ' + content.cache + '<br/> TIME: ' + content.time + 'ms');
            $('#returnResult').html(content.data);
            return false;
        });
        $('#clearCache').click(function() {
            $.osci.getUrl.clearCache(); 
        });
    });
})(jQuery);
*/
