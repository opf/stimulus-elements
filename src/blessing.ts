import { camelize, capitalize, dasherize, readInheritableStaticObjectPairs } from "./helpers"
import { queryOne, queryAll } from "./query"

interface ElementScope {
  element: Element
  identifier: string
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

function resolveSelector(scope: ElementScope, attrSuffix: string, staticSelector: string): string {
  const override = scope.element.getAttribute(`data-${scope.identifier}-${attrSuffix}-element`)
  if (override !== null && override.trim().length > 0) return override
  return staticSelector
}

function propertiesForElementDefinition(name: string, selector: string): PropertyDescriptorMap {
  const attrSuffix = dasherize(name)
  return {
    [`${name}Element`]: {
      get(this: ElementScope): Element | null {
        return queryOne(this.element, resolveSelector(this, attrSuffix, selector))
      },
    },
    [`${name}Elements`]: {
      get(this: ElementScope): Element[] {
        return queryAll(this.element, resolveSelector(this, attrSuffix, selector))
      },
    },
    [`has${capitalize(name)}Element`]: {
      get(this: ElementScope): boolean {
        return queryOne(this.element, resolveSelector(this, attrSuffix, selector)) !== null
      },
    },
  }
}
