
App.Router = Backbone.Router.extend({

	routes: {
		
		'body' : 'body',         // entry point: no hash fragment or #

		'body_login' : 'body_login',

		'home' : 'home',
		'undecided' : 'undecided',
		'delayed' : 'delayed',
		'all' : 'all',
		'leisure' : 'leisure',


		'compose' : 'compose',

		// View email/thread
		'undecided_view_thread/:threadid' : 'undecided_view_thread',
		'view_thread/:threadid' : 'view_thread',
		'view_thread/:threadid/:returnpage' : 'view_thread',
		'view_leisure_thread/:leisureid' : 'view_leisure_thread',

		// Reply
		'reply/:threadid' : 'reply',

		// Leisure Create
		'leisure_create/:threadid' : 'leisure_create',

		// Pin
		'pin/:threadid' : 'pin',

		// Edit Email
		'edit_email/:emailid' : 'edit_email',

		// Search
		'search' : 'search',
		'search_emails' : 'search_emails',
		'search_attachments' : 'search_attachments',
		'search_links' : 'search_links',
		'search_contacts' : 'search_contacts',

		'senders' : 'senders',

		'intro' : 'intro',

		'settings' : 'settings',

		'confirm_logout' : 'confirm_logout',
		'logout' : 'logout'
		
	},

	showView: function(hash, view, view_key){
		// Used to discard zombies
		
		if (!this.currentView){
			this.currentView = {};
		}
		if (this.currentView && this.currentView[hash]){
			this.currentView[hash].view.close();
		}
		this.currentView[hash] = {
			key: view_key, // usually undefined
			view: view.render()
		}
	},

	getView: function(hash, view_key){
		// Returns boolean

		// Any view?
		if (!this.currentView){
			return false;
		}

		// Is this the current view already? (just clicking refresh)
		if(this.currentView[hash] && this.currentView[hash].key == view_key && view_key){
			return true;
		}

		return false;

	},

	emitView: function(hash, event){
		// Returns boolean

		// Is this the current view already? (just clicking refresh)
		this.currentView[hash].view.trigger(event);

	},


	body: function(){

		// Body
		// console.log(App.Models.Search);
		var page = new App.Views.Body();
		$('body').append(page.$el);
		App.router.showView('body',page);

	},


	body_login: function(){
		// Redirect through OAuth

		// Unless user_token is already in querystring
		
		if(typeof App.Credentials.access_token != 'string' || App.Credentials.prefix_access_token.length < 1){
			
			// var qs = App.Utils.getUrlVars();
			var oauthParams = App.Utils.getOAuthParamsInUrl();
			// console.log('oauthParams');
			// console.log(oauthParams);
			// alert('oauth');
			// return false;

			// if(typeof qs.user_token == "string"){
			if(typeof oauthParams.access_token == "string"){

				// Have an access_token
				// - save it to localStorage
				// localStorage.setItem(App.Credentials.prefix_access_token + 'user',oauthParams.user_identifier);
				// localStorage.setItem(App.Credentials.prefix_access_token + 'access_token',oauthParams.access_token);
				
				// // Reload page, back to #home
				// window.location = [location.protocol, '//', location.host, location.pathname].join('');
			} else {
				// Show login splash screen
				var page = new App.Views.BodyLogin();
				App.router.showView('bodylogin',page);
			}

		} else {
			// Reload page, back to #home
			window.location = [location.protocol, '//', location.host, location.pathname].join('');
			return;
		} 



	},

	home: function(){
		var page = new App.Views.Home();
		App.router.showView('main_view',page);
	},


	undecided: function(){
		var page = new App.Views.Undecided();
		$('.body_container').html(page.$el);
		App.router.showView('main_view',page);
	},


	delayed: function(){
		var page = new App.Views.Delayed();
		$('.body_container').html(page.$el);
		App.router.showView('main_view',page);
	},


	all: function(){
		// Display the "inbox" (our version of an inbox)

		// Already displaying all?
		// - just refresh
		if(App.router.getView('main_view', 'all')){
			App.router.emitView('main_view', 'refresh');
			return;
		}

		// Does page already exist?
		// - some pages just stay in memory, do not get .close unless by force
		var page;
		if(!App.Data.PermaViews.all){
			// Create page for first time
			App.Data.PermaViews.all = new App.Views.All();

			// Display 

		} else {

		}

		// Display page
		$('.body_container').html(App.Data.PermaViews.all.$el);
		App.router.showView('main_view',App.Data.PermaViews.all, 'all');
	},


	leisure: function(){

		// Display the "inbox" (our version of an inbox)

		// Already displaying all?
		// - just refresh
		if(App.router.getView('main_view', 'leisure')){
			App.router.emitView('main_view', 'refresh');
			return;
		}

		// Does page already exist?
		// - some pages just stay in memory, do not get .close unless by force
		if(!App.Data.PermaViews.leisure){
			// Create page for first time
			App.Data.PermaViews.leisure = new App.Views.LeisureList();

			// Display 

		} else {

		}


		// Display page
		$('.body_container').html(App.Data.PermaViews.leisure.$el);
		App.router.showView('main_view',App.Data.PermaViews.leisure, 'leisure');

		// var page = new App.Views.LeisureList();
		// $('.body_container').html(page.$el);
		// App.router.showView('main_view',page);
	},


	search: function(){
		var page = new App.Views.Search();
		$('.body_container').html(page.$el);
		App.router.showView('main_view',page);
	},

	search_emails: function(){
		var page = new App.Views.SearchEmails();
		$('.body_container').html(page.$el);
		App.router.showView('search_view',page);
	},

	search_contacts: function(){
		var page = new App.Views.SearchContacts();
		$('.body_container').html(page.$el);
		App.router.showView('search_view',page);
	},

	search_attachments: function(){
		var page = new App.Views.SearchAttachments();
		$('.body_container').html(page.$el);
		App.router.showView('search_view',page);
	},

	search_links: function(){
		var page = new App.Views.SearchLinks();
		$('.body_container').html(page.$el);
		App.router.showView('search_view',page);
	},


	view_thread: function(threadid,returnpage){

		var page = new App.Views.CommonThread({
			threadid: threadid
		});
		// Hide other .main_body
		$('.main_body').addClass('nodisplay');

		// Add to page
		$('body').append(page.$el);
		App.router.showView('thread',page); // don't want to delete 'undecided' view because we go back to it and want to save position

	},


	view_leisure_thread: function(leisureid){

		var page = new App.Views.LeisureItem({
			leisureid: leisureid
		});
		// Hide other .main_body
		$('.main_body').addClass('nodisplay');

		// Add to page
		$('body').append(page.$el);
		App.router.showView('leisureitem',page); // don't want to delete 'undecided' view because we go back to it and want to save position

	},


	compose: function(){
		// Compose an email

		var page = new App.Views.CommonCompose({
			
		});
		// Hide other .main_body
		$('body > div').addClass('nodisplay');

		// Add to page
		$('body').append(page.$el);
		App.router.showView('compose',page); // don't want to delete 'undecided' view because we go back to it and want to save position


	},


	reply: function(threadid){

		var page = new App.Views.CommonReply({
			threadid: threadid
		});
		// Hide other .main_body(s)
		$('body > div').addClass('nodisplay');

		// Add to page
		$('body').append(page.$el);
		App.router.showView('reply',page); // don't want to delete 'common_thread' view because we go back to it and want to save position

	},


	leisure_create: function(threadid){

		var page = new App.Views.LeisureCreate({
			threadid: threadid
		});
		// Hide other .main_body(s)
		$('body > div').addClass('nodisplay');

		// Add to page
		$('body').append(page.$el);
		App.router.showView('leisure_create',page); // don't want to delete 'common_thread' view because we go back to it and want to save position

	},


	edit_email: function(emailid){

		console.log(1);
		console.log(emailid);

		var page = new App.Views.CommonEditEmail({
			emailid: emailid
		});
		// Hide other .main_body(s)
		$('body > div').addClass('nodisplay');

		// Add to page
		$('body').append(page.$el);
		App.router.showView('edit_email',page); // don't want to delete 'common_thread' view because we go back to it and want to save position

	},


	pin: function(threadid){

		var page = new App.Views.CommonPin({
			threadid: threadid
		});
		// Hide other .main_body(s)
		$('body > div').addClass('nodisplay');

		// Add to page
		$('body').append(page.$el);
		App.router.showView('pin',page); // don't want to delete 'common_thread' view because we go back to it and want to save position

	},


	undecided_view_thread: function(threadid){
		// orignially used this instead of view_thread (above)

		var page = new App.Views.UndecidedThread({
			threadid: threadid
		});
		// Hide other .main_body
		$('.main_body').addClass('nodisplay');

		// Add to page
		$('body').append(page.$el);
		App.router.showView('thread',page); // don't want to delete 'undecided' view because we go back to it and want to save position

	},



	senders: function(){
		var page = new App.Views.Senders();
		App.router.showView('senders',page);
	},


	intro: function(){
		var page = new App.Views.Modal.Intro();
		page.render();
	},


	confirm_logout: function(){
		// Already displaying menu?
		if($('div.logout').length > 0){
			$('div.logout').remove();
		} else {
			var page = new App.Views.Logout();
			$('body').append(page.$el);
			App.router.showView('logout',page);
		}
	},


	logout: function(){
		// Logout

		// alert('Logging out');

		// Reset user_token
		if(useForge){

			// Unsubscribe
			App.Plugins.Minimail.unsubscribe_from_push()
				.then(function(){

					// Clear prefs
					forge.prefs.clearAll(function(){
						$('body').html('');
						window.location = [location.protocol, '//', location.host, location.pathname].join('');
					},function(err){
						alert('Failed signing out');
						console.log('failed signing out');
						console.log(err);
					});

				});

		} else if(usePg) {

			// Unsubscribe from Push Notifications
			// - todo...
			App.Data.pushNotification.unregister(function(){
				// Success
				console.log('Unsubscribed from Push OK');
			}, function(){
				// Error
				console.log('Failed Unsubscribe from Push');
			});

			// Clear preferences
			window.localStorage.clear();

			// Clear HTML
			$('body').html('');
			window.location = [location.protocol, '//', location.host, location.pathname].join('');

		} else {
			localStorage.clear();//(App.Credentials.prefix_user_token + 'user_token','');
			window.location = [location.protocol, '//', location.host, location.pathname].join('');
		}


	}, 

	settings: function(){
		
		// // Confirm they want to open settings
		// var c = confirm('Go to Settings?');
		// if(!c){
		// 	return;
		// }

		var page = new App.Views.Settings();
		// Hide other .main_body
		$('.main_body').addClass('nodisplay');

		// Add to page
		$('body').append(page.$el);
		App.router.showView('settings',page); // don't want to delete 'undecided' view because we go back to it and want to save position

	}


});
