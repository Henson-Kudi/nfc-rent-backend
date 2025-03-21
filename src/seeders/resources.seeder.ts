import resources from '@/common/utils/resources.json';
import { Resource } from '@/common/entities';
import logger from '@/common/utils/logger';
import Container from 'typedi';
import { ResourceRepository } from '@/modules/auth/infrastructure/repositories/resource.repository';

export async function seedModules() {
  const moduleRepo = Container.get(ResourceRepository);

  async function createModules(tree: ModuleTree, parent?: Resource) {
    for (const [, module] of Object.entries(tree)) {
      const existing = await moduleRepo.findOne({
        where: { path: module.path },
      });

      if (!existing) {
        const newModule = new Resource();
        newModule.name = module.name;
        newModule.path = module.path;

        if (parent) {
          newModule.parent = parent;
        }

        await moduleRepo.save(newModule);

        if (module.children) {
          await createModules(module.children, newModule);
        }
      }
    }
  }

  await createModules(resources.resources);
  logger.info('Modules seeded successfully!');
}
