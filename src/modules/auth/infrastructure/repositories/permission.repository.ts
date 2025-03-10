import { Permission } from '@/common/entities';
import { Service } from 'typedi';
import { Repository } from 'typeorm';

@Service()
export class PermissionRepository extends Repository<Permission> {
  async userHasAccess(userId: string, identifier: string): Promise<boolean> {
    console.log(identifier, 'identifier');
    return this.createQueryBuilder('permission')
      .innerJoin('permission.roles', 'role')
      .innerJoin('role.users', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('permission.identifier = :identifier', { identifier })
      .getCount()
      .then((count) => count > 0);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const permissions = await this.createQueryBuilder('permission')
      .innerJoin('permission.roles', 'role')
      .innerJoin('role.users', 'user')
      .where('user.id = :userId', { userId })
      .select('permission.identifier', 'identifier')
      .getRawMany();

    return permissions.map((p) => p.identifier);
  }
}
