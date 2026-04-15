# WhatsApp Bots Desacoplados del Backend (MVP)

Este documento define un MVP para separar la ejecucion de bots de WhatsApp del backend API y evitar desconexiones masivas durante deploys del backend.

## 1. Objetivo

- Mantener el contrato que hoy consume el frontend (`/config/whatsapp` y variantes).
- Mover la sesion de WhatsApp a un proceso dedicado (`wa-orchestrator`).
- Permitir deploys/restarts de API sin tumbar sesiones de WhatsApp.

## 2. Arquitectura minima

Componentes:

- `api-backend`: expone endpoints HTTP al frontend, persiste configuracion, publica comandos.
- `wa-orchestrator`: consume comandos, maneja sesiones WhatsApp, publica estado.
- `postgres`: source of truth de configuracion/estado y auditoria de comandos.
- `redis`: Streams para mensajeria y locks distribuidos por empresa.

Canales Redis Streams:

- `wa.commands.v1`: comandos desde API hacia orchestrator.
- `wa.events.v1`: eventos de estado desde orchestrator hacia API (opcional para iniciar, recomendado).

## 3. Esquema SQL recomendado

```sql
-- Estado actual de la conexion WhatsApp por empresa
create table if not exists whatsapp_connections (
  id uuid primary key,
  company_id uuid not null unique,
  enabled boolean not null default false,
  status text not null default 'disabled',
  -- disabled|initializing|qr_pending|ready|logged_out|error|locked_elsewhere
  session_version integer not null default 0,
  current_qr text,
  last_error text,
  cancellation_group_enabled boolean not null default false,
  cancellation_group_id text,
  cancellation_group_name text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_connections_status
  on whatsapp_connections(status);
```

```sql
-- Comandos auditables e idempotentes
create table if not exists whatsapp_commands (
  id uuid primary key, -- commandId
  company_id uuid not null,
  type text not null, -- enable|disable|close_session|refresh_qr|update_group_settings
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued', -- queued|processing|done|failed
  idempotency_key text not null unique,
  correlation_id text not null,
  requested_by uuid,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_commands_company_created
  on whatsapp_commands(company_id, created_at desc);
```

## 4. Contratos HTTP (compatibles con frontend actual)

### GET `/config/whatsapp`

```json
{
  "data": {
    "enabled": true,
    "status": "qr_pending",
    "qr": "2@asdf...",
    "updatedAt": "2026-04-15T12:00:00.000Z",
    "cancellationGroupEnabled": false,
    "cancellationGroupId": "",
    "cancellationGroupName": ""
  }
}
```

### PUT/PATCH `/config/whatsapp`

Request:

```json
{
  "enabled": true,
  "closeAll": false,
  "cancellationGroupEnabled": true,
  "cancellationGroupId": "1203...@g.us",
  "cancellationGroupName": "Turnos"
}
```

Response (asyncrono, aceptado):

```json
{
  "ok": true,
  "commandId": "f1e2d3c4-a111-4f55-9a7c-123456789abc",
  "status": "accepted"
}
```

### GET `/config/whatsapp/groups`

```json
{
  "data": [
    { "id": "1203...@g.us", "name": "Turnos" }
  ]
}
```

## 5. Eventos de mensajeria

### Evento comando (`wa.commands.v1`)

```json
{
  "eventVersion": 1,
  "commandId": "uuid",
  "correlationId": "uuid",
  "companyId": "uuid",
  "type": "enable",
  "payload": {},
  "requestedAt": "2026-04-15T12:00:00.000Z"
}
```

### Evento estado (`wa.events.v1`)

```json
{
  "eventVersion": 1,
  "companyId": "uuid",
  "status": "ready",
  "qr": null,
  "error": null,
  "updatedAt": "2026-04-15T12:00:05.000Z"
}
```

## 6. Esqueleto TypeScript (API backend)

### 6.1 Tipos base

```ts
// src/whatsapp/domain/types.ts
export type WhatsappStatus =
  | "disabled"
  | "initializing"
  | "qr_pending"
  | "ready"
  | "logged_out"
  | "error"
  | "locked_elsewhere";

export type WhatsappCommandType =
  | "enable"
  | "disable"
  | "close_session"
  | "refresh_qr"
  | "update_group_settings";

export type WhatsappCommandPayload = Record<string, unknown>;
```

### 6.2 Gateway de comandos

```ts
// src/whatsapp/application/whatsapp-gateway.ts
import { randomUUID } from "node:crypto";
import { WhatsappCommandType, WhatsappCommandPayload } from "../domain/types";

export interface PublishWhatsappCommandInput {
  companyId: string;
  type: WhatsappCommandType;
  payload: WhatsappCommandPayload;
  requestedBy?: string;
  correlationId?: string;
}

export interface PublishWhatsappCommandOutput {
  commandId: string;
  correlationId: string;
}

export interface WhatsappCommandRepository {
  createIfNotExists(input: {
    commandId: string;
    companyId: string;
    type: WhatsappCommandType;
    payload: WhatsappCommandPayload;
    idempotencyKey: string;
    correlationId: string;
    requestedBy?: string;
  }): Promise<{ inserted: boolean; commandId: string; correlationId: string }>;
}

export interface WhatsappCommandPublisher {
  publish(command: {
    commandId: string;
    correlationId: string;
    companyId: string;
    type: WhatsappCommandType;
    payload: WhatsappCommandPayload;
    requestedAt: string;
  }): Promise<void>;
}

export class WhatsappGateway {
  constructor(
    private readonly repo: WhatsappCommandRepository,
    private readonly publisher: WhatsappCommandPublisher,
  ) {}

  async enqueue(input: PublishWhatsappCommandInput): Promise<PublishWhatsappCommandOutput> {
    const commandId = randomUUID();
    const correlationId = input.correlationId ?? randomUUID();
    const idempotencyKey = `${input.companyId}:${input.type}:${JSON.stringify(input.payload)}`;

    const result = await this.repo.createIfNotExists({
      commandId,
      companyId: input.companyId,
      type: input.type,
      payload: input.payload,
      idempotencyKey,
      correlationId,
      requestedBy: input.requestedBy,
    });

    if (result.inserted) {
      await this.publisher.publish({
        commandId: result.commandId,
        correlationId,
        companyId: input.companyId,
        type: input.type,
        payload: input.payload,
        requestedAt: new Date().toISOString(),
      });
    }

    return { commandId: result.commandId, correlationId };
  }
}
```

### 6.3 Publisher Redis Streams

```ts
// src/whatsapp/infrastructure/redis-streams-command-publisher.ts
import { createClient, RedisClientType } from "redis";

const STREAM_KEY = "wa.commands.v1";

export class RedisStreamsCommandPublisher {
  constructor(private readonly redis: RedisClientType) {}

  async publish(event: {
    commandId: string;
    correlationId: string;
    companyId: string;
    type: string;
    payload: Record<string, unknown>;
    requestedAt: string;
  }): Promise<void> {
    await this.redis.xAdd(STREAM_KEY, "*", {
      eventVersion: "1",
      commandId: event.commandId,
      correlationId: event.correlationId,
      companyId: event.companyId,
      type: event.type,
      payload: JSON.stringify(event.payload),
      requestedAt: event.requestedAt,
    });
  }
}

export async function buildRedisClient(url: string): Promise<RedisClientType> {
  const client = createClient({ url });
  await client.connect();
  return client;
}
```

### 6.4 Controller HTTP (Express)

```ts
// src/whatsapp/interfaces/http/whatsapp-config.controller.ts
import { Request, Response } from "express";
import { WhatsappGateway } from "../../application/whatsapp-gateway";

export class WhatsappConfigController {
  constructor(private readonly gateway: WhatsappGateway) {}

  update = async (req: Request, res: Response): Promise<void> => {
    const companyId = req.user.companyId;
    const requestedBy = req.user.id;
    const body = req.body ?? {};

    const commandType =
      body.closeAll === true
        ? "close_session"
        : body.enabled === true
        ? "enable"
        : body.enabled === false
        ? "disable"
        : "update_group_settings";

    const { commandId } = await this.gateway.enqueue({
      companyId,
      requestedBy,
      type: commandType,
      payload: body,
      correlationId: req.headers["x-correlation-id"] as string | undefined,
    });

    res.status(202).json({ ok: true, commandId, status: "accepted" });
  };
}
```

## 7. Esqueleto TypeScript (wa-orchestrator)

### 7.1 Consumer Redis Streams con lock por empresa

```ts
// src/consumer/wa-commands-consumer.ts
import { createClient, RedisClientType } from "redis";

const STREAM_KEY = "wa.commands.v1";
const GROUP_NAME = "wa-orchestrator";
const CONSUMER_NAME = process.env.HOSTNAME ?? "wa-worker-1";

interface ParsedCommand {
  streamId: string;
  commandId: string;
  correlationId: string;
  companyId: string;
  type: string;
  payload: Record<string, unknown>;
}

export interface CommandHandler {
  handle(command: ParsedCommand): Promise<void>;
}

export class WaCommandsConsumer {
  constructor(
    private readonly redis: RedisClientType,
    private readonly handler: CommandHandler,
  ) {}

  async start(): Promise<void> {
    await this.ensureGroup();

    while (true) {
      const entries = await this.redis.xReadGroup(
        GROUP_NAME,
        CONSUMER_NAME,
        [{ key: STREAM_KEY, id: ">" }],
        { COUNT: 10, BLOCK: 5000 },
      );

      if (!entries) continue;

      for (const stream of entries) {
        for (const message of stream.messages) {
          const parsed = this.parse(message.id, message.message as Record<string, string>);
          const lockKey = `wa:lock:${parsed.companyId}`;

          const acquired = await this.redis.set(lockKey, CONSUMER_NAME, {
            NX: true,
            PX: 30_000,
          });

          if (!acquired) {
            // otro worker esta procesando esta empresa; reintentara luego
            continue;
          }

          try {
            await this.handler.handle(parsed);
            await this.redis.xAck(STREAM_KEY, GROUP_NAME, parsed.streamId);
          } catch (error) {
            // se deja pendiente para retry/manual DLQ segun politica
            console.error("wa command failed", {
              commandId: parsed.commandId,
              companyId: parsed.companyId,
              error,
            });
          } finally {
            await this.redis.del(lockKey);
          }
        }
      }
    }
  }

  private async ensureGroup(): Promise<void> {
    try {
      await this.redis.xGroupCreate(STREAM_KEY, GROUP_NAME, "0", {
        MKSTREAM: true,
      });
    } catch (error: unknown) {
      const message = String((error as Error)?.message ?? "");
      if (!message.includes("BUSYGROUP")) throw error;
    }
  }

  private parse(streamId: string, data: Record<string, string>): ParsedCommand {
    return {
      streamId,
      commandId: data.commandId,
      correlationId: data.correlationId,
      companyId: data.companyId,
      type: data.type,
      payload: JSON.parse(data.payload ?? "{}"),
    };
  }
}

async function main() {
  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();

  const handler: CommandHandler = {
    async handle(command) {
      // TODO: conectar con SDK/proveedor WhatsApp real
      // TODO: persistir estado en postgres
      console.log("processing command", command);
    },
  };

  const consumer = new WaCommandsConsumer(redis, handler);
  await consumer.start();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

## 8. Politicas operativas minimas

- Idempotencia: `idempotency_key` unico por comando funcional.
- Locks por empresa: una sesion por `companyId` al mismo tiempo.
- Reintentos: maximo 3 y luego DLQ o estado `failed` manual.
- Correlation ID: propagar desde HTTP hasta logs del worker.
- Healthchecks:
  - API: `/health` y conectividad DB/Redis.
  - Orchestrator: heartbeat y lag de stream.

## 9. Plan de rollout sin downtime

1. Introducir `WhatsappGateway` en API sin cambiar contrato HTTP.
2. Publicar comandos ademas de logica actual (shadow mode).
3. Levantar `wa-orchestrator` y validar solo en empresas piloto.
4. Activar flag por empresa (`WHATSAPP_REMOTE_ENABLED=true`).
5. Cortar logica embebida del backend cuando la tasa de error sea estable.

## 10. Variables de entorno sugeridas

API:

```env
WHATSAPP_REMOTE_ENABLED=true
REDIS_URL=redis://localhost:6379
WA_COMMAND_STREAM=wa.commands.v1
```

Orchestrator:

```env
REDIS_URL=redis://localhost:6379
WA_COMMAND_STREAM=wa.commands.v1
WA_EVENT_STREAM=wa.events.v1
WA_LOCK_TTL_MS=30000
```

---

Si queres, el siguiente paso es convertir este esqueleto en una plantilla concreta para tu stack real de backend (NestJS o Express), con archivos finales y wiring de dependencias listo para correr.
