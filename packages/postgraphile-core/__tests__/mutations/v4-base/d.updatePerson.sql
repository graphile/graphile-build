SAVEPOINT graphql_mutation

with __local_0__ as (
  update "d"."person" set "last_name" = $1,
  "col_no_create" = $2,
  "col_no_order" = $3,
  "col_no_filter" = $4
  where (
    "id" = $5
  ) returning *
)
select (
  (
    case when __local_0__ is null then null else __local_0__ end
  )
)::text
from __local_0__

with __local_0__ as (
  select (
    str::"d"."person"
  ).*
  from unnest(
    (
      $1
    )::text[]
  ) str
)
select to_json(
  (
    json_build_object(
      'id'::text,
      (__local_0__."id"),
      'firstName'::text,
      (__local_0__."first_name"),
      'lastName'::text,
      (__local_0__."last_name"),
      'colNoCreate'::text,
      (__local_0__."col_no_create"),
      'colNoUpdate'::text,
      (__local_0__."col_no_update"),
      'colNoOrder'::text,
      (__local_0__."col_no_order"),
      'colNoFilter'::text,
      (__local_0__."col_no_filter"),
      'colNoCreateUpdate'::text,
      (__local_0__."col_no_create_update"),
      'colNoCreateUpdateOrderFilter'::text,
      (__local_0__."col_no_create_update_order_filter")
    )
  )
) as "@person"
from __local_0__ as __local_0__
where (TRUE) and (TRUE)

RELEASE SAVEPOINT graphql_mutation