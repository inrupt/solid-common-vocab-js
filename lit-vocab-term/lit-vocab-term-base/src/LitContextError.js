"use strict";

const moment = require("moment");

class LitContextError extends Error {
  constructor(context, message, wrappedException) {
    super(message);

    if (wrappedException) {
      if (wrappedException instanceof LitContextError) {
        this._wrappedContextException = wrappedException;
        this.message = `${this.message}\nContains context error: ${wrappedException.message}`;
      } else {
        if (wrappedException instanceof Error) {
          this._wrappedStandardException = wrappedException;
          this.message = `${this.message}\nContains error: ${wrappedException.message}`;
        } else {
          throw new Error(
            `Context error can only wrap ContextErrors or Errors, but got [${wrappedException}] (message was [${message}]).`
          );
        }
      }
    }

    this._context = context;
    this._createdAt = moment().valueOf();
    //
    // if (preHandler) {
    //   preHandler(context, message)
    // }
  }

  report(level, totalLevels, exception) {
    let result = exception.message;

    if (process.env.NODE_ENV !== "production") {
      result +=
        "\n" +
        `Level ${level} of ${totalLevels}:\n` +
        exception.stack.toString();
    }

    return result;
  }

  countLevels() {
    let result;

    // If we have wrapped a standard exception, then the level count must be 2 (i.e. since standard errors can't wrap
    // errors).
    if (this._wrappedStandardException) {
      result = 2;
    } else {
      result = 1;
      let current = this._wrappedContextException;
      while (current) {
        if (current._wrappedStandardException) {
          result++;
        }
        current = current._wrappedContextException;
        result++;
      }
    }

    return result;
  }

  unwrapException() {
    const totalLevels = this.countLevels();

    let level = 1;
    let result = this.report(level, totalLevels, this);
    if (this._wrappedStandardException) {
      result +=
        "\n\n" +
        this.report(++level, totalLevels, this._wrappedStandardException);
    } else {
      let current = this._wrappedContextException;
      while (current) {
        result += "\n\n" + this.report(++level, totalLevels, current);
        if (current._wrappedStandardException) {
          result +=
            "\n\n" +
            this.report(
              ++level,
              totalLevels,
              current._wrappedStandardException
            );
        }
        current = current._wrappedContextException;
      }
    }

    return result;
  }

  toString() {
    return this.unwrapException();
  }

  contains() {
    const message = this.unwrapException();
    for (let i = 0; i < arguments.length; i++) {
      if (!message.includes(arguments[i])) {
        return false;
      }
    }

    return true;
  }
}

module.exports = LitContextError;
