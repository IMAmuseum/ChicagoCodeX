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
	// this.image_w = div.attr('data-iw');
	// this.image_h = div.attr('data-ih');
	var zoom_max = div.attr('data-zl') - 1;
	var node = div.attr('data-node');
	var collapsed = div.attr('data-collapsed');
	
	// Create map
	map = po.map();
	map.container(div[0].appendChild(po.svg('svg')));
	map.zoomRange([1, zoom_max]);
	map.zoom(4);
	map.center({lat:80.87, lon:-150});
	image = po.image();
	// tile_loader_x code gets appended dynamically to the map div in osci_iip.module
	var tl = 'tile_loader_'+node;
	image.url(eval(tl));
	map.add(image);
	map.add(po.interact());
	map.add(po.compass().pan("none"));
	
	console.log('svg:');
	console.log(div.svg('get'));
	/*
	// Overlay SVG
	map.add(po.geoJson()
    .features([{geometry: {coordinates: [80.87, -150], type: "Point"}}])
    .on("load", load));
		
	function load(e) {
		console.log($(e));
  		var r = 20 * Math.pow(2, e.tile.zoom - zoom_max);
  		for (var i = 0; i < e.features.length; i++) {
			var c = $(e.features[i].element),
        	g = c.parent().append("svg:g");

    		g.attr("transform", "translate(" + c.attr("cx") + "," + c.attr("cy") + ")");

    		g.add("svg:circle")
		        .attr("r", r)
		        .attr("transform", "translate(" + r + ",0)skewX(-45)")
		        .attr("opacity", .5)
		        .attr("filter", "url(#shadow)");

		    g.add(c
		        .attr("fill", "url(#r1)")
		        .attr("r", r)
		        .attr("cx", null)
		        .attr("cy", null));

		    g.add("svg:circle")
		        .attr("transform", "scale(.95,1)")
		        .attr("fill", "url(#r2)")
		        .attr("r", r);
		}
	}
	*/
	
	/*
	// if collapsed, add a expand button to go fullscreen
	if (collapsed) {
		div.css
		
		
		var nmap = n$('#map').style("visibility", "visible");
		var fs = nmap.add("svg:svg").attr("width",32).attr("height",32).attr("class", "fullscreen")
			.style("position","absolute").style("right","16px").style("top","16px")
			.style("visibility","visible").on("mousedown",toggle_fullscreen);
		fs.add("svg:circle").attr("cx",16).attr("cy",16).attr("r",14).attr("fill","#000")
			.attr("stroke","#ccc").attr("stroke-width",4).add("svg:title").text("Toggle fullscreen. (ESC)");
		fs.add("svg:path").attr("transform","translate(16,16)rotate(-45)scale(5)translate(-1.85,0)")
			.attr("d","M0,0L0,.5 2,.5 2,1.5 4,0 2,-1.5 2,-.5 0,-.5Z")
			.attr("pointer-events","none").attr("fill","#aaa").attr("class", "svg_arrow");
		
	}
	*/
}

(function($) {
	$(document).ready(function()
	{
		
		var mapdivs = $('.iipmap');
		mapdivs.each(function(){ iipmap($(this)); });	
	});	

}) (jQuery);
