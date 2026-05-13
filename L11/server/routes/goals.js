import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../services/sheets.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/goals/my
 * Get current student's course goal
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const goal = await db.findOne('course_goals', g => g.student_id === req.user.student_id);
    res.json(goal || { has_goal: false });
  } catch (err) {
    console.error('Get goal error:', err);
    res.status(500).json({ error: 'Lỗi lấy dữ liệu mục tiêu' });
  }
});

/**
 * POST /api/goals
 * Save or update goal statement
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { goal_statement } = req.body;
    if (!goal_statement || goal_statement.trim().length < 10) {
      return res.status(400).json({ error: 'Mục tiêu cần chi tiết một chút (ít nhất 10 ký tự).' });
    }

    const existing = await db.findOne('course_goals', g => g.student_id === req.user.student_id);
    const now = new Date().toISOString();

    if (existing) {
      await db.update('course_goals', g => g.id === existing.id, {
        goal_statement: goal_statement.trim(),
        updated_at: now
      });
      res.json({ message: 'Đã cập nhật mục tiêu học tập!' });
    } else {
      const newGoal = {
        id: uuidv4(),
        session_id: 1, // Default to start
        student_id: req.user.student_id,
        student_name: req.user.full_name,
        goal_statement: goal_statement.trim(),
        achievement_percent: 0,
        created_at: now,
        updated_at: now
      };
      await db.append('course_goals', newGoal);
      res.json({ message: 'Đã ghi nhận mục tiêu học tập của bạn. Chúc bạn thành công!' });
    }
  } catch (err) {
    console.error('Save goal error:', err);
    res.status(500).json({ error: 'Lỗi lưu mục tiêu' });
  }
});

/**
 * POST /api/goals/assess
 * Self-assessment of achievement percentage
 */
router.post('/assess', authenticate, async (req, res) => {
  try {
    const { percent } = req.body;
    const achievement = parseInt(percent);
    
    if (isNaN(achievement) || achievement < 0 || achievement > 100) {
      return res.status(400).json({ error: 'Tỷ lệ phần trăm không hợp lệ.' });
    }

    const existing = await db.findOne('course_goals', g => g.student_id === req.user.student_id);
    if (!existing) {
      return res.status(404).json({ error: 'Bạn chưa thiết lập mục tiêu ban đầu.' });
    }

    await db.update('course_goals', g => g.id === existing.id, {
      achievement_percent: achievement,
      updated_at: new Date().toISOString()
    });

    res.json({ message: `Ghi nhận bạn đã đạt được ${achievement}% mục tiêu đề ra!` });
  } catch (err) {
    console.error('Assess goal error:', err);
    res.status(500).json({ error: 'Lỗi cập nhật đánh giá' });
  }
});

/**
 * GET /api/goals/admin/all
 * Admin-only: Get all student goals
 */
router.get('/admin/all', authenticate, adminOnly, async (req, res) => {
  try {
    const goals = await db.getAll('course_goals');
    res.json(goals);
  } catch (err) {
    console.error('Get all goals error:', err);
    res.status(500).json({ error: 'Lỗi lấy danh sách mục tiêu' });
  }
});

export default router;
