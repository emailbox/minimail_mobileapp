Backbone.View.prototype.close = function (notRemove) {
	if (this.beforeClose) {
		this.beforeClose();
	}

	// Empty of HTML content, but don't remove the parent element
	// this.$el.empty();
	if(notRemove){
		// this.remove();
		clog('emptied, not removed');
		this.$el.empty();
	} else {
		this.$el.empty();
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
		// alert('unable to locate body container');
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

		'click .base_header_menu .threads_change a' : 'menu_click',
		'dblclick .base_header_menu .threads_change a' : 'dblmenu_click',
		'click .base_header_menu .dk_options_inner a' : 'sub_menu_click',

		'click .base_header_menu .logo' : 'settings',

		// 'click .base_header_menu a[data-action="compose"]' : 'compose'
	},

	initialize: function() {
		var that = this;
		_.bindAll(this, 'render');

		// Start listening for update events to the counts

		App.Events.on('Main.UpdateCount',this.updateCount, this); // not yet invoked anywhere

	},

	updateCount: function(data){
		// Updates the count for one of the displayed now,due,later
		// console.log('updateCount');
		// Convert types
		if(data.type == 'delayed'){
			data.type = 'now';
		}
		if(data.type == 'later'){
			data.type = 'later';
		}
		if(data.type == 'undecided'){
			data.type = 'dunno';
		}

		// console.log(data);

		if(data.count == 10){
			data.count = "10<sup>+</sup>";
		}

		var $button = this.$('.base_header_menu .threads_change a[data-action="'+data.type+'"]');

		// Remove any previous one
		$button.find('.counter').remove();

		// Create template
		var template = App.Utils.template('t_thread_counter');

		// Add to button
		// console.log('add to button');
		// console.log(data.count);
		// console.log($button);
		$button.append(template({count: data.count}));
		
		return false;

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

		// Custom action for "more" option
		if(id == "more"){
			// Toggle display
			var more_dd = $(elem).parents('.base_header_menu').find('.more-dropdown');
			if(more_dd.hasClass('dk_open')){
				more_dd.removeClass('dk_open');
			} else {
				more_dd.addClass('dk_open');
			}
			return false;
		}

		// Make other buttons inactive
		this.$('.base_header_menu a').removeClass('active');

		// Activate this button
		$(elem).addClass('active');

		// Store scroll position
		this.set_scroll_position();

		// Launch router for undecided, delayed, all, leisure, collections
		Backbone.history.loadUrl(id);

		return false;

	},


	dblmenu_click: function(ev){
		// trying to figure out a "force-refresh" type of approach
		return;

		// var elem = ev.currentTarget;

		// // Get ID of btn
		// var id = $(elem).attr('data-action');

		// // Make other buttons inactive
		// this.$('.base_header_menu button').removeClass('active');

		// // Activate this button
		// $(elem).addClass('active');

		// // Store scroll position
		// this.set_scroll_position();

		// // Launch router for undecided, delayed, all, leisure, collections
		// Backbone.history.loadUrl(id);

		// return false;

	},


	sub_menu_click: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// Get ID of btn
		var id = $(elem).attr('data-action');

		// Hide dropdown
		$(elem).parents('.more-dropdown').removeClass('dk_open');

		// Change active buton (if necessary)
		if(id == 'later' || id == 'now' || id=="waiting_on_me" || id=="waiting_on_other"){
			this.$('.threads_change [data-action]').removeClass('active');
			this.$('.threads_change [data-action="more"]').addClass('active');
		}

		if(id == 'compose'){
			alert('Composing is currently under development');
			return false;
		}

		// Store scroll position
		this.set_scroll_position();

		// Launch router for undecided, delayed, all, leisure, collections
		Backbone.history.loadUrl(id);

		return false;

	},

	settings: function(ev){
		// Launch settings
		// - double-tap on logo
		console.log('settings');

		var that = this,
			elem = ev.currentTarget;

		Backbone.history.loadUrl('settings');

		return false;

	},

	compose: function(ev){
		// // Compose a new email
		// var that = this,
		// 	elem = ev.currentTarget;

		// // Compose a new Email

		// // Hide dropdown
		// $(elem).parents('.more-dropdown').removeClass('dk_open');

		// alert('Composing is currently under development');
		// return false;

		// // Store scroll position
		// this.set_scroll_position();

		// // Launch router for undecided, delayed, all, leisure, collections
		// Backbone.history.loadUrl('compose');

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

		// Load the /Undecided/Dunno/New View
		// Backbone.history.loadUrl('undecided');
		var doclick = 'inbox_normal';
		this.$('.base_header_menu a[data-action="'+doclick+'"]').addClass('active');
		Backbone.history.loadUrl(doclick);
		// this.$('.base_header_menu button[data-action="'+doclick+'"]').trigger('touchend');


		// Launch startup tutorial if necessary

		// Update startup tutorial settings
		var latest_tut_num = 3;
		App.Utils.Storage.get('startup_tutorial','critical')
			.then(function(tut_num){
				if(tut_num != latest_tut_num){
					// Not created, show screen

					var startup_tut = new App.Views.StartupTutorial();
					startup_tut.render();

					// Save as viewed
					App.Utils.Storage.set('startup_tutorial',latest_tut_num,'critical');
					
				}

			});

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


App.Views.CommonThread = Backbone.View.extend({
	
	className: 'common_thread_view is-loading',

	events: {
		'click .btn[data-action="back"]' : 'go_back',
		'click .btn[data-action="delay"]' : 'click_delay',
		'click .btn[data-action="done"]' : 'click_done',
		'click .btn[data-action="pin"]' : 'click_pin',

		'click .btn[data-action="leisure"]' : 'click_leisure',

		'click .btn[data-action="more"]' : 'toggle_all',

		'click .btn-reply' : 'reply',
		'click .forward' : 'forward',

		'click .email_holder .html_view' : 'html_view',
		// 'shorttap .email_holder .details' : 'hidden_options', //'collapse_email',
		'click .email_holder .details' : 'hidden_options',
		'click .email_holder .hidden_options .option.hidden_attachments' : 'hidden_attachments',
		'click .email_holder .hidden_options .option.hidden_contact' : 'hidden_contact',
		'click .email_holder .hidden_options .option.hidden_embeds' : 'hidden_embeds',

		'click .email_holder .hidden_options .attachment' : 'view_attachment',

		'click .email_holder .collapse_email' : 'collapse_email',
		'click .email_holder .collapse_emails' : 'collapse_emails',
		'click .email_holder .email_body .ParsedDataShowAll span.expander' : 'email_folding',
		'click .email_holder .email_body .ParsedDataShowAll span.edit' : 'edit_email',

		'click .email_holder .link_name' : 'toggle_link_embed',
		'click .email_holder .link_options button[data-action]' : 'link_action',

		'click .note_content' : 'edit_note',
		'click .more-thread-dropdown a[data-action="note"]' : 'edit_note',

		'click .more-thread-dropdown a[data-action="waiting_on_me"]' : 'waiting_on_me',
		'click .more-thread-dropdown a[data-action="waiting_on_other"]' : 'waiting_on_other'

	},

	initialize: function(options) {
		_.bindAll(this, 'render');
		_.bindAll(this, 'render_thread');
		_.bindAll(this, 'email_sent');
		_.bindAll(this, 'go_back');
		_.bindAll(this, 'hidden_contact_render_contact');
		_.bindAll(this, 'hidden_contact_render_loading');
		_.bindAll(this, 'hidden_contact_render_error');

		// _.bindAll(this, 'refresh_and_render_thread');
		var that = this;
		// this.el = this.options.el;

		// Get any local information we have
		// After getting local info, and if we have enough, show the thing
		// Get remote info, merge with Local when it arrives

		// Get the Thread

		// Render the information we have on this Thread
		this.threadid = this.options.threadid

		// // build the data
		// var data = {
		// 	Thread: App.Data.Store.Thread[this.threadid],
		// 	Email: _.filter( App.Data.Store.Email,function(email){
		// 			if(email.attributes.thread_id == that.threadid) return true;
		// 		})
		// };

		// // Sort Email
		// data.Email = App.Utils.sortBy({
		// 	arr: data.Email,
		// 	path: 'common.date_sec',
		// 	direction: 'asc',
		// 	type: 'num'

		// });

		// Get Full Thread
		this.threadFull = new App.Models.ThreadFull({
			_id: this.options.threadid
		});

		// Checking if the Thread is ready to be displayed
		// - seeing if it actually should be displayed too
		this.threadFull.on('check_display_ready', function(){

			// Must have Full ready
			if(!that.threadFull.FullReady || !that.threadFull.EmailReady){
				// console.warn('thread.check_display_ready = not ready');
				return;
			}
			// Already rendered this Thread?
			if(that.threadFull.Rendered){
				// Show the change in the view
				console.warn('Already rendered (need to change the view!)');
				return;
			}
			that.threadFull.Rendered = true;

			// Render the view!
			that.render_thread();

		}, this);

		// Listen for "change" event
		this.threadFull.on('change', function(threadFull){
			// Mark thread as ready
			// - this fires immediately if anything is cached
			// - otherwise it fires if something is different from the cached version
			if(!that.threadFull.FullReady){
				that.threadFull.FullReady = true;
				that.threadFull.trigger('check_display_ready');
			}
		}, this);

		this.threadFull.fetchFull();

		// Emails for Thread
		// - we want to know after all the emails have been loaded for the Thread
		this.threadEmails = new App.Collections.EmailsFull();

		this.threadEmails.on('reset', function(){
			// never fires, what the fuck!!!!
			console.log('reset, NEVER FUCKING FIRES');
			if(!that.threadFull.EmailReady){
				that.threadFull.EmailReady = true;
				that.threadFull.trigger('check_display_ready');
			}
		}, this); // completely changed collection (triggers add/remove)

		this.threadEmails.on('sync', function(threadFull){
			// Fires after add/remove have completed?
			// console.info('EmailSync');
			if(this.threadEmails.length && !that.threadFull.EmailReady){
				that.threadFull.EmailReady = true;
				that.threadFull.trigger('check_display_ready');
			}
		}, this); // completely changed collection (triggers add/remove)

		this.threadEmails.on('add', function(emailFullModel){
			// Got a new email while the view is displayd, probably want to show a "display new email" type of popup (like gmail)
			// console.log('EmailAdd');
			// console.log(emailFullModel.toJSON()._id);
		}, this); // added a new EmailFull
		
		this.threadEmails.on('change', function(emailFullModel){
			console.log('EmailChange');
		}, this); // an email is slightly different now (re-render)
		
		// trigger EmailFull collection retrieving
		this.threadEmails.fetch_by_thread_id({
			ids: [this.options.threadid],
			cachePrefix: this.options.threadid
		});

		// // Event bindings
		// // - also bound at the top of initialize
		App.Events.bind('email_sent',this.email_sent);
		// App.Events.bind('thread_updated',this.refresh_and_render_thread);

		// Mark as recently viewed
		App.Plugins.Minimail.add_to_recently_viewed(this.options.threadid);

	},


	beforeClose: function(){
		// unbind events manually
		var that = this;
		
		App.Events.off('email_sent',this.email_sent);
		App.Events.off('thread_updated',this.refresh_and_render_thread);

		App.Utils.BackButton.debubble(this.backbuttonBind);

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
		this.$el.empty();
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
			threadid: that.threadid,
			onComplete: that.after_delay_modal
		});
		$('body').append(subView.$el);
		subView.render();

		return false;


	},

	after_delay_model: function(wait, wait_text){
		// After delaying
		// - emit an event

		alert('after');

		// Trigger local event
		App.Events.trigger('Thread.delay', that.threadid, wait, wait_text);

		return;
	},

	click_done: function(ev){
		// Clicked the "done" (checkmark) button
		var that = this;

		// Mark as Done
		App.Plugins.Minimail.saveAsDone(that.threadid);

		// Trigger local event
		App.Events.trigger('Thread.done', that.threadid);

		var tmpThreadFull = this.threadFull.toJSON();

		// Remove labels (WaitingOnMe and WaitingOnOther) from page
		this.$('.special_labels [data-label="WaitingOnMe"]').remove();
		this.$('.special_labels [data-label="WaitingOnOther"]').remove();

		// Remove div.special_labels if this was the last "special" label
		if(this.$('.special_labels > div').length < 1){
			this.$('.special_labels').remove();
		}

		// Combine to new labels (removing this entry)
		var new_labels = $.extend([],tmpThreadFull.attributes.labels);
		new_labels = _.without(new_labels,'WaitingOnOther','WaitingOnMe');

		this.threadFull.set('attributes.labels', new_labels);

		// Emit an event that alters the Thread by labeling it
		Api.event({
			data: {
				event: 'Thread.action',
				obj: {
					'_id' : this.threadid,
					'action' : 'unlabel',
					'label' : 'WaitingOnMe'
				}
			},
			success: function(resp){

			}
		});
		Api.event({
			data: {
				event: 'Thread.action',
				obj: {
					'_id' : this.threadid,
					'action' : 'unlabel',
					'label' : 'WaitingOnOther'
				}
			},
			success: function(resp){

			}
		});

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

	toggle_all: function(ev){
		// Show/hide options for all
		var that = this,
			elem = ev.currentTarget;

		var $parent = this.$('.more-thread-dropdown');

		if($parent.hasClass('dk_open')){
			$parent.removeClass('dk_open');
		} else {
			$parent.addClass('dk_open');
		}

		return false;

	},

	edit_note: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// Edit a note (or create it if it exists)

		// Editing from a popup or from the existing note? (by tapping it)

		// close popup, just in case
		this.$('.more-thread-dropdown').removeClass('dk_open');

		// Get existing
		var note = this.threadFull.toJSON().app.AppPkgDevMinimail.note;
		if(note == undefined){
			note = "";
		}

		if($(elem).hasClass('note_content')){
			
		} else {
			// Clicked popup from menu
			// - hide the menu
			this.$('.more-thread-dropdown').removeClass('dk_open');
		}

		// Get new Note
		var new_note = prompt("Note",note);
		if(new_note == null){
			// canceled
			return false;
		}
		new_note = $.trim(new_note);
		if(new_note == note){
			App.Utils.Notification.toast('Note not changed');
		} else {
			App.Utils.Notification.toast('Note Updated');

			if(new_note.length < 1){
				var yeah = confirm("Erase the note?");
				if(!yeah){
					// Not trying to erase this fucker
					return false;
				}
			}

			// Write content to page
			this.$('.note').empty();
			if(new_note.length > 0){
				var template = App.Utils.template('t_common_thread_note_content');
				this.$('.note').html(template({note: new_note}));
			}

			// Update local version too
			this.threadFull.set('app.AppPkgDevMinimail.note', new_note); // this doesn't fucking work AT ALL

			// Do Update method
			Api.update({
				data: {
					model: 'Thread',
					id: this.threadid,
					paths: {
						'$set' : {
							'app.AppPkgDevMinimail.note' : new_note
						}
					}
				},
				success: function(resp){
					// hope this worked
				}
			});

		}

		return false;

	},

	waiting_on_other: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// basically all this stuff is duplicated in this.waiting_on_other

		// Mark as waiting_on_me
		// - applies a label
		// - marks as Not Done (done=0)

		// Editing from a popup or from the existing note? (by tapping it)

		// close popup, just in case
		this.$('.more-thread-dropdown').removeClass('dk_open');

		// Currently waiting on me?
		var tmpThreadFull = this.threadFull.toJSON();
		if(tmpThreadFull.attributes.labels['WaitingOnOther']){
			// Getting rid of it
			// - doesn't auto-click done though!
			// - Done autoremoves WaitingOnMe though! 
			
			// Remove label from page
			this.$('.special_labels [data-label="WaitingOnOther"]').remove();

			// Remove div.special_labels if this was the last "special" label
			if(this.$('.special_labels > div').length < 1){
				this.$('.special_labels').remove();
			}

			// Combine to new labels (removing this entry)
			var new_labels = $.extend([],tmpThreadFull.attributes.labels);
			new_labels = _.without(new_labels,'WaitingOnOther');

			this.threadFull.set('attributes.labels', new_labels);

			// Emit an event that alters the Thread by labeling it
			Api.event({
				data: {
					event: 'Thread.action',
					obj: {
						'_id' : this.threadid,
						'action' : 'unlabel',
						'label' : 'WaitingOnOther'
					}
				},
				success: function(resp){

				}
			});

		} else {
			// Adding the WaitingOnMe label
			// - auto-removes Done

			// Add the label to the page too
			// - it would be nice if it just auto-did this (the whole point of Backbone is getting this working correctly, right?)
			
			// Write content to page
			if(this.$('.special_labels').length < 1){
				// Create div.special_labels
				this.$('.thread_labels').prepend('<div class="special_labels"></div>');
			}

			// Add to special_labels
			var template = App.Utils.template('t_common_thread_label');
			this.$('.special_labels').append(template({
				label: 'WaitingOnOther',
				text: "Waiting On <strong>Other</strong>"
			}));

			// Update "done" button to be in-active
			this.$('.btn[data-action="done"]').removeClass('active');

			// Update local version too
			// - this doesn't fucking work AT ALL (right?)
			this.threadFull.set('app.AppPkgDevMinimail.done', 0);

			// Combine to new labels
			var new_labels = $.extend([],tmpThreadFull.attributes.labels);
			new_labels.push('WaitingOnOther');
			new_labels = _.uniq(new_labels);

			this.threadFull.set('attributes.labels', new_labels);

			// Also emit an event that alters the Thread by labeling it
			Api.event({
				data: {
					event: 'Thread.action',
					obj: {
						'_id' : this.threadid,
						'action' : 'label',
						'label' : 'WaitingOnOther'
					}
				},
				success: function(resp){

				}
			});

			// And archive it (out of the inbox)
			Api.event({
				data: {
					event: 'Thread.action',
					obj: {
						'_id' : this.threadid,
						'action' : 'archive'
					}
				},
				success: function(resp){

				}
			});

		}

		return false;

	},

	waiting_on_me: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// basically all this stuff is duplicated in this.waiting_on_other

		// Mark as waiting_on_me
		// - applies a label
		// - marks as Not Done (done=0)

		// Editing from a popup or from the existing note? (by tapping it)

		// close popup, just in case
		this.$('.more-thread-dropdown').removeClass('dk_open');

		// Currently waiting on me?
		var tmpThreadFull = this.threadFull.toJSON();
		if(tmpThreadFull.attributes.labels['WaitingOnMe']){
			// Getting rid of it
			// - doesn't auto-click done though!
			// - Done autoremoves WaitingOnMe though! 
			
			// Remove label from page
			this.$('.special_labels [data-label="WaitingOnMe"]').remove();

			// Remove div.special_labels if this was the last "special" label
			if(this.$('.special_labels > div').length < 1){
				this.$('.special_labels').remove();
			}

			// Combine to new labels (removing this entry)
			var new_labels = $.extend([],tmpThreadFull.attributes.labels);
			new_labels = _.without(new_labels,'WaitingOnMe');

			this.threadFull.set('attributes.labels', new_labels);

			// Emit an event that alters the Thread by labeling it
			Api.event({
				data: {
					event: 'Thread.action',
					obj: {
						'_id' : this.threadid,
						'action' : 'unlabel',
						'label' : 'WaitingOnMe'
					}
				},
				success: function(resp){

				}
			});

		} else {
			// Adding the WaitingOnMe label
			// - auto-removes Done

			// Add the label to the page too
			// - it would be nice if it just auto-did this (the whole point of Backbone is getting this working correctly, right?)
			
			// Write content to page
			if(this.$('.special_labels').length < 1){
				// Create div.special_labels
				this.$('.thread_labels').prepend('<div class="special_labels"></div>');
			}

			// Add to special_labels
			var template = App.Utils.template('t_common_thread_label');
			this.$('.special_labels').append(template({
				label: 'WaitingOnMe',
				text: "Waiting On <strong>Me</strong>"
			}));

			// Update "done" button to be in-active
			this.$('.btn[data-action="done"]').removeClass('active');

			// Update local version too
			// - this doesn't fucking work AT ALL (right?)
			this.threadFull.set('app.AppPkgDevMinimail.done', 0);

			// Combine to new labels
			var new_labels = $.extend([],tmpThreadFull.attributes.labels);
			new_labels.push('WaitingOnMe');
			new_labels = _.uniq(new_labels);

			this.threadFull.set('attributes.labels', new_labels);

			// Do Update method
			Api.update({
				data: {
					model: 'Thread',
					id: this.threadid,
					paths: {
						'$set' : {
							'app.AppPkgDevMinimail.done' : 0
						}
					}
				},
				success: function(resp){
					// hope this worked
				}
			});

			// Also emit an event that alters the Thread by labeling it
			Api.event({
				data: {
					event: 'Thread.action',
					obj: {
						'_id' : this.threadid,
						'action' : 'label',
						'label' : 'WaitingOnMe'
					}
				},
				success: function(resp){

				}
			});

			// And archive it (out of the inbox)
			Api.event({
				data: {
					event: 'Thread.action',
					obj: {
						'_id' : this.threadid,
						'action' : 'archive'
					}
				},
				success: function(resp){

				}
			});

		}



		return false;

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

		var data = {
			Thread: that.threadFull.toJSON(),
			Email: that.threadEmails.toJSON()
		};

		that.subViewReply = new App.Views.CommonReply({
			threadid: this.threadid,
			ThreadModel: that.threadFull,
			EmailModels: that.threadEmails
		});

		// Add to window and render
		$('body').append(that.subViewReply.$el);
		// that.subViewReply.render(); // necessary? (no)

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
		var elem = ev.currentTarget,
			that = this;

		var content_holder = $(elem).parents('.email_body');
		//var count = $(content_holder).find('.ParsedDataContent').length;

		// console.log(this.threadEmails);

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

		return false;

	},

	hidden_options: function(ev){
		// Show/hide hidden_options
		var that = this,
			elem = ev.currentTarget;

		ev.preventDefault();
		ev.stopPropagation();

		// Already hidden?
		var $holder = $(elem).parents('.email_holder');
		if($holder.hasClass('collapsing_bodies')){
			// Show this guy
			$holder.removeClass('collapsing_bodies');
			return false;
		}


		var $email = $(elem).parents('.email');

		if($email.hasClass('showing_hidden_options')){
			// Hide this one
			$email.removeClass('showing_hidden_options');
		} else {
			// Show this one
			$email.addClass('showing_hidden_options');

		}

		return false;

	},

	hidden_attachments: function(ev){
		var that = this,
			elem = ev.currentTarget;

		var $list = $(elem).next();
		if(!$list.hasClass('list_attachments')){
			return;
		}

		if($list.hasClass('nodisplay')){
			$list.removeClass('nodisplay');
		} else {
			$list.addClass('nodisplay');
		}

		return false;
	},

	hidden_contact: function(ev){
		var that = this,
			elem = ev.currentTarget;

		var $list = $(elem).next();
		if(!$list.hasClass('list_contact')){
			return;
		}

		if($list.hasClass('nodisplay')){
			$list.removeClass('nodisplay');
		} else {
			$list.addClass('nodisplay');
		}

		// Get email
		var email = $(elem).attr('data-email');
		console.log('Contact Email: ' + email);

		// Load the user's info (if not already stored locally)
		App.Utils.Storage.get(email, 'fullcontact_emails')
			.then(function(result){
				if(result){
					if(result == "fetching"){
						// Already fetching!
						// - just continue waiting?
						console.log('already fetching');
						that.hidden_contact_render_loading();
						// App.Utils.Storage.set(email, false, 'fullcontact_emails');

					} else {
						// Already have the data, render it
						that.hidden_contact_render_contact(result);

					}
				} else {
					// Query for fullcontact data
					App.Utils.Storage.set(email, false, 'fullcontact_emails');

					// Render loading
					that.hidden_contact_render_loading();

					// Create event data and emit event against API
					var eventData = {
						event: 'Minimail.fullcontact',
						obj: {
							email: email
						}
					};
					console.log('Contact eventData');
					console.log(eventData);
					Api.event({
						data: eventData,
						response: {
							"pkg.dev.minimail" : function(response){
								if(response.body.code == 200 && response.body.fullcontact_data.status == 200){
									// Got contact data ok
									// - set storage value
									App.Utils.Storage.set(email, response.body.fullcontact_data, 'fullcontact_emails');
									that.hidden_contact_render_contact(response.body.fullcontact_data);
								} else {
									// Failed somehow
									// App.Utils.Storage.set(email, response.body.fullcontact_data, 'fullcontact_emails');
									that.hidden_contact_render_error();
								}
							}
						}
					});

				}
			});

		return false;
	},

	hidden_contact_render_contact: function(fullcontact_data){
		// Accepts fullcontact_data and writes a template

		// Remove any existing one (or the loader)
		this.$('.list_contact .loading_contact_data').remove();
		this.$('.list_contact .loaded_fullcontact').remove();

		// Create template
		var template = App.Utils.template('t_contact_fullcontact');

		// Append to list_contact (inside)
		this.$('.list_contact').append(template(fullcontact_data));

	},

	hidden_contact_render_loading: function(){
		// Accepts fullcontact_data and writes a template

		// Remove any existing one (or the loader)
		this.$('.list_contact .loading_contact_data').remove();
		this.$('.list_contact .loaded_fullcontact').remove();

		// Create template
		var template = App.Utils.template('t_contact_fullcontact_loading');

		// Append to list_contact (inside)
		this.$('.list_contact').append(template());

	},

	hidden_contact_render_error: function(){
		// Accepts fullcontact_data and writes a template

		// Remove any existing one (or the loader)
		this.$('.list_contact .loading_contact_data').remove();
		this.$('.list_contact .loaded_fullcontact').remove();

		// Create template
		var template = App.Utils.template('t_contact_fullcontact_error');

		// Append to list_contact (inside)
		this.$('.list_contact').append(template());

	},

	hidden_embeds: function(ev){
		var that = this,
			elem = ev.currentTarget;

		var $list = $(elem).next();
		if(!$list.hasClass('list_embeds')){
			return;
		}

		if($list.hasClass('nodisplay')){
			$list.removeClass('nodisplay');
		} else {
			$list.addClass('nodisplay');
		}

		return false;
	},

	toggle_link_embed: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// Display an embedded link using embed.ly

		// Get link URL via data attribute (data-link)
		var link_url = $(elem).attr('data-link');

		var embed_content = $(elem).parent().find('.embed_stuff'),
			link_details = $(elem).parent().find('.link_details');

		if(link_details.hasClass('nodisplay')){
			link_details.removeClass('nodisplay');
		} else {
			link_details.addClass('nodisplay');
		}

		return false;

	},

	link_action: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// Takes an action on a passed link
		// - embed (embedly)
		// - visit
		// - copy
		// - save (filepicker)

		var action = $(elem).attr('data-action');
			link_url = $(elem).parents('.info[data-link]').attr('data-link');

		switch(action){
			case 'embed':
				// Show embedly info

				var embed_content = $(elem).parents('.link_details').find('.embed_stuff');
				embed_content.removeClass('nodisplay');

				// mark as fetched
				// - not really fetched yet, but that is ok
				if($(elem).hasClass('fetched')){
					return false;
				}
				$(elem).addClass('fetched');
				
				// Run embedly getter
				$.embedly.oembed(link_url, {query: {maxwidth: App.Data.xy.win_width - 30} })
					.done(function(results){
						if(results.length != 1){
							console.error('uh oh, failed embedding');
							embed_content.html('<i>Unable to embed, try Visit</i>');
							return;
						}
						if(results[0].html == undefined || results[0].html.length == 0){
							console.info('No HTML to embed');
							embed_content.html('<i>Nothing to embed, try Visit</i>');
							return;
						}

						// Embed HTML
						embed_content.html(results[0].html);
					});

				break;
			case 'visit':
				// launch a new window with the link
				if(usePg){
					navigator.app.loadUrl(link_url, { openExternal:true });
				} else {
					window.open(link_url);
				}
				break;
			case 'copy':
				alert('copy disabled');
				break;
			case 'save':
				alert('saving disabled, but it will be fun');
				break;
			default:
				break;
		}

		return false;

	},

	view_attachment: function(ev){
		// Show an attachment
		// - different saving options?
		// - filepicker.io!

		// Shows the view for the attachment
		var that = this;
		var elem = ev.currentTarget;

		// Get url path to attachment
		var url_path = $(elem).attr('data-path');

		if(url_path.length < 1){
			alert('Sorry, attachment cannot be downloaded');
			return false;
		}

		// Open attachment in new View
		// - subView
		navigator.app.loadUrl(url_path, { openExternal:true });

		// App.Utils.Notification.toast('Loading in ChildBrowser (should load in a new View, with options for )');
		// if(usePg){
		// 	window.plugins.childBrowser.showWebPage(path,{
		// 		showLocationBar: false,
		// 		showAddress: false,
		// 		showNavigationBar: false
		// 	});
		// }
		// window.open(App.Credentials.s3_bucket + path);
		return false;

	},

	collapse_email: function(ev){
		// Collapse/show only this email
		var that = this,
			elem = ev.currentTarget;

		var $holder = $(elem).parents('.email_holder');

		if($holder.hasClass('collapsing_bodies')){
			// Show this one
			$holder.removeClass('collapsing_bodies');
		} else {
			// Hide this one
			$holder.addClass('collapsing_bodies');
		}

		ev.preventDefault();
		ev.stopPropagation();
		return false;

	},

	collapse_emails: function(ev){
		// Collapse/show all threads the OPPOSITE of whatever this one is
		var that = this,
			elem = ev.currentTarget;

		var $holder = $(elem).parents('.email_holder');

		// Switch everything excepe the last email to hidden
		// - also changing this one
		// - keeps the last one open, always
		
		// Hide all
		that.$('.email_holder').addClass('collapsing_bodies');

		// Show the last one
		var $last = that.$('.email_holder:last-child');
		$last.removeClass('collapsing_bodies');

		ev.preventDefault();
		ev.stopPropagation();
		return false;

	},


	html_view: function(ev){
		// Render a pretty HTML view
		// - break it out into a beautiful view (not crammed in)

		var that = this,
			elem = ev.currentTarget;

		// Get correct threadEmail
		var $parentEmail = $(elem).parents('.email');
			threadId = $parentEmail.attr('data-id');

		var email = this.threadEmails.get(threadId);
		
		var tmpHtml = email.toJSON().original.HtmlBodyOriginal;

		function stripScripts(s) {
			var div = document.createElement('div');
			div.innerHTML = s;
			var scripts = div.getElementsByTagName('script');
			var i = scripts.length;
			while (i--) {
				scripts[i].parentNode.removeChild(scripts[i]);
			}
			return div.innerHTML;
		}

		tmpHtml = stripScripts(tmpHtml);

		// Display HtmlEmail Subview
		var subView = new App.Views.HtmlEmail({
			html: tmpHtml
		});
		$('body').append(subView.$el);
		subView.render();


		// $('body').append('<div id="fucker" class=""></div>');
		// $("#fucker").html(tmpHtml);

		// // var allowTaint = confirm('Allow images?');
		// var allowTaint = true;

		// html2canvas($("#fucker"), {
		// 	logging: true,
		// 	width: 800,
		// 	allowTaint: allowTaint,
		// 	letterRendering: true,
		// 	timeout: 5000,
		// 	useCORS: true,
		// 	onrendered: function(canvas) {
		// 		console.info('onrendered');
		// 		// canvas is the final rendered <canvas> element
		// 		$parentEmail.find('.email_body').addClass('nodisplay');
		// 		$parentEmail.find('.details').after(canvas);
		// 		$('#fucker').remove();
		// 	}
		// });
	
		ev.preventDefault();
		ev.stopPropagation();
		return false;
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

	render_thread: function(){
		var that = this;

		this._rendered = true;
		this.$el.removeClass('is-loading');

		console.log('rendering Thread');

		// Template
		var template = App.Utils.template('t_common_thread_view');

		// build the data
		// console.log(this.threadEmails.toJSON());
		var data = {
			ignored_labels: ["WaitingOnMe","WaitingOnOther","Inbox","Important","\\\\Sent","Sent"],
			special_labels_exist: false,
			Thread: that.threadFull.toJSON(),
			Email: that.threadEmails.toJSON()
		};

		// Get special_labels
		// - easier than doing it in the template
		var special_labels = ['Important','WaitingOnMe','WaitingOnOther'];
		_.each(special_labels,function(label_value){
			if(data.Thread.attributes.labels[label_value]){
				data.special_labels_exist = true;
			}
		});
		console.log(data);

		// // Sort Email (already sorted?)
		// data.Email = App.Utils.sortBy({
		// 	arr: data.Email,
		// 	path: 'common.date_sec',
		// 	direction: 'asc',
		// 	type: 'num'

		// });

		// Run MathJax code
		// MathJax.Hub.Queue(["Typeset",MathJax.Hub,"threadContainer"]);

		// Slightly parse Emails for:

		// Links we want to embed
		// - gists: <script src="https://gist.github.com/nicholasareed/5177795.js"></script>
		// - youtube

		// Signatures we want to remove
		// - todo: save them

		var line_strip_from_front = [
			'&gt; '
		];

		var bad_start_with = [
			'Sent from my '
		];

		var bad_equal = [
			'-- '
		];

		var bad_equal_after_trim = [
			'Sent from my iPhone',
			'--'
		];


		var color_presets = [
			'email1',
			'email2',
			'email3',
			'email4'

		];
		var current_color = 0;
		var email_to_color = {}; // for consistent coloring

		// Randomize the list of colors
		// color_presets = _.shuffle(color_presets);
		// - just offset the current_color based on a consistent parameter (the first letter of the first senders name)
		// - stays the same for a day
		var alphabet = 'abcdefghijklmnopqrstuvwxyz';
		var day = new Date().toString('d');
		current_color = alphabet.indexOf(data.Email[0].original.headers.From_Parsed[0][1][0]) + day;

		// Iterate through Emails
		_.each(data.Email, function(email, i){

			// Get sender, color according to a random scale? 
			// - have a few preset colors, think max 10 people in a conversation?
			
			try {

				var tmp_isme = false;
				_.each(App.Data.UserEmailAccounts.toJSON(),function(acct, l){
					if(acct.email == email.original.headers.From_Parsed[0][1]){
						tmp_isme = true;
					}
				});

				if(tmp_isme){
					data.Email[i].data_color = 'my_email';;
				} else {

					if(email_to_color[ email.original.headers.From_Parsed[0][0] ] != undefined){
						// already set for this email address
						data.Email[i].data_color = email_to_color[ email.original.headers.From_Parsed[0][0] ];
					} else {
						// Need to set a color for this email
						var tmp_val = 0;
						var color_position = (current_color + color_presets.length) % color_presets.length;
						color_presets[ color_position  ]
						var use_color = color_presets[ color_position  ];
						email_to_color[ email.original.headers.From_Parsed[0][0] ] = use_color;
						// console.log(use_color);
						data.Email[i].data_color = use_color;
						current_color++;
					}
				}

			} catch(err){
				console.error('view e1');
				console.error(err);
				data.Email[i].data_color = '#6a6a6a';
			}

			// Signatures
			var first_parsed = email.original.ParsedData[0];
			var tmp_lines = first_parsed.Data.split('\n');
			
			// Iterate over lines
			var lines = [];
			var signature = [];
			// var linenum = 1;
			var now_hiding_lines = false;
			_.each(tmp_lines, function(line, index, somethingelse){
				// see if it contains a "signature" type of line
				// - remove all the ones below it if it does

				// Check half the lines, up to the last 10
				var check_lines = false;
				var skip_this_line = false;
				if(tmp_lines.length > 20){
					// check the last 10
					if(index + 10 > tmp_lines.length){
						check_lines = true;
					}
				} else {
					// check half, but at least 2
					var half = parseInt(tmp_lines.length / 2);
					if(half < 2){
						half = 2;
					}
					if(index + half > tmp_lines.length){
						check_lines = true;
					}
				}

				if(check_lines){
					// Within 10
					// - run checks
					var tripped = false;
					_.each(bad_start_with,function(elem){
						if(line.substr(0,elem.length).toLowerCase() == elem.toLowerCase()){
							tripped = true;
						}
					});

					_.each(bad_equal,function(elem){
						if(line.toLowerCase() == elem.toLowerCase()){
							tripped = true;
						}
					});

					_.each(bad_equal_after_trim,function(elem){
						if($.trim(line.toLowerCase()) == elem.toLowerCase()){
							tripped = true;
						}
					});

					if(tripped){
						now_hiding_lines = true;
					}
				}

				// if(skip_this_line){
				// 	return;
				// }

				if(now_hiding_lines){
					signature.push(line);
					return;
				}

				// Keep adding to lines
				lines.push(line);

			});
	
			if(signature.length > 0){
				first_parsed.Body = $.trim(lines.join('\n'));
				first_parsed.Signature = $.trim(signature.join('\n'));


				email.original.ParsedData[0] = first_parsed;
			}


			// Links
			try {
				// Iterate over links
				// - embed below
				_.each(email.app.AppPkgDevMinimail.links, function(link, i){
					// GitHub gists
					console.log(link);
					if(link.indexOf("ignoring_https://gist.github.com/") != -1){
						// Gist is in here
						// - add template
						// console.log('found github gist');
						// var tmp_template = App.Utils.template('t_embed_github_gist');

						// var script = document.createElement('script');
						// script.type = 'text/javascript';
						// // script.async = true;
						// // script.onload = function(){
						// // 	// remote script has loaded
						// // };
						// script.src = link + '.js';
						// that.$('.email[data-id="'+email._id+'"] .email_body').append(script);

						// Get gist_id
						// alert('gist');
						var tmp_link = link.split('/');
						// console.info(tmp_link);
						var gist_id = tmp_link[4];

						// var iframe = document.createElement('iframe');
						// iframe.src = 'http://urlspoiler.heroku.com/gists?id=' + gist_id;
						// iframe.width = "300px";
						// iframe.height = "200px";
						// iframe.setAttribute('style', "border:none;");
						// that.$('.email[data-id="'+email._id+'"] .email_body').append( iframe );

						$.get('https://api.github.com/gists/' + gist_id, function(data){
							// $('body').append($(data));
							// alert('back');
							// console.log('should be rendering');
							// console.log(data);
							// var j = JSON.parse(data);
							var j = data;
							// console.log(data);
							// console.log(JSON.stringify(j.files));
							// console.log(j.files);

							// console.log('files');
							_.each(j.files, function(elem, i){
								// console.log('file');
								// console.log(elem.content);
								that.$('.email[data-id="'+email._id+'"] .email_body').append( '<pre><strong>'+elem.filename+'</strong><br /><br />' + App.Utils.nl2br(elem.content) + '</pre>');
							});
							// that.$('.email[data-id="'+email._id+'"] .email_body').append($(data));
						});
						
						console.log(email._id);
						// that.$('.email[data-id="'+email._id+'"] .email_body').remove();
						// that.$('.email[data-id="'+email._id+'"] .email_body').after(tmp_template(link));
					}
				});
			} catch(e){
				console.warn('error');
				console.error(e);
			}
		});
	
		// Write HTML
		console.log(data);
		this.$el.html(template(data));

		// Custom tap
		// App.Utils.WatchCustomTap(that.$('.email_holder .details'));

		// Resize body_container
		this.resize_fluid_page_elements();
		this.resize_scroller();

		return this;
		
	},

	render: function() {
		var that = this;

		// Render structure if not already rendered Thread and Emails
		if(!this._rendered){
			// Render loading

			// Template
			var template = App.Utils.template('t_common_thread_view_loading');

			// Write HTML
			this.$el.html(template());

		}

		// Bind to backbutton
		this.backbuttonBind = App.Utils.BackButton.newEnforcer(this.go_back);

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

		alert('broken!!!');

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
		// regex_value = regex_value.replace(/[#-}]/g, '\\$&'); // escape regex characters from search string: http://stackoverflow.com/questions/6300183/sanitize-string-of-regex-characters-before-regexp-build

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
		console.log(
			{
				"name": Name,
					"filters": [{
						"type": "keyregex1",
						"key": regex_key,
						"regex": "("+regex_value+")",
						"modifiers": "ig"
					}]
			});

		// return false;

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
		App.Plugins.Minimail.saveAsDone(that.threadid, true);

		// Remove WaitinOn... links

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
		'click .btn[data-action="menu"]' : 'toggle_menu',
		'click .btn[data-action="cancel"]' : 'cancel',
		'click .btn[data-action="send"]' : 'send',

		// drawing
		'click .common_drawing .btn-group .group-tab-option' : 'change_btn_group',
		'click .common_drawing a[data-size], a[data-color]' : 'switch_active_size_or_color',
		'click .common_drawing .btn-save' : 'save_drawing',

		'click .btn[data-action="contacts"]' : 'contact',
		'click .addresses .choose_type button' : 'switch_addresses',

		'click .remove_address' : 'remove_address',
		'click .show_all_addresses' : 'show_all_addresses',

		'click .address_list .add .closeButton' : 'close_dropdown',
		'click .address_list .add .openButton' : 'quick_add_address',
		'click .address_list .add .addEmail' : 'quick_add_email',
		'click .quick_contacts .btn-toolbar a' : 'tab_clicked',
		'click .addresses .contact' : 'chose_contact',

		'click .add_attachment' : 'add_attachment',
		'click .file_attachment' : 'remove_attachment',
		'click .add_photo' : 'add_photo',

		'click .compose-exit-minimal span' : 'leave_minimal_view'

	},

	ev: _.extend({}, Backbone.Events),

	disable_buttons: false,

	initialize: function(options) {
		var that = this;
		_.bindAll(this, 'render');
		// _.bindAll(this, 'send');
		_.bindAll(this, 'beforeClose');
		_.bindAll(this, 'cancel');
		// _.bindAll(this, 'change_input_add_contact');
		_.bindAll(this, 'checking_autocomplete');
		
		// this.el = this.options.el;

		// Are the models already set?
		// - expecting them to be, should have a fallback for if they are not set

		// Load contacts if not loaded
		if(App.Data.Store.Contacts.length < 1){
			App.Data.Store.Contacts = new App.Collections.Contacts();
			App.Data.Store.Contacts.fetch();
		}

		if(!this.options.ThreadModel || !this.options.EmailModels){
			// Not set
			// - handle this later
			// - render a "getting data" view

			// Render loading
			alert('we are not using this!!');
			this.render_init();

			// Get Full Thread
			this.threadFull = new App.Models.ThreadFull({
				_id: this.options.threadid
			});

			// Checking if the Thread is ready to be displayed
			// - seeing if it actually should be displayed too
			this.threadFull.on('check_display_ready', function(){

				// Must have Full ready
				if(!that.threadFull.FullReady || !that.threadFull.EmailReady){
					// console.warn('thread.check_display_ready = not ready');
					return;
				}
				// Already rendered this Thread?
				if(that.threadFull.Rendered){
					// Show the change in the view
					console.warn('Already rendered (need to change the view!)');
					return;
				}
				that.threadFull.Rendered = true;

				// Render the view!
				this.ready_to_render = true;
				that.render();

			}, this);

			// Listen for "change" event
			this.threadFull.on('change', function(threadFull){
				// Mark thread as ready
				// - this fires immediately if anything is cached
				// - otherwise it fires if something is different from the cached version
				if(!that.threadFull.FullReady){
					that.threadFull.FullReady = true;
					that.threadFull.trigger('check_display_ready');
				}
			}, this);

			this.threadFull.fetchFull();

			// Emails for Thread
			// - we want to know after all the emails have been loaded for the Thread
			this.threadEmails = new App.Collections.EmailsFull();

			this.threadEmails.on('reset', function(){
				// never fires, what the fuck!!!!
				console.log('reset, NEVER FUCKING FIRES');
				if(!that.threadFull.EmailReady){
					that.threadFull.EmailReady = true;
					that.threadFull.trigger('check_display_ready');
				}
			}, this); // completely changed collection (triggers add/remove)

			this.threadEmails.on('sync', function(threadFull){
				// Fires after add/remove have completed?
				// console.info('EmailSync');
				if(this.threadEmails.length && !that.threadFull.EmailReady){
					that.threadFull.EmailReady = true;
					that.threadFull.trigger('check_display_ready');
				}
			}, this); // completely changed collection (triggers add/remove)

			this.threadEmails.on('add', function(emailFullModel){
				// Got a new email while the view is displayd, probably want to show a "display new email" type of popup (like gmail)
				// console.log('EmailAdd');
				// console.log(emailFullModel.toJSON()._id);
			}, this); // added a new EmailFull
			
			this.threadEmails.on('change', function(emailFullModel){
				console.log('EmailChange');
			}, this); // an email is slightly different now (re-render)
			
			// trigger EmailFull collection retrieving
			this.threadEmails.fetch_by_thread_id({
				ids: [this.options.threadid],
				cachePrefix: this.options.threadid
			});

		} else {
			// Thread and Emails already set
			// - render reply view as expected

			this.ThreadModel = this.options.ThreadModel;
			this.EmailModels = this.options.EmailModels;

			this.ready_to_render = true;
			this.render();


		}

		if(App.Data.Store.Contacts.length < 1){
			App.Data.Store.Contacts = new App.Collections.Contacts();
			App.Data.Store.Contacts.fetchDefault();
		}

	},

	beforeClose: function(){
		var that = this;

		// unbind events
		this.ev.unbind();

		App.Utils.BackButton.debubble(this.backbuttonBind);

		return;
	},

	toggle_menu: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// Show the drawing thing
		if(this.$('.common_drawing').hasClass('nodisplay')){
			// Display it
			this.$('.common_drawing').removeClass('nodisplay');
			this.$('.common_thread_reply_content').addClass('nodisplay');
		} else {
			// Hide it (without using the drawing)
			this.$('.common_drawing').addClass('nodisplay');
			this.$('.common_thread_reply_content').removeClass('nodisplay');
		}



		return false;
	},

	change_btn_group: function(ev){
		var that = this,
			elem = ev.currentTarget;

		$(elem).parent('.btn-group').find('.btn').removeClass('active');
		$(elem).addClass('active');

		// Do or do not grayscale
		if($(elem).attr('data-tool') == 'marker'){
			// Enable the colors and whatnot
			this.$('.colors_and_sizes').removeClass('disabled');
		} else {
			this.$('.colors_and_sizes').addClass('disabled');
		}

		return;
	},

	switch_active_size_or_color: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// Change the currently active size or color
		if($(elem).attr('data-size')){
			// size change
			this.$('[data-size]').removeClass('active');
			$(elem).addClass('active');
		} else {
			// color change
			this.$('[data-color]').removeClass('active');
			$(elem).addClass('active');
		}


	},

	save_drawing: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// Get PNG
		var img = this.sketch_canvas.get(0).toDataURL("image/png");

		// // Save PNG to file?
		console.log(img);
		// window.location = img;

		alert('Saving is currently disabled, sorry');

		return false;
	},

	show_all_addresses: function(ev){
		// Hide the single_address and show complex address fields
		var that = this,
			elem = ev.currentTarget;

		// Hide single_address field
		that.$('.single_address').remove();

		// Show complex
		that.$('.addresses').removeClass('nodisplay');

		// Add focus listener
		this.$('.add input').on('focus', $.proxy(this.focus_input_add_contact, this));
		this.$('.add input').on('blur', $.proxy(this.blur_input_add_contact, this));

		// change event (update autocomplete)
		// this.$('.add input').on('keyup', this.change_input_add_contact);

		return false;
	},

	tab_clicked: function(ev){
		// Only for adding styles
		var that = this,
			elem = ev.currentTarget;

		$(elem).siblings().removeClass('active');
		$(elem).addClass('active');
	},

	close_dropdown: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// Clear the dropdown box
		that.$('.searching_contacts').remove();

		$(elem).parent().find('input').val("");

		return false;
	},

	quick_add_address: function(ev){
		// Opens up the quick-add dialog
		var that = this,
			elem = ev.currentTarget;

		// Already displayed?
		// - remove it
		var $add = $(elem).parents('.add');
		if($add.next() && $add.next().hasClass('quick_contacts')){
			$add.next().remove();
			return false;
		}

		// Remove 'searching' box
		if($add.next() && $add.next().hasClass('searching_contacts')){
			$add.next().remove();
			return false;
		}


		// Create template
		var template = App.Utils.template('t_contacts_quick_add');

		// append after this .add element
		$(elem).parents('.add').after(template({
			frequent: [],
			in_thread: that.rendered_data.Participants
		}));

		return false;
	},

	quick_add_email: function(ev){
		// Adds the current email in the text field to the list
		// - validates email
		var that = this,
			elem = ev.currentTarget;

		// Validate email
		var email = $(elem).parent().find('input').val();
		email = $.trim(email);
		if(!App.Utils.Validate.email(email)){
			// Failed validation
			App.Utils.Notification.toast('Need to enter a full email address','danger');
			return false;
		}

		// Email OK

		// Remove if already in there?
		var $exists = $(elem).parents('.address_list').find('.participant[data-email="'+email+'"]');
		if($exists.length > 0){
			$exists.remove();
			ev.preventDefault();
			ev.stopPropagation();
			return false;
		}

		// Add using a template
		var template = App.Utils.template('t_compose_recipient');

		// If not exists, add it
		$(elem).parents('.address_list').find('.add').before(template(email));

		// Clear the input field
		$(elem).parent().find('input').val('');

		ev.preventDefault();
		ev.stopPropagation();
		return false;
	},

	chose_contact: function(ev){
		// add contact to To, Cc, or Bcc
		var that = this,
			elem = ev.currentTarget;

		var email = $(elem).attr('data-email');

		// Add email to html
		// - should highlight the email address after chosen

		// Remove if already in there?
		var $exists = $(elem).parents('.address_list').find('.participant[data-email="'+email+'"]');
		if($exists.length > 0){
			$exists.remove();
			ev.preventDefault();
			ev.stopPropagation();
			return false;
		}

		// Add using a template
		var template = App.Utils.template('t_compose_recipient');

		// If not exists, display it
		$(elem).parents('.address_list').find('.add').before(template(email));

		ev.preventDefault();
		ev.stopPropagation();
		return false;

	},

	focus_input_add_contact: function(ev){
		// Typing in the add contact input
		var that = this,
			elem = ev.currentTarget;

		// start autocompletetimeout
		that.current_autocomplete_elem = elem;

		// Already displayed?
		// - remove it
		var $add = $(elem).parents('.add');
		if($add.next() && $add.next().hasClass('searching_contacts')){
			// $add.next().remove();
			that.checking_autocomplete(); // run now
			return false;
		}

		// Remove 'quick_contacts' box
		if($add.next() && $add.next().hasClass('quick_contacts')){
			$add.next().remove();
			// return false;
		}

		// Create template
		var template = App.Utils.template('t_contacts_searching_init');

		// append after this .add element
		$(elem).parents('.add').after(template([]));

		// Already text typed in there?

		that.checking_autocomplete();


		return;
	},

	blur_input_add_contact: function(){
		// when leaving contact search box
		var that = this;

		// Clear the timeout
		window.clearTimeout(that.autocompleteTimeout);

		return;
	},

	checking_autocomplete: function(){
		var that = this;

		that.autocompleteTimeout = window.setTimeout(function(){
			// Check for updates to field
			that.update_autocomplete();
			that.checking_autocomplete();
		},100);
	},

	update_autocomplete: function(){
		// check for differences in input field
		var that = this;

		var elem = that.current_autocomplete_elem;
		
		var search_val = $.trim($(elem).val().toLowerCase());
		if(search_val == $(elem).attr('last-val')){
			return;
		}
		$(elem).attr('last-val', search_val);

		console.log(search_val);

		var total = null,
			return_result = null

		if(search_val != ''){
			var result = [];
			var Contacts = [];
			try {
				Contacts = App.Data.Store.Contacts.toJSON();
			} catch(err){
				Contacts = App.Data.Store.Contacts;
			}

			Contacts = parse_and_sort_contacts(Contacts);

			console.log('Contacts length');
			console.dir(Contacts.length);

			_.each(Contacts, function(contact){
				
				if(contact.name.toLowerCase().indexOf(search_val) != -1){
					// found
					result.push(contact);
					return true;
				}
				// Any emails match?
				if(contact.email.toLowerCase().indexOf(search_val) != -1){
					// found
					result.push(contact);
					return true;
				}
				return false;
			});

			total = result.length;
			return_result = result.splice(0,5);

		}

		// Update template
		var template = App.Utils.template('t_contacts_searching_results');

		// append after this .add element
		$(elem).parents('.address_list').find('.searching_contacts').html(template({
			total: total,
			result: return_result,
			all_contacts: App.Data.Store.Contacts.length
		}));

		return;
	},

	remove_address: function(ev){
		// remove a person from the sending list

		var that = this;
		var elem = ev.currentTarget;

		$(elem).parents('.participant').remove();

	},


	cancel: function(){
		// Going back to mailbox
		// - highlight the correct row we were on? (v2)
		var that = this;

		// emit a cancel event to the parent
		this.ev.trigger('cancel');

		// clear interval that checks for keyboard open/close
		clearTimeout(this.checkingTimeout);

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

	cancel_sending: function(that, elem){

		$(elem).text('Send');
		$(elem).attr('disabled',false);
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

		

		// In Reply To
		var in_reply = this.EmailModels.last().toJSON().common['Message-Id']; //[this.thread_data.Email.length - 1].common['Message-Id'];
		var subject = this.EmailModels.last().toJSON().original.headers.Subject;

		// References (other message-ids)
		var references = _.map(this.EmailModels,function(email){
			return email.toJSON().common['Message-Id'];
		});

		// To
		var to = [];
		this.$('.address_list[data-type="To"] .participant').each(function(index){
			to.push($(this).attr('data-email'));
		});
		to = to.join(',');

		// CC
		var cc = [];
		this.$('.address_list[data-type="CC"] .participant').each(function(index){
			cc.push($(this).attr('data-email'));
		});
		cc = cc.join(',');
		
		// BCC
		var bcc = [];
		this.$('.address_list[data-type="BCC"] .participant').each(function(index){
			bcc.push($(this).attr('data-email'));
		});
		bcc = bcc.join(',');
		

		var from = App.Data.UserEmailAccounts.at(0).get('email');
		var textBody = that.$('#textbody').val();

		// Do a little bit of validation
		try {
			if(to.length < 1){
				alert('You need to send to somebody!');
				that.cancel_sending(that, elem);
				return false;
			}
			if(from.length < 1){
				alert('Whoops, we cannot send from your account right now');
				that.cancel_sending(that, elem);
				return false;
			}
			if(subject.length < 1){
				alert('You need to write a subject line!');
				that.cancel_sending(that, elem);
				return false;
			}
			if(textBody.length < 1){
				alert('You need to write something in your email!');
				that.cancel_sending(that, elem);
				return false;
			}

		} catch(err){
			console.error('Failed validation');
			console.error(err);
			that.cancel_sending(that, elem);
			return false;

		}

		// Send return email
		var eventData = {
			event: 'Email.send.validate',
			delay: 0,
			obj: {
				To: to,
				From: from,
				Subject: subject,
				Text: textBody,
				headers: {
					"In-Reply-To" : in_reply,
					"References" : references.join(',')
				},
				attachments: []
			}
		};

		// CC and BCC
		if(cc.length > 0){
			eventData.obj.headers.CC = cc;
		}
		if(bcc.length > 0){
			eventData.obj.headers.BCC = bcc;
		}

		// Add attachments
		// - not required
		that.$('.file_attachment').each(function(idx, fileElem){
			eventData.obj.attachments.push({
				_id: $(fileElem).attr('data-file-id'),
				name: $(fileElem).attr('data-file-name')
			});
		});

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

						// $(elem).text('Send');
						// $(elem).attr('disabled',false);
						// that.disable_buttons = false;
						that.cancel_sending(that, elem);
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

					// // Log
					// clog('sending reply Email');
					// clog(eventData);

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

	switch_addresses: function(ev){
		// Switch showing To/CC/BCC
		var that = this,
			elem = ev.currentTarget;

		if($(elem).hasClass('btn-inverse')){
			// already active
			return false;
		}

		// Remove currently active
		var $addresses = $(elem).parents('.addresses');
		$addresses.find('.address_list').removeClass('active');
		$addresses.find('button').removeClass('btn-inverse').addClass('btn-info');

		// Make current selection active
		$(elem).removeClass('btn-info').addClass('btn-inverse');
		var attr = $(elem).attr('data-type');
		$addresses.find('.address_list[data-type="'+attr+'"]').addClass('active');

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
		// Add an attachment
		
		// Launch Filepicker.io (new window, uses ChildBrowser)
		filepicker.getFile('*/*', {
				// services: ['DROPBOX','BOX','FACEBOOK','GMAIL'], // broken, causes Filepicker error
				openTo: 'DROPBOX'
			},
			function(fpurl){ // on return
				// Got an fpurl (or multiple of them?)
				// alert('got fpurl');

				// Get Metadata
				$.ajax({
					url: fpurl + '/metadata',
					cache: false,
					json: true,
					success: function(fpinfo){
						// Got metadata for the file
						// - not handling failures well
						// console.log(fpinfo); // [object Object]

						// Write File to Emailbox
						Api.write_file({
							data: {
								url: fpurl,
								name: fpinfo.filename
							},
							success: function(response){
								response = JSON.parse(response);

								if(response.code != 200){
									// Failed writing File
									alert('Failed writing File');
									return false;
								}

								// Uploaded to Emailbox OK

								// Compile Template data
								var templateData = {
									url: response.data.access.url,
									name: response.data.name,
									_id: response.data._id
								};
								console.log('tData');
								console.log(JSON.stringify(templateData));

								// Write template
								var template = App.Utils.template('t_common_file_attachment');

								// Append
								$('.file_attachments').append(
									template(templateData)
								);

							}
						});

					}
				}); // promise?
			}
		);

		return false;
	},

	remove_attachment: function(ev){
		// Remove attachment
		// - should also remove from Filepicker?
		//   - gets auto-removed after 4 hours
		var that = this,
			elem = ev.currentTarget;

		// Remove
		$(elem).remove();

		// done	
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

	leave_minimal_view: function(){
		// leaving the minimal view mode
		this.trigger('keyboard_in');

		return false;
	},


	render_init: function(){
		// Render loading thread

		// Template
		var template = App.Utils.template('t_common_loading');

		// Write HTML
		this.$el.html(template());


		return this;
	},

	render_thread: function(){
		
		clog('rendering Thread and Forms');

		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_common_thread_reply');

		// build the data
		var data = {
			// Thread: App.Data.Store.Thread[this.threadid],
			// Email: _.filter( App.Data.Store.Email,function(email){
			// 		if(email.attributes.thread_id == that.threadid) return true;
			// 	})
			Thread: this.ThreadModel.toJSON(),
			Email: this.EmailModels.toJSON()
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
						// if($.inArray(parsed_email[1], App.Data.UserEmailAccounts_Quick) != -1){
						// 	return false;
						// }

						// Add address to list
						addresses.push(parsed_email[1]);

					});
				}
			});
			return addresses;
		});
		
		// merging participants? seems clumsy
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

		// All participants
		data.Participants = tmp_participants2;

		// To
		// - either Reply-To or From
		// - if the last email is from me, then set the same info? (only go 2 deep before it breaks)
		var tmp_last = data.Email[data.Email.length - 1];
		var still_me = false;
		// console.log(tmp_last);
		try {
			if($.inArray(tmp_last.original.headers.From_Parsed[0][1], App.Data.UserEmailAccounts_Quick) != -1){
				// is me
				// - try the next email
				tmp_last = data.Email[data.Email.length - 2];
				if($.inArray(tmp_last.original.headers.From_Parsed[0][1], App.Data.UserEmailAccounts_Quick) != -1){
					// Is still me, just go with my same To address
					still_me = true;
				} else {

				}
			}
		} catch(err){

		}
		if(still_me){
			// using my "To" data
			data.Participants_To = tmp_last.original.headers['To_Parsed'];
		} else {
			data.Participants_To = tmp_last.original.headers['Reply-To_Parsed'].length > 0 ? tmp_last.original.headers['Reply-To_Parsed'] : tmp_last.original.headers['From_Parsed'];
		}

		// Carbon Copies
		data.Participants.CC = tmp_last.original.headers['Cc_Parsed'];

		// Single email recipient (conversation with one person)
		// - mailing list?
		if(data.Participants_To.length == 1 && data.Participants.CC.length == 0){
			data.only_single_address = data.Participants_To[0];
			data.single_address_class = 'nodisplay';
		}

		// attach to View
		this.rendered_data = data;

		// Write HTML
		this.$el.html(template(data));

		// Render sketching canvas
		this.$('#sketch').width((App.Data.xy.win_width - 10) + 'px');
		// alert(App.Data.xy.win_width);
		this.sketch_canvas = this.$('#sketch').sketch();

		// Listen for textarea focus
		// - remove all the other elements, make it all about the composing experience? (show/hide button?)

		// Input keyboard showing
		// this.$('textarea').on('focus',function(){
		// 	that.trigger('keyboard_showing');
		// });
		// this.$('textarea').on('blur',function(){
		// 	that.trigger('keyboard_in');
		// });

		// Textarea keyboard showing
		this.$('.compose_body').on('focus',function(){
			that.trigger('keyboard_showing');
		});
		this.$('.compose_body').on('blur',function(){
			that.trigger('keyboard_in');
		});

		this.checkingForKeyboard = function checkingTimer(){
			// Get window height
			// - compare to expected height or width (portrait or landscape)
			var win_height = $(window).height();
			if(win_height != App.Data.xy.win_height && win_height != App.Data.xy.win_width){
				// Keyboard is out
				if(!that.keyboard_showing){
					that.keyboard_showing = true;
					that.trigger('keyboard_showing');
				}
			} else {
				// Keyboard is hidden
				if(that.keyboard_showing){
					that.keyboard_showing = false;
					that.trigger('keyboard_in');
				}
			}
			that.checkingTimeout = setTimeout(that.checkingForKeyboard, 500);
		};
		that.checkingTimeout = setTimeout(that.checkingForKeyboard, 500);

		// Hiding elements on keyboard out
		that.on('keyboard_showing',function(){
			// that.$('.compose-exit-minimal').removeClass('nodisplay');
			if(that.$('.compose_body').is(':focus')){

				// Hide the single_address if necessary, but bring it back later!

				that.$('.single_address').hide();
				that.$('.header, .addresses').hide();
				that.$('.body_container').removeClass('nudge_down');
			}
		});

		// Showing elements when keyboard hidden
		that.on('keyboard_in',function(){
			// that.$('.compose-exit-minimal').addClass('nodisplay');

			that.$('.header').show();

			// Show the single_address if it exists
			if(that.$('.single_address').length > 0){
				that.$('.single_address').show();
			} else {
				that.$('.addresses').show();
			}

			that.$('.body_container').addClass('nudge_down');
		});

		// Focus on textarea
		// this.$('.textarea').focus();


		// Scroll to top
		$(window).scrollTop(0);

		return this;
		
	},

	render: function() {
		var that = this;

		// Render if data is ready
		if(this.ready_to_render){

			this.render_thread();

		} else {
			this.render_loading();
		}

		// var data = App.Data.Store.Thread[this.threadid];
		// if(data == undefined){
		// 	alert('thread data not set, not loading');
		// 	// Thread not set at all
		// 	// - get it and start replying
		// 	//		- should be able to start replying right away, load details in a minute
			
		// 	// Template
		// 	var template = App.Utils.template('t_common_loading');

		// 	// Write HTML
		// 	this.$el.html(template());


		// 	return this;
		// } else {
		// 	// Just render the Thread data (we should have it)
			
		// 	var tmp_emails = new App.Collections.Emails();
		// 	tmp_emails.fetch_for_thread({
		// 		thread_id: that.threadid,
		// 		success: function(emails){
		// 			// Anything different from the existing look?
		// 			// - update the View with new data
					
		// 			clog('re-rendering Thread');
		// 			// that.render();

		// 		}
		// 	});

		// 	that.render_thread();

		// }

		// Bind to backbutton
		this.backbuttonBind = App.Utils.BackButton.newEnforcer(this.cancel);

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

		'click .btn[data-action="contacts"]' : 'contact',
		'click .addresses .choose_type button' : 'switch_addresses',

		'click .remove_address' : 'remove_address',

		'click .address_list .add .closeButton' : 'close_dropdown',
		'click .address_list .add .openButton' : 'quick_add_address',
		'click .address_list .add .addEmail' : 'quick_add_email',
		'click .quick_contacts .btn-toolbar a' : 'tab_clicked',
		'click .addresses .contact' : 'chose_contact',

		'click .add_attachment' : 'add_attachment',
		'click .add_photo' : 'add_photo',

		'click .file_attachment' : 'remove_attachment',

		'click .compose-exit-minimal span' : 'leave_minimal_view'

	},

	disable_buttons: false,

	initialize: function(options) {
		_.bindAll(this, 'render');
		_.bindAll(this, 'beforeClose');
		_.bindAll(this, 'cancel');
		_.bindAll(this, 'chose_email');
		_.bindAll(this, 'enable_send_button');

		var that = this;
		// this.el = this.options.el;

		// Load contacts if not loaded
		if(App.Data.Store.Contacts.length < 1){
			App.Data.Store.Contacts = new App.Collections.Contacts();
			App.Data.Store.Contacts.fetch();
		}

	},

	beforeClose: function(){
		// Kill back button grabber
		var that = this;

		App.Utils.BackButton.debubble(this.backbuttonBind);

		return;
	},

	tab_clicked: function(ev){
		// Only for adding styles
		var that = this,
			elem = ev.currentTarget;

		$(elem).siblings().removeClass('active');
		$(elem).addClass('active');
	},

	close_dropdown: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// Clear the dropdown box
		that.$('.searching_contacts').remove();

		$(elem).parent().find('input').val("");

		return false;
	},

	quick_add_address: function(ev){
		// Opens up the quick-add dialog
		var that = this,
			elem = ev.currentTarget;

		// Already displayed?
		// - remove it
		var $add = $(elem).parents('.add');
		if($add.next() && $add.next().hasClass('quick_contacts')){
			$add.next().remove();
			return false;
		}

		// Remove 'searching' box
		if($add.next() && $add.next().hasClass('searching_contacts')){
			$add.next().remove();
			return false;
		}


		// Create template
		var template = App.Utils.template('t_contacts_quick_add');

		// append after this .add element
		$(elem).parents('.add').after(template({
			frequent: []
		}));

		return false;
	},

	quick_add_email: function(ev){
		// Adds the current email in the text field to the list
		// - validates email
		var that = this,
			elem = ev.currentTarget;

		// Validate email
		var email = $(elem).parent().find('input').val();
		email = $.trim(email);
		if(!App.Utils.Validate.email(email)){
			// Failed validation
			App.Utils.Notification.toast('Need to enter a full email address','danger');
			return false;
		}

		// Email OK

		// Remove if already in there?
		var $exists = $(elem).parents('.address_list').find('.participant[data-email="'+email+'"]');
		if($exists.length > 0){
			$exists.remove();
			ev.preventDefault();
			ev.stopPropagation();
			return false;
		}

		// Add using a template
		var template = App.Utils.template('t_compose_recipient');

		// If not exists, add it
		$(elem).parents('.address_list').find('.add').before(template(email));

		// Clear the input field
		$(elem).parent().find('input').val('');

		ev.preventDefault();
		ev.stopPropagation();
		return false;
	},

	chose_contact: function(ev){
		// add contact to To, Cc, or Bcc
		var that = this,
			elem = ev.currentTarget;

		var email = $(elem).attr('data-email');

		// Add email to html
		// - should highlight the email address after chosen

		// Remove if already in there?
		var $exists = $(elem).parents('.address_list').find('.participant[data-email="'+email+'"]');
		if($exists.length > 0){
			$exists.remove();
			ev.preventDefault();
			ev.stopPropagation();
			return false;
		}

		// Add using a template
		var template = App.Utils.template('t_compose_recipient');

		// If not exists, display it
		$(elem).parents('.address_list').find('.add').before(template(email));

		ev.preventDefault();
		ev.stopPropagation();
		return false;

	},

	focus_input_add_contact: function(ev){
		// Typing in the add contact input
		var that = this,
			elem = ev.currentTarget;

		// start autocompletetimeout
		that.current_autocomplete_elem = elem;

		// Already displayed?
		// - remove it
		var $add = $(elem).parents('.add');
		if($add.next() && $add.next().hasClass('searching_contacts')){
			// $add.next().remove();
			that.checking_autocomplete(); // run now
			return false;
		}

		// Remove 'quick_contacts' box
		if($add.next() && $add.next().hasClass('quick_contacts')){
			$add.next().remove();
			// return false;
		}

		// Create template
		var template = App.Utils.template('t_contacts_searching_init');

		// append after this .add element
		$(elem).parents('.add').after(template([]));

		// Already text typed in there?

		that.checking_autocomplete();


		return;
	},

	blur_input_add_contact: function(){
		// when leaving contact search box
		var that = this;

		// Clear the timeout
		window.clearTimeout(that.autocompleteTimeout);

		return;
	},

	checking_autocomplete: function(){
		var that = this;

		that.autocompleteTimeout = window.setTimeout(function(){
			// Check for updates to field
			that.update_autocomplete();
			that.checking_autocomplete();
		},100);
	},

	update_autocomplete: function(){
		// check for differences in input field
		var that = this;

		var elem = that.current_autocomplete_elem;
		
		var search_val = $.trim($(elem).val().toLowerCase());
		if(search_val == $(elem).attr('last-val')){
			return;
		}
		$(elem).attr('last-val', search_val);

		console.log(search_val);

		var total = null,
			return_result = null

		if(search_val != ''){
			var result = [];
			var Contacts = [];
			try {
				Contacts = App.Data.Store.Contacts.toJSON();
			} catch(err){
				Contacts = App.Data.Store.Contacts;
			}
			console.log('Contacts length');
			console.log(Contacts.length);
			console.dir(Contacts.length);
			_.each(Contacts, function(contact){
				if(contact.name.toLowerCase().indexOf(search_val) != -1){
					// found
					result.push(contact);
					return true;
				}
				if(contact.email.toLowerCase().indexOf(search_val) != -1){
					// found
					result.push(contact);
					return true;
				}
				return false;
			});

			total = result.length;
			return_result = result.splice(0,5);

		}

		// Update template
		var template = App.Utils.template('t_contacts_searching_results');

		// append after this .add element
		$(elem).parents('.address_list').find('.searching_contacts').html(template({
			total: total,
			result: return_result,
			all_contacts: App.Data.Store.Contacts.length
		}));

		return;
	},

	remove_address: function(ev){
		// remove a person from the sending list

		var that = this;
		var elem = ev.currentTarget;

		$(elem).parents('.participant').remove();

	},

	switch_addresses: function(ev){
		// Switch showing To/CC/BCC
		var that = this,
			elem = ev.currentTarget;

		if($(elem).hasClass('btn-inverse')){
			// already active
			return false;
		}

		// Remove currently active
		var $addresses = $(elem).parents('.addresses');
		$addresses.find('.address_list').removeClass('active');
		$addresses.find('button').removeClass('btn-inverse').addClass('btn-info');

		// Make current selection active
		$(elem).removeClass('btn-info').addClass('btn-inverse');
		var attr = $(elem).attr('data-type');
		$addresses.find('.address_list[data-type="'+attr+'"]').addClass('active');

		return false;
	},

	contact: function(ev){
		// Choose a contact
		var that = this,
			elem = ev.currentTarget;

		// Validate email

		if(usePg){

			// Already have contacts data?

			// Change element to "loading contacts"
			$(elem).text('Lo...');

			// Display contacts chooser subview
			window.setTimeout(function(){

				if(!App.Data.PermaViews.contacts){
					// Create page for first time
					App.Data.PermaViews.contacts = new App.Views.ChooseContact();
				}

				// that.subViewContacts = new App.Views.ChooseContact({
				// 	Parent: that,
				// 	multiple: true
				// });

				// Set Parent for the View
				App.Data.PermaViews.contacts.Parent = that;

				// Turn on multi-select
				// - on by default?
				App.Data.PermaViews.contacts.multiple = true;

				// Hide compose view
				that.$el.addClass('nodisplay');

				// Tell contacts to render
				// - the DOM element gets populated
				App.Data.PermaViews.contacts.render();

				// Add ChooseContacts view to the HTML
				$('body').append(App.Data.PermaViews.contacts.el);

				// Change text back
				// - after view is already hidden
				$(elem).html('<i class="fui-man-24"></i>');

				// Listen for contact events
				// - chose_email
				// - cancel
				// - any others?

				// "cancel" event
				App.Data.PermaViews.contacts.on('cancel',function(){
					
					// Remove View
					App.Data.PermaViews.contacts.remove(); // this removes it from the DOM I believe

					// un-hide this view
					that.$el.removeClass('nodisplay');

					// scroll to top
					$('body').scrollTop(0);

					// Remove listeners
					App.Data.PermaViews.contacts.off();

				}, this);	

				// "chose_email" event
				App.Data.PermaViews.contacts.on('chose_email',function(email){

					console.log('  chose_email');
					// Remove View
					App.Data.PermaViews.contacts.remove(); // this removes it from the DOM I believe

					// un-hide this view
					that.$el.removeClass('nodisplay');

					// Add using a template
					var template = App.Utils.template('t_compose_recipient');

					// If exists, display it
					if(email){
						that.$('.addresses').append(template(email));
					}

					// scroll to top
					$('body').scrollTop(0);

					// Remove listeners
					App.Data.PermaViews.contacts.off();

				}, this);				


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

		// clear interval that checks for keyboard open/close
		clearTimeout(this.checkingTimeout);
		
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
		App.Utils.Notification.toast('Email Sent Successfully','success');

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

	cancel_sending: function(that, elem){

		$(elem).text('Send');
		$(elem).attr('disabled',false);
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
		
		// Subject
		var subject = that.$('#subject').val(); // reply subject: this.EmailModels.last().toJSON().original.headers.Subject;

		// To
		var to = [];
		this.$('.address_list[data-type="To"] .participant').each(function(index){
			to.push($(this).attr('data-email'));
		});
		to = to.join(',');

		// CC
		var cc = [];
		this.$('.address_list[data-type="CC"] .participant').each(function(index){
			cc.push($(this).attr('data-email'));
		});
		cc = cc.join(',');
		
		// BCC
		var bcc = [];
		this.$('.address_list[data-type="BCC"] .participant').each(function(index){
			bcc.push($(this).attr('data-email'));
		});
		bcc = bcc.join(',');
		

		var from = App.Data.UserEmailAccounts.at(0).get('email');
		var textBody = $.trim(that.$('#textbody').val());

		// Do a little bit of validation
		try {
			if(to.length < 1){
				alert('You need to send to somebody!');
				that.cancel_sending(that, elem);
				return false;
			}
			if(from.length < 1){
				alert('Whoops, we cannot send from your account right now');
				that.cancel_sending(that, elem);
				return false;
			}
			if(subject.length < 1){
				alert('You need to write a subject line!');
				that.cancel_sending(that, elem);
				return false;
			}
			if(textBody.length < 1){
				alert('You need to write something in your email!');
				that.cancel_sending(that, elem);
				return false;
			}

		} catch(err){
			console.error('Failed validation');
			console.error(err);
			that.cancel_sending(that, elem);
			return false;

		}

		// Send return email
		var eventData = {
			event: 'Email.send.validate',
			delay: 0,
			obj: {
				To: to,
				From: from,
				Subject: subject,
				Text: textBody,
				headers: {
				},
				attachments: []
			}
		};

		// CC and BCC
		if(cc.length > 0){
			eventData.obj.headers.CC = cc;
		}
		if(bcc.length > 0){
			eventData.obj.headers.BCC = bcc;
		}

		// Add attachments
		// - not required
		that.$('.file_attachment').each(function(idx, fileElem){
			eventData.obj.attachments.push({
				_id: $(fileElem).attr('data-file-id'),
				name: $(fileElem).attr('data-file-name')
			});
		});

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

						// $(elem).text('Send');
						// $(elem).attr('disabled',false);
						// that.disable_buttons = false;
						that.cancel_sending(that, elem);
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

	send_old: function(ev){
		// Send the email
		// - Validate sending the email
		var that = this,
			elem = ev.currentTarget;


		if(!confirm('Are you sure you want to send?')){
			return false;
		}

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

			// Re-enable send button
			that.enable_send_button();
			return;
		}

		// Rejoin
		to = to.join(',');

		// Validation data
		var eventData = {
			event: 'Email.send.validate',
			delay: 0,
			obj: {
				To: to,
				From: App.Data.UserEmailAccounts.at(0).get('email'),
				Subject: that.$('#subject').val(),
				Text: that.$('#textbody').val(),
				headers: {
					// nothing to add yet
				},
				attachments: []
			}
		};

		// Add attachments
		// - not required
		that.$('.file_attachment').each(function(idx, fileElem){
			eventData.obj.attachments.push({
				_id: $(fileElem).attr('data-file-id'),
				name: $(fileElem).attr('data-file-name')
			});
		});

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

					// Add Attachments to Emailbox File API
					// - doing it here, instead of before sending (in case we just want to delete it?)

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
								// - no, wait for the Email to be received, and it was updated

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

		// alert('Attachments broken, substituting Fry');

		// var file = {
		// 	url: 'https://www.filepicker.io/api/file/5qYoopVTsixCJJiqSWSE',
		// 	name: 'fry.png'
		// };

		// setTimeout(function(){
		// 	// Pretend we just loaded the file through Filepicker (currently broken)

		// 	// Add url and little "attachment" icon-file to Files fields

		// 	var url = file.url;

		// 	// Write template
		// 	var template = App.Utils.template('t_common_file_attachment');

		// 	// Append
		// 	$('.file_attachments').append(
		// 		template({
		// 			url: file.url, 
		// 			name: file.name
		// 		})
		// 	);

		// },300);

		// return false;

		// Launch Filepicker.io (new window, uses ChildBrowser)
		filepicker.getFile('*/*', {
				// services: ['DROPBOX','BOX','FACEBOOK','GMAIL'], // broken, causes Filepicker error
				openTo: 'DROPBOX'
			},
			function(fpurl){ // on return
				// Got an fpurl (or multiple of them?)
				// alert('got fpurl');

				// Get Metadata
				$.ajax({
					url: fpurl + '/metadata',
					cache: false,
					json: true,
					success: function(fpinfo){
						// Got metadata for the file
						// - not handling failures well
						// console.log(fpinfo); // [object Object]

						// Write File to Emailbox
						Api.write_file({
							data: {
								url: fpurl,
								name: fpinfo.filename
							},
							success: function(response){
								response = JSON.parse(response);

								if(response.code != 200){
									// Failed writing File
									alert('Failed writing File');
									return false;
								}

								// Uploaded to Emailbox OK

								// Compile Template data
								var templateData = {
									url: response.data.access.url,
									name: response.data.name,
									_id: response.data._id
								};
								console.log('tData');
								console.log(JSON.stringify(templateData));

								// Write template
								var template = App.Utils.template('t_common_file_attachment');

								// Append
								$('.file_attachments').append(
									template(templateData)
								);

							}
						});

					}
				}); // promise?
			}
		);

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

	remove_attachment: function(ev){
		// Remove attachment
		// - should also remove from Filepicker?
		//   - gets auto-removed after 4 hours
		var that = this,
			elem = ev.currentTarget;

		// Remove
		$(elem).remove();

		// done	
		return false;
	},


	render_init: function(){

	},

	leave_minimal_view: function(){
		// leaving the minimal view mode
		this.trigger('keyboard_in');

		return false;
	},

	render: function() {
		var that = this;

		// Template
		var template = App.Utils.template('t_common_compose');

		// Write HTML
		this.$el.html(template());

		// Focus
		// this.$('#subject').focus(); // never seems to work


		// Listen for textarea focus
		// - remove all the other elements, make it all about the composing experience? (show/hide button?)
		this.$('.compose_body').on('focus',function(){
			// alert('focused');
			// that.$('.addresses').hide();
			// that.$('.header, .addresses').hide();
			// that.$('.body_container').removeClass('nudge_down');
			that.trigger('keyboard_showing');
		});
		this.$('.compose_body').on('blur',function(){
			// alert('unfocused');
			// that.$('.addresses').show();

			that.trigger('keyboard_in');
		});

		this.checkingForKeyboard = function checkingTimer(){
			// Get window height
			// - compare to expected height or width (portrait or landscape)
			var win_height = $(window).height();
			if(win_height != App.Data.xy.win_height && win_height != App.Data.xy.win_width){
				// Keyboard is out
				if(!that.keyboard_showing){
					that.keyboard_showing = true;
					that.trigger('keyboard_showing');
				}
			} else {
				// Keyboard is hidden
				if(that.keyboard_showing){
					that.keyboard_showing = false;
					that.trigger('keyboard_in');
				}
			}
			that.checkingTimeout = setTimeout(that.checkingForKeyboard, 500);
		};
		that.checkingTimeout = setTimeout(that.checkingForKeyboard, 500);

		// Hiding elements on keyboard out
		that.on('keyboard_showing',function(){
			// alert('out');
			// that.$('.compose-exit-minimal').removeClass('nodisplay');
			if(that.$('.compose_body').is(':focus')){
				that.$('.header, .addresses').hide();
				that.$('.body_container').removeClass('nudge_down');
			}
		});

		// Showing elements when keyboard hidden
		that.on('keyboard_in',function(){
			// alert('hidden');
			// that.$('.compose-exit-minimal').addClass('nodisplay');
			that.$('.header, .addresses').show();
			that.$('.body_container').addClass('nudge_down');
		});


		// Add focus listener on autocomplete
		this.$('.add input').on('focus', $.proxy(this.focus_input_add_contact, this));
		this.$('.add input').on('blur', $.proxy(this.blur_input_add_contact, this));

		// Bind to backbutton
		this.backbuttonBind = App.Utils.BackButton.newEnforcer(this.cancel);

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

		this._renderedContacts = false;

		if(usePg){
			alert('launched contacts');
			App.Data.Store.Contacts = new App.Collections.Contacts();

			// Collect from Collection.Contacts

			// // If Rendered, continue rendering
			// this.contacts = new App.Collections.Contacts(); // probably already fetched

			// this.contacts.on('reset',function(contacts){
			// 	// alert('reset');
			// 	console.log('reset contacts');
			// }, this);
			// this.contacts.on('sync',function(contacts){
			// 	// Render template with all contacts
			// 	// - ignoring additions/subtractions until next load
			// 	// - not using 'add' or 'remove' at all
			// 	console.log('sync');
			// 	if(contacts.length < 1){
			// 		// Nothing to render (probably nothing cached, first grab)
			// 		console.log('no contacts found (in cache?)');
			// 		return;
			// 	}
			// 	console.log('found some contacts');

			// 	// Template
			// 	var template = App.Utils.template('t_choose_contacts');

			// 	// Write HTML
			// 	if(!that._renderedContacts){
			// 		that.__renderedContacts = true;
			// 		that.$el.html(template({
			// 			contacts: contacts.toJSON()
			// 		}));
			// 	} else {
			// 		console.log('already rendered');
			// 	}

			// });

			// var k = 1;
			// this.contacts.on('add', function(contact){
			// 	// console.log('added_contact: ' + k);
			// 	k++;
			// }, this);

			// this.contacts.on('remove', function(contact){
			// 	// console.log('removed_contact');
			// 	// k--;
			// }, this);

			// this.contacts.on('all', function(event){
			// 	if(event == 'add' || event == 'remove'){
			// 		return;
			// 	}
			// 	console.log(event);
			// }, this);

			// Trigger data refresh
			App.Data.Store.Contacts.fetch();

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

	beforeClose: function(){
		// Kill back button grabber
		var that = this;

		// App.Utils.BackButton.debubble(this.backbuttonBind);

		return;
	},

	close: function(){
		// Don't actually close
		// - overwriting Backbone.View.prototype.close (at top)
		var that = this;

		// De-bubble BackButton
		App.Utils.BackButton.debubble(this.backbuttonBind);

		return this;

	},

	cancel: function(ev){
		// Cancel and return
		var that = this,
			elem = ev.currentTarget;

		// Trigger cancel
		this.trigger('cancel');

		// Return
		// this.back(null);

		return false;

	},

	choose_email: function(ev){
		// Chose one of the emails for the person
		var that = this,
			elem = ev.currentTarget;

		// Get email
		var email = $(elem).attr('data-email');

		// Trigger that we got an email
		this.trigger('chose_email',email);


		// // Return
		// this.back(email);

		// return false;
		return;
	},

	back: function(email){
		var that = this;

		this.trigger('cancel');

		return;

		// this.cancel();

		// alert('never back!');
		// // trying to exit
		// // - trigger "want to leave"
		// // - expect some other view to handle this mofucker
		// this.trigger('want_to_leave', email);

		// // // Add email to the parent page
		// // this.options.Parent.chose_email(email);

		// // // Show the parent
		// // // - should be using a window manager
		// // that.options.Parent.$el.removeClass('nodisplay');
		// // // $('body > .common_compose').removeClass('nodisplay');

		// // // Close this view
		// this.close();

	},

	render: function() {
		var that = this;
		
		// Already rendered once?
		if(this._rendered){
			// Already rendered, but asking to be shown?

			// Re-bind events
			this.delegateEvents()

			// Re-bind events for subViews (not necessary for ChooseContacts yet)
			// _(that._subViews.undecided).each(function(v) {
			// 	v.trigger('rebind');
			// });

			// Back button
			this.backbuttonBind = App.Utils.BackButton.newEnforcer(this.back);

			return this;
		}

		this._rendered = true;

		// Template (loading)
		// var template = App.Utils.template('t_common_loading');
		var template = App.Utils.template('t_choose_contacts');

		// Write HTML
		console.log('render contacts: ');
		console.log(App.Data.Store.Contacts.length);
		this.$el.html(template({
			contacts: App.Data.Store.Contacts.toJSON()
		}));

		// Back button
		this.backbuttonBind = App.Utils.BackButton.newEnforcer(this.back);

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
		// - but not ones that have already been processed

		var incl_thread_ids = [];
		$('.thread[data-thread-type="'+ this.options.type +'"]').reverse().each(function(i, threadElem){
			if($(threadElem).hasClass('tripped')){
				// Already tripped, don't use this one
				return;
			}

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
		// - displays DelayModal

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
			if($(threadElem).hasClass('tripped')){
				// Already tripped, don't use this one
				return;
			}
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
		App.Utils.Notification.toast('Updated Note', 'success');

		return false;

	},

	render: function() {
		var that = this;

		// Template
		var template = App.Utils.template('t_all_thread_options');

		// Write HTML
		// this.$el.html(template());

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







// Base inbox view (dunno, now, later)
App.Views.Inbox_Base = Backbone.View.extend({
	
	className: 'all_thread_inside_view reverse_vertical',

	last_scroll_position: 0,

	events: {

		'click .multi-deselect' : 'multi_deselect',
		'click .multi-done' : 'multi_done',
		'click .multi-delay' : 'multi_delay',
		'click .multi-waiting' : 'multi_waiting',

		'multi-change .all_threads' : 'multi_options',

		'click #dk_container_options .dk_toggle' : 'toggle_all',
		'click #dk_container_options .dk_options a' : 'all_action',

		'click .toggle-due-later' : 'toggle_due_later',
		'click .toggle-waiting' : 'toggle_label'

	},

	initialize: function(options) {
		var that = this;
		_.bindAll(this, 'render');
		_.bindAll(this, 'render_total_count');
		_.bindAll(this, 'render_structure');
		_.bindAll(this, 'beforeClose');
		_.bindAll(this, 'after_multi_delay_modal');
		_.bindAll(this, 'mass_action');
		_.bindAll(this, 'multi_options');
		_.bindAll(this, 'checkCount');
		
		// App.Events.bind('new_email',this.refresh_and_render_threads);

		// View containers
		this._subViews = [];

		// removal containers
		// - for when "refresh" is called
		this._waitingToRemove = [];

		// Run after_init (each Inbox has a different versino for loading the correct search threads)
		var threadType = this.collection_init(); // keeps context
		this.threadType = threadType;

		// Set showDelayChooserFooter
		this.showDelayChooserFooter = this.showDelayChooserFooter || false;
		this.showSubfilterChooserFooter = this.showSubfilterChooserFooter || false;

		// Continue with collection initiation
		this.start_thread_getting(threadType);


		this.render_total_count();

	},

	beforeClose: function(){
		// empty
	},

	// Custom close function for .all
	close: function(){
		console.log('closing Views.Inbox_Base (no .close for custom inbox view)');

		// // unbind
		// App.Events.off('new_email',this.refresh_and_render_threads);

		// // Stop listening
		// Api.Event.off(this.cacheListener);

	},

	set_scroll_position: function(){
		var that = this;
		
		// Set last scroll position
		this.last_scroll_position = this.$('.data-lsp').scrollTop();
		this.$el.attr('last-scroll-position',this.last_scroll_position);

	},

	start_thread_getting: function(threadType){
		var that = this;

		var useContext = {
			this: this,
			threadType: threadType
		};

		that.useCollection.on('reset', this.reset_threads, useContext); // completely changed collection (triggers add/remove)
		that.useCollection.on('sync', this.sync_threads, useContext); // completely changed collection (triggers add/remove)
		that.useCollection.on('add', this.add_thread, useContext); // added a new ThreadId
		that.useCollection.on('remove', this.remove_thread, useContext); // removed a ThreadId
		that.useCollection.on('change', this.change_thread, useContext); // somehow one changed?
		that.useCollection.fetchDefault(); // trigger record retrieving

		// Start the CacheWatcher for Delayed threads
		// - listening for events that impact the Threads we have
		// - pre-updating the cache, basically
		// - doesn't fire update events though, only if the cache is requested the next time

		// See if a cacheWatcher is already running
		// - start it if it is not running
		// if(!App.CacheWatcher.DelayedThreads){
			// need to start it (should already be started?)
		// }

		// This'll run until it get's closed, so I guess it might update the cache in the background?
		that.cacheListener = Api.Event.on({
			event: ['Thread.action','Email.new']
		},function(result){
			console.warn('Fetching new because Thread.action or Email.new');
			// App.Utils.Notification.debug.temp('Fetching delayed, silently');
			window.setTimeout(function(){
				console.log('cacheListener fired');
				// go through "waiting_to_remove"
				// _.each(that._waitingToRemove, function(elem, i){
				// 	// // Remove Thread's subView
				// 	// console.log('removing subview');
				// 	// console.log(elem);
				// 	// console.log(that._subViews);

				// 	// // Get subview to remove
				// 	// that._subViews = _(that._subViews).without(elem);
				// 	// $(elem.el).remove();

				// });

				// that.delayedCollection.fetchDelayed();

				// that.useCollection.fetchDefault();
				that.trigger('refresh',that.currentFilter);

			},500); // wait 3 seconds before doing our .fetch (unclear why we are waiting?)
		});

		// Listen for refresh request
		this.on('refresh',this.refresh, this);

		// Listen for check_multi_select
		this.on('check_multi_select',this.multi_options, this);

		// Listen to local thread action
		// - delay
		// - done
		App.Events.on('Thread.done',function(thread_id){
			// Trigger the mass_action for animation
			// - might not actually affect any threads, but doesn't hurt
			that.mass_action('done', [thread_id]);
		}, this);
		App.Events.on('Thread.delay',function(thread_id, wait, wait_text){
			// Trigger the mass_action for animation
			// - might not actually affect any threads, but doesn't hurt
			that.mass_action('delay', [thread_id], wait, wait_text);
		}, this);

	},

	resort: function(){
		// Re-sort using TinySort
		var that = this;

		that.$('.thread').tsort({
			attr: 'data-id',
			order: 'asc'
		});

	},

	refresh: function(use_filter, sub_filter){
		var that = this;
		// Asked to refresh the page
		// - clear any missing elements, add any that need to be added
		// - it should look nice while adding/removing! 

		// Refresh gets called a lot
		console.info("REFRESHING");
		console.log(use_filter);

		var newFilter = '';

		if(use_filter == undefined){
			// Not passed any, use "normal"
			newFilter = "normal";
			sub_filter = undefined;

			// un-active the "Due" and "Later" buttons
			that.$('.toggle-due-later').removeClass('active');
			that.$('.toggle-waiting').removeClass('active');


		} else {
			newFilter = use_filter;
		}

		// go through "waiting_to_remove"
		that.remove_waitingToRemove();

		// Changed the filter?
		if(newFilter != this.currentFilter){
			// Changing the filter ("normal" to "due" or "later")

			// reset the collection to zero items
			// - this should also deplete the views?
			_.each(that._subViews, function(sv, i){
				sv.close();
			});
			that.useCollection.reset();

			// run another search using that filter? 
			this.currentFilter = newFilter;

			this.threadType = newFilter;
		} else {

			// At inbox zero?
			if(that.useCollection.length == 0){
				that.check_inbox_zero();
			}

		}

		// Trigger fetches
		//  - using a different filter (due, later)
		var options = {};
		if(newFilter != "normal"){
			console.info('currentFilter exists');
			options.filter = newFilter;
			options.sub_filter = sub_filter;
		}

		// Fetch new filter
		window.setTimeout(function(){
			that.useCollection.fetchDefault(options);
			that.render_total_count(true);
		}, 100);

		// Re-sort
		that.useCollection.sort();

		// Re-sort (doesn't hurt if there are none, right?)
		that.resort();

		// Emit checker for multi-select
		this.trigger('check_multi_select');

		// Hide "all" options
		that.$('#dk_container_options').removeClass('dk_open');

		// // Recheck count
		// this.checkCount();

		// // Print out number of views
		// console.log('number of views_1_');
		// console.log(that.useCollection.length);

		return;

	},

	// refresh_fetch: function(){
	// 	// Fetch new emails after a refresh
	// 	var that = this;

	// 	// Trigger fetches
	// 	that.useCollection.fetchDefault();

	// 	// At inbox zero?
	// 	if(that.useCollection.length == 0){
	// 		that.check_inbox_zero();
	// 	}

	// 	// Print out number of views
	// 	console.log('number of views_2_');
	// 	console.log(that.useCollection.length);

	// },

	toggle_due_later: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// Toggle displaying "Due Now" or "Later" (or neither)

		// Already active?
		// - trigger a refresh?
		if($(elem).hasClass('active')){
			// // Already active, so going back to "normal" view (same as pressing the "normal" button again)
			// // - err, actually we should do a "refresh" right?
			// this.refresh(true); // passing the refresh has "due" or "later"

		} else {
			// Now active, so de-press the other filter (Due/Later) button
			$(elem).parent().find('.btn').removeClass('active');
			// Add .active to this button
			$(elem).addClass('active');

			// // Switch view to this one
			// if($(elem).attr('data-action') == "due"){
			// 	// "now"
			// 	//  - shows ONLY Due Now
			// 	that.currentFilter = "due";
			// 	this.refresh(true);

			// } else {
			// 	// "later"
			// 	// - shows ONLY Due Later
			// 	that.currentFilter = "later";
			// 	this.refresh(true);

			// }

		}
		// $(elem).addClass('active');
		this.refresh($(elem).attr('data-action'));

		return false;
	},

	toggle_label: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// Toggle displaying "Due Now" or "Later" (or neither)

		// Already active?
		// - trigger a refresh?
		if($(elem).hasClass('active')){
			// // Already active, so going back to "normal" view (same as pressing the "normal" button again)
			// // - err, actually we should do a "refresh" right?
			// this.refresh(true); // passing the refresh has "due" or "later"

		} else {
			// Now active, so de-press the other filter (Due/Later) button
			$(elem).parent().find('.btn').removeClass('active');
			// Add .active to this button
			$(elem).addClass('active');

			// // Switch view to this one
			// if($(elem).attr('data-action') == "due"){
			// 	// "now"
			// 	//  - shows ONLY Due Now
			// 	that.currentFilter = "due";
			// 	this.refresh(true);

			// } else {
			// 	// "later"
			// 	// - shows ONLY Due Later
			// 	that.currentFilter = "later";
			// 	this.refresh(true);

			// }

		}
		// $(elem).addClass('active');
		this.refresh($(elem).attr('data-action'), $(elem).attr('data-label'));

		return false;
	},

	reset_threads: function(threads, options){
		var that = this; // not the view, passing context to 'add'

		// // Should remove all existing views?
		// // - yes?

		// console.log('reset threads');

		// // Add each Thread object
		// // - passes individual Thread model
		// that.useCollection.each(that.add_thread, this);

		// console.log('reset delayed');
	},

	sync_threads: function(threads, options){
		var that = this.this; // view

		console.log('sync_delayed_threads');

		// Empty?
		if(that.useCollection.length == 0){
			// alert('both zero');
			// console.warn('zero1');
			// that.check_inbox_zero();
		}

		that.check_inbox_zero();

		// Scroll to bottom
		that.scroll_to_bottom = true;

	},

	add_thread: function(thread){
		var that = this.this,
			threadType = that.threadType;

		// Got a new Thread._id, so we need to go get the corresponding ThreadFull model
		console.log('add_thread');

		// Add to the DOM
		that.$('.inbox_zero').remove();

		// Get index (position) of this Thread
		var idx = that.useCollection.indexOf(thread);

		// Create the View
		thread.dv = new App.Views.SubCommonThread({
			model : thread,
			// threadType: threadType, // NEED TO ADD THREADTYPE!!! TODO
			idx_in_collection: idx,
			fadein: true,
			parentView: that
		});

		var dvView = thread.dv.render().el;

		// Add to the correct place
		// - not actually rendering yet though
		var prev = that.$('.all_threads').find('.thread:eq('+idx+')');
		// prev = that.$('li:eq(' + idx + ')');
		console.log('prev');
		console.log(prev);
		if (prev.length > 0) {
			prev.after(dvView); // render after
		} else {
			that.$('.all_threads').prepend(dvView);
		}

		// Add to subViews
		that._subViews.push(thread.dv);

		// Re-sort the views we have
		that._subViews = _.sortBy(that._subViews,function(sV){
			return sV.options.idx_in_collection;
		});






		// Full Thread
		thread.Full = new App.Models.ThreadFull({
			_id: thread.toJSON()._id
		});


		// Checking if the Thread is ready to be displayed
		// - seeing if it actually should be displayed too
		thread.on('check_display_ready', function(){
			var that = this.this;

			console.log('checking display ready');

			// Must have Full ready
			if(!thread.FullReady || !thread.EmailReady){
				// console.warn('thread.check_display_ready = not ready');
				return;
			}
			// Already rendered this Thread?
			if(thread.Rendered){
				// Show the change in the view
				console.warn('Already rendered (need to change the view!)');
				return;
			}
			thread.Rendered = true;

			// Fire the render_ready on the dvView
			thread.dv.trigger('render_ready');

			// Render refresh
			that.trigger('refresh',that.currentFilter);

			// Scroll to bottom
			that.$('.scroller').scrollTop(10000);


		}, this);

		thread.on('rerender', function(){
			// Something changed, need to re-render
			var that = this.this;

			console.log('in rerender');

			// Must have already rendered the thread
			if(that._rendered){
				// See if the View is already displayed
				console.log('view already displayed?');
				// that.$('.all_threads').append(dv.render().el);
			}
		}, this);

		// Listen for "change" event
		thread.Full.on('change', function(threadFull){
			// Mark thread as ready
			// - this fires immediately if anything is cached
			// - otherwise it fires if something is different from the cached version
			console.log('in change');
			if(!thread.FullReady){
				thread.FullReady = true;
				thread.trigger('check_display_ready');
			}
		}, this);

		thread.Full.fetchFull();

		// Emails for Thread
		// - we want to know after all the emails have been loaded for the Thread
		thread.Email = new App.Collections.EmailsFull();

		thread.Email.on('reset', function(){
			if(!thread.EmailReady){
				thread.EmailReady = true;
				thread.trigger('check_display_ready');
			}
		}, this); // completely changed collection (triggers add/remove)

		thread.Email.on('sync', function(Emails){
			// Fires after add/remove have completed?
			// console.info('EmailSync');

			if(Emails.length > 0 && !thread.EmailReady){
				thread.EmailReady = true;
				thread.trigger('check_display_ready');
			}
		}, this); // completely changed collection (triggers add/remove)

		thread.Email.on('add', function(emailFullModel){
			// console.log('EmailAdd');
			// console.log(emailFullModel.toJSON()._id);
		}, this); // added a new EmailFull

		thread.Email.on('remove', function(emailFullModel){
			// console.log('EmailRemove');
			// console.log(emailFullModel.get('id'));
		}, this); // remove a new EmailFull
		
		thread.Email.on('change', function(emailFullModel){
			console.log('EmailChange');
		}, this); // an email is slightly different now (re-render)
		
		// trigger EmailFull collection retrieving
		// console.info('ids1');
		// console.info(thread.get('_id'));
		thread.Email.fetch_by_thread_id({
			ids: [thread.get('_id')],
			cachePrefix: thread.get('_id')
		});

		// // Update count for number
		// that.checkCount();

	},

	checkCount: function(){
		var that = this;

		// Update with local data
		var eventData = {
			count: that.useCollection.length,
			type: that.threadType
		};
		App.Events.trigger('Main.UpdateCount', eventData);

		// Get the count according to the API
		this.useCollection.fetchCount()
			.then(function(countVal){

				var eventData = {
					count: countVal,
					type: that.threadType
				};
				App.Events.trigger('Main.UpdateCount', eventData);

			});

	},

	remove_thread : function(model) {
		var that = this.this;
		
		console.log('remove_thread');

		var viewToRemove = _(that._subViews).filter(function(cv) { return cv.model === model; });
		if(viewToRemove.length < 1){
			return;
		}
		viewToRemove = viewToRemove[0];

		// that._subViews[this.threadType] = _(that._subViews[this.threadType]).without(viewToRemove);
		console.log(viewToRemove);
		// Change the view's opacity:
		// - or change based on whatever happened to it?
		// - also depends on if it was a remote change, right? 
		$(viewToRemove.el).css('opacity', 0.8);

		// don't actually remove it?
		// - only remove it when refresh is called
		console.log('pushed here');
		that._waitingToRemove.push(viewToRemove);

		// if(that._rendered && viewToRemove){
		// 	$(viewToRemove.el).remove();
		// }

		// Update count for number
		var eventData = {
			count: that.useCollection.length,
			type: that.threadType
		};

		App.Events.trigger('Main.UpdateCount', eventData);

	},

	change_thread: function(thread){
		// Change triggered
		// - new email or something on the Thread

		// Trigger refresh of the view
		// - just as if re-rendering
		var that = this.this,
			threadType = this.threadType;

		// figure out the status of this guy
		// - we don't want to re-render if we just changed the view for it

		// trigger render_ready again
		console.log('changed thread!');
		console.log(thread);
		thread.dv.trigger('render_change');

	},

	all_emails: function(emails){
		var threadModel = this; // Thread Model

		console.log('all_emails triggered');
		console.log(emails);
		// console.log('THIS');
		// console.log(this.toJSON()); // json thread object
		if(_.size(emails) < 1){
			// No emails found for Thread
			// - don't show this Thread?
			console.log('less than 1');
			console.log();
		} else {
			// Trigger that the Thread is ready
			console.log("READY");
			this.trigger('ready_to_display', threadModel);
		}
		// emails.each(function(val){
		// 	console.log('val');
		// 	console.log(val);
		// });
	},

	reset_emails: function(){
		console.log('reset_emails');	
	},

	thread_ready: function(thread){
		var that = this;
	},

	toggle_all: function(ev){
		// Show/hide options for all
		var that = this,
			elem = ev.currentTarget;

		var $parent = this.$('#dk_container_options');
		console.log($parent);

		if($parent.hasClass('dk_open')){
			$parent.removeClass('dk_open');
		} else {
			$parent.addClass('dk_open');
		}

	},

	all_action: function(ev){
		// Clicked a button for actions on all (in current collection)

		var that = this,
			elem = ev.currentTarget;

		// Gather all the affected ones
		// - already in this collection, basically
		var incl_thread_ids = _.map(that.useCollection.toJSON(), function(col){
			return col._id;
		});

		// Hide options
		that.$('#dk_container_options').removeClass('dk_open');

		// return if no threads in collection
		if(incl_thread_ids.length < 1){
			// Whoops, none to do
			// that.$('#dk_container_options').removeClass('dk_open');
			return false;
		}

		// Run action based on button clicked
		switch($(elem).attr('data-action')){
			case "done":
				// Mark all as Done
				App.Plugins.Minimail.saveAsDone(incl_thread_ids);

				// Remove all
				that.mass_action('done', incl_thread_ids);

				break;
			case "due":
				if(that.threadType != "delayed"){
					that.after_multi_delay_modal(new Date(), 'Now Due', incl_thread_ids);
				}
				break;
			case "wait_reply":
				alert('wating for reply not ready yet');
				break;
			case "few_hours":
				that.after_multi_delay_modal( (3).hours().fromNow() , '3 Hours', incl_thread_ids);
				break;
			case "pick_time":
				
				// Display delay_modal Subview
				var subView = new App.Views.DelayModal({
					context: that,
					onComplete: function(wait, save_text){
						that.after_multi_delay_modal(wait, save_text, incl_thread_ids);
					}
				});
				$('body').append(subView.$el);
				subView.render();

				break;
		}
		
		return false;
	},

	multi_options: function(){
		// Displays (or hides) multi-select options
		var that = this;

		// Add backbutton tracking if we are displaying the multi_options

		// See if there are any views that are multi-selected
		if(this.$('.multi-selected').length > 0){

			this.show_multi_options = true;
			this.$('.multi_select_options').removeClass('no_multi_select');

			this.$('.lot_options_flag').addClass('nodisplay');
			this.$('.footer2').addClass('nodisplay');
		} else {
			this.show_multi_options = false;
			this.$('.multi_select_options').addClass('no_multi_select');

			this.$('.lot_options_flag').removeClass('nodisplay');
			this.$('.footer2').removeClass('nodisplay');
		}

		// // On or off?
		// // if(this.$('.all_threads').hasClass('multi-select-mode')){
		// if(this.show_multi_options){
		// 	// Just turned on
		// 	this.$('.multi_select_options').removeClass('no_multi_select');
		// } else {
		// 	// Turned off
		// 	this.$('.multi_select_options').addClass('no_multi_select');
		// }
		
		return false;
	},

	multi_deselect: function(ev){
		// De-select any that are selected
		var that = this;

		// Remove selected
		$('.all_threads .multi-selected').removeClass('multi-selected')

		// Remove multi-select mode
		$('.all_threads').removeClass('multi-select-mode')

		// Call multi-options
		that.multi_options();

		return false;
	},

	multi_done: function(ev){
		// Mark all selected as Done
		var that = this,
			elem = ev.currentTarget;

		// Get all selected
		// - get Thread._id
		// - make sure to not select ones that are already processed

		// Get all elements above this one
		// - and including this one
		// - but not ones that have already been processed (wouldn't anyways)

		var incl_thread_ids = [];
		$('.multi-selected').each(function(i, threadElem){
			// Wait for this element to get triggered
			var $threadParent = $(threadElem).parent();
			incl_thread_ids.push($threadParent.attr('data-id'));
			// if(incl_thread_ids.length > 0){
			// 	// Already found this element
			// 	incl_thread_ids.push($(threadElem).attr('data-id'));
			// } else if($(threadElem).attr('data-id') == that.options.threadid){
			// 	incl_thread_ids.push($(threadElem).attr('data-id'));
			// }
		});

		// Make sure some are included
		if(!incl_thread_ids || incl_thread_ids.length < 1){
			alert('None Selected');
			return false;
		}
		
		// Run update command
		// - updates them all at once
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
			Api.event({
				data: {
					event: 'Thread.action',
					obj: {
						'_id' : tmp_thread_id, // allowed to pass a thread_id here
						'action' : 'unlabel',
						'label' : 'WaitingOnMe'
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
			Api.event({
				data: {
					event: 'Thread.action',
					obj: {
						'_id' : tmp_thread_id, // allowed to pass a thread_id here
						'action' : 'unlabel',
						'label' : 'WaitingOnOther'
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
		
		// Take mass action
		that.mass_action('done', incl_thread_ids);

		// De-select
		this.multi_deselect();

		return false;
	},

	multi_delay: function(ev){
		// Delay messages
		// - displayes DelayModal
		// - trigger animation (mass_action)

		var that = this,
			elem = ev.currentTarget;

		// Get selected Threads
		var incl_thread_ids = [];
		$('.multi-selected').each(function(i, threadElem){
			// Wait for this element to get triggered
			var $threadParent = $(threadElem).parent();
			incl_thread_ids.push($threadParent.attr('data-id'));
			// if(incl_thread_ids.length > 0){
			// 	// Already found this element
			// 	incl_thread_ids.push($(threadElem).attr('data-id'));
			// } else if($(threadElem).attr('data-id') == that.options.threadid){
			// 	incl_thread_ids.push($(threadElem).attr('data-id'));
			// }
		});

		// Make sure some are included
		if(!incl_thread_ids || incl_thread_ids.length < 1){
			alert('None Selected (error?)');
			return false;
		}

		// Hide multi-options
		$('.multi_select_options').addClass('nodisplay');

		// Display delay_modal Subview
		var subView = new App.Views.DelayModal({
			context: that,
			onComplete: function(wait, save_text){
				that.after_multi_delay_modal(wait, save_text, incl_thread_ids);
			}
		});
		$('body').append(subView.$el);
		subView.render();

		return false;

	},

	after_multi_delay_modal: function(wait, save_text, incl_thread_ids){
		var that = this;

		// Show multi-options
		this.$('.multi_select_options').removeClass('nodisplay');

		// Return if a null value was sent through by DelayModal
		if(!wait){
			return false;
		}

		// var incl_thread_ids = [];
		// $('.multi-selected').each(function(i, threadElem){
		// 	// Wait for this element to get triggered
		// 	var $threadParent = $(threadElem).parent();
		// 	incl_thread_ids.push($threadParent.attr('data-id'));
		// });

		// // Make sure some are included
		// if(!incl_thread_ids || incl_thread_ids.length < 1){
		// 	alert('None Selected');
		// 	return false;
		// }

		console.log(JSON.stringify(incl_thread_ids));

		// Figure out delay in seconds
		var now_sec = parseInt(new Date().getTime() / 1000);
		var delay_time = wait.getTime() / 1000;
		var delay_seconds = parseInt(delay_time - now_sec);
		var in_seconds = now_sec + delay_seconds;

		// App.Plugins.Minimail.saveNewDelay(this.threadid,in_seconds,delay_seconds);

		// Fire event to be run in the future when these are due
		// - causes a bunch of events to fire at one time?
		// - what if one of the due ones cancels?? (breaks it)
		var runEvent = function(){
			Api.event({
				data: {
					event: 'Minimail.wait_until_fired',
					delay: delay_seconds,
					obj: {
						text: "Emails are due"
					}
				},
				error: function(response){
					// Failed to save, need to try again with a better connection
					// alert('Failed saving, please try again');

					// Emit "refresh" event
					that.trigger('refresh', that.currentFilter);

					// Re-run the event if it was a timeout
					if(response.status == 504 || response.status == 0){
						console.log('TIMEOUT');
						runEvent();
					} else {
						alert('Failed triggering event');
					}

					return false;
				},
				success: function(response){
					
					console.log('Success from Api.event');
					response = JSON.parse(response);

					console.log(JSON.stringify(response));

					if(response.code != 200){
						// Failed launching event
						alert('Failed launching event');
						dfd.reject(false);
						return;
					}

				}
			});
		}
		runEvent();


		// Update data
		var updateData = {
			model: 'Thread',
			conditions: {
				'_id' : {
					'$in' : incl_thread_ids
				}
			},
			multi: true, 
			paths: {
				"$set" : {
					"app.AppPkgDevMinimail.wait_until" : in_seconds,
					// "app.AppPkgDevMinimail.wait_until_event_id" : response.data.event_id,
					"app.AppPkgDevMinimail.done" : 0
				}
			}
		};

		// - skipping saving the event_id
		Api.update({
			data: updateData,
			success: function(response){
				response = JSON.parse(response);
				if(response.code != 200){
					// Shoot
					alert('Failed updating threads!');
				}
				// console.log(JSON.stringify(updateData));
				// console.log(JSON.stringify(response));
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

		// Initiate mass action
		// - even if only 1 thing was changed
		that.mass_action('delay', incl_thread_ids, wait, save_text);

		// De-select
		this.multi_deselect();

		return false;

	},

	multi_waiting: function(ev){
		// Mark all selected as Waiting on Me/Other
		// - or remove the labels, if they all have it

		// Also removes from the Inbox

		// If we're in the WaitingOn__ query, then refreshing will remove it (but we don't do the removing straight away)

		var that = this,
			elem = ev.currentTarget;

		// Figure out which label to apply
		var waitingLabel = '';
		if($(elem).attr('data-action') == 'multi-waiting-on-me'){
			waitingLabel = 'WaitingOnMe';
		} else {
			waitingLabel = 'WaitingOnMe';
		}

		// Get all selected
		// - get Thread._id
		// - make sure to not select ones that are already processed

		var incl_thread_ids = [];
		$('.multi-selected').each(function(i, threadElem){
			// Wait for this element to get triggered
			var $threadParent = $(threadElem).parent();
			incl_thread_ids.push($threadParent.attr('data-id'));
		});

		// Make sure some are included
		if(!incl_thread_ids || incl_thread_ids.length < 1){
			alert('None Selected');
			return false;
		}
		
		// Run labelling commands
		_.each(incl_thread_ids, function(thread_id){

			// Label
			Api.event({
				data: {
					event: 'Thread.action',
					obj: {
						'_id' : thread_id,
						'action' : 'label',
						'label' : waitingLabel
					}
				},
				success: function(resp){
					// pass
				}
			});

			// Archive event
			Api.event({
				data: {
					event: 'Thread.action',
					obj: {
						'_id' : thread_id,
						'action' : 'archive'
					}
				},
				success: function(resp){
					// pass
				}
			});

		});
		
		// Toast
		App.Utils.Notification.toast('Marked as ' + App.Utils.cc_spaces(waitingLabel));

		// De-select
		this.multi_deselect();

		return false;
	},

	refresh_data: function(){
		// Refresh the data for the view

	},

	mass_action: function(action, incl_thread_ids, wait, wait_save_text){
		// Mass animation on previous items
		// - action: done, delay (with additional info about delay datetime)
		// - type: undecided or delayed
		// - seconds: time in seconds to mark against older


		// "type" no longer used because ids are specified

		var that = this;

		// seconds = parseInt(seconds);
		// if(!seconds){
		// 	// Shoot
		// 	alert('bad seconds in mass_action');
		// 	return false;
		// }

		var waitTime = 0;
		$('.thread').each(function(i, threadElem){

			// Choosing either last_message_datetime_sec or wait_until
			// - depends on undecided or delayed
			
			if(_.contains(incl_thread_ids, $(threadElem).attr('data-id'))){
				// Affected this one!

				console.log('looking at views: ' + that.threadType);
				var viewToRemove = _(that._subViews).filter(function(cv) { 
					console.log(cv.model.get('_id'));
					return cv.model.get('_id') === $(threadElem).attr('data-id'); 
				});

				// Returned an array, damnit
				if(viewToRemove.length > 0){
					viewToRemove = viewToRemove[0];
				} else {
					// Didn't find the view
					console.log('Did not find the view in ' + that.threadType);
					return;
				}

				// Sometimes is null
				// - dunno why the fuck
				if(!viewToRemove || viewToRemove == null){
					console.log('ERROR - NULL viewToRemove');
					console.log(viewToRemove);
					return;
				}

				// see if .el is also valid
				if(!viewToRemove.el){
					console.log('ERROR2 - Null viewToRemove.el');
					console.log(viewToRemove);
					console.log(viewToRemove.el);
					return;
				}

				console.log('found view');
				console.log($(threadElem).attr('data-id'));
				console.log(viewToRemove);

				// Change the view's opacity:
				$(viewToRemove.el).css('opacity', 0.8);

				// don't actually remove it?
				// - only remove it when refresh is called
				that._waitingToRemove.push(viewToRemove);



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

				waitTime += 10;

			}

		});

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


	render_structure: function(){
		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_all_structure');

		// Write HTML
		this.$el.html(template({
			threadType: this.threadType,
			showDelayChooserFooter: this.showDelayChooserFooter,
			showSubfilterChooserFooter: this.showSubfilterChooserFooter
		}));

		// // Resize the scrollable part (.all_threads)
		// this.resize_fluid_page_elements();
		// this.resize_scroller();

		return this;

	},

	render_threads: function(threads){
		
		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_all');

		// Write HTML
		this.$el.html(template(threads));
		
		// Resize the scrollable part (.all_threads)
		this.resize_fluid_page_elements();
		this.resize_scroller();

		// Scroll to bottom
		this.$('.scroller').scrollTop(10000);

		return this;
		
	},

	check_inbox_zero: function(){
		var that = this;
		// See if we should render inbox-zero
		window.setTimeout(function(){
			if(that.useCollection.length == 0){
				that.remove_waitingToRemove();
				that.render_zero();
			}
		},1000);

	},
	render_zero: function(){
		// Render the "inbox zero" screen
		var that = this;

		// Already rendered?
		// - happens when refreshing pretty often
		if(this.$('.inbox_zero').length > 0){
			return this;
		}

		// Template
		var template = App.Utils.template(this.zero_template);

		// Write HTML
		this.$el.prepend(template(this.threadType));

		// // Update count
		// that.checkCount();

		return this;
		
	},

	render_total_count: function(){
		var that = this;

		that.useCollection.fetchCount()
			.then(function(count){

				// Template
				that.$('.threads_total_count span.count').text(count);

			});

	},

	remove_waitingToRemove: function(){
		 var that = this;

		 console.log('Trying remove_waitingToRemove');
		_.each(this._waitingToRemove, function(elem, i){
			// Remove Thread's subView

			console.log('remove_waitingToRemove');
			// console.log(elem[0]);
			// console.log(elem);
			// console.log(elem.toString());
			// console.log(elem.el);
			// console.log(elem.el);

			// // Get subview to remove
			// that._subViews = _(that._subViews).without(elem[0]);

			// // Listen for transition end before removing the element entirely
			// $(elem[0].el).bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){
			// 	$(elem[0].el).remove();
			// });
			// $(elem[0].el).addClass('closing_nicely');

			// Get subview to remove
			that._subViews = _(that._subViews).without(elem);

			// Listen for transition end before removing the element entirely
			// $(elem.el).bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){
			// 	console.log("__looking to remove");
			// 	elem.remove();
			// });
			setTimeout(function(){
					elem.remove();
					$(elem.el).remove();
				},500);
			$(elem.el).addClass('closing_nicely');

		});

	},

	render: function() {
		var that = this;

		if(this._rendered){
			console.log('rendered');

			// Re-bind events
			this.delegateEvents()

			// Re-bind events for subViews
			_(that._subViews).each(function(v) {
				v.trigger('rebind');
			});

			// Remove _waitingToRemove things
			this.remove_waitingToRemove();

			// Resize the scrollable part (.all_threads)
			this.resize_fluid_page_elements();
			this.resize_scroller();

			// Scroll to bottom (yeah?)
			this.$('.scroller').scrollTop(10000);

			// Hide "all" options
			that.$('#dk_container_options').removeClass('dk_open');

			// Check inbox_zero
			this.check_inbox_zero();

			// Multi-select binding 
			// this.$('.all_threads').on('multi-change',that.multi_options); // now in view.events

			return this;
		}

		this._rendered = true;

		// Render initial body
		// - container, basically
		// this.render_init();
		this.render_structure();
		console.log('Rendering structure');

		// Render each of the views into the correct places

		// Undecided views first
		_(that._subViews).each(function(uv) {
			that.$('.all_threads').append(uv.render().el);
		});

		// Resize the scrollable part (.all_threads)
		this.resize_fluid_page_elements();
		this.resize_scroller();

		// Scroll to bottom
		this.$('.scroller').scrollTop(10000);

		// Multi-select
		// this.$('.all_threads').on('multi-change',that.multi_options); // now in view.events


		// // Delayed views second (at the bottom)
		// _(that._delayedViews).each(function(dv) {
		// 	this.$('.all_threads').append(dv.render().el);
		// });

		// // Refresh and render
		// this.refresh_and_render_threads();

		// App.Utils.Storage.get('delayed_threads_and_emails')
		// 	.then(function(val){
		// 		if(val){
		// 			// value exists, render
		// 			// Recombine threads
		// 			that.recombine_threads()
		// 				.then(function(threads){

		// 					// Render new Thread list
		// 					that.render_threads(threads);
		// 				});
		// 		} else {
		// 			// doesn't exist
		// 			// - already refreshing
		// 		}
		// 	});

		// How old is it?
		// Do we need to do a refresh?

		// View is based on what data we do have, and a view makes sure the new data is being found? 

		return this;
	}
});


// Base inbox view (dunno, now, later)
App.Views.Inbox_Normal = App.Views.Inbox_Base.extend({

	zero_template: 't_zero_inbox_normal',
	showDelayChooserFooter: false, // default true

	collection_init: function(){
		var that = this;

		// Set collection to use
		that.useCollection = new App.Collections.InboxNormal();

		// Return type of threads to display
		return 'inbox';
	},

});


// Waiting on me
App.Views.Inbox_WaitingOnMe = App.Views.Inbox_Base.extend({

	zero_template: 't_zero_waiting_on_me',
	showDelayChooserFooter: true,

	collection_init: function(){
		var that = this;

		// Set collection to use
		that.useCollection = new App.Collections.WaitingOnMe();

		// Return type of threads to display
		return 'me';
	},

});


// Waiting on somebody else
App.Views.Inbox_WaitingOnOther = App.Views.Inbox_Base.extend({

	zero_template: 't_zero_waiting_on_other',
	showDelayChooserFooter: true,

	collection_init: function(){
		var that = this;

		// Set collection to use
		that.useCollection = new App.Collections.WaitingOnOther();

		// Return type of threads to display
		return 'other';
	},

});


// Base inbox view (dunno, now, later)
App.Views.Inbox_Dunno = App.Views.Inbox_Base.extend({

	zero_template: 't_all_new_done',

	collection_init: function(){
		var that = this;

		// Set collection to use
		that.useCollection = new App.Collections.UndecidedThreads();

		// Return type of threads to display
		return 'undecided';
	},

});

// Base inbox view (dunno, now, later)
App.Views.Inbox_Now = App.Views.Inbox_Base.extend({

	zero_template: 't_all_due_done',
	showSubfilterChooserFooter: true,
	
	collection_init: function(){
		var that = this;

		// Set collection to use
		that.useCollection = new App.Collections.DelayedThreads();

		// Return type of threads to display
		return 'delayed';
	},

});

// Base inbox view (dunno, now, later)
App.Views.Inbox_Later = App.Views.Inbox_Base.extend({

	zero_template: 't_all_later_done',
	showSubfilterChooserFooter: true,

	collection_init: function(){
		var that = this;

		// Set collection to use
		that.useCollection = new App.Collections.LaterThreads();

		// Return type of threads to display
		return 'later';
	},

});

App.Views.SubSearchesEmail = Backbone.View.extend({
	
	className: 'thread no_text_select nodisplay',

	events: {

	},

	initialize: function(options) {
		var that = this;
		_.bindAll(this, 'render');
		_.bindAll(this, 'render_full');

		// Fade in?
		// if(this.options.fadein){
		// 	this.el.className = this.className + ' fade-in';
		// }

		// Have model?
		if(!this.model){
			console.log('==Missing model');
		} else {
			// console.log('model OK');
		}

		// Wait for trigger
		this.on('render_full',this.render_full, this);

	},

	render_full: function(){
		// Have the full one now
		var that = this;

		this.$el.attr('data-id',this.model.EmailFull.toJSON().attributes.thread_id);
		this.$el.attr('data-thread-type','searched');
		this.$el.removeClass('nodisplay');

		// Template
		var template = App.Utils.template('t_search_emails_email_results_item');
		
		this.$el.html(template(this.model.EmailFull.toJSON()));

		return this;
	},

	render: function(){
		// Rendering a placeholder
		var that = this;

		// Template
		var template = App.Utils.template('t_search_emails_email_results_item_loading');
		// console.log(template());

		this.$el.html(template());
		return this;
	}

});


App.Views.SubCommonThread = Backbone.View.extend({
	
	className: 'thread no_text_select',

	events: {
		
		'shorttap .thread-preview' : 'view_email',
		'longtap .thread-preview' : 'preview_thread',
		'click .thread-preview' : 'click_view_email'

	},

	initialize: function(options) {
		var that = this;
		_.bindAll(this, 'render');
		_.bindAll(this, 'after_delay_modal');
		_.bindAll(this, 'dragDone');
		_.bindAll(this, 'dragDelay');

		// Fade in?
		if(this.options.fadein){
			// this.el.className = this.className + ' fade-in';
		}

		// // threadType
		// // - gets set when the thread is loaded
		// this.threadType = this.options.threadType;

		// Have model?
		if(!this.model){
			console.log('==Missing model');
		} else {
			// console.log('model OK');
		}

		// Have parentView?
		this.parentView = this.options.parentView;

		// Listen for rebinding events
		this.on('rebind', this.rebind, this);

		// Listen for render_ready
		this.on('render_ready', this.render_ready, this);
		this.on('render_change', this.render_change, this);
	},

	beforeClose: function(){

	},

	rebind: function(){
		var that = this;

		// Re-bind the events

		this.delegateEvents();


		// Draggable
		if(usePg){

			this.$(".thread-preview").on('touchstart',App.Plugins.Minimail.thread_main.start);
			this.$(".thread-preview").on('touchmove',App.Plugins.Minimail.thread_main.move);
			this.$(".thread-preview").on('touchend',App.Plugins.Minimail.thread_main.end);
			this.$(".thread-preview").on('touchcancel',App.Plugins.Minimail.thread_main.cancel);

			// Was marked as Done
			this.$(".thread-preview").on('emitDone', this.dragDone);

			// Was delayed
			this.$(".thread-preview").on('emitDelay', this.dragDelay);

			
		} else {

			this.$(".thread-preview").on('mousedown',App.Plugins.Minimail.thread_main.start);
			this.$(".thread-preview").on('mousemove',App.Plugins.Minimail.thread_main.move);
			this.$(".thread-preview").on('mouseup',App.Plugins.Minimail.thread_main.end);
			this.$(".thread-preview").on('mouseleave',App.Plugins.Minimail.thread_main.cancel);
			
		}

		// React to the view being done or delayed
		// this.$(".thread-preview").on('done_or_delay');


	},

	after_delay_modal: function(wait, save_text){
		alert('How did you get here?');
		var that = this;

		// Show multi-options
		$('.multi_select_options').removeClass('nodisplay');

		// Return if a null value was sent through by DelayModal
		if(!wait){
			return false;
		}

		var incl_thread_ids = [];
		$('.multi-selected').each(function(i, threadElem){
			// Wait for this element to get triggered
			var $threadParent = $(threadElem).parent();
			incl_thread_ids.push($threadParent.attr('data-id'));
		});

		// Make sure some are included
		if(!incl_thread_ids || incl_thread_ids.length < 1){
			alert('None Selected');
			return false;
		}

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

				console.log(JSON.stringify(response));

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

		// Initiate mass action
		// - even if only 1 thing was changed
		that.mass_action('delay', incl_thread_ids, wait, save_text);

		// De-select
		this.multi_deselect();

		return false;

	},

	dragDone: function(){
		var that = this;
			// elem = ev.currentTarget;

		// Tell the parent that this thread was dragged to marked as Done
		this.emit('dragDone');

	},

	dragDelay: function(details){
		var that = this;
			// elem = ev.currentTarget;

		// Tell the parent that this thread was dragged and delayed (delay details included)
		this.emit('dragDelay', details);
	},

	subViewThreadOptions: {},
	preview_thread: function(ev){
		// Preview a thread
		var that = this,
			elem = ev.currentTarget;

		var threadElem = $(elem).parents('.thread');
		
		// In multi-select mode?
		if(this.parentView.show_multi_options){
		// if(this.$el.parents('.all_threads').hasClass('multi-select-mode')){
			
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
		this.preview_thread(ev);
		// this.view_email(ev);

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
		if(this.parentView.show_multi_options){
		// if(this.$el.parents('.all_threads').hasClass('multi-select-mode')){
			
			// Already selected?
			// alert($(elem).attr('class'));
			if($(elem).hasClass('multi-selected')){
				
				// un-selected
				$(elem).removeClass('multi-selected');

				// Anybody else selected?
				// - triggers the "checker" on the parentView
				console.info('triggering check_multi_select');
				that.parentView.trigger('check_multi_select');
				// if($('.multi-selected').length < 1){
				// 	// turn off multi-select mode?
				// 	$(elem).parents('.all_threads').removeClass('multi-select-mode');
				// 	that.parentView.trigger('multi-change');
				// }

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

	render_change: function(){
		// This Thread has had a change occur on it
		// - don't want to prevent .dragright stuff to be diminished

		if(this.$el.hasClass('tripped') || this.$el.hasClass('finished')){
			// already triggered, no need to refresh it
			// console.log('ALREADY FINISHED');
		} else {
			// console.log('NOT ALREADY FINISHED');
			this.render_ready();
		}
	},

	render_ready: function(){
		var that = this;

		this.$el.removeClass('preloading');

		// Determine ThreadType
		var threadType = 'normal';
		var jThread = this.model.Full.toJSON();
		try {
			if(jThread.app.AppPkgDevMinimail.done != 1){
				// Has a wait_until?
				if(jThread.app.AppPkgDevMinimail.wait_until){
					threadType = 'due';
					// Not actually due yet? 
					var now = new Date();
					if(jThread.app.AppPkgDevMinimail.wait_until > now.getTime() / 1000){
						threadType = 'later';
					}
				}
			}
		} catch(err){
			// Fields did not exist
		}

		this.$el.attr('data-id', this.model.get('_id')); // fix, Thread._id
		this.$el.attr('data-thread-type', threadType);
		this.$el.attr('data-sort', this.model.toJSON().attributes.last_message_datetime_sec);

		// Done trumps all


		// Data for template
		// console.log(this.model.Email.toJSON());
		var data = {
			Thread: jThread,
			Email: this.model.Email.toJSON(),
			threadType: threadType
		};

		// console.log(data);

		// Template
		var template = App.Utils.template('t_all_single_thread');

		// Write HTML
		this.$el.html(template(data));

		// Draggable
		if(usePg){

			this.$(".thread-preview").on('touchstart',App.Plugins.Minimail.thread_main.start);
			this.$(".thread-preview").on('touchmove',App.Plugins.Minimail.thread_main.move);
			this.$(".thread-preview").on('touchend',App.Plugins.Minimail.thread_main.end);
			this.$(".thread-preview").on('touchcancel',App.Plugins.Minimail.thread_main.cancel);
			
		} else {

			this.$(".thread-preview").on('mousedown',App.Plugins.Minimail.thread_main.start);
			this.$(".thread-preview").on('mousemove',App.Plugins.Minimail.thread_main.move);
			this.$(".thread-preview").on('mouseup',App.Plugins.Minimail.thread_main.end);
			this.$(".thread-preview").on('mouseleave',App.Plugins.Minimail.thread_main.cancel);
			
		}


		return this;
	}, 

	render: function(){
		// Render a "loading" thingy
		var that = this;

		var template = App.Utils.template('t_loading_common_thread');

		this.$el.addClass('preloading');
		this.$el.html(template());

		return this;


	}

});


App.Views.SubLeisureFilter = Backbone.View.extend({
	
	className: 'leisure_item no_text_select',

	events: {
	},

	initialize: function(options) {
		var that = this;
		_.bindAll(this, 'render');

		// Have model?
		if(!this.model){
			console.log('==Missing model');
		} else {
			// console.log('model OK');
		}

		// Set data-id attribute
		// this.$el.attr('data-id',this.model.get('_id'));

	},

	render: function(){
		var that = this;

		this.$el.attr('data-id', this.model.get('_id'));

		// Data for template
		var data = {
			LeisureFilter: this.model.Full.toJSON(),
			Threads: this.model.Threads.toJSON(),
			ThreadUnreadCount: this.model.ThreadUnreadCount
		};

		// console.info('leisure data');
		// console.log(data);

		// Template
		var template = App.Utils.template('t_leisure_item');

		// Write HTML
		this.$el.html(template(data));

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

	_subLeisureViews: [],
	initialize: function(options) {
		var that = this;
		_.bindAll(this, 'render');
		_.bindAll(this, 'refresh_and_render_list');

		// removal containers
		// - for when "refresh" is called
		this._waitingToRemove = [];

		// Create LeisureFilters Collection
		// - should this be Global?
		that.LeisureFilters = new App.Collections.LeisureFilters();
		that.LeisureFilters.on('reset', this.reset_filters, this); // completely changed collection (triggers add/remove)
		that.LeisureFilters.on('sync', this.sync_filters, this); // completely changed collection (triggers add/remove)
		that.LeisureFilters.on('add', this.add_filter, this); // added a new ThreadId
		// that.LeisureFilters.on('remove', this.remove_delayed_thread, delayContext); // removed a ThreadId
		that.LeisureFilters.on('change', function(filterchange){
			console.log('change_filters');
			console.log(filterchange);

		}, this);
		that.LeisureFilters.on('sort', this.sort_filters, this);
		// that.LeisureFilters.on('sync', function(sortchange){
		// 	console.log('sync_filters');
		// 	console.log(sortchange);

		// }, this);
		that.LeisureFilters.fetchList(); // trigger record retrieving


		// This'll run until it get's closed, so I guess it might update the cache in the background?
		that.cacheListener = Api.Event.on({
			event: ['Thread.action','Email.new']
		},function(result){
			console.warn('Refreshing LeisureList');
			// App.Utils.Notification.debug.temp('Fetching delayed, silently');
			window.setTimeout(function(){
				that.trigger('refresh',that.currentFilter);
			},3000); // wait 3 seconds before doing our .fetch
		});

		// Listen fo refresh
		this.on('refresh',this.refresh, this);


		// // CacheWatcher (listener)

		// // This'll run until it get's closed, so I guess it might update the cache in the background?
		// that.cacheListener = Api.Event.on({
		// 	event: ['Thread.action','Email.new']
		// },function(result){
		// 	console.warn('Fetching new because Thread.action or Email.new');
		// 	// App.Utils.Notification.debug.temp('Fetching delayed, silently');
		// 	that.delayedCollection.fetchDelayed();
		// 	that.undecidedCollection.fetchUndecided();
		// });

		// // Listen fo refresh
		// this.on('refresh',this.refresh, this);

	},

	close: function(){
		// Custom close function
		console.log('closing leisure');
	},

	refresh: function(){
		var that = this;
		// Asked to refresh the page
		// - clear any missing elements, add any that need to be added
		// - it should look nice while adding/removing! 

		that.LeisureFilters.fetchList();

		// go through "waiting_to_remove"
		_.each(this._waitingToRemove, function(elem, i){
			// Remove Thread's subView

			// Get subview to remove
			that._subLeisureViews[elem[0]] = _(that._subLeisureViews[elem[0]]).without(elem[1]);

			// Listen for transition end before removing the element entirely
			$(elem[1].el).bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){
				$(elem[1].el).remove();
			});
			$(elem[1].el).addClass('closing_nicely');

		});


	},

	reset_filters: function(LeisureFilter){
		// Iterate over each
		console.log('reset_filters');

		// conduct 'add'
		that.LeisureFilters.each(this.add_filters, this);

	},

	sort_filters: function(LeisureFilters){
		var that = this;
		console.info('sort_filters');
		LeisureFilters.each(function(LeisureFilter){
			// See if it is in the correct place
			var current_view_index = -1;
			_.each(that._subLeisureViews, function(elem, i){
				if(elem.model == LeisureFilter){
					// console.log('foundview');
					current_view_index = i;
				}
			});	
			if(current_view_index == -1){
				// Unable to find, "add" will take care of it
				// console.warn('not in view');
				return;
			}

			// Get current index too
			var current_coll_index = LeisureFilters.indexOf(LeisureFilter);

			try {
				// Has the position of this view changed?
				if(current_view_index != current_coll_index){
					// Yes, it has changed position
					// - move it to the correct position in the list

					// changing one view might cause the other ones to fall into place correctly
					// - or it might fuck everything up
					//		- just do a simple re-render? (reset)

					// console.warn('changed position');
					// console.log(current_view_index);
					// console.log(current_coll_index);

					// get View
					var theView = that._subLeisureViews[current_view_index];

					// delete previous position
					that._subLeisureViews.splice(current_view_index,1); // only deleting the reference??

					// add it back to the view in the correct position
					that._subLeisureViews.splice(current_coll_index, 0, theView);

					// Render it in the correct spot in the page
					if(current_coll_index == 0){
						console.log('new index is zero');
					} else {
						// console.log('not zero');
						// console.dir(that.$('.all_threads').find('.leisure_item:nth-of-type('+ current_coll_index +')'));
						// console.dir(that.$('.all_threads').find('.leisure_item:nth-of-type('+ (current_coll_index + 1) +')'));
						// console.dir(that.$('.all_threads').find('.leisure_item:nth-of-type('+ (current_coll_index - 1) +')'));
						that.$('.all_threads').find('.leisure_item:nth-of-type('+ current_coll_index +')').after(theView.el);
					}

				} else {
					// console.log('no position change');
				}
			} catch(err){
				console.log(err);
			}
			
		} , this);
	},

	sync_filters: function(LeisureFilters){

	},

	add_filter: function(LeisureFilter){
		var that = this;

		LeisureFilter.Full = new App.Models.LeisureFilterFull({
			_id: LeisureFilter.toJSON()._id
		});

		// Listen for "change" event
		LeisureFilter.Full.on('change', function(filterFull){
			// Mark filter as ready to display
			// - this fires immediately if anything is cached
			// - otherwise it fires if something is different from the cached version
			if(!LeisureFilter.FullReady){
				LeisureFilter.FullReady = true;
				LeisureFilter.trigger('check_display_ready');
			}
		}, this);

		LeisureFilter.Full.fetchFull();


		LeisureFilter.on('check_display_ready', function(){

			// LeisureFilter is ready to be displayed

			// Must have Full ready
			if(!LeisureFilter.FullReady || !LeisureFilter.ThreadsReady){
				// console.warn('thread.check_display_ready = not ready');
				return;
			}
			// Already rendered this Thread?
			if(LeisureFilter.Rendered){
				// Show the change in the view
				console.warn('Already rendered (need to change the view!)');
				return;
			}
			LeisureFilter.Rendered = true;
			
			// Get UnreadCount

			// Only show 5 per Filter
			var unreadCount = 0;
			LeisureFilter.Threads.each(function(Thread){
				var tmpThread = Thread.toJSON();
				// console.log(tmpThread);
				try {
					if(tmpThread.attributes.read.status != 1){
						unreadCount += 1;
					}
				} catch(err){
					unreadCount += 1;
				}
			});

			LeisureFilter.ThreadUnreadCount = unreadCount;

			// Get intended index (position) of this LeisureFilter
			var idx = that.LeisureFilters.indexOf(LeisureFilter);

			// Create the View
			var dv = new App.Views.SubLeisureFilter({
				model : LeisureFilter,
				idx_in_collection: idx
			});

			// Add to views
			that._subLeisureViews.push(dv);

			// Re-sort the views we have
			that._subLeisureViews = _.sortBy(that._subLeisureViews,function(sV){
				return sV.options.idx_in_collection;
			});

			// Figure out the index of this view
			var filter_idx = that._subLeisureViews.indexOf(dv);
			// console.warn('thread_idx: ' + thread.Full.toJSON().original.subject);
			// console.log(thread_idx);
			// console.dir(that._subViews[this.threadType]);

			// Render this fucker in the correct place meow

			// If the view has been rendered, then immediately append views
			if(that._rendered){
				// Insert it into the correct place

				// // What is already displayed?
				// // - we are going to .before it to the correct elements (or .append to .all_threads if none are showing yet)
				// if(_.size(that._subLeisureViews) != 1){
				// 	// Already displayed at least one, so we need to figure out where this view is going

				// 	that.$('.all_threads').find('.thread:nth-of-type('+filter_idx+')').after(dv.render().el);

				// } else {
				// 	// No other ones, just prepend it (highest on the list)
				// 	// console.info('no other ones');

				// 	// Is the structure already set up?
				// 	if(!that.$('.all_threads').length){
				// 		console.log('rendering structure');
				// 		that.render_structure();
				// 	}

				// 	// At the bottom
				// 	that.$('.all_threads').append(dv.render().el);
				// }

				// Is the structure already set up?
				if(!that.$('.all_threads').length){
					console.log('rendering structure');
					that.render_structure();
				}

				// At the bottom (fuck it)
				that.$('.all_threads').append(dv.render().el);

				// Resize the scrollable part (.all_threads)
				that.resize_fluid_page_elements();
				that.resize_scroller();

				// Scroll to bottom
				that.$('.scroller').scrollTop(10000);

			}

			// // And add it to the collection so that it's easy to reuse.
			// that._subViews[this.threadType].push(dv);

			// done
			// console.info('Rendered Thread (complete w/ emails)');

		}, this);

		// // Listen for "change" event
		// LeisureFilter.Full.on('change', function(threadFull){
		// 	// Mark thread as ready
		// 	// - this fires immediately if anything is cached
		// 	// - otherwise it fires if something is different from the cached version
		// 	if(!thread.FullReady){
		// 		thread.FullReady = true;
		// 		thread.trigger('check_display_ready');
		// 	}
		// }, this);

		// Emails for Thread
		// - we want to know after all the emails have been loaded for the Thread
		LeisureFilter.Threads = new App.Collections.LeisureThreads();

		LeisureFilter.Threads.on('reset', function(Threads){
			if(!LeisureFilter.ThreadsReady){
				LeisureFilter.ThreadsReady = true;
				LeisureFilter.trigger('check_display_ready');
			}
		}, this); // completely changed collection (triggers add/remove)

		LeisureFilter.Threads.on('sync', function(threadFull){
			// Fires after add/remove have completed?
			// console.info('EmailSync');
			if(!LeisureFilter.ThreadsReady){
				LeisureFilter.ThreadsReady = true;
				LeisureFilter.trigger('check_display_ready');
			}
		}, this); // completely changed collection (triggers add/remove)

		LeisureFilter.Threads.on('add', function(emailFullModel){
			// console.log('EmailAdd');
			// console.log(emailFullModel.toJSON()._id);
		}, this); // added a new EmailFull

		LeisureFilter.Threads.on('remove', function(emailFullModel){
			// console.log('EmailRemove');
			// console.log(emailFullModel.get('id'));
		}, this); // remove a new EmailFull
		
		LeisureFilter.Threads.on('change', function(emailFullModel){
			console.log('EmailChange');
		}, this); // an email is slightly different now (re-render)
		
		// trigger EmailFull collection retrieving
		// console.info(LeisureFilter.get('_id'));
		LeisureFilter.Threads.fetchAll({
			ids: [LeisureFilter.get('_id')],
			// cachePrefix: LeisureFilter.get('_id')
		});

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

	render_structure: function(){

		// Render the loading screen
		var that = this;

		// Template
		var template = App.Utils.template('t_leisure_structure');

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

		// that.LeisureFilterCollection = new App.Collections.LeisureFilters();
		// that.LeisureFilterCollection.fetchAll({
		// 	success: function(leisure_list) {
		// 		// Does not return models, just JSON data objects
		// 		// clog('back with result');
				
		// 		// Store locally
		// 		App.Utils.Storage.set('leisure_list_top',leisure_list);

		// 		// Render new Thread list
		// 		that.render_list(leisure_list);
		// 	}
		// });


	},

	render: function() {
		var that = this;

		if(this._rendered){
			// Already rendered
			// - re-displaying this View
			this._rendered = true;

			// Re-delegate events
			this.delegateEvents();

			// events for subviews
			_(that._subLeisureViews).each(function(v) {
				v.delegateEvents();
			});

		} else {
			this._rendered = true;

			// Render initial body
			this.render_init();

			// Render the views

			// Leisure things
			_(that._subLeisureViews).each(function(uv) {
				that.$('.all_threads').append(uv.render().el);
			});
		}

		// Resize the scrollable part (.all_threads)
		this.resize_fluid_page_elements();
		this.resize_scroller();

		// Scroll to bottom
		this.$('.scroller').scrollTop(10000);





		// // Refresh and render
		// // this.refresh_and_render_threads();

		// // Get stored leisure_list
		// App.Utils.Storage.get('leisure_list_top')
		// 	.then(function(threads){

		// 		if(threads != null){
		// 			// Have some local data
		// 			// Trigger a refresh of the data
		// 			// - when the data is refreshed, the view gets refreshed as well
					
		// 			that.render_list(threads);

		// 		}

		// 		that.refresh_and_render_list();

		// 	});

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
		_.bindAll(this, 'beforeClose');
		_.bindAll(this, 'go_back');
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

	beforeClose: function(){
		// Kill back button grabber
		var that = this;

		App.Utils.BackButton.debubble(this.backbuttonBind);

		return;
	},

	set_scroll_position: function(){
		var that = this;

		// Set last scroll position
		this.last_scroll_position = this.$el.scrollTop();
		this.$el.attr('last-scroll-position',this.last_scroll_position);

		// clog('.' + this.className);
		// clog(this.last_scroll_position);

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

		this.backbuttonBind = App.Utils.BackButton.newEnforcer(this.go_back);

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

		// Gather counts


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

		// 'change .prefilters_select' : 'click_prefilter',
		'click .form-search .submit' : 'search',
		'click .show_search' : 'show_search',
		'click .form-search .cancel' : 'hide_search',

		'click .search_prefilters a.dk_toggle' : 'toggle_prefilters',
		'click .search_prefilters .dk_options_inner li a' : 'click_prefilter',

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

		var elem_key = $(elem).attr('data-action');

		// Replace text with this text
		$(elem).parents('.dk_container').find('.dk_toggle .dk_label').text($(elem).text());

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
			alert('failed finding key');
			alert(elem_key);
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
		
		// Close dk_open
		this.$('.dk_container').removeClass('dk_open');

		return false;
	},

	toggle_prefilters: function(ev){
		// Show/hide the prefilters
		var that = this,
			elem = ev.currentTarget;

		var $parent = $(elem).parent();
		if($parent.hasClass('dk_open')){
			$parent.removeClass('dk_open')
		} else {
			$parent.addClass('dk_open')
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

	_searchEmailSubViews: [],
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

		// Clear views (if any exist)
		if(that._searchEmailSubViews.length > 0){
			_.each(that._searchEmailSubViews, function(tmpView){
				tmpView.close();
			});
		}
		that._searchEmailSubViews =[];

		// Get those threads and display them?
		// - not checking cache at all?
		var EmailSearches = new App.Collections.EmailSearches();
		EmailSearches.fetch_for_search({
			text: search_input, // handles: AND, OR, has:attachment, etc.
		});

		// Handle search results and getting the actual emails
		var EmailSearchesAdd = function(EmailObj){
			// Get the EmailFull
			// - checks cache too

			// Render the view in the correct place (append)
			// - contains a "nodisplay" until the Model arrives

			// Remove "loading" if it is there?

			// Get index (position) of this item
			var idx = EmailSearches.indexOf(EmailObj);

			// Create the View
			var dv = new App.Views.SubSearchesEmail({
				model : EmailObj,
				idx_in_collection: idx,
				fadein: false
			});

			// Add to this subView tracker
			that._searchEmailSubViews.push(dv);

			// Re-sort the views we have
			that._searchEmailSubViews = _.sortBy(that._searchEmailSubViews,function(sV){
				return sV.options.idx_in_collection;
			});

			// Figure out the index of this view
			var elem_idx = that._searchEmailSubViews.indexOf(dv);
			
			// Remove the loading page, if it exists
			that.$('.loading').remove();

			var $tmpElem = that.$('.search_emails_thread_results ').find('.thread:nth-of-type('+elem_idx+')');

			if(_.size(that._searchEmailSubViews) != 1 && $tmpElem.length){
				// Not the first view
				// console.info(elem_idx);
				// console.info(that.$('.search_emails_thread_results ').find('.thread:nth-of-type('+elem_idx+')'));
				$tmpElem.after(dv.render().el);
				// that.$('.all_threads').find('.thread[data-thread-type="'+this.threadType+'"]:nth-of-type('+thread_idx+')').after(dv.render().el);
			} else {
				// First view, append it to the page

				// Render
				that.$('.search_emails_thread_results').append(dv.render().el);
			}

			// console.log('EmailObj');
			// console.log(EmailObj.toJSON());

			// Create new Model for EmailFull
			EmailObj.EmailFull = new App.Models.EmailFull({
				_id: EmailObj.toJSON()['_id'],
				id: EmailObj.toJSON()['_id']
			});

			// Wait for EmailFull to be populated ("change" is fired?)
			EmailObj.EmailFull.on('change',function(EmailFull){
				// Got the EmailFull
				// console.log('Got EmailFull');
				// console.log(EmailFull);
				// console.log(EmailFull.toJSON());

				// Render this EmailObj Views
				// - already rendered, just need to remove the "nodisplay" from the view
				dv.trigger('render_full');

				// Scroll to bottom
				that.$('.scroller').scrollTop(10000);

			}, this);

			// console.log('pre-fetch');
			// console.log(EmailObj.EmailFull.toJSON());
			EmailObj.EmailFull.fetchFull();

		};

		// Handle search results and getting the actual emails
		EmailSearches.on('reset',function(EmailSearches){
			// Only called once

			console.warn('reset');
			// that.$('.search_emails_thread_results').html();

			// Iterate over "add"
			EmailSearches.each(EmailSearchesAdd, this);
		}, this);


		// Handle search results and getting the actual emails
		EmailSearches.on('sync',function(EmailSearches){
			// Order has probably changed
			// - fires when changes come back from the API

		}, this);

		EmailSearches.on('add', EmailSearchesAdd, this);

		// 	success: function(emails){

		// 		// Returns a list of Emails
		// 		// - use those for the display
		// 		emails = emails.toJSON();

		// 		// Merge together by Thread?
		// 		// - todo...

		// 		// Sort by date
		// 		emails = App.Utils.sortBy({
		// 			arr: emails,
		// 			path: 'common.date',
		// 			direction: 'desc',
		// 			type: 'date'
		// 		});

		// 		// Template
		// 		var template = App.Utils.template('t_search_emails_email_results');

		// 		// Write HTML
		// 		that.$('.search_emails_thread_results').html(template(emails));

		// 		// Scroll to bottom
		// 		$('.search_emails_thread_results').scrollTop($('.search_emails_thread_results').height() + 1000);

		// 	}
		// });

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

				// Scroll to bottom
				that.$('.scroller').scrollTop(10000);

			}
		});

	},


	recently_acted_on: function(){
		// Renders recently viewed threads
		var that = this;

		// Display loading icon
		that.render_loading_threads();

		// Get those threads and display them?
		// - not checking cache at all?
		var ThreadCollection = new App.Collections.Threads();
		ThreadCollection.fetch_acted_on_with_email({
			data: {
				limit: 10
			},
			success: function(threads){

				// Template
				var template = App.Utils.template('t_search_emails_thread_results');

				// Write HTML
				that.$('.search_emails_thread_results').html(template(threads));

				// Scroll to bottom
				that.$('.scroller').scrollTop(10000);
			}
		});


	},

	sent_emails: function(){
		// Renders recently viewed threads
		var that = this;

		// Display loading icon
		that.render_loading_threads();

		// Clear views (if any exist)
		if(that._searchEmailSubViews.length > 0){
			_.each(that._searchEmailSubViews, function(tmpView){
				tmpView.close();
			});
		}
		that._searchEmailSubViews =[];

		// Get those threads and display them?
		// - not checking cache at all?
		var EmailSearches = new App.Collections.EmailSearches();
		EmailSearches.fetch_sent();

		// Handle search results and getting the actual emails
		var EmailSearchesAdd = function(EmailObj){
			// Get the EmailFull
			// - checks cache too

			// Render the view in the correct place (append)
			// - contains a "nodisplay" until the Model arrives

			// Remove "loading" if it is there?

			// Get index (position) of this item
			var idx = EmailSearches.indexOf(EmailObj);

			// Create the View
			var dv = new App.Views.SubSearchesEmail({
				model : EmailObj,
				idx_in_collection: idx,
				fadein: false
			});

			// Add to this subView tracker
			that._searchEmailSubViews.push(dv);

			// Re-sort the views we have
			that._searchEmailSubViews = _.sortBy(that._searchEmailSubViews,function(sV){
				return sV.options.idx_in_collection;
			});

			// Figure out the index of this view
			var elem_idx = that._searchEmailSubViews.indexOf(dv);
			
			// Remove the loading page, if it exists
			that.$('.loading').remove();

			var $tmpElem = that.$('.search_emails_thread_results ').find('.thread:nth-of-type('+elem_idx+')');

			if(_.size(that._searchEmailSubViews) != 1 && $tmpElem.length){
				// Not the first view
				// console.info(elem_idx);
				// console.info(that.$('.search_emails_thread_results ').find('.thread:nth-of-type('+elem_idx+')'));
				$tmpElem.after(dv.render().el);
				// that.$('.all_threads').find('.thread[data-thread-type="'+this.threadType+'"]:nth-of-type('+thread_idx+')').after(dv.render().el);
			} else {
				// First view, append it to the page

				// Render
				that.$('.search_emails_thread_results').append(dv.render().el);
			}

			// Create new Model for EmailFull
			EmailObj.EmailFull = new App.Models.EmailFull({
				_id: EmailObj.toJSON()['_id'],
				id: EmailObj.toJSON()['_id']
			});

			// Wait for EmailFull to be populated ("change" is fired?)
			EmailObj.EmailFull.on('change',function(EmailFull){
				// Got the EmailFull

				// Trigger full rendering
				dv.trigger('render_full');

				// Scroll to bottom
				that.$('.scroller').scrollTop(10000);

			}, this);

			// Fetch Full Email
			EmailObj.EmailFull.fetchFull();

		};

		// Handle search results and getting the actual emails
		EmailSearches.on('reset',function(EmailSearches){
			// Only called once

			console.warn('reset');
			// that.$('.search_emails_thread_results').html();

			// Iterate over "add"
			EmailSearches.each(EmailSearchesAdd, this);
		}, this);


		// Handle search results and getting the actual emails
		EmailSearches.on('sync',function(EmailSearches){
			// Order has probably changed
			// - fires when changes come back from the API

		}, this);

		EmailSearches.on('add', EmailSearchesAdd, this);

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

		// Choose Recent
		that.$('.dk_options_inner li a[data-action="recently_viewed"]').click();

		// Resize the scroller
		this.resize_fluid_page_elements();
		this.resize_scroller();

		// that.$('select').trigger('change');
		// that.$('select').blur();

		// // Enable mobiscroll select (modal is cleanest)
		// that.$('.prefilters_select').mobiscroll().select({
		// 	theme: 'android-ics',
		// 	display: 'bubble',
		// 	mode: 'mixed',
		// 	inputClass: 'prefilters_select'
		// });

		// // Choose Recent
		// that.$('select').val('recently_viewed');
		// this.click_prefilter(null, that.$('select'));

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

		// 'change .prefilters_select' : 'click_prefilter',
		'click .form-search .submit' : 'search',
		'click .show_search' : 'show_search',
		'click .form-search .cancel' : 'hide_search',

		'click .search_prefilters a.dk_toggle' : 'toggle_prefilters',
		'click .search_prefilters .dk_options_inner li a' : 'click_prefilter',

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

		var elem_key = $(elem).attr('data-action');

		// Replace text with this text
		$(elem).parents('.dk_container').find('.dk_toggle .dk_label').text($(elem).text());

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
		
		// Close dk_open
		this.$('.dk_container').removeClass('dk_open');

		return false;
	},

	toggle_prefilters: function(ev){
		// Show/hide the prefilters
		var that = this,
			elem = ev.currentTarget;

		var $parent = $(elem).parent();
		if($parent.hasClass('dk_open')){
			$parent.removeClass('dk_open')
		} else {
			$parent.addClass('dk_open')
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

		// Get url path to attachment
		var url_path = $(elem).attr('data-path');

		// Open attachment in new View
		// - subView
		navigator.app.loadUrl(url_path, { openExternal:true });

		// App.Utils.Notification.toast('Loading in ChildBrowser (should load in a new View, with options for )');
		// if(usePg){
		// 	window.plugins.childBrowser.showWebPage(path,{
		// 		showLocationBar: false,
		// 		showAddress: false,
		// 		showNavigationBar: false
		// 	});
		// }
		// window.open(App.Credentials.s3_bucket + path);
		return false;

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
		that.$('.dk_options_inner li a[data-action="recent"]').click();

		// that.$('select').val('recent');
		// that.$('select').trigger('change');

		// // Enable mobiscroll select (modal is cleanest)
		// that.$('.prefilters_select').mobiscroll().select({
		// 	theme: 'android-ics',
		// 	display: 'bubble',
		// 	mode: 'mixed',
		// 	inputClass: 'prefilters_select'
		// });

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

		// 'change .prefilters_select' : 'click_prefilter',
		'click .form-search .submit' : 'search',
		'click .show_search' : 'show_search',
		'click .form-search .cancel' : 'hide_search',

		'click .search_prefilters a.dk_toggle' : 'toggle_prefilters',
		'click .search_prefilters .dk_options_inner li a' : 'click_prefilter',

		'click .parsed_link' : 'view_link'

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

		var elem_key = $(elem).attr('data-action');

		// Replace text with this text
		$(elem).parents('.dk_container').find('.dk_toggle .dk_label').text($(elem).text());

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
		
		// Close dk_open
		this.$('.dk_container').removeClass('dk_open');

		return false;
	},

	toggle_prefilters: function(ev){
		// Show/hide the prefilters
		var that = this,
			elem = ev.currentTarget;

		var $parent = $(elem).parent();
		if($parent.hasClass('dk_open')){
			$parent.removeClass('dk_open')
		} else {
			$parent.addClass('dk_open')
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

	view_link: function(ev){
		// Open a window with the link in it
		// - should instead open up a new View with info about the link (copy, visit, etc.)
		var that = this,
			elem = ev.currentTarget;

		// Get link
		var url = $(elem).attr('data-link');

		// Launch window
		// var ref = window.open(url, '_blank', 'location=yes');
		navigator.app.loadUrl(url, { openExternal:true });

		return false;

	},

	scroll_to_bottom: function(){
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
		that.$('.dk_options_inner li a[data-action="recent"]').click();

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


App.Views.Settings = Backbone.View.extend({
	
	className: 'view_settings',

	events: {
		'click .setting[data-setting-type]' : 'clicked_setting',
		'click .cancel' : 'cancel'
	},

	initialize: function(options) {
		_.bindAll(this, 'render');
		_.bindAll(this, 'beforeClose');
		_.bindAll(this, 'cancel');
		var that = this;

	},

	beforeClose: function(){
		var that = this;

		// kill any subviews
		if(this.speedtestSubView){
			this.speedtestSubView.close(); // should emit an event instead?
		}
		if(this.displayedSubview){
			this.displayedSubview.close(); // should emit an event instead?
		}

		// De-bubble this back button
		App.Utils.BackButton.debubble(this.backbuttonBind);

	},

	clicked_setting: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// Activate the chosen setting
		var action = $(elem).attr('data-setting-type');
		this[action](ev); // call the action

		return false;

	},

	cancel: function(ev){
		var that = this;
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

		ev.preventDefault();
		ev.stopPropagation();
		return false;
	},

	general: function(ev){

		var that = this;

		// Launch speedtest subView
		// - should it really be a subView?

		this.displayedSubview = new App.Views.GeneralSettings();

		// Render the subView
		this.displayedSubview.render();

		// Append to View
		this.$el.after(this.displayedSubview.el); // could do this.speedtestSubView.render().el ?

		// Hide this View
		this.$el.hide();

		// Listen for subview closing
		this.displayedSubview.on('back', function(){
			// Show the parent
			// - close the guy

			this.displayedSubview.close();

			that.$el.show();

		}, this);

	},

	report_bug: function(ev){

		var that = this;

		// Launch speedtest subView
		// - should it really be a subView?

		this.displayedSubview = new App.Views.ReportBug();

		// Render the subView
		this.displayedSubview.render();

		// Append to View
		this.$el.after(this.displayedSubview.el); // could do this.speedtestSubView.render().el ?

		// Hide this View
		this.$el.hide();

		// Listen for subview closing
		this.displayedSubview.on('back', function(){
			// Show the parent
			// - close the guy

			this.displayedSubview.close();

			that.$el.show();

		}, this);

	},

	stats: function(ev){

		var that = this;
		ev.stopPropagation();
		ev.preventDefault();

		// Launch stats view
		// - stats are summarized and created by the minimail server component (because it is faster)
		// - minimail will respond with an event (or emit a new event) containing the Stats we wanted

		this.displayedSubview = new App.Views.Stats();

		// Render the subView
		this.displayedSubview.render();

		// Append to View
		this.$el.after(this.displayedSubview.el); // could do this.speedtestSubView.render().el ?

		// Hide this View
		this.$el.hide();

		// Listen for subview closing
		this.displayedSubview.on('back', function(){
			// Show the parent
			// - close the guy

			this.displayedSubview.close();

			that.$el.show();

		}, this);

		return false;
	},

	sync: function(ev){
		// Triggers an inbox sync with Gmail

		var that = this;

		// trigger the sync event
		Api.event({
			data: {
				event: 'Email.sync',
				delay: 0,
				obj: {}
			}
		});

		// also synces contacts
		Api.event({
			data: {
				event: 'Contacts.sync',
				delay: 0,
				obj: {}
			}
		});

		App.Utils.Notification.toast('Update will take a minute', 'info');

		return;
	},

	tutorial: function(ev){
		var that = this;

		// Launch speedtest subView
		// - should it really be a subView?

		this.tutorial = new App.Views.StartupTutorial();

		// Render the subView
		this.tutorial.render();

		// // Append to View
		// this.$el.after(this.speedtestSubView.el); // could do this.speedtestSubView.render().el ?

		// // Hide this View
		// this.$el.hide();

		// // Listen for subview closing
		// this.speedtestSubView.on('back', function(){
		// 	// Show the parent
		// 	// - close the guy

		// 	this.speedtestSubView.close();

		// 	that.$el.show();

		// }, this);

		return;
	},

	speedtest: function(ev){
		var that = this;

		// Launch speedtest subView
		// - should it really be a subView?

		this.speedtestSubView = new App.Views.SpeedTest();

		// Render the subView
		this.speedtestSubView.render();

		console.log(this.speedtestSubView);

		// Append to View
		this.$el.after(this.speedtestSubView.el); // could do this.speedtestSubView.render().el ?

		// Hide this View
		this.$el.hide();

		// Listen for subview closing
		this.speedtestSubView.on('back', function(){
			// Show the parent
			// - close the guy

			this.speedtestSubView.close();

			that.$el.show();

		}, this);

		return;
	},

	flushcache: function(ev){
		// Flushes the cache
		// - seems to fix some problems with models/collections

		var that = this;

		var c = confirm('It might take a minute for previous emails to re-appear, as they are loaded back into the cache');
		if(c){
			// Wait for cache to flush
			App.Utils.Storage.flush()
				.then(function(){
					// worked
					alert('Cache Flushed');
				});
		}

		return;
	},

	closeapp: function(ev){
		var that = this;

		try {
			// android
			navigator.app.exitApp();
		}catch(err){

		}
		try {
			// ios?
			navigator.device.exitApp();
		}catch(err){

		}
	},

	reload: function(ev){
		var that = this;

		window.location = [location.protocol, '//', location.host, location.pathname].join('');

		return false;
	},

	logout: function(ev){
		var that = this;

		// Confirm logout
		Backbone.history.loadUrl('confirm_logout');
	},

	render: function() {
		var that = this;

		// Build from template
		var template = App.Utils.template('t_settings');

		// Settings
		var settings = [
			// {
			// 	key: 'stats',
			// 	text: 'Stats',
			// 	subtext: 'oh so pretty'
			// },
			{
				key: 'general',
				text: 'General Settings',
				subtext: 'random things',
			},
			{
				key: 'report_bug',
				text: 'Report Bug',
				subtext: 'or just tell us things',
			},
			{
				key: 'sync',
				text: 'Sync Inbox',
				subtext: 'reconcile with gmail in a jiffy',
			},
			// {
			// 	key: 'theme',
			// 	text: 'Theme',
			// 	subtext: 'lots of pretty colors',
			// },
			{
				key: 'tutorial',
				text: 'Startup Tutorial',
				subtext: 'what does this button do?',
			},
			{
				key: 'speedtest',
				text: 'Speed Test',
				subtext: 'how fast is your data connection?',
			},
			{
				key: 'flushcache',
				text: 'Flush Cache',
				subtext: 'fixes most problems',
			},
			{
				key: 'reload',
				text: 'Reload',
				subtext: 'fixes display inconsistencies'
			},
			{
				key: 'close',
				text: 'Exit App',
				subtext: 'in case BackButton broke'
			},
			{
				key: 'logout',
				text: 'Log out',
				subtext: 'never gonna give you up tho'
			}
		];

		// Remove device-specif options
		if(usePg){
			if(device.platform == "iOS"){
				settings = _.filter(settings,function(setting){
					switch(setting.key){
						case 'close':
							return false;
						default:
							return true;
					}
				});
			}
		}

		// Write HTML
		that.$el.html(template({
			settings: settings,
			version: App.Data.version
		}));

		// back button
		this.backbuttonBind = App.Utils.BackButton.newEnforcer(this.cancel);

		return this;

	}

});

App.Views.GeneralSettings = Backbone.View.extend({

	className: 'settings_general_view',

	events: {
		'click .cancel' : 'backButton'
	},

	initialize: function() {
		_.bindAll(this, 'render');
		_.bindAll(this, 'beforeClose');
		_.bindAll(this, 'back');

	},

	beforeClose: function(){
		// De-bubble this back button
		App.Utils.BackButton.debubble(this.backbuttonBind);
	},

	backButton: function(ev){
		var that = this,
			elem = ev.currentTarget;

		this.back();

		ev.preventDefault();
		ev.stopPropagation();
		return false;
	},

	back: function(){
		// Go back to settings page
		var that = this;

		this.trigger('back');
	},

	render: function(){
		var that = this;

		// Remove any previous one
		// $('.logout').remove();

		// Build from template
		var template = App.Utils.template('t_settings_general');

		// Get Settings from Cache
		App.Utils.Storage.get('settings', 'critical')
			.then(function(settings){
				if(!settings){
					// No settings created! 
					// - use defaults
				}
			});


		// Build settings data
		// - already loaded into the app, so just show those settings
		

		// Write HTML
		that.$el.html(template(App.Data.settings));

		// Back button
		this.backbuttonBind = App.Utils.BackButton.newEnforcer(this.back);

		return this;
	}

});

App.Views.ReportBug = Backbone.View.extend({

	className: 'settings_report_bug_view',

	events: {
		'click .cancel' : 'backButton',
		'click .submit_button' : 'send'
	},

	initialize: function() {
		_.bindAll(this, 'render');
		_.bindAll(this, 'beforeClose');
		_.bindAll(this, 'back');
		_.bindAll(this, 'cancel_sending');
		_.bindAll(this, 'after_sent');

	},

	beforeClose: function(){
		// De-bubble this back button
		App.Utils.BackButton.debubble(this.backbuttonBind);
	},

	backButton: function(ev){
		var that = this,
			elem = ev.currentTarget;

		this.back();

		ev.preventDefault();
		ev.stopPropagation();
		return false;
	},

	back: function(){
		// Go back to settings page
		var that = this;

		this.trigger('back');
	},

	cancel_sending: function(that, elem){

		$(elem).text($(elem).attr('data-original-text'));
		$(elem).attr('disabled',false);
		that.disable_buttons = false;
	},

	send: function(ev){
		var that = this,
			elem = ev.currentTarget;

		// Send an email to Emailbox through this person's email account

		var yeah = confirm('OK to send?');
		if(!yeah){
			return false;
		}

		// Disable button
		$(elem).text('Sending...');
		$(elem).attr('disabled','disabled');
		this.disable_buttons = true;

		// To
		var to = 'nick@getemailbox.com'; // hardcoded email address for support/bugs

		// Subject
		var subject = 'Minimail bug report via awesome user';

		// CC
		// - should the person be cc'd
		//		- nah, they already have a copy in Sent
		
		var from = App.Data.UserEmailAccounts.at(0).get('email');
		var textBody = $.trim(that.$('#reporting_bug').val());

		// Do a little bit of validation
		try {
			if(to.length < 1){
				alert('You need to send to somebody!');
				that.cancel_sending(that, elem);
				return false;
			}
			if(from.length < 1){
				alert('Whoops, we cannot send from your account right now');
				that.cancel_sending(that, elem);
				return false;
			}
			if(subject.length < 1){
				alert('You need to write a subject line!');
				that.cancel_sending(that, elem);
				return false;
			}
			if(textBody.length < 1){
				alert('You need to write something in your email!');
				that.cancel_sending(that, elem);
				return false;
			}

		} catch(err){
			console.error('Failed validation');
			console.error(err);
			alert('Whoops, something failed in sending. Please try again!');
			that.cancel_sending(that, elem);
			return false;

		}

		// Send return email
		var eventData = {
			event: 'Email.send.validate',
			delay: 0,
			obj: {
				To: to,
				From: from,
				Subject: subject,
				Text: textBody,
				attachments: []
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

						alert('Sorry, Unable to send Email');

						that.cancel_sending(that, elem);
						return false;
					}

					// Get rate-limit info
					tmp_rate_limit = response.body.data;

					// Over rate limit?
					if(tmp_rate_limit.current + 1 >= tmp_rate_limit.rate_limit){

						alert('Sorry, Over the Rate Limit (25 emails per 6 hours)');

						that.cancel_sending(that, elem);
						return false;
						
					}

					// All good, SEND Email
					eventData.event = 'Email.send';

					// // Log
					// clog('sending reply Email');
					// clog(eventData);

					Api.event({
						data: eventData,
						response: {
							"pkg.native.email" : function(response){
								
								// Update the view code
								if(response.body.code == 200){
									// Sent successfully
									that.after_sent();

								} else {
									// Failed, had an error sending

									alert('Sorry, we might have failed sending this email');
									
									that.cancel_sending(that, elem);
									return false;
								}

							}
						}
					});

					// that.after_sent(); // PRETENDING IT SENT OK!!!! (remove this line and uncomment the after_sent above)



					// if validation ok, then continue to the next one
					// - resolve or call?

				}
			}
		});

	},

	after_sent: function(){
		// Sent OK

		var that = this;

		App.Events.trigger("email_compose_sent", true);

		// Toast
		App.Utils.Notification.toast('Sent Successfully, Thank You!','success');

		// Close myself
		this.trigger('back');

		return false;
	},

	render: function(){
		var that = this;

		// Remove any previous one
		// $('.logout').remove();

		// Build from template
		var template = App.Utils.template('t_settings_report_bug');		

		// Write HTML
		that.$el.html(template());

		// Back button
		this.backbuttonBind = App.Utils.BackButton.newEnforcer(this.back);

		return this;
	}

});

App.Views.Stats = Backbone.View.extend({

	className: 'settings_stats_view',

	events: {
		'click #dk_container_options .dk_toggle' : 'toggle_all',
		'click .cancel' : 'backButton'
	},

	stats: null,
	ev: _.extend({}, Backbone.Events),

	initialize: function() {
		var that = this;
		_.bindAll(this, 'render');
		_.bindAll(this, 'beforeClose');
		_.bindAll(this, 'back');

		Api.event({
			data: {
				event: 'Minimail.stats',
				obj: {
					timezone_offset: function(){
						var d = new Date();
						return d.getTimezoneOffset();
					}()
				}
			},
			response: {
				"pkg.dev.minimail" : function(response){
					// Get stats
					if(response.body.code != 200){
						alert('Sorry, failed loading stats at this time');
						return;
					}

					that.stats = response.body.data;

					// Emit that stats are ready now
					that.ev.trigger('StatsReady');

				}
			},
			success: function(){
				// succeeded
			}
		});

	},

	beforeClose: function(){
		// De-bubble this back button
		App.Utils.BackButton.debubble(this.backbuttonBind);
	},

	backButton: function(ev){
		var that = this,
			elem = ev.currentTarget;

		this.back();

		ev.preventDefault();
		ev.stopPropagation();
		return false;
	},

	back: function(){
		// Go back to settings page
		var that = this;
		
		this.close();

		// Re-show .main_body
		$('.main_body').removeClass('nodisplay');

		// Scroll to bottom
		$('.scroller').scrollTop(10000);

		// ev.preventDefault();
		// ev.stopPropagation();
		return false;
	},

	toggle_all: function(ev){
		// Show/hide options for all
		var that = this,
			elem = ev.currentTarget;

		var $parent = this.$('#dk_container_options');

		if($parent.hasClass('dk_open')){
			$parent.removeClass('dk_open');
		} else {
			$parent.addClass('dk_open');
		}

	},

	render_stat: function(stat_key){
		var that = this;

		if(this.stat == null){
			// Not ready yet
			console.warn('stats NOT ready');

			// Rendering loading
			var template = App.Utils.template('t_stats_loading');
			that.$('.stats_result').html(template());

			this.ev.once('StatsReady',function(){
				// stats are ready
				// alert('stats ready');
				that.render_stat_ready(stat_key);
			});
		} else {
			console.warn('stats are ready'); // not usually?
			that.render_stat_ready(stat_key);
		}

	},

	render_stat_ready: function(stat_key){
		var that = this;

		switch(stat_key){
			case 'sent_vs_received':
				// Rendering Sent vs. Received graph

				// Get week summary data
				var week_sent = 0,
					week_received = 0;

				week_sent = _.reduce(that.stats.sent_vs_received.sent, function(item, prev){
					return item + prev;
				});
				week_received = _.reduce(that.stats.sent_vs_received.received, function(item, prev){
					return item + prev;
				});

				var templateData = {
					winWidth: App.Data.xy.win_width,
					week_received: week_received,
					week_sent: week_sent
				};

				var template = App.Utils.template('t_stats_sent_vs_received');

				that.$('.stats_result').html(template(templateData));

				// Get charts to use from html
				var summaryChart = this.$('#week_summary').get(0).getContext("2d");
				var dayChartSent = this.$('#day_by_day_sent').get(0).getContext("2d");
				var dayChartReceived = this.$('#day_by_day_received').get(0).getContext("2d");
				var dayChartCombined = this.$('#day_by_day_combined').get(0).getContext("2d");

				// Finagle data into chart-usable format
				var summaryData = [
					{
						value: week_sent, // sent
						color:"#F7464A"
					},
					{
						value : week_received, // received
						color : "#4D5360"
					}

				];

				var dayDataSent = {
					labels : Object.keys(this.stats.sent_vs_received.sent),
					datasets : [
						{
							fillColor : "rgba(247, 70, 74, 0.5)",
							strokeColor : "rgba(247, 70, 74, 1)",
							data : _.map(that.stats.sent_vs_received.sent,function(val){return val})
						}
					]
				};

				var dayDataReceived = {
					labels : Object.keys(this.stats.sent_vs_received.received),
					datasets : [
						{
							fillColor : "rgba(77, 83, 96, 0.5)",
							strokeColor : "rgba(77, 83, 96, 1)",
							data : _.map(that.stats.sent_vs_received.received,function(val){return val})
						}
					]
				};

				var dayCombinedData = {
					labels : Object.keys(this.stats.sent_vs_received.received),
					datasets : [
						{
							fillColor : "rgba(247, 70, 74, 0.5)",
							strokeColor : "rgba(247, 70, 74, 1)",
							data : _.map(that.stats.sent_vs_received.sent,function(val){return val})
						},
						{
							fillColor : "rgba(77, 83, 96, 0.5)",
							strokeColor : "rgba(77, 83, 96, 1)",
							data : _.map(that.stats.sent_vs_received.received,function(val){return val})
						}
					]
				};

				// Options to use for each Chart
				var summaryDataOptions = {
					animation: false
				};
				var dayDataSentOptions = {
					scaleOverlay: true,
					barStrokeWidth: 1,
					animation: false
				};
				var dayDataReceivedOptions = {
					scaleOverlay: true,
					barStrokeWidth: 1,
					animation: false
				};
				var dayDataCombinedOptions = {
					animation: false
				};

				// Render the charts
				var theSummaryChart = new Chart(summaryChart).Doughnut(summaryData, summaryDataOptions);
				var theDaySentChart = new Chart(dayChartSent).Bar(dayDataSent, dayDataSentOptions);
				var theDayReceivedChart = new Chart(dayChartReceived).Bar(dayDataReceived, dayDataReceivedOptions);
				var theDayCombinedChart = new Chart(dayChartCombined).Line(dayCombinedData, dayDataCombinedOptions);

				break;

			case 'something_else':

				break;

			default:
				break;

		}


		
		return false;

	},

	render: function(){
		var that = this;

		// Remove any previous one
		// $('.logout').remove();

		// Build from template
		var template = App.Utils.template('t_stats');

		var stat_choices = [
			{
				name: 'Sent vs. Received',
				key: 'sent_vs_received'
			},
			{
				name: 'Response Times',
				key: 'response_times'
			},
			// {
			// 	name: 'Traffic Patterns',
			// 	key: 'traffic_patterns'
			// }
		];

		// Write HTML
		that.$el.html(template({
			winWidth: App.Data.xy.win_width,
			stat_choices: stat_choices
		}));

		// Render the default stat (Sent vs. Received)
		this.render_stat('sent_vs_received');

		// Back button
		this.backbuttonBind = App.Utils.BackButton.newEnforcer(this.back);

		return this;
	}

});

App.Views.Stats_old = Backbone.View.extend({

	className: 'settings_stats_view',

	events: {
		'click #dk_container_options .dk_toggle' : 'toggle_all',
		'click .cancel' : 'backButton'
	},

	stats: null,
	ev: _.extend({}, Backbone.Events),

	initialize: function() {
		var that = this;
		_.bindAll(this, 'render');
		_.bindAll(this, 'beforeClose');
		_.bindAll(this, 'back');

		Api.event({
			data: {
				event: 'Minimail.stats',
				obj: {
					timezone_offset: function(){
						var d = new Date();
						return d.getTimezoneOffset();
					}()
				}
			},
			response: {
				"pkg.dev.minimail" : function(response){
					// Get stats
					if(response.body.code != 200){
						alert('Sorry, failed loading stats at this time');
						return;
					}

					that.stats = response.body.data;

					// Emit that stats are ready now
					that.ev.trigger('StatsReady');

				}
			},
			success: function(){
				// succeeded
			}
		});

	},

	beforeClose: function(){
		// De-bubble this back button
		App.Utils.BackButton.debubble(this.backbuttonBind);
	},

	backButton: function(ev){
		var that = this,
			elem = ev.currentTarget;

		this.back();

		ev.preventDefault();
		ev.stopPropagation();
		return false;
	},

	back: function(){
		// Go back to settings page
		var that = this;

		this.trigger('back');

	},

	toggle_all: function(ev){
		// Show/hide options for all
		var that = this,
			elem = ev.currentTarget;

		var $parent = this.$('#dk_container_options');

		if($parent.hasClass('dk_open')){
			$parent.removeClass('dk_open');
		} else {
			$parent.addClass('dk_open');
		}

	},

	render_stat: function(stat_key){
		var that = this;

		if(this.stat == null){
			// Not ready yet
			console.warn('stats NOT ready');

			// Rendering loading
			var template = App.Utils.template('t_stats_loading');
			that.$('.stats_result').html(template());

			this.ev.once('StatsReady',function(){
				// stats are ready
				// alert('stats ready');
				that.render_stat_ready(stat_key);
			});
		} else {
			console.warn('stats are ready'); // not usually?
			that.render_stat_ready(stat_key);
		}

	},

	render_stat_ready: function(stat_key){
		var that = this;

		switch(stat_key){
			case 'sent_vs_received':
				// Rendering Sent vs. Received graph

				// Get week summary data
				var week_sent = 0,
					week_received = 0;

				week_sent = _.reduce(that.stats.sent_vs_received.sent, function(item, prev){
					return item + prev;
				});
				week_received = _.reduce(that.stats.sent_vs_received.received, function(item, prev){
					return item + prev;
				});

				var templateData = {
					winWidth: App.Data.xy.win_width,
					week_received: week_received,
					week_sent: week_sent
				};

				var template = App.Utils.template('t_stats_sent_vs_received');

				that.$('.stats_result').html(template(templateData));

				// Get charts to use from html
				var summaryChart = this.$('#week_summary').get(0).getContext("2d");
				var dayChartSent = this.$('#day_by_day_sent').get(0).getContext("2d");
				var dayChartReceived = this.$('#day_by_day_received').get(0).getContext("2d");
				var dayChartCombined = this.$('#day_by_day_combined').get(0).getContext("2d");

				// Finagle data into chart-usable format
				var summaryData = [
					{
						value: week_sent, // sent
						color:"#F7464A"
					},
					{
						value : week_received, // received
						color : "#4D5360"
					}

				];

				var dayDataSent = {
					labels : Object.keys(this.stats.sent_vs_received.sent),
					datasets : [
						{
							fillColor : "rgba(247, 70, 74, 0.5)",
							strokeColor : "rgba(247, 70, 74, 1)",
							data : _.map(that.stats.sent_vs_received.sent,function(val){return val})
						}
					]
				};

				var dayDataReceived = {
					labels : Object.keys(this.stats.sent_vs_received.received),
					datasets : [
						{
							fillColor : "rgba(77, 83, 96, 0.5)",
							strokeColor : "rgba(77, 83, 96, 1)",
							data : _.map(that.stats.sent_vs_received.received,function(val){return val})
						}
					]
				};

				var dayCombinedData = {
					labels : Object.keys(this.stats.sent_vs_received.received),
					datasets : [
						{
							fillColor : "rgba(247, 70, 74, 0.5)",
							strokeColor : "rgba(247, 70, 74, 1)",
							data : _.map(that.stats.sent_vs_received.sent,function(val){return val})
						},
						{
							fillColor : "rgba(77, 83, 96, 0.5)",
							strokeColor : "rgba(77, 83, 96, 1)",
							data : _.map(that.stats.sent_vs_received.received,function(val){return val})
						}
					]
				};

				// Options to use for each Chart
				var summaryDataOptions = {
					animation: false
				};
				var dayDataSentOptions = {
					scaleOverlay: true,
					barStrokeWidth: 1,
					animation: false
				};
				var dayDataReceivedOptions = {
					scaleOverlay: true,
					barStrokeWidth: 1,
					animation: false
				};
				var dayDataCombinedOptions = {
					animation: false
				};

				// Render the charts
				var theSummaryChart = new Chart(summaryChart).Doughnut(summaryData, summaryDataOptions);
				var theDaySentChart = new Chart(dayChartSent).Bar(dayDataSent, dayDataSentOptions);
				var theDayReceivedChart = new Chart(dayChartReceived).Bar(dayDataReceived, dayDataReceivedOptions);
				var theDayCombinedChart = new Chart(dayChartCombined).Line(dayCombinedData, dayDataCombinedOptions);

				break;

			case 'something_else':

				break;

			default:
				break;

		}


		
		return false;

	},

	render: function(){
		var that = this;

		// Remove any previous one
		// $('.logout').remove();

		// Build from template
		var template = App.Utils.template('t_stats');

		var stat_choices = [
			{
				name: 'Sent vs. Received',
				key: 'sent_vs_received'
			},
			{
				name: 'Response Times',
				key: 'response_times'
			},
			// {
			// 	name: 'Traffic Patterns',
			// 	key: 'traffic_patterns'
			// }
		];

		// Write HTML
		that.$el.html(template({
			winWidth: App.Data.xy.win_width,
			stat_choices: stat_choices
		}));

		// Render the default stat (Sent vs. Received)
		this.render_stat('sent_vs_received');

		// Back button
		this.backbuttonBind = App.Utils.BackButton.newEnforcer(this.back);

		return this;
	}

});

App.Views.SpeedTest = Backbone.View.extend({

	className: 'speedtest_view',

	events: {
		'click #start' : 'start',
		'click .cancel' : 'backButton'
	},

	initialize: function() {
		_.bindAll(this, 'render');
		_.bindAll(this, 'beforeClose');
		_.bindAll(this, 'back');

	},

	beforeClose: function(){
		// De-bubble this back button
		App.Utils.BackButton.debubble(this.backbuttonBind);
	},

	start: function(ev){
		// Start the speedtest
		var that = this,
			elem = ev.currentTarget;

		// Hide button
		this.$('.pre_start').hide();

		// Show "running" text
		this.$('.running').show();

		// start
		var st = new SpeedTest();
		st.run({
			runCount: 5,
			imgUrl: "https://s3.amazonaws.com/emailboxv1/speedtest.jpg",
			size: 85400,
			onStart: function() {
				// alert('Before Running Speed Test');

			}

			,onEnd: function(speed_results) {

				console.log(speed_results);

				speed_results.connection_type = that.checkConnection();

				// Hide "running" text
				that.$('.running').hide();

				// Show results

				// Build template
				var template = App.Utils.template('t_speedtest_results');

				// console.info(template(speed_results));

				speed_results.KBps = speed_results.KBps.toFixed(2);
				speed_results.Kbps = speed_results.Kbps.toFixed(2);

				// Write HTML
				that.$('.results').html(template(speed_results));

				// Show results
				that.$('.results').show();

				// alert( 'Speed test complete:  ' + speed.Kbps + ' Kbps');
				// put your logic here
				if( speed_results.Kbps < 200 ){
					// alert('Your connection is too slow');
				}
			}
		});


	},

	checkConnection: function(){
		var networkState = navigator.connection.type;

		var states = {};
		states[Connection.UNKNOWN]  = 'Unknown connection';
		states[Connection.ETHERNET] = 'Ethernet connection';
		states[Connection.WIFI]     = 'WiFi connection';
		states[Connection.CELL_2G]  = 'Cell 2G connection';
		states[Connection.CELL_3G]  = 'Cell 3G connection';
		states[Connection.CELL_4G]  = 'Cell 4G connection';
		states[Connection.CELL]     = 'Cell generic connection';
		states[Connection.NONE]     = 'No network connection';

		return states[networkState];
	},

	backButton: function(ev){
		var that = this,
			elem = ev.currentTarget;

		this.back();

		ev.preventDefault();
		ev.stopPropagation();
		return false;
	},

	back: function(){
		// Go back to settings page
		var that = this;

		this.trigger('back');
	},

	render: function(){
		var that = this;

		// Remove any previous one
		// $('.logout').remove();

		// Build from template
		var template = App.Utils.template('t_speedtest');

		// Write HTML
		that.$el.html(template());

		// Back button
		this.backbuttonBind = App.Utils.BackButton.newEnforcer(this.back);

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
		'click p.login button' : 'login',
		'click p.scan_login button' : 'scan_login'

	},

	initialize: function() {
		_.bindAll(this, 'render');

	},

	scan_login: function(ev){
		// Testing scan_login

		// alert('testing scanner');
		window.plugins.barcodeScanner.scan(
			function (result) { 
				// Got a barcode

				try {
					var barcode = result.text.split('+');
				} catch(err){
					alert('Failed loading barcode, please try again');
					return false;
				}

				if(barcode.length != 2){
					alert('Failed barcode test. Please try again');
					return false;
				}

				// Split into user and access_token
				var access_token = barcode[0],
					user_identifier = barcode[1];

				// Set that value to our login value

				// Try logging in with it
				// - eventually, exchange for an access_token

				App.Utils.Storage.set(App.Credentials.prefix_access_token + 'user', user_identifier, 'critical')
					.then(function(){
						// Saved user!
					});

				App.Utils.Storage.set(App.Credentials.prefix_access_token + 'access_token', access_token, 'critical')
					.then(function(){

						// Reload page, back to #home
						
						// clear body
						$('body').html('');

						// Reload page, back to #home
						window.location = [location.protocol, '//', location.host, location.pathname].join('');
					});
					
			}, 
			function (error) { 
				alert("Scanning failed: " + error); 
			} 
		);

		return false;

	},

	login: function(ev){
		// Start OAuth process
		var that = this;

		var p = {
			app_id : App.Credentials.app_key,
			callback : [location.protocol, '//', location.host, location.pathname].join('')
		};
		
		if(usePg){
			
			var p = {
				response_type: 'token',
				client_id : App.Credentials.app_key,
				redirect_uri : 'https://getemailbox.com/testback'
				// state // optional
				// x_user_id // optional	
			};
			var params = $.param(p);
			var call_url = App.Credentials.base_login_url + "/apps/authorize/?" + params;

			var ref = window.open(call_url, '_blank', 'location=no');
			ref.addEventListener('loadstart', function(event) { 
				// event.url;

				var tmp_url = event.url;

				var parser = document.createElement('a');
				parser.href = tmp_url;

				if(parser.hostname == 'getemailbox.com' && parser.pathname.substr(0,9) == '/testback'){
					
					// window.plugins.childBrowser.close();
					// alert('closing childbrowser after /testback');
					// return false;
					// alert('testback');

					// url-decode
					// alert(tmp_url);
					var url = decodeURIComponent(tmp_url);
					// alert(url);

					// var qs = App.Utils.getUrlVars();
					var oauthParams = App.Utils.getOAuthParamsInUrl(url);
					// alert(JSON.stringify(oauthParams));

					// if(typeof qs.user_token == "string"){
					if(typeof oauthParams.access_token == "string"){

						// Have an access_token
						// - save it to localStorage

						// App.Utils.Storage.set(App.Credentials.prefix_access_token + 'user', oauthParams.user_identifier);
						// App.Utils.Storage.set(App.Credentials.prefix_access_token + 'access_token', oauthParams.access_token);

						App.Utils.Storage.set(App.Credentials.prefix_access_token + 'user', oauthParams.user_identifier, 'critical')
							.then(function(){
								// Saved user!
								// alert('saved user');
							});

						App.Utils.Storage.set(App.Credentials.prefix_access_token + 'access_token', oauthParams.access_token, 'critical')
							.then(function(){
								
								// Reload page, back to #home
								// forge.logging.info('reloading');

								// alert('success');
								// window.plugins.childBrowser.close();

								// Emit save event (write file)
								App.Events.trigger('FileSave',true);
								ref.close();


								// // Reload page, back to #home
								// window.location = [location.protocol, '//', location.host, location.pathname].join('');

								$('body').html('Loading');

								// Reload page, back to #home
								window.setTimeout(function(){
									window.location = [location.protocol, '//', location.host, location.pathname].join('');
								},500);
							});

					} else {
						// Show login splash screen
						var page = new App.Views.BodyLogin();
						App.router.showView('bodylogin',page);

						alert('Problem logging in');
						// window.plugins.childBrowser.close();
						ref.close();

					}

					return;

				}

				return;

			});
			// ref.addEventListener('loadstop', function(event) { alert('stop: ' + event.url); });
			ref.addEventListener('loaderror', function(event) { console.error('Uh Oh, encountered an error: ' + event.message); });
			// ref.addEventListener('exit', function(event) { alert('exit1');alert(event.type); });

		} else {

			var p = {
				response_type: 'token',
				client_id : App.Credentials.app_key,
				redirect_uri : [location.protocol, '//', location.host, location.pathname].join('')
				// state // optional
				// x_user_id // optional	
			};
			var params = $.param(p);

			window.location = App.Credentials.base_login_url + "/apps/authorize/?" + params;

		}

		return false;

	},

	render: function() {

		var template = App.Utils.template('t_body_login');

		// Write HTML
		$(this.el).html(template({
			version: App.Data.version
		}));

		return this;
	}
});

App.Views.BodyUnreachable = Backbone.View.extend({
	
	el: 'body',

	events: {
		'click .retry' : 'reload'

	},

	initialize: function() {
		_.bindAll(this, 'render');

	},

	reload: function(){
		// Reload the page
		// - easiest way, simpler than reloading all the fetch calls
		window.location = window.location.href;
	},

	render: function() {

		var template = App.Utils.template('t_body_unreachable');

		// Write HTML
		$(this.el).html(template());

		return this;
	}
});


App.Views.StartupTutorial = Backbone.View.extend({
	
	id: 'modalTutorial',
	className: 'modal hide',

	events: {
		'click .next_step' : 'next_step',
		'click .exit_tutorial' : 'exit_tutorial'
	},

	current_step: 0,
	steps: [
		't_startup_tutorial_0',
		't_startup_tutorial_1',
		't_startup_tutorial_075',
		't_startup_tutorial_05',
		// 't_startup_tutorial_2',
		// 't_startup_tutorial_3',
		't_startup_tutorial_4'
	],

	initialize: function() {
		_.bindAll(this, 'render');


		// Trigger a contacts sync
		// - this seems to be a good place to do this (on launch)
		Api.event({
			data: {
				event: 'Contacts.sync',
				obj: true
			},
			success: function(resp){
				// return from contacts sync
			}
		});
	},

	next_step: function(ev){
		// alert('Tutorial is a work-in-progress');
		// $('#modalTutorial').modal('hide');

		ev.preventDefault();

		// Increase to next step
		this.current_step++;

		// Does that step exist?
		if(this.steps.length < this.current_step){
			alert('Abrupt end to tutorial, no?');
			this.exit_tutorial();
		}

		// Build from template
		var template = App.Utils.template(this.steps[this.current_step]);

		// Write HTML
		this.$('.modal-body').html(template({
			current: this.current_step + 1,
			total: this.steps.length
		}));

		return false;
	},

	exit_tutorial: function(){
		$('#modalTutorial').modal('hide');

		// this.unbind();
		return false;
	},

	render: function() {

		// Remove any previous version
		$('#modalTutorial').remove();

		// Build from template
		var template = App.Utils.template('t_startup_tutorial');

		this.$el.html(template({
			current: 1,
			total: this.steps.length
		}));

		// Write HTML
		$('body').append(this.el);

		// Display Modal
		$('#modalTutorial').modal({
			backdrop_click: false
		});

		this.current_step = 0;

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
	
	id: 'toast',

	events: {
	},

	initialize: function() {
		_.bindAll(this, 'render');
	},

	render: function() {
		var that = this;
		// Remove any previous version
		// $('#toast').remove();

		// Build from template
		var template = App.Utils.template('t_toast');

		// Write HTML
		this.$el.html(template({
			message: this.options.message
		}));

		// Add classname
		if(this.options.type){
			this.$el.addClass('toast-' + this.options.type);
		}

		$('body').append(this.el);
		// $(this.el).append(template({
		// 	message: this.options.message
		// }));

		this.$el.animate({
			opacity: 1
		},'fast');

		// Display Modal
		window.setTimeout(function(){
			that.$el.animate({
				opacity: 0
			},'fast',function(){
				// $(this).remove();
				that.close();
			});
		},3000);

		return this;
	}

});


App.Views.OnlineStatus = Backbone.View.extend({
	
	className: 'online-status nodisplay',

	events: {},

	initialize: function() {
		_.bindAll(this, 'render');

		// Render it

		// display is on or off

		this.on('online',this.hide,this);
		this.on('offline',this.show,this);
	},

	show: function(){
		this.$el.removeClass('nodisplay');
	},

	hide: function(){
		// Add nodisplay
		this.$el.addClass('nodisplay');
	},

	render: function() {

		// Add to page

		// Build from template
		var template = App.Utils.template('t_online_status');

		// Write HTML
		// - to body
		this.$el.html(template());
		$('body').append(this.$el);

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

		// Displaying debug output, or just a "refreshing" thing? 

		// Build from template
		var template;
		if(1==0){
			template = App.Utils.template('t_debug_messages');
		} else {
			template = App.Utils.template('t_debug_messages_production');
		}

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
		// 'click .option' : 'click_option',
		'click .option' : 'click_option',
		'shorttap .option' : 'shorttap_option',
		'longtap .option' : 'longtap_option',
		'click .delay-modal-exit span' : 'cancel',
		// 'click .option' : 'longtap_option', // enabling will cause double-calendar on mobile
		
		'click .overlay' : 'cancel',
		'blur #pickadate' : 'picked_date',

		'click #time_example div' : 'modify_time',

		'click .btn-cancel' : 'cancel_confirmation',
		'click .btn-delay' : 'choose_confirmation'
	},

	initialize: function() {
		_.bindAll(this, 'render');
		_.bindAll(this, 'beforeClose');
		_.bindAll(this, 'cancel');
		_.bindAll(this, 'save_delay');
		_.bindAll(this, 'time_scroller_and_cal');

		this.threadView = $(this.options.context).parents('.thread');
		this.threadid = this.options.threadid;

	},

	beforeClose: function(){
		// Kill back button grabber
		var that = this;

		App.Utils.BackButton.debubble(this.backbuttonBind);

		return;
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
		if(usePg){

		} else {
			// browser
			this.longtap_option(ev);
		}

		return false;
	},

	shorttap_option: function(ev){
		
		// Clicked an option
		// - take an action on the Thread
		var that = this,
			elem = ev.currentTarget;

		ev.preventDefault();
		ev.stopPropagation();

		// Valid?
		if($(elem).hasClass('ignore')){
			return false;
		}

		// Is pick-a-date?
		if($(elem).hasClass('pickadate')){

			// put the current date-time
			this.time_scroller_and_cal(new Date());

		} else {

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
					tmp_delay = val;
				}
			});
			if(wait == null){
				// alert('Invalid type used');
				this.close();
				return;
			}

			// Delay it
			// - no option, just using the delay right away
			that.save_delay(wait, tmp_delay.name);

		}


		// return;

		// // Date
		// // var arr = this.$("#date").mobiscroll().parseValue(wait);
		// // console.log('hello');
		
		// // // var mobi_inst = $('#date').mobiscroll('getInst');
		// // var parsedScrollValues = App.Plugins.Minimail.formatDateForScroll(wait);
		// // this.dateScroll.mobiscroll('setValue',parsedScrollValues,true);

		// var parsedScrollValues = App.Plugins.Minimail.formatDateForScroll(wait);
		// this.timeScroll.mobiscroll('setValue',parsedScrollValues,true);

		// // Trigger date confirmation
		// window.setTimeout(function(){
		// 	that.$('.options').addClass('nodisplay');
		// 	that.$('.choose_datetime').removeClass('nodisplay');
		
		// 	// Full calendar
		// 	$('#calendar').fullCalendar({
		// 		// put your options and callbacks here
		// 		// defaultView: 'month',
		// 		dayClick: function(date) {
		// 			// Select that date on calendar
		// 			$('.fc-state-highlight').removeClass('fc-state-highlight');
		// 			$(this).addClass('fc-state-highlight');
		// 		}
		// 	});

		// 	// Add button class (hacky)
		// 	// $('.fc-button').addClass('btn');

		// 	// // $('.fc-button-today').click();
		// 	// window.setTimeout(function(){
		// 	// 	// $('#calendar').fullCalendar('today');
		// 	// 	// $('.fc-button-today').trigger('click');
		// 	// 	$('#calendar').fullCalendar('render');
		// 	// },300);
		// },100);

		return false;
	},

	longtap_option: function(ev){
		
		// Clicked an option
		// - take an action on the Thread
		var that = this,
			elem = ev.currentTarget;

		// prevent event continuing to calendar, scroller, etc.
		ev.preventDefault();
		ev.stopPropagation();

		// Valid?
		if($(elem).hasClass('ignore')){
			return false;
		}

		// Is pick-a-date?
		if($(elem).hasClass('pickadate')){

			// put the current date-time
			this.time_scroller_and_cal(new Date());

		} else {

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
					tmp_delay = val;
				}
			});
			if(wait == null){
				// alert('Invalid type used');
				this.close();
				return;
			}

			// Show calendar and time scroller
			this.time_scroller_and_cal(wait);

		}

		return false;

	},


	time_scroller_and_cal: function(wait){
		var that = this;

		// Hide options nicely
		that.$('.options').addClass('nodisplay');

		// Set values for time scroller
		var parsedScrollValues = App.Plugins.Minimail.formatTimeForScroll(wait);
		this.timeScroll.mobiscroll('setValue',parsedScrollValues,true);

		// Set calender datetime to wait value, track it
		that.wait_time = wait;
		that.wait_date = wait.toString('yyyy-MM-dd');

		// Set values on the #time_example rectangle
		that.$('#time_example div').text(wait.toString('h:mm tt'));

		// Trigger date confirmation
		window.setTimeout(function(){
			that.$('.choose_datetime').removeClass('nodisplay');
		
			// Full calendar
			$('#calendar').fullCalendar({
				// put your options and callbacks here
				// defaultView: 'month',
				selectable: false,
				dayClick: function(date) {
					// Update date we want to use
					that.wait_date = date.toString('yyyy-MM-dd');

					// Select that date on calendar
					// - remove any other ones
					updateCalendarSelection();

				}
			});

			$('#calendar').find('.fc-button').on('click',function(){
				// Update selected date if changing months
				updateCalendarSelection();
			});

			// Goto correct date with calendar
			$('#calendar').fullCalendar('gotoDate',wait);

			
			// Create update calendar function
			var updateCalendarSelection = function(){
				$('#calendar td[data-date]').removeClass('fc-state-highlight');
				$('#calendar td[data-date="'+ that.wait_date +'"]').addClass('fc-state-highlight'); // [data-date="2013-03-27"]
			}

			// Select the correct datetime
			updateCalendarSelection();

			// Add button class (hacky)
			$('.fc-button').addClass('btn');

		},500);

		return false;
	},

	cancel_confirmation: function(ev){
		// Cancelled choosing datetime
		// - return to 
		var that = this,
			elem = ev.currentTarget;

		// Swap classes
		this.$('.options').removeClass('hiding nodisplay');
		this.$('.choose_datetime').addClass('nodisplay');

		// No calendar
		$('#calendar').html('');

		return false;
	},

	choose_confirmation: function(ev){
		// Confirmed a delay
		var that = this,
			elem = ev.currentTarget;

		// Get the time from the time scroller
		var wait_time = App.Plugins.Minimail.parseTimeFromScroll(that.timeScroll.mobiscroll('getValue'));

		// Get the date from the calendar
		// - stored in View
		var wait_date = Date.parse(that.wait_date);

		// Merge wait_time and wait_date together to form wait_datetime (complete datetime)
		var wait = new Date(wait_date.getFullYear(), wait_date.getMonth(), wait_date.getDate(), wait_time.getHours(), wait_time.getMinutes(), wait_time.getSeconds());
		
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

		return false;
	},

	modify_time: function(ev){
		// Show the time modal
		var that = this,
			elem = ev.currentTarget;

		// Show modal
		that.timeScroll.mobiscroll('show')

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
		var that = this;

		// Remove any previous version
		$('#delay_modal').remove();
		$('#calendar').remove(); // if exists

		// Build from template
		var template = App.Utils.template('t_delay_modal');

		// Get delay options (later today, etc.)
		var delay_options = App.Plugins.Minimail.getDelayOptions();

		// Write HTML
		this.$el.html(template({
			delay_options: delay_options
		}));

		// // Date-time scroller/picker
		// this.dateScroll = this.$("#date").mobiscroll().datetime({
		// 	display: 'inline',
		// 	theme: 'jqm'
		// });

		// (only) Time scroller/picker
		this.timeScroll = this.$("#time_example div").mobiscroll().time({
			display: 'modal',
			theme: 'wp',
			mode: 'clickpick',
			stepMinute: 15,
			timeFormat: 'h:ii a',
			setText: 'Save Time',
			cancelText: "Don't Save",
			onCancel: function(valueText, inst){

			},
			onSelect: function(valueText, inst){
				that.$('#time_example div').text(valueText);
				
			}
		});

		// this.timeScroll.onClose(function(){
		// 	alert('onClose2');
		// });

		// Bind to back button
		// - bubbles previous ones lower (only 1 at a time allowed to bind to the back button)
		// - move this to the Backbone.Views (extend it)
		this.backbuttonBind = App.Utils.BackButton.newEnforcer(this.cancel);

		// Turn on tap watching

		App.Utils.WatchCustomTap(that.$('.option'));

		return this;
	}

});


App.Views.HtmlEmail = Backbone.View.extend({

	className: 'big_html_email',

	events: {
		'click .html-email-exit' : 'cancel'
	},

	initialize: function() {
		_.bindAll(this, 'render');
		_.bindAll(this, 'cancel');
		// _.bindAll(this, 'beforeClose');
		// _.bindAll(this, 'cancel');
		// _.bindAll(this, 'save_delay');

		// this.threadView = $(this.options.context).parents('.thread');
		// this.threadid = this.options.threadid;

	},

	beforeClose: function(){
		// Kill back button grabber
		var that = this;

		App.Utils.BackButton.debubble(this.backbuttonBind);

		return;
	},

	cancel: function(ev){
		// Remove overlay
		this.close();

		return false;
	},

	render: function() {
		var that = this;

		// Build from template
		var template = App.Utils.template('t_html_email_view');

		// Write HTML
		this.$el.html(template());

		var $useBody;

		// slider
		$(".noUiSlider").noUiSlider({
			range: [20, 200] // 2% to 200%
			,start: 100
			,handles: 1
			,slide: function(){
				// percentage: $(this).val();

				var newVal = $(this).val() / 100;

				$useBody.css({

				 zoom: newVal,
				  "-moz-transform": "scale("+newVal+")",
				  "-moz-transform-origin" : "0 0",
				  "-webkit-transform" : "scale("+newVal+")",
				  "-webkit-transform-origin" : "0 0"

				});
			}
		});
		// $( ".slider" ).slider();

		// Create frame
		var $frame = $('<iframe id="email_html">');

		// Append frame to this el
		this.$('.html_email').append($frame);


		setTimeout( function() {
			var doc = $frame[0].contentWindow.document;

			doc.open();
			doc.write(that.options.html);

			// var $html = $('html',doc);
			// console.log(that.options.html);
			// $html.html(that.options.html);

			// var viewPortTag=doc.createElement('meta');
			// viewPortTag.id="viewport";
			// viewPortTag.name = "viewport";
			// viewPortTag.content = "width=device-width, initial-scale=2.0, maximum-scale=5.0, minimum-scale=0.5, user-scalable=1;";

			// doc.getElementsByTagName('head')[0].appendChild(viewPortTag);
			

			var $html = $('html',doc);
			$useBody = $('body',doc);
			




			// console.info('end viewporttag');

			// var meta = $('meta[name=viewport]', doc);
			// $(meta).attr('content', 'device-width, initial-scale=0.5, minimum-scale=0.5, maximum-scale=5');

		}, 1 );

		// Create iframe and display it

		// Bind to back button
		this.backbuttonBind = App.Utils.BackButton.newEnforcer(this.cancel);

		// Turn on tap watching
		// App.Utils.WatchCustomTap(that.$('.option'));

		return this;
	}

});



