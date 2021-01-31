import { SchemaBuilder, Options, Plugin, Context, Build } from "graphile-build";
import {
  GraphQLFieldResolver,
  GraphQLResolveInfo,
  GraphQLFieldConfig,
  GraphQLObjectType,
} from "graphql";
import {
  makeFieldHelpers,
  requireChildColumn,
  requireSiblingColumn,
} from "./fieldHelpers";

type ResolverWrapperFn<
  TSource = any,
  TContext = any,
  TArgs extends Record<string, any> = { [argName: string]: any }
> = (
  resolve: GraphQLFieldResolver<TSource, TContext, TArgs>,
  source: TSource,
  args: TArgs,
  context: TContext,
  resolveInfo: GraphQLResolveInfo
) => any;
interface ResolverWrapperRequirements {
  childColumns?: Array<{ column: string; alias: string }>;
  siblingColumns?: Array<{ column: string; alias: string }>;
}

interface ResolverWrapperRule<
  TSource = any,
  TContext = any,
  TArgs extends Record<string, any> = { [argName: string]: any }
> {
  requires?: ResolverWrapperRequirements;
  resolve?: ResolverWrapperFn<TSource, TContext, TArgs>;
  // subscribe?: ResolverWrapperFn;
}

type ResolverWrapperRules<T> = {
  [TTypeName in keyof T]: {
    [TFieldName in keyof T[TTypeName]]: T[TTypeName][TFieldName] extends ResolverWrapperFn<
      infer _TSource,
      infer _TContext,
      infer _TArgs
    >
      ? T[TTypeName][TFieldName]
      : T[TTypeName][TFieldName] extends ResolverWrapperRule<
          infer _TSource,
          infer _TContext,
          infer _TArgs
        >
      ? T[TTypeName][TFieldName]
      : never;
  };
};

type ResolverWrapperRulesGenerator<T> = (
  options: Options
) => ResolverWrapperRules<T>;

type ResolverWrapperFilter<T> = (
  context: Context<GraphQLObjectType>,
  build: Build,
  field: GraphQLFieldConfig<any, any>,
  options: Options
) => T | null;

type ResolverWrapperFilterRule<
  T,
  TSource = any,
  TContext = any,
  TArgs extends Record<string, any> = { [argName: string]: any }
> = (
  match: T
) =>
  | ResolverWrapperRule<TSource, TContext, TArgs>
  | ResolverWrapperFn<TSource, TContext, TArgs>;

export default function makeWrapResolversPlugin<T>(
  rulesOrGenerator: ResolverWrapperRules<T> | ResolverWrapperRulesGenerator<T>
): Plugin;
export default function makeWrapResolversPlugin<T>(
  filter: ResolverWrapperFilter<T>,
  rule: ResolverWrapperFilterRule<T>
): Plugin;
export default function makeWrapResolversPlugin<T>(
  rulesOrGeneratorOrFilter:
    | ResolverWrapperRules<T>
    | ResolverWrapperRulesGenerator<T>
    | ResolverWrapperFilter<T>,
  rule?: ResolverWrapperFilterRule<T>
): Plugin {
  if (rule && typeof rule !== "function") {
    throw new Error(
      "Invalid call signature for makeWrapResolversPlugin, expected second argument to be a function"
    );
  }
  return (builder: SchemaBuilder, options: Options) => {
    // Disambiguate first argument
    const rulesOrGenerator:
      | ResolverWrapperRules<T>
      | ResolverWrapperRulesGenerator<T>
      | null = rule ? null : (rulesOrGeneratorOrFilter as any);
    const filter: ResolverWrapperFilter<T> | null = rule
      ? (rulesOrGeneratorOrFilter as any)
      : null;

    const rules: ResolverWrapperRules<T> | null =
      typeof rulesOrGenerator === "function"
        ? rulesOrGenerator(options)
        : rulesOrGenerator;
    builder.hook("GraphQLObjectType:fields:field", (field, build, context) => {
      const {
        Self,
        scope: { fieldName },
      } = context;
      let resolveWrapperOrSpec;
      if (filter) {
        const filterResult: any = filter(context, build, field, options);
        if (!filterResult) {
          if (filterResult !== null) {
            // eslint-disable-next-line no-console
            console.error(
              `Filter should return either a truthy value, or 'null', instead received: '${filterResult}'`
            );
          }
          return field;
        }
        resolveWrapperOrSpec = rule!(filterResult);
      } else if (rules) {
        const typeRules = rules[Self.name];
        if (!typeRules) {
          return field;
        }
        resolveWrapperOrSpec = typeRules[fieldName];
      } else {
        // Should not happen
        throw new Error(
          "Bad call signature for function makeWrapResolversPlugin"
        );
      }
      if (!resolveWrapperOrSpec) {
        return field;
      }
      const resolveWrapper: ResolverWrapperFn<unknown, unknown> | undefined =
        typeof resolveWrapperOrSpec === "function"
          ? resolveWrapperOrSpec
          : resolveWrapperOrSpec.resolve;
      const resolveWrapperRequirements:
        | ResolverWrapperRequirements
        | undefined =
        typeof resolveWrapperOrSpec === "function"
          ? undefined
          : resolveWrapperOrSpec.requires;
      if (resolveWrapperRequirements) {
        // Perform requirements
        if (resolveWrapperRequirements.childColumns) {
          resolveWrapperRequirements.childColumns.forEach(
            ({ column, alias }) => {
              requireChildColumn(build, context, column, alias);
            }
          );
        }
        if (resolveWrapperRequirements.siblingColumns) {
          resolveWrapperRequirements.siblingColumns.forEach(
            ({ column, alias }) => {
              requireSiblingColumn(build, context, column, alias);
            }
          );
        }
      }
      if (!resolveWrapper) {
        return field;
      }
      const {
        resolve: oldResolve = (obj: Record<string, any>) => obj[fieldName],
      } = field;
      return {
        ...field,
        async resolve(...resolveParams) {
          const smartResolve = (...overrideParams: Array<any>) =>
            oldResolve(
              // @ts-ignore We're calling it dynamically, allowing the parent to override args.
              ...overrideParams.concat(
                resolveParams.slice(overrideParams.length)
              )
            );
          const [source, args, graphqlContext, resolveInfo] = resolveParams;
          const resolveInfoWithHelpers = {
            ...resolveInfo,
            graphile: makeFieldHelpers(
              build,
              context,
              graphqlContext,
              resolveInfo
            ),
          };
          return resolveWrapper(
            smartResolve,
            source,
            args,
            graphqlContext,
            resolveInfoWithHelpers
          );
        },
      };
    });
  };
}
