function iipmap (div) { // div should be a jQuery object of our map div element
	
	/*
	 * Prerequisites
	 */
	
	// We need jQuery magic
	if ($ === undefined) {
		if (jQuery === undefined) {
			alert("IIP - requires jQuery");
			return false;
		}
		// jQuery is in no conflict mode - get our dollars back!
		$ = jQuery;
	}
	
	// We need Polymaps
	if (org.polymaps) {
		po = org.polymaps;
		
		// extend Polymaps with our svgLayer
		po.svgLayer = function(svgPath) {
			var svgLayer = po.layer(load, unload);
			svgLayer.tile(false);
			function load(tile) {
				var scale = Math.pow(2, (zoom_max - 1) - tile.zoom);
				tile.element = po.svg('image');
				tile.element.setAttribute("preserveAspectRatio", "none");
				tile.element.setAttribute("x", 0);
				tile.element.setAttribute("y", 0);
				tile.element.setAttribute("width", image_w / scale);
				tile.element.setAttribute("height", image_h / scale);
				tile.element.setAttributeNS("http://www.w3.org/1999/xlink", "href", svgPath);
			    tile.ready = true;
			}
			
			function unload(tile) {
				if (tile.request) tile.request.abort(true);
			}
			
			return svgLayer;
		};
	}
	else {
		alert("IIP - requires Polymaps");
		return false;
	}
	
	// Ensure we have something to work on
	if (div.length < 1) {
		alert("IIP - Passed element not valid");
		return false;
	}
	
	// Extract our class variables from the div data attrs	
	var zoom_max = div.attr('data-zlm');
	var node = div.attr('data-node');
	var collapsed = div.attr('data-collapsed');
	var figure_id = div.attr('data-figure-id');
	var ptiff = div.attr('data-ptiff');
	var image_h = div.attr('data-ih');
	var image_w = div.attr('data-iw');
	var center_lat = div.attr('data-center-lat');
	var center_lon = div.attr('data-center-lon');
	var svg_path = div.attr('data-svg');
	var ptiff_overlay = div.attr('data-overlay');
	var editing = div.attr('data-editing');
	var options = $.parseJSON(div.parents('figure:first').attr('data-options'));
	// set up some sensible defaults if the figure didn't provide any options
	if (!options) {
		options = {interaction: true, annotation: true};
	}
	var tile_size = 256;
	var overlay_opacity = '0';

	
	
	/*
	 * Layer Creation and Calculations
	 */
	
	// Calculate best zoom level to start at based on div parent's size.
	var parent_w = parseInt(div.parent().css('width'));
	var parent_h = parseInt(div.parent().css('height'));
	var th = parent_h / tile_size; // tiles high
	var tw = parent_w / tile_size; // tiles wide
	var zoom_level_h = custLog((image_h / parent_h), 2);
	var zoom_level_w = custLog((image_w / parent_w), 2);
	if(!zoom_level) {
		if (zoom_level_h >= zoom_level_w) {
			var zoom_level = zoom_max - zoom_level_h -1;
			var scale = (parent_h / image_h);
		}
		else {
			var zoom_level = zoom_max - zoom_level_w -1;
			var scale = (parent_w / image_w);
		}
	}
	
	// Create map
	var map = po.map();
	var svg = po.svg('svg');
	map.container(div[0].appendChild(svg));
	// map.tileSize({x: 256, y: 256});
	map.zoomRange([zoom_level, zoom_max-1]);
	map.zoom(zoom_level);

	// Set the map extents to our image
	reset_map();
	
	// Save our original center for later use (reset)
	var orig_center = map.center();
	
	// Load in our image and define the tile loader for it
	var image = po.image();
	var tl = 'tile_loader_'+figure_id+' = function (c) { var iipsrv = "http://stanley.imamuseum.org/fcgi-bin/iipsrv.fcgi"; var ptiff = "'+ptiff+'"; var image_h = '+image_h+'; var image_w = '+image_w+'; var zoom_max = '+zoom_max+' - 1; var tile_size = 256; var scale = Math.pow(2, zoom_max - c.zoom); var mw = Math.round(image_w / scale); var mh = Math.round(image_h / scale); var tw = Math.ceil(mw / tile_size); var th = Math.ceil(mh / tile_size); if (c.row < 0 || c.row >= th || c.column < 0 || c.column >= tw) return "http://stanley.imamuseum.org/osci/sites/default/modules/osci/images/null.png"; if (c.row == (th - 1)) { c.element.setAttribute("height", mh % tile_size);} if (c.column == (tw - 1)) { c.element.setAttribute("width", mw % tile_size);} return iipsrv+"?fif="+ptiff+"&jtl="+c.zoom+","+((c.row * tw) + c.column);}';			
	eval(tl);
	image.url(window['tile_loader_'+figure_id]);
	image.id('image');
	map.add(image);
	
	// If we have an overlay image, layer it above the original image
	// and make it transparent
	if (ptiff_overlay) {
		var overlay = po.image();
		var tlo = 'tile_loader_'+figure_id+'_overlay = function (c) { var iipsrv = "http://stanley.imamuseum.org/fcgi-bin/iipsrv.fcgi"; var ptiff = "'+ptiff_overlay+'"; var image_h = '+image_h+'; var image_w = '+image_w+'; var zoom_max = '+zoom_max+' - 1; var tile_size = 256; var scale = Math.pow(2, zoom_max - c.zoom); var mw = Math.round(image_w / scale); var mh = Math.round(image_h / scale); var tw = Math.ceil(mw / tile_size); var th = Math.ceil(mh / tile_size); if (c.row < 0 || c.row >= th || c.column < 0 || c.column >= tw) return "http://stanley.imamuseum.org/osci/sites/default/modules/osci/images/null.png"; if (c.row == (th - 1)) { c.element.setAttribute("height", mh % tile_size);} if (c.column == (tw - 1)) { c.element.setAttribute("width", mw % tile_size);} return iipsrv+"?fif="+ptiff+"&jtl="+c.zoom+","+((c.row * tw) + c.column);}';			
		eval(tlo);
		overlay.url(window['tile_loader_'+figure_id+'_overlay']);
		overlay.id('overlay_'+figure_id);
		map.add(overlay);
	}
	
	// if we have SVG annotations for this figure, add the layer
    if (svg_path && options.annotation) {
    	var annotations = po.svgLayer(svg_path);
    	annotations.id('annotations_'+figure_id);
        map.add(annotations);
    }


	
	/* 
	 * Controls
	 */
	
	// If editing, force controls to be on
	if (editing) {
		options.interaction = true;
		options.annotation = true;
	}
	if (options.interaction == true) {
		// enable interaction on the map
		map.add(po.interact());
		
		// create the control bar shell
		var controlBarContainer = $('<div>')
			.attr('class', 'iip_control_bar_container')
			.css('position', 'absolute')
			.css('bottom', '0px')
			.css('height', '0px')
			.css('width', '100%') 
			.css('text-align', 'center');
		
		// create the control bar
		var controlBar = $('<div>')
			.attr('class', 'iip_control_bar')
			.css('display', 'inline-block')
			.css('background-color', '#000')
			.css('opacity', '0.75')
			.css('border-top-left-radius', '5px')
			.css('border-top-right-radius', '5px');
		
		// create the zoom controls
		var zoomControlPlus = $('<div>')
			.attr('class', 'iip_control_bar_zoom iip_control_bar_zoom_plus')
			.css('background-image', "url('"+Drupal.settings.baseUrl+"sites/default/modules/osci/images/icon-imagetoolbar-plus.png')")
			.css('background-repeat', 'no-repeat')
			.css('width', '32px')
			.css('height', '32px')
			.css('margin', '5px 0px 5px 5px')
			.css('float', 'left')
			.html('&nbsp;')
			.mousedown(function(e) {
				// prevent highlight-all on double click
				e.preventDefault();
				// set the zoom level to the next whole number zoom level
				// this prevents "stitching" of tiles in current browsers
				var currentZoom = map.zoom();
				var nextWholeZoom = Math.floor(currentZoom) + 1;
				map.zoom(nextWholeZoom);
			})
			.appendTo(controlBar);
		var zoomControlMinus = $('<div>')
			.attr('class', 'iip_control_bar_zoom iip_control_bar_zoom_minus')
			.css('background-image', "url('"+Drupal.settings.baseUrl+"sites/default/modules/osci/images/icon-imagetoolbar-minus.png')")
			.css('background-repeat', 'no-repeat')
			.css('width', '32px')
			.css('height', '32px')
			.css('margin', '5px 0px 5px 5px')
			.css('float', 'left')
			.html('&nbsp;')
			.mousedown(function(e) {
				// prevent highlight-all on double click
				e.preventDefault();
				// set the zoom level to the next lower whole number.
				// this prevents "stitching" of tiles in current browsers
				var currentZoom = map.zoom();
				var nextWholeZoom = Math.ceil(currentZoom) - 1
				map.zoom(nextWholeZoom);
			})
			.appendTo(controlBar);
		
		// reset control
		var zoomControlReset = $('<div>')
			.attr('class', 'iip_control_bar_zoom iip_control_bar_zoom_reset')
			.css('background-image', "url('"+Drupal.settings.baseUrl+"sites/default/modules/osci/images/icon-imagetoolbar-reset.png')")
			.css('background-repeat', 'no-repeat')
			.css('width', '32px')
			.css('height', '32px')
			.css('margin', '5px 0px 5px 5px')
			.css('float', 'left')
			.html('&nbsp;')
			.mousedown(function(e) {
				// prevent highlight-all on double click
				e.preventDefault();
				reset_map();
			})
			.appendTo(controlBar);
		
		// Add the annotation toggle
		if (svg_path && options.annotation) {
			// create the annotation toggle button
			var annotationControl = $('<div>')
				.attr('class', 'iip_control_bar_annotation iip_control_bar_annotation_toggle')
				.css('background-image', "url('"+Drupal.settings.baseUrl+"sites/default/modules/osci/images/icon-imagetoolbar-toggle.png')")
				.css('background-repeat', 'no-repeat')
				.css('width', '32px')
				.css('height', '32px')
				.css('margin', '5px 0px 5px 5px')
				.css('float', 'left')
				.html('&nbsp;')
				.mousedown(function(e) {
					e.preventDefault();
					// find the current state of annotation opacity and reverse it
					var annotationsLayer = $('#annotations_'+figure_id, div);
					var opacity = annotationsLayer.css('opacity');
					if (opacity == 1) {
						annotationsLayer.animate({opacity: 0}, 250);
					}
					else {
						annotationsLayer.animate({opacity: 1}, 250);
					}
				})
				.appendTo(controlBar);
		}
		
		// Add the overlay controls to the controlBar
		if (ptiff_overlay) {
			// separator
			var separator = $('<div>')
			.attr('class', 'iip_control_bar_separator')
			.css('background-image', "url('"+Drupal.settings.baseUrl+"sites/default/modules/osci/images/imagetoolbar-divider.png')")
			.css('background-repeat', 'no-repeat')
			.css('width', '3px')
			.css('height', '28px')
			.css('margin', '7px 0px 5px 10px')
			.css('float', 'left')
			.html('&nbsp;')
			.appendTo(controlBar);
			
			// create a slider control
			// set width to 10% of the controlBarContainer width
			var sliderWidth = parseInt((div.width() * 0.2)) + "px";
			var sliderControl = $('<div>')
				.attr('class', 'iip_control_bar_slider')
				.css('float', 'left')
				.css('margin', '13px 5px 13px 15px')
				.css('width', sliderWidth)
				.slider({max: 100})
				.appendTo(controlBar);
			// set the margin on the handle to negative half it's size
			// prevents stylesheets from messing it up
			// push it onto the top of the UI stack to give jquery time to configure it first.
			var handle = sliderControl.slider('widget').find('.ui-slider-handle');
			setTimeout(function() {
				var leftMargin = (handle.width() / 2);
				handle.css('margin-left', -leftMargin);
			}, 1);
			// wire up the slider
			sliderControl.bind('slide', function(event, ui) {
				overlay_opacity = (ui.value / 100);
				$('#overlay_'+figure_id, div).attr('opacity' , overlay_opacity);
			});
			$('#overlay_'+figure_id, div).attr('opacity', overlay_opacity);
			
			// another separator
			var separator2 = separator.clone();
			separator2
				.css('margin', '7px 5px 0px 10px')
				.appendTo(controlBar);
		}
		
		// fullscreen button
		// last control - place a margin on the end
		var zoomControlFullscreen = $('<div>')
			.attr('class', 'iip_control_bar_fullscreen')
			.css('background-repeat', 'no-repeat')
			.css('width', '32px')
			.css('height', '32px')
			.css('margin', '5px 5px 5px 5px')
			.css('float', 'left')
			.html('&nbsp;');
		if (collapsed) {
			zoomControlFullscreen
			.css('background-image', "url('"+Drupal.settings.baseUrl+"sites/default/modules/osci/images/icon-imagetoolbar-fullscreen.png')")
			.mousedown(function(e) {
				e.preventDefault();
				make_fullscreen();
			});
		}
		else {
			zoomControlFullscreen
			.css('background-image', "url('"+Drupal.settings.baseUrl+"sites/default/modules/osci/images/icon-imagetoolbar-fullscreenclose.png')")
			.mousedown(function(e) {
				e.preventDefault();
				make_small();
			});
		}
		zoomControlFullscreen.appendTo(controlBar);
		
		// finally, append the built controlBar to the div
		controlBar.appendTo(controlBarContainer);
		controlBarContainer.appendTo(div);
		
		// now that the control bar has been added to the DOM, the control button
		// images have been loaded.  It's now safe to hide the controlBarContainer
		controlBarContainer.css('display', 'none');
	}
	
	// Set up our control visibility toggles for mouse events
	div.mouseenter(function(e) {
		// Show controls
		show_controls();
	});
	// add an event for mobile safari
	div.bind('touchend', function() {
		show_controls();
	});
	div.mouseleave(function(e) {
		// Hide controls
		hide_controls();
	});
	
	
	/*
	 * Utility functions
	 */
	
	function show_controls() {
		if (options.interaction == true ) {
			controlBarContainer.css('display', 'block');
			controlBarContainer.animate({height: '42px'}, 200);
		}
	}
	
	function hide_controls() {
		if (options.interaction == true ) {
			controlBarContainer.animate({height: '0px'}, 200, function() {
				controlBarContainer.css('display', 'none');
			});
		}
	}
	
	function make_fullscreen() {
		
		var fs_wrap = $('<div id="fs_wrap" />')
			.css('position', 'absolute')
			.css('top', '0px')
			.css('left', '0px')
			.css('width', '100%')
			.css('height', '100%')
			.css('background-color', 'rgba(0,0,0,0.8)')
            .css('z-index', '9999');

		var new_figure = $('<figure>')
			.attr('data-options', JSON.stringify(options))
			.css('margin', '0')
			.css('height', '100%')
			.css('width', '100%')
			.appendTo(fs_wrap);
		
		var new_div = $('<div id="iip_fullscreen" class="iipmap" />')
			.css('position', 'relative')
			.css('margin', 'auto')
			.css('top', '5%')
			.css('width', '95%')
			.css('height', '90%')
			// append attributes for the image
			.attr('data-zlm', zoom_max)
			.attr('data-node', node)
			.attr('data-figure-id', figure_id)
			.attr('data-ptiff', ptiff)
			.attr('data-ih', image_h)
			.attr('data-iw', image_w)
			.attr('data-center-lat', orig_center.lat)
			.attr('data-center-lon', orig_center.lon)
			.attr('data-svg', svg_path)
			.attr('data-overlay', ptiff_overlay)
			.appendTo(new_figure);
		
		// now that we're done with the manipulation, add it to the DOM 
		fs_wrap.appendTo('body');
		// create the new polymap
		iipmap(new_div);
		
	}
    // bind the our make_fullscreen() to an event on the figure.
    // this provides a way to trigger it from outside this js.
    var figure = div.parents('figure:first');
    figure.bind('osci_figure_fullscreen', make_fullscreen);
	
	function make_small() {
		var iipFullscreen = $('#fs_wrap');
		iipFullscreen.animate({opacity: 0}, 500, function() {
			iipFullscreen.remove();
		});
	}
	
	function reset_map() { 
		// Set visible window so that full image fits inside and doesn't overflow
		// If we have a center value set, let's use it, else calculate
		// best center based on coordinates of our image tiles.
		
		
		// honor inset data
		if (options && options.swLat) {
			map.extent([{lat: options.swLat, lon: options.swLon}, {lat: options.neLat, lon: options.neLon}]);
		}
		// only used for make_fullscreen to retain center
		else if (center_lat && center_lon) { 
			map.center({lat: parseFloat(center_lat), lon: parseFloat(center_lon)});
			map.zoom(zoom_level);
		}
		else {
			// map extents are to be given as SW corner, NE corner
			// fit the whole image
			map.extent([map.coordinateLocation({zoom: zoom_level, column: 0, row: th}), map.coordinateLocation({zoom: zoom_level, column: tw, row: 0})]);
		}
	}
	
	function custLog(x,base) {
		return (Math.log(x))/(Math.log(base));
	}
	
	function getMap(e) {
		if ($.isFunction(e.callback)){
			e.callback(map);
		}
	}
	div.bind('get_map', getMap);
	
	function restoreDefault(e) {
		// map.extent([map.coordinateLocation({zoom: zoom_level, column: 0, row: th}), map.coordinateLocation({zoom: zoom_level, column: tw, row: 0})]);
		reset_map();
	}
	div.bind('restore_default_map', restoreDefault);
}


/*
 * Build IIP maps on layout complete
 */

(function($) {
	$(document).bind("osci_layout_complete", function()
	{
	    $("#osci_viewer").find('div.iipmap').each(function(){ iipmap($(this)); });	
	});	

}) (jQuery);
