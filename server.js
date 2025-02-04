import express from "express";
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
app.use(cors({
  origin: "https://travel-friends-mu.vercel.app", // Permitir solo este dominio
  methods: "GET, POST, PUT, DELETE",
  allowedHeaders: "Content-Type",
  credentials: true // Si usas cookies o autenticación con credenciales
}));

app.options("/process_payment", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "https://travel-friends-mu.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204); // Sin contenido, pero permite continuar
});

app.post('/process_payment', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', "https://travel-friends-mu.vercel.app");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});