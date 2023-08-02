// TypeScript version of: https://github.com/BunHouth/node-sidekiq/blob/master/src/index.js
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import { createClient } from 'redis';

class Sidekiq {
  private redisConnection: ReturnType<typeof createClient>;
  private namespace: string | null;

  constructor(
    redisConnection: ReturnType<typeof createClient>,
    namespace: string | null = null,
  ) {
    this.redisConnection = redisConnection;
    this.namespace = namespace;
  }

  generateJobId = (): string => {
    try {
      const token = crypto.randomBytes(12);
      return token.toString('hex');
    } catch (error) {
      throw error;
    }
  };

  getQueueName = (queueName: string | undefined): string =>
    queueName || 'default';

  namespaceKey = (key: string): string => {
    if (this.namespace) {
      return `${this.namespace}:${key}`;
    }
    return key;
  };

  getQueueKey = (queueName: string): string => {
    return this.namespaceKey(`queue:${this.getQueueName(queueName)}`);
  };

  enqueue(
    workerClass: string,
    args: any[],
    payload: { [key: string]: any } = {},
    cb: () => void = () => {},
  ) {
    const jid = this.generateJobId();
    const now = new Date().getTime() / 1000;

    payload['class'] = workerClass;
    payload.args = args;
    payload.jid = jid;
    payload.created_at = now;
    payload.enqueued_at = now;

    if (typeof payload.retry === 'undefined') {
      payload.retry = true;
    }

    if (payload.at instanceof Date) {
      payload.enqueued_at = payload.at.getTime() / 1000;
      payload.at = payload.enqueued_at;

      return this.redisConnection.zAdd(this.namespaceKey('schedule'), [
        {
          score: payload.enqueued_at,
          value: JSON.stringify(payload),
        },
      ]);
    } else {
      try {
        return this.redisConnection.lPush(
          this.getQueueKey(payload.queue),
          JSON.stringify(payload),
        );
      } catch (err) {
        return cb();
      }
    }
  }
}

export default Sidekiq;
