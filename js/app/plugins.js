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
				console.log(2);
				if(!App.Data.online){
					alert('Unable to load a data connection (placeholder)');
				}
			},
			success: function(jData){
				// Result via Minimail server
				// - sets cookie?

				if(jData.code != 200){
					//Failed logging in
					console.log('==failed logging in');
					dfd.reject(jData);
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
			name: "Few minutes",
			key: 'few_minutes',
			wait: (15).minutes().fromNow()
		});
		opts.push({
			name: "3 Hours",
			key: 'few_hours',
			wait: (3).hours().fromNow()
		});

		var nowTime = new Date.now();

		// after_lunch if it is > 7hours away (meaning it is already after lunch)
		// opts.push({
		// 	name: "After Lunch",
		// 	key: 'after_lunch',
		// 	wait: new Date.now().set({hours: 13,minutes: 0})
		// });
		// var hours_diff = (Date.today().set({hours: 13,minutes: 0}).getTime() - nowTime.getTime()) / (1000 * 60 * 60);
		// if(hours_diff < 0 || hours_diff > 7){
		// 	opts[opts.length - 1].hide = 'invisible ignore';
		// }

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
		if(delay_in_seconds > 0){
			Api.event({
				data: {
					event: 'Minimail.wait_until_fired',
					delay: delay_in_seconds,
					obj: {
						threadid: thread_id,
						text: "An email is due"
					}
				},
				success: function(response){
					response = JSON.parse(response);

					// console.log(JSON.stringify(response));

					if(response.code != 200){
						// Failed launching event
						dfd.reject(false);
						return;
					}

				}
			});

			// Fire event to modify move Email/Thread to Archive (it will be brought back later when wait_until is fired)
			Api.event({
				data: {
					event: 'Thread.action',
					obj: {
						'_id' : thread_id, // allowed to pass a thread_id here
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
		}


		// Update api call
		Api.update({
			data: {
				model: 'Thread',
				id: thread_id,
				paths: {
					"$set" : {
						"app.AppPkgDevMinimail.wait_until" : delay_datetime_in_seconds,
						// "app.AppPkgDevMinimail.wait_until_event_id" : response.data.event_id,
						"app.AppPkgDevMinimail.done" : 0
					},
					"$inc" : {
						"app.AppPkgDevMinimail.delayed_count" : 1
					}
				}
			},
			success: function(response){
				// Update the 
				clog('updated');
				dfd.resolve(true);
			}
		});


		return dfd.promise();
	},


	saveAsDone: function(thread_ids, also_remove_waiting_on_x){
		// Delay a Thread.id for awhile longer
		// - accepts an array of thread_ids
		// - default: also_remove_waiting_on_x == true

		if(also_remove_waiting_on_x == undefined){
			also_remove_waiting_on_x = true;
		}

		var dfd = $.Deferred();

		// Mark as Done

		if(!$.isArray(thread_ids)){
			thread_ids = [thread_ids];
		}

		Api.update({
			data: {
				model: 'Thread',
				conditions: {
					_id: {
						"$in" : thread_ids
					}
				},
				multi:true,
				paths: {
					"$set" : {
						"app.AppPkgDevMinimail.done" : 1
					}
				}
			},
			success: function(response){
				// Update the 
				clog('updated');

				dfd.resolve();
			}
		});

		// Fire event to modify move Email/Thread to Archive (it will be brought back later when wait_until is fired)
		_.each(thread_ids, function(thread_id){
			Api.event({
				data: {
					event: 'Thread.action',
					obj: {
						'_id' : thread_id, // allowed to pass a thread_id here
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

		if(also_remove_waiting_on_x){

			// Emit an event that alters the Thread by labeling it
			_.each(thread_ids, function(thread_id){
				Api.event({
					data: {
						event: 'Thread.action',
						obj: {
							'_id' : thread_id,
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
							'_id' : thread_id,
							'action' : 'unlabel',
							'label' : 'WaitingOnOther'
						}
					},
					success: function(resp){

					}
				});
			});
		}

		return dfd.promise();
	},


	updateAndroidPushRegId: function(android_reg_id){
		// Update or create AppMinimailSettings
		// - per-user settings

		var dfd = $.Deferred();

		// See if already exists
		Api.search({
			data: {
				model: 'AppMinimailSettings',
				conditions: {
					'_id' : 1
				},
				fields: []
			},
			success: function(response){
				response = JSON.parse(response);
				
				if(response.code != 200){
					// Shoot
					return;
				}

				// Settings already exist?
				if(response.data.length < 1){
					// Not set
					// - create w/ defaults
					// alert('Settings being created');
					App.Utils.Notification.toast('Settings being created');

					// Default data to save to emailbox
					var defaultData = {
						'_id' : 1,
						android_reg_id: android_reg_id // push.android_reg_id
					};

					Api.write({
						data: {
							model: 'AppMinimailSettings',
							obj: defaultData
						},
						success: function(response){
							response = JSON.parse(response);
							if(response.code != 200){
								// Shoot
								alert('Settings failed to be created');
								dfd.resolve(false);
								return;
							}

							// Saved ok
							dfd.resolve(true);
						}
					});

				} else {
					// Settings already exist
					// - update them
					// alert(android_reg_id);
					Api.update({
						data: {
							model: 'AppMinimailSettings',
							id: 1,
							paths: {
								'$set' : {
									android_reg_id: android_reg_id
								}
							}
						},
						success: function(response){
							response = JSON.parse(response);
							if(response.code != 200){
								// Shoot
								dfd.resolve(false);
								return;
							}

							// Updated ok
							dfd.resolve(true);
						}
					});

				}
			}
		});

		// Return promise
		return dfd.promise();

	},

	process_push_notification_message: function(e){
		// Processing a single Push Notification
		// - not meant for handling a bunch in a row

		if (e.foreground) {
			// Launched 
			// alert('app in foreground');

			// Go to the Thread?
			// - load the thread first?

			// Go to thread referenced?
			// alert(JSON.stringify(e.payload));
			// alert(e.payload.threadid);
			if(e.payload.threadid){
				if(confirm('New Thread. View Thread?')){
					// App.Data.Store.Thread[this.threadid] = undefined;
					Backbone.history.loadUrl('view_thread/' + e.payload.threadid);
				}
			}


			// // if the notification contains a soundname, play it.
			// var my_media = new Media("/android_asset/www/"+e.soundname);
			// my_media.play();
		} else {    
			// Launched because the user touched a notification in the notification tray.
			// alert('app NOT in foreground');

			// Go to thread referenced?
			if(e.payload.threadid){
				// if(confirm('View Thread?')){
					// App.Data.Store.Thread[this.threadid] = undefined;
					Backbone.history.loadUrl('view_thread/' + e.payload.threadid);
				// }
			}

		}

	},


	thread_main: {
		
		start: function(e){
			// var that = this;

			var $parent_controller = $(this).parents('.all_threads');

			// Already in multi-select mode?
			if($parent_controller.hasClass('multi-select-mode')){
				// In multi-select

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
				

				// return;

			} else {

				// Are two fingers being used?
				if(usePg){
					if(e.originalEvent.touches.length > 1){
						// multi-finger

						// add touch to all events
						$(this).addClass('touch_start');
						$('.touch_start').addClass('multi-selected');
						$('.touch_start').removeClass('touch_start');

						// $parent_controller.addClass('multi-select-mode');
						$parent_controller.trigger('multi-change'); // not actually triggering anything?

						// clog('===firing');
						return;
					}
				}
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

			// Store total amount moved
			$(this).attr('x-total-diff',0);
			$(this).attr('y-total-diff',0);

			// Store time started
			// - prevent firing if held for awhile
			$(this).attr('finger-time',new Date().getTime());

		},

		move: function(e){

			// Are we looking at this guy right now?

			if($(this).hasClass('previewing')){
				return false;
			}
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

				// Add diff to existing diff values
				var total_x_diff = parseInt($(this).attr('x-total-diff'), 10) + Math.abs(x_diff);
				var total_y_diff = parseInt($(this).attr('y-total-diff'), 10) + Math.abs(y_diff);
				$(this).attr('x-total-diff', total_x_diff);
				$(this).attr('y-total-diff', total_y_diff);

				if(Math.abs(x_diff) < 30 && total_x_diff < 30){
					// Not moving yet, only moved 20 pixels
					return;
				}



				var $parent_controller = $(this).parents('.all_threads');
				// Already in multi-select mode?
				if($parent_controller.hasClass('multi-select-mode')){
					return;
				}

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

				// Disable vertical scrolling
				$(this).parents('.scroller').css('overflow-y','hidden');

				// Move it left-right the same amount as has already been moved
				$(this).css({
					position: 'relative',
					left: x_diff
				});

				var x_ratio_diff = Math.abs(x_diff / $(this).parents('.thread').width());


				// Get direction of travel
				var this_last_x = parseInt($(this).attr('last-position-x'), 10);
				if(coords.x != this_last_x){
					$(this).attr('last-position-x',coords.x);
					if(coords.x > this_last_x){
						$(this).attr('last-x-dir',1);
					} else {
						$(this).attr('last-x-dir',-1);
					}
				}


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
						// $(this).parents('.thread').find('.thread-bg-time p').html('A Few Hours');
						$(this).parents('.thread').find('.thread-bg-time p').html('Immediate');
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
			
			$(this).parents('.scroller').css('overflow-y','auto');

			if($(this).hasClass('touch_start')){

				// Remove 'tripped' ? (any reason not to?)
				$(this).parents('.thread').removeClass('tripped');
				
				var coords = App.Utils.get_point_position(e);
				if(!coords.y){
					return;
				}

				var this_x = $(this).attr('finger-position-x');
				var this_y = $(this).attr('finger-position-y');

				var x_diff = coords.x - this_x;
				var y_diff = coords.y - this_y;

				var x_ratio_diff = Math.abs(x_diff / $(this).parents('.thread').width());

				var $thread = $(this).parents('.thread');
				var $parent_controller = $(this).parents('.all_threads');
				// // Already in multi-select mode?
				// if($parent_controller.hasClass('multi-select-mode')){
				// 	return;
				// }

				// Get direction of travel
				// - must match the direction we are intending to go (cannot have gone slightly backwards)
				var direction_of_travel = parseInt($(this).attr('last-x-dir'), 10);


				if(!$(this).hasClass('previewing') && x_ratio_diff > App.Credentials.thread_move_x_threshold && !$parent_controller.hasClass('multi-select-mode')){
					// Moved far enough to take an action (delay/done)

					var thread_id = $(this).parents('.thread').attr('data-id');

					// Swiped fast enough?
					var newTime = new Date().getTime();
					var elapsed = newTime - parseInt($(that).attr('finger-time'), 10);
					if(elapsed > 1500){
						// Not fast enough, took more than 1 second

						// // Revert back to original position
						App.Plugins.Minimail.revert_box(this);
						return;
					}



					// Which action to take?
					if(x_diff > 0){
						// Sliding right
						// - mark as done
						if(direction_of_travel != 1){
							// Went backwards
							App.Plugins.Minimail.revert_box(this);
							return;
						}

						App.Utils.toast('Marked as done');

						App.Plugins.Minimail.saveAsDone(thread_id, true)
							.then(function(){
								// emit thread.delay 
								App.Events.trigger('Thread.done', thread_id);
							}); 

						// Scroll the window
						if($(this).parents('.thread').is(':last-child')){
							var now_scroll_height = $(this).parents('.threads_holder').scrollTop();
							$(this).parents('.threads_holder').scrollTo(now_scroll_height - 74,500);
						}

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
						
						if(direction_of_travel != -1){
							// Went backwards
							App.Plugins.Minimail.revert_box(this);
							return;
						}

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
							// $(this).parents('.thread').find('.thread-bg-time p').html('A Few Hours');

							// Already delayed, because "Immediate" has no effect here
							// alert($thread.attr('data-thread-type'));
							if($thread.attr('data-thread-type') == 'delayed'){
								App.Utils.Notification.toast('Already delayed');
								App.Plugins.Minimail.revert_box(this);
								return false;
							}

							$(this).parents('.thread').find('.thread-bg-time p').html('Immediate');

							// Make wait_for be A Few Hours (or immediate)
							$(this).parents('.thread').addClass('finished');

							// Scroll the window
							// - if last element
							
							if($(this).parents('.thread').is(':last-child')){
								var now_scroll_height = $(this).parents('.threads_holder').scrollTop();
								$(this).parents('.threads_holder').scrollTo(now_scroll_height - 74, 500);
							}

							// Save delay
							// var delay_seconds = 60 * 60 * 3; // 3 hours
							var delay_seconds = 0; // immediate
							var now = new Date();
							var now_sec = parseInt(now.getTime() / 1000, 10);
							var in_seconds = now_sec + (delay_seconds);//(60*60*3);

							// save the delay
							App.Plugins.Minimail.saveNewDelay(thread_id,in_seconds,delay_seconds)
								.then(function(){

									// emit event
									App.Events.trigger('Thread.delay', thread_id);
								});



						} else {
							// Remove any text that is there
							// - should not get here
							clog("BAD PLACE TO BE");
						}
						

					}

				} else {
					// Did not move far enough
					// - trigger a "shorttap" or "longtap" event on thread-preview

					// Total distance traveled too far?
					var x_total_diff = parseInt($(this).attr('x-total-diff'), 10) + Math.abs(x_diff);
					var y_total_diff = parseInt($(this).attr('x-total-diff'), 10) + Math.abs(x_diff);
					if(x_total_diff < 40 && y_total_diff < 10){
						// Didn't travel too far

						// shorttap or longtap
						var newTime = new Date().getTime();
						var elapsed = newTime - parseInt($(that).attr('finger-time'), 10);
						if(elapsed < 300){
							$(that).trigger('shorttap');
						} else {
							$(that).trigger('longtap');
						}

					}

					// Revert back to original position
					App.Plugins.Minimail.revert_box(this);

				}
			}
				

		},

		cancel: function(e){
			var that = this;
			
			if($(this).hasClass('touch_start')){
				
				// Revert back to original position
				App.Plugins.Minimail.revert_box(this);

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
	},

	formatDateForScroll: function(dateobj){

		var hour = parseInt(dateobj.toString('h'), 10),
			ampm = dateobj.toString('t') == 'A' ? 0 : 1;

		// must convert 12 to 0 for hours (expected by mobiscroll)
		if(hour == 12){
			hour = 0;
		}

		var tmp = [
			dateobj.toString('M') - 1, // month,
			dateobj.toString('d'),// day, 
			dateobj.toString('yyyy'),// year, 
			hour,// hour, 
			dateobj.toString('m'),// min, 
			ampm,// ampm
		];

		// Return formatted array
		return tmp;

	},

	formatTimeForScroll: function(dateobj){

		var hour = parseInt(dateobj.toString('h'), 10),
			ampm = dateobj.toString('t') == 'A' ? 0 : 1;

		// must convert 12 to 0 for hours (expected by mobiscroll)
		if(hour == 12){
			hour = 0;
		}

		var tmp = [
			hour,// hour, 
			dateobj.toString('m'),// min, 
			ampm,// ampm
		];

		// Return formatted array
		return tmp;

	},

	parseDateFromScroll: function(date_arr){
		// turn a date_arr into a js date object

		date_arr = _.map(date_arr,function(v){
			return parseInt(v,10);
		});

		var hours = date_arr[3];

		// must convert 0 to 12 for hours (output by mobiscroll)
		// if(hour == 0){
		// 	hour = 12;
		// }

		// Handle PM
		if(date_arr[5] == 1){
			hours = hours + 12;	
		}

		// year, month, day, hours, minutes, seconds, milliseconds
		var tmp = new Date(date_arr[2],date_arr[0],date_arr[1],hours,date_arr[4],0,0);

		// Return valid Date object
		return tmp;

	},

	parseTimeFromScroll: function(date_arr){
		// turn a date_arr into a js date object

		date_arr = _.map(date_arr,function(v){
			return parseInt(v,10);
		});

		var hours = date_arr[0];

		// must convert 0 to 12 for hours (output by mobiscroll)
		// if(hour == 0){
		// 	hour = 12;
		// }

		// Handle PM
		if(date_arr[2] == 1){
			hours = hours + 12;
		}

		// year, month, day, hours, minutes, seconds, milliseconds
		var tmp = new Date(2013,1,0,hours,date_arr[1],0,0);

		// Return valid Date object
		return tmp;

	}



}