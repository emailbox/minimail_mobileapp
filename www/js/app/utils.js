App.Utils = {

	Notification: {

		debug: {

			create: function(text){
				// Create an event
				var key = App.Utils.guid();
				var datetime = new Date();

				App.Data.debug_messages[key] = {
					text: text,
					datetime: datetime
				};

				App.Events.trigger('debug_messages_update',true);

				// At most, show it for 30 seconds before removing
				window.setTimeout(function(){
					if(App.Data.debug_messages[key]){
						// Stil exists
						App.Utils.Notification.debug.temp('Bad: ' + App.Data.debug_messages[key].text);
						App.Utils.Notification.debug.remove(key);
					}
				}, 30000);

				return key;
			},

			remove: function(key){
				// Remove an item from the list of debug messages
				// - likely finished the network action

				// clog('remove');
				if(App.Data.debug_messages[key]){
					delete App.Data.debug_messages[key];
				}
				// clog(App.Data.debug_messages);

				App.Events.trigger('debug_messages_update',true);

			},

			temporary: function(message){
				var tmp_key = App.Utils.Notification.debug.create(message);
				window.setTimeout(function(){
					App.Utils.Notification.debug.remove(tmp_key);
				},3000);
			},
			temp: function(message){
				return App.Utils.Notification.debug.temporary(message);
			}

		},

		toast: function(message){

			var toast = new App.Views.Toast({
				message: message
			});
			toast.render();
		},

		create: function(opts){

			var dfd = $.Deferred();

				opts = $.extend({
					title: 'Title',
					text: 'Message',
					success: function(){},
					error: function(content){}
				},opts);

				// Quick prompt
				if(useForge){
					forge.notification.create(opts.title,opts.text,opts.success,opts.error);
				} else {
					// Notifications not on browser yet
					// - todo...
				}

			return dfd.promise();

		}
	},

	Storage: {
		// Always use a promise

		get: function(key, namespace){
			namespace = (namespace != undefined) ? namespace.toString() + '_' : false || '_';
			// console.log('using ns');
			// console.log(namespace);
			key = key.toString();

			var dfd = $.Deferred();

			if(useForge){

				forge.prefs.get(key,function(value){

					try {
						value = JSON.parse(value);
					} catch(err){
						dfd.resolve(null);
						return;
					}

					dfd.resolve(value);

				},
				function(error){
					dfd.resolve(null);
				});

			} else {

				// Open database
				// - switch Phonegap/cordova to Database instead of localStorage?
				// - persistent? 
				// var dbShell = window.openDatabase('minimail', "1.0", database_displayname, "Minimail", 1000000);
				
				setTimeout(function(){
					var value = window.localStorage.getItem(namespace + key);

					try {
						value = JSON.parse(value);
					} catch(err){
						dfd.resolve(null);
						return;
					}

					dfd.resolve(value);

				},1);

			} 

			return dfd.promise();

		},

		set: function(key, value, namespace){
			namespace = (namespace != undefined) ? namespace + '_' : false || '_';
			key = key.toString();

			var dfd = $.Deferred();

			if(useForge){
				
				forge.prefs.set(key, JSON.stringify(value), function(){
					// App.Events.trigger('saveAppDataStore');
					dfd.resolve(true);

				},
				function(error){
					clog('set error');
					clog('key: ' + key);
					clog(error);
					dfd.resolve(null);
				});

			} else {

				setTimeout(function(){

					try {
						var tmp = window.localStorage.setItem(namespace + key, JSON.stringify(value));
					} catch(err){

						// if (err.name === 'QUOTA_EXCEEDED_ERR' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
						console.warn('over quota');
						if ( err.name.toUpperCase().indexOf('QUOTA') >= 0 ) {
							console.log('yes over');
							// Exceeded localStorage cache
							// - like to use something beside localStorage anyways

							// Flush things we don't need anymore
							App.Utils.Storage.flush()
								.then(function(){
									// Should have room now
									console.warn('trying again');
									// Try again
									// - if failed trying again, then just give up and resolve as False
									try {
										var tmp = window.localStorage.setItem(namespace + key, JSON.stringify(value));
									} catch(err){
										// Reject promise
										dfd.reject(tmp);
										return;
									}

								});

							return;

						}

						// Other error

						// Reject promise
						dfd.reject(tmp);
						return;

					}
					
					// Resole with result of cache
					dfd.resolve(tmp);

				},1);

			}

			return dfd.promise();
		},

		flush: function(){
			// Flushes all non-important values out of the cache
			// - simplest way to do it for now

			console.log('flushing');

			var dfd = $.Deferred();

			if(useForge){

			} else {
				// Get latest values

				try {
					setTimeout(function(){
						var i, key, remove = [];
						for (i=0; i < window.localStorage.length ; i++) {
							key = localStorage.key(i);
							if (key.indexOf('critical_') !== 0) {
								// console.info(key);
								remove.push(key);
							}
						}
						for (i=0; i<remove.length; i++){
							// console.log(3);
							window.localStorage.removeItem(remove[i]);
						}
						// Resolve after completed
						dfd.resolve(true);
					}, 1);
				} catch(err){
					console.error(err);
				}

				
			}


			return dfd.promise();

		}

	},

	Validate: {

		email: function(email_address){
			if (/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(email_address)){
				// Passed validation
				return true;
			} else {
				return false;
			}
		}

	},

	BackButton: {
		newEnforcer: function(func){
			// Bubble a new function to BackButton
			var key = App.Utils.guid();
			App.Data.backbutton_functions.unshift({
				key: key,
				func: func
			});

			return key;

		},
		debubble: function(key){

			// Remap without key
			App.Data.backbutton_functions = _.filter(App.Data.backbutton_functions,function(item){
				return item.key != key;
			});

			return;

		}
	},

	WatchCustomTap : function($elem){
		// Watch an element for a custom tap event
		// - emits longtap or shorttap

		// Starting
		$elem.on('touchstart',function(e){
			$(this).addClass('touch_start');
			$(this).attr('finger-time',new Date().getTime());
		});

		// Moving Around
		$elem.on('touchmove',function(e){

		});

		// Ending
		$elem.on('touchend',function(e){
			// Also fires when you leave the element?
			// - want to prevent it from firing on drag
			if(!$(this).hasClass('touch_start')){
				// Never started touching?
				alert('no touch_start');
				return;
			}

			$(this).removeClass('touch_start');

			// See if outside our element
			var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
			var elm = $(this).offset();
			var x = touch.pageX - elm.left;
			var y = touch.pageY - elm.top;
			if(x < $(this).width() && x > 0){
				if(y < $(this).height() && y > 0){
					// Inside our element still
					
					// Get time difference
					var newTime = new Date().getTime();
					var elapsed = newTime - parseInt($(this).attr('finger-time'));
					if(elapsed < 100){
						$(this).trigger('shorttap');
					} else {
						$(this).trigger('longtap');
					}

				}
			}
			


		});

	},

	MD5 : function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]|(G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()},

	S4: function() {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	},

	guid: function() {
		return (App.Utils.S4()+App.Utils.S4()+"-"+App.Utils.S4()+"-"+App.Utils.S4()+"-"+App.Utils.S4()+"-"+App.Utils.S4()+App.Utils.S4()+App.Utils.S4());
	},

	// copy
	cp: function(old_obj){
		var tmp = JSON.stringify(old_obj);
		if(typeof(tmp) == "undefined"){
			return null;
		}
		return JSON.parse(tmp);
	},

	Date: {
			getMonthAbbr: function(datetime_obj){
				// Must already be a datetime_obj
				var d=new Date(datetime_obj);
				var month=new Array();
				month[0]="Jan";
				month[1]="Feb";
				month[2]="Mar";
				month[3]="Apr";
				month[4]="May";
				month[5]="Jun";
				month[6]="Jul";
				month[7]="Aug";
				month[8]="Sept";
				month[9]="Oct";
				month[10]="Nov";
				month[11]="Dec";
				var n = month[d.getMonth()];
				return n;
			}
	},

	// Compile a Handlebars Template
	template: function (elem_id){
		
		var source = $('#'+elem_id).html();
		
		var template = Handlebars.compile(source);

		return template;
	},


	toast: function(message){
		// Show a simple Toast message

		var toast = new App.Views.Toast({
			message: message
		});
		toast.render();

	},


	get_point_position: function(e){
		// Returns current (or last known) X,Y coordinates of a mouse or finger
		var point_x = 0,
			point_y = 0;

		// Get positions
		
		if(typeof e.pageX != 'undefined'){
			// Mouse
			
			point_x = e.pageX;
			point_y = e.pageY;
			
		} else {
			// Touch
			
			// Only 1 finger allowed
			if(e.originalEvent.touches.length != 1){
				// Multiple fingers

				// Did we recently have 1 finger on there?
				if(e.originalEvent.changedTouches.length == 1){
					point_x = e.originalEvent.changedTouches[0].pageX;
					point_y = e.originalEvent.changedTouches[0].pageY;
				} else {
					return {};

				}

			} else {
				point_x = e.originalEvent.touches[0].pageX;
				point_y = e.originalEvent.touches[0].pageY;
			}

		}

		return {
			x: point_x,
			y: point_y
		};
	},


	fake_image: function(){
		// Give fake images for requested placeholders
		$('.fake_image').each(function(i,v){
			if(!$(this).attr('data-size').length){
				return;
			}
			var s = $(this).attr('data-size');
			var tmp = s.split('x');
			$(this).css('width',tmp[0] + 'px');
			$(this).css('height',tmp[1] + 'px');
		});
	},

		// MD5 (Message-Digest Algorithm) by WebToolkit
	// http://www.webtoolkit.info/javascript-md5.html
	 
	
	gravatar: function (email,size){
		var size = size || 80;
		var alt = encodeURI('www.gravatar.com/avatar/00000000000000000000000000000000?d=mm');
		return 'http://www.gravatar.com/avatar/' + App.Utils.MD5(email) + '.jpg?s=' + size + '&d='+alt;
	},


	urldecode: function(url){
		return decodeURIComponent((url+'').replace(/\+/g, '%20'));
	},


	// Sort by ASC, DESC, on a pre-defined field in an obj
	sortBy: function (in_opts){

		var defaults = {
			arr: [],
			path: 'attributes.value',
			direction: 'asc', // desc
			type: 'number',
			model: false
		};

		opts = $.extend(defaults,in_opts);

		// arr: the stuff we're sorting
		// path: the object path to sort based on
		//		- not sure how to actually do this? (could just only allow first-level elements to be named? That doesn't work where cuz Thread.latest..)
		// direction: 'asc' or 'desc'
		// type: of sorting to do (number, string, date, auto)

		direction = $.trim(opts.direction.toLowerCase());
		type = $.trim(opts.type.toLowerCase());

		// Determine what type is (if auto)
		if(type == undefined || type == null || type == 'auto' || type == 'num'){
			type = 'number';
		}

		// If path == null, then don't sort on a path?
		// - automatically happens by skipping $.each (below)

		path = opts.path.split('.');
		// clog('path');
		// clog(path);

		// Put humptydumpty back together
		// - [ and ] designate start/end
		var to_unset = [];
		var waiting_for_end = false;
		var extended_string = [];
		// $.each(path,function(i,v){
		// 	if(v.substr(0,1) == '['){
		// 		// Count until the next ']' in this array
		// 		// - could also do some recursion if I get bored, depths of "["
		// 		waiting_for_end = true;
		// 		extended_string = [];
		// 		extended_string.push(v.substr(1));
		// 		to_unset.push(i);
		// 	} else if(waiting_for_end && v.substr(-1,1) == ']'){
		// 		// End is here

		// 		waiting_for_end = false;
		// 		extended_string.push(v.substr(0,v.length - 1));

		// 		path[i] = extended_string.join('.');

		// 	} else if(waiting_for_end) {
		// 		// Need to add to_unset and extended_string
		// 		extended_string.push(v.substr(0,v.length - 1));
		// 		to_unset.push(i);
		// 	} else {
		// 		// everything else is normal
		// 	}
		// });
		$.each(path,function(i,v){
			if(v.substr(0,1) == '['){
				path[i] = parseInt(v.substr(1,v.length - 2));
			}
		});
		// $.each(to_unset,function(u_i,u_v){
		// 	clog('unset');
		// 	clog(u_v);
		// 	path.splice(u_v,1);
		// });
		// clog(extended_string);

		// If not an array, convert to one
		var tmp = [];
		if(typeof(opts.arr) != 'array'){
			// iterate through and convert to an array
			$.each(opts.arr,function(i,v){
				tmp.push(v);
			});
			// reset to original obj
			opts.arr = tmp;
		}

		if(opts.arr.toString != '[object Array]'){
			opts.arr = _.map(opts.arr,function(v){
				return v;
			});
		}

		if(direction == 'asc' || direction == 'desc'){
			// Can I pass things into this array?
			// - basic scope question for Robert

			opts.arr.sort(function(a,b){

				// Turn a model into valid paths
				if(opts.model){
					a = _.clone(a.attributes);
					b = _.clone(b.attributes);
				}

				// Convert the path into something useful
				var validPaths = true;
				$.each(path,function(i,v){
					if(typeof a == 'undefined' || typeof b == 'undefined'){
						// missing path
						clog('missing path for variable');
						validPaths = false;
						return;
					}

					// Continue down path
					a = a[v];
					b = b[v];

				});

				// Invalid paths, return a tie
				if(validPaths === false){
					return 0;
				}

				// Sort by correct type
				if(type == 'date' || type == 'datetime' || type == 'time'){
					var a_tmp = new Date(a);
					var b_tmp = new Date(b);

					// Try iso dates
					if(a_tmp.toString() == 'Invalid Date'){
						a_tmp.setISO8601(a);
					}
					if(b_tmp.toString() == 'Invalid Date'){
						b_tmp.setISO8601(b);
					}

					a_tmp = a_tmp.getTime();
					b_tmp = b_tmp.getTime();
				}
				if(type == 'number' || type=='num'){
					var a_tmp = a;
					var b_tmp = b;
				}
				if(type == 'string'){
					var a_tmp = a;
					var b_tmp = b;
				}

				// clog('a,b');
				// clog(a_tmp + ',' + b_tmp);
				// clog(path);
				// clog();
				
				if(a_tmp > b_tmp){
					return direction == 'asc' ? -1 : 1;
				} else if(a_tmp < b_tmp){
					return direction == 'asc' ? 1 : -1;
				} else {
					// Equal
					return 0;
				}

			});

		} else {
			clog('Sorting without asc or desc');
		}

		return opts.arr;

	},

	base64: {

		encode: function(text){
			return $.base64.encode(text);
		},

		decode: function(text){
			return $.base64.decode(text);
		}

	},

	getUrlVars: function(full_url){
		if(!full_url){
			full_url = window.location.href;
		}
		var vars = [], hash;
		var hashes = full_url.slice(full_url.indexOf('?') + 1).split('&');
		for(var i = 0; i < hashes.length; i++)
		{
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
	},

	getOAuthParamsInUrl: function(url){
			
		var queryString = location.hash.substring(1); // remove "#"
		if(url){
			var tmp = document.createElement('a');
			tmp.href = url;
			queryString = tmp.hash.substring(1); // remove "#"
		}

		var oauthParams = {},
			regex = /([^&=]+)=([^&]*)/g,
			m;

		while (m = regex.exec(queryString)){
			oauthParams[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
		}

		return oauthParams;
	},

	nl2br: function(str, is_xhtml) {
		// http://kevin.vanzonneveld.net
		// - nl2br() => php.js
		var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br ' + '/>' : '<br>';
		return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
	},

	extract: {
		
		PhoneNumber: function(haystack_array) {
			//purpose:
			// extracts the first phone number found in haystack, returns false if none are found.
			//args: haystack = string that may contain phone number
			//returns:
			//phone number (string), formatted as xxx-xxx-xxxx, false if no number found

			var phones = [];

			if(typeof(haystack_array) !== 'object'){
				haystack_array = [haystack_array];
			}

			for (x in haystack_array){
				var haystack = haystack_array[x];

				if (typeof haystack !== 'string') {
					return false;
				}
				var phone_regex1 = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/;
				var phone_regex2 = /(\d{1}\s\(\d{3}\)\s\d{3}-\d{4})/;
				var phone_regex3 = /^(1\s*[-\/\.]?)?(\((\d{3})\)|(\d{3}))\s*[-\/\.]?\s*(\d{3})\s*[-\/\.]?\s*(\d{4})\s*(([xX]|[eE][xX][tT])\.?\s*(\d+))*$/;
				var phone_regex4 = /(((\(\d{3}\)|\d{3})[-\s]*)?\d{3}[-\s]*\d{4}|\d{10}|\d{7})/;
				//hack: facebook sometimes formats phone numbers as 1 (555) 555-5555 which is not matched by the first regex


				phone1 = phone_regex1.exec(haystack);
				phone2 = phone_regex2.exec(haystack);
				phone3 = phone_regex3.exec(haystack);
				phone4 = phone_regex4.exec(haystack);

				phones = phones.concat(phone1,phone2,phone3,phone4);

			}

			// Normalize the phone numbers
			phones = _.uniq(phones);
			phones = _.without(phones,null,undefined,"");

			$.each(phones,function(i,phone){

				// Must be above a certain length (6 chars)
				if(phone.length < 7){
					delete phones[i];
				}

			});

			return phones;

		},
	
		Shipping: function(haystack_array) {
			//purpose:
			// extracts the first phone number found in haystack, returns false if none are found.
			//args: haystack = string that may contain phone number
			//returns:
			//phone number (string), formatted as xxx-xxx-xxxx, false if no number found
			
			// http://answers.google.com/answers/threadview/id/207899.html

			var shipping = [];
			var found_numbers = [];

			if(typeof(haystack_array) !== 'object'){
				haystack_array = [haystack_array];
			}

			for (x in haystack_array){
				var haystack = haystack_array[x];

				if (typeof haystack !== 'string') {
					return false;
				}

				var carriers = {
					'ups' : {
						'name' : 'UPS',
						'regex' : [ /\b(1Z ?[0-9A-Z]{3} ?[0-9A-Z]{3} ?[0-9A-Z]{2} ?[0-9A-Z]{4} ?[0-9A-Z]{3} ?[0-9A-Z]|[\dT]\d\d\d ?\d\d\d\d ?\d\d\d)\b/ ]
					},
					'fedex' : {
						'name' : 'FedEx',
						'regex' : [ /(\b96\d{20}\b)|(\b\d{15}\b)|(\b\d{12}\b)/,
									/\b((98\d\d\d\d\d?\d\d\d\d|98\d\d) ?\d\d\d\d ?\d\d\d\d( ?\d\d\d)?)\b/,
									/^[0-9]{15}$/
									]
					},
					'usps' : {
						'name' : 'USPS',
						'regex' : [ /^E\D{1}\d{9}\D{2}$|^9\d{15,21}$/,
									/^91[0-9]+$/,
									/^[A-Za-z]{2}[0-9]+US$/
									]
					}
				};

				// Run regex

				$.each(carriers,function(i,carrier){
					// Run regex against the haystack
					$.each(carrier['regex'],function(i,regex){
						var tracking_nums = regex.exec(haystack);
						
						if(typeof tracking_nums === 'object' && tracking_nums != null){

							// Remove bad entries
							tracking_nums = _.uniq(tracking_nums);
							tracking_nums = _.without(tracking_nums,null,undefined,"");

							$.each(tracking_nums,function(i,tracking_num){ 
								// Already found that num?
								if($.inArray(tracking_num,found_numbers) == -1){
									// Not found

									// Add to shipping
									shipping.push({
										'number' : tracking_num,
										'service' : carrier['name'],
										'url' : '#'
									});
									found_numbers.push(tracking_num);
								}
							});
						}

					});
				});

			}

			return shipping;

		}

	}, 

	explore: function(obj){

		Api.search({
			data: {
				'model' : obj.model,
				'fields' : [],
				'conditions' : {
					'_id' : obj._id
				},
				'limit' : 1
			},
			success: function(response){

				// Parse
				try {
					var json = $.parseJSON(response);
				} catch (err){
					alert("Failed parsing JSON");
					return;
				}

				// Check the validity
				if(json.code != 200){
					// Expecting a 200 code returned
					clog('200 not returned');
					return;
				}

				// 1 entry?
				if(json.data.length != 1){
					alert('Had trouble gathering info');
					return;
				}

				// Get the Email data
				var data = json.data[0];

				// Remove any previous version
				$('#modalExplorer').remove();

				var template = App.Utils.template('t_modal_explorer');
				$('body').append(template());
				
				//response = {"hello" : "hi"};
				JSONFormatter.format(data, {'appendTo' : '#modalExplorer',
											'collapse' : true});

				$('#modalExplorer').modal();

				// Getting path to highlighted element
				
				$('#modalExplorer .key').each(function(i,that){
					var paths = [];
					$($(that).parents('ul:not(#json)').get().reverse()).each(function(i,elem){
						paths.push($(elem).parent().find('> span.key').text());
					});
						
					var path;

					if(paths.length == 0){
						path = $(that).text();
					} else {
						path = paths.join('.');
						path += '.' + $(that).text();
					}

					$(that).attr('title',path);

				});

				$('#modalExplorer .key').after('<span class="colon">:</span>');

				$('#modalExplorer .key').tooltip();
				

			}
		});
	},

	exploreModal: function(opts){
		$('#mainModal').modal(opts)
	},

	noty: function(opts){

		// Would be fun to use http://soulwire.github.com/Makisu/

		var defaults = {

			text: "",
			layout: 'topRight',
			type: 'alert',
			timeout: 5000, // delay for closing event. Set false for sticky notifications
			closeWith: ['click'], // ['click', 'button', 'hover']
			animation: {
				open:{
					opacity: "toggle"
				},
				close:{
					opacity: "toggle"
				},
				easing:'swing',
				speed:500
			}
		};

		opts = $.extend(defaults,opts);

		return noty(opts);

	},

	reloadApp: function(){
		// Reload the page
		window.location = [location.protocol, '//', location.host, location.pathname].join('');
		
	}

	// https://github.com/collective/icalendar/blob/master/src/icalendar/parser.py
	// def q_split(st, sep=','):
	// 	"""
	// 	Splits a string on char, taking double (q)uotes into considderation
	// 	>>> q_split('Max,Moller,"Rasmussen, Max"')
	// 	['Max', 'Moller', '"Rasmussen, Max"']
	// 	"""
	// 	result = []
	// 	cursor = 0
	// 	length = len(st)
	// 	inquote = 0
	// 	for i in range(length):
	// 		ch = st[i]
	// 		if ch == '"':
	// 			inquote = not inquote
	// 		if not inquote and ch == sep:
	// 			result.append(st[cursor:i])
	// 			cursor = i + 1
	// 		if i + 1 == length:
	// 			result.append(st[cursor:])
	// 	return result

	// def q_join(lst, sep=','):
	// 	"""
	// 	Joins a list on sep, quoting strings with QUOTABLE chars
	// 	>>> s = ['Max', 'Moller', 'Rasmussen, Max']
	// 	>>> q_join(s)
	// 	'Max,Moller,"Rasmussen, Max"'
	// 	"""
	// 	return sep.join([dQuote(itm) for itm in lst])


}



////////////////////////////////////
// API calls
////////////////////////////////////

var Api = {

	defaults: {
			cache: false,
			type: 'POST',
			data: '',
			dataType: 'html',
			contentType: "application/json; charset=utf-8"
	},

	queue: $.manageAjax.create('cacheQueue', {
		queue: true, 
		cacheResponse: false
	}),

	search: function(queryOptions, cacheOptions){
		// Gather multiple requests in a 100ms window into a single request
		// - needs to be really quick at switching?

		var dfd = $.Deferred();

		if(App.Data.timer){
			// already started timer
			// - add to current bucket
			
			App.Data.timerBucket.push([dfd, queryOptions]);

		} else {

			// Start timer
			App.Data.timer = 1;
			App.Data.timerBucket = [];

			App.Data.timerBucket.push([dfd, queryOptions]);

			// Start waiting period for new searchOptions
			setTimeout(function(){
				// Turn off timer
				App.Data.timer = 0;

				// Clone timer bucket
				var searchesToRun = App.Data.timerBucket.splice(0);

				// Create search query
				// - iterate through each possible query
				var searchData = {};
				var searchQueryOptions = {
					data: {
						type: "multi",
						searches: {} // object
					},
					success: function(response){
						response = JSON.parse(response);

						// query has returned
						// - parse out the deferreds according to the indexKey

						// resolve each dfd accordingly

						_.each(response.data, function(elemData, idx){
							// idx refers to the index of the searchesToRun
							// console.log('elemData');
							// console.log(elemData);

							// Resolve
							searchesToRun[idx][0].resolve(elemData);

							// Call success function
							// console.log(searchesToRun[idx]);
							searchesToRun[idx][1].success(JSON.stringify(elemData));

						});

					}
				};
				_.each(searchesToRun, function(search, idx){
					// search[0] = dfd, search[1] = queryOptions

					searchQueryOptions.data.searches[idx] = search[1].data;
				});

				// Run query
				Api.query('/api/search',searchQueryOptions);

			}, 100);

		}

		// Return a deferred
		return dfd.promise();

		// // Normal search query
		// return Api.query('/api/search',queryOptions);

	},

	count: function(queryOptions){

		return Api.query('/api/count',queryOptions);

	},

	update: function(queryOptions){

		return Api.query('/api/update',queryOptions);

	},

	write: function(queryOptions){

		return Api.query('/api/write',queryOptions);

	},

	write_file: function(queryOptions){

		return Api.query('/api/write/file',queryOptions);

	},

	remove: function(queryOptions){

		return Api.query('/api/remove',queryOptions);

	},

	event: function(queryOptions){

		// Start listeners
		// var _return = Api.query('/api/event',queryOptions);

		// Chain to _return

		// console.log(JSON.stringify(queryOptions.data));

		// Want responses? 
		if(queryOptions.response){

			// overwrite the success function with our own
			queryOptions._success = queryOptions.success || null;

			queryOptions.success = function(bodyResponse){

				responseObj = JSON.parse(bodyResponse);
				var event_id = responseObj.data.event_id;

				// Iterate over response listeners to create
				$.each(queryOptions.response,function(pkg,callback){
					Api.Event.on({
						event: queryOptions.data.event + ".Response"
					},function(result){
						// Check for package match
						if(result.type == 'response' && result.data.response_to == event_id){

							// Any or specific
							if(result.data.app  == pkg || result.data.app  == 'any'){
								// Handle any response
								// clog('callback');
								callback(result.data); // only return the result.data
								return;
							}

							// All (mapreduce?)
							// - todo...

						}
						
					});
				});

				// call the old success function
				if(queryOptions._success != null){
					clog('called _success');
					queryOptions._success.call(bodyResponse);
				}

			}

			return Api.query('/api/event',queryOptions);

		} else {

			// Normal
			return Api.query('/api/event',queryOptions);

		}

	},

	event_remove: function(queryOptions){
		// Requires: event_id
		return Api.query('/api/event/remove',queryOptions);

	},

	query: function(url,queryOptions){
		// Almost the exact same as Api.search

		var use_queue = false;
		if(typeof queryOptions.queue == 'boolean'){
			use_queue = queryOptions.queue;
			delete queryOptions.queue;
		}

		var queryDefaults = {
			data: {},
			headers: {
				"Content-Type" : "application/json"
			},
			success: function(response){
				clog('API request succeeded');
				// clog(response);
			},
			error: function(e){
				// Not logged in?
				clog('API failed');
				// e = JSON.parse(e);
				if(e.code == 401){
					// Fully logout
					Backbone.history.loadUrl('logout');
				}
			}
		};
		
		// Merge query options together
		queryOptions = $.extend(queryDefaults,queryOptions);

		// Modify the success and error functions to handle the debug_messages
		var queryOptionsBase = $.extend({},queryOptions);

		var debug_message = '';
		switch(url){
			
			case '/api/event':
				debug_message = url + ': ' + queryOptions.data.event;
				break;

			case '/api/event/remove':
				debug_message = url + ': ' + queryOptions.data.event_id;
				break;

			case '/api/search':
				if(queryOptions.data.type && queryOptions.data.type == 'multi'){
					// multiple
					// - see if all one type?
					debug_message = url + ': ' + 'multiple';
				} else {
					// normal, with model
					debug_message = url + ': ' + queryOptions.data.model;
				}
				break;

			default: 
				debug_message = url + ': ' + queryOptions.data.model;
				break;
		}
		var k = App.Utils.Notification.debug.create(debug_message);
		queryOptions.success = function(response){
			// Remove debug message
			App.Utils.Notification.debug.remove(k);

			// Continue with response
			// - should be using context or .apply(this...) ?
			clog(queryOptionsBase);
			queryOptionsBase.success.call(this,response);
		};
		queryOptions.error = function(response){
			// Remove debug message
			App.Utils.Notification.debug.remove(k);

			// Continue with response
			// - should be using context or .apply(this...) ?
			clog(queryOptionsBase);
			queryOptionsBase.error.call(this,response);
		};

		// Check online status
		if(!App.Data.online){
			window.setTimeout(function(){
				queryOptions.error.call('Not connected to internet')
			},1);
			App.Utils.Notification.toast('Not connected to the internet');
			return;
		}

		// Merge data with auth
		var data = $.extend({},queryOptions.data);
		queryOptions.data = {
							auth: {
									app: App.Credentials.app_key,
									access_token: App.Credentials.access_token
								},
							data: data
							};

		queryOptions.data = JSON.stringify(queryOptions.data);
		
		if(url == '/api/search'){
			url = App.Credentials.base_api_url + url;
		} else {
			url = App.Credentials.base_api_url + url;
		}

		var ajaxOptions = $.extend(Api.defaults, {url: url});

		ajaxOptions = $.extend(ajaxOptions, queryOptions);

		use_queue = false;
		if(use_queue){
			return Api.queue.add(ajaxOptions);
		} else {

			return $.ajax(ajaxOptions); // promise?

		}

	}, 

	login: function(queryOptions){

		var url = '/api/login';

		var queryDefaults = {
			data: {},
			headers: {},
			success: function(response){
				// Succeeded
			},
			error: function(e){
				clog(e);
				clog('Search API failed');
			}
		};
		
		queryOptions = $.extend(queryDefaults,queryOptions);

		// Merge data with auth
		var data = $.extend({},queryOptions.data);
		queryOptions.data = {
							auth: {
									app: App.Credentials.app_key
									//user_token: Api.user_token // just missing this field vs. a normal request
								},
							data: data
							};

		queryOptions.data = JSON.stringify(queryOptions.data);
		
		var ajaxOptions = $.extend(Api.defaults, {url: App.Credentials.base_api_url + url});

		ajaxOptions = $.extend(ajaxOptions, queryOptions);

		if(useForge){
			return window.forge.ajax(ajaxOptions);
		} else {
			return $.ajax(ajaxOptions);
		}

	},


	Event: {

		listener: null,
		listen_on: {},
		ignore_next: true, // Ignore the first incoming one
		start_listening: function(){
			// Start listening on the socket.io feed
			// return false;
			console.log('Starting to listen...');
			try {
				var socket = io.connect(App.Credentials.base_api_url + '/'); // SSL
			} catch(e){
				// Not loaded, try again in a minute
				console.log('not loaded socket.io');
				console.log(e);
				window.setTimeout(Api.Event.start_listening, 1000);
				return;
			}
			var room_login = {
				app: App.Credentials.app_key,
				access_token: App.Credentials.access_token,
				user: App.Credentials.user
			};
			// console.log('rl');
			// console.log(room_login);
			socket.on('disconnect',function(){
				// alert('disconnected');
				App.Utils.Notification.debug.temp('Disconnected from websocket');
			});
			socket.on('connect',function(){
				App.Utils.Notification.debug.temp('Connected to websocket');
				socket.emit('room', JSON.stringify(room_login)); // log into room
			});
			socket.on('error', function(){
				App.Utils.Notification.debug.temp('Error with websocket');
			});
			socket.on('event', function (new_event) {

				// See if Event.name exists
				if(typeof(new_event.event) != 'string'){
					// Missing
					clog('Missing new_event.event');
					alert('missing new_event.event');
					return;
				}

				// Log that we received a new Event
				// clog('Event Received:' + new_event.event);
				// clog(new_event);
				// clog(new_event);
				App.Utils.Notification.debug.temp('Event Received:' + new_event.event);

				// Go through each plugin and fire the callback (with firebase data) if it matches
				var fired = 0;
				
				$.each(Api.Event.listen_on,function(i,listener){
					// clog('listen_on');

					// See if listener is on many different events
					if(typeof(listener.data.event) != 'object'){
						listener.data.event = [listener.data.event];
					}

					$.each(listener.data.event, function(i,lEvent){

						if(lEvent != new_event.event){
							//clog('Listener plugin not match Event (utils.js)');
							return;
						}

						// Events match, check the id (if necessary
						if(listener.data.id != new_event.id){
							// Don't match
							// - null would have also matched
							//clog('Listerner plugin did not match ID (utils.js)');
							// clog(new_event.id);
							if(typeof listener.data.id != 'undefined'){
								return;
							}
						}

						// Looks good, fire the callback
						// - async
						// clog('Firing callback');
						listener.callback(new_event);
						fired++;
					});

				});

				// clog('Fired '+fired+' callbacks');


			});

		},


		on: function(data,callback){
			// Adds another channel of data to listen for

			// Model, Event.name, Data
			// - can also include an id

			/*
			data: {
				event: '
			}
			*/

			var id = App.Utils.guid();
			Api.Event.listen_on[id] = {
				data: data,
				callback: callback
			};

			return id;

		},

		off: function(id){
			// Turn off a listener
			// - delete out of object

			if(typeof(Api.Event.listen_on[id]) == 'undefined'){
				return true;
			}

			delete Api.Event.listen_on[id];

			return true;

		}

	}
	
};

Array.prototype.diff = function(a) {
	return this.filter(function(i) {return !(a.indexOf(i) > -1);});
};
