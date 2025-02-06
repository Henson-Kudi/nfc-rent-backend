// src/shared/entity-registry.ts
export class EntityRegistry {
    private static entities: Function[] = [];

    static registerEntities(entities: Function[]) {
        this.entities = [...this.entities, ...entities];
    }

    static getEntities() {
        return this.entities;
    }
}