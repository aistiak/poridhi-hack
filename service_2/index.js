// SERVICE 2
const {trace , context} = require("@opentelemetry/api")
const express = require("express") ;
const sdk = require("./tracing");

const redis = require('redis');

const redisClient = redis.createClient({
  host: 'localhost', // Replace with your Redis server host
  port: 6379, // Replace with your Redis server port (default: 6379)
});

const Cache = {
    connected : false  ,
    async connect() {
        try {
            if(this.connected) return  
            await redisClient.connect()
            this.connected = true  
        }catch(e){
            console.log(e)
        }
        
    } ,
    async get(key){
        console.log({ 'connected' : this.connected})
        await this.connect()
        return redisClient.get(key)
    },

    async set(key,val,ttl=false) {
        await this.connect()
        if(ttl){
            await redisClient.set(key,val)
            await redisClient.expire(key,10)

        }else {
            await redisClient.set(key,val)
        }
    }
}

const PORT = 4003
const app = express() ;
app.use(express.json()) ;

app.get('/',(req,res)=>{

    return res.status(200).json({
        message : 'service 2 up'
    })
});

app.post('/get-feed',async (req,res)=>{
    const tracer = trace.getTracer("service-2");
    const getFeedSpan = tracer.startSpan("/get-feed");
    const {
        user ,
        pref 
    } = req.body ;
    if(!user){
        // sth
    }
    const redisSpan = tracer.startSpan("redis-span",undefined,trace.setSpan(context.active(),getFeedSpan))
    const cacheKey = `${user}-feed` ;
    const cacheData = await Cache.get(cacheKey) ;
    redisSpan.setAttribute("user",user) ,
    redisSpan.setAttribute("cacheKey",cacheKey) ,
    redisSpan.setAttribute("cacheData","data") ,
    redisSpan.end()
    if(cacheData){
        return res.status(200).json({
            feed : JSON.parse(cacheData)
         }) ;
    }

    const feed = [
        { type : 'food' , text : 'i love food'},
        { type : 'sports' , text : 'Bangladesh won the match'},
    ]
    await Cache.set(cacheKey,JSON.stringify(feed),true) ;

    getFeedSpan.end()

    return res.status(200).json({
       feed
    }) ;
    // try to get from cache if not in cache get from db 
})


app.listen(PORT,() => {

    console.log(` --- service 2 started on port ${PORT} --- `)
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