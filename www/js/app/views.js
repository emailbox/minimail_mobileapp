Backbone.View.prototype.close = function (notRemove) {
	if (this.beforeClose) {
		this.beforeClose();
	}

	// Empty of HTML content, but don't remove the parent element
	// this.$el.empty();
	if(notRemove){
		// this.remove();
		clog('emptied');
		this.$el.empty();
	} else {
		this.remove();
	}
	this.unbind();

	// clog('removing VIEW');

	// this.off(); // same thing??

};


Backbone.View.prototype.garbage = function (view_list) {
	// Trash views that are not currently needed

	// passes in a view_list of things to trash

};


// Minimail prototypes
Backbone.View.prototype.resize_fluid_page_elements = function () {
	// Handles the default page elements resizing
	// - dynamic height for "body" element

	// Get height of elements on the page

	var that = this;

	// elements to check
	var elements = [
		'.header',
		'.footer',
		'.footer2'
	];

	var $bodyContainer;

	// Get this (or parent) body_container
	if(this.$('.body_container').length > 0){
		$bodyContainer = this.$('.body_container');
	} else {
		$bodyContainer = this.$el.parents('.body_container');
	}

	if($bodyContainer.length < 1){
		// Unable to locate .body_container
		alert('unable to locate body container');
	}

	var used_height = 0;
	$.each(elements,function(i, elemClass){
		if($bodyContainer.parent().find(elemClass + ':not(.nodisplay)').length > 0){
			used_height += $bodyContainer.parent().find(elemClass).outerHeight();
		}
	});

	// Get remaining height
	// - subtract used_height from xy.win_height
	var remaining_height = App.Data.xy.win_height - used_height;

	// Update body_container with fixed_height

	// this element or a child of the one we're fixing?
	$bodyContainer.css('height',remaining_height + 'px');
	
	// Update individual elements in body
	// - margin, etc.


};

Backbone.View.prototype.resize_scroller = function () {
	// Resize the scroller inside this element
	var that = this;

	// Calculate max-height for scroll
	// - based on parent
	var $scroller = this.$('.scroller'),

		// Get fixed_height of element above (usually .body_container.fixed_height)
		$fixed = $scroller.parents('.fixed_height');
		max_height = $fixed.height(); // could have it stored as a data-attribute instead?

	
	if(this.$el.hasClass('reverse_vertical')){
		this.$el.css('height',max_height + 'px');
	} else {
		this.$('.reverse_vertical').css('height',max_height + 'px');
	}
	this.$('.scroller').css('max-height',max_height + 'px');
	this.$('.scroller').css('width',App.Data.xy.win_width + 'px');

	return;
};



App.Views.Body = Backbone.View.extend({
	
	// el: 'body',
	className: 'main_body',

	events: {
		'click #refresh_people' : 'refresh_people',
		// 'click .logout' : 'logout',
		'click .goto_senders' : 'goto_senders',

		'click .base_header_menu .threads_change button' : 'menu_click',

		'click .base_header_menu button[data-action="compose"]' : 'compose'
	},

	initialize: function() {
		_.bindAll(this, 'render');
	},


	logout: function(){
		Backbone.history.loadUrl('confirm_logout');
	},


	goto_senders: function(ev){
		// Load the senders page
		Backbone.history.loadUrl('senders');
		return false;
	},

	set_scroll_position: function(){
		var that = this;

		// Set last scroll position
		this.last_scroll_position = $('.threads_holder').scrollTop();
		this.$el.attr('last-scroll-position',this.last_scroll_position);

	},


	menu_click: function(ev){
		var elem = ev.currentTarget;

		// Get ID of btn
		var id = $(elem).attr('data-action');

		// Make other buttons inactive
		this.$('.base_header_menu button').removeClass('active');

		// Activate this button
		$(elem).addClass('active');

		// Store scroll position
		this.set_scroll_position();

		// Launch router for undecided, delayed, all, leisure, collections
		Backbone.history.loadUrl(id);

		return false;

	},

	compose: function(ev){
		// Compose a new email

		// Store scroll position
		this.set_scroll_position();

		// Launch router for undecided, delayed, all, leisure, collections
		Backbone.history.loadUrl('compose');

	},


	render: function() {

		var that = this;

		// Data
		// var data = this.options.accounts.UserGmailAccounts;

		// Should start the updater for accounts
		// - have a separate view for Accounts?


		// Template
		var template = App.Utils.template('t_body');

		// Write HTML
		$(this.el).html(template());

		// Fix fluid layout
		this.resize_fluid_page_elements();

		// Load the Undecided View
		// Backbone.history.loadUrl('undecided');
		var doclick = 'all';
		this.$('.base_header_menu button[data-action="'+doclick+'"]').addClass('active');
		Backbone.history.loadUrl(doclick);
		// this.$('.base_header_menu button[data-action="'+doclick+'"]').trigger('touchend');

		return this;
	},


	refresh_people: function(){
		// Refresh people

		// Get the current list of people
		var that = this;
		// var dfd = $.Deferred();

		Api.count({
			data: {
				model: 'Email',
				conditions: {
					"$or" : [
						{
							"app.AppMinimalContact.version" : {
								"$lt" : App.Credentials.data_version // versioning
							}
						},
						{
							"app.AppMinimalContact.version" : {
								"$exists" : false // doesn't even exist
							}
						}
					]
				}
			},
			success: function(count_res){
				count_res = JSON.parse(count_res);
				$('#refresh_people').attr('data-total',count_res.data);
				$('#refresh_people').attr('data-togo',count_res.data);
				// dfd.resolve(count_res);
				that.search_again();
			}

		});

		return false;
	},


	search_again: function(){

		var that = this;

		// Iterate through emails
		// - one's we haven't already processed
		// - eventually, do this server-side

		// Count total emails we haven't processed
		var dfd_count = $.Deferred();

		Api.count({
			data: {
				model: 'Email',
				conditions: {
					"$or" : [
						{
							"app.AppMinimalContact.version" : {
								"$lt" : App.Credentials.data_version // versioning
							}
						},
						{
							"app.AppMinimalContact.version" : {
								"$exists" : false // doesn't even exist
							}
						}
					]
				}
			},
			success: function(count_res){
				count_res = JSON.parse(count_res);
				$('#refresh_people').attr('data-togo',count_res.data);
				dfd_count.resolve(count_res);
			}

		});
		dfd_count.promise().then(function(count_res){
			
			var possible = ['To','Delivered-To','From','Cc','Bcc','Reply-To'];
			var header_fields = [];
			$.each(possible,function(i,v){
				// header_fields.push('original.headers.' + v);
				header_fields.push('original.headers.' + v + '_Parsed');
			});

			// Iterate through all emails
			// - go backwards, use a limit
			var dfd_email_search = $.Deferred();
			var fields = ["common"].concat(header_fields);

			Api.search({
				data: {
					model: 'Email',
					conditions: {
						"$or" : [
							{
								"app.AppMinimalContact.version" : {
									"$lt" : App.Credentials.data_version // versioning
								}
							},
							{
								"app.AppMinimalContact.version" : {
									"$exists" : false // doesn't even exist
								}
							}
						]
					},
					fields: fields,
					limit: App.Credentials.email_collect_limit,
					sort: {
						"common.date_sec" : -1
					}
				},
				queue: true,
				success: function(email_res){
					dfd_email_search.resolve(email_res);
				}
			});
			dfd_email_search.then(function(email_res){

				var email_res = JSON.parse(email_res);
				if(email_res.code != 200){
					clog('Failed getting emails');
					return;
				}

				// Parse out all the people

				// Listen for another window starting the process
				// - immediately cancels anything we are saving
				// - todo...

				// Possible places addresses are held
				var addresses = [];

				$.each(email_res.data,function(i,email){

					$.each(possible,function(k,type){
						var type_parsed = type + '_Parsed';
						if (typeof email.Email.original.headers[type_parsed] == 'undefined'){
							// Not a valid one to parse
							return;
						}

						var addr = email.Email.original.headers[type_parsed];

						// Iterate through type Parsed ones now
						$.each(addr,function(j,parsedAddress){

							// Valid email address?
							var email_address = $.trim(parsedAddress[1]);
							if (/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(email_address)){
								// Passed validation
								clog('Pass: ' + email_address);
							} else {
								clog('====FAILED validation: ' + email_address);
								return;
							}
							// Add to array
							addresses.push({
								type: type,
								name: $.trim(parsedAddress[0]),
								email_address: email_address,
								email_id: email.Email._id
							});
						});

					});
				});

				// Update the users after each batch of users we process
				// - so we can show incremental process to the user (update the percentage parsed)

				// This should be handled by a model

				// Check each address against the database, determine if they should be updated or not

				var dfds = [];
				$.each(addresses,function(i,address){
					// Iterate through each
					// - ignore the names if they already match
					var dfd_find_contact = $.Deferred();
					var tmp_dfd = $.Deferred();
					Api.search({
						data: {
							model: "AppMinimalContact",
							conditions: {
								"email" : address.email_address,
								"live" : 1
							},
							fields: [],
							limit: 1
						},
						queue: true,
						success: function(contact_res){
							dfd_find_contact.resolve(contact_res);
						}
					});
					dfd_find_contact.then(function(res){
						res = JSON.parse(res);
						if(res.code != 200){
							clog('Failed finding user');
							return;
						}

						tmp_dfd.resolve();

						if(res.data.length < 1){

							// Found anyone?
							var data  = {
											model: "AppMinimalContact",
											event: "AppMinimalContact.new",
											obj: {
												name: address.name,
												email: address.email_address,
												emails: {},
												groups: [],
												approved: 0,
												live: 1
											}
										};
							// clog(address);
							data.obj.emails[address.type] = [address.email_id];

							// No one with this email
							Api.write({
								data: data,
								queue: true,
								success: function(contact_res){
									contact_res = JSON.parse(contact_res);
									if(contact_res.code != 200){
										clog('Failed saving AppMinimalContact');
										return;
									}
								}
							});
						} else {
							// Found a contact with this email
							// clog('Found contact with this email');

							// Does this type exist?
							if(typeof res.data[0].AppMinimalContact.emails[address.type] == 'undefined'){
								// Write type, with this email.id as the first referenced
								var updateData = {
											id: res.data[0].AppMinimalContact._id,
											model: 'AppMinimalContact',
											paths: {
												"$set" : {
													emails : {}
												}
											}
										};
								updateData.paths["$set"].emails[address.type] = [address.email_id]
								var dfd_update_contact = $.Deferred();
								Api.update({
									data: updateData,
									queue: true,
									success: function(update_res){
										dfd_update_contact.resolve(update_res);
									}
								});
								dfd_update_contact.then(function(update_res){
									update_res = JSON.parse(update_res);
									if(update_res.code != 200){
										clog('-- Failed updating contact');
										return;
									}
								});

								return;
							} else {
								// Type already exists
								// - see if this email_id is already in there
								clog('Finish update script in views.js!!');
							}


						}

					});
		
					// Return a promise that
					dfds.push(tmp_dfd.promise());

					// clog(addresses);
					// clog(addresses.length);

				});

				$.when.apply(this,dfds)
					.then(function(){
						// See if we need to reload anybody else
						
						// Mark these emails to the correct new version
						var email_ids = []; // extract the email ids and do an update
						$.each(email_res.data,function(i,email){
							email_ids.push(email.Email._id);
						});

						var update_dfd = $.Deferred();
						Api.update({
							data: {
								model: 'Email',
								conditions: {
									"_id" : {
										"$in" : email_ids
									}
								},
								paths: {
									"$set" : {
										"app.AppMinimalContact.version" : App.Credentials.data_version
									}
								}
							},
							success: function(update_email_res){
								update_dfd.resolve();
							}
						});

						update_dfd.promise()
							.then(function(){
								if(email_res.data.length < 1){
									clog('Got all emails!');
									that.search_reconcile();
									return;
								}

								clog('== Time to load more emails!!');
								window.setTimeout(function(){
									that.search_again();
								},2000);
							});

					});

				// After all the data for these emails is stored, go get the next batch of emails
				// Save these as completed

				// if(email_res.data.length > 0){
				// 	// Keep going
				// 	window.setTimeout(function(){
				// 		clog('Searching Again');
				// 		that.search_again();
				// 	},10000);
				// }

			});



		});


		// var do_emails = true;
		// while(do_emails){

		// 	var defer = $.defer();

		// 	Api.search({
		// 		data: {
		// 			model: 'AppMinimalContact',
		// 			paths: [],
		// 			conditions: {},
		// 			limit: 10000
		// 		}
		// 	})

		// }

		return false;
	},

	search_reconcile: function(){
		// Handle duplicates, etc in the AppMinimalContacts
		// - 

		// Get all contacts
		var dfd = $.Deferred();

		Api.search({
			data: {
				model: 'AppMinimalContact',
				paths: [],
				conditions: {

					"live" : 1
				},
				limit: 10000
			},
			queue: true,
			success: function(res){
				// required for a queue
				dfd.resolve(res);
			}
		});

		dfd.promise()
			.then(function(res){
				res = JSON.parse(res);
				if(res.code != 200){
					clog('failed reconciling');
					return;
				}

				var contacts = res.data;

				// 
				for(var i =0; i< contacts.length ; i++){
					for(var j=i+1; j<contacts.length;j++){
						if(i == j){
							// comparing itself
							continue;
						}
						if(contacts[i].AppMinimalContact.email == contacts[j].AppMinimalContact.email){//found matching first 2 chars

							// Merge each of the AppMinimalContact.emails fields (the _Parsed fields)
							// $.each(contacts[j].AppMinimalContact.emails,function(key,val){

							// });

							// contacts[i] = contacts[i].substring(0,3) + contacts[j].replace(/\{(.*?)\}/,"$1 ;") + contacts[i].substring(4);

							// Remove the second id from the database
							Api.remove({
								data: {
									model: 'AppMinimalContact',
									id: contacts[j].AppMinimalContact._id
								},
								success:function(res){
									res = JSON.parse(res);
									clog('Removed: ' + res.data);
								}
							});

							//remove the doup and decrease the counter so you don't skip one now that the array is shorter
							clog('dupe: ' + contacts[i].AppMinimalContact.email);
							contacts.splice(j--,1);

						}
					}
				}

				clog('Finished Reconciling');

				// $.each(contacts,function(key,val){
				// 	clog(val.AppMinimalContact.email);
				// });

			});




	}
});


App.Views.Undecided = Backbone.View.extend({
	
	className: 'undecided_thread_inside_view',

	last_scroll_position: 0,

	events: {
		// 'click .save' : 'save',
		// 'click .preview' : 'preview'
		// 'click #back' : 'go_back',
		// 'click .sender' : 'approve',
		// 'click .sender_status a' : 'status_change'

		'click .thread-preview' : 'view_email'

	},

	initialize: function(options) {
		_.bindAll(this, 'render');
		var that = this;

	},


	refresh_data: function(){
		// Refresh the data for the view

	},


	view_email: function(ev){
		// View an individual email
		var elem = ev.currentTarget;
		var threadElem = $(elem).parents('.thread');

		// - probably have some of the info cached already (all relevant headers)

		// Get Thread id
		var id = $(threadElem).attr('data-id');

		// Set last scroll position
		this.last_scroll_position = $('.threads_holder').scrollTop();
		this.$el.parents('.main_body').attr('last-scroll-position',this.last_scroll_position);

		// Launch view for that Thread
		Backbone.history.loadUrl('view_thread/' + id + '/undecided');

		return false;

	},


	render_init: function(){
		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_undecided_init');

		// Write HTML
		this.$el.html(template());

		return this;

	},

	render_threads: function(undecided){
		
		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_undecided');

		// Write HTML
		this.$el.html(template(undecided));

		// Change size of window based on display size
		$('.undecided_thread_inside_view').css({
			height: App.Data.xy.win_height - 60,
			width: App.Data.xy.win_width
		});
		$('.undecided_threads').css({
			"max-height": App.Data.xy.win_height - 60,
			width: App.Data.xy.win_width
		});

		// Scroll to bottom
		$('.undecided_threads').scrollTop($(document).height());

		// Draggable
		$(".thread-preview").on('touchstart',App.Plugins.Minimail.thread_main.start);
		$(".thread-preview").on('mousedown',App.Plugins.Minimail.thread_main.start);
		$(".thread-preview").on('touchmove',App.Plugins.Minimail.thread_main.move);
		$(".thread-preview").on('mousemove',App.Plugins.Minimail.thread_main.move);
		$(".thread-preview").on('touchend',App.Plugins.Minimail.thread_main.end);
		$(".thread-preview").on('mouseup',App.Plugins.Minimail.thread_main.end);

		return this;
		
	},


	refresh_and_render_threads: function(){
		var that =  this;

		that.collection = new App.Collections.UndecidedThreads();
		that.collection.fetchUndecided({
			success: function(threads) {
				// Does not return models, just JSON data objects
				clog('back with result');
					
				// Store locally
				App.Utils.Storage.set('undecided_threads_and_emails',threads);

				// Render
				that.render_threads(threads);
			}
		});
	},

	render: function() {
		var that = this;

		// Render initial body
		this.render_init();

		// Do we already have some data?
		App.Utils.Storage.get('undecided_threads_and_emails')
			.then(function(threads){

				if(threads != null){
					// Have some local data
					// Trigger a refresh of the data
					// - when the data is refreshed, the view gets refreshed as well
					
					that.render_threads(threads);

				}

				that.refresh_and_render_threads();

			});



		// How old is it?
		// Do we need to do a refresh?

		// View is based on what data we do have, and a view makes sure the new data is being found? 





		return;



		// Template
		// var template = App.Utils.template('t_undecided');

		// // Write HTML
		// this.$el.html(template());

		// this.$('.sender_status a[data-status="pending"]').trigger('click');

		// Build Search SubView
		// - todo...


		//this.options.senders
		// $(this.el).html(template());



		// Resize window
		// var oTop = $('#file_list').offset().top;
		// var viewportHeight = $(window).height();
		// $('#file_list').height(viewportHeight - oTop - 1 + 'px');
		
		var threads = new App.Collections.UndecidedThreads();
		threads.fetchUndecided({
			success: function(threads) {
				// $(that.el).html(_.template(guestbookListTemplate, {messages: messages.models, _:_}));
				clog('threads');
				clog(threads);
				that.render_threads(threads);
			}
		});


		// // See if data is in the cache
		// var cache = false;
		// if(cache){
		// 	// Get data from cache
		// 	// - render immediately
		// 	this.render_threads();

		// } else {
		// 	// Not already cached
		// 	that.render_init();
		// 	App.Plugins.Minimail.getUndecided()
		// 		.then(function(undecided){
		// 			that.render_threads(undecided);
		// 		})
		// 		.fail(function(err){
		// 			clog('Failed loading Undecided');
		// 		});
		// }

		return this;
	}
});


App.Views.UndecidedThread = Backbone.View.extend({
	
	className: 'undecided_thread_view',

	events: {
		'click .btn[data-action="back"]' : 'go_back',
		'click .email_holder .email_body .ParsedDataShowAll span.expander' : 'email_folding'
	},

	initialize: function(options) {
		_.bindAll(this, 'render');
		var that = this;
		// this.el = this.options.el;

		// Get any local information we have
		// After getting local info, and if we have enough, show the thing
		// Get remote info, merge with Local when it arrives

		// Render the information we have on this Thread

		this.threadid = this.options.threadid

		var thread = new App.Models.Thread({
			_id: this.threadid
		});

		threads.fetchUndecided({
			success: function(threads) {
				// $(that.el).html(_.template(guestbookListTemplate, {messages: messages.models, _:_}));
				clog('threads');
				clog(threads);
				that.render_threads(threads);
			}
		});

		// // Render the base view
		// var thread_cached = false;
		// if(thread_cached){
		// 	// Thread is in memory
		// 	// - display base view including Thread
		// 	// - todo...
		// } else {
		// 	// No Thread in memory

		// 	// Display base outline
		// 	// Fetch Thread and Emails for thread

		// 	App.Plugins.Minimail.getThreadAndEmails(this.options.threadid)
		// 		.then(function(returnThread){
		// 			that.render_content(returnThread);
		// 		})
		// 		.fail(function(err){
		// 			clog('Failed getThreadAndEmails');
		// 			clog(err);
		// 		});
		// }

	},

	go_back: function(ev){
		// Going back to mailbox
		// - highlight the correct row we were on? (v2)

		// Re-show .main_body
		$('.main_body').removeClass('nodisplay');

		// Scroll to correct position
		var scrollTo = 0;
		if($('.main_body').attr('last-scroll-position')){
			scrollTo = $('.main_body').attr('last-scroll-position');
		}
		$('.undecided_threads').scrollTop(scrollTo);

		// Close myself
		this.close();

		return false;
	},


	email_folding: function (ev){
		// Display any hidden emails (previous parts of the conversation)

		var elem = ev.currentTarget;

		var content_holder = $(elem).parents('.email_body');
		//var count = $(content_holder).find('.ParsedDataContent').length;

		// Toggle
		if($(content_holder).hasClass('showAllParsedData')){
			$(content_holder).removeClass('showAllParsedData')
			
			$(content_holder).find('.ParsedDataContent:not([data-level="0"])').hide();

			$(elem).text('...');
		} else {
			$(content_holder).addClass('showAllParsedData')

			$(content_holder).find('.ParsedDataContent:not([data-level="0"])').show();

			$(elem).text('Hide');
		}

	},

	render: function() {
		var that = this;
		// Data
		// var data = this.options.accounts.UserGmailAccounts;

		// Should start the updater for accounts
		// - have a separate view for Accounts?

		// Template
		var template = App.Utils.template('t_common_thread_view');

		// Write HTML
		this.$el.html(template());

		// Scroll to top
		alert('top');
		// $(window).scrollTop(0);

		return this;
	},

	render_content: function(ThreadAndEmails){
		// Render partial

		// Template
		var template = App.Utils.template('t_common_thread_view_content');

		// Remove loading
		this.$('.loading').remove();

		// Write HTML
		this.$('.body_container').html(template(ThreadAndEmails));

	}

});


App.Views.Delayed = Backbone.View.extend({
	
	className: 'delayed_thread_inside_view',

	last_scroll_position: 0,

	events: {
		// 'click .save' : 'save',
		// 'click .preview' : 'preview'
		// 'click #back' : 'go_back',
		// 'click .sender' : 'approve',
		// 'click .sender_status a' : 'status_change'

		'click .thread-preview' : 'view_email'

	},

	initialize: function(options) {
		_.bindAll(this, 'render');
		var that = this;
	},


	render_init: function(){
		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_delayed_init');

		// Write HTML
		this.$el.html(template());

		return this;

	},


	view_email: function(ev){
		// View an individual email
		var elem = ev.currentTarget;
		var threadElem = $(elem).parents('.thread');

		// - probably have some of the info cached already (all relevant headers)

		// Get Thread id
		var id = $(threadElem).attr('data-id');

		// Set last scroll position
		this.last_scroll_position = $(window).scrollTop();
		this.$el.parents('.main_body').attr('last-scroll-position',this.last_scroll_position);

		// Launch view for that Thread
		Backbone.history.loadUrl('view_thread/' + id + '/delayed');

		return false;

	},

	render_threads: function(threads){
		
		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_delayed');

		// Write HTML
		this.$el.html(template(threads));

		// Change size of window based on display size
		$('.delayed_thread_inside_view').css({
			height: App.Data.xy.win_height - 60,
			width: App.Data.xy.win_width
		});
		$('.delayed_threads').css({
			"max-height": App.Data.xy.win_height - 60,
			width: App.Data.xy.win_width
		});

		// Scroll to bottom
		$('.delayed_threads').scrollTop($('.delayed_threads').height());

		// Draggable
		$(".delayed_thread_inside_view .thread-preview").on('touchstart',App.Plugins.Minimail.thread_main.start);
		$(".delayed_thread_inside_view .thread-preview").on('mousedown',App.Plugins.Minimail.thread_main.start);
		$(".delayed_thread_inside_view .thread-preview").on('touchmove',App.Plugins.Minimail.thread_main.move);
		$(".delayed_thread_inside_view .thread-preview").on('mousemove',App.Plugins.Minimail.thread_main.move);
		$(".delayed_thread_inside_view .thread-preview").on('touchend',App.Plugins.Minimail.thread_main.end);
		$(".delayed_thread_inside_view .thread-preview").on('mouseup',App.Plugins.Minimail.thread_main.end);

		return this;
		
	},


	refresh_and_render_threads: function(){
		var that =  this;

		that.collection = new App.Collections.DelayedThreads();
		that.collection.fetchDelayed({
			success: function(threads) {
				// Does not return models, just JSON data objects
				clog('back with result');
					
				// Store locally
				App.Utils.Storage.set('delayed_threads_and_emails',threads);

				// Render
				that.render_threads(threads);
			}
		});
	},

	render: function() {
		var that = this;

		// Template
		// var template = App.Utils.template('t_undecided');

		// // Write HTML
		// this.$el.html(template());

		// this.$('.sender_status a[data-status="pending"]').trigger('click');

		// Build Search SubView
		// - todo...


		//this.options.senders
		// $(this.el).html(template());


		// $("ul#file_list").selectable();
		// $("ul#file_list li").click(function(){
		// 	if( !$(this).hasClass("ui-selected")){
		// 		$(this).addClass("ui-selected")
		// 		if(!App.Data.Keys.shift && !App.Data.Keys.meta){
		// 			$(this).siblings().removeClass("ui-selected");
		// 		}
		// 	} else {
		// 		if(!App.Data.Keys.shift && !App.Data.Keys.meta){
		// 			$(this).siblings().removeClass("ui-selected");
		// 		}
		// 	}
		// });
		// $("ul#file_list li").draggable({
		// 	appendTo: "body",
		// 	helper: "clone",
		// 	start: function(ev, ui) {        
		// 		if($(this).hasClass("ui-selected")){
		// 			// Great, just continue dragging

		// 		} else {
		// 			if(!App.Data.Keys.shift && !App.Data.Keys.meta){
		// 				$(this).addClass("ui-selected").siblings().removeClass("ui-selected");
		// 			} else {
		// 				$(this).addClass("ui-selected");
		// 			}
		// 		}
		// 	}
		// });

		// Resize window
		// var oTop = $('#file_list').offset().top;
		// var viewportHeight = $(window).height();
		// $('#file_list').height(viewportHeight - oTop - 1 + 'px');
		


		var that = this;

		// Render initial body
		this.render_init();

		// Do we already have some data?
		App.Utils.Storage.get('delayed_threads_and_emails')
			.then(function(threads){

				if(threads != null){
					// Have some local data
					// Trigger a refresh of the data
					// - when the data is refreshed, the view gets refreshed as well
					
					clog('HAVE SOME DATA');
					clog(threads);

					that.render_threads(threads);

				} else {
					clog('NO LOCAL DATA');
				}

				that.refresh_and_render_threads();

			});




		return this;


		// See if data is in the cache
		var cache = false;
		if(cache){
			// Get data from cache
			// - render immediately
			this.render_threads();

		} else {
			// Not already cached
			clog('render_init');
			that.render_init();
			App.Plugins.Minimail.getDelayDue()
				.then(function(threads){
					that.render_threads(threads);
				})
				.fail(function(err){
					clog('Failed loading Delayed');
				});
		}

		return this;
	}
});


App.Views.CommonThread = Backbone.View.extend({
	
	className: 'common_thread_view',

	events: {
		'click .btn[data-action="back"]' : 'go_back',
		'click .btn[data-action="delay"]' : 'click_delay',
		'click .btn[data-action="done"]' : 'click_done',
		'click .btn[data-action="pin"]' : 'click_pin',
		'click .btn[data-action="leisure"]' : 'click_leisure',

		'click .reply' : 'reply',
		'click .forward' : 'forward',

		'click .email_holder .email_body .ParsedDataShowAll span.expander' : 'email_folding',
		'click .email_holder .email_body .ParsedDataShowAll span.edit' : 'edit_email'
	},

	initialize: function(options) {
		_.bindAll(this, 'render');
		_.bindAll(this, 'email_sent');
		_.bindAll(this, 'refresh_and_render_thread');
		var that = this;
		// this.el = this.options.el;

		// Get any local information we have
		// After getting local info, and if we have enough, show the thing
		// Get remote info, merge with Local when it arrives

		// Render the information we have on this Thread
		this.threadid = this.options.threadid

		// Event bindings
		// - also bound at the top of initialize
		App.Events.bind('email_sent',this.email_sent);
		App.Events.bind('thread_updated',this.refresh_and_render_thread);

		// Mark as recently viewed
		App.Plugins.Minimail.add_to_recently_viewed(this.threadid);


		// Get the data that we do have for the thing
		// - re-render after we get the whole thing! 
		// App.Utils.Storage.

		// Get the data difference from what we have
		// - diff and patch
		// - already know the fields we would have requested (that doesn't change at all?)


		// // Render the base view
		// var thread_cached = false;
		// if(thread_cached){
		// 	// Thread is in memory
		// 	// - display base view including Thread
		// 	// - todo...
		// } else {
		// 	// No Thread in memory

		// 	// Display base outline
		// 	// Fetch Thread and Emails for thread

		// 	App.Plugins.Minimail.getThreadAndEmails(this.options.threadid)
		// 		.then(function(returnThread){
		// 			that.render_content(returnThread);
		// 		})
		// 		.fail(function(err){
		// 			clog('Failed getThreadAndEmails');
		// 			clog(err);
		// 		});


		// }

	},

	beforeClose: function(){
		// unbind events
		App.Events.off('email_sent',this.email_sent);
		App.Events.off('thread_updated',this.refresh_and_render_thread);
	},

	set_scroll_position: function(){
		var that = this;

		// Set last scroll position
		this.last_scroll_position = $(window).scrollTop();
		this.$el.attr('last-scroll-position',this.last_scroll_position);

		clog('.' + this.className);
		clog(this.last_scroll_position);

	},

	go_back: function(ev){
		// Going back to mailbox
		// - highlight the correct row we were on? (v2)

		// Is there some way of referencing the Backbone view instead of using jquery? 

		// Re-show .main_body
		$('.main_body').removeClass('nodisplay');

		// Scroll to correct position
		var scrollTo = 0;
		if($('.main_body').attr('last-scroll-position')){
			scrollTo = $('.main_body').attr('last-scroll-position');
		}
		$('.threads_holder').scrollTop(scrollTo);

		// Close myself
		this.close();

		return false;
	},


	click_delay: function(ev){
		// Clicked the "delay" button
		var that = this;

		// Bring up the delay modal
		// - not going to work with the current design, gotta redo the delay modal view

		// Display delay_modal Subview
		var subView = new App.Views.DelayModal({
			context: that,
			threadid: that.threadid
		});
		$('body').append(subView.$el);
		subView.render();

		return false;


	},

	click_done: function(ev){
		// Clicked the "done" (checkmark) button
		var that = this;

		// Mark as Done
		App.Plugins.Minimail.saveAsDone(that.threadid);

		// Return to parent element
		// - tell the screen we're returning to that the element has been marked as Done
		// - todo...

		// go back
		return this.go_back(ev);

	},

	click_pin: function(ev){
		// Trying to Pin something in the email

		// Scan out everything they would possibly want to pin
		// - display each as its own item, and can choose many to pin to different boards

		// Pins work like:
		// - 

		// Launch pinboard for this Thread

		alert('Pinning under development');
		return false;

		this.set_scroll_position();

		Backbone.history.loadUrl('pin/' + this.threadid);


	},

	click_leisure: function(ev){
		// Replying
		var that = this;
		var elem = ev.currentTarget;

		// Display reply boxes
		// - doesn't do Drafts at all yet

		this.set_scroll_position();

		Backbone.history.loadUrl('leisure_create/' + this.threadid);


		return false;
	},

	reply: function(ev){
		// Replying
		var that = this;
		var elem = ev.currentTarget;

		// Display reply boxes
		// - doesn't do Drafts at all yet

		this.set_scroll_position();

		// Load Reply subview
		// Backbone.history.loadUrl('reply/' + this.threadid);

		// Hide myself
		that.$el.addClass('nodisplay');

		// Build the subview
		that.subViewReply = new App.Views.CommonReply({
			threadid: this.threadid
		});
		// Add to window and render
		$('body').append(that.subViewReply.$el);
		that.subViewReply.render();

		// Listen for events

		// Cancel event
		that.subViewReply.ev.on('cancel',function(){
			// Close subview
			
			that.subViewReply.close();

			// Display thread
			that.$el.removeClass('nodisplay');

			// Scroll to correct position
			var scrollTo = 0;
			if($('body > .common_thread_view').attr('last-scroll-position')){
				scrollTo = $('body > .common_thread_view').attr('last-scroll-position');
			}
			$(window).scrollTop(scrollTo);

		});

		// Send event
		that.subViewReply.ev.on('sent',function(){
			// Close subview
			
			that.subViewReply.close();

			// Display thread
			that.$el.removeClass('nodisplay');

			// Scroll to correct position
			var scrollTo = 0;
			if($('body > .common_thread_view').attr('last-scroll-position')){
				scrollTo = $('body > .common_thread_view').attr('last-scroll-position');
			}
			$(window).scrollTop(scrollTo);

		});

		return false;
	},


	forward: function(ev){
		// Forwarding
		// - disabled

		alert('forwarding disabled');
		return false;

	},


	email_sent: function(options){
		// An email was sent
		// - add a "Your email will appear here soon" message

		var that = this;

		this.$('.email_sent_alert').removeClass('nodisplay');


	},


	email_folding: function (ev){
		// Display any hidden emails (previous parts of the conversation)

		var elem = ev.currentTarget;

		var content_holder = $(elem).parents('.email_body');
		//var count = $(content_holder).find('.ParsedDataContent').length;

		// Toggle
		if($(content_holder).hasClass('showAllParsedData')){
			$(content_holder).removeClass('showAllParsedData')
			
			$(content_holder).find('.ParsedDataContent:not([data-level="0"])').hide();

			$(elem).text('...');
		} else {
			$(content_holder).addClass('showAllParsedData')

			$(content_holder).find('.ParsedDataContent:not([data-level="0"])').show();

			$(elem).text('Hide');
		}

	},

	edit_email: function(ev){
		// Edit an email
		var that = this;
		var elem = ev.currentTarget;

		// Email._id
		var id = $(elem).parents('.email').attr('data-id');

		// Set scroll position
		this.set_scroll_position();

		// Launch route
		Backbone.history.loadUrl('edit_email/' + id);

		return false;
	},


	render_init: function(){

	},

	render_fetching: function(){
		// Don't have any info for the Thread
		// - display loading screen

		// Template
		var template = App.Utils.template('t_common_thread_view_loading');

		// Write HTML
		this.$el.html(template());

	},

	render_thread: function(){
		
		clog('rendering Thread');

		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_common_thread_view');

		// build the data
		var data = {
			Thread: App.Data.Store.Thread[this.threadid],
			Email: _.filter( App.Data.Store.Email,function(email){
					if(email.attributes.thread_id == that.threadid) return true;
				})
		};

		// Sort Email
		data.Email = App.Utils.sortBy({
			arr: data.Email,
			path: 'common.date_sec',
			direction: 'asc',
			type: 'num'

		});

		// Write HTML
		this.$el.html(template(data));

		// Resize body_container
		this.resize_fluid_page_elements();
		this.resize_scroller();

		return this;
		
	},

	refresh_and_render_thread: function(){
		// Refresh data for this Thread
		// - causes an update if possible
		var that = this;

		clog('refresh_and_render_thread');

		// Shouldn't be creating a new Collection each time...
		// - whole Model/Collection/View sync and relationships concept is borked in my head anyways
		var tmp_emails = new App.Collections.Emails();
		tmp_emails.fetch_for_thread({
			thread_id: that.threadid,
			success: function(emails){
				// Anything different from the existing look?
				// - update the View with new data
				
				clog('re-rendering Thread');
				that.render_thread();

			}
		});
	},

	render: function() {
		var that = this;



		// Render initial/loading body
		// this.render_init();

		// Do we already have some data?
		// - we MUST already have some data, especially if we just loaded Threads a second ago
		// - unless we get here unexpectedly, in which case a "loading" screen should be shown
		// - maybe we just viewed this Thread, so we have it cached! 

		var data = App.Data.Store.Thread[this.threadid];
		if(data == undefined){
			// Thread not set at all
			// alert('thread not set at all');
			that.render_fetching();
			that.refresh_and_render_thread();

			// Shouldn't not be set at all
			// - show a total loading screen (loading Thread and Emails)
			// - todo...


			return false;
		} else {
			// We have some Thread data
			// probably some Email data for that Thread too

			// Display everything we have for the Thread and Emails

			// Check the API for any updates to the data that we have
			// - see if the version are different
			// - if versions are different than, don't worry about it because we're only updating the data we care about here

			// conditions: {
			// 	_modified : {
			// 		"$ne" : previous_modified_version
			// 	}
			// }

			// Get all the Emails for that Thread
			// - more than likely this barely changes (or maybe has a single new Email)
			// - I should already have the relationship in here

			// I already retrieved some of the emails beforehand
			// - I should have all the Email models at least in memory
			// - the ajax request is an "in case I fucked up and data has changed" type of request

			// var emails = _.filter( App.Data.Store.Email,function(email){
			// 	if(email.attributes.thread_id == that.threadid) return true;
			// });
			
			that.render_thread();

			// Have a partial list of emails, and a partial list of Threads
			// - render both
			// - trigger the updater to run

			that.refresh_and_render_thread();

		}

		return this;

	}

});


App.Views.CommonEditEmail = Backbone.View.extend({
	
	className: 'common_edit_email',

	events: {
		'click button[data-action="cancel"]' : 'cancel',
		'click button[data-action="save"]' : 'save'
	},

	initialize: function(options) {
		_.bindAll(this, 'render');
		var that = this;
		// this.el = this.options.el;

		// Render the information we have on this Thread
		this.emailid = this.options.emailid

	},

	cancel: function(ev){
		// Going back to mailbox
		// - highlight the correct row we were on? (v2)

		// Is there some way of referencing the Backbone view instead of using jquery? 

		// Re-show .main_body
		$('body > .common_thread_view').removeClass('nodisplay');

		// Scroll to correct position
		var scrollTo = 0;
		if($('body > .common_thread_view').attr('last-scroll-position')){
			scrollTo = $('body > .common_thread_view').attr('last-scroll-position');
		}
		$(window).scrollTop(scrollTo);
		
		// Close myself
		this.close();

		return false;
	},

	save: function(ev){
		// Save the updated Email
		var that = this;
		var elem = ev.currentTarget;

		// Save
		var id = this.emailid;
		var textbody = this.$('#textbody').val();

		// Update local
		// - AppPkgDevMinimail is probably not created yet
		if(App.Data.Store.Email[this.emailid].app.AppPkgDevMinimail == undefined){
			App.Data.Store.Email[this.emailid].app.AppPkgDevMinimail = {};
		}
		App.Data.Store.Email[this.emailid].app.AppPkgDevMinimail.textbody_edited = textbody

		// Update remote
		Api.update({
			data: {
				model: 'Email',
				id: id,
				paths: {
					"$set" : {
						"app.AppPkgDevMinimail.textbody_edited" : textbody
					}
				}
			},
			success: function(response){
				response = JSON.parse(response);
			}
		});

		// Emit event
		App.Events.trigger("thread_updated", true);

		// Close view and return
		this.cancel();

		// Should be updating the previous thread too

		return false;

	},

	render_email: function(){
		
		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_common_edit_email');

		// Get the body
		// - either an edited one, or the original
		var Email = App.Data.Store.Email[this.emailid];
		var textbody = '';
		try {
			if(Email.app.AppPkgDevMinimail.textbody_edited != undefined){
				textbody = Email.app.AppPkgDevMinimail.textbody_edited;
			} else {
				// Strip html characters?
				// - already done?
				textbody = Email.original.TextBody;
			}
		} catch (err){
			textbody = Email.original.TextBody;
		}
		var data = {
			textbody: textbody
		};

		// Write HTML
		this.$el.html(template(data));

		// Scroll to top
		$(window).scrollTop(0);

		// Focus and bring up keyboard
		this.$('#textbody').focus();

		return this;
		
	},

	render: function() {
		var that = this;

		var email_data = App.Data.Store.Email[this.emailid];
		if(email_data == undefined){
			// Thread not set at all
			alert('email not set at all');

			// Shouldn't not be set at all

			return false;
		} else {
			// Render the email data we have
			that.render_email();

		}

		return this;

	}

});


App.Views.LeisureCreate = Backbone.View.extend({
	// Create a new AppMinimailLeisureFilter

	className: 'common_leisure_create_view',

	events: {

		// 'click .btn[data-action="thread"]' : 'view_thread',
		// 'click .btn[data-action="back"]' : 'view_reply',
		'click .btn[data-action="cancel"]' : 'cancel',
		'click .btn[data-action="create"]' : 'create',

		'click .filter_option' : 'filter_option'

		// 'click .add_attachment' : 'add_attachment'

	},

	disable_buttons: false,

	initialize: function(options) {
		_.bindAll(this, 'render');
		var that = this;
		// this.el = this.options.el;

		// Get any local information we have
		// After getting local info, and if we have enough, show the thing
		// Get remote info, merge with Local when it arrives

		// Render the information we have on this Thread
		this.threadid = this.options.threadid

		// Get the data that we do have for the thing
		// - re-render after we get the whole thing! 
		// App.Utils.Storage.

		// Get the data difference from what we have
		// - diff and patch
		// - already know the fields we would have requested (that doesn't change at all?)


		// // Render the base view
		// var thread_cached = false;
		// if(thread_cached){
		// 	// Thread is in memory
		// 	// - display base view including Thread
		// 	// - todo...
		// } else {
		// 	// No Thread in memory

		// 	// Display base outline
		// 	// Fetch Thread and Emails for thread

		// 	App.Plugins.Minimail.getThreadAndEmails(this.options.threadid)
		// 		.then(function(returnThread){
		// 			that.render_content(returnThread);
		// 		})
		// 		.fail(function(err){
		// 			clog('Failed getThreadAndEmails');
		// 			clog(err);
		// 		});


		// }

	},

	filter_option: function(ev){
		var elem = ev.currentTarget;

		$(elem).addClass('active');
		this.$('.filter_option:not(.active)').remove();

		this.$('.filter_create_name').removeClass('nodisplay');

	},

	cancel: function(ev){
		// Going back to mailbox
		// - highlight the correct row we were on? (v2)

		// Is there some way of referencing the Backbone view instead of using jquery? 

		// Re-show .main_body
		$('body > .common_thread_view').removeClass('nodisplay');

		// Scroll to correct position
		var scrollTo = 0;
		if($('body > .common_thread_view').attr('last-scroll-position')){
			scrollTo = $('body > .common_thread_view').attr('last-scroll-position');
		}
		$(window).scrollTop(scrollTo);

		// this.after_sent();
		
		// Close myself
		this.close();

		return false;
	},

	create: function(ev){
		// Create the filter
		var that = this;

		// Get form data
		var From 	= $.trim(that.$('#from').val()),
			To 		= $.trim(that.$('#to').val()),
			Subject = $.trim(that.$('#subject').val()),
			Name 	= $.trim(that.$('#name').val());

		// Validate form data

		// - must have chosen a filter_option
		if(that.$('.filter_option.active').length < 1){
			alert('Choose your filter criteria!');
			return;
		}

		// get the input
		var $input = that.$('.filter_option.active input');

		// Get criteria
		var regex_key = '',
			regex_value = '';
		switch($input.attr('id')){
			case 'from':
				regex_key = "original.headers.From";
				break;

			case 'to':
				regex_key = "original.headers.To";
				break;

			case 'subject':
				regex_key = "original.headers.Subject";
				break;

			default:
				//shit
				alert('failure');
				return;
				break;
		}

		// Regex value
		// - prevent weird characters?
		// - tell them it is a regex?
		regex_value = $input.val();
		regex_value = regex_value.replace(/[#-}]/g, '\\$&'); // escape regex characters from search string: http://stackoverflow.com/questions/6300183/sanitize-string-of-regex-characters-before-regexp-build

		// Empty regex_value?
		if(regex_value.length < 1){
			alert('Enter some criteria for your filter!');
			return;
		}

		// Get name of new filter
		var Name = $.trim(that.$('#name').val());

		// duplicate?
		// - don't care if it is?

		// Empty name?
		if(Name.length < 1){
			alert('Enter a name for this filter!');
			return;
		}

		clog('Filter Data');
		clog(
			{
				"name": Name,
					"filters": [{
						"type": "keyregex1",
						"key": regex_key,
						"regex": "("+regex_value+")",
						"modifiers": "ig"
					}]
			});

		// Save new filter!

		// Make API request
		Api.write({
			data: {
				model: 'AppMinimailLeisureFilter',
				event: 'AppMinimailLeisureFilter.new',
				obj: {
					"name": Name,
						"filters": [{
							"type": "keyregex1",
							"key": regex_key,
							"regex": "("+regex_value+")",
							"modifiers": "ig"
						}]
				}
			},
			success: function(response){
				response = JSON.parse(response);

				if(response.code != 200){
					alert('Failed creating leisure filter');
					return;
				}

				// If created successfully, update this Thread to the Filter
				var filter_id = response.data._id;

				Api.update({
					data: {
						model: 'Thread',
						id: that.threadid,
						paths: {
							"$push" : {
								"app.AppPkgDevMinimail.leisure_filters" : {
									"_id" : filter_id,
									"name" : Name
								}
							}
						}
					},
					success: function(response){
						// Successfully updated thread
						response = JSON.parse(response);

						if(response.code != 200){
							alert('Failed updating Thread with leisure id');
							return;
						}
					}
				});

			}
		});

		// Move to "waiting for success" screen
		// - just "assume" it is going to work?

		// Save as Done
		App.Plugins.Minimail.saveAsDone(that.threadid);

		// Remove the view and go back
		App.Events.trigger('thread_done',that.threadid);

		// close out this view?
		this.cancel();

		// Trigger an event that a Thread has been marked as done
		// - probably removes it?
		// - backbone does this, if I use it correctly (whole fucking point)


	},

	render: function() {
		var that = this;

		// Template
		var template = App.Utils.template('t_common_leisure_create');

		// Get data
		// - must have Thread data already?
		// - wait until we do (probably already fetching it?)


		var Thread = App.Data.Store.Thread[this.threadid];
		if(Thread == undefined){
			// Thread not set at all
			alert('Thread not currently set');
			this.cancel();
			return this;
		}

		// Get the first email in the Thread
		// - only expecting to filter based on the first email
		//		- makes sense?
		var emails = _.filter(App.Data.Store.Email,function(Email){
			if(Email.attributes.thread_id == Thread._id){
				return true;
			}
		});

		if(emails.length < 1){
			// No email
			alert('Unable to load Email');
			this.cancel();
			return this;
		}

		// Sort to find the first Email
		emails = App.Utils.sortBy({
			arr: emails,
			path: 'common.date_sec',
			direction: 'asc',
			type: 'num'
		});
		
		// Get first email
		var Email = emails[0];

		// Get From
		var From = '';
		try {
			From = Email.original.headers.From_Parsed[0][1];
		} catch(err){
			
		}

		From = From.toLowerCase();

		// Get To
		var To = '';
		try {
			To = Email.original.headers.To_Parsed[0][1];
		} catch(err){
			
		}

		From = From.toLowerCase();

		// Words
		var Words = [];
		try {
			Words = Email.original.headers.Subject.split(' '); // split on spaces
		} catch(err){

		}

		var data = {
			normal: {
				from: From, // Only default that gets set
				to: To,
				subject: '', // give a list of possible words to use? (break by spaces, simple)
				words: Words,
				name: ''
			}
		};

		// Write HTML
		this.$el.html(template(data));

		// Resize window
		this.resize_fluid_page_elements();
		this.resize_scroller();

		return this;

	}

});


App.Views.CommonPin = Backbone.View.extend({
	
	className: 'common_thread_pin',

	events: {

	},

	initialize: function(options) {
		_.bindAll(this, 'render');
		var that = this;
		// this.el = this.options.el;

		// Render the information we have on this Thread
		this.threadid = this.options.threadid

	},

	cancel: function(ev){
		// Going back to mailbox
		// - highlight the correct row we were on? (v2)

		// Is there some way of referencing the Backbone view instead of using jquery? 

		// Re-show .main_body
		$('body > .common_thread_view').removeClass('nodisplay');

		// Scroll to correct position
		var scrollTo = 0;
		if($('body > .common_thread_view').attr('last-scroll-position')){
			scrollTo = $('body > .common_thread_view').attr('last-scroll-position');
		}
		$(window).scrollTop(scrollTo);

		// this.after_sent();
		
		// Close myself
		this.close();

		return false;
	},

	render_thread: function(){
		
		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_common_pin');

		var Thread = App.Data.Store.Thread[this.threadid];
		var Emails = _.filter(App.Data.Store.Email,function(email){
				if(email.attributes.thread_id == that.threadid) return true;
			});

		// Optimize View for:
		// - few pinnable options, but always at least 2 (thread, sender, or other person)
		// - speed in pinning one Item to one Topic
		// - finding the thing I'm looking for later

		// Pins work alongside Labels
		// - Labels are a quick way to save the whole Thread/Email (easiest thing to do)

		// What do you want to highlight?
		// - some text in the email
		// - whole email
		// - an attachment
		// - the sender or another person

		// Pin means Easier to Find Later. Surfacing the content enough. 
		// - Highlighting and labeling something makes it easier to find later

		// Auto-pin some things? (no, keep it manual-only at first, don't do anything unexpected)
		// - Phone numbers
		// - Shipping tracking number
		// - Attachments (nah, just got lost in the clutter)

		// Figure out possible pin options
		// - what is already pinned? 

		// Have we scanned all the Emails already?
		// - scan each email, and update them accordingly
		// - not updating the server with these values?
		_.each(Emails,function(email,index,list){
			// Already scanned?
			if(email.app.AppPkgDevMinimail.pin_scanned == true){
				clog('=Not scanning email');
				return;
			}
			clog('Scanning email for pinnable material');

			// Not scanned, run the scan over this email
			var scan_results = App.Utils.get_useful_info_from_email(email);

			// Have a list of "useful" things
			// - list is a complex object that has metadata about the pinned thing
			// - thread_id
			// - text
			// - image

			// Of the "possible" things to pin, what are we actually pinning?

			// Create 
			Email.app.AppPkgDevMinimail.pinnable = [
				{
					type: 'text', // text (phone, addresses, links, etc.), attachment, thread, 
					data: {
						// Some cursory data about the Thread
						// - 
					}

				},
				{
					type: 'attachment', // text (phone, addresses, etc.), attachment, thread, 
					data: {
						// all the attachment details?
					}

				}

			];

			// Only 1 collection for Pins
			// - AppPkgDevMinimailPins

			// Mark as scanned
			App.Data.Store.Email[email._id].pin_scanned = true;

		});

		// Get things we can Pin
		var pinnable = App.Plugins.Minimail.getItemsToPinFromThread(this.threadid);

		// What have we already Pinned from this Thread? 
		var already_pinned = App.Plugins.Minimail.alreadyPinnedFromThread(this.threadid);

		// Merge these together (removing duplicates?
		// - need to scan the Thread and see if any of the Emails haven't actually been scanned yet
		// - emails won't be changing, so it is ok if they get scanned only 1 time



		// Figure out who I'm replying to
		// - inlcude everybody in the email that isn't myself
		// - by default, because it is easier to remove than to add people
		var tmp_participants = _.map(data.Email, function(email){
			// Get the From and Reply-To addresses
			var get_from = ['To','From','Reply-To'];
			var addresses = [];
			_.each(get_from,function(address){
				if(email.original.headers[address + '_Parsed'] != undefined){
					_.each(email.original.headers[address + '_Parsed'],function(parsed_email){
						// My email?
						var ok = true;

						// Sent from myself
						// - disclude? (only if no others?)
						if($.inArray(parsed_email[1], App.Data.UserEmailAccounts_Quick) != -1){
							return false;
						}

						// Add address to list
						addresses.push(parsed_email[1]);

					});
				}
			});
			return addresses;
		});
		
		var tmp_participants2 = [];
		_.each(tmp_participants,function(p1){
			_.each(p1,function(p2){
				tmp_participants2.push(p2);
			});
		});

		// Unique
		tmp_participants2 = _.uniq(tmp_participants2);

		// Filter to valid emails
		tmp_participants2 = _.filter(tmp_participants2,function(p){
			// valid email?
			if(App.Utils.Validate.email(p)){
				return true;
			}
			return false;
		});

		data.Participants = tmp_participants2;


		// Sort Email
		data.Email = App.Utils.sortBy({
			arr: data.Email,
			path: 'common.date_sec',
			direction: 'asc',
			type: 'num'

		});

		// Set for this view object
		this.thread_data = data;


		// Write HTML
		this.$el.html(template(data));

		// Focus on textarea
		// this.$('.textarea').focus();

		// Scroll to top
		$(window).scrollTop(0);

		return this;
		
	},

	render: function() {
		var that = this;

		var thread_data = App.Data.Store.Thread[this.threadid];
		if(data == undefined){
			// Thread not set at all
			alert('thread not set at all');

			// Shouldn't not be set at all
			// - show a total loading screen (loading Thread and Emails)
			// - todo...


			return false;
		} else {
			// Render the thread data we have
			that.render_thread();

		}

		return this;

	}

});


App.Views.CommonReply = Backbone.View.extend({
	
	className: 'common_thread_reply',

	events: {

		'click .btn[data-action="thread"]' : 'view_thread',
		'click .btn[data-action="back"]' : 'view_reply',
		'click .btn[data-action="cancel"]' : 'cancel',
		'click .btn[data-action="send"]' : 'send',

		'click .btn[data-action="contacts"]' : 'contact',

		'click .remove_address' : 'remove_address',

		'click .add_attachment' : 'add_attachment',
		'click .add_photo' : 'add_photo'

	},

	ev: _.extend({}, Backbone.Events),

	disable_buttons: false,

	initialize: function(options) {
		_.bindAll(this, 'render');
		_.bindAll(this, 'beforeClose');
		var that = this;
		// this.el = this.options.el;

		// Get any local information we have
		// After getting local info, and if we have enough, show the thing
		// Get remote info, merge with Local when it arrives

		// Render the information we have on this Thread
		this.threadid = this.options.threadid

		// Get the data that we do have for the thing
		// - re-render after we get the whole thing! 
		// App.Utils.Storage.

		// Get the data difference from what we have
		// - diff and patch
		// - already know the fields we would have requested (that doesn't change at all?)


		// // Render the base view
		// var thread_cached = false;
		// if(thread_cached){
		// 	// Thread is in memory
		// 	// - display base view including Thread
		// 	// - todo...
		// } else {
		// 	// No Thread in memory

		// 	// Display base outline
		// 	// Fetch Thread and Emails for thread

		// 	App.Plugins.Minimail.getThreadAndEmails(this.options.threadid)
		// 		.then(function(returnThread){
		// 			that.render_content(returnThread);
		// 		})
		// 		.fail(function(err){
		// 			clog('Failed getThreadAndEmails');
		// 			clog(err);
		// 		});
		

		// }

	},

	beforeClose: function(){
		var that = this;

		// unbind events
		this.ev.unbind();

		return;
	},


	remove_address: function(ev){
		// remove a person from the sending list

		var that = this;
		var elem = ev.currentTarget;

		$(elem).parents('.participant').remove();

	},


	cancel: function(ev){
		// Going back to mailbox
		// - highlight the correct row we were on? (v2)
		var that = this,
			elem = ev.currentTarget;

		// emit a cancel event to the parent
		this.ev.trigger('cancel');

		return false;
	},

	after_sent: function(ev){
		// Going back to mailbox
		// - highlight the correct row we were on? (v2)
		// - todo: show that we are waiting for the email to actually be parsed by Gmail and "caught" by Emailbox
		var that = this;
		// Is there some way of referencing the Backbone view instead of using jquery? 

		// Re-show .main_body
		$('body > .common_thread_view').removeClass('nodisplay');

		// Scroll to correct position
		var scrollTo = 0;
		if($('body > .common_thread_view').attr('last-scroll-position')){
			scrollTo = $('body > .common_thread_view').attr('last-scroll-position');
		}
		$(window).scrollTop(scrollTo);

		// Update Thread
		var tmp_emails = new App.Collections.Emails();
		tmp_emails.fetch_for_thread({
			thread_id: that.threadid
		});

		App.Events.trigger("email_sent", true);

		// Close myself
		this.close();

		return false;
	},

	send: function(ev){
		// Validate sending the email
		// Send the email
		var that = this;

		var elem = ev.currentTarget;

		// Disable buttons
		$(elem).text('Sending...');
		$(elem).attr('disabled','disabled');
		this.disable_buttons = true;

		// Throw into a different view after success?
		

		// In Reply To
		var in_reply = this.thread_data.Email[this.thread_data.Email.length - 1].common['Message-Id'];

		// References (other message-ids)
		var references = _.map(this.thread_data.Email,function(email){
			return email.common['Message-Id'];
		});

		// To
		var to = [];
		this.$('.participant').each(function(index){
			to.push($(this).attr('data-email'));
		});
		to = to.join(',');

		// Send return email
		var eventData = {
			event: 'Email.send.validate',
			delay: 0,
			obj: {
				To: to,
				From: App.Data.UserEmailAccounts.accounts[0].email,
				Subject: that.thread_data.Email[that.thread_data.Email.length - 1].original.headers.Subject,
				Text: that.$('#textbody').val(),
				headers: {
					"In-Reply-To" : in_reply,
					"References" : references.join(',')
				}
			}
		};

		// Validate sending
		Api.event({
			data: eventData,
			response: {
				"pkg.native.email" : function(response){
					// Handle response (see if validated to send)
					// clog('Response');
					// clog(response);
					// clog(response.body.code);

					// Update the view code
					if(response.body.code == 200){
						// Ok, validated sending this email
						clog('Valid email to send');
					} else {
						// Failed, had an error

						alert('Sorry, Invalid Email');

						$(elem).text('Send');
						$(elem).attr('disabled',false);
						that.disable_buttons = false;
						return false;
					}

					// Get rate-limit info
					tmp_rate_limit = response.body.data;

					// Over rate limit?
					if(tmp_rate_limit.current + 1 >= tmp_rate_limit.rate_limit){

						alert('Sorry, Over the Rate Limit (25 emails per 6 hours)');

						$(elem).text('Send');
						$(elem).attr('disabled',false);
						that.disable_buttons = false;
						return false;
						
					}

					// All good, SEND Email
					eventData.event = 'Email.send';

					// Log
					clog('sending reply Email');
					clog(eventData);

					Api.event({
						data: eventData,
						response: {
							"pkg.native.email" : function(response){
								
								// Update the view code
								if(response.body.code == 200){
									// Sent successfully

								} else {
									// Failed, had an error sending

									alert('Sorry, we might have failed sending this email');
									
									$(elem).text('Send');
									$(elem).attr('disabled',false);
									that.disable_buttons = false;
									return false;
								}


								// Sent successfully! 

								// Add to Email thread?
								// - no, wait for the Email to be received, and it was be updated

								that.after_sent();

							}
						}
					});



					// if validation ok, then continue to the next one
					// - resolve or call?

				}
			}
		});


		return false;

	},


	view_thread: function(ev){
		// Show the Thread

		var that = this;

		this.$('.common_thread_view').removeClass('nodisplay');
		this.$('.common_thread_reply_content').addClass('nodisplay');

		$(window).scrollTop(0);

		return false;

	},


	view_reply: function(ev){
		// Show the Thread

		var that = this;

		this.$('.common_thread_view').addClass('nodisplay');
		this.$('.common_thread_reply_content').removeClass('nodisplay');

		$(window).scrollTop(0);

		return false;

	},

	contact: function(ev){
		// Choose a contact
		var that = this;
			elem = ev.currentTarget;

		// Validate email

		if(useForge){
			forge.contact.select(function(contact){
				// Got contact
				// - validate Email

				// Gather only emails
				var emails = _.map(contact.emails,function(email){
					return email.value;
				});

				// Valid email?
				emails = _.filter(emails,function(email){
					if(App.Utils.Validate.email(email)){
						return true;
					}
				});

				// Unique?
				emails = _.uniq(emails);
				// emails = emails.concat(emails); // testing multiple emails

				// How many left?
				if(emails.length == 1){
					// Only 1 email
					that.chose_email(emails[0]);

				} else if(emails.length > 1) {
					// Show subview to choose which email to use
					var subView = new App.Views.SelectEmailList({
						chose_email: that.chose_email,
						emails: emails
					});
					$('body > .full_page').addClass('nodisplay');
					$('body').append(subView.$el);
					subView.render();

				} else {
					// No emails found
					alert('No emails found for that contact');
					return false;
				}

			},function(content){
				// Error
				clog('Error getting contact');
			});
		} else if(usePg){

			// Already have contacts data?

			// Change element to "loading contacts"
			$(elem).text('Loading...');

			// Display contacts chooser subview
			window.setTimeout(function(){
				that.subViewContacts = new App.Views.ChooseContact({
					Parent: that,
					multiple: true
				});
				that.$el.addClass('nodisplay');
				$('body').append(that.subViewContacts.$el);
				that.subViewContacts.render();

				// Change text back
				$(elem).text('Contacts');

			},1);



		} else {

			// use sample data
			// $(elem).text('Loading...');

			that.subViewContacts = new App.Views.ChooseContact({
				Parent: that,
				multiple: true,
				contacts: App.Data.tmp
			});
			that.$el.addClass('nodisplay');
			$('body').append(that.subViewContacts.$el);
			that.subViewContacts.render();



			// this.contact_write();


		}

		return false;

	},

	contact_write: function(ev){
		// Enter an email directly
		var that = this;

		var email = prompt('Write Email Address');
		if(!email){
			return false;
		}

		if(App.Utils.Validate.email(email)){

			// var subView = new App.Views.SelectEmailList({
			// 	chose_email: that.chose_email,
			// 	emails: [email,email]
			// });
			// $('body > div').addClass('nodisplay');
			// $('body').append(subView.$el);
			// subView.render();

			// Add using a template
			that.chose_email(email);

		} else {
			alert('Invalid Email Address');
		}

	},

	chose_email: function(email){
		// Add the emailt to the list
		var that = this;

		// Add using a template
		var template = App.Utils.template('t_compose_recipient');

		// If exists, display it
		if(email){
			that.$('.addresses').append(template(email));
		}

	},


	email_folding: function (ev){
		// Display any hidden emails (previous parts of the conversation)

		var elem = ev.currentTarget;

		var content_holder = $(elem).parents('.email_body');
		//var count = $(content_holder).find('.ParsedDataContent').length;

		// Toggle
		if($(content_holder).hasClass('showAllParsedData')){
			$(content_holder).removeClass('showAllParsedData')
			
			$(content_holder).find('.ParsedDataContent:not([data-level="0"])').hide();

			$(elem).text('...');
		} else {
			$(content_holder).addClass('showAllParsedData')

			$(content_holder).find('.ParsedDataContent:not([data-level="0"])').show();

			$(elem).text('Hide');
		}

	},

	add_attachment: function(){

		// filepicker.getFile(function(FPFile){
		// 	clog(FPFile.url);
		// });
		filepicker.getFile("*/*", function(url, metadata){
			alert("You picked: "+url);
			window.console.log('picked');
			window.console.log(metadata);
			window.console.log(metadata.toString());
		});

		return false;
	},


	add_photo: function(ev){
		// Launch the photo taker
		// - uses either the camera, gallery, or the webcam
		var that = this;
		var elem = ev.currentTarget;

		if(useForge){
			forge.file.getImage({
				// params here
				width: 1000
			},function(file){
				// Success
				clog(file);
				clog(JSON.stringify(file));

				// Show a temporary image in the attachments thing
				forge.file.URL(file,function(url){
					// write template
					var template = App.Utils.template('t_common_photo_preview_image');

					// Append
					$('.compose_attachments').append(template({url: url}));

					clog(url);
					

				},function(content){

				});

			},function(content){
				// Error
				// - might have just canceling getting an image? 
				clog('Error');

			});
		}

		if(usePg){
			
			// Launch Camera
			// - also allow photo album? Anything else by default? 
			navigator.camera.getPicture(function(imageURI){

				// Todo: Save file to filepicker
				// - save it where? To dropbox? File upload API? 

				// Write template
				var template = App.Utils.template('t_common_photo_preview_image');

				// Append
				$('.compose_attachments').append(template({url: 'missing.png'}));

				// clog(imageURI);

			}, function(err){
				console.log('Error getting image');
				console.log(err);
			}, { 
				quality: 20, 
				destinationType: Camera.DestinationType.FILE_URI,
				correctOrientation: true,
				allowEdit: true, 
				encodingType: Camera.EncodingType.PNG,
				targetWidth: 1000,
				targetHeight: 1000
			});

		}

	},


	render_init: function(){

	},

	render_thread: function(){
		
		clog('rendering Thread');

		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_common_thread_reply');

		// build the data
		var data = {
			Thread: App.Data.Store.Thread[this.threadid],
			Email: _.filter( App.Data.Store.Email,function(email){
					if(email.attributes.thread_id == that.threadid) return true;
				})
		};	

		// Figure out who I'm replying to
		// - inlcude everybody in the email that isn't myself
		// - by default, because it is easier to remove than to add people
		var tmp_participants = _.map(data.Email, function(email){
			// Get the From and Reply-To addresses
			var get_from = ['To','From','Reply-To'];
			var addresses = [];
			_.each(get_from,function(address){
				if(email.original.headers[address + '_Parsed'] != undefined){
					_.each(email.original.headers[address + '_Parsed'],function(parsed_email){
						// My email?
						var ok = true;

						// Sent from myself
						// - disclude? (only if no others?)
						if($.inArray(parsed_email[1], App.Data.UserEmailAccounts_Quick) != -1){
							return false;
						}

						// Add address to list
						addresses.push(parsed_email[1]);

					});
				}
			});
			return addresses;
		});
		
		var tmp_participants2 = [];
		_.each(tmp_participants,function(p1){
			_.each(p1,function(p2){
				tmp_participants2.push(p2);
			});
		});

		// Unique
		tmp_participants2 = _.uniq(tmp_participants2);

		// Filter to valid emails
		tmp_participants2 = _.filter(tmp_participants2,function(p){
			// valid email?
			if(App.Utils.Validate.email(p)){
				return true;
			}
			return false;
		});

		data.Participants = tmp_participants2;


		// Sort Email
		data.Email = App.Utils.sortBy({
			arr: data.Email,
			path: 'common.date_sec',
			direction: 'asc',
			type: 'num'

		});

		// Set for this view object
		this.thread_data = data;


		// Write HTML
		this.$el.html(template(data));

		// Focus on textarea
		// this.$('.textarea').focus();

		// Scroll to top
		$(window).scrollTop(0);

		return this;
		
	},

	render: function() {
		var that = this;

		var data = App.Data.Store.Thread[this.threadid];
		if(data == undefined){
			alert('thread data not set, not loading');
			// Thread not set at all
			// - get it and start replying
			//		- should be able to start replying right away, load details in a minute
			
			// Template
			var template = App.Utils.template('t_common_loading');

			// Write HTML
			this.$el.html(template());


			return this;
		} else {
			// Just render the Thread data (we should have it)
			
			var tmp_emails = new App.Collections.Emails();
			tmp_emails.fetch_for_thread({
				thread_id: that.threadid,
				success: function(emails){
					// Anything different from the existing look?
					// - update the View with new data
					
					clog('re-rendering Thread');
					// that.render();

				}
			});

			that.render_thread();

		}

		return this;

	}

});


App.Views.CommonCompose = Backbone.View.extend({
	
	className: 'common_compose',

	events: {

		'click .btn[data-action="contact"]' : 'contact',
		'click .btn[data-action="contact_write"]' : 'contact_write',
		'click .btn[data-action="cancel"]' : 'cancel',
		'click .btn[data-action="send"]' : 'send',

		'click .remove_address' : 'remove_address',

		'click .add_attachment' : 'add_attachment',
		'click .add_photo' : 'add_photo'

	},

	disable_buttons: false,

	initialize: function(options) {
		_.bindAll(this, 'render');
		_.bindAll(this, 'chose_email');
		_.bindAll(this, 'enable_send_button');

		var that = this;
		// this.el = this.options.el;

	},


	remove_address: function(ev){
		// remove a person from the sending list

		var that = this;
		var elem = ev.currentTarget;

		$(elem).parents('.participant').remove();

	},

	contact: function(ev){
		// Choose a contact
		var that = this;
			elem = ev.currentTarget;

		// Validate email

		if(useForge){
			forge.contact.select(function(contact){
				// Got contact
				// - validate Email

				// Gather only emails
				var emails = _.map(contact.emails,function(email){
					return email.value;
				});

				// Valid email?
				emails = _.filter(emails,function(email){
					if(App.Utils.Validate.email(email)){
						return true;
					}
				});

				// Unique?
				emails = _.uniq(emails);
				// emails = emails.concat(emails); // testing multiple emails

				// How many left?
				if(emails.length == 1){
					// Only 1 email
					that.chose_email(emails[0]);

				} else if(emails.length > 1) {
					// Show subview to choose which email to use
					var subView = new App.Views.SelectEmailList({
						chose_email: that.chose_email,
						emails: emails
					});
					$('body > .full_page').addClass('nodisplay');
					$('body').append(subView.$el);
					subView.render();

				} else {
					// No emails found
					alert('No emails found for that contact');
					return false;
				}

			},function(content){
				// Error
				clog('Error getting contact');
			});
		} else if(usePg){

			// Already have contacts data?

			// Change element to "loading contacts"
			$(elem).text('Loading...');

			// Display contacts chooser subview
			window.setTimeout(function(){
				that.subViewContacts = new App.Views.ChooseContact({
					Parent: that,
					multiple: true
				});
				that.$el.addClass('nodisplay');
				$('body').append(that.subViewContacts.$el);
				that.subViewContacts.render();

				// Change text back
				$(elem).text('Contacts');

			},1);



		} else {

			// use sample data
			// $(elem).text('Loading...');

			that.subViewContacts = new App.Views.ChooseContact({
				Parent: that,
				multiple: true,
				contacts: App.Data.tmp
			});
			that.$el.addClass('nodisplay');
			$('body').append(that.subViewContacts.$el);
			that.subViewContacts.render();



			// this.contact_write();


		}

		return false;

	},

	contact_write: function(ev){
		// Enter an email directly
		var that = this;

		var email = prompt('Write Email Address');
		if(!email){
			return false;
		}

		if(App.Utils.Validate.email(email)){

			// var subView = new App.Views.SelectEmailList({
			// 	chose_email: that.chose_email,
			// 	emails: [email,email]
			// });
			// $('body > div').addClass('nodisplay');
			// $('body').append(subView.$el);
			// subView.render();

			// Add using a template
			that.chose_email(email);

		} else {
			alert('Invalid Email Address');
		}

	},

	chose_email: function(email){
		// Add the emailt to the list
		var that = this;

		// Add using a template
		var template = App.Utils.template('t_compose_recipient');

		// If exists, display it
		if(email){
			that.$('.addresses').append(template(email));
		}

	},

	cancel: function(ev){
		// Going back to mailbox
		// - highlight the correct row we were on? (v2)

		// Is there some way of referencing the Backbone view instead of using jquery? 

		// Re-show .main_body
		$('body > .main_body').removeClass('nodisplay');

		// Scroll to correct position
		var scrollTo = 0;
		if($('body > .main_body').attr('last-scroll-position')){
			scrollTo = $('body > .main_body').attr('last-scroll-position');
		}
		$('.threads_holder').scrollTop(scrollTo);

		// this.after_sent();
		
		// Close myself
		this.close();

		return false;
	},

	after_sent: function(ev){
		// Going back to mailbox
		// - highlight the correct row we were on? (v2)
		// - todo: show that we are waiting for the email to actually be parsed by Gmail and "caught" by Emailbox
		var that = this;
		// Is there some way of referencing the Backbone view instead of using jquery? 

		// Re-show .main_body
		$('body > .main_body').removeClass('nodisplay');

		// Scroll to correct position
		var scrollTo = 0;
		if($('body > .main_body').attr('last-scroll-position')){
			scrollTo = $('body > .main_body').attr('last-scroll-position');
		}
		$('.threads_holder').scrollTop(scrollTo);

		// Update Thread
		// var tmp_emails = new App.Collections.Emails();
		// tmp_emails.fetch_for_thread({
		// 	thread_id: that.threadid
		// });

		App.Events.trigger("email_compose_sent", true);

		// Toast
		App.Utils.toast('Email Sent Successfully');

		// Close myself
		this.close();

		return false;
	},

	enable_send_button: function(){
		var that = this;

		this.$('.btn[data-action="send"]').text('Send');
		this.$('.btn[data-action="send"]').attr('disabled',false);
		that.disable_buttons = false;
		
	},

	send: function(ev){
		// Validate sending the email
		// Send the email
		var that = this;

		var elem = ev.currentTarget;

		// Disable buttons
		$(elem).text('Sending...');
		$(elem).attr('disabled','disabled');
		this.disable_buttons = true;

		// Throw into a different view after success?

		// To
		var to = [];
		this.$('.participant').each(function(index){
			to.push($(this).attr('data-email'));
		});

		// At least one? 
		if(to.length < 1){
			alert('Please include a recipient!');

			that.enable_send_button();
			return;
		}

		to = to.join(',');

		// Send return email
		var eventData = {
			event: 'Email.send.validate',
			delay: 0,
			obj: {
				To: to,
				From: App.Data.UserEmailAccounts.accounts[0].email,
				Subject: that.$('#subject').val(),
				Text: that.$('#textbody').val(),
				headers: {
				}
			}
		};

		// Validate sending
		Api.event({
			data: eventData,
			response: {
				"pkg.native.email" : function(response){
					// Handle response (see if validated to send)
					// clog('Response');
					// clog(response);
					// clog(response.body.code);

					// Update the view code
					if(response.body.code == 200){
						// Ok, validated sending this email

					} else {
						// Failed, had an error

						alert('Sorry, Invalid Email');

						that.enable_send_button();
						return false;
					}

					// Get rate-limit info
					tmp_rate_limit = response.body.data;

					// Over rate limit?
					if(tmp_rate_limit.current + 1 >= tmp_rate_limit.rate_limit){

						alert('Sorry, Over the Rate Limit (25 emails per 6 hours)');

						that.enable_send_button();
						return false;
						
					}

					// All good, SEND Email
					eventData.event = 'Email.send';

					// Log
					clog('sending composed Email');
					clog(eventData);

					Api.event({
						data: eventData,
						response: {
							"pkg.native.email" : function(response){
								
								// Update the view code
								if(response.body.code == 200){
									// Sent successfully

								} else {
									// Failed, had an error sending

									alert('Sorry, we might have failed sending this email');
									
									that.enable_send_button();
									return false;
								}


								// Sent successfully! 

								// Add to Email thread?
								// - no, wait for the Email to be received, and it was be updated

								that.after_sent();

							}
						}
					});



					// if validation ok, then continue to the next one
					// - resolve or call?

				}
			}
		});


		return false;

	},

	add_attachment: function(){

		// filepicker.getFile(function(FPFile){
		// 	clog(FPFile.url);
		// });
	

		// Pretend it is this file:
		// - https://www.filepicker.io/api/file/5qYoopVTsixCJJiqSWSE

		var file = {
			url: 'https://www.filepicker.io/api/file/5qYoopVTsixCJJiqSWSE',
			name: 'fry.png'
		};

		setTimeout(function(){
			// Pretend we just loaded the file through Filepicker (currently broken)

			// Add url and little "attachment" icon-file to Files fields

			var url = file.url;

			// Write template
			var template = App.Utils.template('t_common_file_attachment');

			// Append
			$('.file_attachments').append(
				template({
					url: file.url, 
					name: file.name
				})
			);

		},300);

		return false;

		filepicker.getFile("*/*", function(url, metadata){

			alert("You picked: "+url);
			window.console.log('picked');
			window.console.log(metadata);
			window.console.log(metadata.toString());
		});

		return false;
	},


	add_photo: function(ev){
		// Launch the photo taker
		// - uses either the camera, gallery, or the webcam
		var that = this;
		var elem = ev.currentTarget;

		if(useForge){
			forge.file.getImage({
				// params here
				width: 1000
			},function(file){
				// Success
				clog(file);
				clog(JSON.stringify(file));

				// Show a temporary image in the attachments thing
				forge.file.URL(file,function(url){
					// write template
					var template = App.Utils.template('t_common_photo_preview_image');

					// Append
					$('.compose_attachments').append(template({url: url}));

					clog(url);
					

				},function(content){

				});

			},function(content){
				// Error
				// - might have just canceling getting an image? 
				clog('Error');

			});
		}

		if(usePg){
			
			// Launch camera
			navigator.camera.getPicture(function(imageURI){

				// Todo: Save file to filepicker
				// - save it where? To dropbox? File upload API? 

				// Write template
				var template = App.Utils.template('t_common_photo_preview_image');

				// Append
				$('.compose_attachments').append(template({url: 'missing.png'}));

				// clog(imageURI);

			}, function(err){
				console.log('Error getting image');
				console.log(err);
			}, { 
				quality: 20, 
				destinationType: Camera.DestinationType.FILE_URI,
				correctOrientation: true,
				allowEdit: true, 
				encodingType: Camera.EncodingType.PNG,
				targetWidth: 1000,
				targetHeight: 1000
			}); 

			// This does not run until camera returns

		}

	},


	render_init: function(){

	},

	render: function() {
		var that = this;

		// Template
		var template = App.Utils.template('t_common_compose');

		// Write HTML
		this.$el.html(template());

		// Focus
		this.$('#subject').focus();

		return this;

	}

});



App.Views.ChooseContact = Backbone.View.extend({
	
	className: 'view_choose_contacts has-header',

	events: {
		'click .contact' : 'choose_email',
		'click .cancel' : 'cancel'
	},

	initialize: function(options) {
		var that = this;
		_.bindAll(this, 'render');
		_.bindAll(this, 'back');

		// this.el = this.options.el;

		// Get contacts
		// - display whether we are fetching contacts and updating them
		// - should be treated as a Collection of Contact Models

		if(usePg){
			var contactFields = ["id","displayName","name","emails","photos"];
			var contactFindOptions = {
				// filter: searchCritera,
				multiple: true
			};

			// Data already exists locally?
			// - go get new data

			navigator.contacts.find(contactFields, function(all_contacts){
				// Filter contacts who have no email address
				var contacts_with_email = [];
				$.each(all_contacts,function(i,contact){
					try {
						if(contact.emails.length > 0){
							contacts_with_email.push(contact);
						}
					} catch (err){

					}
				});

				// alert(contacts_with_email.length);

				// Parse and sort
				var contacts_parsed = that.parse_and_sort(contacts_with_email);

				// Re-render if empty
				if(!App.Data.Store.Contacts.length){
					// No data
					// Update local store
					App.Data.Store.Contacts = contacts_with_email;
					App.Data.Store.ContactsParsed = contacts_parsed;
					// Re-render
					alert('rerender');
					that.render();
				} else {
					// Update local store
					App.Data.Store.Contacts = contacts_with_email;
					App.Data.Store.ContactsParsed = contacts_parsed;
				}

				// Api.event({
				// 	data: {
				// 		event: 'Render.test3',
				// 		obj: contacts_with_email.splice(0,100)
				// 	}
				// });

			}, function(err){
				// Err with contacts
				alert('Error with contacts');
			}, contactFindOptions);

		} else if(useForge) {

		} else {
			// Browser

			App.Data.Store.Contacts = App.Data.tmp_contacts;
			var contacts_parsed = that.parse_and_sort(App.Data.Store.Contacts);
			App.Data.Store.ContactsParsed = contacts_parsed;

			// Re-render
			alert('rerender');
			that.render();

		}

	},

	cancel: function(ev){
		// Cancel and return
		var that = this,
			elem = ev.currentTarget;

		// Return
		this.back(null);

		return false;

	},

	choose_email: function(ev){
		// Chose one of the emails for the person
		var that = this,
			elem = ev.currentTarget;

		// Get email
		var email = $(elem).attr('data-email');

		// Return
		this.back(email);


		return false;

	},

	back: function(email){
		var that = this;

		// Add email to the parent page
		this.options.Parent.chose_email(email);

		// Show the parent
		// - should be using a window manager
		that.options.Parent.$el.removeClass('nodisplay');
		// $('body > .common_compose').removeClass('nodisplay');

		// Close this view
		this.close();

	},

	parse_and_sort: function(contacts){

		contacts = _.map(contacts,function(contact){
			var data = {
				name: contact.displayName,
				email: '',
				photo: ''
			};

			if(contact.emails.length < 1){
				return [];
			}

			var tmp_return = [];

			_.each(contact.emails,function(email, index){
				var tmp_data = _.clone(data);

				// Set display to email value, if displayName doesn't exist
				if(!contact.displayName){
					tmp_data.name = email.value;
				}

				// Set photo value
				try {
					if(contact.photos.length > 0){
						data.photo = contact.photos[0].value; // url to content://com...
						// alert(data.photo);
					}
				} catch(err){
					console.log('shoot');
				}

				// Set email value
				tmp_data.email = email.value;

				tmp_return.push(tmp_data);
			})

			return tmp_return;

		});
		contacts = _.reduce(contacts,function(contact,next){
			return contact.concat(next);
		});
		contacts = _.compact(contacts);
		contacts = _.uniq(contacts);

		// Sort
		contacts = App.Utils.sortBy({
			arr: contacts,
			path: 'email',
			direction: 'desc', // desc
			type: 'string'
		});

		return contacts;

	},

	render: function() {
		var that = this;
		// Data
		// var data = this.options.accounts.UserGmailAccounts;

		// Should start the updater for accounts
		// - have a separate view for Accounts?

		// console.log(JSON.stringify(this.options.contacts[0]));
		// Api.event({
		// 	data: {
		// 		event: 'Render.test',
		// 		obj: this.options.contacts.splice(0,10)
		// 	}
		// });

		// Sort/organize contacts

		// Get into list of contacts and emails
		// - displaying 1 contact and 1 email per line

		// Empty App.Data.Store.Contacts?
		// - never got them before
		if(App.Data.Store.ContactsParsed.length < 1){

			// Template
			var template = App.Utils.template('t_common_loading');

			// Write HTML
			this.$el.html(template());

			// Don't continue displaying
			return

		}

		// Template
		var template = App.Utils.template('t_choose_contacts');

		// Write HTML
		this.$el.html(template({
			contacts: App.Data.Store.ContactsParsed
		}));

		return this;
	}
});


App.Views.ThreadOptions = Backbone.View.extend({
	
	className: 'thread_preview_options_holder',

	events: {
		'click .done' : 'click_done',
		'click .delay' : 'click_delay',
		'click .reply' : 'click_reply',
		'click .note' : 'click_note'
	},

	initialize: function(options) {
		var that = this;
		_.bindAll(this, 'render');
		_.bindAll(this, 'mass_action');
		_.bindAll(this, 'after_delay_modal');

		// Expecting to be initiated with:
		/*
		{
			Parent: // App.Views.All
			ThreadElem: // .thread
			threadid:  // string
			type: ['delayed','undecided']
		}
		*/

		var allowed_types = ['delayed','undecided']; // "delayed" might be wrong!!!
		if(!this.options.type){
			alert('Expecting type in options');
		}


	},


	click_done: function(ev){
		// Mark older messages as done

		var that = this,
			elem = ev.currentTarget;

		// Get this message's id
		// - mark everything older than this email that matches the conditions presented earlier
		// - must already be in the undecided, etc.
		var thread_id = this.options.threadid;

		var conditions = {},
			time_sec = 0; // either last message datetime, or wait_until

		// Get everything "above" this (what you are looking at)
		// - no longer affects "invisible" elements

		// Get all elements above this one
		// - and including this one

		var incl_thread_ids = [];
		$('.thread[data-thread-type="'+ this.options.type +'"]').reverse().each(function(i, threadElem){
			// Wait for this element to get triggered
			if(incl_thread_ids.length > 0){
				// Already found this element
				incl_thread_ids.push($(threadElem).attr('data-id'));
			} else if($(threadElem).attr('data-id') == that.options.threadid){
				incl_thread_ids.push($(threadElem).attr('data-id'));
			}
		});

		// Do something to each
		// $.each(incl_thread_ids,function(i, v){
		// 	console.log(v);
		// });

		
		// Run update command
		Api.update({
			data: {
				model: 'Thread',
				conditions: {
					'_id' : {
						'$in' : incl_thread_ids
					}
				},
				multi: true, // edit more than 1? (yes)
				paths: {
					"$set" : {
						"app.AppPkgDevMinimail.done" : 1
					}
				}
			},
			success: function(response){
				// Successfully updated
				response = JSON.parse(response);
				if(response.code != 200){
					// Updating failed somehow
					// - this is bad, it means the action we thought we took, we didn't take
					alert('Update may have failed');
				}
			}
		});

		
		// Fire event to modify move Email/Thread to Archive (it will be brought back later when wait_until is fired)
		_.each(incl_thread_ids, function(tmp_thread_id){
			
			Api.event({
				data: {
					event: 'Thread.action',
					obj: {
						'_id' : tmp_thread_id, // allowed to pass a thread_id here
						'action' : 'archive'
					}
				},
				success: function(response){
					response = JSON.parse(response);

					if(response.code != 200){
						// Failed launching event
						alert('Failed launching Thread.action2');
						dfd.reject(false);
						return;
					}

				}
			});

		});


		// Instead, emit an event that is handled by the server for 
		// - 

			
		that.mass_action('done', this.options.type, incl_thread_ids);

		return;


		// if(this.options.type == 'undecided'){
		// 	// Undecided

		// 	// Build the conditions for the update
		// 	// - same conditions as on App.Collections.UndecidedThreads.undecided_conditions
		// 	conditions = {
		// 		'$or' : [
		// 			{
		// 				'$and' : [
		// 					{
		// 						// doesn't exist for us, and is unread
		// 						'app.AppPkgDevMinimail' : {'$exists' : false},
		// 						'attributes.read.status' : 0
		// 					}
		// 				]
		// 			},{
		// 				'$and' : [
		// 					{
		// 						// exists as acted upon, and is marked as "undecided" still
		// 						'app.AppPkgDevMinimail' : {'$exists' : true},
		// 						'app.AppPkgDevMinimail.wait_until' : {"$exists" : false},
		// 						'app.AppPkgDevMinimail.done' : 0
		// 					}
		// 				]
		// 			}
		// 		]
		// 	};

		// 	// Get time of thread (affecting older threads only)
		// 	time_sec = App.Data.Store.Thread[this.options.threadid].attributes.last_message_datetime_sec;

		// 	// Add the condition that it must be older
		// 	conditions['attributes.last_message_datetime_sec'] = {
		// 		"$lte" :  time_sec // older = less-than-or-equal-to
		// 	};

		// } else if(this.options.type == 'delayed'){

		// 	// Get time of thread (affecting older threads only)
		// 	time_sec = App.Data.Store.Thread[this.options.threadid].app.AppPkgDevMinimail.wait_until;

		// 	// Delayed
		// 	conditions = {
		// 		'$and' : [
		// 			{
		// 				'app.AppPkgDevMinimail.wait_until' : {
		// 					'$lte' : time_sec
		// 				}
		// 			},
		// 			{
		// 				'app.AppPkgDevMinimail.done' : {
		// 					"$ne" : 1
		// 				}
		// 			}
		// 		]
		// 	};
		// } else {
		// 	// Failed finding the correct type
		// 	alert('Failed finding type');
		// 	return false;
		// }

		// // Run update command
		// Api.update({
		// 	data: {
		// 		model: 'Thread',
		// 		conditions: conditions,
		// 		multi: true, // edit more than 1? (yes)
		// 		paths: {
		// 			"$set" : {
		// 				"app.AppPkgDevMinimail.done" : 1
		// 			}
		// 		}
		// 	},
		// 	success: function(response){
		// 		// Successfully updated
		// 		response = JSON.parse(response);
		// 		if(response.code != 200){
		// 			// Updating failed somehow
		// 			// - this is bad, it means the action we thought we took, we didn't take
		// 			alert('Update may have failed');
		// 		}
		// 	}
		// });

		// // Assume update succeeded

		// // Mark all the visible ones
		// // - easy to see all the ones above (that haven't already had an action taken on them)
		// that.mass_action('done', this.options.type, time_sec);

		// return false;
	},

	click_delay: function(ev){
		// Delay older messages
		// - displayes DelayModal

		var that = this,
			elem = ev.currentTarget;

		// Display delay_modal Subview
		var subView = new App.Views.DelayModal({
			context: that,
			threadid: that.threadid,
			onComplete: that.after_delay_modal
		});
		$('body').append(subView.$el);
		subView.render();

		return false;

	},

	after_delay_modal: function(wait, save_text){

		var that = this;

		// Get this message's id
		// - mark everything older than this email that matches the conditions presented earlier
		// - must already be in the undecided, etc.
		var thread_id = this.options.threadid;

		// Return if a null value was sent through by DelayModal
		if(!wait){
			return false;
		}


		var incl_thread_ids = [];
		$('.thread[data-thread-type="'+ this.options.type +'"]').reverse().each(function(i, threadElem){
			// Wait for this element to get triggered
			if(incl_thread_ids.length > 0){
				// Already found this element
				incl_thread_ids.push($(threadElem).attr('data-id'));
			} else if($(threadElem).attr('data-id') == that.options.threadid){
				incl_thread_ids.push($(threadElem).attr('data-id'));
			}
		});


		// Figure out delay in seconds
		var now_sec = parseInt(new Date().getTime() / 1000);
		var delay_time = wait.getTime() / 1000;
		var delay_seconds = parseInt(delay_time - now_sec);
		var in_seconds = now_sec + delay_seconds;

		// App.Plugins.Minimail.saveNewDelay(this.threadid,in_seconds,delay_seconds);

		// Fire event to be run in the future
		Api.event({
			data: {
				event: 'Minimail.wait_until_fired',
				delay: delay_seconds,
				obj: {
					text: "Emails are due"
				}
			},
			success: function(response){
				response = JSON.parse(response);

				if(response.code != 200){
					// Failed launching event
					alert('Failed launching event');
					dfd.reject(false);
					return;
				}

				// Save new delay also
				Api.update({
					data: {
						model: 'Thread',
						conditions: {
							'_id' : {
								'$in' : incl_thread_ids
							}
						},
						paths: {
							"$set" : {
								"app.AppPkgDevMinimail.wait_until" : in_seconds,
								"app.AppPkgDevMinimail.wait_until_event_id" : response.data.event_id,
								"app.AppPkgDevMinimail.done" : 0
							}
						}
					},
					success: function(response){
						response = JSON.parse(response);
						if(response.code != 200){
							// Shoot
							alert('Failed updating threads!');
						}
					}
				});

			}
		});


		// Fire event to modify move Email/Thread to Archive (it will be brought back later when wait_until is fired)
		_.each(incl_thread_ids, function(tmp_thread_id){

			Api.event({
				data: {
					event: 'Thread.action',
					obj: {
						'_id' : tmp_thread_id, // allowed to pass a thread_id here
						'action' : 'archive'
					}
				},
				success: function(response){
					response = JSON.parse(response);

					if(response.code != 200){
						// Failed launching event
						alert('Failed launching Thread.action2');
						dfd.reject(false);
						return;
					}

				}
			});

		});


		that.mass_action('delay', this.options.type, incl_thread_ids, wait, save_text);
		return;

		// if(this.options.type == 'undecided'){

		// 	// Build the conditions for the update
		// 	// - same conditions as on App.Collections.UndecidedThreads.undecided_conditions
		// 	var conditions = {
		// 		'$or' : [
		// 			{
		// 				'$and' : [
		// 					{
		// 						// doesn't exist for us, and is unread
		// 						'app.AppPkgDevMinimail' : {'$exists' : false},
		// 						'attributes.read.status' : 0
		// 					}
		// 				]
		// 			},{
		// 				'$and' : [
		// 					{
		// 						// exists as acted upon, and is marked as "undecided" still
		// 						'app.AppPkgDevMinimail' : {'$exists' : true},
		// 						'app.AppPkgDevMinimail.wait_until' : {"$exists" : false},
		// 						'app.AppPkgDevMinimail.done' : 0
		// 					}
		// 				]
		// 			}
		// 		]
		// 	}
			
		// 	var time_sec = App.Data.Store.Thread[this.options.threadid].attributes.last_message_datetime_sec;

		// 	// Add the condition that it must be older
		// 	conditions['attributes.last_message_datetime_sec'] = {
		// 		"$lte" :  time_sec // older = less-than-or-equal-to
		// 	};

		// 	// Run update command
		// 	Api.update({
		// 		data: {
		// 			model: 'Thread',
		// 			conditions: conditions,
		// 			paths: {
		// 				"$set" : {
		// 					"app.AppPkgDevMinimail.wait_until" : delay_datetime_in_seconds,
		// 					"app.AppPkgDevMinimail.wait_until_event_id" : response.data.event_id,
		// 					"app.AppPkgDevMinimail.done" : 0
		// 				}
		// 			}
		// 		},
		// 		success: function(response){
		// 			// Successfully updated
		// 			response = JSON.parse(response);
		// 			if(response.code != 200){
		// 				// Updating failed somehow
		// 				// - this is bad, it means the action we thought we took, we didn't take
		// 				alert('Update may have failed');
		// 			}
		// 		}
		// 	});

		// 	// Assume update succeeded

		// 	// Mark all the visible ones
		// 	// - easy to see all the ones above (that haven't already had an action taken on them)
		// 	that.mass_action('delay', this.options.type, time_sec, wait, save_text);

		// }

		return false;

	},

	mass_action: function(action, type, incl_thread_ids, wait, wait_save_text){
		// Mass animation on previous items
		// - action: done, delay (with additional info about delay datetime)
		// - type: undecided or delayed
		// - seconds: time in seconds to mark against older

		var that = this;

		// seconds = parseInt(seconds);
		// if(!seconds){
		// 	// Shoot
		// 	alert('bad seconds in mass_action');
		// 	return false;
		// }

		var waitTime = 0;
		$('.thread[data-thread-type="'+type+'"]').reverse().each(function(i, threadElem){

			// Choosing either last_message_datetime_sec or wait_until
			// - depends on undecided or delayed
			
			if(_.contains(incl_thread_ids, $(threadElem).attr('data-id'))){
				// Affected this one!

				// Slide the .thread-preview and show the Thread
				// - sliding based on type (delayed, undecided)
				var previewElem = $(threadElem).find('.thread-preview');

				// Slide depending on undecided/done
				if(action == 'done'){
					// Slide RIGHT for "done"

					$(previewElem).delay(waitTime).animate({
						left: $(threadElem).width(),
						opacity: 0
					},{
						duration: 500,
						complete: function(){
							// $(this).parents('.thread').slideUp();
							$(previewElem).removeClass('touch_start');
						}
					});

					// Add classes for done
					$(threadElem).addClass('tripped dragright');

				} else if(action == 'delay') {
					// Slide LEFT for delay

					$(previewElem).delay(waitTime).animate({
						right: $(threadElem).width(),
						opacity: 0
					},{
						duration: 500,
						complete: function(){
							// $(this).parents('.thread').slideUp();
							$(previewElem).removeClass('touch_start');
						}
					});

					// Add classes for delay
					$(threadElem).addClass('tripped dragleft');

					// Add text
					$(threadElem).find('.thread-bg-time p').html(wait_save_text);

				}

				waitTime += 100;

			}

		});

		that.close();

		return;
	},

	click_reply: function(ev){
		// Load the Reply route
		var that = this,
			elem = ev.currentTarget;

		// Set scroll position on parent before going to reply view
		that.options.Parent.set_scroll_position();

		// Launch router w/ thread_id
		// Backbone.history.loadUrl('reply/' + this.options.threadid);

		// Hide myself
		that.options.Parent.$el.addClass('nodisplay');

		// Build the subview
		that.subViewReply = new App.Views.CommonReply({
			threadid: this.options.threadid
		});
		// Add to window and render
		$('body').append(that.subViewReply.$el);
		that.subViewReply.render();

		// Listen for events

		// Canceled sending a reply
		that.subViewReply.ev.on('cancel',function(){

			// Close subview
			that.subViewReply.close();

			// Display Parent
			that.options.Parent.$el.removeClass('nodisplay');

			// Scroll to correct position
			that.options.Parent.$('.data-lsp').scrollTop(that.options.Parent.last_scroll_position);
			// console.log(that.options.Parent.last_scroll_position);
			// $('.all_threads').scrollTop(that.options.Parent.last_scroll_position);

		});

		return false;
	},

	click_note: function(ev){
		// Editing/writing the Note for the Thread
		var that = this,
			elem = ev.currentTarget;

		// Display a new subview with the note dialog box?
		// - want to keep Notes kinda short, right? 
		// - notes on the computer would
		// - want to prevent Notes from getting deleted accidentally (they probably contain only important information)
		// - treat notes as Todo objects? add/remove/edit individual notes? Each line is a different Note? 
		// - lots of improvements possible, keep it simple for now

		var pre_text = '';
		try {
			if(App.Data.Store.Thread[that.options.threadid].app.AppPkgDevMinimail.note){
				pre_text = App.Data.Store.Thread[that.options.threadid].app.AppPkgDevMinimail.note.toString();
			}
		} catch(err){
			// pass
		}

		// Prompt box for note
		var note_text = prompt('Thread Note',pre_text);

		// Update the note
		if(!note_text){
			// canceled, not updating
			return;
		}

		// Make API call to update
		Api.update({
			data: {
				model: 'Thread',
				id: that.options.threadid,
				paths: {
					"$set" : {
						"app.AppPkgDevMinimail.note" : note_text
					}
				}
			},
			success: function(){

			}
		});

		// Save locally (wrong way to do this, should happen via model/collection)
		App.Data.Store.Thread[that.options.threadid].app.AppPkgDevMinimail.note = note_text;

		// Update the view
		// - todo...
		App.Utils.Notification.toast('Updated Note');

		return false;

	},

	render: function() {
		var that = this;

		// Template
		var template = App.Utils.template('t_all_thread_options');

		// Write HTML
		this.$el.html(template());

		return this;
	}
});


App.Views.SelectEmailList = Backbone.View.extend({
	
	className: 'select_email_list',

	events: {
		'click .option' : 'choose_email'
	},

	initialize: function(options) {
		_.bindAll(this, 'render');

		// this.el = this.options.el;

	},

	choose_email: function(ev){
		// Chose one of the emails for the person

		var elem = ev.currentTarget;

		// Get email
		var email = $(elem).attr('data-email');

		// Add email to the parent page
		this.options.chose_email(email);

		// Show the parent
		$('body > .common_compose').removeClass('nodisplay');

		// Close this view
		this.close();

		return false;

	},

	render: function() {
		var that = this;
		// Data
		// var data = this.options.accounts.UserGmailAccounts;

		// Should start the updater for accounts
		// - have a separate view for Accounts?

		// Template
		var template = App.Utils.template('t_select_email_list');

		// Write HTML
		this.$el.html(template(this.options.emails));

		return this;
	}
});





App.Views.All = Backbone.View.extend({
	
	className: 'all_thread_inside_view reverse_vertical',

	last_scroll_position: 0,

	events: {
		// 'click .save' : 'save',
		// 'click .preview' : 'preview'
		// 'click #back' : 'go_back',
		// 'click .sender' : 'approve',
		// 'click .sender_status a' : 'status_change'

		// 'click .thread-preview' : 'view_email'
		'shorttap .thread-preview' : 'view_email',
		'longtap .thread-preview' : 'preview_thread',

		'click .thread-preview' : 'click_view_email'

	},

	initialize: function(options) {
		var that = this;
		_.bindAll(this, 'render');
		_.bindAll(this, 'beforeClose');
		_.bindAll(this, 'refresh_and_render_threads');
		
		App.Events.bind('new_email',this.refresh_and_render_threads);

	},

	beforeClose: function(){
		// unbind
		App.Events.off('new_email',this.refresh_and_render_threads);
	},

	set_scroll_position: function(){
		var that = this;
		
		// Set last scroll position
		this.last_scroll_position = this.$('.data-lsp').scrollTop();
		this.$el.attr('last-scroll-position',this.last_scroll_position);

	},

	refresh_data: function(){
		// Refresh the data for the view

	},

	// longtap: function(ev){
	// 	var that = this,
	// 		elem = ev.currentTarget;

	// 	alert('longtap');
	// 	return false;
	// },

	subViewThreadOptions: {},
	preview_thread: function(ev){
		// Preview a thread
		var that = this,
			elem = ev.currentTarget;

		var threadElem = $(elem).parents('.thread');
		
		// In multi-select mode?
		if(this.$('.all_threads').hasClass('multi-select-mode')){
			
			// Already selected?
			// alert($(elem).attr('class'));
			if($(elem).hasClass('multi-selected')){
				
				// un-selected
				$(elem).removeClass('multi-selected');

				// Anybody else selected?
				if($('.multi-selected').length < 1){
					// turn of multi-select mode
					$(elem).parents('.all_threads').removeClass('multi-select-mode');
				}

			} else {
				// select row
				$(elem).addClass('multi-selected');
			}

			return false;
		}

		// Expand/shrink
		if($(elem).hasClass('removed_ellipsis')){
			// Shrinking

			// Add ellipses back
			$(elem).removeClass('removed_ellipsis previewing');
			$(elem).find('.ellipsis_removed').addClass('ellipsis').removeClass('ellipsis_removed');

			// Close subViews
			_.each(that.subViewThreadOptions,function(subView){
				subView.close();
			});

		} else {
			// Expanding

			// Re-add other ellipses
			$('.thread-preview').removeClass('removed_ellipsis previewing');
			$('.thread-preview').find('.ellipsis_removed').addClass('ellipsis').removeClass('ellipsis_removed');

			// Close other subViews
			_.each(that.subViewThreadOptions,function(subView){
				subView.close();
			});

			// Remove ellipsis
			$(elem).addClass('removed_ellipsis previewing');
			$(elem).find('.ellipsis').addClass('ellipsis_removed').removeClass('ellipsis');

			// Create sub view with options
			var subViewKey = $(elem).attr('data-thread-id');
			that.subViewThreadOptions[subViewKey] = new App.Views.ThreadOptions({
				Parent: that,
				ThreadElem: threadElem,
				threadid: subViewKey,
				type: $(threadElem).attr('data-thread-type')
			});
			// App.router.showView('subthreadoptions',that.subViewThreadOptions[subViewKey]);//.render();
			that.subViewThreadOptions[subViewKey].render();

			// Write HTML before element
			// - inserts a holder that handles positioning
			$(elem).parent().before(that.subViewThreadOptions[subViewKey].$el);

			// re-scroll to account for display
			// alert(that.subViewThreadOptions[subViewKey].$el.height());
			var heightObj = that.subViewThreadOptions[subViewKey].$el.outerHeight() + 10;
			$('.all_threads').scrollTop( $('.all_threads').scrollTop() + heightObj );
			// $('.all_threads').scrollTop($(document).height() + App.Data.xy.win_height);
			// that.$el.scrollTop(that.$el.scrollTop() + 20);
			
		}


		return false;

	},

	click_view_email: function (ev){
		// Clicked
		// - only used by testing browser
		if(usePg){
			return false;
		}

		// alert('must be web');
		// this.preview_thread(ev);
		this.view_email(ev);

		// var elem = ev.currentTarget,
		// 	threadElem = $(elem).parents('.thread');

		// var thread_id = $(threadElem).attr('data-id');

		// // Hide thread preview
		// // $(this).parents('.thread').slideUp('slow');
		// $(elem).animate({
		// 	left: -1 * $(elem).parents('.thread').width()
		// },{
		// 	complete: function(){
		// 		// $(this).parents('.thread').slideUp();
		// 		$(elem).removeClass('touch_start');
		// 	}
		// });

		// // Display delay_modal Subview
		// var subView = new App.Views.DelayModal({
		// 	context: this,
		// 	threadid: thread_id
		// });
		// $('body').append(subView.$el);
		// subView.render();

	},

	view_email: function(ev){
		// View an individual email thread
		var that = this,
			elem = ev.currentTarget,
			threadElem = $(elem).parents('.thread');

		// In multi-select mode?
		if(this.$('.all_threads').hasClass('multi-select-mode')){
			
			// Already selected?
			// alert($(elem).attr('class'));
			if($(elem).hasClass('multi-selected')){
				
				// un-selected
				$(elem).removeClass('multi-selected');

				// Anybody else selected?
				if($('.multi-selected').length < 1){
					// turn of multi-select mode
					$(elem).parents('.all_threads').removeClass('multi-select-mode');
				}

			} else {
				// select row
				$(elem).addClass('multi-selected');
			}

			return false;
		}

		// In Preview mode?
		if($(elem).hasClass('previewing')){
			// Call as if longtap were pressed again
			// alert('is previewing');
			that.preview_thread(ev);
			return false;
		}

		// - probably have some of the info cached already (all relevant headers)

		// Get Thread id
		var id = $(threadElem).attr('data-id');

		// Set last scroll position
		this.last_scroll_position = $('.threads_holder').scrollTop();
		this.$el.parents('.main_body').attr('last-scroll-position',this.last_scroll_position);

		// Launch view for that Thread
		Backbone.history.loadUrl('view_thread/' + id + '/undecided');

		return false;

	},


	render_init: function(){
		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_all_init');

		// Write HTML
		this.$el.html(template());

		return this;

	},

	recombine_threads: function(){
		// Recombine the two and display them
		var that = this;

		var dfd = $.Deferred();

		$.when(
			App.Utils.Storage.get('undecided_threads_and_emails'),
			App.Utils.Storage.get('delayed_threads_and_emails')
		)
		.then(function(undecided_threads, delayed_threads){
			// Merge the two together
			// Sort them as expected
			// - prevent any duplicate Threads (show the Delayed version only)
			
			if(undecided_threads == undefined || undecided_threads.length < 1){
				undecided_threads = [];
			}
			if(delayed_threads == undefined || delayed_threads.length < 1){
				delayed_threads = [];
			}

			// var threads = undecided_threads.concat(delayed_threads);

			dfd.resolve({
				undecided: undecided_threads,
				delayed: delayed_threads
			});

		});

		return dfd.promise();


	},

	render_threads: function(threads){
		
		clog('threads');
		clog(threads);

		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_all');

		// Write HTML
		this.$el.html(template(threads));

		// Change size of window based on display size
		// $('.all_thread_inside_view').css({
		// 	height: App.Data.xy.win_height - 60,
		// 	width: App.Data.xy.win_width
		// });
		// $('.all_threads').css({
		// 	"max-height": App.Data.xy.win_height - 60,
		// 	width: App.Data.xy.win_width
		// });
		// $('.all_threads .thread:first-child').css({
		// 	"margin-top" : App.Data.xy.win_height - (60+75)
		// });
		
		// Resize the scrollable part (.all_threads)
		this.resize_fluid_page_elements();
		this.resize_scroller();

		// Scroll to bottom
		this.$('.scroller').scrollTop(10000);

		// Draggable
		$(".thread-preview").on('touchstart',App.Plugins.Minimail.thread_main.start);
		// $(".thread-preview").on('mousedown',App.Plugins.Minimail.thread_main.start);
		$(".thread-preview").on('touchmove',App.Plugins.Minimail.thread_main.move);
		// $(".thread-preview").on('mousemove',App.Plugins.Minimail.thread_main.move);
		$(".thread-preview").on('touchend',App.Plugins.Minimail.thread_main.end);
		// $(".thread-preview").on('mouseup',App.Plugins.Minimail.thread_main.end);

		return this;
		
	},

	render_zero: function(){

		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_all_inboxzero');

		// Write HTML
		this.$el.html(template());

		return this;
		
	},


	refresh_and_render_threads: function(){
		// Refresh the Thread list from the server
		// - re-render the Threads (this.render_threads)

		var that =  this;

		// Start the refresher for each
		// After each has finished refreshing, it should tell the list to be recompiled

		// Wait for both to finish, then recombine threads

		var dfdUndecided = $.Deferred(),
			dfdDelayed = $.Deferred();

		that.undecidedThreadsCollection = new App.Collections.UndecidedThreads();
		that.undecidedThreadsCollection.fetchUndecided({
			success: function(threads) {
				// Does not return models, just JSON data objects
					
				// Store locally
				App.Utils.Storage.set('undecided_threads_and_emails',threads);

				// Resolve
				dfdUndecided.resolve();

			}
		});


		that.delayedThreadsCollection = new App.Collections.DelayedThreads();
		that.delayedThreadsCollection.fetchDelayed({
			success: function(threads) {
				// Does not return models, just JSON data objects
					
				// Store locally
				App.Utils.Storage.set('delayed_threads_and_emails',threads);

				// Resolve
				dfdDelayed.resolve();

				// // Recombine threads
				// that.recombine_threads()
				// 	.then(function(threads){

				// 		// No threads?
				// 		if(threads.undecided.length < 1 && threads.delayed.length < 1){
				// 			// Render Inbox Zero view
				// 			that.render_zero();
				// 			return;
				// 		}

				// 		// Render new Thread list
				// 		that.render_threads(threads);
				// 	});


			}
		});

		$.when(dfdUndecided.promise(), dfdDelayed.promise())
			.then(function(){

				// Recombine threads
				that.recombine_threads()
					.then(function(threads){

						// No threads?
						if(threads.undecided.length < 1 && threads.delayed.length < 1){
							// Render Inbox Zero view
							that.render_zero();
							return;
						}

						// Render new Thread list
						that.render_threads(threads);
					});
			});


	},

	render: function() {
		var that = this;

		// Render initial body
		this.render_init();

		// Refresh and render
		this.refresh_and_render_threads();

		App.Utils.Storage.get('delayed_threads_and_emails')
			.then(function(val){
				if(val){
					// value exists, render
					// Recombine threads
					that.recombine_threads()
						.then(function(threads){

							// Render new Thread list
							that.render_threads(threads);
						});
				} else {
					// doesn't exist
					// - already refreshing
				}
			});


		// How old is it?
		// Do we need to do a refresh?

		// View is based on what data we do have, and a view makes sure the new data is being found? 

		return this;
	}
});


App.Views.LeisureList = Backbone.View.extend({
	
	className: 'leisure_list_inside_view reverse_vertical',

	last_scroll_position: 0,

	events: {
		// 'click .save' : 'save',
		// 'click .preview' : 'preview'
		// 'click #back' : 'go_back',
		// 'click .sender' : 'approve',
		// 'click .sender_status a' : 'status_change'

		'click .leisure_item .filter_name' : 'open_leisure_preview',
		'click .leisure_item .item_threads' : 'view_leisure_category'

	},

	initialize: function(options) {
		var that = this;
		_.bindAll(this, 'render');
		_.bindAll(this, 'refresh_and_render_list');

		// App.Events.bind('new_email',this.refresh_and_render_threads);

	},


	refresh_data: function(){
		// Refresh the data for the view

	},

	open_leisure_preview: function(ev){
		// Show/hide threads for this filter

		var that = this;
		var elem = ev.currentTarget;
		var threadElem = $(elem).parents('.leisure_item');

		if($(threadElem).find('.item_threads').hasClass('nodisplay')){
			// Show threads
			$(threadElem).find('.item_threads').removeClass('nodisplay')
		} else {
			// Hide threads
			$(threadElem).find('.item_threads').addClass('nodisplay')
		}

		return false;

	},


	view_leisure_category: function(ev){
		// View an individual email
		var elem = ev.currentTarget;
		var threadElem = $(elem).parents('.leisure_item');
		
		// - probably have some of the info cached already (all relevant headers)

		// Get Thread id
		var id = $(threadElem).attr('data-id');

		// Set last scroll position
		this.last_scroll_position = $('.all_threads').scrollTop();
		this.$el.parents('.main_body').attr('last-scroll-position',this.last_scroll_position);

		// Launch view for that Thread
		Backbone.history.loadUrl('view_leisure_thread/' + id);

		return false;

	},


	render_init: function(){
		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_leisure_init');

		// Write HTML
		this.$el.html(template());

		return this;

	},

	render_list: function(lfilters){

		// Only show 5 per Filter
		$.each(lfilters,function(i,v){
			lfilters[i].ThreadUnreadCount = 0;

			// Get unread count
			
			$.each(v.Thread,function(k,Thread){
				try {
					if(Thread.attributes.read.status != 1){
						lfilters[i].ThreadUnreadCount += 1;
					}
				} catch(err){
					lfilters[i].ThreadUnreadCount += 1;
				}
			});

			// Only include 5 in the showing (will show 5+)
			if(v.Thread.length > 5){
				v.Thread = v.Thread.splice(0,5);
			}
			lfilters[i] = v;
		});

		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_leisure');

		// Write HTML
		this.$el.html(template(lfilters));

		// // Change size of window based on display size
		// $('.leisure_list_inside_view').css({
		// 	height: App.Data.xy.win_height - 60 // 120 w/ footer
		// 	// width: App.Data.xy.win_width
		// });

		// $('.all_threads').css({
		// 	"max-height": App.Data.xy.win_height - 60,
		// 	width: App.Data.xy.win_width
		// });

		// Resize the scrollable part (.all_threads)
		this.resize_fluid_page_elements();
		this.resize_scroller();

		// $('.leisure_list').css({
		// 	"max-height": $(window).height() - 60,
		// 	width: App.Data.xy.win_width
		// });

		// // Scroll to bottom
		// $('.all_threads').scrollTop($(document).height() + 1000); // very bottom
		this.$('.scroller').scrollTop(10000);

		// // Draggable
		// $(".thread-preview").on('touchstart',App.Plugins.Minimail.thread_main.start);
		// // $(".thread-preview").on('mousedown',App.Plugins.Minimail.thread_main.start);
		// $(".thread-preview").on('touchmove',App.Plugins.Minimail.thread_main.move);
		// // $(".thread-preview").on('mousemove',App.Plugins.Minimail.thread_main.move);
		// $(".thread-preview").on('touchend',App.Plugins.Minimail.thread_main.end);
		// // $(".thread-preview").on('mouseup',App.Plugins.Minimail.thread_main.end);

		return this;
		
	},


	refresh_and_render_list: function(){
		// Refresh the Thread list from the server
		// - re-render the Threads (this.render_threads)

		var that =  this;

		that.LeisureFilterCollection = new App.Collections.AppMinimailLeisureFilter();
		that.LeisureFilterCollection.fetchAll({
			success: function(leisure_list) {
				// Does not return models, just JSON data objects
				clog('back with result');
				
				// Store locally
				App.Utils.Storage.set('leisure_list_top',leisure_list);

				// Render new Thread list
				that.render_list(leisure_list);
			}
		});


	},

	render: function() {
		var that = this;

		// Render initial body
		this.render_init();

		// Refresh and render
		// this.refresh_and_render_threads();

		// Get stored leisure_list
		App.Utils.Storage.get('leisure_list_top')
			.then(function(threads){

				if(threads != null){
					// Have some local data
					// Trigger a refresh of the data
					// - when the data is refreshed, the view gets refreshed as well
					
					that.render_list(threads);

				}

				that.refresh_and_render_list();

			});

		// How old is it?
		// Do we need to do a refresh?

		// View is based on what data we do have, and a view makes sure the new data is being found? 

		return this;
	}
});

App.Views.LeisureItem = Backbone.View.extend({
	
	className: 'leisure_item_view',

	events: {
		'click .btn[data-action="back"]' : 'go_back'

		// 'click .btn[data-action="delay"]' : 'click_delay',
		// 'click .btn[data-action="done"]' : 'click_done',
		// 'click .btn[data-action="pin"]' : 'click_pin',

		// 'click .reply' : 'reply',
		// 'click .forward' : 'forward',

		// 'click .email_holder .email_body .ParsedDataShowAll span.expander' : 'email_folding',
		// 'click .email_holder .email_body .ParsedDataShowAll span.edit' : 'edit_email'
	},

	initialize: function(options) {
		_.bindAll(this, 'render');
		// _.bindAll(this, 'email_sent');
		// _.bindAll(this, 'refresh_and_render_thread');
		var that = this;
		// this.el = this.options.el;

		// Get any local information we have
		// After getting local info, and if we have enough, show the thing
		// Get remote info, merge with Local when it arrives

		// Render the information we have on this Thread
		this.leisureid = this.options.leisureid

		// Event bindings
		// - also bound at the top of initialize
		// App.Events.bind('email_sent',this.email_sent);
		// App.Events.bind('thread_updated',this.refresh_and_render_thread);




		// Get the data that we do have for the thing
		// - re-render after we get the whole thing! 
		// App.Utils.Storage.

		// Get the data difference from what we have
		// - diff and patch
		// - already know the fields we would have requested (that doesn't change at all?)


		// // Render the base view
		// var thread_cached = false;
		// if(thread_cached){
		// 	// Thread is in memory
		// 	// - display base view including Thread
		// 	// - todo...
		// } else {
		// 	// No Thread in memory

		// 	// Display base outline
		// 	// Fetch Thread and Emails for thread

		// 	App.Plugins.Minimail.getThreadAndEmails(this.options.threadid)
		// 		.then(function(returnThread){
		// 			that.render_content(returnThread);
		// 		})
		// 		.fail(function(err){
		// 			clog('Failed getThreadAndEmails');
		// 			clog(err);
		// 		});


		// }

	},

	set_scroll_position: function(){
		var that = this;

		// Set last scroll position
		this.last_scroll_position = this.$el.scrollTop();
		this.$el.attr('last-scroll-position',this.last_scroll_position);

		clog('.' + this.className);
		clog(this.last_scroll_position);

	},

	go_back: function(ev){
		// Going back to mailbox
		// - highlight the correct row we were on? (v2)

		// Is there some way of referencing the Backbone view instead of using jquery? 

		// Re-show .main_body
		$('.main_body').removeClass('nodisplay');

		// Scroll to correct position
		var scrollTo = 0;
		if($('.main_body').attr('last-scroll-position')){
			scrollTo = $('.main_body').attr('last-scroll-position');
		}
		$('.all_threads').scrollTop(scrollTo);

		// Close myself
		this.close();

		return false;
	},


	render_loading: function(){
		// Should show a loading screen

	},

	render_filter: function(){
		
		clog('rendering Filter');

		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_leisure_item_view');

		// Get the Threads and Emails

		// build the data
		var data = {
			AppMinimailLeisureFilter: App.Data.Store.AppMinimailLeisureFilter[that.leisureid],
			// Thread: App.Data.Store.Thread[this.threadid],
			Threads: _.filter( App.Data.Store.Thread,function(thread){
					var found = false;
					try {
						$.each(thread.app.AppPkgDevMinimail.leisure_filters,function(i,v){
							if(v._id == that.leisureid){
								found = true;
							}
						});
					} catch(err){
						found = false;
					}
					if(found) return true;
				})
		};

		// Get Emails for Threads
		var thread_ids = [];
		data.Threads = _.map(data.Threads,function(thread){

			var thread_id = thread._id;
			thread_ids.push(thread._id);

			return {
				Thread: thread,
				Email: _.filter( App.Data.Store.Email,function(email){
						if(email.attributes.thread_id == thread_id) return true;
					})
			};
		});

		// Sort by recent Thread
		// - expecting singles anyways
		data.Threads = App.Utils.sortBy({
			arr: data.Threads,
			path: '[0].attributes.last_message_datetime',
			direction: 'asc',
			type: 'date'
		});

		// Mark Threads as Read
		clog('updating Threads');
		Api.update({
			data: {
				model: 'Thread',
				conditions: {
					'_id' : {
						"$in" : thread_ids
					}
				},
				paths: {
					"$set" : {
						'attributes.read.status' : 1
					}
				},
				limit: data.Threads.length
			},
			success: function(){
				// Yay updated
				// - should also update the local version first?
			}
		});

		clog(2);
		clog(data);

		// Write HTML
		this.$el.html(template(data));

		// Resize the scrollable part (.all_threads)
		this.resize_fluid_page_elements();
		this.resize_scroller();

		return this;
		
	},

	refresh_and_render_filter: function(){
		// Make sure we have all the up-to-date data for this LeisureFilter
		var that = this;

		// Shouldn't be creating a new Collection each time...
		// - whole Model/Collection/View sync and relationships concept is borked in my head anyways


		var tmp_threads = new App.Collections.Threads();
		tmp_threads.fetch_for_leisure({
			leisure_id: that.leisureid,
			success: function(thread_models_collection){
				// Anything different from the existing look?
				// - update the View with new data
				
				var thread_models = thread_models_collection.toJSON();

				// Get thread ids
				var thread_ids = _.map(thread_models,function(thread_model){
					return thread_model._id;
				});

				// Get Emails for each of the threads
				var tmp_emails = new App.Collections.Emails();

				tmp_emails.fetch_by_id_full({
					ids: thread_ids,
					success: function(emails){
						// Anything different from the existing look?
						// - update the View with new data
						
						clog('re-rendering Filter');
						that.render_filter();

					}
				});

			}
		});


	},

	render: function() {
		var that = this;



		// Render initial/loading body
		// this.render_init();

		// Do we already have some data?
		// - we MUST already have some data, especially if we just loaded Threads a second ago
		// - unless we get here unexpectedly, in which case a "loading" screen should be shown
		// - maybe we just viewed this Thread, so we have it cached! 

		var data = App.Data.Store.AppMinimailLeisureFilter[this.leisureid];
		if(data == undefined){
			// Thread not set at all
			that.refresh_and_render_filter();

			// Shouldn't not be set at all
			// - show a total loading screen (loading Thread and Emails)
			// - todo...


			return false;
		} else {
			// We have some Thread data
			// probably some Email data for that Thread too

			// Display everything we have for the Thread and Emails

			// Check the API for any updates to the data that we have
			// - see if the version are different
			// - if versions are different than, don't worry about it because we're only updating the data we care about here

			// conditions: {
			// 	_modified : {
			// 		"$ne" : previous_modified_version
			// 	}
			// }

			// Get all the Emails for that Thread
			// - more than likely this barely changes (or maybe has a single new Email)
			// - I should already have the relationship in here

			// I already retrieved some of the emails beforehand
			// - I should have all the Email models at least in memory
			// - the ajax request is an "in case I fucked up and data has changed" type of request

			// var emails = _.filter( App.Data.Store.Email,function(email){
			// 	if(email.attributes.thread_id == that.threadid) return true;
			// });
			
			that.render_filter();

			// Have a partial list of emails, and a partial list of Threads
			// - render both
			// - trigger the updater to run

			that.refresh_and_render_filter();

		}

		return this;

	}

});


App.Views.Search = Backbone.View.extend({
	
	className: 'search_inside_view reverse_vertical',

	last_scroll_position: 0,

	events: {
		// 'click .save' : 'save',
		// 'click .preview' : 'preview'
		// 'click #back' : 'go_back',
		// 'click .sender' : 'approve',
		// 'click .sender_status a' : 'status_change'

		// 'click .thread-preview' : 'view_email'

		'click .search_category' : 'open_cat',
		'click .detail_item' : 'search_quick'

	},

	initialize: function(options) {
		var that = this;
		_.bindAll(this, 'render');

	},

	open_cat: function(ev){
		// Load correct view

		var that = this;
		var elem = ev.currentTarget;

		// threads, contacts, links, attachments
		switch($(elem).attr('data-type')){

			case 'threads':
				Backbone.history.loadUrl('search_emails');
				break;

			case 'contacts':
				Backbone.history.loadUrl('search_contacts');
				break;

			case 'attachments':
				Backbone.history.loadUrl('search_attachments');
				break;

			case 'links':
				Backbone.history.loadUrl('search_links');
				break;

			default:
				alert('failed finding type');
				return false;
		}

		return false;

	},

	search_quick: function(ev){
		// Running a quick search
		// - searching everything basically
		// - return contact matches, etc.

		alert('quick search off');
		return;

		var that = this;
		var elem = ev.currentTarget;

		var $search_category = $(elem).parents('.search_category');

		// Determine action based on which is clicked

		// $search_category

	},


	refresh_data: function(){
		// Refresh the data for the view

	},


	render_init: function(){
		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_search');

		// Write HTML
		this.$el.html(template());

		// Change size of window based on display size
		// $('.search_inside_view').css({
		// 	height: App.Data.xy.win_height - (60), // footer height = 60
		// 	width: App.Data.xy.win_width
		// });
		// $('.quick_searches').css({
		// 	"max-height": App.Data.xy.win_height - (60),  // footer height = 60
		// 	width: App.Data.xy.win_width
		// });
		// $('.search_inside .search_category:first-child').css({
		// 	"margin-top" : App.Data.xy.win_height - (60+75)
		// });
		
		// Focus on search box
		// this.$('input').focus();

		// Scroll down
		// $('.quick_searches').scrollTop($('.quick_searches').height());

		// Resize windows and scroller panes accordingly
		this.resize_fluid_page_elements();
		this.resize_scroller();

		// scroll to bottom
		this.$('.scroller').scrollTop(10000);

		return this;

	},

	render: function() {
		var that = this;

		// Render initial body
		this.render_init();



		// How old is it?
		// Do we need to do a refresh?

		// View is based on what data we do have, and a view makes sure the new data is being found? 




		return this;
	}
});


App.Views.SearchEmails = Backbone.View.extend({
	
	className: 'search_emails_inside_view reverse_vertical',

	last_scroll_position: 0,

	// Pre-filtered options
	filter_options: [
		// {
		// 	name: 'Search',
		// 	key: 'search'
		// },
		{
			name: 'Recently Viewed',
			key: 'recently_viewed'
		},
		{
			name: 'Recently Acted On',
			key: 'recently_acted_on'
		},
		{
			name: 'Sent',
			key: 'sent'
		}
	],

	// List fields to search (regex searching)
	filter_fields: [
		'original.TextBody',
		'original.HtmlBody',
		'original.HtmlTextSearchable', // - strip html (for searching HTML views)
		'original.headers.Subject',
		'original.headers.From',
		'original.headers.To',
		'original.headers.Reply-To',
		'original.attachments.name' // array
		], 

	events: {
		// 'click .save' : 'save',
		// 'click .preview' : 'preview'
		// 'click #back' : 'go_back',
		// 'click .sender' : 'approve',
		// 'click .sender_status a' : 'status_change'

		// 'click .thread-preview' : 'view_email'

		'change .prefilters_select' : 'click_prefilter',
		'click .form-search .submit' : 'search',
		'click .show_search' : 'show_search',
		'click .form-search .cancel' : 'hide_search',

		'click .thread' : 'view_thread'


	},

	initialize: function(options) {
		var that = this;
		_.bindAll(this, 'render');
		_.bindAll(this, 'render_loading_threads');

		_.bindAll(this, 'recently_viewed');
		_.bindAll(this, 'recently_acted_on');
		_.bindAll(this, 'sent_emails');

		_.bindAll(this, 'show_search');
		_.bindAll(this, 'hide_search');

	},

	click_prefilter : function(ev, elem2){
		// What are we filtering by?
		var that = this;
			
		var elem;
		if(elem2){
			elem = elem2;
		} else {
			elem = ev.currentTarget;
		}

		// Get selected element
		$(elem).blur();

		var elem_key = $(elem).find(':selected').val();

		// // de-active other filters
		// that.$('.prefilter').removeClass('active');

		// // mark this filter as active
		// $(elem).addClass('active');

		// re-search based on this new filter
		// - cache searches?
		// - use diff patching

		// Get type to search on
		// var elem_key = $(elem).attr('data-action');
		var type = _.filter(that.filter_options,function(opt){
			if(opt.key == elem_key){
				return true;
			}
		});
		if(type.length != 1){
			clog('failed');
			return false;
		}
		type = type[0];

		// Search using these conditions
		// - or not conditions, depends
		switch(type.key){

			case 'search': 
				that.show_search();
				break;

			case 'recently_viewed':
				// Uses info from local datastore
				that.recently_viewed();
				break;

			case 'recently_acted_on':
				// Uses info from local datastore
				that.recently_acted_on();
				break;

			case 'sent':
				// Sent emails
				that.sent_emails();
				break;

		}
		


		return false;
	},


	show_search: function(){
		// Show the search options
		var that = this;

		// hide search input
		that.$('.form-search').removeClass('nodisplay');

		// show select box
		that.$('.search_prefilters').addClass('nodisplay');

		// Focus on search box
		that.$('.form-search input[type="text"]').focus();

		// Display waiting icon
		that.render_waiting_for_search();

	},


	hide_search: function(){
		// Show the search options
		var that = this;

		// hide search input
		that.$('.form-search').addClass('nodisplay');

		// show select box
		that.$('.search_prefilters').removeClass('nodisplay');

		// switch select box to 2nd option
		that.$('select').val('recently_viewed');
		that.$('select').trigger('change');

		// clear the search box?

		return false;

	},

	search: function(ev){
		// Search was clicked
		var that = this;

		// Get search input (if any)
		var search_input = that.$('input.search-query').val();
		search_input = $.trim(search_input);

		if(search_input.length < 1){
			alert('Please search for something!');
			return false;
		}

		// Display loading icon
		that.render_loading_threads();

		// Get those threads and display them?
		// - not checking cache at all?
		var EmailCollection = new App.Collections.Emails();
		EmailCollection.fetch_for_search({
			text: search_input, // handles: AND, OR, has:attachment, etc.
			success: function(emails){

				// Returns a list of Emails
				// - use those for the display
				emails = emails.toJSON();

				// Merge together by Thread?
				// - todo...

				// Sort by date
				emails = App.Utils.sortBy({
					arr: emails,
					path: 'common.date',
					direction: 'desc',
					type: 'date'
				});

				// Template
				var template = App.Utils.template('t_search_emails_email_results');

				// Write HTML
				that.$('.search_emails_thread_results').html(template(emails));

				// Scroll to bottom
				$('.search_emails_thread_results').scrollTop($('.search_emails_thread_results').height() + 1000);

			}
		});

		return false;
	},


	recently_viewed: function(){
		// Renders recently viewed threads
		var that = this;

		// Display loading icon
		that.render_loading_threads();

		// Get thread ids (local)
		var thread_ids = $.extend([],App.Data.Store.ThreadsRecentlyViewed);

		// Limit to 10 results
		var super_recent = thread_ids.splice(0,10);

		// Get those threads and display them?
		// - not checking cache at all?
		var ThreadCollection = new App.Collections.Threads();
		ThreadCollection.fetch_by_ids_with_email({
			thread_ids: super_recent,
			success: function(threads){

				// Template
				var template = App.Utils.template('t_search_emails_thread_results');

				// Write HTML
				that.$('.search_emails_thread_results').html(template(threads));

				$('.search_emails_thread_results').scrollTop($('.search_emails_thread_results').height());
			}
		});


		// Change size of window based on display size
		that.scroll_to_bottom();

	},


	recently_acted_on: function(){
		// Renders recently viewed threads
		var that = this;

		// Display loading icon
		that.render_loading_threads();

		// Get thread ids (local)
		var thread_ids = $.extend([],App.Data.Store.ThreadsRecentlyActedOn);

		// Limit to 10 results
		var super_recent = thread_ids.splice(0,10);

		// Get those threads and display them?
		// - not checking cache at all?
		var ThreadCollection = new App.Collections.Threads();
		ThreadCollection.fetch_by_ids_with_email({
			thread_ids: super_recent,
			success: function(threads){

				// Template
				var template = App.Utils.template('t_search_emails_thread_results');

				// Write HTML
				that.$('.search_emails_thread_results').html(template(threads));

				$('.search_emails_thread_results').scrollTop($('.search_emails_thread_results').height());
			}
		});

		// search_emails_thread_results
		that.scroll_to_bottom();

	},

	sent_emails: function(){
		// Renders recently viewed threads
		var that = this;

		// Display loading icon
		that.render_loading_threads();

		// Get those threads and display them?
		// - not checking cache at all?
		var EmailCollection = new App.Collections.Emails();
		EmailCollection.fetch_sent({
			success: function(emails){

				// Returns a list of Emails
				// - use those for the display
				emails = emails.toJSON();

				// Merge together by Thread?
				// - todo...

				// Sort by date
				emails = App.Utils.sortBy({
					arr: emails,
					path: 'common.date',
					direction: 'desc',
					type: 'date'
				});

				// Template
				var template = App.Utils.template('t_search_emails_email_results');

				// Write HTML
				that.$('.search_emails_thread_results').html(template(emails));

				// Scroll to bottom
				$('.search_emails_thread_results').scrollTop($('.search_emails_thread_results').height() + 1000);

			}
		});

		return false;

	},

	view_thread: function(ev){
		// Show a thread
		var that = this;
		var elem = ev.currentTarget;

		// Get Thread id
		var id = $(elem).attr('data-id');

		// Set last scroll position
		this.last_scroll_position = $('.threads_holder').scrollTop();
		this.$el.parents('.main_body').attr('last-scroll-position',this.last_scroll_position);

		// Launch view for that Thread
		Backbone.history.loadUrl('view_thread/' + id + '/searching');

	},

	scroll_to_bottom: function(){

		// // Change size of window based on display size
		// $('.search_emails_thread_results').css({
		// 	height: App.Data.xy.win_height - (60 + 50), // footer height = 60. search_footer height = 50. critera height = 50
		// 	width: App.Data.xy.win_width
		// });
		// $('.search_emails_thread_results').css({
		// 	"max-height": App.Data.xy.win_height - (60 + 50),  // footer height = 60. search_footer height = 50. critera height = 50
		// 	width: App.Data.xy.win_width
		// });
		// $('.search_emails_thread_results .search_result:first-child').css({
		// 	"margin-top" : App.Data.xy.win_height - (60+75) // 75?
		// });
	
		return;

	},


	render_init: function(){
		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_search_emails');

		// Write HTML
		this.$el.html(template({
			filter_options: that.filter_options
		}));

		// Resize the scroller
		this.resize_fluid_page_elements();
		this.resize_scroller();

		// Choose Recent
		console.log(1);
		that.$('select').val('recently_viewed');
		this.click_prefilter(null, that.$('select'));
		console.log(2);
		// that.$('select').trigger('change');
		// that.$('select').blur();

		// // Change size of window based on display size
		// $('.search_emails_inside_view').css({
		// 	height: $(window).height() - (60 + 50 + 50), // footer height = 60. search_footer height = 50. critera height = 50
		// 	width: $(window).width()
		// });
		// $('.search_emails_inside_view').css({
		// 	"max-height": $(window).height() - (60 + 50 + 50),  // footer height = 60. search_footer height = 50. critera height = 50
		// 	width: $(window).width()
		// });
		// $('.search_emails_inside_view .search_result:first-child').css({
		// 	"margin-top" : $(window).height() - (60+75) // 75?
		// });
		
		// Focus on search box
		// this.$('input').focus();


		return this;

	},

	render_loading_threads: function(){
		var that = this;

		// Template
		var template = App.Utils.template('t_search_thread_results_loading');

		// Write HTML
		that.$('.search_emails_thread_results').html(template());

	},

	render_waiting_for_search: function(){
		var that = this;

		// Template
		var template = App.Utils.template('t_search_waiting_for_input');

		// Write HTML
		that.$('.search_emails_thread_results').html(template());

	},

	render: function() {
		var that = this;

		// Render initial body
		this.render_init();

		// How old is it?
		// Do we need to do a refresh?

		// View is based on what data we do have, and a view makes sure the new data is being found? 

		return this;
	}
});


App.Views.SearchAttachments = Backbone.View.extend({
	
	className: 'search_emails_inside_view',

	last_scroll_position: 0,

	// Pre-filtered options
	filter_options: [
		// {
		// 	name: 'Search',
		// 	key: 'search'
		// },
		{
			name: 'Recent',
			key: 'recent'
		},
		{
			name: 'Received',
			key: 'received'
		},
		{
			name: 'Sent',
			key: 'sent'
		}
	],

	events: {

		'change .prefilters_select' : 'click_prefilter',
		'click .form-search .submit' : 'search',
		'click .show_search' : 'show_search',
		'click .form-search .cancel' : 'hide_search',

		'click .attachment' : 'view_attachment'

		// 'click .thread' : 'view_thread'

	},

	initialize: function(options) {
		var that = this;
		_.bindAll(this, 'render');
		_.bindAll(this, 'render_loading_threads');

		// _.bindAll(this, 'recently_viewed');
		// _.bindAll(this, 'recently_acted_on');
		// _.bindAll(this, 'sent_emails');

		_.bindAll(this, 'show_search');
		_.bindAll(this, 'hide_search');

	},

	click_prefilter : function(ev){
		// What are we filtering by?
		var that = this;
		var elem = ev.currentTarget;

		// Get selected element

		$(elem).blur();

		var elem_key = $(elem).find(':selected').val();

		// // de-active other filters
		// that.$('.prefilter').removeClass('active');

		// // mark this filter as active
		// $(elem).addClass('active');

		// re-search based on this new filter
		// - cache searches?
		// - use diff patching

		// Get type to search on
		// var elem_key = $(elem).attr('data-action');
		var type = _.filter(that.filter_options,function(opt){
			if(opt.key == elem_key){
				return true;
			}
		});
		if(type.length != 1){
			clog('failed');
			return false;
		}
		type = type[0];

		// Search using these conditions
		// - or not conditions, depends
		switch(type.key){

			case 'recent':
				// Uses info from local datastore
				that.recent_attachments();
				break;

			case 'received':
				// Uses info from local datastore
				that.received_attachments();
				break;

			case 'sent':
				// Sent attachments
				that.sent_attachments();
				break;

		}
		


		return false;
	},


	show_search: function(){
		// Show the search options
		var that = this;

		// hide search input
		that.$('.form-search').removeClass('nodisplay');

		// show select box
		that.$('.search_prefilters').addClass('nodisplay');

		// Focus on search box
		that.$('.form-search input[type="text"]').focus();

		// Display waiting icon
		that.render_waiting_for_search();

	},


	hide_search: function(){
		// Show the search options
		var that = this;

		// hide search input
		that.$('.form-search').addClass('nodisplay');

		// show select box
		that.$('.search_prefilters').removeClass('nodisplay');

		// switch select box to 2nd option
		that.$('select').val('recently_viewed');
		that.$('select').trigger('change');

		// clear the search box?

		return false;

	},

	search: function(ev){
		// Search was clicked
		var that = this;

		// Get search input (if any)
		var search_input = that.$('input.search-query').val();
		search_input = $.trim(search_input);

		if(search_input.length < 1){
			alert('Please search for something!');
			return false;
		}

		// Display loading icon
		that.render_loading_threads();

		// Get those threads and display them?
		// - not checking cache at all?
		var AttachmentsCollection = new App.Collections.Attachments();
		AttachmentsCollection.fetch_for_search({
			text: search_input, // handles: AND, OR, has:attachment, etc.
			success: function(attachments){

				// Attachment also includes Thread._id and Email._id

				// Only show 20 attachments at a time?
				attachments = attachments.splice(0,20);

				// Sort by date
				attachments = App.Utils.sortBy({
					arr: attachments,
					path: 'date',
					direction: 'desc',
					type: 'date'
				});

				// Template
				var template = App.Utils.template('t_search_attachments_results');

				// Write HTML
				that.$('.search_attachments_results').html(template(attachments));

				// Scroll to bottom
				that.scroll_to_bottom();

			}
		});

		return false;
	},

	recent_attachments: function(){
		// Renders recently viewed threads
		var that = this;

		// Display loading icon
		// that.render_loading_threads();

		// Get those threads and display them?
		// - not checking cache at all?
		var AttachmentsCollection = new App.Collections.Attachments();
		AttachmentsCollection.fetch_recent({
			success: function(attachments){

				// Attachment also includes Thread._id and Email._id

				// Only show 20 attachments at a time?
				attachments = attachments.splice(0,20);

				// Sort by date
				attachments = App.Utils.sortBy({
					arr: attachments,
					path: 'date',
					direction: 'desc',
					type: 'date'
				});

				// Template
				var template = App.Utils.template('t_search_attachments_results');

				// Write HTML
				that.$('.search_attachments_results').html(template(attachments));

				// Scroll to bottom
				that.scroll_to_bottom();

			}
		});

		return false;

	},

	received_attachments: function(){
		// Renders recently viewed threads
		var that = this;

		// Display loading icon
		// that.render_loading_threads();

		// Get those threads and display them?
		// - not checking cache at all?
		var AttachmentsCollection = new App.Collections.Attachments();
		AttachmentsCollection.fetch_received({
			success: function(attachments){

				// Attachment also includes Thread._id and Email._id

				// Only show 20 attachments at a time?
				attachments = attachments.splice(0,20);

				// Sort by date
				attachments = App.Utils.sortBy({
					arr: attachments,
					path: 'date',
					direction: 'desc',
					type: 'date'
				});

				// Template
				var template = App.Utils.template('t_search_attachments_results');

				// Write HTML
				that.$('.search_attachments_results').html(template(attachments));

				// Scroll to bottom
				that.scroll_to_bottom();

			}
		});

		return false;

	},

	sent_attachments: function(){
		// Renders recently viewed threads
		var that = this;

		// Display loading icon
		// that.render_loading_threads();

		// Get those threads and display them?
		// - not checking cache at all?
		var AttachmentsCollection = new App.Collections.Attachments();
		AttachmentsCollection.fetch_sent({
			success: function(attachments){

				// Attachment also includes Thread._id and Email._id

				// Only show 20 attachments at a time?
				attachments = attachments.splice(0,20);

				// Sort by date
				attachments = App.Utils.sortBy({
					arr: attachments,
					path: 'date',
					direction: 'desc',
					type: 'date'
				});

				// Template
				var template = App.Utils.template('t_search_attachments_results');

				// Write HTML
				that.$('.search_attachments_results').html(template(attachments));

				// Scroll to bottom
				that.scroll_to_bottom();

			}
		});

		return false;

	},

	view_attachment: function(ev){
		// Show an attachment
		// - different saving options?
		// - filepicker.io!

		// Shows the view for the attachment
		var that = this;
		var elem = ev.currentTarget;

		// Get Thread id
		var path = $(elem).attr('data-path');

		// Open path
		window.open(App.Credentials.s3_bucket + path);
		return false;

		// window.open();

		// Set last scroll position
		this.last_scroll_position = $('.threads_holder').scrollTop();
		this.$el.parents('.main_body').attr('last-scroll-position',this.last_scroll_position);

		// Launch view for that Thread
		Backbone.history.loadUrl('view_thread/' + id + '/searching');

	},

	view_thread: function(ev){
		// Show an attachment
		// - different saving options?
		// - filepicker.io!
		
		var that = this;
		var elem = ev.currentTarget;

		// Get Thread id
		var id = $(elem).attr('data-id');

		// Set last scroll position
		this.last_scroll_position = $('.threads_holder').scrollTop();
		this.$el.parents('.main_body').attr('last-scroll-position',this.last_scroll_position);

		// Launch view for that Thread
		Backbone.history.loadUrl('view_thread/' + id + '/searching');

	},

	scroll_to_bottom: function(){
		// Re-render window and scroll to bottom

		// // Change size of window based on display size
		// $('.search_attachments_results').css({
		// 	"max-height": App.Data.xy.win_height - (60 + 50),  // footer height = 60. search_footer height = 50. critera height = 50
		// 	width: App.Data.xy.win_width
		// });
		// $('.search_attachments_results .attachment:first-child').css({
		// 	"margin-top" : App.Data.xy.win_height - (60 + 105) // both footers, attachment height
		// });

		// $('.search_attachments_results').scrollTop($('.search_attachments_results').height() + 1000);

		return;
	},


	render_init: function(){
		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_search_attachments');

		// Write HTML
		this.$el.html(template({
			filter_options: that.filter_options
		}));

		// Choose Recent
		that.$('select').val('recent');
		that.$('select').trigger('change');

		// Resize fluid elements
		this.resize_fluid_page_elements();
		this.resize_scroller();

		return this;

	},

	render_loading_threads: function(){
		var that = this;

		// Template
		var template = App.Utils.template('t_search_thread_results_loading');

		// Write HTML
		that.$('.search_emails_thread_results').html(template());

		// Resize windows and scroller panes accordingly
		this.resize_fluid_page_elements();
		this.resize_scroller();

	},

	render_waiting_for_search: function(){
		var that = this;

		// Template
		var template = App.Utils.template('t_search_waiting_for_input');

		// Write HTML
		that.$('.search_emails_thread_results').html(template());

	},

	render: function() {
		var that = this;

		// Render initial body
		this.render_init();



		// How old is it?
		// Do we need to do a refresh?

		// View is based on what data we do have, and a view makes sure the new data is being found? 

		return this;
	}
});


App.Views.SearchLinks = Backbone.View.extend({
	
	className: 'search_emails_inside_view',

	last_scroll_position: 0,

	// Pre-filtered options
	filter_options: [
		// {
		// 	name: 'Search',
		// 	key: 'search'
		// },
		{
			name: 'Recent',
			key: 'recent'
		},
		{
			name: 'Received',
			key: 'received'
		},
		{
			name: 'Sent',
			key: 'sent'
		}
	],

	events: {

		'change .prefilters_select' : 'click_prefilter',
		'click .form-search .submit' : 'search',
		'click .show_search' : 'show_search',
		'click .form-search .cancel' : 'hide_search'

		// 'click .thread' : 'view_thread'

	},

	initialize: function(options) {
		var that = this;
		_.bindAll(this, 'render');
		_.bindAll(this, 'render_loading_threads');

		// _.bindAll(this, 'recently_viewed');
		// _.bindAll(this, 'recently_acted_on');
		// _.bindAll(this, 'sent_emails');

		_.bindAll(this, 'show_search');
		_.bindAll(this, 'hide_search');

	},

	click_prefilter : function(ev){
		// What are we filtering by?
		var that = this;
		var elem = ev.currentTarget;

		// Get selected element

		$(elem).blur();

		var elem_key = $(elem).find(':selected').val();

		// // de-active other filters
		// that.$('.prefilter').removeClass('active');

		// // mark this filter as active
		// $(elem).addClass('active');

		// re-search based on this new filter
		// - cache searches?
		// - use diff patching

		// Get type to search on
		// var elem_key = $(elem).attr('data-action');
		var type = _.filter(that.filter_options,function(opt){
			if(opt.key == elem_key){
				return true;
			}
		});
		if(type.length != 1){
			clog('failed');
			return false;
		}
		type = type[0];

		// Search using these conditions
		// - or not conditions, depends
		switch(type.key){

			case 'recent':
				// Uses info from local datastore
				that.recent_links();
				break;

			case 'received':
				// Uses info from local datastore
				that.received_links();
				break;

			case 'sent':
				// Sent attachments
				that.sent_links();
				break;

		}
		


		return false;
	},


	show_search: function(){
		// Show the search options
		var that = this;

		// hide search input
		that.$('.form-search').removeClass('nodisplay');

		// show select box
		that.$('.search_prefilters').addClass('nodisplay');

		// Focus on search box
		that.$('.form-search input[type="text"]').focus();

		// Display waiting icon
		that.render_waiting_for_search();

	},


	hide_search: function(){
		// Show the search options
		var that = this;

		// hide search input
		that.$('.form-search').addClass('nodisplay');

		// show select box
		that.$('.search_prefilters').removeClass('nodisplay');

		// switch select box to 2nd option
		that.$('select').val('recently_viewed');
		that.$('select').trigger('change');

		// clear the search box?

		return false;

	},

	search: function(ev){
		// Search was clicked
		var that = this;

		// Get search input (if any)
		var search_input = that.$('input.search-query').val();
		search_input = $.trim(search_input);

		if(search_input.length < 1){
			alert('Please search for something!');
			return false;
		}

		// Display loading icon
		that.render_loading_threads();

		// Get those threads and display them?
		// - not checking cache at all?
		var LinksCollection = new App.Collections.Links();
		LinksCollection.fetch_for_search({
			text: search_input, // todo: handles: AND, OR, has:attachment, etc.
			success: function(links){

				// Attachment also includes Thread._id and Email._id

				// Only show 20 links at a time?
				links = links.splice(0,100);

				// Sort by date
				links = App.Utils.sortBy({
					arr: links,
					path: 'date',
					direction: 'desc',
					type: 'date'
				});

				// Template
				var template = App.Utils.template('t_search_links_results');

				// Write HTML
				that.$('.search_links_results').html(template(links));

				// Scroll to bottom
				that.scroll_to_bottom();

			}
		});

		return false;
	},

	recent_links: function(){
		// Renders recently viewed threads
		var that = this;

		// Display loading icon
		// that.render_loading_threads();

		// Get those threads and display them?
		// - not checking cache at all?
		var LinksCollection = new App.Collections.Links();
		LinksCollection.fetch_recent({
			success: function(links){

				// Attachment also includes Thread._id and Email._id

				// Only show 20 links at a time?
				links = links.splice(0,100);

				// Sort by date
				links = App.Utils.sortBy({
					arr: links,
					path: 'date',
					direction: 'desc',
					type: 'date'
				});

				// Template
				var template = App.Utils.template('t_search_links_results');

				// Write HTML
				that.$('.search_links_results').html(template(links));

				// Scroll to bottom
				that.scroll_to_bottom();

			}
		});

		return false;

	},

	received_links: function(){
		// Renders recently viewed threads
		var that = this;

		// Display loading icon
		// that.render_loading_threads();

		// Get those threads and display them?
		// - not checking cache at all?
		var LinksCollection = new App.Collections.Links();
		LinksCollection.fetch_received({
			success: function(links){

				// Attachment also includes Thread._id and Email._id

				// Only show 20 links at a time?
				links = links.splice(0,100);

				// Sort by date
				links = App.Utils.sortBy({
					arr: links,
					path: 'date',
					direction: 'desc',
					type: 'date'
				});

				// Template
				var template = App.Utils.template('t_search_links_results');

				// Write HTML
				that.$('.search_links_results').html(template(links));

				// Scroll to bottom
				that.scroll_to_bottom();

			}
		});

		return false;

	},

	sent_links: function(){
		// Renders recently viewed threads
		var that = this;

		// Display loading icon
		// that.render_loading_threads();

		// Get those threads and display them?
		// - not checking cache at all?
		var LinksCollection = new App.Collections.Links();
		LinksCollection.fetch_sent({
			success: function(links){

				// Attachment also includes Thread._id and Email._id

				// Only show 20 links at a time?
				links = links.splice(0,100);

				// Sort by date
				links = App.Utils.sortBy({
					arr: links,
					path: 'date',
					direction: 'desc',
					type: 'date'
				});

				// Template
				var template = App.Utils.template('t_search_links_results');

				// Write HTML
				that.$('.search_links_results').html(template(links));

				// Scroll to bottom
				that.scroll_to_bottom();

			}
		});

		return false;

	},

	view_attachment: function(ev){
		// Show an attachment
		// - different saving options?
		// - filepicker.io!

		// Shows the view for the attachment
		alert('showing attachment view');
		return false;
		
		var that = this;
		var elem = ev.currentTarget;

		// Get Thread id
		var id = $(elem).attr('data-id');

		// Set last scroll position
		this.last_scroll_position = $('.threads_holder').scrollTop();
		this.$el.parents('.main_body').attr('last-scroll-position',this.last_scroll_position);

		// Launch view for that Thread
		Backbone.history.loadUrl('view_thread/' + id + '/searching');

	},

	view_thread: function(ev){
		// Show an attachment
		// - different saving options?
		// - filepicker.io!
		
		var that = this;
		var elem = ev.currentTarget;

		// Get Thread id
		var id = $(elem).attr('data-id');

		// Set last scroll position
		this.last_scroll_position = $('.threads_holder').scrollTop();
		this.$el.parents('.main_body').attr('last-scroll-position',this.last_scroll_position);

		// Launch view for that Thread
		Backbone.history.loadUrl('view_thread/' + id + '/searching');

	},

	scroll_to_bottom: function(){
		// Re-render window and scroll to bottom

		// Change size of window based on display size
		// $('.search_links_results').css({
		// 	"max-height": App.Data.xy.win_height - (60 + 50),  // footer height = 60. search_footer height = 50. critera height = 50
		// 	width: App.Data.xy.win_width
		// });
		// $('.search_links_results .parsed_link:first-child').css({
		// 	"margin-top" : App.Data.xy.win_height - (60 + 105) // both footers, attachment height
		// });

		// $('.search_links_results').scrollTop($('.search_links_results').height() + 1000);

	},


	render_init: function(){
		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_search_links');

		// Write HTML
		this.$el.html(template({
			filter_options: that.filter_options
		}));

		// Choose Recent
		that.$('select').val('recent');
		that.$('select').trigger('change');

		return this;

	},

	render_loading_threads: function(){
		var that = this;

		// Template
		var template = App.Utils.template('t_search_thread_results_loading');

		// Write HTML
		that.$('.search_emails_thread_results').html(template());

	},

	render_waiting_for_search: function(){
		var that = this;

		// Template
		var template = App.Utils.template('t_search_waiting_for_input');

		// Write HTML
		that.$('.search_emails_thread_results').html(template());

	},

	render: function() {
		var that = this;

		// Render initial body
		this.render_init();



		// How old is it?
		// Do we need to do a refresh?

		// View is based on what data we do have, and a view makes sure the new data is being found? 

		return this;
	}
});



App.Views.Collections = Backbone.View.extend({
	
	el: '.body_container',

	events: {
	},

	initialize: function(options) {
		_.bindAll(this, 'render');

		// this.el = this.options.el;

	},

	go_back: function(ev){
		Backbone.history.loadUrl('body');
		return false;
	},

	render: function() {
		var that = this;
		// Data
		// var data = this.options.accounts.UserGmailAccounts;

		// Should start the updater for accounts
		// - have a separate view for Accounts?

		// Template
		var template = App.Utils.template('t_collections');

		// Write HTML
		this.$el.html(template());

		return this;
	}
});





App.Views.SendersList = Backbone.View.extend({

	el: '.senders_list',

	events: {
		// 'click button' : 'login' // composing new email,
		'click .move_sender' : 'move_sender'
	},

	initialize: function() {
		// _.bindAll(this, 'render');

		var that = this;

		// Load the model

		this.status = this.options.status;

		var searchQuery = {
			'model' : 'AppMinimalContact',
			'fields' : [],
			'conditions' : {
				status: this.status,
				live: 1
			},
			'limit' : 500
		};
		if(this.status == 'pending'){ // Pending including emails without a status
			searchQuery.conditions = {
				"$or" : [
					{
						status: this.status,
						live: 1
					},
					{
						status: {"$exists" : false}, 
						live: 1
					}
				]
			};
		}

		this.ready = $.Deferred();

		Api.search({
			data: searchQuery,
			success: function(res){
				res = JSON.parse(res);
				// clog(res.data);
				// clog($(that.el));
				that.ready.resolve(res.data);
			}
		});

		return this;
	},

	close: function(){

		this.remove();
		this.unbind();

		clog('clsin');
		clog(this);

	},

	move_sender: function(ev){
		var elem = ev.currentTarget;

		// Change status
		var status = $(elem).attr('data-status');

		var $parent = $(elem).parents('.sender');
		var id = $parent.attr('data-id');

		// Changed status?		
		if(status != $parent.attr('data-status')){
			// Make API call
			Api.update({
				data: {
					model: 'AppMinimalContact',
					id: id,
					paths: {
						"$set" : {
							"status" : status
						}
					}
				},
				success: function(res){
					res = JSON.parse(res);
				}
			});
			// Changed the status, remove from this list
			$parent.transition({
				opacity: 0
			},300,function(){
				$(this).remove();
			});
		} else {
			// Same
			App.Utils.toast('No Change');
		}

		return false;
	},

	render: function() {
		var that = this;
		
		var template = App.Utils.template('t_senders_list_loading');
		this.$el.html(template());

		this.ready.promise()
			.then(function(contacts){

				$.each(contacts,function(i,val){
					contacts[i].AppMinimalContact.domain = contacts[i].AppMinimalContact.email.split('@').splice(-1,1).toString();
					contacts[i].AppMinimalContact.domain = contacts[i].AppMinimalContact.domain.charAt(0).toUpperCase() + contacts[i].AppMinimalContact.domain.slice(1);
					contacts[i].AppMinimalContact.local = contacts[i].AppMinimalContact.email.split('@').splice(0,contacts[i].AppMinimalContact.email.split('@').length - 1).toString();
					contacts[i].AppMinimalContact.local = contacts[i].AppMinimalContact.local.charAt(0).toUpperCase() + contacts[i].AppMinimalContact.local.slice(1);
				});

				// Sort by domain
				contacts = App.Utils.sortBy(contacts,'AppMinimalContact.domain','desc');

				// clog(contacts);

				// Template
				var template = App.Utils.template('t_senders_list');

				that.$el.html(template(contacts));
			});

		return this;

	}


});

App.Views.Logout = Backbone.View.extend({

	className: 'logout',

	events: {
		'click #logout' : 'logout' // logging out
	},

	initialize: function() {
		_.bindAll(this, 'render');

	},

	logout: function(ev){
		// This doesn't work at all
		// - just stopped working completely for some reason

		alert('logout clicked');
		Backbone.history.loadUrl('logout');
		return false;

	},

	render: function(){
		var that = this;

		// Remove any previous one
		// $('.logout').remove();

		// Build from template
		var template = App.Utils.template('t_logout');

		// Write HTML
		that.$el.html(template());

		// Show logout
		that.$el.addClass('display');

		that.$el.transition({
			top: '150px',
			opacity: 1
		},'fast');
		
		// Just show a logout dialog box
		var p = confirm('Logout?');
		if(p){
			Backbone.history.loadUrl('logout');
		} else {
			that.close();
		}

		return this;
	}

});

App.Views.BodyLogin = Backbone.View.extend({
	
	el: 'body',

	events: {
		'click button' : 'login' // composing new email,

	},

	initialize: function() {
		_.bindAll(this, 'render');

	},

	login: function(ev){
		// Start OAuth process
		var that = this;

		var p = {
			app_id : App.Credentials.app_key,
			callback : [location.protocol, '//', location.host, location.pathname].join('')
		};

		if(useForge){
			p.callback = 'https://getemailbox.com/testback/';
			var params = $.param(p);


			// Hide the News window
			// that.$el.html('<div class="loading">Freshening up...</div>');
			that.$el.html('<div class="loading"></div>');

			forge.tabs.openWithOptions({
					url: App.Credentials.base_api_url + "/apps/authorize/?" + params,
					pattern: 'https://getemailbox.com/testback/*'
				}, function (data) {

					// First, parse the query string
					var params = {}, queryString = data.url.substring(data.url.indexOf('#')+1),
						regex = /([^&=]+)=([^&]*)/g, m;
					while (m = regex.exec(queryString)) {
						params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
					}

					var qs = App.Utils.getUrlVars(data.url);

					if(typeof qs.user_token == "string"){
						// Have a user_token
						// - save it to localStorage
						App.Utils.Storage.set(App.Credentials.prefix_user_token + 'user_token',qs.user_token)
							.then(function(){
								
								// Reload page, back to #home
								forge.logging.info('reloading');
								window.location = [location.protocol, '//', location.host, location.pathname].join('');
							});
						
					} else {
						// Show login splash screen
						// - failed login
						
						forge.logging.info('== failed logging in ==');
						var page = new App.Views.BodyLogin();
						App.router.showView('bodylogin',page);
					}

					forge.logging.info('PARAMS:');
					forge.logging.info(params);

					// forge.request.ajax({
					// 	url: 'https://www.googleapis.com/oauth2/v1/userinfo?access_token='+params['access_token'],
					// 	dataType: 'json',
					// 	success: function (data) {
					// 		$('#results').html('<div><img src="'+data.picture+'"><br>Name: '+data.name+'<br>Email: '+data.email+'<br>Gender: '+data.gender+'</div>');
					// 	},
					// 	error: function (error) {
					// 		alert("Error");
					// 	}
					// });

				});
		} else if(usePg){
			
			var p = {
				response_type: 'token',
				client_id : App.Credentials.app_key,
				redirect_uri : 'https://getemailbox.com/testback/'
				// state // optional
				// x_user_id // optional	
			};
			var params = $.param(p);
			var call_url = App.Credentials.base_api_url + "/apps/authorize/?" + params;

			window.plugins.childBrowser.showWebPage(call_url,{
				showLocationBar: false,
				showAddress: false,
				showNavigationBar: false
			});
			window.plugins.childBrowser.onLocationChange = function(loc){
				//Really cool hack
				// window.plugins.childBrowser.close();

				var parser = document.createElement('a');
				parser.href = loc;
				// console.log(loc);

				// alert('u');
				// alert(parser.hostname);
				// alert(parser.pathname);

				// return false;

				var url = loc;

				if(parser.hostname == 'getemailbox.com' && parser.pathname == '/testback/'){
					
					// var qs = App.Utils.getUrlVars();
					var oauthParams = App.Utils.getOAuthParamsInUrl(url);

					// if(typeof qs.user_token == "string"){
					if(typeof oauthParams.access_token == "string"){

						// Have an access_token
						// - save it to localStorage

						// App.Utils.Storage.set(App.Credentials.prefix_access_token + 'user', oauthParams.user_identifier);
						// App.Utils.Storage.set(App.Credentials.prefix_access_token + 'access_token', oauthParams.access_token);

						App.Utils.Storage.set(App.Credentials.prefix_access_token + 'user',oauthParams.user_identifier)
							.then(function(){
								// Saved user!
							});

						App.Utils.Storage.set(App.Credentials.prefix_access_token + 'access_token',oauthParams.access_token)
							.then(function(){
								
								// Reload page, back to #home
								// forge.logging.info('reloading');

								// alert('success');
								window.plugins.childBrowser.close();


								// // Reload page, back to #home
								// window.location = [location.protocol, '//', location.host, location.pathname].join('');

								$('body').html('');

								// Reload page, back to #home
								window.location = [location.protocol, '//', location.host, location.pathname].join('');
							});


					} else {
						// Show login splash screen
						var page = new App.Views.BodyLogin();
						App.router.showView('bodylogin',page);
					}

					return;


					// First, parse the query string
					var params = {}, queryString = url.substring(url.indexOf('#')+1),
						regex = /([^&=]+)=([^&]*)/g, m;
					while (m = regex.exec(queryString)) {
						params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
					}

					var qs = App.Utils.getUrlVars(url);

					if(typeof qs.user_token == "string"){
						// Have a user_token
						// - save it to localStorage
						App.Utils.Storage.set(App.Credentials.prefix_user_token + 'user_token',qs.user_token)
							.then(function(){
								
								// Reload page, back to #home
								// forge.logging.info('reloading');

								// alert('success');
								window.plugins.childBrowser.close();

								$('body').html('');
								window.location = [location.protocol, '//', location.host, location.pathname].join('');
							});
						
					} else {
						// Show login splash screen
						// - failed login

						alert('Login Failed');
						window.plugins.childBrowser.close();
						
						// forge.logging.info('== failed logging in ==');
						var page = new App.Views.BodyLogin();
						App.router.showView('bodylogin',page);

					}

				}

				return;



				// First, parse the query string
				var params = {}, queryString = url.substring(url.indexOf('#')+1),
					regex = /([^&=]+)=([^&]*)/g, m;
				while (m = regex.exec(queryString)) {
					params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
				}

				var qs = App.Utils.getUrlVars(url);

				if(typeof qs.user_token == "string"){
					// Have a user_token
					// - save it to localStorage
					App.Utils.Storage.set(App.Credentials.prefix_user_token + 'user_token',qs.user_token)
						.then(function(){
							
							// Reload page, back to #home
							// forge.logging.info('reloading');

							window.location = [location.protocol, '//', location.host, location.pathname].join('');
						});
					
				} else {
					// Show login splash screen
					// - failed login
					
					forge.logging.info('== failed logging in ==');
					var page = new App.Views.BodyLogin();
					App.router.showView('bodylogin',page);
				}

				forge.logging.info('PARAMS:');
				forge.logging.info(params);



				//DOM auto-parses
				if (parser.hostname == "www.filepicker.io" && parser.pathname == FINISHED_PATH) {
					window.plugins.childBrowser.close();
					var args = parser.search.substring(1).split('&');
					argsParsed = {};

					//Kindly provided by 'http://stackoverflow.com/questions/2090551/parse-query-string-in-javascript'
					for (i=0; i < args.length; i++) {
						arg = unescape(args[i]);

						if (arg.indexOf('=') == -1) {
							argsParsed[arg.trim()] = true;
						} else {
							kvp = arg.split('=');
							argsParsed[kvp[0].trim()] = kvp[1].trim();
						}
					}
					callback(argsParsed);
				}
			};

		} else {

			var p = {
				response_type: 'token',
				client_id : App.Credentials.app_key,
				redirect_uri : [location.protocol, '//', location.host, location.pathname].join('')
				// state // optional
				// x_user_id // optional	
			};
			var params = $.param(p);

			window.location = App.Credentials.base_api_url + "/apps/authorize/?" + params;

		}

		return false;

	},

	render: function() {

		var template = App.Utils.template('t_body_login');

		// Write HTML
		$(this.el).html(template());

		return this;
	}
});


App.Views.Modal = Backbone.View.extend({
	
	el: 'body',

	events: {
	},

	initialize: function() {
		_.bindAll(this, 'render');
	},

	render: function() {

		// Remove any previous version
		$('#modalIntro').remove();

		// Build from template
		var template = App.Utils.template('t_modal_intro');

		// Write HTML
		$(this.el).append(template());

		// Display Modal
		$('#modalIntro').modal();

		return this;
	}

});


App.Views.Toast = Backbone.View.extend({
	
	el: 'body',

	events: {
	},

	initialize: function() {
		_.bindAll(this, 'render');
	},

	render: function() {

		// Remove any previous version
		$('#toast').remove();

		// Build from template
		var template = App.Utils.template('t_toast');

		// Write HTML
		$(this.el).append(template({
			message: this.options.message
		}));

		$('#toast').animate({
			opacity: 1
		},'fast');

		// Display Modal
		window.setTimeout(function(){
			$('#toast').animate({
				opacity: 0
			},'fast',function(){
				$(this).remove();
			});
		},3000);

		return this;
	}

});


App.Views.DebugMessages = Backbone.View.extend({
	
	el: 'body',

	events: {
	},

	initialize: function() {
		_.bindAll(this, 'render');
		// _.bindAll(this, 're_render');
		// _.bindAll(this, 'render');

		// Bind to new debug message events
		App.Events.bind('debug_messages_update',this.render);

	},

	render: function() {

		// Remove any previous version
		$('#debug-messages').remove();

		// Get debug messages
		// - already in App.Data.debug_messages


		// Build from template
		var template = App.Utils.template('t_debug_messages');

		// Get data and sort it
		// - sort by date
		// - newest item is at the bottom?
		var data = $.extend({},App.Data.debug_messages);
		data = App.Utils.sortBy({
			arr: data,
			path: 'datetime',
			direction: 'asc',
			type: 'date'
		});

		// Write HTML
		$(this.el).prepend(template(App.Data.debug_messages));

		// timeago
		// - crude
		// this.$('.timeago').timeago();
		
		return this;
	}

});


App.Views.DelayModal = Backbone.View.extend({

	className: 'delay_modal',

	events: {
		'click .option' : 'click_option',
		'click .overlay' : 'cancel',
		'blur #pickadate' : 'picked_date',

		'click .btn-cancel' : 'cancel_confirmation',
		'click .btn-delay' : 'choose_confirmation'
	},

	initialize: function() {
		_.bindAll(this, 'render');
		_.bindAll(this, 'save_delay');

		this.threadView = $(this.options.context).parents('.thread');
		this.threadid = this.options.threadid;

	},


	cancel: function(ev){
		// Remove overlay
		this.close();
		// $('#delay_modal').remove();
		// this.unbind();

		// call onComplete if exists
		if(this.options.onComplete){
			this.options.onComplete(null);
		} else {
			// Slide piece back in
			App.Plugins.Minimail.revert_box(this.options.context);
		}

		return false;
	},


	click_option: function(ev){
		// Clicked an option
		// - take an action on the Thread
		var that = this;
		var elem = ev.currentTarget;

		// Valid?
		if($(elem).hasClass('ignore')){
			return false;
		}

		// Pick a date?
		if($(elem).hasClass('pickadate')){
			// Let pick continue to datepicker
			// - auto-triggers the datepicker on Android/iOS

			// listen for end of date picker
			// clog('TRIGGERED');
			// // $(elem).find('input').trigger('click');
			// $(elem).find('input').focus();
			// clog('did it');
			return;
		}

		// Get "wait" selected
		var waitType = $(elem).attr('data-type');

		var save_text = $.trim($(elem).text());

		// Get delay options (later today, etc.)
		var delay_options = App.Plugins.Minimail.getDelayOptions();
		
		// Get option from delay_options
		var wait = null,
			tmp_delay = null;
		$.each(delay_options,function(i,val){
			
			if(waitType == val.key){
				// using this one
				wait = val.wait;
				// tmp_delay = val;
			}
		});
		if(wait == null){
			// alert('Invalid type used');
			this.close();
			return;
		}

		// Date
		// var arr = this.$("#date").mobiscroll().parseValue(wait);
		// console.log('hello');
		
		// var mobi_inst = $('#date').mobiscroll('getInst');
		var parsedScrollValues = App.Plugins.Minimail.formatDateForScroll(wait);
		this.dateScroll.mobiscroll('setValue',parsedScrollValues,true);

		// Trigger date confirmation
		window.setTimeout(function(){
			that.$('.options').addClass('nodisplay');
			that.$('.choose_datetime').removeClass('nodisplay');
		},300);

		// mobi_inst.val(wait.toString());
		// console.log(1);
		// console.log(mobi_inst.parseValue(wait));

		// time
		// this.$("#time").mobiscroll().time({
		// 	display: 'inline',
		// 	theme: 'wp'
		// });

		// $('#pickadate').click();

		// Save delay
		// - triggers other actions
		// that.save_delay(wait, save_text);

		return false;

	},

	cancel_confirmation: function(ev){
		// Cancelled choosing datetime
		// - return to 
		var that = this,
			elem = ev.currentTarget;

		// Swap classes
		this.$('.options').removeClass('nodisplay');
		this.$('.choose_datetime').addClass('nodisplay');

		return false;
	},

	choose_confirmation: function(ev){
		// Confirmed a delay
		var that = this,
			elem = ev.currentTarget;

		// Get the datetime from the element
		var wait = App.Plugins.Minimail.parseDateFromScroll(that.dateScroll.mobiscroll('getValue'));
		
		// var save_text = wait.toString('ddd, MMM d');
		var save_text = wait.toString('ddd, MMM d') + '<br />' + wait.toString('h:mmtt');

		// Today?
		if(new Date(wait).clearTime().toString() == new Date().clearTime().toString()){
			save_text = 'Today<br />' + wait.toString('h:mmtt');
		}

		// Tomorrow?
		if(new Date(wait).clearTime().toString() == new Date().addDays(1).clearTime().toString()){
			save_text = 'Tomorrow<br />' + wait.toString('h:mmtt');
		}

		// save_text += '<br />' + wait.toString('h:mmtt');

		// save_text += wait.toString(' hmmtt');

		// Save delay
		that.save_delay(wait, save_text.toString());

		return false;

	},

	picked_date: function(ev){
		var that = this;
		var elem = ev.currentTarget;

		// Doesn't get here if date selecting is canceled
		// - no handler for "cancel" needed

		// get wait datetime
		// - convert to a datetime
		var wait = new Date($(elem).val());
		// clog('wait');
		// clog(wait);

		// Save delay
		// - triggers other actions
		that.save_delay(wait, 'The Future');

		return false;
	},

	modify_date: function(ev){
		// trigger by longtap on the element

		// Hide everything else and show the calendar

		// Show the calendar
		// - with default date selected
		$( ".calendar" ).datepicker({
			// defaultDate: 
		});

	},

	save_delay: function(wait, save_text){
		// Save the delay
		// - or return the result to the calling function, if it exists
		var that = this;

		// Check for onComplete function
		if(this.options.onComplete){
			this.options.onComplete(wait,save_text);
		} else {

			// Update view
			$(this.threadView).find('.thread-bg-time p').html(save_text);
			$(this.threadView).addClass('finished');

			// Save delay
			var now_sec = parseInt(new Date().getTime() / 1000);
			var delay_time = wait.getTime() / 1000;

			var delay_seconds = parseInt(delay_time - now_sec);
			var in_seconds = now_sec + delay_seconds;

			App.Plugins.Minimail.saveNewDelay(this.threadid,in_seconds,delay_seconds);
		}

		// Close view
		this.close();

	},

	render: function() {

		// Remove any previous version
		$('#delay_modal').remove();

		// Build from template
		var template = App.Utils.template('t_delay_modal');

		// Get delay options (later today, etc.)
		var delay_options = App.Plugins.Minimail.getDelayOptions();

		// Write HTML
		this.$el.html(template({
			delay_options: delay_options
		}));

		// Date-time scroller/picker
		this.dateScroll = this.$("#date").mobiscroll().datetime({
			display: 'inline',
			theme: 'jqm'
		});

		return this;
	}

});


