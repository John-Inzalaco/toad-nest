/* eslint-disable no-console */
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { Resource } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';

const traceExporter = new OTLPTraceExporter({});
const spanProcessor = new BatchSpanProcessor(traceExporter);

const metricExporter = new OTLPMetricExporter({});

const sdk = new NodeSDK({
  textMapPropagator: new AWSXRayPropagator(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
  }),
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'mam-dashboard-nest',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  traceExporter,
  spanProcessor,
});

sdk.configureTracerProvider(
  { idGenerator: new AWSXRayIdGenerator() },
  spanProcessor,
);

sdk.start();

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(
      () => console.log('SDK shut down successfully'),
      (err) => console.log('Error shutting down SDK', err),
    )
    .finally(() => process.exit(0));
});
