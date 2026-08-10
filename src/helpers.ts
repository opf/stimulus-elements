export function readInheritableStaticObjectPairs<T = unknown>(
  constructor: unknown,
  propertyName: string,
): [string, T][] {
  const pairs: [string, T][] = []
  for (const ancestor of ancestorsForConstructor(constructor)) {
    if (!Object.prototype.hasOwnProperty.call(ancestor, propertyName)) continue
    const definition = (ancestor as Record<string, unknown>)[propertyName]
    if (definition && typeof definition === "object") {
      for (const key of Object.keys(definition as object)) {
        pairs.push([key, (definition as Record<string, T>)[key] as T])
      }
    }
  }
  return pairs
}

function ancestorsForConstructor(constructor: unknown): object[] {
  const ancestors: object[] = []
  let current: unknown = constructor
  while (typeof current === "function" && current !== Function.prototype) {
    ancestors.unshift(current as object) // base-first
    current = Object.getPrototypeOf(current)
  }
  return ancestors
}
