
const {NodeSDK} = require("@opentelemetry/sdk-node");
const {Resource} = require("@opentelemetry/resources");
const {SemanticResourceAttributes} = require("@opentelemetry/semantic-conventions")
const {getNodeAutoInstrumentations} = require("@opentelemetry/auto-instrumentations-node");
const {JaegerExporter} = require("@opentelemetry/exporter-jaeger");
const { MeterProvider } = require('@opentelemetry/metrics');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const traceExporter = new JaegerExporter({
    // Jaeger agent UDP Thrift endpoint
    endpoint: "http://localhost:14268/api/traces",
    serviceName: "service-1", // Replace with your service name
  });

const metricsExporter = new PrometheusExporter();
// Create a MeterProvider for metrics
const meterProvider = new MeterProvider({
    exporter: metricsExporter, // You can use a different exporter here if needed
});
  
const sdk = new NodeSDK({
    traceExporter ,
    instrumentations : [
        // getNodeAutoInstrumentations()j
    ] ,
    resource : new Resource({
        [SemanticResourceAttributes.SERVICE_NAME] : 'service-1'
    }),
    meterProvider : meterProvider
})


try {
    sdk.start() 
    console.log('Tracing initialized')
}catch(e){
    console.log('Error initializing tracing',e)
}

module.exports = {
    meterProvider 
}