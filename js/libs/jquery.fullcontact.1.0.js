/*
   Copyright 2011 FullContact, Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
//jQuery FullContact Plugin - VERSION 1.0

(function($) {
    $.fullcontact = {
        baseURL: 'https://api.fullcontact.com/',
        vcardEndpoint: 'v2/person.vcf',
        personLookupEndpoint: 'v2/person.json',
        buildURL: function(endpoint, apiKey, options) {
            var optionsString = ""
            for(var opt in options) optionsString += "&"+escape(opt)+"="+escape(options[opt]);
            optionsString = "?apiKey="+apiKey+optionsString;
            return this.baseURL+endpoint+optionsString;
        },
        executeRequest: function(url, method, dataType, oncomplete, data) {
            // Uses jsonp, so no console.log
            $.ajax({
                url: url,
                //async:true, // why?
                type: method,
                success: function(response){
                    if(oncomplete){
                        oncomplete(response);
                    }
                },
                error: function(obj,status,error){
                    if(oncomplete){
                        oncomplete({status: obj.status, message: error});
                    }
                },
                data: data,
                dataType: dataType 
            });
        },
        emailLookup: function(apiKey,emailAddress,oncomplete,options) {
            options = options || {};
            options.email = emailAddress;
            var url = this.buildURL(this.personLookupEndpoint,apiKey,options);
            this.executeRequest(url,'GET','jsonp',oncomplete);
        },
        enrichVCard: function(apiKey,vcard,oncomplete,options) {
            var url = this.buildURL(this.vcardEndpoint,apiKey,options);
            this.executeRequest(url,'POST','text',oncomplete,{vcard:vcard});
        } 
    };
    $.fn.fullcontact = $.fullcontact;
})(jQuery);
