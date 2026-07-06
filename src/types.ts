// Declaration-merging helper: describe the accessors a `static elements`
// definition generates, so controllers get typed `this.xElement` access.
//
//   interface MyController extends WithElements<{ backdrop: string }> {}
//   class MyController extends Controller {
//     static elements = { backdrop: "#backdrop" }
//   }
//
// Keys are assumed already camelCase (matching accessor names).
export type WithElements<T extends Record<string, string>> = {
  [K in keyof T & string as `${K}Element`]: Element | null
} & {
  [K in keyof T & string as `${K}Elements`]: Element[]
} & {
  [K in keyof T & string as `has${Capitalize<K>}Element`]: boolean
}
