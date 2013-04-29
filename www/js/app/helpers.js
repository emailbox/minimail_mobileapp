
// Partials
// - weird that we define these here
$(document).ready(function(){
	$('.partial').each(function(i,elem){
		Handlebars.registerPartial($(elem).attr('id'),$(elem).html());
	});
});


/*//////////////////////////
General Helpers
//////////////////////////*/
// Some from https://raw.github.com/gist/1468937/f76f926f7961ea731fe30c4095a9e95dfe785eba/handlebars-helpers.js

// Helpers
Handlebars.registerHelper("ifCond", function(val1, val2, options) {
	
	if (val1 == val2) {
		return options.fn(this);
	} else if(options.inverse != undefined) {
		return options.inverse(this);
	} else {
		return null;
	}
});
Handlebars.registerHelper("ifTypeCond", function(val1, val2, options) {
	
	if (typeof(val1) == val2) {
		return options.fn(this);
	} else if(options.inverse != undefined) {
		return options.inverse(this);
	} else {
		return null;
	}
});


// {{#each_with_index records}}
//  <li class="legend_item{{index}}"><span></span>{{Name}}</li>
// {{/each_with_index}}
Handlebars.registerHelper("each_with_index", function(array, options) {
  var total = array.length;
  var buffer = "";

  $.each(array,function(i,v){
  	var item = v;
  	item.index = i;
  	buffer += options.fn(item);
  });

  return buffer;

  // //Better performance: http://jsperf.com/for-vs-foreach/2
  // for (var i = 0, j = total; i < j; i++) {
  //   var item = array[i];

  //   // stick an index property onto the item, starting with 1, may make configurable later
  //   item.index = i;
  //   item.total = total;

  //   // show the inside of the block
  //   buffer += fn(item);
  // }

  // // return the finished buffer
  // return buffer;

});


Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {
	// Able to do things like:
	/*

	{{#compare Database.Tables.Count ">" 5}}
		There are more than 5 tables
	{{/compare}}

	{{#compare "Test" "Test"}}
		Default comparison of "==="
	{{/compare}}

	*/

    var operators, result;
    
    if (arguments.length < 3) {
        throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
    }
    
    if (options === undefined) {
        options = rvalue;
        rvalue = operator;
        operator = "===";
    }
    
    operators = {
        '==': function (l, r) { return l == r; },
        '===': function (l, r) { return l === r; },
        '!=': function (l, r) { return l != r; },
        '!==': function (l, r) { return l !== r; },
        '<': function (l, r) { return l < r; },
        '>': function (l, r) { return l > r; },
        '<=': function (l, r) { return l <= r; },
        '>=': function (l, r) { return l >= r; },
        'typeof': function (l, r) { return typeof l == r; }
    };
    
    if (!operators[operator]) {
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
    }
    
    result = operators[operator](lvalue, rvalue);
    
    if (result) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }

});



Handlebars.registerHelper('compare_length', function (lvalue, operator, rvalue, options) {
	// Able to do things like:
	/*

	{{#compare Database.Tables.Count ">" 5}}
		There are more than 5 tables
	{{/compare}}

	{{#compare "Test" "Test"}}
		Default comparison of "==="
	{{/compare}}

	*/

    var operators, result;
    
    if (arguments.length < 3) {
        throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
    }
    
    if (options === undefined) {
        options = rvalue;
        rvalue = operator;
        operator = "===";
    }
    
    operators = {
        '==': function (l, r) { return l == r; },
        '===': function (l, r) { return l === r; },
        '!=': function (l, r) { return l != r; },
        '!==': function (l, r) { return l !== r; },
        '<': function (l, r) { return l < r; },
        '>': function (l, r) { return l > r; },
        '<=': function (l, r) { return l <= r; },
        '>=': function (l, r) { return l >= r; },
        'typeof': function (l, r) { return typeof l == r; }
    };
    
    if (!operators[operator]) {
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
    }
    
    result = operators[operator](lvalue.length, rvalue);
    
    if (result) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }

});



Handlebars.registerHelper('compare_size', function (lvalue, operator, rvalue, options) {
	// Able to do things like:
	/*

	{{#compare Database.Tables.Count ">" 5}}
		There are more than 5 tables
	{{/compare}}

	{{#compare "Test" "Test"}}
		Default comparison of "==="
	{{/compare}}

	*/

    var operators, result;
    
    if (arguments.length < 3) {
        throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
    }
    
    if (options === undefined) {
        options = rvalue;
        rvalue = operator;
        operator = "===";
    }
    
    operators = {
        '==': function (l, r) { return l == r; },
        '===': function (l, r) { return l === r; },
        '!=': function (l, r) { return l != r; },
        '!==': function (l, r) { return l !== r; },
        '<': function (l, r) { return l < r; },
        '>': function (l, r) { return l > r; },
        '<=': function (l, r) { return l <= r; },
        '>=': function (l, r) { return l >= r; },
        'typeof': function (l, r) { return typeof l == r; }
    };
    
    if (!operators[operator]) {
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
    }
    
    result = operators[operator](_.size(lvalue), rvalue);
    
    if (result) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }

});

Handlebars.registerHelper("ifCondIn", function(val1, val2, fn, elseFn) {
	// Doesn't work, not sure how to pass in values as an array!
	// - seems to only accept strings? Should I stringify them?
	
	if ($.inArray(val1,val2)){
		return fn(this);
	} else if(elseFn != undefined) {
		return elseFn(this);
	} else {
		return null;
	}
});


Handlebars.registerHelper("Empty", function(val, options) {

	if (val == "undefined" || val == null || val.length == 0){
		if(options.fn != undefined){
			return options.fn(this);
		} else {
			return null;
		}
	}

	if(options.inverse != undefined){
		return options.inverse(this);
	} else {
		return null;
	}


});


Handlebars.registerHelper("NotEmpty", function(val, options) {
	
	if (val == "undefined" || val == null){
		if(options.inverse != undefined){
			return options.inverse(this);
		} else {
			return null;
		}
	}

	if (val.length > 0) {
		return options.fn(this);
	} else if(options.inverse != undefined) {
		return options.inverse(this);
	} else {
		return null;
	}
});


Handlebars.registerHelper("print", function(v) {
	//  Either today's date-time, or Yesterday, or Date

	clog('Print from helper:');
	clog(v);

	return null;

});


Handlebars.registerHelper('include', function(template, options){
	// Find the partial in question.
	//alert(options.hash);

	var partial = Handlebars.partials[template];


	// Build the new context; if we don't include `this` we get functionality
	// similar to {% include ... with ... only %} in Django.
	var context = _.extend({}, this, options.hash);

	// Render, marked as safe so it isn't escaped.
	return new Handlebars.SafeString(partial(context)); // eh, should I do SafeString here? Doesn't it strip HTML or some shit?
});

Handlebars.registerHelper("key_value", function(obj, fn) {
	// Might need to be used in conjunction with ensure_string (helper)
	var buffer = "",
		key;

	for (key in obj) {
		if (obj.hasOwnProperty(key)) {
			buffer += fn({key: key, value: obj[key]});
		}
	}

	return buffer;
});



// debug helper
// usage: {{debug}} or {{debug someValue}}
// from: @commondream (http://thinkvitamin.com/code/handlebars-js-part-3-tips-and-tricks/)
Handlebars.registerHelper("debug", function(optionalValue) {
  clog("Current Context");
  clog("====================");
  clog(this);
 
  if (optionalValue) {
    clog("Value");
    clog("====================");
    clog(optionalValue);
  }
});


//  return the first item of a list only
// usage: {{#first items}}{{name}}{{/first}}
Handlebars.registerHelper('first', function(context, block) {
  return block(context[0]);
});



// a iterate over a specific portion of a list.
// usage: {{#slice items offset="1" limit="5"}}{{name}}{{/slice}} : items 1 thru 6
// usage: {{#slice items limit="10"}}{{name}}{{/slice}} : items 0 thru 9
// usage: {{#slice items offset="3"}}{{name}}{{/slice}} : items 3 thru context.length
// defaults are offset=0, limit=5
// todo: combine parameters into single string like python or ruby slice ("start:length" or "start,length")
Handlebars.registerHelper('slice', function(context, block) {
  var ret = "",
      offset = parseInt(block.hash.offset) || 0,
      limit = parseInt(block.hash.limit) || 5,
      i = (offset < context.length) ? offset : 0,
      j = ((limit + offset) < context.length) ? (limit + offset) : context.length;

  for(i,j; i<j; i++) {
    ret += block(context[i]);
  }

  return ret;
});




//  return a comma-serperated list from an iterable object
// usage: {{#toSentence tags}}{{name}}{{/toSentence}}
Handlebars.registerHelper('toSentence', function(context, block) {
  var ret = "";
  for(var i=0, j=context.length; i<j; i++) {
    ret = ret + block(context[i]);
    if (i<j-1) {
      ret = ret + ", ";
    };
  }
  return ret;
});


/* Handlebars Helpers - Dan Harper (http://github.com/danharper) */

/* This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it under the terms of the Do What The Fuck You Want
 * To Public License, Version 2, as published by Sam Hocevar. See
 * http://sam.zoy.org/wtfpl/COPYING for more details. */

/**
 * If Equals
 * if_eq this compare=that
 */
Handlebars.registerHelper('if_eq', function(context, options) {
	if (context == options.hash.compare)
		return options.fn(this);
	return options.inverse(this);
});

/**
 * Unless Equals
 * unless_eq this compare=that
 */
Handlebars.registerHelper('unless_eq', function(context, options) {
	if (context == options.hash.compare)
		return options.inverse(this);
	return options.fn(this);
});


/**
 * If Greater Than
 * if_gt this compare=that
 */
Handlebars.registerHelper('if_gt', function(context, options) {
	if (context > options.hash.compare)
		return options.fn(this);
	return options.inverse(this);
});

/**
 * Unless Greater Than
 * unless_gt this compare=that
 */
Handlebars.registerHelper('unless_gt', function(context, options) {
	if (context > options.hash.compare)
		return options.inverse(this);
	return options.fn(this);
});


/**
 * If Less Than
 * if_lt this compare=that
 */
Handlebars.registerHelper('if_lt', function(context, options) {
	if (context < options.hash.compare)
		return options.fn(this);
	return options.inverse(this);
});

/**
 * Unless Less Than
 * unless_lt this compare=that
 */
Handlebars.registerHelper('unless_lt', function(context, options) {
	if (context < options.hash.compare)
		return options.inverse(this);
	return options.fn(this);
});


/**
 * If Greater Than or Equal To
 * if_gteq this compare=that
 */
Handlebars.registerHelper('if_gteq', function(context, options) {
	if (context >= options.hash.compare)
		return options.fn(this);
	return options.inverse(this);
});

/**
 * Unless Greater Than or Equal To
 * unless_gteq this compare=that
 */
Handlebars.registerHelper('unless_gteq', function(context, options) {
	if (context >= options.hash.compare)
		return options.inverse(this);
	return options.fn(this);
});


/**
 * If Less Than or Equal To
 * if_lteq this compare=that
 */
Handlebars.registerHelper('if_lteq', function(context, options) {
	if (context <= options.hash.compare)
		return options.fn(this);
	return options.inverse(this);
});

/**
 * Unless Less Than or Equal To
 * unless_lteq this compare=that
 */
Handlebars.registerHelper('unless_lteq', function(context, options) {
	if (context <= options.hash.compare)
		return options.inverse(this);
	return options.fn(this);
});

/**
 * Convert new line (\n\r) to <br>
 * from http://phpjs.org/functions/nl2br:480
 */
Handlebars.registerHelper('nl2br', function(text) {
	var nl2br = (text + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
	return new Handlebars.SafeString(nl2br);
});

Handlebars.registerHelper("ensure_string", function(obj) {
	return new Handlebars.SafeString(obj);
});




/*//////////////////////////
Application Specific Helpers
//////////////////////////*/

Handlebars.registerHelper("getclient", function(client_id) {
	
	return App.Models.ClientData[client_id].name;
});


Handlebars.registerHelper("display_from", function(Email) {
	
	return 'From';
});

Handlebars.registerHelper("display_threads_unread_total", function(threads) {
	// Count total unread threads
	var threads = _.filter(threads,function(thread){
		if(!thread.Thread.attributes.read.status){
			return true;
		}
	});
	return threads.length;
});
Handlebars.registerHelper("display_threads_total", function(threads) {
	return threads.length;
});


Handlebars.registerHelper("display_last_message", function(Thread) {
	// Return the latest message (incoming vs. outgoing?)

	var result = '';

	if(typeof Thread.attributes.last_message != 'undefined' && Thread.attributes.last_message !== false){
		// Uses Thread.attributes.last_message
		Thread.attributes.last_message = Thread.attributes.last_message.toString();
		result = new Handlebars.SafeString(Thread.attributes.last_message.substr(0,100));
		result = result.toString();
	}

	if(result.length <= 0){
		result = '[Empty Message]';
	}

	return result;

	// Old version using latest Email

	if(emails.length <= 0){
		return '[Empty Thread]';
	}

	// Received or Sent?
	var email = emails[0];
	var result = _.map(emails);

	var result = '';
	//if(email.attributes.type == 'received' && typeof email.original.TextBody != 'undefined'){
		result = new Handlebars.SafeString(email.original.TextBody.substr(0,100));
		result = result.toString();
	//}
	/*
	if(email.attributes.type == 'sent' && typeof email.original.Text != 'undefined'){
		result = new Handlebars.SafeString(email.original.Text.substr(0,100));
		result = '<i class="icon-arrow-left"></i>' + result.toString();
	}
	*/
	
	if(result.length <= 0){
		result = '[Empty Message]';
	}
	return result;

});


Handlebars.registerHelper("display_last_message_of_email", function(Email) {
	// Return the latest message (incoming vs. outgoing?)

	var result = '';

	clog(Email);

	try {
		return Email.original.ParsedData[0].Data.substr(0,140);
	} catch(err){
		return "...missing email..."
	}

	return result;

});


Handlebars.registerHelper("display_unread_leisure_count", function(number) {
	// Figure out how many unread there are
	if(number > 5){
		return "5<super>+</super>";
	}

	if(number == 0){
		return '';
	}

	return number;

});
Handlebars.registerHelper("display_unread_leisure_count_old", function(threads) {
	// Figure out how many unread there are
	var unread = 0;

	$.each(threads,function(i,Thread){
		if(!Thread.attributes.read.status){
			unread++;
		}
	});

	if(unread > 0){
		return new Handlebars.SafeString('<span class="circle unread"><span>' + unread + '</span></span>');
	} else {
		return '';
	}

});



Handlebars.registerHelper("display_last_thread_monthday", function(datetime) {
	// Return "Sept 1" or similar

	var d = new Date(datetime);

	var month = App.Utils.Date.getMonthAbbr(datetime);

	return month + ' ' + d.getDate();
	
});


Handlebars.registerHelper("display_parsed_text", function(str) {
	result = new Handlebars.SafeString(str);
	result = result.toString();

	return result;
});


Handlebars.registerHelper("display_shorttime", function(varDate) {
	//  Either today's date-time, or Yesterday, or Date

	var now = new Date();
	var yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	//var today = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate();
	
	try {
		var message = new Date(varDate);
		if(message.toString() == 'Invalid Date'){
			message.setISO8601(varDate);
		}
	} catch (e){
		// Failed building date
		return 'faileddate1';
	}

	if(isNaN(message)){
		return 'faileddate2';
	}

	if(now.format('Y-m-d') == message.format('Y-m-d')){
		// Today, Display hours and minutes

		return message.format('h:MM tt');

	} else if(yesterday.format('Y-m-d') == message.format('Y-m-d')) {
		// Display "yesterday"

		return 'Yesterday';

	} else {
		// Display date

		return message.format('mmm d');

	}

});


Handlebars.registerHelper("display_time_detailed", function(varDate) {
	//  Either today's date-time, or Yesterday, or Date

	var now = new Date();
	var yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);

	try {
		var message = new Date(varDate);
		if(message.toString() == 'Invalid Date'){
			message.setISO8601(varDate);
		}
	} catch (e){
		// Failed building date
		return '';
	}

	if(isNaN(message)){
		return '';
	}

	return message.format('mmm d, h:MM tt');

});


Handlebars.registerHelper("display_pretty_headers", function(email) {
	//  Either today's date-time, or Yesterday, or Date

	var headers = {};
	if(email.attributes.type == 'received'){
		headers = email.original.headers;
	}
	if(email.attributes.type == 'sent'){
		headers = {}; // don't save these yet
	}

	var html = '';
	$.each(headers,function(i,v){
		html += "["+i.toString()+"] => " + v.toString();
		html += "\n";
	});

	return html;

});


Handlebars.registerHelper("display_thread_count", function(emails) {
	// Count the threads
	//  - return nothing if == 0
	if(emails.length == 1){
		return '';
	}

	var tmp = '<span class="label label-default">'+emails.length+'</span>';
	return new Handlebars.SafeString(tmp);

});


Handlebars.registerHelper("display_avatar", function(emails) {
	//  Normall we would display the contact's gravatar
	//  - the plugin should handle this
	
	// Just display a single image for now

	if(emails.length <= 0){
		return '';
	}

	// Received or Sent?
	var email_address = '';
	if(emails[0].attributes.type == 'received'){
		email_address = emails[0].original.headers.From;
	}
	if(emails[0].attributes.type == 'sent'){
		email_address = emails[0].original.headers.To;
	}

	if(typeof email_address == "undefined"){
		email_address = '';
	}

	// Object or string?
	if(typeof email_address == 'object'){
		email_address = email_address[1];
	}

	return App.Utils.gravatar(email_address, 30);

});

Handlebars.registerHelper("gravatar_from_email", function(email_address) {
	//  Normall we would display the contact's gravatar
	//  - the plugin should handle this
	
	// Just display a single image for now

	return App.Utils.gravatar(email_address, 30);

});


Handlebars.registerHelper("display_favicon", function(emails) {
	//  Normall we would display the contact's gravatar
	//  - the plugin should handle this
	
	// Just display a single image for now

	if(emails.length <= 0){
		return '';
	}

	// Received or Sent?
	var email_address = '';
	if(emails[0].attributes.type == 'received'){
		email_address = emails[0].original.headers.From;
	}
	if(emails[0].attributes.type == 'sent'){
		email_address = emails[0].original.headers.To;
	}

	if(typeof email_address == "undefined"){
		email_address = '';
	}

	if(typeof email_address == 'object'){
		email_address = email_address[1]; // full email address
	}

	// Sanitize email
	//email_address = email_address.replace(">","");

	var split_url = email_address.split("@");

	// Check validity of split_url
	if(split_url.length != 2){
		return "";
	}

	// Remove some common ones (aol, hotmail), add some less common variations (for companies)
	var split_dots = split_url[1].split('.');

	// Remove any domains that are 3 or less characters (.co.uk)

	// Get last url
	var tmp_url = [];
	for ( var i=1; i<=split_dots.length; i++){
		var last = split_dots[split_dots.length - i]; // can't do split_dots[-1] ?
		if(last > 3){
			// Use this as the domain
			tmp_url.unshift(last);
			break;
		} else {
			tmp_url.unshift(last);
		}
	}

	// Rebuild URL
	var new_url = tmp_url.join('.');

	// Ignoring?
	var ignore = ['aol.com','hotmail.com','gmail.com'];
	if($.inArray(new_url,ignore) != -1){
		return "";
	}

	new_url = 'http://' + new_url;

	var defaulticon = '1pxgif'; // lightpng
	var icon_url = "https://getfavicon.appspot.com/" + encodeURIComponent(new_url) + "?defaulticon="+defaulticon;

	return '<img src="'+icon_url+'" width="16" height="16" />';

});


Handlebars.registerHelper("attachment_small_preview", function(attachment) {
	// Return preview of image
	// - or nothing

	try {
		if(attachment.thumbs.basewidth300){
			return '<img src="'+ attachment.thumbs.basewidth300.path +'" max-width="16" max-height="16" />';
		}
	} catch(err){
		// pass
	}

	return "&nbsp;";

});


Handlebars.registerHelper("display_address_email", function(address) {
	//  Normall we would display the contact's gravatar
	//  - the plugin should handle this
	
	// Just display a single image for now

	if(typeof address == "undefined"){
		address = '';
	}

	if(typeof address == 'object'){
		address = address[1]; // full email address
	}

	return new Handlebars.SafeString(address);
});



Handlebars.registerHelper("display_address_name", function(address) {
	//  Normall we would display the contact's gravatar
	//  - the plugin should handle this
	
	// Just display a single image for now

	if(typeof address == "undefined"){
		address = '';
	}

	if(typeof address == 'object'){
		address = address[0]; // full email address
	}

	return new Handlebars.SafeString(address);
});


Handlebars.registerHelper("display_bodies", function(Email) {
	// Display the first ParsedData entry
	// - hide any additional entries

	var parsedData = Email.original.ParsedData;

	var tmp = '';
	var content = '';

	// Building sections
	// - now incorporates Edited Emails (minimail only)
	var i = 0;
	for (x in parsedData){
		i++;
		content = parsedData[x].Data;
		content = App.Utils.nl2br(content,false);
		if(i == 1){
			try {
				content = Email.AppPkgDevMinimail.textbody_edited;
				content = App.Utils.nl2br(content,false);
			} catch(err){
				
			}
			tmp += '<div class="ParsedDataContent" data-level="'+x+'">'+content+'</div>';
		} else {
			// do the normal thing
			tmp += '<div class="ParsedDataContent" data-level="'+x+'">'+content+'</div>';
		}
	}

	// Clickable selector to see the rest of the conversation
	// - only if the conversation is much longer
	if (i > 1){
		//tmp += '<div class="ParsedDataShowAll"><span>show '+ (i-1) +' previous</span></div>';
		tmp += '<div class="ParsedDataShowAll clearfix"><span class="expander">...</span><span class="edit">E</span></div>';
	}

	return new Handlebars.SafeString(tmp);

});


Handlebars.registerHelper("display_body", function(Email) {
	// Display the first ParsedData entry
	// - hide any additional entries

	var parsedData = Email.original.TextBody;

	return new Handlebars.SafeString(App.Utils.nl2br(Email.original.TextBody));

	var tmp = '';
	var content = '';

	// Building sections
	// - now incorporates Edited Emails (minimail only)
	var i = 0;
	for (x in parsedData){
		i++;
		content = parsedData[x].Data;
		content = App.Utils.nl2br(content,false);
		if(i == 1){
			try {
				content = Email.AppPkgDevMinimail.textbody_edited;
				content = App.Utils.nl2br(content,false);
			} catch(err){
				
			}
			tmp += '<div class="ParsedDataContent" data-level="'+x+'">'+content+'</div>';
		} else {
			// do the normal thing
			tmp += '<div class="ParsedDataContent" data-level="'+x+'">'+content+'</div>';
		}
	}

	// Clickable selector to see the rest of the conversation
	// - only if the conversation is much longer
	if (i > 1){
		//tmp += '<div class="ParsedDataShowAll"><span>show '+ (i-1) +' previous</span></div>';
		tmp += '<div class="ParsedDataShowAll clearfix"><span class="expander">...</span><span class="edit">E</span></div>';
	}

	return new Handlebars.SafeString(tmp);

});


Handlebars.registerHelper("due_ago", function(threadType, varSeconds) {
	//  Total minutes, hours, days ago since varDate

	// Only used for certain types of Threads
	// - different response based on if it is due now, or later

	var now = new Date();
	var now_seconds = parseInt(now.getTime() / 1000);

	var seconds_diff = Math.floor(now_seconds - varSeconds);

	var minute = 60;
	var hour = minute * 60;
	var day = hour * 24;

	// Seconds even defined?
	if(varSeconds == undefined){
		return '';
	}

	var text_result = '';

	if(threadType == 'later'){
		// "due in ..."
		// - different color

		// expecting negative values
		if(seconds_diff > 0){
			// Now
			text_result = 'now';

		} else {
			// Non-negative
			seconds_diff = seconds_diff * -1;

			if(seconds_diff > day){
				// Days
				var days = Math.floor(seconds_diff / day);
				text_result = days + 'd';

			} else if(seconds_diff > hour){
				// Hours
				var hours = Math.floor(seconds_diff / hour);
				text_result = hours + 'h';

			} else if(seconds_diff > minute){
				// Minutes
				var minutes = Math.floor(seconds_diff / minute);
				text_result = minutes + 'm';

			} else {
				// Seconds
				text_result = 'dunno';
			}

		}



	} else if(threadType == 'delayed'){
		// Past due

		if(seconds_diff > day){
			// Days
			var days = Math.floor(seconds_diff / day);
			text_result = days + 'd';

		} else if(seconds_diff > hour){
			// Hours
			var hours = Math.floor(seconds_diff / hour);
			text_result = hours + 'h';

		} else if(seconds_diff > minute){
			// Minutes
			var minutes = Math.floor(seconds_diff / minute);
			text_result = minutes + 'm';

		} else {
			// Seconds
			text_result = 'now';
		}

	} else {
		// Do nothing
	}

	return new Handlebars.SafeString(text_result); // no icon-time
	// return new Handlebars.SafeString(text_result + '<i class="icon-time"></i>');
});


Handlebars.registerHelper("daysago", function(varDate) {
	//  Total days since between the suppled date and today

	var now = new Date();
	var now_seconds = now.getTime() / 1000;
	var now_in_days = ((now_seconds / 60) / 60) / 24;

	varDate_seconds = varDate / 1000; 
	var varDate_in_days = ((varDate_seconds / 60) / 60) / 24;

	var difference = Math.floor(now_in_days - varDate_in_days);

	return difference;
});


Handlebars.registerHelper("thread_participants_pretty", function(emails) {
	// Return (pretty) names of participants

	var all_names = [];
	_.each(emails,function(email, j){

		// Received or Sent?
		var email_address = '';
		
		// Doesn't matter, just summarize everybody
		var to_search = ['From','To','Reply-To'];

		var names = [];
		_.each(to_search,function(search_val, i){
			var tmp = search_val + '_Parsed';
			if(typeof email.original.headers[tmp] == 'undefined'){
				return;
			}
			// Parse search values
			_.each(email.original.headers[tmp],function(person, k){
				var name = person[0];
				var email = person[1];

				var tmp_isme = false;
				_.each(App.Data.UserEmailAccounts.toJSON(),function(acct, l){
					if(acct.email == email){
						tmp_isme = true;
					}
				});

				if(tmp_isme){
					if(search_val == 'To'){
						return;
					}
					all_names.push('Me');
					return;
				}

				if(name.length < 1 || name.length > 50){
					// clog('Too short, or too long of name');
					// clog(name);
					all_names.push('unknown');
					return;
				}
				all_names.push(name);
			});
		});

	});

	all_names = _.uniq(all_names);

	return all_names.join(', ');

});


Handlebars.registerHelper("email_participants_pretty", function(email) {
	// Return (pretty) names of participants

	var all_names = [];

	// Received or Sent?
	var email_address = '';
	
	// Doesn't matter, just summarize everybody
	var to_search = ['From','To','Reply-To'];

	var names = [];
	_.each(to_search,function(search_val, i){
		var tmp = search_val + '_Parsed';
		if(typeof email.original.headers[tmp] == 'undefined'){
			return;
		}
		// Parse search values
		_.each(email.original.headers[tmp],function(person, k){
			try {
				var name = person[0];
				var email = person[1];

				var tmp_isme = false;
				_.each(App.Data.UserEmailAccounts.accounts,function(acct, l){
					if(acct.email == email){
						tmp_isme = true;
					}
				});

				if(tmp_isme){
					if(search_val == 'To'){
						return;
					}
					all_names.push('Me');
					return;
				}

				if(name.length < 1 || name.length > 50){
					// clog('Too short, or too long of name');
					// clog(name);
					all_names.push('unknown');
					return;
				}
				all_names.push(name);
			} catch(err){
				// Failed finding, return unknown
				all_names.push('unknown');
			}
		});
	});


	all_names = _.uniq(all_names);

	return all_names.join(', ');

});


Handlebars.registerHelper("prettydate", function(v, format) {
	//  Either today's date-time, or Yesterday, or Date

	format = format || 'ddd, MMMM d, yyyy';
	var tmp = new Date(v);
	return tmp.toString(format)

});


Handlebars.registerHelper("thread_from_pretty", function(email) {
	// SAME AS ABOVE (just outside $.each removed)

	var all_names = [];

	// Received or Sent?
	var email_address = '';
	
	// Doesn't matter, just summarize everybody
	var to_search = ['From'];

	_.each(to_search,function(search_val, i){
		var tmp = search_val + '_Parsed';
		if(typeof email.original.headers[tmp] == 'undefined'){
			return;
		}
		// Parse search values
		_.each(email.original.headers[tmp],function(person, k){
			var name = person[0];
			var email = person[1];

			var tmp_isme = false;
			_.each(App.Data.UserEmailAccounts.accounts,function(acct, l){
				if(acct.email == email){
					tmp_isme = true;
				}
			});

			if(tmp_isme){
				if(search_val == 'To'){
					return;
				}
				all_names.push('Me');
				return;
			}

			if(name.length < 1 || name.length > 50){
				// clog('Too short, or too long of name');
				// clog(name);
				all_names.push('unknown');
				return;
			}
			all_names.push(name);
		});
	});


	all_names = _.uniq(all_names);

	return all_names.join(', ');

});


Handlebars.registerHelper("thread_snippet", function(email) {
	
	return email.Entity.snippet;
});


Handlebars.registerHelper("thread_subject", function(subject) {
	subject = $.trim(subject);
	if(subject.length < 1){
		subject = '[Empty Subject]';
	}
	return new Handlebars.SafeString(subject);

});


Handlebars.registerHelper("format_text_body", function(TextBody) {
	// Return a valid FromAddress
	// - this should actually already be parsed out by the server when it gets the message/thread :(

	// Else, return 
	return new Handlebars.SafeString(TextBody.toString().replace(/(\r\n|\r|\n)/g, "<br />"));

});


Handlebars.registerHelper("ifSocialAllowed", function(typeId, fn, elseFn) {
	// Doesn't work, not sure how to pass in values as an array!
	// - seems to only accept strings? Should I stringify them?
	
	var allowed = ['klout','facebook','quora','plancast','vimeo','twitter','flickr'];

	if ($.inArray(typeId,allowed)){
		return fn(this);
	} else if(elseFn != undefined) {
		return elseFn(this);
	} else {
		return null;
	}
});


Handlebars.registerHelper("contactPhotoSmall", function(photos) {
	//  Return a single image, ideally from Facebook

	var photo_url = false;

	_.each(photos,function(photo, i){
		if(photo_url !== false){
			// Already got photo
			return;
		}
		if(photo.typeId == 'facebook' && photo.isPrimary){
			fb = true;
			photo_url = photo.url;
		}
	});

	// Check Twitter
	if(photo_url !== false){
		_.each(photos,function(photo, i){
			if(photo.typeId == 'twitter'){
				photo_url = photo.url;
			}
		});
	}

	var img = '<img src="' + photo_url + '" width="50px" height="50px" />';
	return new Handlebars.SafeString(img);

});



Handlebars.registerHelper("inbox_zero_words", function() {
	
	// Words/phrases to choose from
	// - html ok
	var words = ['Fuck Yeah', 
				'Believe It.', 
				'Solid.',
				'Once Again!',
				'Noice',
				'Inbox: 0']; // get clever

	return words[Math.floor(Math.random()*words.length)];
});



Handlebars.registerHelper("testing", function(data) {
	
	clog(data[''].snippet)
});

/* My old version, somebody might have made a better one above
Handlebars.registerHelper("nl2br", function(str, is_xhtml) {
	// http://kevin.vanzonneveld.net
	// - nl2br() => php.js
	var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br ' + '/>' : '<br>';
	return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
});
*/


Handlebars.registerHelper("emailbox_image_src", function(path, fn) {
  var buffer = "";

  buffer = App.Credentials.s3_bucket + path;

  return buffer;

});






