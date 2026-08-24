import { readInheritableStaticObjectPairs } from "./helpers"
import { mergeElementDefinitions, type ElementDefinition } from "./element-definition"
import { scopedQuery } from "./query"

interface ElementScope {
  element: Element
  identifier: string
}

export function ElementsBlessing(constructor: unknown): PropertyDescriptorMap {
  const pairs = readInheritableStaticObjectPairs<string>(constructor, "elements")

  const properties: PropertyDescriptorMap = {}
  for (const { definition, selector } of mergeElementDefinitions(pairs)) {
    Object.assign(properties, propertiesForElementDefinition(definition, selector))
  }
  return properties
}

function resolveSelector(scope: ElementScope, attrSuffix: string, staticSelector: string): string {
  const override = scope.element.getAttribute(`data-${scope.identifier}-${attrSuffix}-element`)
  if (override !== null && override.trim().length > 0) return override
  return staticSelector
}

function propertiesForElementDefinition(
  def: ElementDefinition,
  selector: string,
): PropertyDescriptorMap {
  const attrSuffix = def.attributeSuffix
  const query = (scope: ElementScope) =>
    scopedQuery(scope.element, resolveSelector(scope, attrSuffix, selector))
  return {
    [def.getterName]: {
      get(this: ElementScope): Element | null {
        return query(this).first()
      },
    },
    [def.pluralName]: {
      get(this: ElementScope): Element[] {
        return query(this).all()
      },
    },
    [def.predicateName]: {
      get(this: ElementScope): boolean {
        return query(this).exists()
      },
    },
  }
}
