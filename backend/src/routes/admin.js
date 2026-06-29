const router = require('express').Router();
const {
  getDashboard, listServices, updateService,
  addService, listBookings, updateBookingStatus,
} = require('../controllers/adminController');
const { authenticate, requireRole, requireHospitalAdmin } = require('../middleware/auth');

// All admin routes require authentication
router.use(authenticate);
router.use(requireRole('hospital_admin', 'super_admin'));

router.get('/:hospitalId/dashboard', requireHospitalAdmin, getDashboard);
router.get('/:hospitalId/services', requireHospitalAdmin, listServices);
router.post('/:hospitalId/services', requireHospitalAdmin, addService);
router.put('/:hospitalId/services/:serviceId', requireHospitalAdmin, updateService);
router.get('/:hospitalId/bookings', requireHospitalAdmin, listBookings);
router.patch('/:hospitalId/bookings/:bookingId/status', requireHospitalAdmin, updateBookingStatus);

module.exports = router;
