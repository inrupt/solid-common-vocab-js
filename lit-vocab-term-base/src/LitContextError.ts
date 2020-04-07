import moment from "moment";
import { LitContext } from "./LitContext";

class LitContextError extends Error {
  _context: LitContext;
  _createdAt: number;
  _wrappedException?: LitContextError | Error;

  constructor(
    context: LitContext,
    message: string,
    wrappedException: Error | null
  ) {
    // The ignore is required because of code coverage bug
    // https://github.com/gotwarlost/istanbul/issues/690
    super(message) /* istanbul ignore next */;
    if (wrappedException) {
      if (wrappedException instanceof LitContextError) {
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
    this._createdAt = moment().valueOf();
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, LitContextError.prototype);
  }

  report(level: number, totalLevels: number, exception: Error): string {
    let result = exception.message;
    let stack = exception.stack ? exception.stack.toString() : "";
    if (process.env.NODE_ENV !== "production") {
      result += "\n" + `Level ${level} of ${totalLevels}:\n${stack}`;
    }
    return result;
  }

  countLevels() {
    let result: number = 1;
    let current: LitContextError | undefined = this;
    while (current && current._wrappedException) {
      if (!(current._wrappedException instanceof LitContextError)) {
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
    let result = this.report(level, totalLevels, this);
    if (this._wrappedException) {
      // If the wrapped exception is not a LitContextError, it's a regular Error.
      // In this case, nothing additional is wrapped.
      if (!(this._wrappedException instanceof LitContextError)) {
        result +=
          "\n\n" + this.report(++level, totalLevels, this._wrappedException);
      } else {
        let current: LitContextError | undefined = this._wrappedException;
        while (current !== undefined) {
          result += "\n\n" + this.report(++level, totalLevels, current);
          if (
            !(current._wrappedException instanceof LitContextError) &&
            current._wrappedException
          ) {
            result +=
              "\n\n" +
              this.report(++level, totalLevels, current._wrappedException);
            // When reaching a plain Error, the unwrapping stops
            current = undefined;
          } else {
            // Unwraps the exception until _wrappedException is undefined
            current = current._wrappedException;
          }
        }
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

export { LitContextError };
