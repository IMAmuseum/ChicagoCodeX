var CACollection = function() {
	var collection = [];
	
	this.add = function(asset) {
		var i, count;
		
		// check that this asset isn't already in the collection
		for (i=0, count = collection.length; i < count; i++) {
			if (collection[i].id == asset.id) {
				return false;
			}
		}
		collection.push(asset);
		return true;
	}
	
	this.remove = function(asset) {
		var i, count;
		// allow an asset or a string id to be passed in
		if (typeof asset == "string") {
			asset = {id: asset};
		}
		
		// find this asset in the collection by id
		for (i=0, count = collection.length; i < count; i++) {
			if (collection[i].id == asset.id) {
				collection.splice(i, 1);
			}
		}
	}
	
	this.find = function(id) {
		var i, count;
		for (i=0, count = collection.length; i < count; i++) {
			if (collection[i].id == id) {
				return collection[i];
			}
		}
		return false;
	}
	
	this.list = function() {
		return collection;
	}

    this.userIsDraggingAsset = false;
};
	

var ConservationAsset = function(container) { // container should be a html element
    var i, count, layerData;
    
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
    
    // push this new asset into the registry, only render if not already present
    if (!window.caCollection.add(this)) {
    	return;
    };
    
    // load the conservation asset id and configuration
    this.id = this.container.attr('id');
    this.settings = this.container.data();
    this.settings.zoomStep = this.settings.zoomStep || 0.1;
    this.settings.annotationSelectorVisible = false;
    this.settings.dragging = undefined;
    
    // detect and incorporate figure options
    var figure = this.container.parents('figure:first');
    var optString = figure.attr('data-options');
    if (figure.length > 0 && optString) {
    	this.figureOptions = JSON.parse(optString);
    }
    // provide defaults if options not set
    if (!this.figureOptions) {
    	this.figureOptions = {
    		interaction: true,
    		annotation: true,
    		sliderPosition: 0
    	};
    }
    // detect and incorporate the caption if it exists
    this.settings.captionMarkup = this.container.parents('figure:first').find('figcaption').clone();

    // store a copy of the original html - will be used to
    // regenerate markup for fullscreen
    this.settings.originalMarkup = outerHTML(this.container[0]);

    // extract the layer data
    this.layers = [];
    var layerContainer = this.container.find('.conservation-layers');
    var layerItems = layerContainer.find('li');
    for (i=0, count = layerItems.length; i < count; i++) {
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
    for (i=0, count = this.layers.length; i < count; i++) {
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
    for (i=0, count = this.layers.length; i < count; i++) {
        layerData = this.layers[i];
        if (!layerData.zoom_levels) {
            layerData.zoom_levels = this.getZoomLevels(layerData.width, layerData.height);
        }
    }
    // create the first two layers, using preset data if available
    var baseLayerPreset = this.figureOptions.baseLayerPreset ? this.figureOptions.baseLayerPreset : [],
        numBaseLayerPresets = baseLayerPreset.length,
        usedPresetLayers = false;
        
    if (numBaseLayerPresets > 0) {
        var firstLayer = this.getLayerById(baseLayerPreset[0]);
        var secondLayer;
        
        if (numBaseLayerPresets > 1) {
            secondLayer = this.getLayerById(baseLayerPreset[1]);
        }
        
        if (firstLayer && (secondLayer || numBaseLayerPresets == 1)) {
            this.createLayer(firstLayer);
            
            if (secondLayer) {
                this.createLayer(secondLayer);
                $('#' + secondLayer.id).css('opacity', 0);
            }
            
            usedPresetLayers = true;
        }
    }
    
    if (!usedPresetLayers) {
    	// create first layer, second layer, and make second transparent
        this.createLayer(this.baseLayers[0]);
	    if (this.baseLayers[1]) {
	        this.createLayer(this.baseLayers[1]);
	        $('#' + this.baseLayers[1].id).css('opacity', 0);
	    }
    }
    
    // create control interface
    this.createUI();
    
    // if any annotation presets are present, display those layers
    this.showAnnotationPresets();

    // fit to the map to its container and set the zoom range
    this.zoomToContainer();
    
    // if fullscreen extents are present, this CA needs to be positioned
    // as its parent was
    var extents = [];
    if (this.figureOptions.fullscreenExtents) {
    	extents = [
    		{
    			lon: this.figureOptions.fullscreenExtents.swLon,
    	        lat: this.figureOptions.fullscreenExtents.swLat
    	    },
    	    {
    	    	lon: this.figureOptions.fullscreenExtents.neLon,
    	        lat: this.figureOptions.fullscreenExtents.neLat
    	    }
    	];
    	this.setExtents(extents);
    }
    // else use the starting postion from the figure options markup
    // - if initial extents were given, honor them
    else if (this.figureOptions.swLat) {
    	extents = [
            {
                lon: this.figureOptions.swLon,
                lat: this.figureOptions.swLat
            },
            {
                lon: this.figureOptions.neLon,
                lat: this.figureOptions.neLat
            }
        ];
        this.setExtents(extents);
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
    if (layerData.polymapLayer) {
        this.map.remove(layerData.polymapLayer);
    }
    layerData.polymapLayer = undefined;
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

ConservationAsset.prototype.repaintLayer = function(layerData) {
    this.removeLayer(layerData);
    this.createLayer(layerData);
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
    , i, count;

    // calculate tw and th for each layer
    for (i=0, count = this.layers.length; i < count; i++) {
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
    for (i=0, count = this.layers.length; i < count; i++) {
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
    , fullscreenClass, currentLayer;

    // hook up polymap drag interaction
    if (this.figureOptions.interaction || this.figureOptions.editing) {
    	this.map
    		.add(this.polymaps.drag())
    		.add(this.polymaps.wheel())
    		.add(this.polymaps.dblclick())
            .add(this.polymaps.touch());

	    // we need to augment the polymap event handlers, since the built in polymaps
	    // wheel interaction doesn't allow us to update our user interface controls
	    $(this.container).bind({
            'mousewheel' : function(event) {
                CA.ui.zoomSlider.slider('value', CA.map.zoom());

                //refresh the viewport if displayed
                CA.refreshViewfinderViewport();
            },
            'dblclick' : function(event) {
                CA.ui.zoomSlider.slider('value', CA.map.zoom());

                //refresh the viewport if displayed
                CA.refreshViewfinderViewport();
            },
            'mousedown' : function(event) {
                CA.settings.dragging = {
                    x: event.clientX,
                    y: event.clientY
                };
                caCollection.userIsDraggingAsset = CA.id;
            }
	    });
    }
    
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
	    	window.caCollection.remove(CA);
	        $('.ca-ui-fullscreen-modal').remove();
	        if (window.scrollOffset) {
	            window.scrollTo(window.scrollOffset[0], window.scrollOffset[1]);
	        }
	    }
	})
	.appendTo(this.ui.controlbar);
    
    // reset control
	this.ui.reset = $('<div class="ca-ui-reset"></div>')
    .bind('click', function(event) {
    	CA.reset();
    });
    if (this.figureOptions.interaction || this.figureOptions.editing) {
        this.ui.reset.appendTo(this.ui.controlbar);
    }

    // annotation control
    if (this.annotationLayers.length > 0) {
        this.ui.annotation = $('<div class="ca-ui-annotation"></div>')
        .bind('click', function(event) {
            CA.toggleAnnotationSelector();
        });
        if (this.figureOptions.annotation || this.figureOptions.editing) {
        	this.ui.annotation.appendTo(this.ui.controlbar);
        }
    }
    
    // layer controls
    var baseLayers = this.getVisibleBaseLayers();
    this.settings.currentLayer1 = baseLayers[0];
    if (baseLayers.length > 1) {
        this.settings.currentLayer2 = baseLayers[1];

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
        if (this.figureOptions.interaction || this.figureOptions.editing) {
        	this.ui.controlbar
            .append(this.ui.layerSelector2)
            .append(this.ui.layerSelector1);
        }

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
                CA.refreshViewfinderOpacity(secondaryOpacity);
            },
            change: function(event, ui) {
                var secondaryOpacity = ui.value / 100;
                $('#'+CA.settings.currentLayer2.id).css('opacity', secondaryOpacity);
                CA.refreshViewfinderOpacity(secondaryOpacity);
            }
        })
        .appendTo(this.ui.sliderContainer);
        
        if (this.figureOptions.interaction || this.figureOptions.editing) {
        	this.ui.layerSelector2.after(this.ui.sliderContainer);
        }
        // restore preset if available
        if (this.figureOptions.sliderPosition) {
        	this.ui.slider.slider('value', this.figureOptions.sliderPosition);
        }
    }
    
    // add controlbar to container
    this.ui.controlbar.appendTo(this.container);
    this.resizeControlBar();

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
    if (this.figureOptions.interaction || this.figureOptions.editing) {
    	this.ui.zoom.appendTo(this.container);
    }

    // viewfinder control
    this.ui.viewfinder = $('<div class="ca-ui-viewfinder viewfinder-closed"></div>');
    
    if (this.figureOptions.interaction || this.figureOptions.editing) {
    	this.ui.viewfinder.appendTo(this.container);
    }
    
    this.ui.viewfinder.bind('click', function(event) {
    	if (CA.ui.viewfinder.hasClass('viewfinder-open')) {
    		// close
    		CA.ui.viewfinder.empty().css('height', '');
    		CA.ui.viewfinder.removeClass('viewfinder-open').addClass('viewfinder-closed');
    		CA.ui.viewfinderViewport = null;
            
            //move legend back up if visible
            CA.positionLegend();
    	}
    	else {
    		// open
    		CA.ui.viewfinder.removeClass('viewfinder-closed').addClass('viewfinder-open');
            
            //move legend down
            CA.positionLegend();
            
    		CA.refreshViewfinder();
    	}
    });
    
    // store references to the control elements, so they can be manipulated as a collection
    this.ui.controls = [this.ui.controlbar, this.ui.zoom, this.ui.viewfinder, this.ui.currentPopup];
    
    /*  DISABLED FOR DEBUGGING - CODE BELOW WORKS .. sometimes
     *
     */
    // configure events to show/hide controls
    this.container.bind('mousemove', function(event) {
        var container = CA.container;
        var date = new Date();
        
        container.attr('data-controls-time', date.getTime());
        var controlState = container.attr('data-controls') || 'false';
        if (controlState == 'false') {
        	// ensure no other CA has its controls up
        	var assets = window.caCollection.list();
        	for (var i=0, count = assets.length; i < count; i++) {
        		var asset = assets[i];
        		if (asset.container.attr('data-controls') == 'true') {
        			asset.container.attr('data-controls', 'false');
        			asset.toggleControls();
        		}
        	}
        	// turn on this CA's controls
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
        if (typeof(this.bind) == 'function') {
            this.bind('mouseenter', function() {
                CA.container.attr('data-controls-lock', 'true');
            });
            this.bind('mouseleave', function() {
                CA.container.attr('data-controls-lock', 'false');
            });
        }
    });
};

ConservationAsset.prototype.reset = function() {
    var $ = this.$, i, count,
        CA = this;
        
    CA.clearPopups();

    // reset to provided inset, or container bounds otherwise
    if (typeof CA.figureOptions.swLat != 'undefined' && !CA.figureOptions.editing) {
        var extents =  [
            {
                lon: CA.figureOptions.swLon,
                lat: CA.figureOptions.swLat
            },
            {
                lon: CA.figureOptions.neLon,
                lat: CA.figureOptions.neLat
            }
            ];
        CA.map.extent(extents);
    }
    else {
        CA.zoomToContainer();
    }
    // correct zoom control to reflect new zoom
    CA.ui.zoomSlider.slider('value', CA.map.zoom());

    // reset initial slider position
    if (CA.figureOptions.sliderPosition) {
        if (CA.ui.slider) {
            CA.ui.slider.slider('value', CA.figureOptions.sliderPosition);
        }
    }
    /*
     * Reset original layer selection
     */
    var baseLayers;
    if (CA.figureOptions.baseLayerPreset) {
        baseLayers = [];
        for (i=0, count = CA.figureOptions.baseLayerPreset.length; i < count; i++) {
            baseLayers.push(CA.getLayerById(CA.figureOptions.baseLayerPreset[i]));
        }
    }
    else {
        baseLayers = CA.baseLayers;
    }
    for (i = 0, count = baseLayers.length; i < count && i < 2; i++) {
        currentLayer = CA.settings['currentLayer' + (i + 1)];
        // turn off current layer
        CA.toggleLayer(currentLayer);
        // turn on new
        CA.toggleLayer(baseLayers[i]);
        // upkeep state
        CA.settings['currentLayer' + (i + 1)] = baseLayers[i];
        // update layer selector ui
        if (CA.ui['layerSelector' + (i + 1)]) {
            CA.ui['layerSelector'+ (i + 1)].find('span').html(baseLayers[i].title);
        }
    }
    // if more than one layer, restore transparency setting
    if (baseLayers.length > 1 && CA.ui.slider) {
        $('#'+CA.settings.currentLayer2.id).css('opacity', CA.ui.slider.slider('value') / 100);
        if (CA.ui.viewfinderLayer2) {
            CA.ui.viewfinderLayer2.css('opacity', CA.ui.slider.slider('value') / 100);
        }
    }

    // reset annotation layer visibility
    CA.showAnnotationPresets();  
};


ConservationAsset.prototype.refreshViewfinder = function() {
	var $ = this.$;
	var CA = this;
	// first clear out any contents
	this.ui.viewfinder.empty();
	
	// get image urls from current layers
	var thumbUrl1 = this.settings.currentLayer1.thumb;
	this.ui.viewfinderLayer1 = $('<div class="ca-ui-viewfinderLayer viewfinderLayer1"></div>');
	$('<img />').attr('src', thumbUrl1).appendTo(this.ui.viewfinderLayer1);
	this.ui.viewfinder.append(this.ui.viewfinderLayer1);
	
	if (this.settings.currentLayer2) {
		var thumbUrl2 = this.settings.currentLayer2.thumb;
		this.ui.viewfinderLayer2 = $('<div class="ca-ui-viewfinderLayer viewfinderLayer2"></div>');
		$('<img />').attr('src', thumbUrl2).appendTo(this.ui.viewfinderLayer2);
		this.ui.viewfinder.append(this.ui.viewfinderLayer2);
		// set opacity to match 
		this.ui.viewfinderLayer2.css('opacity', this.ui.slider.slider("value") / 100);
	}
	
	// set height based on width and aspect
	var vfWidth = this.ui.viewfinder.width();
	var vfHeight = Math.floor(vfWidth / this.settings.aspect);
	this.ui.viewfinder.height(vfHeight);
	
	// bounds div
    this.refreshViewfinderViewport();
    
    // - hook up drag events so the div can be dragged
	// - when dragged reflect the change on the map
};


ConservationAsset.prototype.refreshViewfinderViewport = function() {
    
    if (this.ui.viewfinder.hasClass('viewfinder-open')) {
        var $ = this.$;
        var vfWidth = this.ui.viewfinder.width();
        var vfHeight = Math.floor(vfWidth / this.settings.aspect);

        // - draw the div and position it
        if (!this.ui.viewfinderViewport) {
            this.ui.viewfinderViewport = $('<div class="ca-ui-viewfinder-viewport">&nbsp;</div>').appendTo(this.ui.viewfinder);

            if (this.settings.viewPortBorderWidth == undefined) {
                this.settings.viewPortBorderWidth = parseInt(this.ui.viewfinderViewport.css("border-left-width"), 10);
            }
        }

        // calculate inset percentage on all sides
        var pointSW = this.map.locationPoint(this.settings.containerFitSW);
        var pointNE = this.map.locationPoint(this.settings.containerFitNE);

        //calculate the top left offsets
        var offsetX = (((pointSW.x * -1.0) / (pointNE.x - pointSW.x)) * vfWidth) - this.settings.viewPortBorderWidth;
        var offsetY = (((pointNE.y * -1.0) / (pointSW.y - pointNE.y)) * vfHeight) - this.settings.viewPortBorderWidth;

        // calculate the height and width of the viewport
        var ratioX = this.map.size().x / (pointNE.x - pointSW.x);
        var ratioY = this.map.size().y / (pointSW.y - pointNE.y);
        
        var vpWidth = ratioX * vfWidth;
        var vpHeight = ratioY * vfHeight;

        this.ui.viewfinderViewport.css({
            top : offsetY + "px",
            left : offsetX + "px",
            width : vpWidth + "px",
            height : vpHeight + "px"
        });
    }
};


ConservationAsset.prototype.refreshViewfinderOpacity = function(opacity) {
	if (this.ui.viewfinderLayer2) {
		this.ui.viewfinderLayer2.css('opacity', opacity);
	}
};


ConservationAsset.prototype.fullscreen = function(reset) {
    var $ = this.$;
    var CA = this;

    // create a parent container that spans the full screen
    var modal = $('<div class="ca-ui-fullscreen-modal"></div>').appendTo(document.body);;
    // if the modal background is clicked, close the fullscreen mode
    modal.bind('click', function(event) {
    	if ($(event.target).hasClass('ca-ui-fullscreen-modal')) {
    		$(this).find('.ca-ui-fullscreen').trigger('click');
    	}
    });
    var wrapper = $('<div class="ca-ui-fullscreen-wrap"></div>').appendTo(modal),
        modalOffset = modal.offset(),
        modalHeight = modal.height() - modalOffset.top,
        modalWidth = modal.outerWidth() - modalOffset.left;

    wrapper.css({
    	height: Math.round(modalHeight * 0.9) + 'px',
    	top:	Math.round(modalHeight * 0.05) + 'px',
    	width:	Math.round(modalWidth * 0.9) + 'px',
    	left: 	Math.round(modalWidth * 0.05) + 'px'
    });
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
    var extents = this.map.extent();
    this.figureOptions.fullscreenExtents = {
    	swLon: extents[0].lon, 
    	swLat: extents[0].lat, 
    	neLon: extents[1].lon, 
    	neLat: extents[1].lat 
    }
    
    var figureWrapper = $('<figure></figure>')
        .attr('data-options', JSON.stringify(this.figureOptions))
        .css({
            height : Math.round(modalHeight * 0.9) + 'px',
            width : Math.round(modalWidth * 0.9) + 'px'
        })
        .appendTo(wrapper);
    
    // if a caption is present in the figure options, append it to the fullscreen
    var captionHeight = 0;
    if (this.settings.captionMarkup) {
    	figureWrapper.append(this.settings.captionMarkup);
        captionHeight = this.settings.captionMarkup.outerHeight(true);
    }
    
    $('<div>', {
        'class' : 'figureContent',
        css : {
            'height' : (Math.round(modalHeight * 0.9) - captionHeight) + 'px',
            'width' : Math.round(modalWidth * 0.9) + 'px'
        }
    })
    .append(markup)
    .prependTo(figureWrapper);
    
    var tempCA = new ConservationAsset(markup);
    
    if (reset) {
        tempCA.reset();
    }
};

//resize the control bar so no wrapping occurs
ConservationAsset.prototype.resizeControlBar = function()
{
    var containerWidth = this.container.outerWidth(),
        controlBarWidth = this.ui.controlbar.outerWidth(),
        maxWidth = containerWidth - (parseInt(this.ui.controlbar.css('right'), 10) * 2);
        
    //if controlbar is wider than asset width resize it
    if (controlBarWidth > maxWidth) {
//        var staticWidths = this.ui.annotation.outerWidth(true) + this.ui.fullscreen.outerWidth(true) + this.ui.reset.outerWidth(true),
//            adjustableWidth = maxWidth - staticWidths;
            
        this.ui.controlbar.css({
            'max-width' : maxWidth + 'px'
        });
        
        //shrink layer names (only works nicely if a min-width set in css & overflow ellipsis)
        //this might need redone later depending on browser support and custom styles
        this.ui.controlbar.find('.ca-ui-layer > span').css({
            width: '1px'
        });
    }
    
};

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
        //var elWidth = layerSelector.outerWidth();
        //var totalWidth = layerSelector.offsetParent().parent().width();
        var totalHeight = layerSelector.offsetParent().parent().height();
        //var right = totalWidth - parentOffset.left - elOffset.left - elWidth;
        var left = parentOffset.left + elOffset.left;
        var bottom = totalHeight - parentOffset.top - elOffset.top;

        // create a layer list, not including the current selected layer
        var layerList = $('<ul></ul>');
        var numLayers = 0;
        for (var i=0, count = CA.baseLayers.length; i < count; i++) {
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
                    CA.container.attr('data-controls-lock', 'false');
                }).appendTo(layerList);
            }
        }

        // create the popup
        CA.ui[layerSelectorPopup] = $('<div class="ca-ui-layer-selector-popup"></div>')
        .css({
            left: left, 
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
};


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
        for (var i=0, count = this.annotationLayers.length; i < count; i++) {
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
                    	var bgColor = layerData.color || '#fff';
                        layerItemBox.css('background-color', '#' + bgColor);
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
};


ConservationAsset.prototype.resetZoomRange = function(zoomMin) {
    // set the zoom range
    zoomMin = zoomMin || 0;
    var zoomMax = 0;
    for (var i=0, count = this.layers.length; i < count; i++) {
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
    , i, count;
	
    // grab the layers out of the dom
    var map = this.container.find('svg.map');
    var layers = map.find('g.layer').remove();
	
    // sort the layers
    // find the first layer
    for (i=0, count = layers.length; i < count; i++) {
        if ($(layers[i]).attr('id') == this.settings.currentLayer1.id) {
            map.append(layers[i]);
            layers.splice(i,1);
        }
    }
    // find the second layer
    for (i=0, count = layers.length; i < count; i++) {
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

//move the legend so it does not overlap any other controls
ConservationAsset.prototype.positionLegend = function()
{
    if (this.ui.legendItemsCount) 
    {
        var viewfinderHeight = parseInt(this.ui.viewfinder.outerHeight(), 10),
            viewfinderTop = parseInt(this.ui.viewfinder.css('top'), 10);

        this.ui.legend.css({
            top : (viewfinderTop + viewfinderHeight + 4) + 'px'
        });
    }
};


ConservationAsset.prototype.addLegendItem = function(layerData) {
    var $ = this.$;
    
    // only show if there is color data
    if (!layerData.color || layerData.color == '') {
    	return;
    }
    
    // if the legend does not exist yet, create it here
    if (!this.ui.legend) {
        // legend control
        this.ui.legend = $('<div class="ca-ui-legend"><ul class="legendList"></ul></div>')
        .appendTo(this.container);
        if (this.container.attr('data-controls') != 'true') {
        	this.ui.legend.css('display', 'none');
        }
        this.ui.controls.push(this.ui.legend);
    }
    
    var legendList = this.ui.legend.find('ul');
    
    var legendItem = $('<li data-layer_num="'+layerData.layer_num+'">'+layerData.title+'</li>')
    .appendTo(legendList);
    
    var itemBox = $('<div class="item-box"></div>')
    	.css('background-color', '#'+layerData.color)
    	.appendTo(legendItem);
    
    this.ui.legendItemsCount++;
    
    this.positionLegend();
};


ConservationAsset.prototype.removeLegendItem = function(layerData) {
    var $ = this.$;
    var CA = this;
    
    if (this.ui.legend) {
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
            for (var i=0, count = this.ui.controls.length; i < count; i++) {
                if ($(this.ui.controls[i]).hasClass('ca-ui-legend')) {
                    this.ui.controls.splice(i, 1);
                }
            }
        }
    }
};

// toggle on any annotation layer that's configured from the figure options 
ConservationAsset.prototype.showAnnotationPresets = function() {
    for (var j=0, layerCount = this.annotationLayers.length; j < layerCount; j++) {
        this.removeLayer(this.annotationLayers[j]);
        this.removeLegendItem(this.annotationLayers[j]);
        
        if (this.figureOptions.annotationPreset) {
            // each preset is a layer_id for a layer in this.layers
            for (var i=0, count = this.figureOptions.annotationPreset.length; i < count; i++) {
                var presetLayerId = this.figureOptions.annotationPreset[i];
                if (this.annotationLayers[j].layer_id == presetLayerId) {
                    this.repaintLayer(this.annotationLayers[j]);
                    
                    if (this.figureOptions.annotation || this.figureOptions.editing) {
        				this.addLegendItem(this.annotationLayers[j]);
    				}
                    break;
                }
            }
        }
    }
}

ConservationAsset.prototype.getVisibleBaseLayers = function() {
	var i, count,
		layers = [];
	
	for (i=0, count = this.baseLayers.length; i< count; i++) {
		var layerData = this.baseLayers[i];
		if (layerData.visible) {
			layers.push(layerData);
		}
	}
	
	return layers;
}

ConservationAsset.prototype.getVisibleBaseLayerIds = function() {
	var i, count,
		layers = [];
	
	for (i=0, count = this.baseLayers.length; i< count; i++) {
		var layerData = this.baseLayers[i];
		if (layerData.visible) {
			layers.push(layerData.layer_id);
		}
	}
	
	return layers;
}


ConservationAsset.prototype.getVisibleAnnotationIds = function() {
	var i, count,
		annotations = [];
	
	for (i=0, count = this.annotationLayers.length; i < count; i++) {
		var layerData = this.annotationLayers[i];
		if (layerData.visible) {
			annotations.push(layerData.layer_id);
		}
	}
	
	return annotations;
}


ConservationAsset.prototype.getExtents = function() {
	var extents = this.map.extent();
	return { 
		swLon: extents[0].lon, 
	    swLat: extents[0].lat, 
	    neLon: extents[1].lon, 
	    neLat: extents[1].lat 
	};
}


ConservationAsset.prototype.setExtents = function(extents) {
	this.map.extent(extents);
	// update zoom slider
	if (this.ui.zoomSlider) {
		this.ui.zoomSlider.slider('value', this.map.zoom());
	}
}


ConservationAsset.prototype.getSliderPosition = function() {
	if (typeof this.ui.slider != 'undefined') {
		return this.ui.slider.slider('value');
	}
	else {
		return 0;
	}
}


ConservationAsset.prototype.getLayerById = function(id) {
	for (var i=0, count = this.layers.length; i < count; i++) {
		if (this.layers[i].layer_id && this.layers[i].layer_id == id) {
			return this.layers[i];
		}
	}
	return false;
}

function outerHTML(node){
	// if IE, Chrome take the internal method otherwise build one
	return node.outerHTML || (
		function(n){
			var div = document.createElement('div'), h;
			div.appendChild( n.cloneNode(true) );
			h = div.innerHTML;
			div = null;
			return h;
		})(node);
}

window.caCollection = new CACollection();

// auto load any conservation assets 
window.addEventListener('load', function() {
    var assets = jQuery('.conservation-asset').not('.noload');
    for(var i=0, count = assets.length; i < count; i++) {
        new ConservationAsset(assets[i]);
    }
}, false);

// update the viewfinder if an asset is being dragged
function conservationMousemove(e) {
    if (window.caCollection && caCollection.userIsDraggingAsset) {
        var asset = caCollection.find(caCollection.userIsDraggingAsset);

        if (asset) {
            if (!asset.settings.dragging) {
                return;
            }

            asset.refreshViewfinderViewport();

            if (e.conservationDraggingRemove) {
                asset.settings.dragging = undefined;
                caCollection.userIsDraggingAsset = false;
            }
        }
    }
}

// update the viewfinder and remove the dragging flag when done dragging
function conservationMouseup(e) {
    if (window.caCollection && caCollection.userIsDraggingAsset) {
        e.conservationDraggingRemove = true;
        conservationMousemove(e);
    }
}

// bind the mouse events for asset dragging and viewfinder updating
window.addEventListener("mousemove", conservationMousemove, false);
window.addEventListener("mouseup", conservationMouseup, false);