module( "tiliciousModule", {
	setup: function() {
		var w_window = parseInt($(window).width(), 10);
		var w_block = 200;
		var tilesAcross = Math.floor(w_window / w_block);
		var h_window = parseInt($(window).height(), 10);
		var h_block = 200;
		var tilesDown = Math.floor(h_window / h_block) + 1;
		var numTiles = Math.ceil(tilesAcross * tilesDown);
		var tiles = [];

		//Create tiles
		for (var i = 0, len = numTiles; i < len; i++) {
			var tileOpts = {
				fontColor: "#FBC92A",
				backgroundColor: "#666",
				headerTitle: "Name or Title Here. " +  i,
				content: "", //html or any string here
				footerTitle: "Category",
				
				topPanel: false,
				leftPanel: false,
				rightPanel: false,
				bottomPanel: false,
				
				
				/*pics: [{
						alt: "beach1",
						src: "http://cloud.github.com/downloads/malsup/cycle/beach1.jpg"
				}, {
						alt: "beach2",
						src: "http://cloud.github.com/downloads/malsup/cycle/beach2.jpg"
				}, {
						alt: "beach3",
						src: "http://cloud.github.com/downloads/malsup/cycle/beach3.jpg"
				}]*/
			};
			
			//Create various proportions
			if(i % 4 == 0){
				tileOpts.widthProportion = 1;
				tileOpts.heightProportion = 1;
			}else if(i % 4 == 1){
				tileOpts.widthProportion = 2;
				tileOpts.heightProportion = 1;
			}else if(i % 4 == 2){
				tileOpts.widthProportion = 2;
				tileOpts.heightProportion = 2;
			}else {
				tileOpts.widthProportion = 1;
				tileOpts.heightProportion = 2;
			}
			
			tiles.push(tileOpts);
		}

		//Initiate tilicous plugin
		var $tilicious = $("#tilicious-demo").tilicious({
				disableTilt: false,
				baseTileWidth: w_block,
				baseTileHeight: h_block,
				tiles: tiles,
		});
	
	}, teardown: function() {
		
	}
});

test( "hello test", function() {
	ok( 1 == "1", "Passed!" );
});