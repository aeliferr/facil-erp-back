import { PrismaClient } from '@prisma/client'
import { getTenantContext } from '../context/tenant-context'

function injectTenantId(data: any, tenantId: string) {
  if (!data) return data;

  // Se o próprio data não tem tenantId, adiciona
  if (typeof data === 'object' && !Array.isArray(data)) {
    if ('tenantId' in data || 'tenant' in data) {
      data.tenantId = tenantId;
    }
  }

  // Agora, percorre as relações
  for (const key in data) {
    if (!data[key]) continue;

    // Se for create ou createMany
    if (data[key].create) {
      if (Array.isArray(data[key].create)) {
        data[key].create = data[key].create.map((item: any) => ({
          ...item,
          tenant: {
            connect: {
              id: tenantId
            }
          },
        }));
      } else {
        data[key].create = {
          ...data[key].create,
          tenant: {
            connect: {
              id: tenantId
            }
          },
        };
      }
    }

    if (data[key].createMany?.data) {
      if (Array.isArray(data[key].createMany.data)) {
        data[key].createMany.data = data[key].createMany.data.map((item: any) => ({
          ...item,
          tenant: {
            connect: {
              id: tenantId
            }
          },
        }));
      }
    }

    // Se for update ou upsert
    if (data[key].update) {
      data[key].update = injectTenantId(data[key].update, tenantId);
    }

    if (data[key].upsert) {
      if (data[key].upsert.create) {
        data[key].upsert.create = injectTenantId(data[key].upsert.create, tenantId);
      }
      if (data[key].upsert.update) {
        data[key].upsert.update = injectTenantId(data[key].upsert.update, tenantId);
      }
    }
  }

  return data;
}

const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const tenantId = getTenantContext()?.tenantId; // aqui você pega o tenantId da requisição

        // Apenas se tiver data
        if (args?.data) {
          args.data = injectTenantId(args.data, tenantId);
        }

        return query(args);
      }
    }
  }
})

export default prisma
