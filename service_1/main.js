const express = require('express');
const bodyParser = require('body-parser');
const { trace, context, propagation } = require("@opentelemetry/api");
const sdk = require("./tracing");
const axios = require("axios");
const app = express();

const amqp = require('amqplib');

const AmpqUrl = 'amqp://localhost:5672';

const RabbitMQ = {
    connected: false,
    queueName: 'my_queue',
    channel: null,
    async connect() {
        if (!this.channel) {
            const connection = await amqp.connect(AmpqUrl);
            this.channel = await connection.createChannel();
        }
    },

    async sendData(data) {
        // (1) Sending a message:
        await this.connect()
        await this.channel.assertQueue(this.queueName, { durable: false });
        await this.channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(data)));
        console.log(`Sent message: ${data}`);
    }
}



const PORT = 4001;

app.use(bodyParser.json());

// Middleware for checking authentication
const authenticate = (req, res, next) => {
  const authHeader = req.headers.auth;
  console.log({ authHeader })
  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ error: 'Unauthorized - Missing or invalid auth header' });
  }
  req.user = authHeader
  // You can add more sophisticated authentication logic here if needed

  next(); // Continue to the next middleware/route
};

app.get("/", authenticate, (req, res) => {
  return res.sendStatus(200);
})
// Route for handling JSON data at /feed
app.get('/feed', authenticate, async (req, res) => {
  try {
    const tracer = trace.getTracer("service-1");
    const getFeedSpan = tracer.startSpan("/feed");


    let output = {}
    const tokenSpanContext = trace.setSpan(context.active(), getFeedSpan);
    propagation.inject(tokenSpanContext, output);
    const { traceparent, tracestate } = output;
    console.log({ output, traceparent, tracestate })

    const feedData = await axios({
      method: 'POST',
      url: 'http://localhost:4003/get-feed',
      headers: {
        traceparent,
        tracestate
      }
    })

    const feed = feedData.data

    getFeedSpan.end();
    res.json(feed);
  } catch (e) {
    console.log(e)
    return res.sendStatus(500)
  }

});


app.post('/set-prefs',authenticate,async (req,res)=>{
    const body = req.body ;
    const {prefs} = body ;
    console.log({prefs})
    const tracer = trace.getTracer("service-1");
    const setPrefsSpan = tracer.startSpan("/set-prefs");


    let output = {}
    const tokenSpanContext = trace.setSpan(context.active(), setPrefsSpan);
    propagation.inject(tokenSpanContext, output);
    const { traceparent, tracestate } = output;
    console.log({ output, traceparent, tracestate })

    const user = req.user ;
    const data = {
      prefs ,
      user ,
      headers : {
        traceparent,
        tracestate
      }
    }
    await RabbitMQ.sendData(data)

    setPrefsSpan.end()

    return res.status(200).json({
      message : 'setting user preference'
    })
});

// Protected route with authentication at /post
app.post('/auth', authenticate, (req, res) => {
  res.json({ message: 'Authenticated - You can access this route with a valid auth header' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


const gracefulShutdown = () => {
  server.close(() => {
    console.log("Server stopped");
    sdk
      .shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch((error) => console.error("Error shutting down tracing", error))
      .finally(() => process.exit(0));
  });
};

// Listen for termination signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);