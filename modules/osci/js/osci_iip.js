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
	var zoom_max = div.attr('data-zl');
	var node = div.attr('data-node');
	var collapsed = div.attr('data-collapsed');
	var figure_id = div.attr('data-figure-id');
	var ptiff = div.attr('data-ptiff');
	var image_h = div.attr('data-ih');
	var image_w = div.attr('data-iw');
	var tile_size = 256;
	
	
	// Calculate best zoom level to start at based on div parent's size.
	var parent_w = parseInt(div.parent().css('width'));
	var parent_h = parseInt(div.parent().css('height'));
	var zoom_level = custLog(image_w / parent_w, 2);
	
	console.log(['parent width:', parent_w, 'parent height:', parent_h, 'image width:', image_w, 'image height:', image_h, 'zoom max:', zoom_max, 'zoom level:', zoom_level]);

	
	
	// Create map
	var map = po.map();
	var svg = po.svg('svg');
	map.container(div[0].appendChild(svg));
	// console.log(map.center());
	map.zoomRange([1, zoom_max]);
	map.zoom(zoom_level);
	
	// Center
	var center_pos = {lat:81.25, lon:-136.25};
	// console.log(map.center());
	// map.center(center_pos);

	
	
	
	
	
	
	// Set visible window so that full image fits inside and doesn't overflow
	var th = parent_h / tile_size; // tiles high
	var tw = parent_w / tile_size; // tiles wide
	console.log(['tiles wide:', tw, 'tiles high:', tw]);
	
	// map extents are to be given as SW corner, NE corner
	map.extent([map.coordinateLocation({zoom: zoom_level, column: 0, row: th}), map.coordinateLocation({zoom: zoom_level, column: tw, row: 0})]);
	console.log(map.zoom());
	//console.log([map.coordinateLocation({zoom: zoom_level, column: 0, row: th}), map.coordinateLocation({zoom: zoom_level, column: tw, row: 0})]);
	
	
	
	

	
	
	
	
	
	
	
	// Load in our image and define the tile loader for it
	var image = po.image();
	var tl = 'tile_loader_'+figure_id+' = function (c) { console.log(c); var iipsrv = "http://stanley.imamuseum.org/fcgi-bin/iipsrv.fcgi"; var ptiff = "'+ptiff+'"; var image_h = '+image_h+'; var image_w = '+image_w+'; var zoom_max = '+zoom_max+' - 1; var tile_size = 256; var scale = Math.pow(2, zoom_max - c.zoom); var mw = Math.round(image_w / scale); var mh = Math.round(image_h / scale); var tw = Math.ceil(mw / tile_size); var th = Math.ceil(mh / tile_size); if (c.row < 0 || c.row >= th || c.column < 0 || c.column >= tw) return; if (c.row == (th - 1)) { c.element.setAttribute("height", mh % tile_size);} if (c.column == (tw - 1)) { c.element.setAttribute("width", mw % tile_size);} return iipsrv+"?fif="+ptiff+"&jtl="+c.zoom+","+((c.row * tw) + c.column);}';			
	eval(tl);
	image.url(window['tile_loader_'+figure_id]);
	map.add(image);
	
	// Controls and functionality
	map.add(po.interact());
	map.add(po.compass().pan("none"));
	
	/*
	// Load in svg markup
	var feature_obj = { type: 'FeatureCollection', features: new Array(), };
	$.get("/sites/default/modules/osci/images/gimp-linepaths-test.svg", function(data){
		var markup_svg = n$(data.childNodes[1]);
		var markup_elements = markup_svg.element.children;  
		$(markup_elements).each( function(index, elem) {
			
			
		})
	});
	*/
	
	// Overlay SVG markup
	var p1 = map.coordinateLocation({zoom:7, column:10, row:10});
	var p2 = map.coordinateLocation({zoom:7, column:11, row:11});
	map.add(po.geoJson()
    .features([{
		"geometry": {
			"type": "LineString",
			"coordinates": [ [p1.lon, p1.lat], [p1.lon, p2.lat], [p2.lon, p2.lat], [p2.lon, p1.lat], [p1.lon, p1.lat] ]
		},
	}]));
	
	// if collapsed, add a expand button to go fullscreen
	if (collapsed) {
		var nmap = n$(div[0]);
		var fs = nmap.add("svg:svg")
			.attr("width",32)
			.attr("height",32)
			.attr("class", "fullscreen")
			.style("position","absolute")
			.style("right","5px")
			.style("top","5px")
			.style("visibility","visible")
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
	
	function make_fullscreen() {
		
		// Store center coordinate of map so we are looking at the same thing between resizes
		center_pos = map.center();
	
		// Wrap the original location in a div and embed the old div's style
		// so we know where we came from in make_small()
		// Yes, I know, 'just clone it' you say, but alas, polymaps breaks
		// must grab these values now, they become screwy after the wrapping
		var div_width = div.css('width');
		var div_height = div.css('height');
		var origin = div.wrap('<div id="origin" />').parent();
		origin.css('position', div.css('position'))
			.css('width', div_width)
			.css('height', div_height);
				
		// move the .iipmap div to <body> and position	
		div.css('position', 'relative')
			.css('margin', 'auto')
			.css('width', '95%')
			.css('height', '95%')
			.appendTo('body');
		
		var fs_wrap = div.wrap('<div id="fs_wrap" />').parent();
		fs_wrap.css('position', 'absolute')
			.css('top', '5%')
			.css('width', '100%')
			.css('height', '100%');
		
		// flip the arrow around on the fullscreen toggle southwest
		arrow.attr("transform", "translate(16,16)rotate(135)scale(5)translate(-1.85,0)");
		
		// redefine our mousedown callback
		fs.off("mousedown", make_fullscreen).on("mousedown", make_small);
		map.resize();
		// restore center
		map.center(center_pos);
	
	}
	
	function make_small() {
		// Store center coordinate of map so we are looking at the same thing between resizes
		center_pos = map.center();
		// remove the fs_wrap div wrapper
		div.unwrap();
		// append the div to the origin
		var origin = $("#origin");
		div.appendTo("#origin");
		
		// copy back the css to the div from the origin
		div.css('position', origin.css('position'))
			.css('top', '')
			.css('margin', '')
			.css('width', origin.css('width'))
			.css('height', origin.css('height'));
		
		// unwrap the div, discarding the origin
		div.unwrap();
		
		// flip the fullscreen toggle arrow back to northeast
		arrow.attr("transform", "translate(16,16)rotate(-45)scale(5)translate(-1.85,0)");
		
		// redefine mousedown callback
		fs.off("mousedown", make_small).on("mousedown", make_fullscreen);
		map.resize();
		// restore center
		map.center(center_pos);
	}
	
	function custLog(x,base) {
		// Created 1997 by Brian Risk.  http://brianrisk.com
		return (Math.log(x))/(Math.log(base));
	}
	
}

(function($) {
	$(document).bind("osci_layout_complete", function()
	{
		$('.iipmap').each(function(){ iipmap($(this)); });	
	});	

}) (jQuery);
