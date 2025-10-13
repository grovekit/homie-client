import { is, ValidationErrorItem } from "@deepkit/type";
import { stringifyValidationErrorItem } from "@grovekit/homie-core";
import { ConnectParameters } from "@seriousme/opifex/client";

export interface HomieClientOpts extends Omit<ConnectParameters, 'url'> {
  url: string;
}

export const getHomieClientOptsFromEnv = (env: Record<string, string | undefined>): HomieClientOpts => {
  const opts = {
    url: env.GK_HOMIE_URL,
  };
  const errors: ValidationErrorItem[] = [];
  if (!is<HomieClientOpts>(opts, undefined, errors)) {
    throw new Error(`Invalid HomieClientOpts: ${errors.map(stringifyValidationErrorItem).join(', ')}`);
  }
  return opts;
};
