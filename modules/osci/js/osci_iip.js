var tile_size = 256; // tile size
var iip_ep = 'http://stanley.imamuseum.org/fcgi-bin/iipsrv.fcgi?fif=/opt/iip/images/test.ptif&jtl=';

// These are retrieved later
var image_w; // image width
var image_h; // image height
var zoom_max; // zoom layers max
var ptiff; // path to ptiff, aka FIF in iip parlance
var iipsrv; // url to the iip server

var po = org.polymaps;

(function($) {
	
	
	$(document).ready(function()
	{
		
		var mapdiv = $('#map');
		//console.log(mapdiv);
		//console.log("test");
		ptiff = mapdiv.attr('data-ptiff');
		image_w = mapdiv.attr('data-iw');
		image_h = mapdiv.attr('data-ih');
		zoom_max = mapdiv.attr('data-zl') - 1;
		iipsrv = mapdiv.attr('data-iipsrv');
		
		console.log('test4');
		
		var map = po.map()
				.container($('#map')[0].appendChild(po.svg('svg')))
			    .zoomRange([1, zoom_max])
				.zoom(1);
				
		var image = po.image();
		image.url(tile_loader);
		map.add(image);
		map.add(po.interact());
		map.add(po.hash());
		map.add(po.compass().pan("none"));
		// Add full screen control
		var nmap = n$('#map').style("visibility", "visible");
		var fs = nmap.add("svg:svg").attr("width",32).attr("height",32).attr("class", "fullscreen")
			.style("position","absolute").style("right","16px").style("top","16px")
			.style("visibility","visible").on("mousedown",toggle_fullscreen);
		fs.add("svg:circle").attr("cx",16).attr("cy",16).attr("r",14).attr("fill","#000")
			.attr("stroke","#ccc").attr("stroke-width",4).add("svg:title").text("Toggle fullscreen. (ESC)");
		fs.add("svg:path").attr("transform","translate(16,16)rotate(-45)scale(5)translate(-1.85,0)")
			.attr("d","M0,0L0,.5 2,.5 2,1.5 4,0 2,-1.5 2,-.5 0,-.5Z")
			.attr("pointer-events","none").attr("fill","#aaa");
		console.log("test");
		/* // This is the fullscreen toggle control
		(function() {
			function d(){
				if(b=!b){
					console.log(c.parent());
					c.style("position","fixed").style("border-width",0).style("width","100%")
						.style("height","100%").style("top",0).style("left",0);a.style("position","fixed")
						.style("right","16px").style("top","16px");
					e.attr("transform","translate(16,16)rotate(135)scale(5)translate(-1.85,0)");
					f.style("visibility","hidden").style("overflow","hidden");
				}else{
					c.style("position",null).style("border-width",null).style("width",null).style("height",null)
						.style("top",null).style("left",null);
					a.style("position","absolute").style("right","16px").style("top","16px");
					e.attr("transform","translate(16,16)rotate(-45)scale(5)translate(-1.85,0)");
					f.style("visibility",null).style("overflow",null)
				}
				map.resize()
			}
			
			var f=n$(document.body);
			var c=n$("#map").style("visibility","visible");
			var b=false;
			var a=c.add("svg:svg").attr("width",32).attr("height",32).style("position","absolute")
				.style("right","16px").style("top","16px").style("visibility","visible").on("mousedown",d);
			a.add("svg:circle").attr("cx",16).attr("cy",16).attr("r",14).attr("fill","#fff")
				.attr("stroke","#ccc").attr("stroke-width",4).add("svg:title").text("Toggle fullscreen. (ESC)");
			var e=a.add("svg:path").attr("transform","translate(16,16)rotate(-45)scale(5)translate(-1.85,0)")
				.attr("d","M0,0L0,.5 2,.5 2,1.5 4,0 2,-1.5 2,-.5 0,-.5Z")
				.attr("pointer-events","none").attr("fill","#aaa");
			window.addEventListener("keydown",function(g){
				g.keyCode==27&&b&&d();
			},false);
		})(); 
		*/
		
		
	});	
}) (jQuery);

function toggle_fullscreen() {
	
}

/**
 * Load an IIP image tile into polymaps
 */
function tile_loader(c) {
	// Determine the scale factor of this zoom
	var scale = Math.pow(2, zoom_max - c.zoom);
	
	// Figure out the w/h of the image at this zoom
	var mw = Math.round(image_w / scale);
	var mh = Math.round(image_h / scale);
	
	// Figure out how many tiles are at this zoom
	var tw = Math.ceil(mw / tile_size);
	var th = Math.ceil(mh / tile_size);
	
	// Everything above this point should be cached per zoom level
	
	// Bail out if this tile if out of range
	// console.log("z:"+c.zoom+" c:"+c.column+" r:"+c.row);
	if (c.row < 0 || c.row >= th || c.column < 0 || c.column >= tw) return;
	
	// If this is an edge case, we need to adjust the size
	if (c.row == (th - 1)) {
		c.element.setAttribute('height', mh % tile_size);		
	}
	if (c.column == (tw - 1)) {
		c.element.setAttribute('width', mw % tile_size);
	}
	
	return iip_ep + c.zoom + ',' + ((c.row * tw) + c.column);
}