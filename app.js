// app.js
const express = require('express');
const QRCode = require('qrcode');
const axios = require('axios');
const schedule = require('node-schedule');

const app = express();
const port = 3000;

app.use(express.json());

let sessions = {};

app.post('/start-session', (req, res) => {
  const { sessionName } = req.body;
  if (!sessionName) {
    return res.status(400).send('Session name is required.');
  }

  sessions[sessionName] = { qrCode: '', interval: null };

  const generateQRCode = () => {
    QRCode.toDataURL(sessionName)
      .then(url => {
        sessions[sessionName].qrCode = url;
      })
      .catch(err => {
        console.error(err);
      });
  };

  generateQRCode();
  sessions[sessionName].interval = schedule.scheduleJob('*/30 * * * * *', generateQRCode);

  res.send(`Session '${sessionName}' started.`);
});

app.delete('/end-session/:sessionName', (req, res) => {
  const { sessionName } = req.params;
  if (sessions[sessionName]) {
    sessions[sessionName].interval.cancel();
    delete sessions[sessionName];
    return res.send(`Session '${sessionName}' ended.`);
  } else {
    return res.status(404).send('Session not found.');
  }
});

app.get('/qr-code/:sessionName', (req, res) => {
  const { sessionName } = req.params;
  if (sessions[sessionName]) {
    return res.json({ qrCode: sessions[sessionName].qrCode });
  } else {
    return res.status(404).send('Session not found.');
  }
});

// Endpoint para obter a imagem do QR Code
app.post('/qr-code-image/:sessionName', (req, res) => {
  const { sessionName } = req.params;
  if (sessions[sessionName] && sessions[sessionName].qrCode) {
    return res.redirect(sessions[sessionName].qrCode); // Redireciona para a imagem do QR Code
  } else {
    return res.status(404).send('Session not found or QR code not generated.');
  }
});

app.post('/send-message', async (req, res) => {
  const { phoneNumber, message } = req.body;
  if (!phoneNumber || !message) {
    return res.status(400).send('Phone number and message are required.');
  }

  try {
    // Altere a URL e o método de acordo com a API do WhatsApp que você está usando
    const response = await axios.post('https://api.whatsapp.com/send', {
      phone: phoneNumber,
      text: message,
    });

    return res.json(response.data);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error sending message.');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});