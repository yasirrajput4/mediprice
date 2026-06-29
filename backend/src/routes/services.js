// services.js
const svcRouter = require('express').Router();
const { searchServices, getCategories, getTrending, autocomplete } = require('../controllers/serviceController');
svcRouter.get('/search', searchServices);
svcRouter.get('/categories', getCategories);
svcRouter.get('/trending', getTrending);
svcRouter.get('/autocomplete', autocomplete);
module.exports = svcRouter;
