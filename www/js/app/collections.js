App.Collections = {};




App.Collections.EmailSearches = Backbone.Collection.extend({

	model: App.Models.EmailIds,

	sync: Backbone.cachingSync(emailbox_sync_collection, 'EmailSearches'),

	comparator: function( EmailModel ) {
		return EmailModel.toJSON()._id;
	},

	fetch_for_search: function(options){
		// Fetch emails for a certain Thread._id
		// - updates App.Data.Store.Email

		// Parse the search query
		// - support everything on: http://support.google.com/mail/bin/answer.py?hl=en&answer=7190
		// - better searching? 

		options = options || {
			text: ''
		};

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

		// Create cachePrefix (better than creating it in the View)
		// - unique cache for each search
		options.collectionCachePrefix = App.Utils.MD5(JSON.stringify(search_conditions));
		// console.log('ccp: ' + options.collectionCachePrefix);

		return this.fetch({
			options: options,
			data: {
				model: 'Email',
				conditions: search_conditions,
				fields : ['_id'],
				limit : 20,
				sort: {"_id" : -1} // most recently received (better way of sorting?)
				
			}
		});

	},

	fetch_sent: function(options){
		// Fetch Sent emails
		options = options || {};

		var search_conditions = {
			"original.labels" : "\\\\Sent"
		};

		// Create cachePrefix (better than creating it in the View)
		// - unique cache for each search
		options.collectionCachePrefix = App.Utils.MD5(JSON.stringify(search_conditions));

		return this.fetch({
			options: options,
			data: {
				model: 'Email',
				conditions: search_conditions,
				fields : ['_id'],
				limit : 20,
				sort: {"_id" : -1} // most recently received (better way of sorting?)
				
			}
		});

	}
});


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

	fetch_by_thread_id: function(options){
		
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

// This is completely based off of App.Collections.UndecidedThreads
App.Collections.EmailsFull = Backbone.Collection.extend({

	model: App.Models.EmailFull,

	sync: Backbone.cachingSync(emailbox_sync_collection, 'EmailFull'),

	comparator: function( EmailFull ) {
		return EmailFull.toJSON().common.date_sec; // sorting by date received
	},

	fetch_by_thread_id: function(options){
		options = options || {};
		return this.fetch({
			cachePrefix: options.cachePrefix || null,
			data: {
				model: 'Email',
				conditions: {
					"attributes.thread_id" : {
						'$in' : options.ids
					}
				},
				fields : [
							'app',
							'attributes',
							'common',
							'original',
							'-original.HtmlBody',
							'-original.HtmlBodyOriginal',
							'-original.ParsedDataHtml'
							],
				limit : 20
				
			},
			success: function(email_models){
				if(options.success) options.success(email_models);
			}
		});

	}

});

// This is completely based off of App.Collections.UndecidedThreads
App.Collections.LeisureFilters = Backbone.Collection.extend({

	model: App.Models.LeisureFilterIds,

	sync: Backbone.cachingSync(emailbox_sync_collection, 'LeisureFilters'),

	comparator: function( LeisureFilter ) {
		// console.log(LeisureFilter.toJSON());
		try {
			return LeisureFilter.toJSON().attributes.last_message_datetime_sec; // sorting by latest email received (better sorting?)
		} catch(err){
			return 0; // No attributes.last_message_datetime_sec
		}
		// return LeisureFilter.toJSON().name; // sorting by latest email received (better sorting?)
		
	},

	fetchList: function(options){
		options = options || {};
		return this.fetch({
			// cachePrefix: options.cachePrefix || null,
			data: {
				model: 'AppMinimailLeisureFilter',
				conditions: {
					// no conditions?
					// - add a live=1 todo...
				},
				fields : ['_id', 'name', 'attributes'], // _id and sorting field
				limit : 200,
				sort: {
					'attributes.last_message_datetime_sec' : -1
				}
				
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
				limit: 10,
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
				limit: 10,
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

	model: App.Models.ThreadIds,

	sync: Backbone.cachingSync(emailbox_sync_collection, 'undecided1'),

	comparator: function( Thread ) {
		return Thread.toJSON().attributes.last_message_datetime_sec;
	},

	undecided_conditions: {
		'$or' : [
			{
				'$and' : [
					{
						// doesn't exist for us, and is unread/unseen
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

	fetchDefault: function(options){
		var that = this;

		// This causes the Add1 shit to fire for this collection, it doesn't wait for anything else
		return this.fetch({
			options: options,
			data: {
				model: 'Thread',
				conditions: that.undecided_conditions,
				fields: ['_id','attributes.last_message_datetime_sec','attributes.last_message_datetime_sec'], // only the ID field + sorting field
				limit: 10,
				sort: {
					'attributes.last_message_datetime_sec' : -1
				}
			}
		});

	},

	fetchCount: function(options){
		var that = this;

		var dfd = $.Deferred();

		// This causes the Add1 shit to fire for this collection, it doesn't wait for anything else
		Api.count({
			data: {
				model: 'Thread',
				conditions: that.undecided_conditions
			},
			success: function(response){
				response = JSON.parse(response);
				if(response.code == 200){
					dfd.resolve(response.data);
				}
			}
		});

		return dfd.promise();

	}


});

// This is completely based off of App.Collections.UndecidedThreads
App.Collections.DelayedThreads = Backbone.Collection.extend({

	model: App.Models.ThreadIds,

	sync: Backbone.cachingSync(emailbox_sync_collection, 'delayed1'),

	comparator: function( Thread ) {
		return -1 * Thread.toJSON().app.AppPkgDevMinimail.wait_until;
	},

	fetchDefault: function(options){
		var that = this;
		console.info('fetch delayed');

		// Return "undecided emails"
		// - the "?" emails

		// - Must be "unread"
		// - must be past "wait_until" time

		var now = new Date();
		var now_sec = parseInt(now.getTime() / 1000);

		// Fetch from emailbox
		return this.fetch({
			options: options,
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
				fields: ['_id','app.AppPkgDevMinimail.wait_until','attributes.last_message_datetime_sec'], // id + seconds
				limit: 10,
				sort: {
					'app.AppPkgDevMinimail.wait_until' : -1
				}
			}
		});

		// Return fetch call (not actual results)
		// return models;

	},

	fetchCount: function(options){
		var that = this;

		var dfd = $.Deferred();

		var now = new Date();
		var now_sec = parseInt(now.getTime() / 1000);

		// This causes the Add1 shit to fire for this collection, it doesn't wait for anything else
		Api.count({
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
			},
			success: function(response){
				response = JSON.parse(response);
				if(response.code == 200){
					dfd.resolve(response.data);
				}
			}
		});

		return dfd.promise();

	}

});

App.Collections.LaterThreads = Backbone.Collection.extend({

	model: App.Models.ThreadIds,

	sync: Backbone.cachingSync(emailbox_sync_collection, 'later1'),

	comparator: function( Thread ) {
		return Thread.toJSON().app.AppPkgDevMinimail.wait_until;
	},

	fetchDefault: function(options){
		var that = this;
		console.info('fetch later');

		// Return "undecided emails"
		// - the "?" emails

		// - Must be "unread"
		// - must be past "wait_until" time

		var now = new Date();
		var now_sec = parseInt(now.getTime() / 1000);

		// Fetch from emailbox
		return this.fetch({
			options: options,
			data: {
				model: 'Thread',
				conditions: {
					'$and' : [
						{
							'app.AppPkgDevMinimail.wait_until' : {
								'$gt' : now_sec
							}
						},
						{
							'app.AppPkgDevMinimail.done' : {
								"$ne" : 1
							}
						}
					]
				},
				fields: ['_id','app.AppPkgDevMinimail.wait_until','attributes.last_message_datetime_sec'], // id + seconds
				limit: 10,
				sort: {
					'app.AppPkgDevMinimail.wait_until' : -1
				}
			}
		});

		// Return fetch call (not actual results)
		// return models;

	},

	fetchCount: function(options){
		var that = this;

		var dfd = $.Deferred();

		var now = new Date();
		var now_sec = parseInt(now.getTime() / 1000);

		// This causes the Add1 shit to fire for this collection, it doesn't wait for anything else
		Api.count({
			data: {
				model: 'Thread',
				conditions: {
					'$and' : [
						{
							'app.AppPkgDevMinimail.wait_until' : {
								'$gt' : now_sec
							}
						},
						{
							'app.AppPkgDevMinimail.done' : {
								"$ne" : 1
							}
						}
					]
				},
			},
			success: function(response){
				response = JSON.parse(response);
				if(response.code == 200){
					dfd.resolve(response.data);
				}
			}
		});

		return dfd.promise();

	}

});

App.Collections.LeisureThreads = Backbone.Collection.extend({

	model: App.Models.ThreadFull,

	sync: Backbone.cachingSync(emailbox_sync_collection, 'LeisureThreads'),

	comparator: function( Thread ) {
		console.log(Thread.toJSON().attributes.last_message_datetime_sec);
		return -1 * Thread.toJSON().attributes.last_message_datetime_sec;
	},

	fetchAll: function(options){
		// Gettting all the Threads
		options.collectionCachePrefix = App.Utils.MD5(JSON.stringify(options.ids));

		// fetch
		return this.fetch({
			options: options,
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
				limit : 10,
				sort: {
					'attributes.last_message_datetime_sec' : -1
				}
				
			},
			success: function(thread_models){
				if(options.success) options.success(thread_models);
			}
		});

	},

});

App.Collections.Threads = Backbone.Collection.extend({

	model: App.Models.ThreadFull,

	sync: Backbone.cachingSync(emailbox_sync_collection, 'ThreadsFull'),

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
									// console.log(JSON.stringify(filter_obj));
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


App.Collections.UserEmailAccounts = Backbone.Collection.extend({

	model: App.Models.UserEmailAccount,

	sync: Backbone.cachingSync(emailbox_sync_collection, 'UserEmailAccounts'),

	// comparator: function( Thread ) {
	// 	return -1 * Thread.toJSON().app.AppPkgDevMinimail.wait_until;
	// },

	fetchAll: function(options){
		var that = this;

		// Fetch from emailbox
		return this.fetch({
			data: {
				model: 'UserEmailAccount',
				conditions: {},
				fields: [], // id + seconds
				limit: 10,
				sort: {
					'name' : -1
				}
			}
		});

	},

});


// Contacts
// - caches contacts
// - uses local contact manager
// - should also be updated in the background on occasion
App.Collections.Contacts = Backbone.Collection.extend({

	model: App.Models.Contact,
	sync: Backbone.cachingSync(contacts_sync_collection, 'Contacts', 'id'),
	custom_cache_id: true,

	comparator: function(Contact){
		return Contact['displayName'] + Contact['email'];
	}
});



function emailbox_sync_collection(method, model, options) {

	// console.log('backbone collection sync overwritten');

	var dfd = $.Deferred();

	options || (options = {});

	switch (method) {
		case 'create':
			break;

		case 'update':
			break;

		case 'delete':
			break;

		case 'read':
			// read/search request
			// console.log('sync reading');
			// console.log(options);
			// console.log(model); // or collection
			// console.log(model.model.prototype.fields);

			// turn on caching for fucking everything yeah
			// - fuck it why not?
			if(App.Credentials.usePatching){
				options.data.cache = true;
			}

			// Create namespace for storing
			// console.info(model);
			var ns = model.model.prototype.internalModelName + '_';

            // Need to include a passed new cachePrefix for some collections
            if(options.ns){
                // console.warn('cachePrefix');
                ns = ns + options.ns + '_';
            }

            // Collection namespace?
            // - for ids
            if(options.options && options.options.collectionCachePrefix){
                ns = ns+ options.options.collectionCachePrefix + '_';
            }
			// console.log('ns');
			// console.log(ns);
			// console.log(options);
			// return false;

			// Get previous cache_hash
			// - just stored in memory for now
			try {
				options.data.hash = App.Data.Store.CollectionCache[ns].hash;
			} catch(err){
				// no hash exists
			}

			Api.search({
				data: options.data,
				success: function(response){ // ajax arguments

					response = JSON.parse(response);

					if(response.code != 200){
						console.log('=error');
						if(options.error) options.error(this,response);
						dfd.reject();
						return;
					}
					// console.log('Calling success');

					if(response.hasOwnProperty('patch')){
						// returned a patch

						// do the patching
						// - need to get our previous edition
						// - apply the patch
						// - re-save the data

						// Get previous version of data
						// - stored in memory, not backed up anywhere
						// - included hash+text
						try {
							// console.log(collection.model.internalModelName + '_' + model.id);
							if(App.Data.Store.CollectionCache[ns].text.length > 0){
								// ok

							}
						} catch(err){
							// No previous cache to compare against!
							// - this should never be sent if we're sending a valid hash
							console.error('HUGE FAILURE CACHING!');
							console.log(err);
							return false;
						}

						// Create patcher
						var dmp = new diff_match_patch();

						// Build patches from text
						var patches = dmp.patch_fromText(response.patch);

						// get our result text!
						var result_text = dmp.patch_apply(patches, App.Data.Store.CollectionCache[ns].text);

						// Convert text to an object
						try {
							response.data = JSON.parse(result_text[0]); // 1st, only 1 patch expected
						} catch(err){
							// Shoot, it wasn't able to be a object, this is kinda fucked now
							// - need to 
							console.error('Failed recreating JSON');
							return false;
						}

					}

					// After patching (if any occurred)

					// Return data without the 'Model' lead
					var tmp = [];
					var tmp = _.map(response.data,function(v){
						return v[options.data.model];
					});

					// Return single value
					window.setTimeout(function(){

						// Resolve
						dfd.resolve(tmp);

						// Fire success function
						if(options.success){
							options.success(tmp);
						}
					},1);

					// Update cache with hash and text
					App.Data.Store.CollectionCache[ns] = {
						hash: response.hash,
						text: JSON.stringify(response.data)
					};
				
				}
			});

			break;
	}

	return dfd.promise();

}


function contacts_sync_collection(method, model, options) {

	// console.log('backbone collection sync overwritten');

	var dfd = $.Deferred();

	options || (options = {});

	switch (method) {
		case 'create':
			break;

		case 'update':
			break;

		case 'delete':
			break;

		case 'read':
			// read/search request
			// console.log('sync reading');
			// console.log(options);
			// console.log(model); // or collection
			// console.log(model.model.prototype.fields);

			var contactFields = ["id","displayName","name","emails","photos"];
			var contactFindOptions = {
				// filter: searchCritera,
				multiple: true
			};

			// alert('loading contacts');
			App.Utils.Notification.toast('Loading Contacts (may freeze for a moment)');

			// Go get data
			try {
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

					// console.log('with email');
					// console.log(JSON.stringify(contacts_with_email.splice(0,2)));

					// alert(contacts_with_email.length);

					// get only the top 25
					// contacts_with_email = contacts_with_email.splice(0,25);

					// Parse and sort
					var contacts_parsed = parse_and_sort_contacts(contacts_with_email);
					// contacts_parsed = contacts_parsed.splice(0,25);

					console.log('Got all contacts');
					console.log(contacts_parsed);
					console.log(JSON.stringify(contacts_parsed));

					// Resolve
					dfd.resolve(contacts_parsed);

					// Fire success function
					if(options.success){
						options.success(contacts_parsed);
					}

				}, function(err){
					// Err with contacts
					alert('Error with contacts');
				}, contactFindOptions);
			} catch(err){
				alert('failed getting contacts');
				console.log('Failed loading contacts');
				console.log(err);
				if(usePg){
					alert("Failed loading Contacts");
				}
				
			}


			break;
	}

	return dfd.promise();

}


function parse_and_sort_contacts(contacts){

	contacts = _.map(contacts,function(contact){
		// Iterating over every contact we have
		// - returning an array of emails, with each email having the contact data included
		// - instead of sorting by contact, we go by email address as the primary display

		var data = {
			id: contact.id, 
			name: contact.displayName,
			email: '',
			photo: ''
		};

		var tmp_emails = [];

		// Iterate over emails for contact
		// - remove emails we do not care about, like @craigslist
		_.each(contact.emails,function(email, index){
			var tmp_data = _.clone(data);

			// Don't use contacts that are from craigslist (too many sale- emails that we don't care about)
			if(email.value.indexOf('@craigslist') != -1){
				// return out of _.each
				return;
			}

			// Set display to email value, if displayName doesn't exist
			if(!contact.displayName){
				// tmp_data.name = email.value;
				tmp_data.name = '';
			}

			// Set photo value
			try {
				if(contact.photos.length > 0){
					data.photo = contact.photos[0].value; // url to content://com...
					// alert(data.photo);
				}
			} catch(err){
				console.log('shoot, photo failed');
				// console.log(err);
			}

			// Set email value
			tmp_data.email = email.value;

			// console.log('adding');
			tmp_emails.push(tmp_data);
		})

		if(contact.emails.length < 1){
			return [];
		}

		// console.log('return: ' + tmp_emails.length);
		return tmp_emails;

	});
	contacts = _.reduce(contacts,function(contact,next){
		return contact.concat(next);
	});
	contacts = _.compact(contacts); // get rid of empty arrays
	contacts = _.uniq(contacts);

	// // Sort
	// contacts = App.Utils.sortBy({
	// 	arr: contacts,
	// 	path: 'email',
	// 	direction: 'desc', // desc
	// 	type: 'string'
	// });
	console.log(contacts.length);
	return contacts;

};
