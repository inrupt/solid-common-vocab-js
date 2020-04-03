import moment from "moment";
import { LitContext } from "./LitContext"

class LitContextError extends Error {

  _context: LitContext;
  _createdAt: number;
  _wrappedException?: LitContextError | Error;


  constructor(context: LitContext, message: string, wrappedException: Error) {
    super(message);
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
  }

  report(level: number, totalLevels: number, exception: Error): string {
    let result = exception.message;
    let stack = exception.stack ? exception.stack.toString() : ""
    if (process.env.NODE_ENV !== "production") {
      result +=
        "\n" +
        `Level ${level} of ${totalLevels}:\n${stack}`;
    }
    return result;
  }

  countLevels(): number {
    let result: number;

    // If we have wrapped a standard exception, then the level count must be 2 
    // (i.e. since standard errors can't wrap errors).
    if (!(this._wrappedException instanceof LitContextError)) {
      result = 2;
    } else {
      result = 1;
      let current: LitContextError|undefined = this._wrappedException;
      while (current) {
        if (!(current._wrappedException instanceof LitContextError)) {
          current = undefined // This stops the unwrapping
          result++;
        } else {
          current = current._wrappedException;
          result++;
        }
      }
    }
    return result;
  }

  unwrapException(): string {
    let result = ""
    if (this._wrappedException) {
      const totalLevels = this.countLevels();
      let level = 1;
      let result = this.report(level, totalLevels, this);
      // If the wrapped exception is not a LitContextError, it's a regular Error.
      // In this case, nothing additional is wrapped.
      if (!(this._wrappedException instanceof LitContextError)) {
        result +=
          "\n\n" +
          this.report(++level, totalLevels, this._wrappedException);
      } else {
        let current: LitContextError | undefined = this._wrappedException;
        while (current) {
          result += "\n\n" + this.report(++level, totalLevels, current);
          if (!(current._wrappedException instanceof LitContextError) 
            && current._wrappedException) {
            result +=
              "\n\n" +
              this.report(
                ++level,
                totalLevels,
                current._wrappedException
              );
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

  contains(): boolean {
    const message = this.unwrapException();
    for (let i = 0; i < arguments.length; i++) {
      if (!message.includes(arguments[i])) {
        return false;
      }
    }
    return true;
  }
}

export {LitContextError}
