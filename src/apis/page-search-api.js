const ApiRequest = require('./api-request');
const config = require('config');
class PageSearchApiRequest extends ApiRequest {
    constructor(backend=null) {
        const defaultApiParams = {
            q: null,
            from: config.get('search.start.date'),
            to: (new Date()).toLocaleDateString('en-CA').split('-').join(''),
            type: null,
            offset: 0,
            siteSearch: null,
            collection: null,
            maxItems: config.get('text.results.per.page'),
            dedupValue: null,
            dedupField: null,
            fields: null,
            prettyPrint: false,
            metadata: null,
            trackingId: null,
        }
        let apiEndpoint;
        switch (backend) {
            case 'solr':
                apiEndpoint = config.get('text.search.api.solr');
                break;
            case 'nutchwax':
                apiEndpoint = config.get('text.search.api.nutchwax');
                break;
            default:
                apiEndpoint = config.get('text.search.api.default');
                break;
        }
        super(apiEndpoint,defaultApiParams);
    }

    sanitizeRequestData(requestData) {
        const apiRequestData = new URLSearchParams(requestData);

        ['site', 'type', 'collection','safe','size'].forEach(inlineParam => {
            const requestParam = ['site','safe'].includes(inlineParam) ? inlineParam+'Search' : inlineParam;
            if (apiRequestData.has(requestParam)) {
                const regex = new RegExp(`\\s*${inlineParam}:${apiRequestData.get(requestParam)}\\s*`)
                apiRequestData.set('q', apiRequestData.get('q').split(regex).join(' '));
            }
        });
        return super.sanitizeRequestData(apiRequestData);
    }
}

module.exports = PageSearchApiRequest;