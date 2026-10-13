import { Router } from 'express';
import {
  createAuditorium,
  createMovie,
  createSeats,
  createShowtime,
  createTheater,
  deleteAuditorium,
  deleteMovie,
  deleteShowtime,
  deleteTheater,
  getMovie,
  listAuditoriums,
  listMovies,
  listSeats,
  listShowtimes,
  listTheaters,
  updateAuditorium,
  updateMovie,
  updateSeat,
  updateShowtime,
  updateTheater
} from '../controllers/catalog.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();
const admin = [requireAuth, requireRoles('manager', 'admin', 'superadmin')];

router.get('/movies', listMovies);
router.get('/movies/:id', getMovie);
router.get('/theaters', listTheaters);
router.get('/showtimes', listShowtimes);

router.post('/promotions/validate', (req, res) => {
  const code = (req.body.code || '').trim().toUpperCase();
  const orderAmount = Number(req.body.orderAmount || 0);

  const samplePromotions = {
    'CINEVITE10': { name: 'Giảm 10% tổng đơn', type: 'percentage', value: 10, minOrder: 0, discount: Math.round(orderAmount * 0.1) },
    'VIP20K': { name: 'Giảm 20.000đ cho đơn từ 50k', type: 'fixed', value: 20000, minOrder: 50000, discount: 20000 },
    'CHAOBANMOI': { name: 'Ưu đãi bạn mới giảm 30.000đ', type: 'fixed', value: 30000, minOrder: 80000, discount: 30000 },
  };

  if (samplePromotions[code]) {
    const promo = samplePromotions[code];
    if (orderAmount < promo.minOrder) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu phải từ ${promo.minOrder.toLocaleString('vi-VN')} đ để áp dụng mã này.`
      });
    }
    return res.json({
      success: true,
      data: {
        code,
        name: promo.name,
        discount: promo.discount,
        finalAmount: Math.max(0, orderAmount - promo.discount)
      }
    });
  }

  return res.status(404).json({ success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' });
});

router.post('/admin/movies', ...admin, createMovie);
router.patch('/admin/movies/:id', ...admin, updateMovie);
router.delete('/admin/movies/:id', ...admin, deleteMovie);

router.post('/admin/theaters', ...admin, createTheater);
router.patch('/admin/theaters/:id', ...admin, updateTheater);
router.delete('/admin/theaters/:id', ...admin, deleteTheater);

router.get('/admin/auditoriums', ...admin, listAuditoriums);
router.post('/admin/auditoriums', ...admin, createAuditorium);
router.patch('/admin/auditoriums/:id', ...admin, updateAuditorium);
router.delete('/admin/auditoriums/:id', ...admin, deleteAuditorium);

router.get('/admin/auditoriums/:auditoriumId/seats', ...admin, listSeats);
router.post('/admin/auditoriums/:auditoriumId/seats', ...admin, createSeats);
router.patch('/admin/auditoriums/:auditoriumId/seats/:id', ...admin, updateSeat);

router.post('/admin/showtimes', ...admin, createShowtime);
router.patch('/admin/showtimes/:id', ...admin, updateShowtime);
router.delete('/admin/showtimes/:id', ...admin, deleteShowtime);

export default router;

