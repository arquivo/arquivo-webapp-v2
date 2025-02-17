const backendRoutes = require('./backend-routes');
const searchPages = require('./search-pages.js');
const searchImages = require('./search-images.js');
const searchUrl = require('./search-url.js');
const archivePageNow = require('./services-archivepagenow');
const citationSaver = require('./services-citationsaver');
const wayback = require('./wayback');
const tracking = require('./tracking');
const replayNav = require('./replay-nav');
const replayTechnicalDetails = require('./replay-technical-details');
const express = require('express');
const router = express.Router();

//Backend routes
backendRoutes(router);

// Homepage 
router.get('/', function (req, res) {
    res.render('pages/home');
});

// Pages search results
router.get('/page/search', function (req, res) {
    const requestData = req.utils.sanitizeInputs(req, res);

    if (!requestData.has('q') || requestData.get('q') == '') {
        res.render('pages/home');
    } else if (req.utils.isValidUrl(requestData.get('q'))) {
        res.redirect('/url/search?' + requestData.toString())
    } else {
        res.render('pages/pages-search-results', {
            requestData: requestData,
        });
    }
});
router.get('/url/search', function (req, res) {
    res.render('pages/replay-table-list-results', { requestData: req.utils.sanitizeInputs(req, res) });
});

// Images search results
router.get('/image/search', function (req, res) {
    const requestData = req.utils.sanitizeInputs(req, res);
    if (!requestData.has('q') || requestData.get('q') == '') {
        res.render('pages/home', { searchType: 'images' });
    } else {
        if (req.utils.isValidUrl(requestData.get('q'))) {
            requestData.set('siteSearch', requestData.get('q'));
            requestData.set('q', 'site:' + requestData.get('q'));
        }
        res.render('pages/images-search-results', {
            requestData: requestData,
        });
    }
});

// Pages: landing page
router.get('/pages', function (req, res) {

    res.render('pages/home',{searchType: 'pages'});
});

// Pages advanced search
router.get('/page/advanced/search', function (req, res) {
    res.render('pages/pages-advanced-search', { requestData: req.utils.sanitizeInputs(req, res) });
});

// Images: landing page
router.get('/images', function (req, res) {

    res.render('pages/home',{searchType: 'images'});
});

// Images: advanced search
router.get('/image/advanced/search', function (req, res) {
    res.render('pages/images-advanced-search',{ requestData: req.utils.sanitizeInputs(req, res) });
});

// starts wayback
router.get('/wayback/[*]/:url*', function (req, res) {
    const requestUrl = req.params.url + (req.params['0'] ?? '');
    const requestData = new URLSearchParams({q:requestUrl});
    if (req.utils.isValidUrl(requestUrl)) {
        res.redirect('/url/search?' + requestData.toString())
    } else {
        res.render('pages/pages-search-results', {
            requestData: requestData,
        });
    }

});
router.get('/wayback/:url*', function (req, res) {
    wayback(req, res);
});
// page/view for tracking purposes
router.get('/page/view/:url*', function (req, res) {
    tracking(req, res,'PageView');
});
router.get('/image/view/:url*', function (req, res) {
    tracking(req, res,'ImageView');
});

// switch languages
router.get('/switchlang', function (req, res) {
    if(!!req.headers && req.headers.referer){
        

        let oldUrl = req.headers.referer;
        let parsedUrl = new URL(oldUrl);

        const config = require('config')

        const validHosts = [
            'localhost', // to allow local testing
            (new URL(config.get('backend.url'))).hostname
        ]
        if(!validHosts.includes(parsedUrl.hostname)){
            res.redirect('/');
        }
        
        let currentLocale = req.getLocale();
        let newLocale = req.getLocales().find(l => l!=currentLocale);
        
        res.clearCookie('i18n');
        res.cookie('i18n', newLocale, { maxAge: 900000 });
        
        if(!parsedUrl.pathname.startsWith('/wayback')){
            parsedUrl.searchParams.set('l',newLocale.split('_').shift());
        }

        const newUrl = parsedUrl.href.slice(parsedUrl.origin.length);

        //Prevent browser caching from ruining everything
        res.set('Cache-control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.redirect(newUrl);
        
    } else {
        res.redirect('/');
    }
});


router.get('/services/citationsaver', function (req, res) {
    res.render('pages/services-citation-saver');
});



router.post('/services/citationsaver', function (req, res) {
    citationSaver(req,res);
});


// starts partials
router.get('/partials/:id', function (req, res) {
    if (req.params.id == 'pages-search-results') {
        searchPages(req, res);
    } else if (req.params.id == 'images-search-results') {
        searchImages(req, res);
    } else if (req.params.id == 'url-search-results') {
        searchUrl(req, res);
    } else if (req.params.id == 'replay-nav') {
        replayNav(req, res);
    } else if (req.params.id == 'replay-technical-details') {
        replayTechnicalDetails(req, res);
    } else {
        res.render('partials/' + req.params.id, { layout: false });
    }
});

// Backwards compatibility with old service name (SavePageNow -> ArchivePageNow) 
router.get('/services/savepagenow', function (req, res) {
    const requestData = new URLSearchParams(req.query);
    res.redirect('/services/archivepagenow?'+requestData.toString());
});

// ArchivePageNow form
router.get('/services/archivepagenow', function (req, res) {
    const requestData = new URLSearchParams(req.query);
    res.render('pages/services-archivepagenow', {
        url: (requestData.get('url') ?? '').trim(),
        error: false
    });
});

// ArchivePageNow recording page
router.post('/services/archivepagenow', function (req, res) {
    const requestData = new URLSearchParams(req.query);
    if (!requestData.has('logging')) {
        archivePageNow(req, res);
    } else {
        res.end();
    }
});

// patching 
router.get('/services/complete-page', function (req, res) {
    const requestData = new URLSearchParams(req.query);
    requestData.set('url', decodeURIComponent(requestData.get('url')));
    res.render('pages/services-complete-page', {
        requestData: requestData,
    });
});

// starts 404 
router.use(function (req, res, next) {
    res.status(404).render('pages/arquivo-404');
});
// ends 404

module.exports = router;