var filepicker = (function(){
    /*
     * @String: The API key for this site
     */
    var apiKey;

    var setAPIKey = function(key) {
        apiKey = key;
    };

    /*
     * @String: The hostname for the site.
     */
    var BASE_URL = "https://www.filepicker.io";

    /*
     * @Map{@String}: a constant map to provide easy selection of mimetypes
     */
    var MIMETYPES = {
        ALL:'*/*',
        IMAGES:'image/*',
        JPG:'image/jpeg',
        GIF:'image/gif',
        PNG:'image/png',
        PDF:'application/pdf',
        AUDIO:'audio/*',
        MP3:'audio/mpeg',
        TEXT:'text/*',
        HTML:'text/html',
        XML:'text/xml',
        VCARD:'text/vcard',
        VIDEO:'video/*',
        MPEG:'video/mpeg',
        MP4:'video/mp4'
    };

    /*
     * @Map{@String}: an enum of the services we support
     */
    var SERVICES = {
        BOX: 0,
        DROPBOX: 2,
        FACEBOOK: 3,
        GITHUB: 4,
        GMAIL: 5,
        IMAGE_SEARCH: 6,
        GOOGLE_DRIVE: 9,
        SEND_EMAIL: 10
    };
        
    var FilepickerException = function(text){
        this.text = text;
        this.toString = function(){return "FilepickerException: "+this.text;};
    };

    var isArray = function(o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    };

    var DIALOG_TYPES = {
            OPEN:'/dialog/open/',
            SAVEAS:'/dialog/save/'
    };

    var URL_REGEX = /^(http|https)\:.*\/\//i;
    
    var endpoints = {};
    endpoints.tempStorage = BASE_URL + "/api/path/storage/";
    endpoints.open = BASE_URL + DIALOG_TYPES.OPEN;
    endpoints.saveas = BASE_URL + DIALOG_TYPES.SAVEAS;

    var FINISHED_PATH = "/dialog/phonegap_done/";

    /*
     * Constructs the url for the window
     * Parameters:
     *  mimetypes: @Array[@String]. Array of mimetypes
     *  options: @Map{@String}. Optional additional specifications.
     *  dialogType: DIALOG_TYPES.OPEN or DIALOG_TYPES.SAVEAS
     * Returns:
     *  @String: the url of the window to be opened
     */
    var constructOpenURL = function(mimetypes, id, options){
        return endpoints.open+
            "?m="+mimetypes.join(",")+
            "&key="+apiKey+
            "&id="+id+
            "&referrer="+window.location.hostname+
            "&modal=false"+
            "&redirect_url="+BASE_URL+FINISHED_PATH+
            (options['services'] ? "&s="+options['services'].join(",") : "")+
            (options['location'] !== undefined ? "&loc="+options['location'] : "")+
            (options['metadata'] ? "&meta="+options['metadata']: "")+
            (options['maxsize'] ? "&maxsize="+options['maxsize']: "")+
            (options['persist'] ? "&p="+options['persist'] : "")+
            (options['auth_tokens'] ? "&auth_tokens="+options['auth_tokens'] : "");
    };
    var constructSaveAsURL = function(fileurl, mimetype, id, options){
        return endpoints.saveas+
            "?url="+fileurl+
            "&m="+mimetype+
            "&key="+apiKey+
            "&id="+id+
            "&referrer="+window.location.hostname+
            "&modal=false"+
            "&redirect_url="+BASE_URL+FINISHED_PATH+
            (options['services'] ? "&s="+options['services'] : "")+
            (options['location'] !== undefined ? "&loc="+options['location'] : "");
    };
    
    /*
     * returns: @String. A random ID number
     */
    var getID = function(){
        d = new Date();
        return d.getTime().toString();
    };
    
    /*
     * Opens a file picker dialog where the user can select a file to open/save into the application. 
     * Parameters:
     *  file_url: @String. SAVEAS ONLY. The file to save
     *  mimetype: @String||@Array[@String]. Limit selection to only the specified mimetype(s). Required
     *  options: @Map{@String}. Optional additional specifications.
     *  callback: @Function(url:@String,token:@String,data:@Map{String}). Callback contianing the access information for the selected file.
     * Returns:
     *  @Window: the window opened
     */
    var getFile = function(mimetype, options, callback) {
        return openFilepickerWindow(DIALOG_TYPES.OPEN, {'mimetype': mimetype, 'options': options, 'callback': callback});
    };
    
    var saveFileAs = function(file_url, mimetype, options, callback) {
        return openFilepickerWindow(DIALOG_TYPES.SAVEAS, {'file_url':file_url, 'mimetype': mimetype, 'options': options, 'callback': callback});
    };
    
    var openFilepickerWindow = function(dialogType, args) {
        //Local variables
        var picker;
        var handler;
        var file_url;

        if (!apiKey) {
            throw new FilepickerException("API Key not found");
        }
        
        if (dialogType != DIALOG_TYPES.OPEN && dialogType != DIALOG_TYPES.SAVEAS){
            return null;
        }
        if (dialogType == DIALOG_TYPES.SAVEAS){
            //the one unique argument
            file_url = args['file_url'];       
            if (!file_url || typeof file_url != "string") {
                throw new FilepickerException("The provided File URL ('"+file_url+"') is not valid");
            }
            if (!file_url.match(URL_REGEX)) {
                throw new FilepickerException(file_url + " is not a valid url. Make sure it starts with http or https");
            }
        }

        var mimetype = args['mimetype'];
        var options = args['options'];
        var callback = args['callback']; 

        if (options['location'] === undefined) {
            //Default to dropbox, not computer
            options['location'] = "/Dropbox/";
        }
                
        //setting up parameters
        mimetype = mimetype || MIMETYPES.ALL;
        if (!isArray(mimetype)) {
            mimetype = [mimetype];
        }

        if (options['services'] && !isArray(options['services'])) {
            options['services'] = [options['services']];
        }

        if (typeof options === "function") {
            callback = options;
            options = {};
        }
        callback = callback || function(){};

        //Debug mode - fire callback immediately
        if (options['debug']) {
            //we still want to mock asynchronous
            dummy_url = "https://www.filepicker.io/api/file/-nBq2onTSemLBxlcBWn1";
            data = {'filename':'test.png','type':'image/png','size':58979};
            window.setTimeout(function(){
                callback(dummy_url, data);
            }, 100);
            return window;
        }
        
        if (options['auth_tokens'] !== undefined) {
            var auth_tokens = JSON.stringify(options['auth_tokens']);
            options['auth_tokens'] = encodeURIComponent(auth_tokens);
        }

        var id = getID();
        var url;
        
        if (dialogType == DIALOG_TYPES.OPEN){
            url = constructOpenURL(mimetype, id, options);
        } else if (dialogType == DIALOG_TYPES.SAVEAS){
            url = constructSaveAsURL(file_url, mimetype, id, options);
        }

        var pg_callback = function(argsParsed){
            var fpurl = argsParsed['fpurl'];
            callback(fpurl, {});
        };

        picker = createPhoneGapPane(url, pg_callback);

        return picker;
    };

    var createPhoneGapPane = function(url, callback) {
        if (window.plugins === undefined || window.plugins.childBrowser === undefined) {
            throw FilepickerException("Could not find ChildBrowser plugin. Be sure you have it installed. See https://github.com/purplecabbage/phonegap-plugins for more details");
        }

        window.plugins.childBrowser.showWebPage(url,{
            showLocationBar: false,
            showAddress: false,
            showNavigationBar: false
        });
        window.plugins.childBrowser.onLocationChange = function(loc){
            //Really cool hack
            var parser = document.createElement('a');
            parser.href = loc;
            
            console.log(loc);
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
    };

    /********************UTILITIES***********************/
  /**
  *
  *  Base64 encode / decode
  *  http://www.webtoolkit.info/
  *
  **/    

  var Base64 = {

    // private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode : function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i);
            chr2 = input.charCodeAt(i+1);
            chr3 = input.charCodeAt(i+2);
            i += 3;

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
            this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
            this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    // public method for decoding
    decode : function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i));
            enc2 = this._keyStr.indexOf(input.charAt(i+1));
            enc3 = this._keyStr.indexOf(input.charAt(i+2));
            enc4 = this._keyStr.indexOf(input.charAt(i+3));
            i+=4;

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    // private method for UTF-8 encoding
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while ( i < utftext.length ) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

  };
  
    var getUrlFromData = function(fileContents, filename, callback) {
        if (typeof filename === "function") {
            callback = filename;
            filename = "";
        }

        callback = callback || function(){};

        if (!fileContents) {
            throw 'Error: no contents given';
        }
        var returnData;
        var base64contents = Base64.encode(fileContents);
        var request = utilities.ajax({
           method: 'POST',
           url: endpoints.tempStorage+filename,
           data:{fileContents: base64contents, apikey:apiKey},
           json: true,
           success: function(returnJson){
               returnData = returnJson;
               if (returnData.result == "ok") {
                  callback(returnData.url, returnData.data);
               } else {
                  callback(null, returnData);
               }
           },
           error: function(msg) {
               callback(null);
           }
        });
    };

    /*
     * Gets the raw data for a file link.
     * Parameters:
     *  file_url: @String. The file for which to fetch the data
     *  base64encode: @boolean. Optional. Whether the contents should be returned base64 encoded
     *  callback: @Function(data:@String). Callback function
     */
    var getContents = function(file_url, base64encode, callback) {
        if (typeof base64encode === "function") {
            callback = base64encode;
            base64encode = false;
        }
        //coerce into a boolean
        base64encode = !!base64encode;

        utilities.ajax({
            method: 'GET',
            url: file_url,
            data: {'base64encode':base64encode},
            success: function(responseText){
                callback(responseText);
            }
        });
    };

    /*
     * Removes a file link (and the file itself if it's stored on S3) for the given file
     * Parameters:
     *  file_url: @String. The file to revoke
     *  callback: @Function(success:@Boolean, message:@String). Callback function
     */
    var revokeFile = function(file_url, callback) {
        if (!apiKey) {
            throw new FilepickerException("API Key not found");
        }

        file_url += '/revoke';
        var request = utilities.ajax({
            method: 'POST',
            url: file_url,
            success: function(responseText) {
               callback(true, "success");
            },
            error: function(responseText) {
               callback(false, responseText);
            },
            data: {"key": apiKey}
        });
    };

    /*Utility functions*/
    //Much of this code is copied from MooTools
    var utilities = {};

    utilities.addOnLoad = function(func) {
        //We check for jquery - if we have it, use document.ready, else window onload
        if (window.jQuery) {
            window.jQuery(function(){
                func();
            });
        } else {
            var evnt = "load";
            if (window.addEventListener)  // W3C DOM
                window.addEventListener(evnt,func,false);
            else if (window.attachEvent) { // IE DOM
                window.attachEvent("on"+evnt, func);
            } else {
                if (window.onload) {
                    var curr = window.onload;
                    window.onload = function(){
                        curr();
                        func();
                    };
                } else {
                    window.onload = func;
                }
            }
        }
    };

    utilities.typeOf = function(value){
        if (value === null) {
            return 'null';
        } else if (Object.prototype.toString.apply(value) === '[object Array]') {
            return 'array';
        }
        return typeof value;
    };

    utilities.JSON = (function(){
        if (typeof JSON == 'undefined') this.JSON = {};

        var special = {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'};

        var escape = function(chr){
            return special[chr] || '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).slice(-4);
        };

        var validate = function(string){
            string = string.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
                            replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
                            replace(/(?:^|:|,)(?:\s*\[)+/g, '');

            return (/^[\],:{}\s]*$/).test(string);
        };

        var encode = JSON.stringify ? function(obj){
            return JSON.stringify(obj);
        } : function(obj){
            if (obj && obj.toJSON) obj = obj.toJSON();

            switch (utilities.typeOf(obj)){
                case 'string':
                    return '"' + obj.replace(/[\x00-\x1f\\"]/g, escape) + '"';
                case 'array':
                    return '[' + obj.map(encode).clean() + ']';
                case 'object': case 'hash':
                    var string = [];
                    Object.each(obj, function(value, key){
                        var json = encode(value);
                        if (json) string.push(encode(key) + ':' + json);
                    });
                    return '{' + string + '}';
                case 'number': case 'boolean': return '' + obj;
                case 'null': return 'null';
                default: return 'null';
            }

            return null;
        };

        var decode = function(string, secure){
            if (!string || utilities.typeOf(string) != 'string') return null;

            if (JSON.parse) {
                return JSON.parse(string);
            } else {
                if (secure){
                    if (!validate(string)) throw new Error('JSON could not decode the input; security is enabled and the value is not secure.');
                }
                return eval('(' + string + ')');
            }
        };

        return {
            validate: validate,
            encode: encode,
            decode: decode
        };
    })();

    utilities.ajax = (function() {
        var toQueryString = function(object, base) {
            var queryString = [];
            for (var key in object) {
                var value = object[key];
                if (base) key = base + '[' + key + ']';
                var result;
                switch (utilities.typeOf(value)){
                    case 'object': result = toQueryString(value, key); break;
                    case 'array':
                        var qs = {};
                        value.each(function(val, i){
                            qs[i] = val;
                        });
                        result = toQueryString(qs, key);
                    break;
                    default: result = key + '=' + encodeURIComponent(value); break;
                }
                if (value !== null){
                    queryString.push(result);
                }
            }

            return queryString.join('&');
        };

        var ajax = function(options){
            //setting defaults
            var url = options.url || null;
            var method = options.method ? options.method.toUpperCase() : "POST";
            var success = options.success || function(){};
            var error = options.error || function(){};
            var async = options.async === undefined ? true : options.async;
            var data = options.data || null;
            var processData = options.processData === undefined ? true : options.processData;
            if (data && processData) {
                data = toQueryString(options.data);
            }

            //creating the request
            var xhr;
            if (options.xhr) {
                xhr = options.xhr;
            } else {
                xhr = new XMLHttpRequest();
            }

            //Handlers
            var onStateChange = function(){
                if(xhr.readyState == 4){
                    if (xhr.status >= 200 && xhr.status < 300) {
                        var resp = xhr.responseText;
                        if (options.json) {
                            resp = utilities.JSON.decode(resp);
                        }
                        success(resp, xhr);
                    } else {
                        error(xhr.responseText, xhr);
                    }
                }
                xhr.onreadystatechage = function(){};
            };
            xhr.onreadystatechange = onStateChange;

            //Executing the request
            if (data && method == 'GET') {
                url += (url.indexOf('?') != -1 ? '&' : '?') + data;
                data = null;
            }
            
            xhr.open(method, url, async);
            if (options.json) {
                xhr.setRequestHeader('Accept', 'application/json');
            } else {
                xhr.setRequestHeader('Accept', 'text/javascript, text/html, application/xml, text/xml, */*');
            }

            if (data && processData && (method == "POST" || method == "PUT")) {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
            }

            xhr.send(data); 

            return xhr;
        };

        return ajax;
    })();

    utilities.matchesMimetype = function(test, against) {
        if (!test) {return false;}

        test_parts = test.split("/");
        against_parts = against.split("/");
        //comparing types
        if (against_parts[0] == "*") {return true;}
        if (against_parts[0] != test_parts[0]) {return false;}
        //comparing subtypes
        if (against_parts[1] == "*") {return true;}
        return against_parts[1] == test_parts[1];
    };

    var constructOpenWidgets = function() {
        var open_base = document.querySelectorAll('input[type="filepicker"]');
        var i; var j; var base; var ow; var holder; var mtypes; var fpoptions; var apikey; var services;
        for (i = 0; i < open_base.length; i++) {
            base = open_base[i];
            ow = document.createElement("button");
            ow.innerHTML = base.getAttribute('data-fp-text') || "Pick File";
            ow.className = base.getAttribute('data-fp-class') || base.className;

            base.setAttribute('type', "hidden");

            mtypes = (base.getAttribute("data-fp-mimetypes") || MIMETYPES.ALL).split(",");
            fpoptions = {};
            fpoptions['persist'] = (base.getAttribute("data-fp-option-persist") || "false") != "false";

            services = base.getAttribute("data-fp-option-services");
            if (services) {
                services = services.split(",");
                for (j=0; j<services.length; j++) {
                    services[j] = SERVICES[services[j].replace(" ","")];
                }
                fpoptions['services'] = services;
            }
            
            apikey = base.getAttribute("data-fp-apikey");
            if (apikey) {
                setAPIKey(apikey);
            }

            ow.onclick = (function(input, mimetypes, options){
                return function(){
                    getFile(mimetypes, options, function(data, metadata){
                        input.value = data;
                        var e = createOnChangeEvent(input, [{url:data, data:metadata}]);
                        console.log("change");
                        console.log(data);
                        input.dispatchEvent(e);
                    });
                    return false;
                };
            })(base, mtypes, fpoptions);

            base.parentNode.insertBefore(ow, base);
            //base.parentNode.replaceChild(ow, base);
            //ow.parentNode.insertBefore(holder, ow);
        }
    };

    var constructSaveWidgets = function() {
        var save_base = [];
        var tmp = document.querySelectorAll('button[data-fp-url]');
        for (i=0; i< tmp.length; i++) {save_base.push(tmp[i]);}
        tmp = document.querySelectorAll('a[data-fp-url]');
        for (i=0; i< tmp.length; i++) {save_base.push(tmp[i]);}
        tmp = document.querySelectorAll('input[type="button"][data-fp-url]');
        for (i=0; i< tmp.length; i++) {save_base.push(tmp[i]);}

        for (i = 0; i < save_base.length; i++) {
            base = save_base[i];

            //Most likely they will want to set things like data-fp-url on the fly, so
            //we get the properties dynamically
            base.onclick = (function(base) {
                return function() {
                    var mimetype = base.getAttribute("data-fp-mimetype");
                    var url = base.getAttribute("data-fp-url");
                    if (!mimetype || !url) {
                        return true;
                    }

                    var options = {};
                    var services = base.getAttribute("data-fp-option-services");
                    if (services) {
                        services = services.split(",");
                        for (j=0; j<services.length; j++) {
                            services[j] = SERVICES[services[j].replace(" ","")];
                        }
                        options['services'] = services;
                    }
                    
                    apikey = base.getAttribute("data-fp-apikey");
                    if (apikey) {
                        setAPIKey(apikey);
                    }
                    saveFileAs(url, mimetype, options);
                    return false;
                };
            })(base);
        }
    };

    var createOnChangeEvent = function(input, files){
        var e = document.createEvent('Event');
        e.initEvent("change", true, false);
        e.eventPhase = 2;
        e.currentTarget = e.srcElement = e.target = input;
        e.files = files;
        return e;
    };

    /*WIDGET CODE*/
    if (document.querySelectorAll) {
        var func = function(){
            constructOpenWidgets();
            constructSaveWidgets();
        };
        utilities.addOnLoad(func);
    }

    return {
        getFile: getFile,
        saveAs: saveFileAs,
        MIMETYPES: MIMETYPES,
        SERVICES: SERVICES,
        setKey: setAPIKey,
        getUrlFromData: getUrlFromData,
        revokeFile: revokeFile,
        getContents: getContents
    };
})();