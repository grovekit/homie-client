
import { Deferred } from "./deferred.js"

export type ReleaseFn = () => void;

export class AsyncLock {

  #curr: Promise<void>;

  constructor() {
    this.#curr = Promise.resolve();
  }

  acquire(): Promise<ReleaseFn> {
    return this.#curr.then(() => {
      const next = new Deferred<void>();
      this.#curr = next.promise;
      return next.resolve;
    });
  }

  acquireRunAndRelease(fn: () => Promise<any>): Promise<void> {
    return this.acquire()
      .then(release => fn().finally(release));
  }

}
