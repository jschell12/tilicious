/*
* Tilicious.js
Copyright (C) 2012, Josh Schell

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


;(function ( $, window, document, undefined ) {
	// -------------------------- inlineStyle -------------------------- //
	// James Allardice
	$.fn.inlineStyle = function (prop) {
        return this.prop("style")[$.camelCase(prop)];
    };

	// -------------------------- Tilicious Default Options	------------ //
	var defaults = {
		tileWidth: '110px',
		tileHeight: '110px',
		margin: '10px',
		fluidTiles: true, 	// Adds extra space to each tile if extra space is in container
		tilesPerRow: -1,
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
			slideMenu: {
				topBarSlider: null,	//null or "" will case not to slide out
				leftBarSlider:   null,  //null or "" will case not to slide out
				rightBarSlider:  null,	//null or "" will case not to slide out
				bottomBarSlider: null	//null or "" will case not to slide out
			},
			pics: [{
				alt: "",
				src:""
			}]
		}],
	};
	
	
	// -------------------------- Tilicious Container	------------ //
	
	var _tile = '<div></div>';	
	var _self = null;
	var _options = null;
	var tileList = [];
	
	//Tilicious - Private methods
	//---------------
	var _init = function(element, options) {
		var tileOptsList = options.tiles;
		
		//Add ontainer to element
		var $container = $(element).addClass("tilicious-container");		
		
		// Find all tile elements that are already in the element container
		var tileElements = $(element).find(".tilicious-tile");
		if(tileElements.length){
			// Apply tile functionality
			for ( var i = 0, len =  tileElements.length; i < tileElements.length; i++ ) {
				tileElements[i].margin = options.margin;
				var tile = new TiliciousTile( $(tileElements[i]), defaults.tiles[0] );
				tileList.push(tile);
			}
		}
		//if tileOptsList object exists, create tiles and add to container 
		if(tileOptsList){
			for(var i = 0, len = tileOptsList.length; i < len; i++){	
				tileOpts = $.extend( {}, defaults.tiles[0], tileOptsList[i]);  		
				var tile = _createTile($container , tileOpts);			
				tileList.push(tile);
			}
		}        

        $container.append('<div style="float:left;clear:both; height:10px"></div>');

		//Resize handling
        $(document).ready(function(){_resizeContainer( $container);});        
        $(window).resize(function(){_resizeContainer( $container);});        
	};	
	
	var _createTile = function($container, tile){
		var $tile = $(_tile);				
		$container.append($tile);
		tile.margin = _options.margin;
		return new TiliciousTile( $tile, tile);        
	};    

	// Resize the so that tiles are properly centered
    var _resizeContainer = function( $container) {
        if(_options.tilesPerRow && _options.tilesPerRow > 0){            
            _setWidth($container, _options.tilesPerRow );
        }else{
            var renderedTileCount = $container.find('.tilicious-tile').length;        
            _setWidth($container, renderedTileCount);
        }		
    };

    var _setWidth = function($container, length){
        var w_window = $(window).width();
        var w_block = parseInt(_options.tileWidth, 10);
        var w_margin = parseInt(_options.margin, 10);
		var width = w_block;

        if(w_window <= (w_block + w_margin)){
            _setTileContainerHorizontalWidth($container, width);
        }else if((w_window >= ((w_block * length) + (w_margin * length)))){            
            width = (w_block * (length) + (w_margin * length));
            _setTileContainerHorizontalWidth($container, width);
        }else{        
            for(var i = 0, len = length; i < len; i++){                  
                if (_isCloseToFilled(w_window, w_block, w_margin, i)) {
                    width = (w_block * i) + (w_margin * i);
                    _setTileContainerHorizontalWidth($container, width);
                    break;
                }
            }     
        }       
    };

    var _setTileContainerHorizontalWidth = function($container, width){        
        $container.width(width);
    };
	
    var _isCloseToFilled = function(windowWidth, tileWidth, marginWidth, tileCount ){
        return ((windowWidth < ((tileWidth * (tileCount+1)) + (marginWidth * (tileCount+1)))) && (windowWidth >= ((tileWidth * tileCount) + (marginWidth * tileCount)))) ? true: false;
    };

	//Tile container
	var TiliciousContainer = (function( element, options ) { 
		this.element = element;       
        this.options = $.extend( {}, defaults, options);  
		_options = $.extend( {}, defaults, options);  		
        this._defaults = defaults;        
		_self = this;

        //block input overlay
        $("body").append("<div class='blocker'>Loading...</div>");
        _init(element, this.options);
	    $("body").find(".blocker").hide();
		return {};
	});	
   
	//Handles single tile
	var TiliciousTile = (function( element, options ){
		// Tile element	
		var $tile = element;
		var _headerTitle = '<div class="header-title"></div>';
		var _footerTitle = '<div class="footer-title"></div>';	
		var _topBarSlider = '<div class="tile-topbar"></div>';
		var _leftBarSlider = '<div class="tile-leftbar"></div>';		
		var _rightBarSlider = '<div class="tile-rightbar"></div>';		
		var _bottomBarSlider = '<div class="tile-bottombar"></div>';	
		
		// Declare css for when the tile is in its idle state.
		var _initialize = function(options) {		
			_addPics($tile, options);

			if(!$tile.hasClass("tilicious-tile")){
				$tile.addClass("tilicious-tile");
			}
			
			//Append and set header and footer titles				
			if(!$tile.hasClass("header-title")){
				$headerTitle = $(_headerTitle);	
				$headerTitle.text(options.headerTitle);		
				$tile.append($headerTitle);					
			}
			if(!$tile.hasClass("footer-title")){
				$footerTitle = $(_footerTitle);			
				$footerTitle.text(options.footerTitle);
				$tile.append($footerTitle);			
			}
			//Append slider panels
			if(!$tile.hasClass("tile-topbar")){			
				$tile.append(_topBarSlider);	
				$tile.find(".tile-topbar").hide();
			}
			if(!$tile.hasClass("tile-leftbar")){			
				$tile.append(_leftBarSlider);
				$tile.find(".tile-leftbar").hide();
			}
			if(!$tile.hasClass("tile-rightbar")){			
				$tile.append(_rightBarSlider);
				$tile.find(".tile-rightbar").hide();
			}
			if(!$tile.hasClass("tile-bottombar")){			
				$tile.append(_bottomBarSlider);
				$tile.find(".tile-bottombar").hide();
			}						
				
			//Set tile height and width			
			$tile.height(options.height);
			$tile.width(options.width);	
				
			//Set font and background colors if specified, will use defaults if not
			if(!$tile.inlineStyle("color")){
				$tile.css("color", options.fontColor);
			}
			if(!$tile.inlineStyle("background")){
				$tile.css("background",options.backgroundColor);
			}
			if(!$tile.inlineStyle("margin-left")){
				$tile.css("margin-left",options.margin);
			}			
			if(!$tile.inlineStyle("margin-top")){
				$tile.css("margin-top",options.margin);
			}
			$tile.css("overflow","hidden");    		
			$tile.bind('mousedown', _handleMouseDownOnClick);
			
			//set tile to idle position
			_toggleTilePushDirection($tile);
		};
		
		var _handleMouseDownOnClick = function( event ){			
			_handleTilePush( _getTileClickXPosition(this, event), _getTileClickYPosition(this, event));
		};
		
		var _handleMouseUpOnClick = function( event ){
			// Set the element to its idle state
			_toggleTilePushDirection($tile);
			document.removeEventListener('mouseup',   _handleMouseUpOnClick,   false);
		};

		var _handleTilePush = function( x, y ){
			// Get the elements width and height.
			var width = $tile.width();			
			var height = $tile.height();
			// If the click is in the center quater of the element, push down.
			if ( x > width/4 && x < (width/4 * 3) && y > height/4 && y < (height/4 * 3) ) {
				_toggleTilePushDirection($tile, "center");
			}
			// is the user closer to the right/left hand side?
			else if ( Math.min( x, width - x) < Math.min( y, height - y) ) {
				// Tilt on the left side
				if ( x < width - x ) {
					_toggleTilePushDirection($tile, "left");
					_togglePanelSlide($tile.find(".tile-leftbar"), 0, height, "left", 100);					
				// Tilt on the right side
				} else {	
					_toggleTilePushDirection($tile, "right");					
					_togglePanelSlide($tile.find(".tile-rightbar"), 0, height, "right", 100);
				}
			// the user is closer to the top/bottom side (also the default)
			} else {
				// Tilt on the top
				if ( y < height - y ) {
					_toggleTilePushDirection($tile, "top");
					_togglePanelSlide($tile.find(".tile-topbar"), width, 0, "top", 100);
				// Tilt on the bottom
				} else {
					_toggleTilePushDirection($tile, "bottom");
					_togglePanelSlide($tile.find(".tile-bottombar"), width, 0, "bottom", 100);					
				}
			}
			
			//post click
			document.addEventListener('mouseup',   _handleMouseUpOnClick,   false);    
		};
		
		var _togglePanelSlide = function(panel, width, height, dir, delay){
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
		
		var _getTileClickXPosition = function(self, event){			
			var posX = $(self).position().left;		
			return event.pageX - posX;
		};
		
		var _getTileClickYPosition = function(self, event){
			var posY = $(self).position().top;		
			return event.pageY - posY;
		};
		
		var _toggleTilePushDirection = function(tile,  pos){
			if(pos === "right"){
				tile.removeClass("tilicious-tile-idle");
				tile.removeClass("tilicious-tile-toggle-top");
				tile.removeClass("tilicious-tile-toggle-bottom");
				tile.removeClass("tilicious-tile-toggle-center");
				tile.removeClass("tilicious-tile-toggle-left");
				tile.addClass("tilicious-tile-toggle-right");			
			}else  if(pos === "top"){
				tile.removeClass("tilicious-tile-idle");
				tile.addClass("tilicious-tile-toggle-top");
				tile.removeClass("tilicious-tile-toggle-bottom");
				tile.removeClass("tilicious-tile-toggle-center");
				tile.removeClass("tilicious-tile-toggle-left");
				tile.removeClass("tilicious-tile-toggle-right");
			}else if(pos === "bottom"){
				tile.removeClass("tilicious-tile-idle");
				tile.removeClass("tilicious-tile-toggle-top");
				tile.addClass("tilicious-tile-toggle-bottom");
				tile.removeClass("tilicious-tile-toggle-center");
				tile.removeClass("tilicious-tile-toggle-left");
				tile.removeClass("tilicious-tile-toggle-right");
			}else if(pos === "center"){
				tile.removeClass("tilicious-tile-idle");
				tile.removeClass("tilicious-tile-toggle-top");
				tile.removeClass("tilicious-tile-toggle-bottom");
				tile.addClass("tilicious-tile-toggle-center");
				tile.removeClass("tilicious-tile-toggle-left");
				tile.removeClass("tilicious-tile-toggle-right");				
			}else if(pos === "left"){//left state
				tile.removeClass("tilicious-tile-idle");
				tile.removeClass("tilicious-tile-toggle-top");
				tile.removeClass("tilicious-tile-toggle-bottom");
				tile.removeClass("tilicious-tile-toggle-center");
				tile.addClass("tilicious-tile-toggle-left");
				tile.removeClass("tilicious-tile-toggle-right");				
			}else {//idle state
				tile.addClass("tilicious-tile-idle");
				tile.removeClass("tilicious-tile-toggle-top");
				tile.removeClass("tilicious-tile-toggle-bottom");
				tile.removeClass("tilicious-tile-toggle-center");
				tile.removeClass("tilicious-tile-toggle-left");
				tile.removeClass("tilicious-tile-toggle-right");				
			}
		};
	
		var  _addPics  = function($tile, tileOpts){
			if(!tileOpts.pics){
				return;            
			}

			var picContainer = document.createElement("div");            
			picContainer.className = "pic-container";       
			$tile.append(picContainer);	

			for(var i = 0, len = tileOpts.pics.length; i < len; i++){
				var pic = document.createElement("img");
				pic.className = "pic";
				pic.setAttribute('src', tileOpts.pics[i].src);
				pic.setAttribute('alt', tileOpts.pics[i].alt);
				$(pic).height(tileOpts.height);
				$(pic).width(tileOpts.width);            
				$(picContainer).append($(pic)  );		    
			}
			$tile.find(".pic-container").cycle(
				_slide(tileOpts.picsTransition,
				tileOpts.picsTransitionSpeed,
				tileOpts.picsTransitionInterval,
				parseInt(_self.options.tileHeight, 10),
				parseInt(_self.options.tileWidth, 10))
			);
		};
		
		var _slide = function(dir, speed, timeout, height, width, callbacks){    
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
		
		// Initialize the tile.
		_initialize(options);
	});	
	
	 $.fn["tilicious"] = function ( options ) {
        return this.each(function () {		
            if (!$.data(this, "plugin_" + "tilicious")) {
                $.data(this, "plugin_" + "tilicious", 
                new TiliciousContainer( this, options ));
            }
        });
    };
})( jQuery, window, document );