function aic_360_initialize(threesixtyCode) {
	//render 360s
	$('.threesixty').each(function() {
		
		if($(this).hasClass('initialized')) {return;}
		
		//get data from html
		var src = $(this).data('360-src');
		var totalImages = $(this).data('360-total');
		var startFrame = $(this).data('360-start');
		var endFrame = $(this).data('360-end');
		var image360Width = $(this).data('360-width');
		var image360Height = $(this).data('360-height');
		var filePrefix360 = $(this).data('360-prefix');
		var isResponsive = $(this).data('360-responsive');
		
		$(this).ThreeSixty({
			totalFrames: totalImages, // Total no. of image you have for 360 slider
			endFrame: endFrame, // end frame for the auto spin animation
			currentFrame: startFrame, // This the start frame for auto spin
			imgList: '.threesixty_images', // selector for image list
			progress: '.spinner', // selector to show the loading progress
			imagePath: src, // path of the image assets
			filePrefix: filePrefix360, // file prefix if any
			ext: '.png', // extention for the assets
			height: image360Height, //image height
			width: image360Width, //image width
			navigation: true,
			responsive: isResponsive,
			disableSpin: true // Default false
		});
		
		//store data in variable for access on fullscreen
		var myObj = $(this).data();
		//get caption data	
		var threesixtyObjCaption = $(this).parents('figure:first').find('figcaption');
		//variable to hold fullscreen status
		var fsClass;
		
		if (threesixtyCode && threesixtyObjCaption[0]) {
			//settings for going fullscreen
			myObj.markup = $(this).parents()[0].outerHTML;
			myObj.caption = threesixtyObjCaption[0].innerHTML;
			fsClass = 'collapsed';
			myObj.fsbutton = $('<div id="fullscreenbutton" class="'+fsClass+'"></div>')
			.bind('click', function(event) {
				$.fancybox.open({
				padding: 0,
				scrolling: 'no',
				content: myObj.markup,
				title: myObj.caption,
				helpers: {
				title: {
					type : 'inside'
						}
					}
				});
			})
			.appendTo(this);
		} else {
			//already in fullscreen
			fsClass = 'expanded';
			myObj.fsbutton = $('<div id="fullscreenbutton" class="'+fsClass+'"></div>')
			.bind('click', function(event) {
				$.fancybox.close();
			})
			.appendTo('.fancybox-inner');	
		}				
		$(this).addClass('initialized');			 	
	});					
}