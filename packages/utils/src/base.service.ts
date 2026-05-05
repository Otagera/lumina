import { ObjectSchema } from "joi";
import { validateSpec, aliaserSpec } from "./specValidator.util";

export interface ServiceAliases {
  request: Record<string, string>;
  response: Record<string, string>;
}

export interface ServiceConfig<TInput, TOutput> {
  schema: ObjectSchema;
  aliases: ServiceAliases;
  handler: (input: TInput, dependencies?: any) => Promise<TOutput>;
}

export class BaseService<TInput = any, TOutput = any> {
  private schema: ObjectSchema;
  private aliases: ServiceAliases;
  private handler: (input: TInput, dependencies?: any) => Promise<TOutput>;

  constructor(config: ServiceConfig<TInput, TOutput>) {
    this.schema = config.schema;
    this.aliases = config.aliases;
    this.handler = config.handler;
  }

  async execute(data: any, dependencies?: any): Promise<TOutput> {
    // Step 1: Alias request (client keys → internal keys)
    const aliasedInput = aliaserSpec(this.aliases.request, data);

    // Step 2: Validate against schema
    const validatedInput = validateSpec(this.schema, aliasedInput);

    // Step 3: Execute business logic
    const result = await this.handler(validatedInput as TInput, dependencies);

    // Step 4: Alias response (internal keys → client keys)
    const aliasedOutput = aliaserSpec(this.aliases.response, result);

    return aliasedOutput as TOutput;
  }
}
