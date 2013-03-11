App.Collections = {};


App.Collections.Emails = Backbone.Collection.extend({

	model: App.Models.Email,

	sync: emailbox_sync_collection,

	fetch_by_id: function(options){
		
		return this.fetch({
			data: {
				model: 'Email',
				conditions: {
					"attributes.thread_id" : {
						'$in' : options.ids
					}
				},
				fields : [
							'app.AppPkgDevMinimail',
							'common',
							'attributes',
							'original.headers'
							],
				limit : 200
				
			},
			success: function(email_models){
				if(options.success) options.success(email_models);
			}
		});

	},

	fetch_by_id_full: function(options){
		
		return this.fetch({
			data: {
				model: 'Email',
				conditions: {
					"attributes.thread_id" : {
						'$in' : options.ids
					}
				},
				fields : [
							'app.AppPkgDevMinimail',
							'common',
							'attributes',
							'original'
							],
				limit : 200
				
			},
			success: function(email_models){
				if(options.success) options.success(email_models);
			}
		});

	},


	fetch_for_thread: function(options){
		// Fetch emails for a certain Thread._id
		// - updates App.Data.Store.Email

		return this.fetch({
			data: {
				model: 'Email',
				conditions: {
					"attributes.thread_id" : options.thread_id
				},
				fields : [
							'app.AppPkgDevMinimail',
							'common',
							'attributes',
							'original'
							],
				limit : 50
				
			},
			success: function(email_models){
				if(options.success) options.success(email_models);
			}
		});

	},


	fetch_for_search: function(options){
		// Fetch emails for a certain Thread._id
		// - updates App.Data.Store.Email

		// Parse the search query
		// - support everything on: http://support.google.com/mail/bin/answer.py?hl=en&answer=7190
		// - better searching? 

		// options.text

		var text = options.text;

		// Parse out the from:name and has:attachment at this step, end up with ANDs
		// - todo

		var and_fields = {}; // todo...

		// escape regex characters
		// text = text.replace(/[#-}]/g, '\\$&'); // escape regex characters from search string
		text = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

		// Normal fields to search for text
		filter_fields = [
			'original.ParsedData.0.Data',
			// 'original.HtmlBody',
			'original.HtmlTextSearchable', // - strip html (for searching HTML views)
			'original.headers.Subject',
			'original.headers.From',
			'original.headers.To',
			'original.headers.Reply-To',
			'original.attachments.name' // array
		];

		var tmp = [];
		$.each(filter_fields,function(k,val){
			var d = {};
			d[val] = {
				"$regex" : '(' + text + ')',
				"$options" : 'ig'
			};
			tmp.push(d);
		});

		var search_conditions = {
			"$and" : [
				{
					"$or" : tmp
				},
				{
					"app.AppPkgDevMinimail.leisure_filters._id": {
						"$exists": false // Not a leisure filter
					}
				}
			]
		}

		return this.fetch({
			data: {
				model: 'Email',
				conditions: search_conditions,
				fields : [
							'app.AppPkgDevMinimail',
							'common',
							'attributes',
							'original.headers',
							'original.ParsedData.Data'
							],
				limit : 20,
				sort: {"_id" : -1} // most recent
				
			},
			success: function(email_models){
				if(options.success) options.success(email_models);
			}
		});

	},


	fetch_sent: function(options){
		// Return SENT emails
		// - todo: pagination...

		return this.fetch({
			data: {
				model: 'Email',
				conditions: {
					"original.labels" : "\\\\Sent" // Sent emails
				},
				fields : [
							'app.AppPkgDevMinimail',
							'common',
							'attributes',
							'original.headers',
							'original.ParsedData.Data'
							],
				limit : 20,
				sort: {"_id" : -1} // most recent
				
			},
			success: function(email_models){
				if(options.success) options.success(email_models);
			}
		});

	}


});

App.Collections.Attachments = Backbone.Collection.extend({

	model: App.Models.Attachment,

	sync: emailbox_sync_collection,

	fetch_recent: function(options){
		// Return recent attachments
		// - updates App.Data.Store.Attachment

		// Returns the data we have stored for this

		// Run custom search

		Api.search({
			data: {
				model: 'Email',
				conditions: {
					'original.attachments.name' : {'$exists' : true}
				},
				fields: ['original.attachments','attributes.thread_id','common.date'],
				limit: 20,
				sort: {"_id" : -1}
			},
			success: function(response){
				response = JSON.parse(response);

				// Parse out the attachments for each email
				var attachments = [];
				$.each(response.data,function(i,e){
					$.each(e.Email.original.attachments,function(k,attachment){
						attachments.push({
							attachment: attachment,
							thread_id: e.Email.attributes.thread_id,
							email_id: e.Email._id,
							date: e.Email.common.date
						});
					});
				});

				// Call success
				if(options.success) options.success(attachments);

			}
		});

	},

	fetch_received: function(options){
		// Return recent attachments
		// - updates App.Data.Store.Attachment

		// Returns the data we have stored for this

		// Run custom search

		Api.search({
			data: {
				model: 'Email',
				conditions: {
					'original.attachments.name' : {'$exists' : true},
					'original.labels' : {
						'$ne' : '\\\\Sent'
					}
				},
				fields: ['original.attachments','attributes.thread_id','common.date'],
				limit: 20,
				sort: {"_id" : -1}
			},
			success: function(response){
				response = JSON.parse(response);

				// Parse out the attachments for each email
				var attachments = [];
				$.each(response.data,function(i,e){
					$.each(e.Email.original.attachments,function(k,attachment){
						attachments.push({
							attachment: attachment,
							thread_id: e.Email.attributes.thread_id,
							email_id: e.Email._id,
							date: e.Email.common.date
						});
					});
				});

				// Call success
				if(options.success) options.success(attachments);

			}
		});

	},

	fetch_sent: function(options){
		// Return recent attachments
		// - updates App.Data.Store.Attachment

		// Returns the data we have stored for this

		// Run custom search

		Api.search({
			data: {
				model: 'Email',
				conditions: {
					'original.attachments.name' : {'$exists' : true},
					'original.labels' : '\\\\Sent'
				},
				fields: ['original.attachments','attributes.thread_id','common.date'],
				limit: 20,
				sort: {"_id" : -1}
			},
			success: function(response){
				response = JSON.parse(response);

				// Parse out the attachments for each email
				var attachments = [];
				$.each(response.data,function(i,e){
					$.each(e.Email.original.attachments,function(k,attachment){
						attachments.push({
							attachment: attachment,
							thread_id: e.Email.attributes.thread_id,
							email_id: e.Email._id,
							date: e.Email.common.date
						});
					});
				});

				// Call success
				if(options.success) options.success(attachments);

			}
		});

	},

	fetch_for_search: function(options){
		// Return attachments that meet search criteria

		// Doesn't do anything complex yet, just a regex search
		// - todo: links from contact, etc.

		// options.text

		var text = options.text;

		// escape regex characters
		var tmp_text = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

		Api.search({
			data: {
				model: 'Email',
				conditions: {
					'original.attachments.name' : {
						'$regex' : '(' + tmp_text + ')',
						'$options' : 'ig'
					}
				},
				fields: ['original.attachments','attributes.thread_id','common.date'],
				limit: 20,
				sort: {"_id" : -1}
			},
			success: function(response){
				response = JSON.parse(response);


				// Parse out the attachments for each email
				var attachments = [];
				$.each(response.data,function(i,e){
					$.each(e.Email.original.attachments,function(k,attachment){
						// test the regex again
						var tmp = new RegExp('(' + tmp_text + ')');
						if(tmp.test(attachment.name)){
							attachments.push({
								attachment: attachment,
								thread_id: e.Email.attributes.thread_id,
								email_id: e.Email._id,
								date: e.Email.common.date
							});
						}

					});
				});

				// Call success
				if(options.success) options.success(attachments);

			}
		});

	}


});

App.Collections.Links = Backbone.Collection.extend({

	model: App.Models.Link,

	sync: emailbox_sync_collection,

	fetch_recent: function(options){
		// Return recent attachments
		// - updates App.Data.Store.Attachment

		// Returns the data we have stored for this

		// Run custom search

		Api.search({
			data: {
				model: 'Email',
				conditions: {
					'app.AppPkgDevMinimail.links' : {'$ne' : null}
				},
				fields: ['app.AppPkgDevMinimail.links','attributes.thread_id','common.date'],
				limit: 20,
				sort: {"_id" : -1}
			},
			success: function(response){
				response = JSON.parse(response);

				// Parse out the attachments for each email
				var links = [];
				$.each(response.data,function(i,e){
					$.each(e.Email.app.AppPkgDevMinimail.links,function(k,link){
						links.push({
							link: link,
							thread_id: e.Email.attributes.thread_id,
							email_id: e.Email._id,
							date: e.Email.common.date
						});
						console.log(2);
					});
				});

				console.log('e');
				console.log(response.data);

				// Call success
				if(options.success) options.success(links);

			}
		});

	},

	fetch_received: function(options){
		// Return received attachments
		// - updates App.Data.Store.Attachment

		// Returns the data we have stored for this

		// Run custom search

		Api.search({
			data: {
				model: 'Email',
				conditions: {
					'app.AppPkgDevMinimail.links' : {'$ne' : null},
					'original.labels' : {
						'$ne' : '\\\\Sent'
					}
				},
				fields: ['app.AppPkgDevMinimail.links','attributes.thread_id','common.date'],
				limit: 20,
				sort: {"_id" : -1}
			},
			success: function(response){
				response = JSON.parse(response);

				// Parse out the attachments for each email
				var links = [];
				$.each(response.data,function(i,e){
					$.each(e.Email.app.AppPkgDevMinimail.links,function(k,link){
						links.push({
							link: link,
							thread_id: e.Email.attributes.thread_id,
							email_id: e.Email._id,
							date: e.Email.common.date
						});
						console.log(2);
					});
				});

				console.log('e');
				console.log(response.data);

				// Call success
				if(options.success) options.success(links);

			}
		});

	},

	fetch_sent: function(options){
		// Return sent attachments
		// - updates App.Data.Store.Attachment

		// Returns the data we have stored for this

		// Run custom search

		Api.search({
			data: {
				model: 'Email',
				conditions: {
					'app.AppPkgDevMinimail.links' : {'$ne' : null},
					'original.labels' : '\\\\Sent'
				},
				fields: ['app.AppPkgDevMinimail.links','attributes.thread_id','common.date'],
				limit: 20,
				sort: {"_id" : -1}
			},
			success: function(response){
				response = JSON.parse(response);

				// Parse out the attachments for each email
				var links = [];
				$.each(response.data,function(i,e){
					$.each(e.Email.app.AppPkgDevMinimail.links,function(k,link){
						links.push({
							link: link,
							thread_id: e.Email.attributes.thread_id,
							email_id: e.Email._id,
							date: e.Email.common.date
						});
						console.log(2);
					});
				});

				console.log('e');
				console.log(response.data);

				// Call success
				if(options.success) options.success(links);

			}
		});

	},

	fetch_for_search: function(options){
		// Return links that meet search criteria

		// Doesn't do anything complex yet, just a regex search
		// - todo: links from contact, etc.

		// options.text

		var text = options.text;

		// escape regex characters
		var tmp_text = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

		Api.search({
			data: {
				model: 'Email',
				conditions: {
					'app.AppPkgDevMinimail.links' : {'$ne' : null},
					'app.AppPkgDevMinimail.links' : {
						'$regex' : '(' + tmp_text + ')',
						'$options' : 'ig'
					}
				},
				fields: ['app.AppPkgDevMinimail.links','attributes.thread_id','common.date'],
				limit: 20,
				sort: {"_id" : -1}
			},
			success: function(response){
				response = JSON.parse(response);

				// Parse out the attachments for each email
				var links = [];
				$.each(response.data,function(i,e){
					$.each(e.Email.app.AppPkgDevMinimail.links,function(k,link){
						// test the regex again
						var tmp = new RegExp('(' + tmp_text + ')');
						if(tmp.test(link)){
							console.log(2);
							links.push({
								link: link,
								thread_id: e.Email.attributes.thread_id,
								email_id: e.Email._id,
								date: e.Email.common.date
							});
						}
					});
				});

				console.log('e');
				console.log(response.data);

				// Call success
				if(options.success) options.success(links);

			}
		});

	}


});


App.Collections.UndecidedThreads = Backbone.Collection.extend({

	model: App.Models.Thread,

	sync: emailbox_sync_collection,

	undecided_conditions: {
		'$or' : [
			{
				'$and' : [
					{
						// doesn't exist for us, and is unread
						'app.AppPkgDevMinimail' : {'$exists' : false},
						'attributes.read.status' : 0
					}
				]
			},{
				'$and' : [
					{
						// exists as acted upon, and is marked as "undecided" still
						'app.AppPkgDevMinimail' : {'$exists' : true},
						'app.AppPkgDevMinimail.wait_until' : {"$exists" : false},
						'app.AppPkgDevMinimail.done' : 0
					}
				]
			}
		]
	},

	fetchUndecided: function(options){
		var that = this;

		// Return "undecided emails"
		// - the "?" emails

		// - Must be "unread"
		// - must be past "wait_until" time

		return this.fetch({
			data: {
				model: 'Thread',
				conditions: that.undecided_conditions,
				fields: [], // all fields
				limit: 10,
				sort: {
					'attributes.last_message_datetime_sec' : -1
				}
			},
			error: function(error){
				console.log('=error e2');
			},
			success: function(threads_models){
				// Have an array of Threads Models

				// Extract out Thread._id's so that we can get the Emails that correspond
				// var thread_ids = _.map(response.data,function(v){
				// 	return v.Thread._id;
				// })
				
				
				// Map
				var thread_ids = [];
				var threads_obj = {};
				threads_models.each(function(thread_model){
					// var Thread = model.get('_id');

					var _id = thread_model.get('_id');
					var Thread = _.clone(thread_model.attributes);

					thread_ids.push(_id);
					threads_obj[_id] = {Thread: Thread,
										Email: []};
				});
				// $.each(response.data,function(i,thread){
				// 	thread_ids.push(thread.Thread._id);
				// 	threads_obj[thread.Thread._id] = {Thread: thread.Thread,
				// 								Email: []};
				// });
	
				// console.log('more');
				// console.log(thread_ids);
				// console.log(threads_obj);
				// return false;

				// Fetch and merge emails

				var emails = new App.Collections.Emails();
				emails.fetch_by_id({
					ids: thread_ids,
					success: function(emails_models){
						// have collection of emails

						// emails_models.each(function(model){
							
						// });

						// Sort emails
						var tmp_emails_models = App.Utils.sortBy({
							arr: emails_models.toJSON(),
							path: 'common.date_sec',
							direction: 'asc',
							type: 'num'
						});

						$.each(tmp_emails_models,function(i,email){
							// Add to the Thread object
							threads_obj[email.attributes.thread_id].Email.push(email);
						});

						threads_obj = App.Utils.sortBy({
							arr: threads_obj,
							path: 'Thread.attributes.last_message_datetime',
							direction: 'desc',
							type: 'date'
						});
						
						// Remove empty Threads
						var tmp = [];
						threads_obj = _.filter(threads_obj,function(v){
							if(v.Email.length < 1){
								return false;
							}
							return true;
						});

						// Return undecided threads and Email data
						// dfd.resolve(threads_obj);

						if(options.success){
							options.success(threads_obj);
						}

					}
				});

			}
		
		});

	}


});


// This is completely based off of App.Collections.UndecidedThreads
App.Collections.DelayedThreads = Backbone.Collection.extend({

	model: App.Models.Thread,

	sync: emailbox_sync_collection,

	fetchDelayed: function(options){
		var that = this;

		// Return "undecided emails"
		// - the "?" emails

		// - Must be "unread"
		// - must be past "wait_until" time


		var now = new Date();
		var now_sec = parseInt(now.getTime() / 1000);

		return this.fetch({
			data: {
				model: 'Thread',
				conditions: {
					'$and' : [
						{
							'app.AppPkgDevMinimail.wait_until' : {
								'$lte' : now_sec
							}
						},
						{
							'app.AppPkgDevMinimail.done' : {
								"$ne" : 1
							}
						}
					]
				},
				fields: [], // all fields
				limit: 10,
				sort: {
					'app.AppPkgDevMinimail.wait_until' : -1
				}
			},
			error: function(error){
				console.log('=error e2');
			},
			success: function(threads_models){
				// Have an array of Threads Models

				// Extract out Thread._id's so that we can get the Emails that correspond
				// var thread_ids = _.map(response.data,function(v){
				// 	return v.Thread._id;
				// })
				
				
				// Map
				var thread_ids = [];
				var threads_obj = {};
				threads_models.each(function(thread_model){
					// var Thread = model.get('_id');

					var _id = thread_model.get('_id');
					var Thread = _.clone(thread_model.attributes);

					thread_ids.push(_id);
					threads_obj[_id] = {Thread: Thread,
										Email: []};
				});

				// Fetch and merge emails

				var emails = new App.Collections.Emails();
				emails.fetch_by_id({
					ids: thread_ids,
					success: function(emails_models){
						// have collection of emails

						// emails_models.each(function(model){
							
						// });

						// Sort emails
						var tmp_emails_models = App.Utils.sortBy({
							arr: emails_models.toJSON(),
							path: 'common.date_sec',
							direction: 'asc',
							type: 'num'
						});

						$.each(tmp_emails_models,function(i,email){
							// Add to the Thread object
							threads_obj[email.attributes.thread_id].Email.push(email);
						});

						threads_obj = App.Utils.sortBy({
							arr: threads_obj,
							path: 'Thread.attributes.last_message_datetime',
							direction: 'desc',
							type: 'date'
						});
						
						// Remove empty Threads
						var tmp = [];
						threads_obj = _.filter(threads_obj,function(v){
							if(v.Email.length < 1){
								return false;
							}
							return true;
						});

						// Return undecided threads and Email data
						// dfd.resolve(threads_obj);

						if(options.success){
							options.success(threads_obj);
						}

					}
				});

			}
		
		});

	}

});

App.Collections.Threads = Backbone.Collection.extend({

	model: App.Models.Thread,

	sync: emailbox_sync_collection,

	fetch_by_id: function(options){

		return this.fetch({
			data: {
				model: 'Thread',
				conditions: {
					"app.AppPkgDevMinimail.leisure_filters._id" : {
						'$in' : options.ids
					}
				},
				fields : [
							'app.AppPkgDevMinimail',
							'attributes',
							'original'
							],
				limit : 200
				
			},
			success: function(thread_models){
				if(options.success) options.success(thread_models);
			}
		});

	},


	fetch_for_leisure: function(options){
		// Fetch emails for a certain AppMinimailLeisureFilter._id
		// - updates App.Data.Store.AppMinimailLeisureFilter

		return this.fetch({
			data: {
				model: 'Thread',
				conditions: {
					"app.AppPkgDevMinimail.leisure_filters._id" : options.leisure_id
				},
				fields : [
							'app.AppPkgDevMinimail',
							'common',
							'attributes',
							'original'
							],
				limit : 50
				
			},
			success: function(thread_models){
				if(options.success) options.success(thread_models);
			}
		});

	},

	fetch_by_ids_with_email: function(options){
		var that = this;

		// Return "undecided emails"
		// - the "?" emails

		// - Must be "unread"
		// - must be past "wait_until" time

		return this.fetch({
			data: {
				model: 'Thread',
				conditions: {
					"_id" : {
						"$in" : options.thread_ids
					}
				},
				fields: [], // all fields
				limit: 100
			},
			error: function(error){
				console.log('=error e2');
			},
			success: function(threads_models){
				// Have an array of Threads Models

				// Extract out Thread._id's so that we can get the Emails that correspond
				// var thread_ids = _.map(response.data,function(v){
				// 	return v.Thread._id;
				// })
				
				
				// Map
				var thread_ids = [];
				var threads_obj = {};
				threads_models.each(function(thread_model){
					// var Thread = model.get('_id');

					var _id = thread_model.get('_id');
					var Thread = _.clone(thread_model.attributes);

					thread_ids.push(_id);
					threads_obj[_id] = {Thread: Thread,
										Email: []};
				});
				// $.each(response.data,function(i,thread){
				// 	thread_ids.push(thread.Thread._id);
				// 	threads_obj[thread.Thread._id] = {Thread: thread.Thread,
				// 								Email: []};
				// });
	
				// console.log('more');
				// console.log(thread_ids);
				// console.log(threads_obj);
				// return false;

				// Fetch and merge emails

				var emails = new App.Collections.Emails();
				emails.fetch_by_id({
					ids: thread_ids,
					success: function(emails_models){
						// have collection of emails

						// emails_models.each(function(model){
							
						// });

						// Sort emails
						var tmp_emails_models = App.Utils.sortBy({
							arr: emails_models.toJSON(),
							path: 'common.date_sec',
							direction: 'asc',
							type: 'num'
						});

						$.each(tmp_emails_models,function(i,email){
							// Add to the Thread object
							threads_obj[email.attributes.thread_id].Email.push(email);
						});
						
						// Remove empty Threads
						var tmp = [];
						threads_obj = _.filter(threads_obj,function(v){
							if(v.Email.length < 1){
								return false;
							}
							return true;
						});

						// Return undecided threads and Email data
						// dfd.resolve(threads_obj);

						if(options.success){
							options.success(threads_obj);
						}

					}
				});

			}
		
		});

	}


});


App.Collections.AppMinimailLeisureFilter = Backbone.Collection.extend({

	model: App.Models.AppMinimailLeisureFilter,

	sync: emailbox_sync_collection,

	sortByLastMessageDatetime: function(){
		// Filter collection
		return [];
	},

	fetchAll: function(options){
		var that = this;

		// return all of 'em

		return this.fetch({
			data: {
				model: 'AppMinimailLeisureFilter',
				conditions: {},
				fields: [], // all fields
				limit: 1000, // get 'em all
				sort: {
					'attributes.last_message_datetime_sec' : -1
				}
			},
			error: function(error){
				console.log('=error e2');
			},
			success: function(filter_models){
				// Have an array of Threads Models

				// Extract out Thread._id's so that we can get the Emails that correspond
				// var thread_ids = _.map(response.data,function(v){
				// 	return v.Thread._id;
				// })
				
				
				// Map
				var filter_ids = [];
				var filter_obj = {};
				filter_models.each(function(filter_model){
					// var Thread = model.get('_id');

					var _id = filter_model.get('_id');
					var AppMinimailLeisureFilter = _.clone(filter_model.attributes);

					filter_ids.push(_id);
					filter_obj[_id] = {AppMinimailLeisureFilter: AppMinimailLeisureFilter,
										Thread: []};
				});

				// Fetch and merge threads

				var threads = new App.Collections.Threads();
				threads.fetch_by_id({
					ids: filter_ids,
					success: function(threads_models){
						// have collection of emails

						// emails_models.each(function(model){
							
						// });

						// Sort threads
						var tmp_thread_models = App.Utils.sortBy({
							arr: threads_models.toJSON(),
							path: 'attributes.last_message_datetime',
							direction: 'asc',
							type: 'date'
						});

						$.each(tmp_thread_models,function(i,thread){
							// Add to the Thread object
							// - could belong to multiple Filters
							$.each(thread.app.AppPkgDevMinimail.leisure_filters,function(k,lf){
								try {
									filter_obj[lf._id].Thread.push(thread);
								} catch(err){
									// console.log('err 32498');
									console.log(err); // TypeError: Cannot read property 'Thread' of undefined
									console.log(lf._id);
									console.log(JSON.stringify(filter_obj));
								}
							});
						});

						console.log('filter2');
						filter_obj = App.Utils.sortBy({
							arr: filter_obj,
							path: 'Thread.[0].attributes.last_message_datetime',
							direction: 'desc',
							type: 'date'
						});
						
						// Remove empty Threads
						var tmp = [];
						filter_obj = _.filter(filter_obj,function(v){
							// No AppMinimailLeisureFilter?
							if(v.AppMinimailLeisureFilter.length < 1){
								return false;
							}
							// No Threads?
							if(v.Thread.length < 1){
								return false;
							}
							return true;
						});

						// Return undecided threads and Email data
						// dfd.resolve(threads_obj);

						if(options.success){
							options.success(filter_obj);
						}

					}
				});

			}
		
		});

	}

});



function emailbox_sync_collection(method, model, options) {

	console.log('backbone sync overwritten');

	options || (options = {});

	switch (method) {
		case 'create':
			break;

		case 'update':
			break;

		case 'delete':
			break;

		case 'read':
			// request = gapi.client.tasks[model.url].list(options.data);
			// Backbone.gapiRequest(request, method, model, options);
			console.log('sync reading');
			console.log(options);
			console.log(model); // or collection

			Api.search({
				data: options.data,
				success: function(response){ // ajax arguments

					response = JSON.parse(response);

					if(response.code != 200){
						console.log('=error');
						if(options.error) options.error(this,response);
						return;
					}
					if(options.success){
						// console.log('Calling success');

						// data or patch?
						if(response.patch){
							options.success(this, response.patch);
						} else {
							// console.log('d');
							// console.log(response.data);

							// Return data without the 'Model' lead
							var tmp = [];
							var tmp = _.map(response.data,function(v){
								return v[options.data.model];
							});

							// Merge local values with new ones
							_.each(tmp,function(model_values, iterator){
								// Local value exist?
								if(App.Data.Store[options.data.model][model_values._id] == undefined){
									// Set it
									App.Data.Store[options.data.model][model_values._id] = model_values;

								} else {
									App.Data.Store[options.data.model][model_values._id] = $.extend(true, App.Data.Store[options.data.model][model_values._id], model_values);
								}
							});

							// Store App.Data.Store into localStorage/prefs!
							App.Events.trigger('saveAppDataStore',true);

							options.success(tmp);
						}
					}
				}
			});

			break;
	}

}
