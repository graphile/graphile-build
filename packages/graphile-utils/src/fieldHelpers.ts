import debugFactory from "debug";
import type { GraphQLResolveInfo } from "graphql";
import type { Build, Context } from "graphile-build";
import type { QueryBuilder, SQL } from "graphile-build-pg";

// Not really the right scope, but eases debugging for users
const debugSql = debugFactory("graphile-build-pg:sql");

export type SelectGraphQLResultFromTable = (
  tableFragment: SQL,
  builderCallback: (alias: SQL, sqlBuilder: QueryBuilder) => void
) => Promise<any>;

export interface GraphileHelpers<TSource> {
  build: Build;
  fieldContext: Context<TSource>;
  selectGraphQLResultFromTable: SelectGraphQLResultFromTable;
}

export function makeFieldHelpers<TSource>(
  build: Build,
  fieldContext: Context<TSource>,
  context: any,
  resolveInfo: GraphQLResolveInfo
) {
  const {
    parseResolveInfo,
    pgQueryFromResolveData,
    pgSql: sql,

    // Default is for support of graphile-build-pg pre 4.12:
    formatSQLForDebugging = require("graphile-build-pg").formatSQLForDebugging,
  } = build;
  const { getDataFromParsedResolveInfoFragment, scope } = fieldContext;
  const { pgFieldIntrospection, isPgFieldConnection } = scope;

  const isConnection = !!isPgFieldConnection;

  const table =
    pgFieldIntrospection && pgFieldIntrospection.kind === "class"
      ? pgFieldIntrospection
      : null;
  const primaryKeyConstraint = table && table.primaryKeyConstraint;
  const primaryKeys =
    primaryKeyConstraint && primaryKeyConstraint.keyAttributes;

  const selectGraphQLResultFromTable: SelectGraphQLResultFromTable = async (
    tableFragment: SQL,
    builderCallback?: (alias: SQL, sqlBuilder: QueryBuilder) => void
  ) => {
    const { pgClient } = context;
    const parsedResolveInfoFragment = parseResolveInfo(resolveInfo);
    const PayloadType = resolveInfo.returnType;

    const resolveData = getDataFromParsedResolveInfoFragment(
      parsedResolveInfoFragment,
      PayloadType
    );
    const tableAlias = sql.identifier(Symbol());
    const query = pgQueryFromResolveData(
      tableFragment,
      tableAlias,
      resolveData,
      {
        withPaginationAsFields: isConnection,
        useAsterisk: table.canUseAsterisk,
      },
      (sqlBuilder: QueryBuilder) => {
        if (
          !isConnection &&
          primaryKeys &&
          build.options.subscriptions &&
          table
        ) {
          sqlBuilder.selectIdentifiers(table);
        }

        if (typeof builderCallback === "function") {
          builderCallback(tableAlias, sqlBuilder);
        }
      },
      context,
      resolveInfo.rootValue
    );
    const { text, values } = sql.compile(query);
    if (debugSql.enabled) debugSql("%s", "\n" + formatSQLForDebugging(text));
    const { rows } = await pgClient.query(text, values);
    if (isConnection) {
      return build.pgAddStartEndCursor(rows[0]);
    } else {
      const liveRecord =
        resolveInfo.rootValue && resolveInfo.rootValue.liveRecord;
      if (
        build.options.subscriptions &&
        !isConnection &&
        primaryKeys &&
        liveRecord
      ) {
        rows.forEach(
          (row: any) => row && liveRecord("pg", table, row.__identifiers)
        );
      }
      return rows;
    }
  };

  const graphileHelpers: GraphileHelpers<TSource> = {
    build,
    fieldContext,
    selectGraphQLResultFromTable,
  };
  return graphileHelpers;
}

export function requireColumn<Type>(
  build: Build,
  context: Context<Type>,
  method: "addArgDataGenerator" | "addDataGenerator",
  col: string,
  alias: string
): void {
  const { pgSql: sql } = build;
  context[method](() => ({
    pgQuery: (queryBuilder: QueryBuilder) => {
      queryBuilder.select(
        sql.query`${queryBuilder.getTableAlias()}.${sql.identifier(col)}`,
        alias
      );
    },
  }));
}

export function requireChildColumn<Type>(
  build: Build,
  context: Context<Type>,
  col: string,
  alias: string
): void {
  return requireColumn(build, context, "addArgDataGenerator", col, alias);
}

export function requireSiblingColumn<Type>(
  build: Build,
  context: Context<Type>,
  col: string,
  alias: string
): void {
  return requireColumn(build, context, "addDataGenerator", col, alias);
}
