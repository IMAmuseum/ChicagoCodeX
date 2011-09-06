var ConservationAsset = function(container) { // container should be a html element
    var i, layerData;
    
    // check prereqs
    if (jQuery != undefined) { 
        var $ = this.$ = jQuery; 
    }
    else return false;
    if (org.polymaps != undefined) { 
        this.polymaps = org.polymaps; 
    }
    else return false;

    // turn the element into a jQuery object
    this.container = $(container);

    // ensure we have something to work on
    if (this.container.length < 1) {
        return false;
    }

    // load the conservation asset id and configuration
    this.id = this.container.attr('id');
    this.settings = this.container.data();
    this.settings.zoomStep = this.settings.zoomStep || 0.1;
    this.settings.annotationSelectorVisible = false;
    

    // store a copy of the original html - will be used to
    // regenerate markup for fullscreen
    this.settings.originalMarkup = this.container[0].outerHTML;

    // extract the layer data
    this.layers = [];
    var layerContainer = this.container.find('.conservation-layers');
    var layerItems = layerContainer.find('li');
    for (i=0; i < layerItems.length; i++) {
        var layerMarkup = $(layerItems[i]);
        this.layers.push(layerMarkup.data());
    }
    layerContainer.remove();

    // sort the layers so that annotations are always last (on top)
    this.layers.sort(function(a,b) {
        var layer1 = a.annotation;
        var layer2 = b.annotation;
        if (layer1 == layer2) return 0;
        if (layer1 && !layer2) return 1;
        if (!layer1 && layer2) return -1;
        return 0;
    });
    
    // we must order their layer_num properties
    // also create separate arrays of base and annotation layers for convenience
    this.baseLayers = [];
    this.annotationLayers = [];
    for (i=0; i < this.layers.length; i++) {
        layerData = this.layers[i];
        layerData.layer_num = i + 1;
        if (layerData.annotation) {
            this.annotationLayers.push(layerData);
        }
        else {
            this.baseLayers.push(layerData);
        }
    }

    // initialize the container as a polymap
    this.map = this.polymaps.map();
    this.map.container(this.container[0].appendChild(this.polymaps.svg('svg')));
    this.map.tileSize({
        x: 256, 
        y: 256
    });

    // calculate zoom levels if not already present
    for (i=0; i < this.layers.length; i++) {
        layerData = this.layers[i];
        if (!layerData.zoom_levels) {
            layerData.zoom_levels = this.getZoomLevels(layerData.width, layerData.height);
        }
    }

    // create first layer, second layer, and make second transparent
    this.createLayer(this.baseLayers[0]);
    if (this.baseLayers[1]) {
        this.createLayer(this.baseLayers[1]);
        $('#' + this.baseLayers[1].id).css('opacity', 0);
    }

    // create control interface
    this.createUI();

    // fit to the map to its container and set the zoom range
    this.zoomToContainer();
    
    // if initial extents were given, honor them
    if (this.container.attr('data-extent-sw-lon')) {
        var extents =  [
            {
                lon: this.container.attr('data-extent-sw-lon'),
                lat: this.container.attr('data-extent-sw-lat')
            },
            {
                lon: this.container.attr('data-extent-ne-lon'),
                lat: this.container.attr('data-extent-ne-lat')
            }
        ];
        this.map.extent(extents);
    }
}


ConservationAsset.prototype.createLayer = function(layerData) {
    // alias jquery
    var $ = this.$;
    var layer;

    // provide zoom_levels if missing
    if (!layerData.zoom_levels) {
        layerData.zoom_levels = this.getZoomLevels(layerData.width, layerData.height);
    }

    // determine type of layer
    if (layerData.type == 'image') {
        layer = this.createLayerImage(layerData);
    }
    if (layerData.type == 'iip') {
        layer = this.createLayerIIP(layerData);
    }
    if (layerData.type == 'svg') {
        layer = this.createLayerSVG(layerData);
    }

    // flag the layer as visible and 
    // give the layer a reference to its polymap object
    layerData.visible = true;
    layerData.polymapLayer = layer;
	
    // give the layer its id, and add it to the map
    layer.id(layerData.id);
    this.map.add(layer);
}


ConservationAsset.prototype.removeLayer = function(layerData) {
    this.map.remove(layerData.polymapLayer);
    layerData.visible = false;
}


ConservationAsset.prototype.toggleLayer = function(layerData) {
    if (layerData.visible) {
        this.removeLayer(layerData);
    }
    else {
        this.createLayer(layerData);
    }
}


ConservationAsset.prototype.createLayerIIP = function(layerData) {
    var CA = this;
    var layer = this.polymaps.image();
    var tileLoader = function(c) {
        var iipsrv = layerData.ptiff_server;
        var ptiff = layerData.ptiff_path; 
        var image_h = layerData.height; 
        var image_w = layerData.width; 
        var tile_size = 256; 
        var scale = CA.getScale(layerData.zoom_levels - 1, c.zoom);
        var mw = Math.round(image_w / scale); 
        var mh = Math.round(image_h / scale); 
        var tw = Math.ceil(mw / tile_size); 
        var th = Math.ceil(mh / tile_size);
        if (c.row < 0 || c.row >= th || c.column < 0 || c.column >= tw) return null; 
        if (c.row == (th - 1)) { 
            c.element.setAttribute("height", mh % tile_size);
        }
        if (c.column == (tw - 1)) { 
            c.element.setAttribute("width", mw % tile_size);
        } 
        var ret =  iipsrv+"?fif="+ptiff+"&jtl="+(c.zoom)+","+((c.row * tw) + c.column);
        return ret;
    };
    layer.url(tileLoader);
    return layer;
}


ConservationAsset.prototype.createLayerImage = function(layerData) {
    // alias polymaps, as our load and unload functions change "this" inside
    var CA = this;
    var load = function(tile) {
        var scale = CA.getScale(layerData.zoom_levels, tile.zoom);
        tile.element = CA.polymaps.svg('image');
        tile.element.setAttribute("preserveAspectRatio", "none");
        tile.element.setAttribute("x", 0);
        tile.element.setAttribute("y", 0);
        tile.element.setAttribute("width", layerData.width / scale);
        tile.element.setAttribute("height", layerData.height / scale);
        tile.element.setAttributeNS("http://www.w3.org/1999/xlink", "href", layerData.image_path);
        tile.ready = true;
    }

    var unload = function(tile) {
        if (tile.request) tile.request.abort(true);
    }

    var layer = this.polymaps.layer(load, unload).tile(false);
    return layer;
}


ConservationAsset.prototype.createLayerSVG = function(layerData) {
    // alias polymaps, as our load and unload functions change "this" inside
    var CA = this;
    var load = function(tile) {
        var scale = CA.getScale(layerData.zoom_levels, tile.zoom);
        tile.element = CA.polymaps.svg('image');
        tile.element.setAttribute("preserveAspectRatio", "none");
        tile.element.setAttribute("x", 0);
        tile.element.setAttribute("y", 0);
        tile.element.setAttribute("width", layerData.width / scale);
        tile.element.setAttribute("height", layerData.height / scale);
        tile.element.setAttributeNS("http://www.w3.org/1999/xlink", "href", layerData.svg_path);
        tile.ready = true;
    }

    var unload = function(tile) {
        if (tile.request) tile.request.abort(true);
    }

    var layer = this.polymaps.layer(load, unload).tile(false);
    return layer;
}


ConservationAsset.prototype.zoomToContainer = function() {
    // always calculate at the highest possible zoom, 18, 
    // for max fineness of alignment
    var zoomToCalculateAt = 18
    , i;

    // calculate tw and th for each layer
    for (i=0; i < this.layers.length; i++) {
        var layerData = this.layers[i];
        var scale = this.getScale(layerData.zoom_levels - 0, zoomToCalculateAt);
        // TODO: figure out why this is a special case:
        if (layerData.type == 'iip') {
            scale = this.getScale(layerData.zoom_levels - 1, zoomToCalculateAt);
        }
        var mw = Math.round(layerData.width / scale);
        var mh = Math.round(layerData.height / scale);
        var tw = Math.ceil(mw / this.map.tileSize().x);
        var th = Math.ceil(mh / this.map.tileSize().y);
        layerData.tiles_wide = tw;
        layerData.tiles_high = th;
        layerData.tiles_zoom = zoomToCalculateAt;
    }

    // scan the layers and find the greatest extents
    var tiles_wide = 0;
    var tiles_high = 0;
    for (i=0; i < this.layers.length; i++) {
        if (this.layers[i].tiles_high > tiles_high) {
            tiles_high = this.layers[i].tiles_high;
        }
        if (this.layers[i].tiles_wide > tiles_wide) {
            tiles_wide = this.layers[i].tiles_wide;
        }
    }

    // now that we know our max extents, calculate the
    // southwest and northeast corners to fit in container
    this.settings.containerFitSW = this.map.coordinateLocation({
        zoom: zoomToCalculateAt,
        column: 0,
        row: tiles_high
    });
    this.settings.containerFitNE = this.map.coordinateLocation({
        zoom: zoomToCalculateAt,
        column: tiles_wide,
        row: 0
    });

    // apply those extents to the map, bringing all our layers into view
    this.map.extent([this.settings.containerFitSW, this.settings.containerFitNE]);

    // now that the image is zoomed to fit it's container, store the 
    // "to fit" zoom level so we can recall it later
    this.settings.containerFitZoomLevel = this.map.zoom();

    // reset the zoom range
    this.resetZoomRange(this.settings.containerFitZoomLevel);
}


ConservationAsset.prototype.createUI = function() {
    // local aliases
    var $ = this.$
    , CA = this
    , fullscreenClass;

    // hook up polymap drag interaction
    this.map
    .add(this.polymaps.drag())
    .add(this.polymaps.wheel())
    .add(this.polymaps.dblclick());

    // we need to augment the polymap event handlers, since the built in polymaps
    // wheel interaction doesn't allow us to update our user interface controls
    $(this.container).bind('mousewheel', function(event) {
        CA.ui.zoomSlider.slider('value', CA.map.zoom());
    });
    $(this.container).bind('dblclick', function(event) {
        CA.ui.zoomSlider.slider('value', CA.map.zoom());
    });

    // init ui object
    this.ui = {};
    this.ui.legendItemsCount = 0;

    // init bottom control bar
    this.ui.controlbar = $('<div class="ca-ui-controlbar"></div>');

    // fullscreen control
    if (this.settings.collapsed) {
        fullscreenClass = "collapsed";
    }
    else {
        fullscreenClass = "expanded";
    }
    this.ui.fullscreen = $('<div class="ca-ui-fullscreen '+fullscreenClass+'"></div>')
    .bind('click', function() {
        if (CA.settings.collapsed) {
            CA.fullscreen();
        }
        else {
            $('.ca-ui-fullscreen-wrap').remove();
            if (window.scrollOffset) {
                window.scrollTo(window.scrollOffset[0], window.scrollOffset[1]);
            }
        }
    })
    .appendTo(this.ui.controlbar);

    // reset control
    this.ui.reset = $('<div class="ca-ui-reset"></div>')
    .bind('click', function(event) {
        CA.zoomToContainer();
    })
    .appendTo(this.ui.controlbar);

    // annotation control
    if (this.annotationLayers.length > 0) {
        this.ui.annotation = $('<div class="ca-ui-annotation"></div>')
        .bind('click', function(event) {
            CA.toggleAnnotationSelector();
        })
        .appendTo(this.ui.controlbar);
    }

    // layer controls
    if (this.baseLayers.length > 1) {
        this.settings.currentLayer1 = this.baseLayers[0];
        this.settings.currentLayer2 = this.baseLayers[1];

        // layer selectors
        this.ui.layerSelector1 = $('<div class="ca-ui-layer"></div>')
        .html('<div class="ca-ui-right-arrow"></div><span>'+this.settings.currentLayer1.title+'</span>');
        this.ui.layerSelector2 = $('<div class="ca-ui-layer"></div>')
        .html('<div class="ca-ui-right-arrow"></div><span>'+this.settings.currentLayer2.title+'</span>');

        // only provide selectable layers if there are at least three
        if (this.baseLayers.length > 2) {
            this.ui.layerSelector1
            .bind('click', {
                layerControlNum: 1, 
                conservationAsset: this
            }, this.toggleLayerSelector);
            
            this.ui.layerSelector2
            .bind('click', {
                layerControlNum: 2, 
                conservationAsset: this
            }, this.toggleLayerSelector)
        }

        this.ui.controlbar
        .append(this.ui.layerSelector2)
        .append(this.ui.layerSelector1);

        // opacity slider
        this.ui.sliderContainer = $('<div class="ca-ui-layer-slider-container"></div>');
        this.ui.slider = $('<div class="ca-ui-layer-slider"></div>')
        .slider({
            slide: function(event, ui) {
                // set the opacity of layers
                // var primaryOpacity = (100 - ui.value) / 100;
                var secondaryOpacity = ui.value / 100;
                // $('#'+CA.settings.currentLayer1.id).css('opacity', primaryOpacity);
                $('#'+CA.settings.currentLayer2.id).css('opacity', secondaryOpacity);
            }
        })
        .appendTo(this.ui.sliderContainer);
        this.ui.layerSelector2.after(this.ui.sliderContainer);

    }

    // add controlbar to container
    this.ui.controlbar.appendTo(this.container);

    // zoom control
    this.ui.zoom = $('<div class="ca-ui-zoom"></div>');
    this.ui.zoomIn = $('<div class="ca-ui-zoom-in"></div>')
    .bind('click', function(event) {
        var currentVal = CA.ui.zoomSlider.slider('value');
        var newVal = currentVal + CA.settings.zoomStep;
        CA.ui.zoomSlider.slider('value', newVal);
        CA.map.zoom(newVal);
    })
    .appendTo(this.ui.zoom);
    this.ui.zoomSlider = $('<div class="ca-ui-zoom-slider"></div>')
    .slider({ 
        step: this.settings.zoomStep,
        orientation: 'vertical',
        slide: function(event, ui) {
            var newZoom = ui.value;
            var currentZoom = CA.map.zoom();
            if (newZoom != currentZoom) {
                CA.map.zoom(newZoom);
            }
        }
    })
    .appendTo(this.ui.zoom);
    this.ui.zoomOut = $('<div class="ca-ui-zoom-out"></div>')
    .bind('click', function(event) {
        // get the current value, and add one to it
        var currentVal = CA.ui.zoomSlider.slider('value');
        var newVal = currentVal - CA.settings.zoomStep;
        CA.ui.zoomSlider.slider('value', newVal);
        CA.map.zoom(newVal);
    })
    .appendTo(this.ui.zoom);
    this.ui.zoom.appendTo(this.container);

    // viewfinder control
    this.ui.viewfinder = $('<div class="ca-ui-viewfinder viewfinder-closed"></div>')
    .appendTo(this.container);
    
    // store references to the control elements, so they can be manipulated as a collection
    this.ui.controls = [this.ui.controlbar, this.ui.zoom, this.ui.viewfinder, this.ui.currentPopup];
    
    // configure events to show/hide controls
    this.container.bind('mousemove', function(event) {
        var container = CA.container;
        var date = new Date();
        
        container.attr('data-controls-time', date.getTime());
        var controlState = container.attr('data-controls') || 'false';
        if (controlState == 'false') {
            container.attr('data-controls', 'true'); 
            CA.toggleControls(); 
        }
        CA.ui.controlsTimeout = setTimeout(function() {
            var date = new Date();
            // check if the mouse is over a control, if it is, don't hide
            if (container.attr('data-controls') == 'true' 
                && (date.getTime() - container.attr('data-controls-time')) >= 1750) {
                
                if (container.attr('data-controls-lock') != 'true') {
                    container.attr('data-controls', 'false');
                    CA.clearPopups();
                    CA.toggleControls();
                }
            }
        }, 2000);
    });
    // mousing over a control locks them "on"
    $.each(this.ui.controls, function() {
        // test if this is still around.  we include popups, and other transients
        if (this.bind == 'function') {
            this.bind('mouseenter', function() {
                CA.container.attr('data-controls-lock', 'true');
            });
            this.bind('mouseleave', function() {
                CA.container.attr('data-controls-lock', 'false');
            });
        }
    });
}


ConservationAsset.prototype.fullscreen = function() {
    var $ = this.$;

    // store scroll position move to the top of the screen
    window.scrollOffset = [window.pageXOffset, window.pageYOffset];
    window.scrollTo(0,0);

    // create a parent container that spans the full screen
    var wrapper = $('<div class="ca-ui-fullscreen-wrap"></div>');
    wrapper.height(window.innerHeight - 29 + 'px');

    // retrieve the original markup for this ConservationAsset and 
    // remap the IDs of the asset and its layers
    var markup = $(this.settings.originalMarkup);
    markup.attr('id', markup.attr('id') + '-fullscreen');
    markup.attr('data-collapsed', 'false');
    markup.find('li').each(function() {
        var el = $(this);
        el.data('id', el.data('id') + '-fullscreen');
        el.data('parent_asset', el.data('parent_asset') + '-fullscreen');
    });
     
    // the extents of the current map should be restored on full screen
    // use the same data attribute used for insets
    var extents = this.map.extent();
    markup.attr('data-extent-sw-lon', extents[0].lon);
    markup.attr('data-extent-sw-lat', extents[0].lat);
    markup.attr('data-extent-ne-lon', extents[1].lon);
    markup.attr('data-extent-ne-lat', extents[1].lat);

    wrapper.append(markup).appendTo(document.body);
    new ConservationAsset(markup);
}


ConservationAsset.prototype.toggleLayerSelector = function(event) {
    // set up aliases and build dynamic variable names
    var $ = jQuery;
    var CA = event.data.conservationAsset;
    var layerSelector = $(this);
    var layerControlNum = event.data.layerControlNum;
    var layerControlOther = (layerControlNum == 1) ? 2 : 1;
    var layerSelectorPopup = 'layerSelector'+layerControlNum+'Popup';
    var currentLayer = CA.settings['currentLayer'+layerControlNum];
    var otherLayer = CA.settings['currentLayer'+layerControlOther];
	
    // if visible already, remove and set state
    if (CA.ui.currentPopup && CA.ui.currentPopup == CA.ui[layerSelectorPopup]) {
        CA.clearPopups();
    }
    else {
        // check that the other popup is closed
        CA.clearPopups();

        // get the position of the selector's top right corner - this is where to bind the popup
        var parentOffset = layerSelector.offsetParent().position();
        var elOffset = layerSelector.position();
        var elWidth = layerSelector.outerWidth();
        var totalWidth = layerSelector.offsetParent().parent().width();
        var totalHeight = layerSelector.offsetParent().parent().height();
        var right = totalWidth - parentOffset.left - elOffset.left - elWidth;
        var bottom = totalHeight - parentOffset.top - elOffset.top;

        // create a layer list, not including the current selected layer
        var layerList = $('<ul></ul>');
        var numLayers = 0;
        for (var i=0; i < CA.baseLayers.length; i++) {
            var baseLayer = CA.baseLayers[i];
            // only add the layer to the selectable list if the layer isn't
            // the current selection on either selector
            if (baseLayer.layer_num != currentLayer.layer_num && baseLayer.layer_num != otherLayer.layer_num) {
                if (numLayers > 0) {
                    layerList.append('<hr />');
                }
                numLayers++;
                // create the list item and bind it
                var listItem = $('<li>'+baseLayer.title+'</li>')
                .bind('click', {
                    layerControlNum : layerControlNum,
                    newLayer: baseLayer, 
                    currentLayer: currentLayer,
                    CA: CA
                }, 
                function(event) {
                    var CA = event.data.CA;
                    var $ = CA.$;
                    // the layer to switch to
                    var newLayer = event.data.newLayer;
                    // the control's current layer
                    var currentLayer = event.data.currentLayer;
                    // the control number, 1 or 2
                    var layerControlNum = event.data.layerControlNum;

                    // toggle the layer on (zero indexed)
                    CA.createLayer(newLayer);
                    // remove the current layer
                    CA.removeLayer(currentLayer);
                    if (layerControlNum == 2) {
                        // set the opacity according to slider
                        var sliderVal = CA.ui.slider.slider('value');
                        var opacity = sliderVal / 100;
                        $('#'+ newLayer.id)
                        .css('opacity', opacity);
                    }
                    // update the settings layer state
                    CA.settings['currentLayer'+layerControlNum] = newLayer;
                    // realign layers
                    CA.realignLayers();
                    // update the text on the control
                    $('span', CA.ui['layerSelector'+layerControlNum]).html(newLayer.title);
                    // remove the popup
                    CA.settings['layerSelector'+layerControlNum+'Visible'] = false;
                    CA.clearPopups();
                }).appendTo(layerList);
            }
        }

        // create the popup
        CA.ui[layerSelectorPopup] = $('<div class="ca-ui-layer-selector-popup"></div>')
        .css({
            right: right, 
            bottom: bottom
        })
        .bind('mouseenter', function() {
            CA.container.attr('data-controls-lock', 'true');
        })
        .bind('mouseleave', function() {
            CA.container.attr('data-controls-lock', 'false');
        })
        .append(layerList)
        .appendTo(CA.container);
        CA.ui.currentPopup = CA.ui[layerSelectorPopup];
    }
}


ConservationAsset.prototype.toggleAnnotationSelector = function() {
	
    // local aliases
    var $ = this.$;
    var CA = this;

    if (this.ui.currentPopup && this.ui.currentPopup == this.ui.annotationSelector) {
        // remove the control
        this.clearPopups();
    }
    else {
        this.clearPopups();
        // get the position of the button's top right corner - this is where to bind the popup
        var parentOffset = this.ui.annotation.offsetParent().position();
        var elOffset = this.ui.annotation.position();
        var elWidth = this.ui.annotation.outerWidth();
        var totalWidth = this.ui.annotation.offsetParent().parent().width();
        var totalHeight = this.ui.annotation.offsetParent().parent().height();
        var right = totalWidth - parentOffset.left - elOffset.left - elWidth;
        var bottom = totalHeight - parentOffset.top - elOffset.top;

        // create the annotation selector box
        this.settings.annotationSelectorVisible = true;
        this.ui.annotationSelector = $('<div class="ca-ui-annotation-selector"></div>')
        .css({
            right: right, 
            bottom: bottom
        });
        this.ui.annotationSelectorList = $('<ul class="ca-ui-annotation-selector-list"></ul>');
        for (var i=0; i < this.annotationLayers.length; i++) {
            var layerData = this.annotationLayers[i];

            // add list item for annotation layer
            var layerItem = $('<li></li>')
            .bind('click', {
                layerData: layerData
            }, function(event) {
                var layerData = event.data.layerData;
                // toggle the layer on
                CA.toggleLayer(layerData);
                // fill the status box according to layer's visibility state
                var layerItemBox = $(this).find('.ca-ui-annotation-selector-item-box');
                if (layerData.visible) {
                    layerItemBox.removeClass('empty').addClass('filled');
                    // if this is an annotation, use the selected color, and show  layer in legend
                    if (layerData.annotation && layerData.type == 'svg') {
                        layerItemBox.css('background-color', '#' + layerData.color);
                        CA.addLegendItem(layerData);
                    }
                }
                else {
                    layerItemBox.removeClass('filled').addClass('empty');
                    // if annotation, reset the elements background color to fall back to stylesheet
                    // and remove layer from legend
                    if (layerData.annotation && layerData.type == 'svg') {
                        layerItemBox.css('background-color', '');
                        CA.removeLegendItem(layerData);
                    }
                }
            });
            var layerItemBox = $('<div class="ca-ui-annotation-selector-item-box"></div>')
            .addClass(layerData.visible ? 'filled' : 'empty');
			// add the custom layer color if applicable
            if (layerData.visible && layerData.annotation) {
                layerItemBox.css('background-color', '#'+layerData.color);
            }
            
            
            // add horizontal divider if there will be more than one entry after appending this one
            if (this.ui.annotationSelectorList.children().length > 0) {
                this.ui.annotationSelectorList.append('<hr />');
            }

            // append the layerItem
            layerItem
            .append(layerItemBox)
            .append('<span>'+layerData.title+'</span>')
            .appendTo(this.ui.annotationSelectorList);

        }
        // append the finished selector box
        this.ui.annotationSelector
        .bind('mouseenter', function() {
            CA.container.attr('data-controls-lock', 'true');
         })
         .bind('mouseleave', function() {
            CA.container.attr('data-controls-lock', 'false');
         })
        .append(this.ui.annotationSelectorList)
        .appendTo(this.container);
        this.ui.currentPopup = this.ui.annotationSelector;
    }
}


ConservationAsset.prototype.resetZoomRange = function(zoomMin) {
    // set the zoom range
    zoomMin = zoomMin || 0;
    var zoomMax = 0;
    for (var i=0; i < this.layers.length; i++) {
        if (this.layers[i].type == 'iip') {
            if (this.layers[i].zoom_levels - 1 > zoomMax) {
                zoomMax = this.layers[i].zoom_levels - 1;
            }
        }
        else {
            if (this.layers[i].zoom_levels > zoomMax) {
                zoomMax = this.layers[i].zoom_levels;
            }
        }
    }
    this.map.zoomRange([zoomMin, zoomMax]);

    // set the range of the ui slider to match
    this.ui.zoomSlider.slider('option', 'min', zoomMin);
    this.ui.zoomSlider.slider('option', 'max', zoomMax);
}


ConservationAsset.prototype.getZoomLevels = function(width, height) {
    var tileSize = this.map.tileSize().x;
    // there is always at least one zoom level
    var zoomLevels = 1;
    while (width > tileSize || height > tileSize) {
        zoomLevels++;
        width = width / 2;
        height = height / 2;
    }
    return zoomLevels;
}


ConservationAsset.prototype.getScale = function(zoom_levels, zoom) {
    return Math.pow(2, zoom_levels - zoom);
}


ConservationAsset.prototype.realignLayers = function() {
    var $ = this.$
    , i;
	
    // grab the layers out of the dom
    var map = this.container.find('svg.map');
    var layers = map.find('g.layer').remove();
	
    // sort the layers
    // find the first layer
    for (i=0; i < layers.length; i++) {
        if ($(layers[i]).attr('id') == this.settings.currentLayer1.id) {
            map.append(layers[i]);
            layers.splice(i,1);
        }
    }
    // find the second layer
    for (i=0; i < layers.length; i++) {
        if ($(layers[i]).attr('id') == this.settings.currentLayer2.id) {
            map.append(layers[i]);
            layers.splice(i, 1);
        }
    }
    // put the rest of the layers back into the dom
    map.append(layers);
};


ConservationAsset.prototype.clearPopups = function() {
    var CA = this;
    
    if (this.ui.currentPopup) {
        this.ui.currentPopup.fadeOut(400, function() {
            CA.ui.currentPopup.remove();
            CA.ui.currentPopup = false;
        });
        
    }
};


ConservationAsset.prototype.toggleControls = function(duration) {
    duration = duration || 400;
    var $ = this.$;
    
    $.each(this.ui.controls, function() {
        // do this test, this.currentPopup could be false making "this" the window
        if (this != window) {
            this.fadeToggle(duration); 
        }
    });
   
};


ConservationAsset.prototype.addLegendItem = function(layerData) {
    var $ = this.$;
    // if the legend does not exist yet, create it here
    if (!this.ui.legend) {
        // legend control
        this.ui.legend = $('<div class="ca-ui-legend"><ul class="legendList"></ul></div>')
        .css('display', 'block')
        .appendTo(this.container);
        this.ui.controls.push(this.ui.legend);
    }
    
    var legendList = this.ui.legend.find('ul');
    
    var legendItem = $('<li data-layer_num="'+layerData.layer_num+'">'+layerData.title+'</li>')
    .appendTo(legendList);
    
    var itemBox = $('<div class="item-box"></div>')
    .css('background-color', '#'+layerData.color)
    .appendTo(legendItem);
    
    this.ui.legendItemsCount++;
};


ConservationAsset.prototype.removeLegendItem = function(layerData) {
    var $ = this.$;
    var CA = this;
    
    var legendItems = this.ui.legend.find('ul').children();
    // find the item with the matching layer num and remove it
    legendItems.each(function() {
       if ($(this).attr('data-layer_num') == layerData.layer_num) {
           $(this).remove();
           CA.ui.legendItemsCount--;
       } 
    });
    
    // if the legend is empty, remove it
    if (this.ui.legendItemsCount <= 0) {
        this.ui.legend.remove();
        delete this.ui.legend;
        // remove from control array
        for (var i=0; i < this.ui.controls.length; i++) {
            if ($(this.ui.controls[i]).hasClass('ca-ui-legend')) {
                this.ui.controls.splice(i, 1);
            }
        }
    }
};


window.addEventListener('load', function() {
    window.conservationAssets = [];
    var assets = jQuery('.conservation-asset')
    for(var i=0; i < assets.length; i++) {
        var conservationAsset = new ConservationAsset(assets[i]);
        window.conservationAssets.push(conservationAsset);
    }
// console.log(window.conservationAssets, 'conservation assets');
}, false);