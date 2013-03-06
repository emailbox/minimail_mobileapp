// Simpler functions for plugins (like Models/components)

App.Plugins.Minimail = {

	login: function(){
		// Login into our server

		var dfd = $.Deferred();

		var loginData = {
			access_token: App.Credentials.access_token
		};

		var ajaxOptions = {
			url: App.Credentials.minimail_server + '/api/login',
			type: 'POST',
			cache: false,
			data: loginData,
			dataType: 'json',
			// headers: {"Content-Type" : "application/json"},
			error: function(err){
				// Failed for some reason
				// - probably not on the internet
				if(!App.Data.online){
					alert('Unable to load a data connection (placeholder)');
				}
			},
			success: function(jData){
				// Result via Minimail server
				// - sets cookie?

				if(jData.code != 200){
					//Failed logging in
					clog('==failed logging in');
					dfd.reject(false);
					return;
				}


				App.Credentials.app_user = jData.data.user;
				// clog('App.Credentials.app_user');
				// clog(App.Credentials.app_user);

				// dfd.resolve();

				// Backbone.history.loadUrl('body');

				// Resolve previous promise
				dfd.resolve(true);

				// Subscribe to push notifications
				if(useForge){
					// alert('subscribing');
					forge.partners.parse.push.subscribe('c_' + App.Credentials.app_user.id,
						function () {
							forge.logging.info("subscribed to push notifications!");
						},
						function (err) {
							forge.logging.error("error subscribing to push notifications: "+ JSON.stringify(err));
						}
					);
				}
				if(usePg){
					// todo...
				}


			}
		};

		if(useForge){
			clog('FORGE AJAX');
			window.forge.ajax(ajaxOptions);
		} else {
			$.ajax(ajaxOptions);
		}

		return dfd.promise();

	},

	getThreadAndEmails: function(thread_id){
		// Return an individual Thread, including all Emails inside (received, sent, drafts, etc.)

		// Start deferred (1st time)
		var dfd = $.Deferred();

		// Individual thread
		var query = 
		{
			"model" : "Thread",
			"conditions" : {
				"_id" : thread_id
			},
			"fields" : [], // Whole Entity
			"limit" : 1,
			"offset" : 0 // Pagination
		};

		Api.search({
			data: query,
			success: function (response){
				
				try {
					var json = $.parseJSON(response);
				} catch (err){
					alert("Failed parsing JSON");
					return;
				}

				// Check the validity
				if(json.code != 200){
					// Expecting a 200 code returned
					clog('failed getting thread');
					dfd.reject();
					return false;
				}

				// One Thread returned?
				if(json.data.length != 1){
					// Shit
					clog('Could not find Thread');
					return;
				}

				var thread = json.data[0];

				// Convert into a single Thread
				var returnThread = {
								Thread: thread.Thread,
								Email: []
							};

				// Get Emails
				// - sent, received, etc.
				var emails_query = 
				{
					model : "Email",
					conditions : {
						"attributes.thread_id" : thread.Thread._id
					},
					fields : [
								// Common
								'attributes',
								'common',
								'original',
								],
					limit : 200
				};

				Api.search({
					data: emails_query,
					success: function (response){
					
						try {
							var emails_json = $.parseJSON(response);
						} catch (err){
							alert("Failed parsing JSON");
							return;
						}

						// Check the validity
						if(emails_json.code != 200){
							// Expecting a 200 code returned
							clog('Error, not 200. emails_query');
						}

						// Sort Emails
						emails_json.data = App.Utils.sortBy(emails_json.data,'Email.common.date','asc','date');

						// Add emails to Thread
						$.each(emails_json.data,function(i,email){
							// Add to the Thread object
							returnThread.Email.push(email.Email);
						});

						dfd.resolve(returnThread);

					}
				});

			}


		});

		// Return search function
		return dfd.promise();

	},

	getDelayOptions: function(){

		var opts = [];

		// Add options depending on time of day, etc.
		// - using simple ones for now

		// opts.push({
		// 	name: "Few Seconds",
		// 	key: 'few_seconds',
		// 	wait: (5).seconds().fromNow()
		// });
		opts.push({
			name: "3 Hours",
			key: 'few_hours',
			wait: (3).hours().fromNow()
		});

		var nowTime = new Date.now();

		// after_lunch if it is > 7hours away (meaning it is already after lunch)
		opts.push({
			name: "After Lunch",
			key: 'after_lunch',
			wait: new Date.now().set({hours: 13,minutes: 0})
		});
		var hours_diff = (Date.today().set({hours: 13,minutes: 0}).getTime() - nowTime.getTime()) / (1000 * 60 * 60);
		if(hours_diff < 0 || hours_diff > 7){
			opts[opts.length - 1].hide = 'invisible ignore';
		}

		// 2
		opts.push({
			name: "Tomorrow",
			key: 'tomorrow_morning',
			wait: new Date.parse('tomorrow +7 hours')
		});
		opts.push({
			name: "Friday",
			key: 'friday',
			wait: new Date.today().next().friday().add({hours: 7})
		});
		// Hide Friday if Tomorrow/both are equal (show "Tomorrow" only)
		if(opts[opts.length - 1].wait.getTime() == opts[2].wait.getTime()){
			opts[opts.length - 1].hide = 'duplicate';
		}

		// Saturday
		opts.push({
			name: "This Weekend",
			key: 'weekend',
			wait: new Date.today().next().saturday().add({hours: 7})
		});
		// Hide Saturday if Tomorrow/both are equal (show "Tomorrow" only)
		if(opts[opts.length - 1].wait.getTime() == opts[2].wait.getTime()){
			opts[opts.length - 1].hide = 'duplicate';
		}

		opts.push({
			name: "Next Week", // next monday
			key: 'next_week',
			wait: new Date.today().next().monday().add({hours: 7})
		});
		// Hide Next Week if Tomorrow/both are equal (show "Tomorrow" only)
		if(opts[opts.length - 1].wait.getTime() == opts[2].wait.getTime()){
			opts[opts.length - 1].hide = 'duplicate';
		}

		opts.push({
			name: "Next Month",
			key: 'next_month',
			wait: new Date.today().next().month().set({day: 1}).add({hours: 7})
		});
		opts.push({
			name: "3 Months",
			key: 'three_months',
			wait: new Date.today().add({months: 3}).set({day: 1}).add({hours: 7})
		});

		return opts;

	},


	saveNewDelay: function(thread_id, delay_datetime_in_seconds, delay_in_seconds){
		// Delay a Thread.id for awhile longer

		var dfd = $.Deferred();

		// Mark as recently acted on
		App.Plugins.Minimail.add_to_recently_acted_on(thread_id);

		// Mark as Not Done

		// var delay_datetime_sec = parseInt(delay_datetime.getTime() / 1000);
		// clog('s');
		// clog(delay_datetime.toString());
		// clog(delay_datetime_sec);


		// Fire event
		Api.event({
			data: {
				event: 'Minimail.wait_until_fired',
				delay: delay_in_seconds,
				obj: {
					text: "An email is due"
				}
			},
			success: function(response){
				response = JSON.parse(response);

				if(response.code != 200){
					// Failed launching event
					dfd.reject(false);
					return;
				}

				// Save new delay also
				clog('updating');
				Api.update({
					data: {
						model: 'Thread',
						id: thread_id,
						paths: {
							"$set" : {
								"app.AppPkgDevMinimail.wait_until" : delay_datetime_in_seconds,
								"app.AppPkgDevMinimail.wait_until_event_id" : response.data.event_id,
								"app.AppPkgDevMinimail.done" : 0
							}
						}
					},
					success: function(response){
						// Update the 
						clog('updated');
						dfd.resolve(true);
					}
				});

			}
		});


		return dfd.promise();
	},


	saveAsDone: function(thread_id){
		// Delay a Thread.id for awhile longer

		var dfd = $.Deferred();

		// Mark as recently acted on
		App.Plugins.Minimail.add_to_recently_acted_on(thread_id);

		// Mark as Not Done

		// var delay_datetime_sec = parseInt(delay_datetime.getTime() / 1000);
		// clog('s');
		// clog(delay_datetime.toString());
		// clog(delay_datetime_sec);

		Api.update({
			data: {
				model: 'Thread',
				id: thread_id,
				paths: {
					"$set" : {
						"app.AppPkgDevMinimail.done" : 1
					}
				}
			},
			success: function(response){
				// Update the 
				clog('updated');
			}
		});

		return dfd.promise();
	},



	thread_main: {
		

		start: function(e){
			// var that = this;

			var $parent_controller = $(this).parents('.all_threads');

			// Already in multi-select mode?
			if($parent_controller.hasClass('multi-select-mode')){
				// In multi-select
				// - let the click handler do things

				// // Already selected?
				// if($(this).hasClass('multi-selected')){
				// 	// un-selected
				// 	$(this).removeClass('multi-selected');

				// 	// Anybody else selected?
				// 	if($('.multi-selected').length < 1){
				// 		// turn of multi-select mode
				// 		$parent_controller.removeClass('multi-select-mode');
				// 	}

				// } else {
				// 	// select row
				// 	$(this).addClass('multi-selected');
				// }
				return;
			}

			// Are two fingers being used?
			if(e.originalEvent.touches.length > 1){
				// multi-finger

				// add touch to all events
				$(this).addClass('touch_start');
				$('.touch_start').addClass('multi-selected');
				$('.touch_start').removeClass('touch_start');

				$parent_controller.addClass('multi-select-mode');

				// clog('===firing');
				return;
			}

			var coords = App.Utils.get_point_position(e);
			if(!coords.y){
				clog('Failed y');
				return;
			}

			// Add Class
			$(this).addClass('touch_start');

			// Store original finger position
			$(this).attr('finger-position-x',coords.x);
			$(this).attr('finger-position-y',coords.y);


		},

		move: function(e){

			// Are we looking at this guy right now?
			if($(this).hasClass('touch_start')){

				// Get coordinates
				var coords = App.Utils.get_point_position(e);
				if(!coords.y){
					return;
				}

				// Still hovering over this guy? 

				var this_x = $(this).attr('finger-position-x');
				var this_y = $(this).attr('finger-position-y');

				var x_diff = coords.x - this_x;
				var y_diff = coords.y - this_y;

				// Moved finger/mouse too far vertically?
				// - revert
				// - do it over a timeframe? 
				y_diff = Math.abs(y_diff);
				if(y_diff > App.Credentials.thread_move_y_threshold){
					// Revert! 
					// $(this).removeClass('touch_start');
					App.Plugins.Minimail.revert_box(this);
					return;
				}

				// Move it left-right the same amount as has already been moved
				$(this).css({
					position: 'relative',
					left: x_diff
				});

				var x_ratio_diff = Math.abs(x_diff / $(this).parents('.thread').width());

				// Figure out which color to show as the bg
				if(x_diff > 0){
					// Dragging right
					// - take an action
					$(this).parents('.thread').addClass('dragright');
					$(this).parents('.thread').removeClass('dragleft');
				} else {
					// Dragging left
					// - delaying
					$(this).parents('.thread').addClass('dragleft');
					$(this).parents('.thread').removeClass('dragright');

					// Change text to match
					// - based on how far you pull it

					// 2 options for delay when dragging
					// - a few hours
					// - select from list

					// Doesn't take into account the why...?
					// - lets go with the assumption that I'll remember the 'why' most of the time
					// - keep it an extra step to do why, before saving

					// Past threshold for Option 1?
					if(x_ratio_diff > .50){
						$(this).parents('.thread').find('.thread-bg-time p').html('Pick a Delay');
					} else if(x_ratio_diff > App.Credentials.thread_move_x_threshold){
						$(this).parents('.thread').find('.thread-bg-time p').html('A Few Hours');
					} else {
						// Remove any text that is there
						$(this).parents('.thread').find('.thread-bg-time p').html('&nbsp;');
					}


				}

				// Add class for tripped
				if(x_ratio_diff > App.Credentials.thread_move_x_threshold){
					$(this).parents('.thread').addClass('tripped');
				} else {
					$(this).parents('.thread').removeClass('tripped');
				}


				// clog(x_diff + ', ' + y_diff);


				// Figure out how far left-right the finger has moved
			}


		},

		end: function(e){
			var that = this;

			if($(this).hasClass('touch_start')){

				var coords = App.Utils.get_point_position(e);
				if(!coords.y){
					return;
				}

				var this_x = $(this).attr('finger-position-x');
				var this_y = $(this).attr('finger-position-y');

				var x_diff = coords.x - this_x;
				var y_diff = coords.y - this_y;

				var x_ratio_diff = Math.abs(x_diff / $(this).parents('.thread').width());
				if(x_ratio_diff > App.Credentials.thread_move_x_threshold){
					// Moved far enough


					var thread_id = $(this).parents('.thread').attr('data-id');

					// Which action to take?
					if(x_diff > 0){
						// Sliding right
						// - mark as done

						App.Utils.toast('Marked as done');
						App.Plugins.Minimail.saveAsDone(thread_id); // should also kill any wait_until queues

						// Scroll the window
						var now_scroll_height = $(this).parents('.threads_holder').scrollTop();
						$(this).parents('.threads_holder').scrollTo(now_scroll_height - 74,500);

						// Hide it
						// $(this).parents('.thread').slideUp('slow');
						$(this).animate({
							left: $(this).parents('.thread').width(),
							opacity: 0
						},{
							duration: 500,
							complete: function(){
								// $(this).parents('.thread').slideUp();
								$(this).removeClass('touch_start');
							}
						});

					} else {
						// Sliding left
						// - bring up delay screen

						// App.Utils.toast('Delayed');

						// Move further to the left

						// Hide it
						// $(this).parents('.thread').slideUp('slow');
						$(this).animate({
							left: -1 * $(this).parents('.thread').width()
						},{
							complete: function(){
								// $(this).parents('.thread').slideUp();
								$(this).removeClass('touch_start');
							}
						});

						// Past thresholds?
						if(x_ratio_diff > .50){
							// Pick a Time

							// Display delay_modal Subview
							var subView = new App.Views.DelayModal({
								context: this,
								threadid: thread_id
							});
							$('body').append(subView.$el);
							subView.render();


						} else if(x_ratio_diff > App.Credentials.thread_move_x_threshold){
							$(this).parents('.thread').find('.thread-bg-time p').html('A Few Hours');

							// Make wait_for be A Few Hours
							$(this).parents('.thread').addClass('finished');

							// Scroll the window
							var now_scroll_height = $(this).parents('.threads_holder').scrollTop();
							$(this).parents('.threads_holder').scrollTo(now_scroll_height - 74,500);

							// Save delay
							var delay_seconds = 60 * 60 * 3; // 3 hours
							var now = new Date();
							var now_sec = parseInt(now.getTime() / 1000);
							var in_seconds = now_sec + (delay_seconds);//(60*60*3);
							// var test = new Date(in_seconds * 1000);
							// clog(test);
							App.Plugins.Minimail.saveNewDelay(thread_id,in_seconds,delay_seconds);


						} else {
							// Remove any text that is there
							// - should not get here
							clog("BAD PLACE TO BE");
						}
						

					}

				} else {
					// Revert back to original position
					App.Plugins.Minimail.revert_box(this);
				}
			}
				

		}
	},

	unsubscribe_from_push: function(){

		var dfd = $.Deferred();

		if(useForge){
			forge.partners.parse.push.subscribedChannels(
				function (channels) {
					// Unsubscribe from each
					forge.logging.info("subscribed to: "+JSON.stringify(channels));
					$.each(channels,function(channel){
						clog('channel');
						clog(channel);
						forge.partners.parse.push.unsubscribe(channel,function(){
								// worked OK
							},
							function(err){
								clog('==Failed unsubscribing');
								clog(err);
							}
						);
					});

					// Resolve
					// - instant, not waiting for unsubscribe to succeed (todo...)
					dfd.resolve();
				},
				function(err){
					// Failed unsubscribing
					dfd.reject();
				}
			);
		} else {
			window.setTimeout(function(){
				dfd.resolve();
			},1);
		}

		return dfd.promise();

	},


	revert_box: function(box){
		var that = box;
		$(that).removeClass('touch_start');
		$(that).removeClass('finished');
		$(that).animate({
			left: 0
		},
		{
			queue: false,
			complete: function(){
				$(that).parents('.thread').removeClass('dragleft');
				$(that).parents('.thread').removeClass('dragright');
			}
		});
	},

	add_to_recently_viewed: function(threadid){
		// Adds a thread_id to the recently_viewed threads
		// - keeps the list at 100 emails?
		// - prevent duplicates

		// Remove value if exists previously
		App.Data.Store.ThreadsRecentlyViewed = _.filter(App.Data.Store.ThreadsRecentlyViewed,function(tmp_threadid){
			if(tmp_threadid != threadid){
				return true;
			}
		});

		// Add to beginning
		App.Data.Store.ThreadsRecentlyViewed.unshift(threadid);

		// Trim to 50
		App.Data.Store.ThreadsRecentlyViewed = App.Data.Store.ThreadsRecentlyViewed.splice(0,50);

	},

	add_to_recently_acted_on: function(threadid){
		// Adds a thread_id to the recently_viewed threads
		// - keeps the list at 100 emails?
		// - prevent duplicates

		// Remove value if exists previously
		App.Data.Store.ThreadsRecentlyActedOn = _.filter(App.Data.Store.ThreadsRecentlyActedOn,function(tmp_threadid){
			if(tmp_threadid != threadid){
				return true;
			}
		});

		// Add to beginning
		App.Data.Store.ThreadsRecentlyActedOn.unshift(threadid);

		// Trim to 50
		App.Data.Store.ThreadsRecentlyActedOn = App.Data.Store.ThreadsRecentlyActedOn.splice(0,50);

	},

	update_remote: function(css_or_html){

		// Update remote CSS
		if(css_or_html == 'both' || css_or_html == 'css'){
			
			$.ajax({
				url: 'css/extra.css',
				cache: false,
				success: function(cssText){
					
					// Emit event
					Api.event({
						data: {
							event: 'AppMinimailDebugCss.phone_update',
							obj: {
								css: cssText
							}
						},
						success: function(response){
							response = JSON.parse(response);
						}
					});

					// alert('Debug CSS turned on');
					// App.Utils.Storage.set('cssDebugOn',cssText);
				}
			});
		}

		// Update remote HTML
		if(css_or_html == 'both' || css_or_html == 'html'){
			Api.event({
				data: {
					event: 'AppMinimailDebugHtml.phone_update',
					obj: {
						html: $('body').html()
					}
				},
				success: function(response){
					response = JSON.parse(response);
				}
			});
		}
	}



}