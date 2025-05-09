import express from "express";
import axios from "axios";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import mercadopago from 'mercadopago';

import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: 'TEST-1634057283524851-012810-0bcf5b2ef2f2146d7a891106920a3a37-353348367', options: { timeout: 5000 } });

const payment = new Payment(client);

const app = express();


// Definir __dirname manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Configurar middleware y rutas
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));
app.use(cors());


app.post('/process_payment', async (req, res) => {
  console.log("req", req.body);

  const request = req.body;

  try {
    const paymentResponse = await payment.create({
      body: {
        transaction_amount: request.transaction_amount,
        token: request.token,
        description: request.description,
        installments: 1,
        payment_method_id: request.payment_method_id,
        issuer_id: request.issuer_id,
        payer: {
          email: request.payer.email,
          identification: {
            number: '12345678909',
            type: 'CPF',
          },
        },
      },
    });

    console.log("Respuesta de Mercado Pago:", paymentResponse);
    
    // Enviar la respuesta al frontend
    res.status(200).json({
      message: "Pago procesado con éxito",
      payment: paymentResponse // Asegúrate de enviar solo los datos necesarios
    });

  } catch (error) {
    console.error("Error en el pago:", error);
    res.status(500).json({ message: "Error al procesar el pago", error: error.message });
  }
});

const port = 3000;

const TRIPADVISOR_API_KEY = '519AAFC09925436194F4B5798A71F9A2';

app.get('/api/hotels', async (req, res) => {
  const query = req.query.q;

  try {
    const response = await axios.get(
      `https://api.content.tripadvisor.com/api/v1/location/search?key=${TRIPADVISOR_API_KEY}&searchQuery=${encodeURIComponent(query)}&category=hotels`,
      {
        headers: {
          accept: 'application/json',
          origin: 'https://travel-friends-mu.vercel.app/',   // opcional si tu API key lo requiere
          referer: 'https://travel-friends-mu.vercel.app/'   // opcional si tu API key lo requiere
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener datos de TripAdvisor:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al consultar TripAdvisor' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});