/*
Tilicious.js
Copyright (C) 2012, Josh Schell

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
//
// TODO 1: Find and move all immutable css into tilicious.css file.
// TODO 2: Find and move all html into a separate html file containing all templates
//


;(function ( $, window, document, undefined ) {
	// -------------------------- inlineStyle -------------------------- //
	// James Allardice
	$.fn.inlineStyle = function (prop) {
        return this.prop("style")[$.camelCase(prop)];
    };

	// -------------------------- Tilicious Container ------------ //
	var TiliciousContainer = (function( element, options ) {		
		var _tileTemplate = '<div></div>';
		var _options = JSON.parse(JSON.stringify(options)); 
		var _$container = $(element);
		var _resizing = false;
		var _columnCount = 0;
		var _styleQueue = [];
		var _columnHeightAccumList = [];
		var _columnWidth = 0;
		
		var _arrangeTiles = function(){
			var container_w = _$container.width();
			var tiles = _getTiles();
			
			// reset columns			
			var i = _columnCount;
			_columnHeightAccumList = [];
			while (i--) {
				_columnHeightAccumList.push( 0 );
			}
			// place each brick
			for (var i=0, len = tiles.length; i < len; i++) {
				$(tiles[i].el).css({ position: 'absolute' });
				_positionTile( tiles[i] );
			}
			
			var containerSize = {};
			containerSize.height = Math.max.apply( Math, _columnHeightAccumList );
			// process styleQueue
			var obj;
			var maxLeft = 0;//get farthest left position plus that last tiles width
			for (i=0, len = _styleQueue.length; i < len; i++) {
				obj = _styleQueue[i];
				if((obj.style.left + obj.tile.width) > maxLeft){
					maxLeft = obj.style.left + obj.tile.width;
				}
				obj.$el.css(obj.style);	
				obj.$el.css("margin-left", 0);
				
			}
			
			// fit container to columns that have been used;
			containerSize.width = maxLeft;		
			_$container.css(containerSize);
			
			_styleQueue = [];
		};
		
		var _calculateColumnCount = function(){
			///<summary>Calculates number of columns that currently fit in container</summary>
			var containerWidth = _$container.width();
			var columnWidth = _options.baseTileWidth + parseInt(_options.margin, 10);
			_columnWidth = columnWidth;
			var columnCount = Math.floor((containerWidth + parseInt(_options.margin, 10)) / columnWidth );
			columnCount = Math.max( columnCount, 1 );
			_columnCount = columnCount;
		};
		
		var _createTile = function(tileOptions){
			var $tile = $(_tileTemplate);				
			_$container.append($tile);
			tileOptions.margin = _options.margin;
			return new TiliciousTile( $tile, _options, tileOptions);        
		}; 
		
		var _getTiles = function(){
			return _$container.data("tiles");
		};
		
		
		
		var _handleResize = function(){						
			_resizing = true;
			_resizeContainer();
			setTimeout(function(){
				_resizing = false;
			}, options.resizeDelay);		
			
			$(window).resize(function(){
				if(!_resizing){
					_resizing = true;
					setTimeout(function(){
						_resizeContainer();
						_resizing = false;
					}, options.resizeDelay);
				}
			});        
		}
			
		var _init = function() {
			var tileOptsList = _options.tiles;
			var tileList = [];
			
			//Add container class to element
			_$container.addClass("tilicious-container");			
			
			// Find all tile elements that are already in the element container
			var tileElements = _$container.find(".tilicious-tile");
			if(tileElements.length){
				// Apply tile functionality
				for ( var i = 0, len =  tileElements.length; i < tileElements.length; i++ ) {
					tileElements[i].margin = _options.margin;
					var tile = new TiliciousTile( $(tileElements[i]), _options, _options.tiles[0] );
					tileList.push(tile);
				}
			}
			//if tileOptsList object exists, create tiles and add to container 
			if(tileOptsList){
				for(var i = 0, len = tileOptsList.length; i < len; i++){	
					tileOpts = $.extend( {}, _options.tiles[0], tileOptsList[i]);  		
					var tile = _createTile(tileOpts);			
					tileList.push(tile);
				}
			}        
			//store tileList in data() so we can clone it.
			_$container.data("tiles", tileList);
			_$container.append('<div style="float:left;clear:both; height:10px"></div>');

			//Resize handling
			_handleResize();
		};	
		
		var _isCloseToFilled = function(windowWidth, baseTileWidth, marginWidth, tileCount ){
			return ((windowWidth < ((baseTileWidth * (tileCount+1)) + (marginWidth * (tileCount+1)))) && (windowWidth >= ((baseTileWidth * tileCount) + (marginWidth * tileCount)))) ? true: false;
		};
		
		var _positionTile = function(tile){			
			var $tile = $(tile.el),
			colSpan, groupCount, groupY, groupColY, j;
			
			colSpan = tile.widthProportion;
			colSpan = Math.min( colSpan, _columnCount );
			if ( colSpan === 1 ) {
				// if tile spans only one column, just like singleMode
				groupY = _columnHeightAccumList;
			} else {
				// tile spans more than one column
				// how many different places could this tile fit horizontally
				groupCount = _columnCount + 1 - colSpan;
				groupY = [];

				// for each group potential horizontal position
				for ( j=0; j < groupCount; j++ ) {
					// make an array of colY values for that one group
					groupColY = _columnHeightAccumList.slice( j, j+colSpan );
					// and get the max value of the array
					groupY[j] = Math.max.apply( Math, groupColY );
				}
			}
			// get the minimum Y value from the columns
			var minimumY = Math.min.apply( Math, groupY ),
			shortCol = 0;

			// Find index of short column, the first from the left
			for (var i=0, len = groupY.length; i < len; i++) {
				if ( groupY[i] === minimumY ) {
					shortCol = i;
					break;
				}
			}

			// position the tile
			var position = {
				top: minimumY + parseInt(_options.margin, 10)
			};
			position.left = _columnWidth * shortCol;
			_styleQueue.push({ $el: $tile, style: position, tile: tile });
			// apply setHeight to necessary columns
			var setHeight = minimumY + $tile.outerHeight(true),
			setSpan = _columnCount + 1 - len;
			for ( i=0; i < setSpan; i++ ) {
				_columnHeightAccumList[ shortCol + i ] = setHeight;
			}
			
		};
		
		
		// Resize the so that tiles are properly centered
		var _resizeContainer = function( ) {		
			var previousColumnCount = _columnCount;	
			
			
			// Need to set container width
			if(_options.tilesPerRow && _options.tilesPerRow > 0){            
				_setWidth(_options.tilesPerRow);
			}else{      
				var renderedTileCount = _$container.find('.tilicious-tile').length;        
				_setWidth(renderedTileCount);
			}
			
			// Now that we have the container width set, calculate number of columns			
			_calculateColumnCount();
			if (_columnCount !== previousColumnCount ) {
				_arrangeTiles();
			}
			
			
		};
		
		var _rotateTile = function(tile){
			///<summary>swap proportions<summary/>
			var tempProp = tile.widthProportion;
			tile.widthProportion = tile.heightProportion;
			tile.heightProportion = tempProp;
			//swap widths
			var tempW = tile.width;
			tile.width = tile.height;
			tile.height = tempW;
			$(tile.el).width(tile.width);
			$(tile.el).height(tile.height);
			//tile[i] = tile;
			return tile;
		}
	
		var _setWidth = function(length){
			var w_window = $(window).width();
			var w_block = parseInt(_options.baseTileWidth, 10);
			var w_margin = parseInt(_options.margin, 10);
			var width = w_block;

			if(w_window <= (w_block + w_margin)){
				_$container.width(width);
			}else if((w_window >= ((w_block * length) + (w_margin * length)))){            
				width = (w_block * (length) + (w_margin * length));
				_$container.width(width);
			}else{        
				for(var i = 0, len = length; i < len; i++){                  
					if (_isCloseToFilled(w_window, w_block, w_margin, i)) {
						width = (w_block * i) + (w_margin * (i+1));
						_$container.width(width);
						break;
					}
				}     
			}       
		};
		
        _init();		
		return {};
	});	
    
	var TiliciousTile = (function(element, containerOptions, options ){
		///<summary>Represents a single tile and all of its functionality</summary>
		var _$tile = $(element);
		var _options = JSON.parse(JSON.stringify(options));
		var _originalOptions = JSON.parse(JSON.stringify(options));
		var _containerOptions = containerOptions;
		var _headerTitleTemplate = '<div class="header-title"></div>';
		var _footerTitleTemplate = '<div class="footer-title"></div>';
		var _topBarSliderTemplate = '<div class="tile-topbar"></div>';
		var _leftBarSliderTemplate = '<div class="tile-leftbar"></div>';
		var _rightBarSliderTemplate = '<div class="tile-rightbar"></div>';
		var _bottomBarSliderTemplate = '<div class="tile-bottombar"></div>';
		var _height = 0;
		var _width = 0;
		
		
		var _getTileClickXPosition = function( event){		
			var posX = _$tile.offset().left;
			return event.pageX - posX;
		};

		var _getTileClickYPosition = function( event){
			var posY = _$tile.offset().top;
			return event.pageY - posY;
		};
		
		var _handleMouseDownOnClick = function( event ){
			if(!_options.disableTilt){
				_handleTilePush( _getTileClickXPosition( event), _getTileClickYPosition( event));
			}
		};

		var _handleMouseUpOnClick = function( event ){
			// Set the element to its idle state
			if(!_options.disableTilt){
				_toggleTilePushDirection();
				document.removeEventListener('mouseup',   _handleMouseUpOnClick,   false);
			}
		};

		var _handleTilePush = function( x, y ){
			///<summary> Based on where tile is clicked, get x,y and call _toggleTilePushDirection
			///NOTE: refactor this to trigger events</summary>
			// Get the elements width and height.
			var width = _width;			
			var height = _height;
			// If the click is in the center of the element, push down.
			if ( x > width/4 && x < (width/4 * 3) && y > height/4 && y < (height/4 * 3) ) {
				_toggleTilePushDirection("center");
			}
			// Is the click closer to the right/left hand side?
			else if ( Math.min( x, width - x) < Math.min( y, height - y) ) {
				// Tilt on the left side
				if ( x < width - x ) {
					_toggleTilePushDirection("left");
					_togglePanelSlide(_$tile.find(".tile-leftbar"), 0, height, "left", 100);					
				// Tilt on the right side
				} else {	
					_toggleTilePushDirection("right");					
					_togglePanelSlide(_$tile.find(".tile-rightbar"), 0, height, "right", 100);
				}
			// Is the click is closer to the top/bottom side
			} else {
				// Tilt on the top
				if ( y < height - y ) {
					_toggleTilePushDirection( "top");
					_togglePanelSlide(_$tile.find(".tile-topbar"), width, 0, "top", 100);
				// Tilt on the bottom
				} else {
					_toggleTilePushDirection( "bottom");
					_togglePanelSlide(_$tile.find(".tile-bottombar"), width, 0, "bottom", 100);					
				}
			}
			
			//post click
			document.addEventListener('mouseup',   _handleMouseUpOnClick,   false);
		};
		
		var _init = function() {			
			if(!_$tile.hasClass("tilicious-tile")){
				_$tile.addClass("tilicious-tile");
			}
			
			//Append and set header and footer titles				
			if(!_$tile.hasClass("header-title")){
				$headerTitle = $(_headerTitleTemplate);	
				$headerTitle.text(_options.headerTitle);
				_$tile.append($headerTitle);
			}
			if(!_$tile.hasClass("footer-title")){
				$footerTitle = $(_footerTitleTemplate);
				$footerTitle.text(_options.footerTitle);
				_$tile.append($footerTitle);
			}
			
			//Append slider panels
			if(_options.topPanel && !_$tile.hasClass("tile-topbar")){			
				_$tile.append(_topBarSliderTemplate);	
				_$tile.find(".tile-topbar").hide();
			}
			if(_options.leftPanel && !_$tile.hasClass("tile-leftbar")){			
				_$tile.append(_leftBarSliderTemplate);
				_$tile.find(".tile-leftbar").hide();
			}
			if(_options.rightPanel && _$tile.hasClass("tile-rightbar")){			
				_$tile.append(_rightBarSliderTemplate);
				_$tile.find(".tile-rightbar").hide();
			}
			if(_options.bottomPanel && !_$tile.hasClass("tile-bottombar")){			
				_$tile.append(_bottomBarSliderTemplate);
				_$tile.find(".tile-bottombar").hide();
			}
			
			var margin = parseInt(_containerOptions.margin, 10);
			
			_height = parseInt(_containerOptions.baseTileHeight, 10);
			_width = parseInt(_containerOptions.baseTileWidth, 10);
			
			//Set tile height and width			
			_height = _$tile.height(_height * _options.heightProportion).height();
			_width = _$tile.width(_width * _options.widthProportion).width();
			if(_options.heightProportion > 1){			
				_height = _$tile.height(_height + (margin * (_options.heightProportion - 1))).height();
			}
			if(_options.widthProportion > 1){
				_width = _$tile.width(_width + (margin * (_options.widthProportion - 1))).width();
			}
			
			
			//Set font and background colors if specified, will use defaults if not
			if(!_$tile.inlineStyle("color")){
				_$tile.css("color", _options.fontColor);
			}
			if(!_$tile.inlineStyle("background")){
				_$tile.css("background", _options.backgroundColor);
			}
			// if(!_$tile.inlineStyle("margin-left")){
				// _$tile.css("margin-left", _options.margin);
			// }			
			if(!_$tile.inlineStyle("margin-top")){
				_$tile.css("margin-top", _options.margin);
			}
			_$tile.css("overflow", "hidden");			
			
			//set tile to idle position
			_toggleTilePushDirection();
			
			//bind tilt event
			if(!_options.disableTilt){
				_$tile.bind('mousedown', _handleMouseDownOnClick);
			}
			
			//Add pic cycling capabilities with jquery.cycle.lite.js plugin
			_picCycler(_options);
		};
		
		var _picCycler  = function(){
			///<summary> Create and append a pic container and setup jquery.cycle.lite plugin
			/// for slideshow of pics</summary>
			if(!_options.pics){
				return;            
			}

			var picContainer = document.createElement("div");            
			picContainer.className = "pic-container";       
			_$.append(picContainer);	

			for(var i = 0, len = _options.pics.length; i < len; i++){
				var pic = document.createElement("img");
				pic.className = "pic";
				pic.setAttribute('src', _options.pics[i].src);
				pic.setAttribute('alt', _options.pics[i].alt);
				$(pic).height(_options.height);
				$(pic).width(_options.width);            
				$(picContainer).append($(pic)  );		    
			}
			_$tile.find(".pic-container").cycle(
				_slide(_options.picsTransition,
				_options.picsTransitionSpeed,
				_options.picsTransitionInterval,
				parseInt(_containerOptions.baseTileHeight, 10),
				parseInt(_containerOptions.baseTileWidth, 10))
			);
		};
		
		var restore = function(){
			_options = JSON.parse(JSON.stringify(_originalOptions));
		};
		
		var _slide = function(dir, speed, timeout, height, width, callbacks){   
			///<summary> Create options object for jquery.cycle.lite.js plugin</summary>
			if(!callbacks){
				callbacks = {before:null, after:null};
			}
			if(!callbacks.before){
				callbacks.before = null;
			}
			if(!callbacks.after){
				callbacks.after= null;
			}
			var opts = { 
				fx: 'custom', 
				speed: speed, 
				timeout: timeout,
				before: callbacks.before,
				after: callbacks.after
			};
			if(dir === "right"){
				opts.cssBefore = { right: width };
				opts.animIn =  { right: 0};
				opts.animOut = { right: -width };
			}else if( dir === "left"){
				opts.cssBefore = { left: width };
				opts.animIn =  { left: 0};
				opts.animOut = { left: -width };
			}else if( dir === "up"){
				opts.cssBefore = { top: height };
				opts.animIn =  { top: 0};
				opts.animOut = { top: -height};        
			}else if(dir === "down"){
				opts.cssBefore = { top: -height };
				opts.animIn =  { top: 0};
				opts.animOut = { top: height };       
			}else{
				opts.fx = dir;
			}        
			return opts;
		};

		var _togglePanelSlide = function(panel, width, height, dir, delay){
			///<summary> Handles panel slideout width, direction and duration</summary>
			if(width > 0){					
				panel.width(width);
				if(dir === "top"){
					panel.animate({ height: "toggle", top: 0}, delay);
				}else if( dir === "bottom"){
					panel.animate({ height: "toggle", bottom: 0}, delay);
				}
			}
			if(height > 0 ){
				panel.height(height);
				if(dir === "left"){
					panel.animate({ width: "toggle", left: 0}, delay);
				}else if( dir === "right"){
					panel.animate({ width: "toggle", right: 0}, delay);
				}
			}
		};
		
		var _toggleTilePushDirection = function(pos){
			///<summary> Add/remove clases that cause the tile to generate 'tilt' effect
			/// in a specific direction</summary>
			if(pos === "right"){
				_$tile.removeClass("tilicious-tile-idle");
				_$tile.removeClass("tilicious-tile-toggle-top");
				_$tile.removeClass("tilicious-tile-toggle-bottom");
				_$tile.removeClass("tilicious-tile-toggle-center");
				_$tile.removeClass("tilicious-tile-toggle-left");
				_$tile.addClass("tilicious-tile-toggle-right");			
			}else  if(pos === "top"){
				_$tile.removeClass("tilicious-tile-idle");
				_$tile.addClass("tilicious-tile-toggle-top");
				_$tile.removeClass("tilicious-tile-toggle-bottom");
				_$tile.removeClass("tilicious-tile-toggle-center");
				_$tile.removeClass("tilicious-tile-toggle-left");
				_$tile.removeClass("tilicious-tile-toggle-right");
			}else if(pos === "bottom"){
				_$tile.removeClass("tilicious-tile-idle");
				_$tile.removeClass("tilicious-tile-toggle-top");
				_$tile.addClass("tilicious-tile-toggle-bottom");
				_$tile.removeClass("tilicious-tile-toggle-center");
				_$tile.removeClass("tilicious-tile-toggle-left");
				_$tile.removeClass("tilicious-tile-toggle-right");
			}else if(pos === "center"){
				_$tile.removeClass("tilicious-tile-idle");
				_$tile.removeClass("tilicious-tile-toggle-top");
				_$tile.removeClass("tilicious-tile-toggle-bottom");
				_$tile.addClass("tilicious-tile-toggle-center");
				_$tile.removeClass("tilicious-tile-toggle-left");
				_$tile.removeClass("tilicious-tile-toggle-right");				
			}else if(pos === "left"){//left state
				_$tile.removeClass("tilicious-tile-idle");
				_$tile.removeClass("tilicious-tile-toggle-top");
				_$tile.removeClass("tilicious-tile-toggle-bottom");
				_$tile.removeClass("tilicious-tile-toggle-center");
				_$tile.addClass("tilicious-tile-toggle-left");
				_$tile.removeClass("tilicious-tile-toggle-right");				
			}else {//idle state
				_$tile.addClass("tilicious-tile-idle");
				_$tile.removeClass("tilicious-tile-toggle-top");
				_$tile.removeClass("tilicious-tile-toggle-bottom");
				_$tile.removeClass("tilicious-tile-toggle-center");
				_$tile.removeClass("tilicious-tile-toggle-left");
				_$tile.removeClass("tilicious-tile-toggle-right");				
			}
		};
		
		
		// Initialize the tile.
		_init();
		
		return {
			height: _height,
			heightProportion: _options.heightProportion,
			width: _width,
			widthProportion: _options.widthProportion,
			top: _$tile.position().top,
			left: _$tile.position().left,
			el: _$tile,
			restore: restore
		};
	});	
	
	 $.fn["tilicious"] = function ( options ) {	 
		// -------------------------- Tilicious Default Options	------------ //
		var defaults = {
			disableTilt: false,
			baseTileWidth: '110px',// This is the default smallest width a tile can have, overwrites each tile width if
			baseTileHeight: '110px',// This is the default smallest height a tile can have, overwrites each tile height if
			margin: '10px',
			fluidTiles: true, 	// Adds extra space to each tile if extra space is in container
			tilesPerRow: -1,
			resizeDelay: 500,
			tiles: [{
				backgroundColor: "white",
				fontColor: "white",
				panelBackgroundColor: "white",
				panelFontColor: "white",
				panelOpacity: "1.0",
				type: "full",
				headerTitle:"", 
				content:"", //html or any string here
				footerTitle:"",
				//What about panel opactiy, background or font color?
				topPanel: false,	
				leftPanel:   false,  
				rightPanel:  false,	
				bottomPanel: false,	
				heightProportion: 1,
				widthProportion: 1,
				pics: [{
					alt: "",
					src:""
				}]
			}],
		};
		options = $.extend( {}, defaults, options);
	 
	 
        return this.each(function () {		
            if (!$.data(this, "plugin_" + "tilicious")) {
                $.data(this, "plugin_" + "tilicious", 
                new TiliciousContainer( this, options ));
            }
        });
    };
})( jQuery, window, document );
