// src/controllers/gadController.js
const GadResult = require('../models/GadResult');

exports.storeGadResult = async (req, res) => {
  try {
    const userId = req.user.id;                    // viene de validateToken :contentReference[oaicite:1]{index=1}
    const { score, responses } = req.body;         // body = { score: número, responses: [0,1,2,...] }
    await GadResult.create({ userId, score, responses });
    res.status(201).json({ message: 'Resultado GAD guardado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error guardando resultado' });
  }
};
