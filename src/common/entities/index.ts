import { EntityRegistry } from "@/common/database/typeorm/entity-registry";

import { Shop } from './shop/shop.entity'


export function registerShopEntities() {
    EntityRegistry.registerEntities([Shop])
}


// Export all entities so that all other imports would be importing from this file
export { Shop }