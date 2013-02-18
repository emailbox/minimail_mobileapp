
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

		'confirm_logout' : 'confirm_logout',

		'logout' : 'logout'
		
	},

	showView: function(hash,view,notRemove){
		// Used to discard zombies
		// console.log('hash: '+hash);
		if (!this.currentView){
			this.currentView = {};
		}
		if (this.currentView && this.currentView[hash]){
			if(notRemove){
				this.currentView[hash].close(true);
			} else {
				this.currentView[hash].close();
			}
		}
		this.currentView[hash] = view.render();
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
		
		if(typeof App.Credentials.user_token != 'string' || App.Credentials.user_token.length < 1){
			
			var qs = App.Utils.getUrlVars();

			if(typeof qs.user_token == "string"){
				// Have a user_token
				// - save it to localStorage

				App.Utils.Storage.set(App.Credentials.prefix_user_token + 'user_token',qs.user_token)
					.then(function(){
						
						// Reload page, back to #home
						window.location = [location.protocol, '//', location.host, location.pathname].join('');
					});

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
		var page = new App.Views.All();
		$('.body_container').html(page.$el);
		App.router.showView('main_view',page);
	},


	leisure: function(){
		var page = new App.Views.LeisureList();
		$('.body_container').html(page.$el);
		App.router.showView('main_view',page);
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

			// Clear preferences
			window.localStorage.clear();

			// Clear HTML
			$('body').html('');
			window.location = [location.protocol, '//', location.host, location.pathname].join('');

		} else {
			localStorage.setItem(App.Credentials.prefix_user_token + 'user_token','');
			window.location = [location.protocol, '//', location.host, location.pathname].join('');
		}


	}


});
