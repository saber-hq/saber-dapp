import { SailError } from "@saberhq/sail";
import type { Network } from "@saberhq/solana-contrib";
import * as Sentry from "@sentry/react";
import type { CaptureContext, Extras, ScopeContext } from "@sentry/types";

import { notify } from "./notifications";

export class CapturedError extends Error {
  constructor(
    override readonly name: string,
    override readonly message: string,
    readonly source: string,
    readonly originalError: unknown,
  ) {
    super(message);
    if (originalError instanceof Error) {
      this.stack = originalError.stack;
    }
  }
}

const extractErrorMessage = (err: unknown): string => {
  if (!err) {
    return "empty error";
  }
  const errObj = err as Record<string, unknown>;
  const message = errObj.message;
  if (!message) {
    return "empty error message";
  }
  if (typeof message === "string") {
    return message;
  }
  if (typeof message === "object") {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return message?.toString() ?? "unknown message";
  }
  return "no message could be extracted";
};

export const describeRPCError = (msg: string): string => {
  try {
    const result = JSON.parse(msg.substring("503 : ".length)) as {
      error: {
        code: string;
        message: string;
      };
    };
    return `${result.error.message} (${result.error.code})`;
  } catch (e) {
    // ignore parse error
  }
  return msg;
};

/**
 * Captures an exception.
 */
export const handleException = (
  err: unknown,
  {
    name = err instanceof Error ? err.name : "CapturedError",
    source = name ?? "unspecified",
    userMessage,
    groupInSentry,
    silent = false,
    network,
    ...sentryContext
  }: {
    /**
     * Custom name to apply to the error.
     */
    name?: string;
    /**
     * Source to apply to the error.
     */
    source?: string;
    /**
     * Notification to send to the user.
     */
    userMessage?: {
      title: string;
      /**
       * Defaults to error's message.
       */
      description?: string;
    };
    /**
     * If true, applies a fingerprint to group the errors by source and name.
     */
    groupInSentry?: boolean;
    tags?: Record<string, string>;
    extra?: Extras;
    /**
     * If true, the user will not see a message.
     */
    silent?: boolean;
    network?: Network;
  } & Pick<Partial<ScopeContext>, "tags" | "extra" | "fingerprint">,
): void => {
  const captured = new CapturedError(
    name,
    extractErrorMessage(err),
    source,
    err,
  );

  console.error(`[${captured.name}] (from ${captured.source})`);
  console.error(captured);
  console.error(captured.originalError);

  const notification = silent
    ? null
    : {
        message:
          userMessage?.title ??
          (captured.originalError instanceof SailError
            ? captured.originalError.title
            : null) ??
          name ??
          captured.name,
        description: userMessage?.description ?? captured.message,
        env: network,
      };
  if (!silent) {
    notify({
      ...notification,
      type: "error",
    });
  }

  const sentryArgs: CaptureContext = {
    ...sentryContext,
    tags: {
      ...sentryContext.tags,
      source,
    },
    extra: {
      notification,
      originalError: captured.originalError,
      userMessage,
      originalStack:
        captured.originalError instanceof Error
          ? captured.originalError.stack
          : undefined,
      ...sentryContext.extra,
    },
  };
  if (groupInSentry) {
    sentryArgs.fingerprint = [
      ...(sentryArgs.fingerprint ?? []),
      captured.name,
      source,
    ];
  }
  Sentry.captureException(captured, sentryArgs);
};
