/*
EXAMPLE

$.osci.getURL({
    expire: 86400, // epoch time to hold onto cached object, defaults to 1 day
    clear: false, // if set to true localStorage cache will be cleared
    type: 'html', //see $.ajax() documentation
    url: 'path/to/url' // a path to the url you wish to cache
});

*/
(function ($) {
    if (!$.osci) {
        $.osci = {};
    }
    
    $.osci.storage = {};
    
    $.osci.storage.hasLocalStorage = function ()
    {
        if ('localStorage' in window && window.localStorage !== null) {
            return true;
        } else {
            return false;
        }
    };

    $.osci.storage.getUrl = function (config) 
    {
        var time, key, item = null, finished,
            settings = $.extend({}, $.osci.storage.defaultSettings, config);

        // return if a url is not set
        if (settings.url === '') {
            return false;
        }

        key = (settings.key === 'url') ? settings.url : settings.key;
                
        item = $.osci.storage.get(key);
        
        if (!(item === null || item === undefined)) {
            item.cache = 'true';
            settings.callback(item);
            return;
        }

        //no localstorage or expired
        $.ajax({
            url: settings.url,
            async: true,
            //dataType: settings.type,
            timeout : settings.timeout,
            success: function(data) {
                var jsonItem, time = new Date();
                time = Math.floor(time.getTime() / 1000 + settings.expire);
                item = {
                    data  : data,
                    expire: time
                };

                $.osci.storage.set(key, item, settings.expire);

                item.cache = 'false';
                settings.callback(item);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                //console.log('An error has occurred');
                var time = new Date();
                time = Math.floor(time.getTime() / 1000 + settings.expire);
                settings.callback({
                    data  : null,
                    expire: time
                });
            }
        });
    };

    $.osci.storage.clearCache = function(prefix) 
    {
        if ($.osci.storage.hasLocalStorage()) {
            var count, key, removeKeys = [], i;
            
            if (prefix === undefined) {
                window.localStorage.clear();
            } else {
                count = window.localStorage.length;
                for (i = 0; i < count; i++) {
                    key = window.localStorage.key(i);
                    if (key && key.indexOf(prefix) === 0) {
                        removeKeys.push(key);
                    }
                }
                
                count = removeKeys.length;
                if (count) {
                    for (i = 0; i < count; i++) {
                        window.localStorage.removeItem(removeKeys[i]);
                    }
                }
            }
            return true;
        } 
    };
    
    $.osci.storage.get = function(key)
    {
        var item = null, time;
        
        if ($.osci.storage.hasLocalStorage()) {
            time = new Date();
            time = Math.floor(time.getTime() / 1000);
            
            item = JSON.parse(window.localStorage.getItem(key));

            if (item && item.expire <= time) {
                item = null;
            }
        }
        
        return item;
    };
    
    $.osci.storage.set = function(key, value, expire)
    {
        var item, time, jsonItem;
        
        if ($.osci.storage.hasLocalStorage() && key && value) {
            if (expire === undefined) {
                expire = 86400;
            }
            
            time = new Date();
            time = Math.floor(time.getTime() / 1000 + expire);
            
            if (value.data) {
            	item = value;
            } else {
	            item = {
	                data : value
	            };
            }
            
            item.expire = time;
            
            jsonItem = JSON.stringify(item);
            window.localStorage.setItem(key, jsonItem); 
        }
    };
    
    $.osci.storage.defaultSettings = {
        url:    '',
        expire: 86400, // One day
        type:   'text',
        clear:  false,
        key:    'url',
        callback : function(data) {return data;},
        timeout : 60000
    };
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
