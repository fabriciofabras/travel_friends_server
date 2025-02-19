import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

import dotenv from "dotenv";


import { MercadoPagoConfig, Payment } from 'mercadopago';

const MONGO_URI="mongodb+srv://fabriciofabras:FHern4nd3z.@travelcluster.am1gl.mongodb.net/?retryWrites=true&w=majority&appName=TravelCluster"

// Función para conectar a la base de datos
async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("Conectado a MongoDB");
  return client.db("Travelfriends").collection("Reservations");
}




// const client = new MercadoPagoConfig({ accessToken: 'TEST-1634057283524851-012810-0bcf5b2ef2f2146d7a891106920a3a37-353348367', options: { timeout: 5000 } });
const client = new MercadoPagoConfig({ accessToken: 'APP_USR-1634057283524851-012810-4581f90affdc1c47afc13aebc8c0d323-353348367', options: { timeout: 5000 } });

const payment = new Payment(client);

const app = express();

app.use(cors({
  origin: "*",
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type"],
}));

app.options('*', cors()); // Maneja preflight para cualquier endpoint

// Configurar middleware y rutas
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Ruta GET para obtener todas las reservas
app.get("/api/reservations", async (req, res) => {
  try {
    const collection = await connectDB();
    const reservations = await collection.find().toArray();
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las reservas" });
  }
});

app.post("/api/reservation", async (req, res) => {
  try {
    const collection = await connectDB();
    const newReservation = req.body; // Los datos vienen desde el frontend
    const result = await collection.insertOne(newReservation);
    res.status(201).json({ message: "Reservación creada", id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: "Error al crear la reservación" });
  }
});

app.post('/process_payment', async (req, res) => {
 /*  res.setHeader('Access-Control-Allow-Origin', "https://travel-friends-mu.vercel.app");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', false);
  console.log("req", req.body); */
  console.log('req')
  console.log(req)

  console.log('req.body')
  console.log(req.body)


  console.log('request')
  const request = req.body;
  console.log(request)

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

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});