
JSONFormatter = (function() {

  var init = function( json, options ) { 
	
	// default settings
	var settings = $.extend( {
	  'appendTo' : 'body',
	  'list_id' : 'json',
	  'collapse' : false
	}, options);
	
	var loopCount = 0;
	
	loopObjectOfObjects = function(json2, ulId) {
	  $.each(json2, function(k3, v3) {
	  	k3 = _.escape(k3);
	  	//v3 = _.escape(v3);
		// object of objects
		if(typeof v3 == 'object') {
			$('#' + settings.list_id + ' #' + ulId).append('<li><span class="key">' + k3 + '</span> <span class="brace">{</span> <ul id="' + ulId + '-' + k3 + '"></ul></li>');
			$.each(v3, function(k4, v4) {
				k4 = _.escape(k4);
				//v4 = _.escape(v4);
				if(typeof v4 == 'object' && v4 != null) {
					$('#' + settings.list_id + ' #' + ulId + '-' + k3).append('<li><span class="key">' + k4 + '</span> <span class="brace">{</span> <ul id="'+k4+'-'+loopCount+'"></ul></li>');
					loopAgain(v4, k4, k4 + '-' + loopCount);
				}
				else {
					v4 = _.escape(v4);
					$('#' + settings.list_id + ' #' + ulId + '-' + k3).append('<li><span class="key">' + k4 + '</span> ' + v4 + '</li>');
				}

			});
		} 
		else {
		  // normal array
		  v3 = _.escape(v3);
		  $('#' + settings.list_id + ' #' + ulId).append('<li><span class="key">' + k3 + '</span> ' + v3 + '</li>')
		}
	  });
	},

	loopAgain = function(v, k, ulId) {
	  loopCount++;
	  $.each(v, function(nextKey, nextVal) {
	  	nextVal = _.escape(nextVal);
		var nextListId = nextKey + '-' + loopCount;
		var newList = '<ul id="' + nextListId + '"></ul>';
		if(nextVal != null && typeof nextVal == 'object') {
		  if(nextVal.length == 0) {
			// an empty object, just output that
			$('#' + settings.list_id + ' #' + ulId).append('<li><i>' + nextKey + '</i> []</li>');
		  } 
		  else if(nextVal.length >= 1) {
			// an object of objects
			$('#' + settings.list_id + ' #' + ulId).append('<li><span class="key">' + nextKey + '</span> <span class="brace">{</span> ' + newList + '</li>');
			loopObjectOfObjects(nextVal, nextListId);
		  }
		  else if(nextVal.length == undefined) {
			// next node
			$('#' + settings.list_id + ' #' + ulId).append('<li><span class="key">' + nextKey + '</span> <span class="brace">{</span> ' + newList + '</li>');
			loopAgain(nextVal, nextKey, nextListId);
		  }        
		}
		else {
			// value|key
			// if(nextKey.val == undefined) {
			//   $('#' + settings.list_id + ' #' + ulId).append('<li>' + nextVal + '</li>');
			//   
			// }
			// else {
				$('#' + settings.list_id + ' #' + ulId).append('<li><span class="key">'+ nextKey + '</span> ' + nextVal + '</li>');

			// }
		}
	  });
	},
	
	addClosingBraces = function() {
	  $('#' + settings.list_id + ' span.key').each(function() {
		var closingBrace = '<span class="brace">}</span>';
		if($(this).text() == "[") {
		  closingBrace = '<span class="brace">]</span>';
		}
		$(this).parent().find('ul').eq(0).after(closingBrace);
	  });      
	};

	var jsonList = $('<ul id="' + settings.list_id + '" />');

	$(settings.appendTo).append(jsonList);

	$.each(json, function(key, val) {
	  
	  if(val != null && typeof val == 'object') {
		var goObj = false;
		var goArray = false;
		var nk = '';
		$.each(val, function(nextKey, nextVal) {
		
		  if(nextVal != null && typeof nextVal == 'object') {
			if(nextVal.length == undefined) {
			  goObj = true;
			  nk = nextKey;
			}
			else {
			  goObj = false;
			}
		  }
		  else {
			// console.log('nextVal ' + nextVal);
			goArray = true;
		  }
		});

		if(goObj) {
		  $('#' + settings.list_id).append('<li><span class="key">' + key + '</span> <span class="brace">{</span><ul id="' + nk + '-' + loopCount + '"></ul></li>');
		  loopObjectOfObjects(val, nk + '-' + loopCount);
		}
		else if(goArray) {
		  $('#' + settings.list_id).append('<li><span class="key">' + key + '</span> <span class="brace">[</span><ul id="' + nk + '-' + loopCount + '"></ul></li>');
		  loopAgain(val, nk, nk + '-' + loopCount);
		}
		else {
		  $('#' + settings.list_id).append('<li><span class="key">' + key + '</span> <span class="brace">{</span><ul id="' + key + '-' + loopCount + '"></ul></li>');
		  loopAgain(val, key, key + '-' + loopCount);              
		}
		
	  }
	  else {
		$('#' + settings.list_id).append('<li><span class="key">' + key + '</span> ' + val + '</li>');
	  }
	});
	
	addClosingBraces();
	
	if(settings.collapse) {
	  addToggles(settings.list_id);      
	}
	
  },
  
  addToggles = function( listId ) {
	$('#' + listId + " > li").find('ul').each(function() {
	  $(this).parent().find('span').eq(1).after('<span class="toggle fake-link"> - </span>');
	});

	// Start Collapsed
	//$('.toggle').next().slideUp().end().text(' + ');

	// Handling the +/- sign click
	$('.toggle').on('click', function() {

		if($(this).next().is(":visible")) {
			$(this).next().slideUp(50).end().text(' + ');
		} else {
			$(this).next().slideDown(50).end().text(' - ');
		}

	});

	// Clicking the element .key
	// - will not always trigger an open/close if it is just a leaf
	$('.key').on('click', function() {

		// Handling the +/- sign click
		if($(this).parent().find('> ul').length <= 0){
			return;
		}

		if($(this).parent().find('> ul').is(":visible")) {
			$(this).parent().find('> ul').slideUp(50);
			$(this).parent().find('> .toggle').text(' + ');
		} else {
			$(this).parent().find('> ul').slideDown(50);
			$(this).parent().find('> .toggle').text(' - ');
		}

		// Clicking the element .key
		// - will not always trigger correctly
		

	});
  };
  
  return {

	format: function(json, options) {
	  init(json, options);
	}

  }
  

})();