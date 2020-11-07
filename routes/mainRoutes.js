/**
 * Handles routing of all pages (to be organized more to separate pages soon)
 */

const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController.js');

/**
 * Get Routes (webpages)
 */
router.get('', mainController.main_index);
router.get('/login', mainController.main_login_get);
router.get('/sign-up', mainController.main_signUp_get);
router.get('/noAccess', mainController.main_noAccess_get);

/**
 * Get Routes (fetch requests)
 */
router.get('/videoID', mainController.main_videoID_get);
router.get('/checkURL', mainController.main_checkURL_get);
router.get('/checkRoom', mainController.main_checkRoom_get);

/**
 * Post Routes (webpages)
 */
router.post('/watch', mainController.main_watch_post);

module.exports = router;