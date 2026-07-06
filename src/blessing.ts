import { camelize, capitalize, readInheritableStaticObjectPairs } from "./helpers"
import { queryOne, queryAll } from "./query"

interface ElementScope {
  element: Element
}

export function ElementsBlessing(constructor: unknown): PropertyDescriptorMap {
  const merged = new Map<string, string>()
  for (const [key, selector] of readInheritableStaticObjectPairs<string>(constructor, "elements")) {
    merged.set(key, selector) // later-wins → subclass overrides
  }

  const properties: PropertyDescriptorMap = {}
  for (const [key, selector] of merged) {
    Object.assign(properties, propertiesForElementDefinition(camelize(key), selector))
  }
  return properties
}

function propertiesForElementDefinition(name: string, selector: string): PropertyDescriptorMap {
  return {
    [`${name}Element`]: {
      get(this: ElementScope): Element | null {
        return queryOne(this.element, selector)
      },
    },
    [`${name}Elements`]: {
      get(this: ElementScope): Element[] {
        return queryAll(this.element, selector)
      },
    },
    [`has${capitalize(name)}Element`]: {
      get(this: ElementScope): boolean {
        return queryOne(this.element, selector) !== null
      },
    },
  }
}
