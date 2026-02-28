import { Router } from 'express';
import { userProfileService } from '../ml/services/user-profile.js';
import { behavioralAnalysisService } from '../ml/services/behavioral-analysis.js';
import { adaptiveResponseService } from '../ml/services/adaptive-response.js';
import { contextualMemoryService } from '../ml/services/contextual-memory.js';

const router = Router();

// Get user profile
router.get('/profile/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId || 'default';
    const profile = userProfileService.getProfile(userId);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId || 'default';
    await userProfileService.updateProfile(userId, req.body);
    const profile = userProfileService.getProfile(userId);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get behavioral insights
router.get('/behavior/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId || 'default';
    const insights = await behavioralAnalysisService.getPersonalizationInsights(userId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get memory summary
router.get('/memory/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId || 'default';
    const memorySummary = await contextualMemoryService.getMemorySummary(userId);
    res.json(memorySummary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get personalization report
router.get('/report/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId || 'default';
    const report = await adaptiveResponseService.getPersonalizationReport(userId);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get response suggestions
router.post('/suggestions/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId || 'default';
    const { query } = req.body;
    const suggestions = await adaptiveResponseService.getResponseSuggestions(userId, query);
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update response effectiveness feedback
router.post('/feedback/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId || 'default';
    const { response, feedback } = req.body;
    const effectiveness = await adaptiveResponseService.updateResponseEffectiveness(userId, response, feedback);
    res.json(effectiveness);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset user profile (for testing)
router.delete('/reset/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId || 'default';
    userProfileService.profiles.delete(userId);
    res.json({ message: `Profile for ${userId} has been reset` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;