//forge.debug = true;

var debugging_mode = false
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
		online: true,
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

			// Not Models on server (local only, sync later)
			ThreadsRecentlyViewed: [],
			ThreadsRecentlyActedOn: [],
			ContactsRecentlyViewed: [],

			// Local only (don't sync?)
			Attachment: {},
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

		// Listen for 
		App.Events.on('saveAppDataStore',function(opts){
			// Store App.Data.Store into localStorage!
			App.Utils.Storage.set('AppDataStore',App.Data.Store);
		});
		// Save every 60 seconds
		window.setInterval(function(){
			App.Events.trigger('saveAppDataStore',true);
		},60000);

		// init Router
		// - not sure if this actually launches the "" position...
		App.router = new App.Router();
		Backbone.history.start({silent: true}); // Launches "" router
		App.router.navigate('',true);

		// Debug messages
		var debug_messages = new App.Views.DebugMessages();
		debug_messages.render();

		App.Utils.Storage.get(App.Credentials.prefix_user_token + 'user_token')
			.then(function(user_token){

				console.log('STORED user_token');
				console.log(user_token);

				App.Credentials.user_token = user_token;

				// Run login script from body_login page if not logged in
				if(typeof App.Credentials.user_token != 'string' || App.Credentials.user_token.length < 1){
					// App.router.navigate("body_login", true);
					Backbone.history.loadUrl('body_login')
					return;
				}


				// Validate credentials

				var dfd = $.Deferred();

				App.Plugins.Minimail.login()
					.then(function(){

						// Logged in on server

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
									
									App.Utils.Storage.set(App.Credentials.prefix_user_token + 'user_token',null)
										.then(function(){
											App.Credentials.user_token = null;
											Backbone.history.loadUrl('body_login')
										});
										return;
								}

								var loginData = {
									user_token: App.Credentials.user_token
								};

								// Set EmailAccountData
								App.Data.UserEmailAccounts = res.data[0].UserGmailAccounts;
								App.Data.UserEmailAccounts_Quick = _.map(App.Data.UserEmailAccounts.accounts,function(acct){
									return acct.email;
								});

								Api.Event.start_listening();
								Backbone.history.loadUrl('body');
								


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

						// localStorage.setItem(App.Credentials.prefix_user_token + 'user_token',null);
						App.Utils.Storage.set(App.Credentials.prefix_user_token + 'user_token', null)
							.then(function(){
								App.Credentials.user_token = null;
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

					$("#app-status-ul").append('<li>registering android</li>');
					pushNotification.register(function(){
						// alert('success w/ Push Notifications');
						App.Utils.Notification.debug.temporary('Push Setup OK'); // not actually ok, not registering, nothing sending to it
					}, function(err){
						// alert('failed Push Notifications');
						App.Utils.Notification.debug.temporary('Failed Push Notification Setup');
						// console.log(err);
						// alert(err);
					}, {"senderID":"312360250527","ecb":"onNotificationGCM"});
					$(document).on('onNotificationGCM',function(){
						alert('new notification');
					});
				} else {
					// alert('not');
					$("#app-status-ul").append('<li>registering iOS</li>');
					pushNotification.register(tokenHandler, errorHandler, {"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});
				}
			}
			catch(err) { 
				// txt="There was an error on this page.\n\n"; 
				// txt+="Error description: " + err.message + "\n\n"; 
				// alert(txt); 
				alert('Push Error');
			}

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


