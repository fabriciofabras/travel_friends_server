import express from "express";
import axios from "axios";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import mercadopago from 'mercadopago';
import { MongoClient } from 'mongodb';

import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: 'TEST-1634057283524851-012810-0bcf5b2ef2f2146d7a891106920a3a37-353348367', options: { timeout: 5000 } });

const payment = new Payment(client);

// Configuración de MongoDB
const MONGODB_URI = 'mongodb+srv://fabriciofabras:fabrasmac4@travelcluster.am1gl.mongodb.net/Travelfriends';
const mongoClient = new MongoClient(MONGODB_URI);

let db;

// Conectar a MongoDB al iniciar
const connectToDatabase = async () => {
  try {
    await mongoClient.connect();
    db = mongoClient.db('Travelfriends');
    console.log('Conectado a MongoDB');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

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

// Servicio addIdea - Guardar idea de viaje en MongoDB
app.post('/api/addIdea', async (req, res) => {
  try {
    const ideaData = req.body;

    // Validar que tenga al menos los campos básicos
    if (!ideaData.quoteName || !ideaData.destination) {
      return res.status(400).json({
        error: 'Los campos quoteName y destination son obligatorios'
      });
    }

    // Agregar timestamp de creación
    ideaData.createdAt = new Date();

    // Insertar en la colección travelIdeas
    const collection = db.collection('travelIdeas');
    const result = await collection.insertOne(ideaData);

    res.status(201).json({
      message: 'Idea de viaje guardada exitosamente',
      ideaId: result.insertedId
    });
  } catch (error) {
    console.error('Error al guardar la idea:', error);
    res.status(500).json({
      error: 'Error al guardar la idea de viaje',
      message: error.message
    });
  }
});

app.get('/api/hotels', async (req, res) => {
  const query = req.query.q;
  console.log('rapid api')
  try {
    const response = await axios.get(
      //  `https://api.content.tripadvisor.com/api/v1/location/search?key=${TRIPADVISOR_API_KEY}&searchQuery=${encodeURIComponent(query)}&category=hotels`,
      `https://agoda-com.p.rapidapi.com/hotels/auto-complete?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'X-Rapidapi-Host': 'agoda-com.p.rapidapi.com',
          'X-Rapidapi-Key': '91cdfbdc02msh6e450e4e8f26025p1737edjsn557a41c143f9',
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

app.get('/api/hotelImages', cors({
  origin: 'https://travelfriends.com.mx',
  credentials: true,
}), async (req, res) => {
  const query = req.query.q;

  try {
    const response = await axios.get(
      `https://agoda-com.p.rapidapi.com/hotels/details?propertyId=${encodeURIComponent(query)}`,
      {
        headers: {
          accept: 'application/json',
          origin: 'https://travel-friends-mu.vercel.app/',
          referer: 'https://travel-friends-mu.vercel.app/',
          'X-Rapidapi-Host': 'agoda-com.p.rapidapi.com',
          'X-Rapidapi-Key': '91cdfbdc02msh6e450e4e8f26025p1737edjsn557a41c143f9',
        },
        timeout: 10000 // 10 segundos
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

// Conectar a MongoDB e iniciar servidor
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
});