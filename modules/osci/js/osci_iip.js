function iipmap (div) { // div should be a jQuery object of our map div element
	
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
	var tile_size = 256;
	
	
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
		}
		else {
			var zoom_level = zoom_max - zoom_level_w -1;
		}
	}
	
	// Create map
	var map = po.map();
	var svg = po.svg('svg');
	map.container(div[0].appendChild(svg));
	// map.tileSize({x: 256, y: 256});
	map.zoomRange([0, zoom_max]);
	map.zoom(zoom_level);

	// Set the map extents to our image
	reset_map();
	
	// Save our original center for later use (reset)
	var orig_center = map.center();
	
	// Load in our image and define the tile loader for it
	var image = po.image();
	var tl = 'tile_loader_'+figure_id+' = function (c) { var iipsrv = "http://stanley.imamuseum.org/fcgi-bin/iipsrv.fcgi"; var ptiff = "'+ptiff+'"; var image_h = '+image_h+'; var image_w = '+image_w+'; var zoom_max = '+zoom_max+' - 1; var tile_size = 256; var scale = Math.pow(2, zoom_max - c.zoom); var mw = Math.round(image_w / scale); var mh = Math.round(image_h / scale); var tw = Math.ceil(mw / tile_size); var th = Math.ceil(mh / tile_size); if (c.row < 0 || c.row >= th || c.column < 0 || c.column >= tw) return; if (c.row == (th - 1)) { c.element.setAttribute("height", mh % tile_size);} if (c.column == (tw - 1)) { c.element.setAttribute("width", mw % tile_size);} return iipsrv+"?fif="+ptiff+"&jtl="+c.zoom+","+((c.row * tw) + c.column);}';			
	eval(tl);
	image.url(window['tile_loader_'+figure_id]);
	map.add(image);
	
	// Controls and functionality
	var nmap = n$(div[0]); // the map container ran through the nns js library for svg manipulation
	map.add(po.interact());
	var compass = po.compass().pan('none');
	map.add(compass);
	// hide it in initial view
	$('#map_'+figure_id+' g.compass').css("visibility", "hidden");
	
	// Add reset button
	var reset_btn = nmap.add("svg:svg")
		.attr("width", 40)
		.attr("height", 15)
		.attr("class", "reset-button")
		.style("position","absolute")
		.style("left","16px")
		.style("top","65px")
		.style("visibility","hidden")
		.on("mousedown",reset_map);
	reset_btn.add("svg:rect")
		.attr("width", "100%")
		.attr("height", "100%")
		.style("fill", "rgb(0,0,0)");
	reset_btn.add("svg:text")
		.attr("x", "4")
		.attr("y", "10")
		.attr("font-size", 9)
		.attr("font-family", "Arial, Arial, Helvetica, sans-serif")
		.attr("fill", "white")
		.attr("pointer-events","none")
		.text("RESET");	
	
	// If collapsed, add a expand button to go fullscreen
	if (collapsed) {
		var fs = nmap.add("svg:svg")
			.attr("width",32)
			.attr("height",32)
			.attr("class", "fullscreen")
			.style("position","absolute")
			.style("right","5px")
			.style("top","5px")
			.style("visibility","hidden")
			.on("mousedown",make_fullscreen);
		var circle = fs.add("svg:circle")
			.attr("cx",16)
			.attr("cy",16)
			.attr("r",14)
			.attr("fill","#000")
			.attr("stroke","#ccc")
			.attr("stroke-width",4)
			.add("svg:title")
			.text("Toggle fullscreen.");
		var arrow = fs.add("svg:path")
			.attr("transform","translate(16,16)rotate(-45)scale(5)translate(-1.85,0)")
			.attr("d","M0,0L0,.5 2,.5 2,1.5 4,0 2,-1.5 2,-.5 0,-.5Z")
			.attr("pointer-events","none")
			.attr("fill","#aaa")
			.attr("class", "svg_arrow");
	}
	// Else add the downsize (destroy) button
	else {
		var fs = nmap.add("svg:svg")
			.attr("width",32)
			.attr("height",32)
			.attr("class", "fullscreen")
			.style("position","absolute")
			.style("right","5px")
			.style("top","5px")
			.style("visibility","hidden")
			.on("mousedown",make_small);
		var circle = fs.add("svg:circle")
			.attr("cx",16)
			.attr("cy",16)
			.attr("r",14)
			.attr("fill","#000")
			.attr("stroke","#ccc")
			.attr("stroke-width",4)
			.add("svg:title")
			.text("Toggle fullscreen.");
		var arrow = fs.add("svg:path")
			.attr("transform","translate(16,16)rotate(135)scale(5)translate(-1.85,0)")
			.attr("d","M0,0L0,.5 2,.5 2,1.5 4,0 2,-1.5 2,-.5 0,-.5Z")
			.attr("pointer-events","none")
			.attr("fill","#aaa")
			.attr("class", "svg_arrow");
	}
	
	// Set up our control visibility toggles for mouse events
	div.mouseover(function() {
		// Show controls
		$('g.compass', div).css("visibility", "visible");
		reset_btn.style("visibility", "visible");
		fs.style("visibility", "visible");
	
	});
	
	div.mouseout(function() {
		// Hide controls
		$('g.compass', div).css("visibility", "hidden");
		reset_btn.style("visibility", "hidden");
		fs.style("visibility", "hidden");
	});
	
	// Load in svg markup
	
	if (svg_path) {
		// console.log(['svg_path: ', svg_path]);
		var geojson = { type: 'GeometryCollection', geometries: new Array(), };
		$.get(svg_path, function(data){
			var markup_svg = n$(data.childNodes[1]);
			var markup_elements = markup_svg.element.children;  
			$(markup_elements).each( function(index, elem) {
				var path_string = $(this).attr('d');
				var coords = parseSVG(path_string);
				var geometry = new Object;
				geometry.type = "LineString";
				geometry.coordinates = [coords];
				console.log(geometry);
				
				
				
			})
		});
	}
	
	/*
	// Overlay SVG markup
	var p1 = map.coordinateLocation({zoom:7, column:10, row:10});
	var p2 = map.coordinateLocation({zoom:7, column:11, row:11});
	map.add(po.geoJson()
    .features([{
		"geometry": {
			"type": "LineString",
			"coordinates": [ [p1.lon -1.5, p2.lat -.5], [p1.lon -1.5, p2.lat], [p1.lon, p1.lat] ]
		},
	}]));
	*/
	
	
	function make_fullscreen() {
		
		var fs_wrap = $('<div id="fs_wrap" />').appendTo('body');
		fs_wrap.css('position', 'absolute')
			.css('top', '0px')
			.css('left', '0px')
			.css('width', '100%')
			.css('height', '100%')
			.css('background-color', 'rgba(0,0,0,0.8)');

		var newdiv = $('<div id="iip_fullscreen" />').appendTo(fs_wrap);
		newdiv.css('position', 'relative')
		.css('margin', 'auto')
		.css('top', '5%')
		.css('width', '95%')
		.css('height', '90%');
		
		// append attributes for the image
		newdiv.attr('data-zlm', zoom_max)
			.attr('data-node', node)
			.attr('data-figure-id', figure_id)
			.attr('data-ptiff', ptiff)
			.attr('data-ih', image_h)
			.attr('data-iw', image_w)
			.attr('data-center-lat', orig_center.lat)
			.attr('data-center-lon', orig_center.lon);
		iipmap(newdiv);
	
	}
	
	function make_small() {
		$('#iip_fullscreen').parent().remove();
	}
	
	function reset_map() { // Set visible window so that full image fits inside and doesn't overflow
		// If we have a center value set, let's use it, else calculate
		// best center based on coordinates of our image tiles.
		if (center_lat && center_lon) { // primarily used for make_fullscreen to retain center
			map.center({lat: parseFloat(center_lat), lon: parseFloat(center_lon)});
			map.zoom(zoom_level);
		}
		else {
			// map extents are to be given as SW corner, NE corner
			map.extent([map.coordinateLocation({zoom: zoom_level, column: 0, row: th}), map.coordinateLocation({zoom: zoom_level, column: tw, row: 0})]);
		}
	}
	
	function custLog(x,base) {
		return (Math.log(x))/(Math.log(base));
	}
	
	function parseSVG(data) {
		// given an svg path, return an array of coordinates
		var pixels = [];
		var coords = [];
		// We need to adjust the pixel positions according to scale of the current image.
		// This is because Polymaps will only give us the coordinate of a pixel position
		// relative to the upper left corner of the current map.
		var scale = div.width() / image_w;
		// extract all pairs of numbers
		pixels = data.match(/\d+\.?\d+?, ?\d+\.?\d+?/g);
		// step through each pair and translate
		for (i=0; i < pixels.length; i++) {
			var xy = pixels[i].split(",");
			var translated = map.pointLocation({ x: (xy[0] * scale), y: (xy[1] * scale) });
			coords.push(translated);
		}
		return coords;
	}
	
}

(function($) {
	$(document).bind("osci_layout_complete", function()
	{
		$('.iipmap').each(function(){ iipmap($(this)); });	
	});	

}) (jQuery);
