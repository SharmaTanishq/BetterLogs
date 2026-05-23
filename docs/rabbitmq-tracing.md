# RabbitMQ Trace Context Propagation

> **Status:** TODO — stub. Will be filled in during MVP week 1-2, alongside the first end-to-end trace through Wilco's order flow.

This is the hardest known integration problem in the Wilco MVP. Distributed tracing across synchronous HTTP boundaries is well-trodden; tracing across async message brokers is where most observability tools quietly fall apart. The order flow goes through RabbitMQ at `omniapi-tasks`, so we must solve this in MVP, not defer it.

## The problem

A workflow span starts in `ecom-middleware` when an order is created. The order is then enqueued to RabbitMQ. Some time later (milliseconds or minutes), `omniapi-tasks` consumes the message and continues the workflow. The OTel context — `trace_id`, `span_id`, `workflow_id`, `business_keys` — must travel with the message so the consumer side can resume the same workflow.

If we don't solve this, every workflow that crosses RabbitMQ becomes two unrelated traces in storage, and `get_workflow(workflow_id)` returns half the story.

## Planned contents

- How OTel context normally propagates across messaging systems (W3C `traceparent` injection into message headers, the AMQP semantic conventions).
- Which AMQP client library the Wilco stack uses (`amqplib`, `amqp-connection-manager`, or NestJS `@golevelup/nestjs-rabbitmq`), and how to add context propagation in each.
- The producer-side recipe: inject `traceparent`, `tracestate`, and `betterlog.workflow.id` into message headers / properties.
- The consumer-side recipe: extract those headers, create a new span as a child of the propagated context, attach the workflow.
- Handling of fan-out (one message consumed by N consumers) and retry / dead-letter scenarios.
- What to do when the consumer is in a different process / pod with its own OTel exporter.
- Testing strategy: how do we know context propagation actually works end-to-end?

## Decisions to record here as they happen

- Whether to ship a small `@betterlog/rabbitmq` helper package or document the manual injection pattern.
- How to handle messages enqueued before BetterLog was instrumented (graceful degradation: start a fresh workflow with no parent context).
- Schema for the `betterlog.*` message header namespace.
