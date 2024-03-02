// SERVICE 2
const { trace, context, propagation } = require("@opentelemetry/api")
const express = require("express");
const sdk = require("./tracing");
const mongoose = require('mongoose');
const FeedRepo = require("./repo/feed.repo")


// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hackathon', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const redis = require('redis');
const { channel } = require("diagnostics_channel");

const redisClient = redis.createClient({
    host: 'localhost', // Replace with your Redis server host
    port: 6379, // Replace with your Redis server port (default: 6379)
});

const Cache = {
    connected: false,
    async connect() {
        try {
            if (this.connected) return
            await redisClient.connect()
            this.connected = true
        } catch (e) {
            console.log(e)
        }

    },
    async get(key) {
        console.log({ 'connected': this.connected })
        await this.connect()
        return redisClient.get(key)
    },

    async set(key, val, ttl = false) {
        await this.connect()
        if (ttl) {
            await redisClient.set(key, val)
            await redisClient.expire(key, 10)

        } else {
            await redisClient.set(key, val)
        }
    }
}

const PORT = 4003
const app = express();
app.use(express.json());

app.get('/', (req, res) => {

    return res.status(200).json({
        message: 'service 2 up'
    })
});



app.post('/get-feed', async (req, res) => {
    const {
        traceparent,
        tracestate
    } = req.headers
    console.log({
        traceparent,
        tracestate
    })
    const input = { traceparent, tracestate }
    let activeContext = propagation.extract(context.active(), input);
    const tracer = trace.getTracer("service-2");

    const getFeedSpan = tracer.startSpan("/get-feed", undefined, activeContext);

    const {
        user,
        pref
    } = req.body;
    if (!user) {
        // sth
    }
    const redisSpan = tracer.startSpan("redis-span", undefined, trace.setSpan(context.active(), getFeedSpan))
    const cacheKey = `${user}-feed`;
    const cacheData = await Cache.get(cacheKey);
    redisSpan.setAttribute("user", user),
        redisSpan.setAttribute("cacheKey", cacheKey),
        redisSpan.setAttribute("cacheData", "data"),
        redisSpan.end()
    if (cacheData) {
        return res.status(200).json({
            feed: JSON.parse(cacheData)
        });
    }

    const mongoSpan = tracer.startSpan("mongo-span", undefined, trace.setSpan(context.active(), getFeedSpan))

    const feed = await FeedRepo.getFeed();

    mongoSpan.end()

    await Cache.set(cacheKey, JSON.stringify(feed), true);

    getFeedSpan.end()

    return res.status(200).json({
        feed
    });
    // try to get from cache if not in cache get from db 
})







app.listen(PORT, () => {

    console.log(` --- service 2 started on port ${PORT} --- `)
})


const setUserPref = async (msg) => {

    const data = JSON.parse(msg.content.toString())

    console.log({data})

    const {
        prefs ,
        user ,
        headers 
    } = data ;

    // const input = { traceparent, tracestate }
    let activeContext = propagation.extract(context.active(), headers);
    const tracer = trace.getTracer("service-2");

    const rabbitMQConsumerSpan = tracer.startSpan("/rabbitmq-consumer-span", undefined, activeContext);
    rabbitMQConsumerSpan.setAttribute("user",user);
    rabbitMQConsumerSpan.setAttribute("prefs",JSON.stringify(prefs));
    rabbitMQConsumerSpan.setAttribute("user",JSON.stringify(user));
    rabbitMQConsumerSpan.end()

    // activeContext.end()

}

const amqp = require('amqplib');

const AmpqUrl = 'amqp://localhost:5672';

const consumeRabbitMQData = async () => {
    try {
        console.log(` -- starting rabbitm1 consumer -- `) ;
        const connection = await amqp.connect(AmpqUrl);
        const channel = await connection.createChannel();
        const queueName = 'my_queue';
        // (2) Receiving a message:
        await channel.consume(queueName, (msg) => {
            console.log(`Received message: ${msg.content.toString()}`);
            console.log(msg.content.toString())
            setUserPref(msg)
            channel.ack(msg); // Acknowledge the message
        });

    } catch (e) {
        console.log(e)
    }
}

consumeRabbitMQData().then(res =>{

}).catch(e => {
    console.log(` --- can not consume rabbimq data -- `)
})

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