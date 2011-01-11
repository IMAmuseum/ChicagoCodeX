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
	var center_lat = div.attr('data-center-lat');
	var center_lon = div.attr('data-center-lon');
	var tile_size = 256;
	
	
	// Calculate best zoom level to start at based on div parent's size.
	var parent_w = parseInt(div.parent().css('width'));
	var parent_h = parseInt(div.parent().css('height'));
	var zoom_level_h = custLog((image_h / parent_h), 2);
	var zoom_level_w = custLog((image_w / parent_w), 2);
	// console.log(['zoom_level_h:', zoom_level_h, 'zoom_level_w', zoom_level_w]);
	if (zoom_level_h >= zoom_level_w) {
		var zoom_level = zoom_max - zoom_level_h -1;
	}
	else {
		var zoom_level = zoom_max - zoom_level_w -1;
	}
	// console.log(['parent width:', parent_w, 'parent height:', parent_h, 'image width:', image_w, 'image height:', image_h, 'zoom max:', zoom_max, 'zoom level:', zoom_level]);

	
	
	// Create map
	var map = po.map();
	var svg = po.svg('svg');
	map.container(div[0].appendChild(svg));
	map.zoomRange([0, zoom_max]);
	map.zoom(zoom_level);

	// Set visible window so that full image fits inside and doesn't overflow
	var th = parent_h / tile_size; // tiles high
	var tw = parent_w / tile_size; // tiles wide
	// console.log(['tiles wide:', tw, 'tiles high:', tw]);
	// map extents are to be given as SW corner, NE corner
	map.extent([map.coordinateLocation({zoom: zoom_level, column: 0, row: th}), map.coordinateLocation({zoom: zoom_level, column: tw, row: 0})]);
	
	// Load in our image and define the tile loader for it
	var image = po.image();
	var tl = 'tile_loader_'+figure_id+' = function (c) { var iipsrv = "http://stanley.imamuseum.org/fcgi-bin/iipsrv.fcgi"; var ptiff = "'+ptiff+'"; var image_h = '+image_h+'; var image_w = '+image_w+'; var zoom_max = '+zoom_max+' - 1; var tile_size = 256; var scale = Math.pow(2, zoom_max - c.zoom); var mw = Math.round(image_w / scale); var mh = Math.round(image_h / scale); var tw = Math.ceil(mw / tile_size); var th = Math.ceil(mh / tile_size); if (c.row < 0 || c.row >= th || c.column < 0 || c.column >= tw) return; if (c.row == (th - 1)) { c.element.setAttribute("height", mh % tile_size);} if (c.column == (tw - 1)) { c.element.setAttribute("width", mw % tile_size);} return iipsrv+"?fif="+ptiff+"&jtl="+c.zoom+","+((c.row * tw) + c.column);}';			
	eval(tl);
	image.url(window['tile_loader_'+figure_id]);
	map.add(image);
	
	// Controls and functionality
	map.add(po.interact());
	map.add(po.compass().pan("none"));
	
	// If we have a center value set, let's use it
	if (center_lat && center_lon) {
		map.center({lat: parseFloat(center_lat), lon: parseFloat(center_lon)});
	}
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
			"coordinates": [ [p1.lon -1.5, p2.lat -.5], [p1.lon -1.5, p2.lat], [p1.lon, p1.lat] ]
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
	else {
		var nmap = n$(div[0]);
		var fs = nmap.add("svg:svg")
			.attr("width",32)
			.attr("height",32)
			.attr("class", "fullscreen")
			.style("position","absolute")
			.style("right","5px")
			.style("top","5px")
			.style("visibility","visible")
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
		var center = map.center();
		newdiv.attr('data-zl', zoom_max)
			.attr('data-node', node)
			.attr('data-figure-id', figure_id)
			.attr('data-ptiff', ptiff)
			.attr('data-ih', image_h)
			.attr('data-iw', image_w)
			.attr('data-center-lat', center.lat)
			.attr('data-center-lon', center.lon);
		iipmap(newdiv);
	
	}
	
	function make_small() {
		$('#iip_fullscreen').parent().remove();
	}
	
	function custLog(x,base) {
		return (Math.log(x))/(Math.log(base));
	}
	
}

(function($) {
	$(document).bind("osci_layout_complete", function()
	{
		$('.iipmap').each(function(){ iipmap($(this)); });	
	});	

}) (jQuery);
