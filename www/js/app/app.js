//forge.debug = true;

var debugging_mode = true;
var clog = function(v){
	if(debugging_mode){
		window.console.log(v);
	}
};

var App = {
	Models:      {},
	Collections: {},
	Views:       {},
	Utils:       {},
	Plugins:     {},
	Events: 	 _.extend({}, Backbone.Events),
	Data: 		 {
		// tmp_contacts: [], // testing contacts
		online: true,
		LoggedIn: false, // Logged into minimail servers
		notifications_queue: [],
		paused: false,
		was_paused: false,
		Keys: {},
		debug_messages: {},
		xy: {
			win_height: 0, // by default, starts in portrait mode and as orientation changes this will update (portrait only)
			win_width: 0,
			mode: 'portrait' // landscape
		},
		Store: { // a temporary data store

			// Models on server
			Thread: {},
			Email: {},
			AppMinimailLeisureFilter: {},
			AppMinimailDebugCss: {},

			// Not Models on server (local only, sync later)
			ThreadsRecentlyViewed: [],
			ThreadsRecentlyActedOn: [],
			ContactsRecentlyViewed: [],

			// Local only (don't sync?)
			Attachment: {},
			Contacts: [],
			ContactsParsed: [],
			Contact: {},
			Link: {}
		}
	},
	Credentials: tmp_credentials,

	// Called once, at app startup
	init: function () {

		// Measurements
		App.Data.xy.win_height = $(window).height();
		App.Data.xy.win_width = $(window).width();

		var currentUrl = window.location.href;
		
		// Filepicker
		filepicker.setKey(App.Credentials.filepicker_key);


		App.Data.Keys.ctrl = false;
		$(window).keydown(function(evt) {
			if (evt.ctrlKey) { // ctrl
				App.Data.Keys.ctrl = true;
			}
			if (evt.shiftKey) { // shift
				App.Data.Keys.shift = true;
			}
			if (evt.altKey) { // alt
				App.Data.Keys.alt = true;
			}
			if (evt.metaKey) { // meta/command
				App.Data.Keys.meta = true;
			}
		}).keyup(function(evt) {
			if (evt.ctrlKey) { // ctrl
				App.Data.Keys.ctrl = true;
			} else {
				App.Data.Keys.ctrl = false;
			}
			if (evt.shiftKey) { // shift
				App.Data.Keys.shift = true;
			} else {
				App.Data.Keys.shift = false;
			}
			if (evt.altKey) { // alt
				App.Data.Keys.alt = true;
			} else {
				App.Data.Keys.alt = false;
			}
			if (evt.metaKey) { // meta/command
				App.Data.Keys.meta = true;
			} else {
				App.Data.Keys.meta = false;
			}
		});


		// Update in-memory store with localStorage/Prefs
		App.Utils.Storage.get('AppDataStore')
			.then(function(store){
				if(store != null){
					// Make sure all the default keys exist
					App.Data.Store = $.extend(App.Data.Store,store);
					console.log('AppDataStore');
					console.log(App.Data.Store);
				} else {
					console.log('null AppDataStore');
				}
			});

		// Listen for request to save AppDataStore
		App.Events.on('saveAppDataStore',function(opts){
			// Store App.Data.Store into localStorage!
			App.Utils.Storage.set('AppDataStore',App.Data.Store);
		});
		// Save every 60 seconds
		// - after coming back, does it run a ton of times? (queued when in standby?)
		window.setInterval(function(){
			App.Events.trigger('saveAppDataStore',true);
		},60000);

		// CSS
		// - local or debug version of CSS
		App.Utils.Storage.get('cssDebugOn')
			.then(function(cssDebugText){
				if(cssDebugText != undefined && cssDebugText != null){
					// Using debug version
					// Check for local version of debug css
					// - App.Data.Store.AppMinimailDebugCss

					// Add to page
					$('#NormalCSS').remove();
					$('head').append('<style id="DebugCSS" type="text/css">'+cssDebugText+'</style>');

				} 
				else {
					// Not using debug version
					// - add local extra.css
					$('head').append('<link id="NormalCSS" rel="stylesheet" href="css/extra.css" type="text/css" />');

					// Get local version of CSS
					$.ajax({
						url: 'css/extra.css',
						cache: false,
						success: function(cssText){
							// App.Utils.Storage.set('cssDebugOn',cssText);
						}
					});
				}
			});


		// init Router
		// - not sure if this actually launches the "" position...
		App.router = new App.Router();
		// Backbone.history.start({silent: true}); // Launches "" router
		// Backbone.history.start(); // Launches "" router
		// App.router.navigate('',true);


		// Get access_token if it exists
		var oauthParams = App.Utils.getOAuthParamsInUrl();
		if(typeof oauthParams.access_token == "string"){

			// Have an access_token
			// - save it to localStorage
			App.Utils.Storage.set(App.Credentials.prefix_access_token + 'user', oauthParams.user_identifier);
			App.Utils.Storage.set(App.Credentials.prefix_access_token + 'access_token', oauthParams.access_token);

			// Save
			App.Events.trigger('saveAppDataStore',true);

			// Reload page, back to #
			window.location = [location.protocol, '//', location.host, location.pathname].join('');
			return;
		}

		// Continue loading router
		Backbone.history.start({silent: true}); // Launches "" router
		App.router.navigate('',true);

		// Debug messages
		// - add to body
		var debug_messages = new App.Views.DebugMessages();
		debug_messages.render();

		// Get user and set to app global
		App.Utils.Storage.get(App.Credentials.prefix_access_token + 'user')
			.then(function(user){
				App.Credentials.user = user;
			});

		// Get access_token, set to app global, login to minimail server (doesn't allow offline access yet)
		// - switch to be agnostic to online state (if logged in, let access offline stored data: need better storage/sync mechanisms)
		App.Utils.Storage.get(App.Credentials.prefix_access_token + 'access_token')
			.then(function(access_token){

				console.log('Stored access_token:' + access_token);	

				// Make available to requests
				App.Credentials.access_token = access_token;

				// Run login script from body_login page if not logged in
				if(typeof App.Credentials.access_token != 'string' || App.Credentials.access_token.length < 1){
					// App.router.navigate("body_login", true);
					Backbone.history.loadUrl('body_login')
					return;
				}


				// Validate credentials with minimail server and emailbox 
				// - make an api request to load my email address

				var dfd = $.Deferred();

				App.Plugins.Minimail.login()
					.then(function(){

						// Logged in on minimail server
						App.Data.LoggedIn = true;

						// Check login status against Emailbox
						Api.search({
							data: {
								model: 'UserGmailAccounts',
								fields: [],
								conditions: {},
								limit: 1
							},
							success: function(res){
								
								var res = JSON.parse(res);
								if(res.code != 200){
									dfd.reject();
									
									App.Utils.Storage.set(App.Credentials.prefix_access_token + 'access_token',null)
										.then(function(){
											App.Credentials.access_token = null;
											Backbone.history.loadUrl('body_login')
										});
										return;
								}

								var loginData = {
									access_token: App.Credentials.access_token
								};

								// Set EmailAccountData
								App.Data.UserEmailAccounts = res.data[0].UserGmailAccounts;
								App.Data.UserEmailAccounts_Quick = _.map(App.Data.UserEmailAccounts.accounts,function(acct){
									return acct.email;
								});

								Api.Event.start_listening();
								Backbone.history.loadUrl('body');
								
								// CSS ()
								// - local or debug version of CSS

								// Listen for debugCss to be turned on/off remotely
								Api.Event.on({
									event: 'AppMinimailDebugCss.turn'
								},function(result){
									// Get local version of CSS
									if(result.data == 'on'){
										App.Utils.Notification.toast('Turning ON Debug CSS and restarting');
										window.setTimeout(function(){
											$.ajax({
												url: 'css/extra.css',
												cache: false,
												success: function(cssText){
													// App.Plugins.Minimail.update_remote('both');
													App.Utils.Storage.set('cssDebugOn',cssText)
														.then(function(){
															App.Utils.reloadApp();
														});

												}
											});
										},500);

									} else if(result.data == 'off'){
										App.Utils.Notification.toast('Turning OFF Debug CSS and restarting');
										window.setTimeout(function(){
											App.Utils.Storage.set('cssDebugOn',null)
												.then(function(){
													App.Utils.reloadApp();
												});
										},500);
									}
								});
								
								// Load any existing and start listeners if we're using debug css
								App.Utils.Storage.get('cssDebugOn')
									.then(function(cssDebugText){
										if(cssDebugText != undefined && cssDebugText != null){
											// - start listener for new changes to Css.debug
											
											App.Utils.Notification.toast('Using debugCSS');

											// Update any remote versions
											// - by using an emitted event

											// Update remote CSS
											App.Plugins.Minimail.update_remote('both');

											// Listen for changes to css triggered by remote (web)
											Api.Event.on({
												event: 'AppMinimailDebugCss.web_update'
											},function(result){
												// alert('update to css from remote');

												// Update the CSS in the page
												// - contains the new CSS
												App.Utils.Notification.debug.temporary('Updating local CSS from remote');
												App.Utils.Notification.toast('Updating local CSS from remote');
												
												$('#NormalCSS').remove();
												$('#DebugCSS').remove();
												console.log('Event RESULT');
												console.log(result);
												console.log(result.css);

												App.Utils.Storage.set('cssDebugOn',result.css)

												$('head').append('<style id="DebugCSS" type="text/css">'+result.data.css+'</style>');

											});

											// Listen for requests for newest HTML triggered by remote (web)
											Api.Event.on({
												event: 'AppMinimailDebugHtml.request_refresh'
											},function(result){
												// alert('update to css from remote');

												// Get and emit HTML
												Api.event({
													data: {
														event: 'AppMinimailDebugHtml.phone_update',
														obj: {
															html: $('body').html()
														}
													},
													success: function(response){
														response = JSON.parse(response);
														console.log('PHONE RESPONSE');
														console.log(response);
													}
												});

											});

										}
									});

								// Api.count({
								// 	data: {
								// 		model: 'Email',
								// 		conditions: {

								// 		}
								// 	},
								// 	success: function(res){
								// 		var res = JSON.parse(res);
								// 		if(res.code != 200){
								// 			// error
								// 			console.log(res);
								// 			return;
								// 		}

								// 		// How many emails have we processed?
								// 		if(res.data < 100){
								// 			// Backbone.history.loadUrl('intro');
								// 			var page = new App.Views.Modal.Intro();
								// 			page.render();

								// 		}
								// 	}
								// });

							}
						});

					}) // end .then
					.fail(function(){

						console.log('Failed');

						// localStorage.setItem(App.Credentials.prefix_access_token + 'access_token',null);
						App.Utils.Storage.set(App.Credentials.prefix_access_token + 'access_token', null)
							.then(function(){
								App.Credentials.access_token = null;
								Backbone.history.loadUrl('body_login')
							});

					});

			});


		// Forge options
		// - http://docs.trigger.io/en/v1.4/modules/event.html
		if(useForge){

			// Init MENU button on Android (not always there?)
			forge.event.menuPressed.addListener(function(){
				Backbone.history.loadUrl('confirm_logout');
			});
		
			// Init BACK button on Android
			// - disable default first
			forge.event.backPressed.preventDefault(function(){
				console.log('BACK suppressed');
			},function(errorContent){
				console.log('==BACK failed to suppress');
			});
			forge.event.backPressed.addListener(function(killa){
				var a = confirm('Close miniMail? ');
				if(a){
					killa();
				}
				return;
			});

			// Push Notifications
			forge.event.messagePushed.addListener(function (msg) {
				// alert(msg.alert);
				console.log(JSON.stringify(msg));
				App.Events.trigger('new_email',true);
				
				// Go to thread referenced?
				if(msg.threadid && msg.summary.length > 0){
					// if(confirm('View Thread?')){
						App.Data.Store.Thread[this.threadid] = undefined;
						Backbone.history.loadUrl('view_thread/' + msg.threadid);
					// }
				}

			});

		}

		// Phonegap/cordova Push Notifications
		if(usePg){

			// Push notifications
			try { 
				var pushNotification = window.plugins.pushNotification;
				if (device.platform == 'android' || device.platform == 'Android') {
					// alert('android push');

					pushNotification.register(function(result){
						// alert('success w/ Push Notifications');
						App.Utils.Notification.debug.temporary('Push Setup OK'); // not actually ok, not registering, nothing sending to it

					}, function(err){
						// alert('failed Push Notifications');
						App.Utils.Notification.debug.temporary('Failed Push Notification Setup');
						// console.log(err);
						// alert(err);
					}, 
					{
						"senderID":"312360250527",
						"ecb":"onNotificationGCM"
					});
				} else {
					// // alert('not');
					// pushNotification.register(tokenHandler, errorHandler, {"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});
				}
			}
			catch(err) { 
				// txt="There was an error on this page.\n\n"; 
				// txt+="Error description: " + err.message + "\n\n"; 
				// alert(txt); 
				// alert('Push Error');
				App.Utils.Notification.debug.temporary('Push Error');
			}

			// Pausing (exiting)
			document.addEventListener("pause", function(){
				// Mark as Paused
				// - this prevents Push Notifications from activating all at once when Resuming

				App.Data.paused = true;
				App.Data.was_paused = true;

			}, false);

			// Resume
			// - coming back to application
			document.addEventListener("resume", function(){
				// Gather existing Push Notifications and see if we should summarize them, or show individually (confirm, etc.)
				
				App.Data.paused = false;
				App.Data.was_paused = true;

				// Run 1 second after returning
				// - collecting all the Push Notifications into a queue
				// - enough time for all Push events to be realized
				setTimeout(function(){

					App.Data.paused = false;
					App.Data.was_paused = false;

					// Get queue
					// - more than 1 item in queue?
					// - different types of items?
					switch (App.Data.notifications_queue.length){
						case 0:
							// No messages
							break;
						case 1:
							// Only a single message, use normal
							App.Plugins.Minimail.process_push_notification_message(App.Data.notifications_queue.pop());
							break;
						default:
							// Multiple notifications
							// - get last added
							alert('Multiple Push Notifications Received. Latest Processed');
							App.Plugins.Minimail.process_push_notification_message(App.Data.notifications_queue.pop());
							App.Data.notifications_queue = [];
							break;
					}
					var queue = App.Data.notifications_queue.concat([]);

					// - assuming 1 type of Push Notification only at this time

				},1000);

			}, false);


			// Init MENU button on Android (not always there?)
			document.addEventListener("menubutton", function(){
				Backbone.history.loadUrl('confirm_logout');
			}, false);
		
			// Init BACK button on Android
			// - disable default first
			document.addEventListener("backbutton", function(killa){
				var a = confirm('Close minimail? ');
				if(a){
					navigator.app.exitApp();
				}
				return;
			}, false);


		}

	}

	
};

// GCM = Google Cloud Messag[something]
function onNotificationGCM(e){
	
	App.Utils.Notification.debug.temp('New Notification: ' + e.event);

	switch( e.event ){
		case 'registered':
			// Registered with GCM
			if ( e.regid.length > 0 ) {
				// Your GCM push server needs to know the regID before it can push to this device
				// here is where you might want to send it the regID for later use.
				// alert('registration id: ' + e.regid);
				App.Utils.Notification.debug.temp('Reg ID:' + e.regid.substr(0,25) + '...');

				// Got the registration ID
				// - we're assuming this happens before we've done alot of other stuff
				App.Credentials.android_reg_id = e.regid;

				// Write the key
				// - see if the user is logged in
				var i = 0;
				var pushRegInterval = function(){
					window.setTimeout(function(){
						// See if logged in
						if(App.Data.LoggedIn){
							// Sweet, logged in, update remote
							App.Plugins.Minimail.updateAndroidPushRegId(App.Credentials.android_reg_id);
						} else {
							// Run again
							App.Utils.Notification.debug.temp('NLI - try again' + i);
							i++;
							pushRegInterval();
						}
					},3000);
				};
				pushRegInterval();

			}
		break;

		case 'message':
			// if this flag is set, this notification happened while we were in the foreground.
			// you might want to play a sound to get the user's attention, throw up a dialog, etc.

			// alert('message received');
			// alert(JSON.stringify(e.payload));

			// Capture and then wait for a half-second to see if any other messages are incoming
			// - don't want to overload the person
			
			if(App.Data.was_paused){
				// Was just paused, add to queue
				App.Data.notifications_queue.push(e);
			} else {
				// Not paused, immediately take action on the item
				App.Plugins.Minimail.process_push_notification_message(e);
			}

		break;

		case 'error':
			alert('GCM error');
			alert(e.msg);
		break;

		default:
			alert('An unknown GCM event has occurred');
		break;
	}
};

jQuery.fn.reverse = [].reverse;
