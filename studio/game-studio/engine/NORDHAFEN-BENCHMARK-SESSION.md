# Nordhafen benchmark session (opt-in)

`nordhafen-benchmark-session.js` combines the **synthetic** Nordhafen workload descriptor, frame-timestamp collector and objective quality-budget evaluator. No automatic scene registration, no renderer mutation, no file/network writes.

Use in an explicitly owned renderer loop:

```js
const session = SDNordhafenBenchmarkSession.create({level:'medium',preset:'desktop60'});
// Called from a real renderer's frame-complete hook:
session.sampleFrame(performance.now());
// Only when these values were independently collected from the real scene:
session.supplyMeasuredMetrics({drawCalls:measuredDrawCalls,memoryMb:measuredMemoryMb,loadSeconds:measuredLoadSeconds});
const result = session.report();
```

`fixture.synthetic` is always true: generated objects are **not rendered automatically**. `frame.measured` means timestamps were supplied; it cannot prove their source. `qualityEvaluated` is false until enough frame timestamps and all three independent measurements are provided. `quality.pass` reflects configured budgets only; it does **not** certify AAA/AAAA. Integrators must verify provenance, actual rendering, browser/WebGL compatibility and device performance. Never feed placeholder numbers to production telemetry.
