//    Backbone.cachingSync v0.1.1

//    (c) 2012 Yiorgis Gozadinos, Crypho AS.
//    Backbone.cachingSync is distributed under the MIT license.
//    http://github.com/ggozad/Backbone.cachingSync

// AMD/global registrations
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'underscore', 'backbone', 'burry'], function ($, _, Backbone, Burry) {
            return (root.Backbone.cachingSync = factory($, _, Backbone, Burry));
        });
    } else {
        // Browser globals
        root.Backbone.cachingSync = factory(root.$, root._, root.Backbone, root.Burry);
    }
}(this, function ($, _, Backbone, Burry) {

    // **Backbone.cachingSync** provides `localStorage` caching for your models/collections.
    // In order to use it assign your model/collection's **sync** function to a wrapped
    // version. For instance `Collection.sync = Backbone.cachingSync(Backbone.sync, 'mycollection');`
    // will cache sync operations in the `mycollection` localStorage store.
    // Parameters are: `wrapped` the original sync function you are wrapping,
    // `ns`, the namespace you want your Store to have,
    // `default_ttl`, a default time-to-live for the cache in minutes.
    var cachingSync = function (wrapped, base_ns, _id_or_id, default_ttl) {

        // _id_or_id handls mongo vs normal OK

        _id_or_id = _id_or_id || '_id'; // default is mongodb
        // console.log(ns + ' id: ' + _id_or_id);

        var ns = base_ns + '_v12';
        // Create the `Burry.Store`
        var burry = new Burry.Store(ns, default_ttl);
        // var ns = base_ns + '_v12';

        // var CacheStore = new App.Utils.CacheStore(ns + '_v10'); // todo..

        // **get** caches *read* operations on a model. If the model is cached,
        // it will resolve immediately with the updated attributes, triggering a `change`
        // event when the server *read* gets resolved. If no cache exists, the operation resolves
        // normally (i.e. when the server *read* resolves).
        function get (model, options) {
            // console.log('get');
            // console.log(model.id);

            var d = $.Deferred();

            // console.log('model.id');
            // console.log(model.id);
            // console.log(model.toJSON());

            App.Utils.Storage.get(model.id, ns)
                .then(function(item){

                    var updated = {},
                        wp;

                    wp = wrapped('read', model, options).done(function (attrs) {

                        // Set model attributes
                        model.set(attrs);

                        // Store to cache
                        App.Utils.Storage.set(model.id, attrs, ns);
                        // burry.set(model.id, model.toJSON());
                    });

                    if (typeof item !== 'undefined' && App.Credentials.useCache) {
                        // Got data from burry
                        // console.info('Got valid Model from burry');
                        _.each(item, function (value, key) {
                            if (model.get(key) !== value) updated[key] = value;
                        });
                        d.resolve(updated);
                    } else {
                        // console.warn('Invalid Model from burry');
                        wp.done(d.resolve).fail(d.reject);
                    }
                });

            return d.promise();
        }

        // **gets** behaves similarly to **get** except it applies to collections.
        function gets (collection, options) {

            var d = $.Deferred();

            // console.log('collection');
            // console.log(collection);
            // console.log('ns');
            // console.log(ns);

            var id_ns = ns;

            // Need to include a passed new cachePrefix for some collections
            if(options.cachePrefix){
                // console.warn('cachePrefix');
                id_ns = id_ns + options.cachePrefix + '_';
                // console.warn(ns);
                // console.warn(id_ns);
            }

            // Collection namespace?
            // - for ids
            if(options.options && options.options.collectionCachePrefix){
                id_ns = id_ns + '_' + options.options.collectionCachePrefix;
            }
            // console.log('id_ns: ' + id_ns);
            // console.log(options);

            options.ns = ns;

            App.Utils.Storage.get('__ids__', id_ns)
                .then(function(ids){

                    var wp;

                    // console.log(ns + ': ' + ids.length);
                    // console.log(ns + ': ' + );

                    // Mimic a normal .fetch using the "wrapped" function that was passed in
                    // - fires before even checking the cache

                    // console.log('gets ids');
                    // console.log(ids);

                    wp = wrapped('read', collection, options).done(function (models) {
                        // The standard "fetch" has resolved now, so figure out differences

                        // console.log('ajax returned');
                        // iterate over returned models
                        _.each(models, function (model) { 
                            // Cache model
                            App.Utils.Storage.set(model[_id_or_id], model, ns);
                            // burry.set(model._id, model); 
                        });

                        // Check if we provided an custom "update" option, or if just using the standard "set" (or reset)
                        if (options.update) {
                            // if we specified an "update" action in options, then run that action (assuming it is handling "reset" or "add/remove" events
                            // console.info('Issuing update');
                            collection.update(models, options);
                        } else {
                            // reset collection
                            // - triggers collection.on('reset')
                            // collection.reset(models); // old, for 0.9.2
                            
                            // "set" collection
                            // - triggers add, remove, change events as necessary
                            // console.log(collection);
                            // console.log('Issuing set');
                            // console.log(collection);

                            // if(options.silent){
                            //     collection.set(models, {
                            //         silent: true // prevent event emittance
                            //     }); // new in Backbone 1.0.0               
                            // } else {
                                console.log('set models');
                                collection.set(models); // new in Backbone 1.0.0  (never fires reset?)             
                            // }

                        }
                        // console.log('__ids__: ' + ns);
                        // console.log(JSON.stringify(collection.models));
                        var ids;
                        if(collection.custom_cache_id){
                            console.warn('custom cache id');
                            _ids_ = _.map(collection.models,function(tmp_model){
                                var tmp = JSON.parse(JSON.stringify(tmp_model)); // contacts were causing the _.pluck to fuck up and quit working
                                return tmp.id;
                            });
                            App.Utils.Storage.set('__ids__', _ids_, id_ns); //  _.pluck(collection.models, 'id'),
                        } else {
                            // App.Utils.Storage.set('__ids__', _ids_, id_ns); //  _.pluck(collection.models, 'id'),

                            // See if it is null (meaning it probably broke)
                            _ids_ = _.pluck(collection.models, 'id');
                            if(_ids_.length > 0){
                                // Test for null
                                if(_ids_[0] == null){
                                    // Shit
                                    console.warn('Saving a turrible model id');
                                }
                            }
                            App.Utils.Storage.set('__ids__', _ids_ , id_ns); //  _.pluck(collection.models, 'id'),
                        }

                        // burry.set('__ids__', _.pluck(collection.models, 'id'));
                    });

                    if (typeof ids !== 'undefined' && App.Credentials.useCache) {
                        // Go through stored ids, and get those
                        // console.info('Got valid Collection from burry');

                        // - map to a collection, return that collection through the resolve (just as if coming from a remote connection)
                        try {
                            // Resolve with an array of models
                            // console.log('namespace');
                            // console.log(ns);
                            try {
                                var resolve = _.map(ids, function (id) {
                                    // var json = burry.get(id);
                                    // console.log('id');
                                    // console.log(id);
                                    return App.Utils.Storage.get(id, ns);
                                    //     .then(function(json){
                                    //         json.id = json._id; // right???? maybe json.get('id') ?
                                    //     });
                                    // json.id = id;
                                    // return json;
                                });
                            } catch(err){
                                throw "Fucking error"
                                return;
                            }

                            // console.info('resolve');
                            // console.log(resolve);

                            // Resolve
                            // console.log('resolve');
                            // console.log(resolve.length);
                            try {
                                $.whenall(resolve)
                                    .done(function(){
                                        // Done?
                                        var alldata = _.map(arguments,function(json){
                                            json.id = json[_id_or_id];
                                            return json;
                                        });

                                        // console.log('alldata');
                                        // console.log(arguments);
                                        // console.log(alldata);

                                        // collection.set(alldata); // new in Backbone 1.0.0            
                                        // console.info('Resolved all');
                                        // console.log(arguments);
                                        d.resolve(alldata);
                                    });
                            } catch(err){
                                throw "Fucking error2"
                                return;
                            }
                            
                        } catch(err){
                            // wp.done(d.resolve).fail(d.reject);
                            // return d.promise();  
                            console.warn('FAILED burry:' + ns);  
                            console.log(err);
                            // console.log(ids);
                            d.resolve([]);
                        }
                        
                    } else {
                        // console.warn('Invalid Collection from burry');
                        wp.done(d.resolve).fail(d.reject);
                    }

                });

           

            return d.promise();
        }

        // **create** saves a model on the server, and when the server save is resolved,
        // the model (and potentially its collection) is cached.
        function create (model, options) {
            return wrapped('create', model, options)
                .done(function (attrs) {
                    burry.set(attrs[model.idAttribute], attrs);
                    if (model.collection)
                        burry.set('__ids__', _(model.collection.models).chain()
                            .pluck('id')
                            .union([attrs[model.idAttribute]])
                            .without(undefined).value());

                }).promise();
        }

        // **update** resolves immediately by caching the model. Additionally it calls the wrapped sync
        // to perform a server-side save, which if it fails reverts the cache.
        function update (model, options) {
            var old = burry.get(model.id);
            burry.set(model.id, model.attributes);
            return wrapped('update', model, options)
                .fail(function () {
                    if (old) {
                        burry.set(model.id, old);
                    } else {
                        burry.remove(model.id);
                    }
                })
                .promise();
        }

        // **destroy** removes immediately the model from the cache. Additionally it calls the wrapped sync
        // to perform a server-side delete, which if it fails reverts the cache.
        function destroy (model, options) {
            var old = burry.get(model.id);
            burry.remove(model.id);
            return wrapped('destroy', model, options)
                .fail(function () { if (old) burry.set(model.id, old); })
                .promise();
        }

        // The actual wrapping sync function
        return function (method, model, options) {
            var p;
            options = options || {};
            // console.log('typeof');
            // console.dir(model);
            // console.log(model);
            // console.log(typeof(model.models));
            // console.log(typeof model.models !== 'undefined' ? 'collection' : 'model' );
            switch (method) {
                case 'read':  
                    if(typeof model.models !== 'undefined'){
                        // console.log('collection');
                        p = gets(model, options);
                    } else {
                        // console.log('model');
                        p = get(model, options)
                    }  
                    break;
                case 'create':  p = create(model, options); break;
                case 'update':  p = update(model, options); break;
                case 'delete':  p = destroy(model, options); break;
            }

            // Fallback for old-style callbacks.
            if (options.success) p.done(options.success);
            if (options.error) p.fail(options.error);

            return p;
        };
    };

    return cachingSync;


}));
