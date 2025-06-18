// back/src/controllers/analyticsController.js
const AnalyticsEvent = require('../models/AnalyticsEvent');

exports.storeEvent = async (req, res) => {
  try {
    const { event, chatSessionId, metadata } = req.body;
    await AnalyticsEvent.create({
      userId: req.user.id,
      chatSessionId,
      event,
      metadata
    });
    res.json({ message: 'Evento registrado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error registrando evento' });
  }
};
