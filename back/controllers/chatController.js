// back/src/controllers/chatController.js
const ChatSession = require('../models/ChatSession');

exports.startChat = async (req, res) => {
  try {
    const session = await ChatSession.create({ userId: req.user.id });
    res.json({ chatSessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error iniciando chat' });
  }
};

exports.endChat = async (req, res) => {
  try {
    const { chatSessionId } = req.body;
    await ChatSession.update(
      { endedAt: new Date() },
      { where: { id: chatSessionId } }
    );
    res.json({ message: 'Chat terminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error terminando chat' });
  }
};
