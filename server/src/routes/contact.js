const express = require('express');
const ContactMessage = require('../models/ContactMessage');
const auth = require('../middleware/auth');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (name.length > 100 || email.length > 254 || subject.length > 150 || message.length > 2000) {
      return res.status(400).json({ message: 'Contact message exceeds the allowed length.' });
    }

    const contactMessage = await ContactMessage.create({
      name,
      email,
      subject,
      message,
    });

    return res.status(201).json({ message: 'Message sent successfully.', id: contactMessage._id });
  } catch {
    return res.status(500).json({ message: 'Unable to send contact message.' });
  }
});

router.get('/', auth(['admin']), async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    return res.json(messages);
  } catch {
    return res.status(500).json({ message: 'Unable to load contact messages.' });
  }
});

router.patch('/:id/read', auth(['admin']), async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { $set: { read: true, readAt: new Date() } },
      { new: true },
    );
    if (!message) {
      return res.status(404).json({ message: 'Contact message not found.' });
    }

    return res.json(message);
  } catch {
    return res.status(500).json({ message: 'Unable to update contact message.' });
  }
});

module.exports = router;
