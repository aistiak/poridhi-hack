const Feed = require("./feed.mongoose")
const { trace , context } = require("@opentelemetry/api")




const FeedRepo = {

    async createAccount(payload,parentSpan) {
        const tracer = trace.getTracer("bank");
        const mongoSpan = tracer.startSpan("/mongo-insert", undefined, trace.setSpan(context.active(), parentSpan));

        const account = new Account(payload)
        await account.save() ;
        mongoSpan.end()
        return account ;
    },

    async getBalance(accountId,parentSpan) {
        const tracer = trace.getTracer("bank");
        const mongoSpan = tracer.startSpan("/mongo-fetch-account", undefined, trace.setSpan(context.active(), parentSpan));
        const account = await Account.findOne({'accountId' : accountId}).lean()
        console.log({account})
        mongoSpan.end()
        return {
            success : !!account ,
            balance : account?.balance || 0 
        }
    },

    async getFeed(){

        const feed =  await Feed.find({})

        return feed 
    }
}



module.exports = FeedRepo