App.Models = {};

// Todo:
// - add API diffs and versioning to reduce requests made to the server

App.Models.EmailBoxModel = Backbone.Model.extend({

	idAttribute: '_id'

});



App.Models.Thread = App.Models.EmailBoxModel.extend({

	hasMany: {
		Email: App.Models.Email
	}

});


App.Models.Email = App.Models.EmailBoxModel.extend({

	belongsTo: {
		Thread: App.Models.Thread
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



App.Models.AppMinimailLeisureFilter = App.Models.EmailBoxModel.extend({

	hasMany: {
		Thread: App.Models.Thread
	}

});

