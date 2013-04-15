App.Models = {};

// Todo:
// - add API diffs and versioning to reduce requests made to the server

App.Models.EmailBoxModel = Backbone.Model.extend({

	modelName: '',
	internalModelName: '',
	idAttribute: '_id',
	cacheType: null,
	fields: ['_id'],

	// Standard fetchFull
	fetchFull: function(options){
		// console.log('fetch ThreadFull');
		// console.log(options);
		// console.log(this.get('id'));
		return this.fetch({
			data: {
				model: this.modelName,
				conditions: {
					'_id' : this.id
				},
				fields: [],
				limit: 1
			}
		});
	}

});



App.Models.ThreadIds = App.Models.EmailBoxModel.extend({
	
	// Returns Thread._ids
	// - special kind of caching
	// cacheType: 'ids'

	modelName: 'Thread',
	internalModelName: 'ThreadIds',
	fields: ['_id']

});



App.Models.EmailIds = App.Models.EmailBoxModel.extend({
	
	// Returns Thread._ids
	// - special kind of caching
	// cacheType: 'ids'

	modelName: 'Email',
	internalModelName: 'EmailIds',
	fields: ['_id']

});


App.Models.ThreadFull = App.Models.EmailBoxModel.extend({
	
	sync: Backbone.cachingSync(emailbox_sync_model, 'ThreadFull'),

	modelName: 'Thread',
	internalModelName: 'ThreadFull',
	fields: ['app','original','attributes','common'],
	cacheType: 'full',

	fetchFull: function(options){
		// console.log('fetch ThreadFull');
		// console.log(options);
		// console.log(this.get('id'));
		return this.fetch({
			data: {
				model: 'Thread',
				conditions: {
					'_id' : this.id
				},
				fields: [],
				limit: 1
			}
		});
	}

});


App.Models.UserEmailAccount = App.Models.EmailBoxModel.extend({
	
	sync: Backbone.cachingSync(emailbox_sync_model, 'UserEmailAccount'),
	internalModelName: 'UserEmailAccount',

	modelName: 'UserEmailAccount',
	fields: [],
	cacheType: 'full'

});


App.Models.Thread = App.Models.EmailBoxModel.extend({
	
	modelName: 'Thread',
	internalModelName: 'Thread',

});


App.Models.Email = App.Models.EmailBoxModel.extend({

	modelName: 'Email',
	internalModelName: 'Email',
	sync: Backbone.cachingSync(emailbox_sync_model, 'Email')

});


App.Models.EmailFull = App.Models.EmailBoxModel.extend({

	modelName: 'Email',
	internalModelName: 'EmailFull',
	sync: Backbone.cachingSync(emailbox_sync_model, 'EmailFull'),

	fetchFull: function(options){
		// console.log('fetch ThreadFull');
		// console.log(options);
		// console.log(this.get('id'));
		return this.fetch({
			data: {
				model: 'Email',
				conditions: {
					'_id' : this.id
				},
				fields: [],
				limit: 1
			}
		});
	}

});


App.Models.LeisureFilterIds = App.Models.EmailBoxModel.extend({

	modelName: 'AppMinimailLeisureFilter',
	internalModelName: 'AppMinimailLeisureFilterFull',
	sync: Backbone.cachingSync(emailbox_sync_model, 'AppMinimailLeisureFilterId')

});

App.Models.LeisureFilterFull = App.Models.EmailBoxModel.extend({

	modelName: 'AppMinimailLeisureFilter',
	internalModelName: 'AppMinimailLeisureFilterFull',
	sync: Backbone.cachingSync(emailbox_sync_model, 'AppMinimailLeisureFilterFull'),

	fetchFull: function(options){
		// console.log('fetch ThreadFull');
		// console.log(options);
		// console.log(this.get('id'));
		return this.fetch({
			data: {
				model: 'AppMinimailLeisureFilter',
				conditions: {
					'_id' : this.id
				},
				fields: [],
				limit: 1
			}
		});
	}

});


App.Models.Contact = App.Models.EmailBoxModel.extend({

});


App.Models.Attachment = Backbone.Model.extend({

	// belongsTo: {
	// 	Thread: App.Models.Email
	// }

});


App.Models.Link = Backbone.Model.extend({

	// belongsTo: {
	// 	Thread: App.Models.Email
	// }

});


// Local contacts only
App.Models.Contact = App.Models.EmailBoxModel.extend({

});


App.Models.EmailBoxModel = Backbone.Model.extend({

	modelName: '',
	internalModelName: '',
	idAttribute: '_id',
	cacheType: null,
	fields: ['_id']

});


function emailbox_sync_model(method, model, options) {

	// console.log('backbone model sync overwritten');

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

			// console.info('sync reading model');
			// console.log(options);

			// Caching is enabled on a per-model basis
			// - uses patching as well (when specified)
			if(options.cacheType != null){
				// Check the cache

			}

			// turn on caching for fucking everything yeah
			// - fuck it why not?
			if(App.Credentials.usePatching){
				options.data.cache = true;
			}

			// Get previous cache_hash
			// - just stored in memory for now
			try {
				options.data.hash = App.Data.Store.ModelCache[model.internalModelName + '_' + model.id].hash;
			} catch(err){
				// no hash exists
			}

			// if(model.cache_hash){
			// 	console.warn('cache hash!');
			// 	console.log(model.cache_hash);
			// 	options.data.hash = model.cache_hash;
			// }

			// console.info('pre search');
			// console.dir(model);

			// Emailbox search
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

					// data or patch?
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
							// console.log(model.internalModelName + '_' + model.id);
							if(App.Data.Store.ModelCache[model.internalModelName + '_' + model.id].text.length > 0){
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
						var result_text = dmp.patch_apply(patches, App.Data.Store.ModelCache[model.internalModelName + '_' + model.id].text);

						// Convert text to an object
						try {
							response.data = JSON.parse(result_text[0]); // 1st, only 1 patch expected
						} catch(err){
							// Shoot, it wasn't able to be a object, this is kinda fucked now
							// - need to 
							console.log('Failed recreating JSON');
							console.log(response.data);
							return false;
						}

					}

					// After patching (if any occurred)

					// Return data without the 'Model' lead
					var tmp = [];
					var tmp = _.map(response.data,function(v){
						return v[options.data.model];
					});

					// Did we only get a single value?
					if(_.size(tmp) != 1){
						// Shoot
						dfd.reject(); // is this correct, to reject? 
						if(options.error){
							options.error();
						}
						return;
					}

					// Return single value
					window.setTimeout(function(){

						// Resolve
						dfd.resolve(tmp[0]);

						// Fire success function
						if(options.success){
							options.success(tmp[0]);
						}
					},1);

					// Update cache with hash and text
					App.Data.Store.ModelCache[model.internalModelName + '_' + model.id] = {
						hash: response.hash,
						text: JSON.stringify(response.data)
					};

				}
			});

			break;
	}

	return dfd.promise();

}
