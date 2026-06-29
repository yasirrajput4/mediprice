const router = require('express').Router();
const {
  listHospitals, getHospital, getHospitalServices,
  getHospitalReviews, getHospitalSlots,
} = require('../controllers/hospitalController');

router.get('/', listHospitals);
router.get('/:id', getHospital);
router.get('/:id/services', getHospitalServices);
router.get('/:id/reviews', getHospitalReviews);
router.get('/:id/slots', getHospitalSlots);

module.exports = router;
