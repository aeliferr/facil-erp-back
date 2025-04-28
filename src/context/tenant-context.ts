import { AsyncLocalStorage } from 'async_hooks'

type TenantContextType = {
  tenantId: string
}

export const tenantStorage = new AsyncLocalStorage<TenantContextType>()

export function setTenantContext(tenantId: string) {
  tenantStorage.enterWith({ tenantId })
}

export function getTenantContext() {
  return tenantStorage.getStore()
}
