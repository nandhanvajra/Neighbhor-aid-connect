const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { handleResidentAssistantQuery } = require('../services/assistantService');

router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body || {};
    const result = await handleResidentAssistantQuery(message);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Assistant route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
});

module.exports = router;
