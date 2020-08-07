/**
 * Begin license text.
 * Copyright 2020 Inrupt Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * End license text.Source Distributions
 */

import { VocabContext } from "./VocabContext";

class VocabContextError extends Error {
  _context: VocabContext;
  _createdAt: number;
  _wrappedException?: VocabContextError | Error;

  constructor(
    context: VocabContext,
    message: string,
    wrappedException?: Error
  ) {
    // The ignore is required because of code coverage bug
    // https://github.com/gotwarlost/istanbul/issues/690
    super(message) /* istanbul ignore next */;
    if (wrappedException) {
      if (wrappedException instanceof VocabContextError) {
        this._wrappedException = wrappedException;
        this.message = `${this.message}\nContains context error: ${wrappedException.message}`;
      } else if (wrappedException instanceof Error) {
        this._wrappedException = wrappedException;
        this.message = `${this.message}\nContains error: ${wrappedException.message}`;
      } else {
        throw new Error(
          `Context error can only wrap ContextErrors or Errors, but got [${wrappedException}] (message was [${message}]).`
        );
      }
    }
    this._context = context;
    this._createdAt = Date.now();
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, VocabContextError.prototype);
  }

  report(level: number, totalLevels: number, exception: Error): string {
    let result = exception.message;
    const stack = exception.stack ? exception.stack.toString() : "";
    // Ignoring the next line is required for full code coverage, because when
    // testing in a Node environment, it is not possible to have `process`
    // undefined.
    // istanbul ignore next
    if (process?.env?.NODE_ENV !== "production") {
      result += "\n" + `Level ${level} of ${totalLevels}:\n${stack}`;
    }
    return result;
  }

  countLevels() {
    let result: number = 1;
    let current: VocabContextError | undefined = this;
    while (current && current._wrappedException) {
      if (!(current._wrappedException instanceof VocabContextError)) {
        // If we have wrapped a standard exception, then the unwrapping stops,
        //  because standard errors can't wrap other errors.
        current = undefined;
        result++;
      } else {
        current = current._wrappedException;
        result++;
      }
    }
    return result;
  }

  unwrapException(): string {
    const totalLevels = this.countLevels();
    let level = 1;
    let result = "";
    let current: VocabContextError | undefined = this;
    while (current !== undefined) {
      result += "\n\n" + this.report(level++, totalLevels, current);
      if (
        !(current._wrappedException instanceof VocabContextError) &&
        current._wrappedException
      ) {
        result +=
          "\n\n" + this.report(level++, totalLevels, current._wrappedException);
        // When reaching a plain Error, the unwrapping stops
        current = undefined;
      } else {
        // Unwraps the exception until _wrappedException is undefined
        current = current._wrappedException;
      }
    }
    return result;
  }

  toString(): string {
    return this.unwrapException();
  }

  contains(elements: string[]): boolean {
    if (!elements) {
      return true;
    }
    const message = this.unwrapException();
    return elements
      .map((element) => message.includes(element))
      .reduce((acc, current) => acc && current, true);
  }
}

export { VocabContextError };
