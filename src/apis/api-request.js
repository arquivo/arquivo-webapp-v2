const https = require('https');
const http = require('http');
const logger = require('../logger');
class ApiRequest {
    constructor(apiUrl, defaultApiParams = {}, defaultApiReply = {}) {
        this.apiReply = '';
        this.apiData = defaultApiReply;
        this.apiUrl = apiUrl;
        this.defaultApiParams = defaultApiParams;
        this.defaultApiReply = defaultApiReply;
        this.dataFunction = (requestData) => { return (d) => { this.apiReply = this.apiReply + d.toString(); } };
        this.endFunction = (requestData) => { return () => { try { this.apiData = JSON.parse(this.apiReply) } catch (e) { this.logger.error(e); this.apiData = this.defaultApiReply }; } };
        this.closeFunction = (requestData, callback) => { return () => { callback(this.apiData); } };
        this.errorFunction = (requestData, callback) => { return (e) => { this.logger.error(e); callback(this.defaultApiReply); } };
        this.logger = logger('ApiRequest');
    }

    get(requestData, callback) {
        let get;
        if (this.apiUrl.startsWith('https')) {
            get = https.get;
        } else {
            get = http.get;
        }
        try {
            this.logger.info(this.apiUrl + '?' + this.sanitizeRequestData(requestData).toString())
            const apiReq = get(this.apiUrl + '?' + this.sanitizeRequestData(requestData).toString(),
            (apiRes) => {
                apiRes.on('data', this.dataFunction(requestData));
                apiRes.on('end', this.endFunction(requestData));
                apiRes.on('close', this.closeFunction(requestData, callback));
                apiRes.on('error', this.errorFunction(requestData, callback));
            })
            apiReq.end();
            apiReq.on('error', this.errorFunction(requestData, callback));

        } catch (e) {
            this.errorFunction(requestData,callback)(e);
        }
        

    }

    sanitizeRequestData(requestData) {
        const apiRequestData = new URLSearchParams();

        //Load parameters onto api request data
        Object.keys(this.defaultApiParams)
            .filter(key => this.defaultApiParams[key] !== null || requestData.has(key))
            .forEach(key => apiRequestData.set(key, requestData.get(key) ?? this.defaultApiParams[key]));
            
        return apiRequestData;
    }
}
module.exports = ApiRequest