const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const controller = require('../controllers/analytics.controller');

router.use(requireAuth);
router.get('/summary', asyncHandler(controller.summary));
module.exports = router;
