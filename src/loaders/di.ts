import { OTP, Permission, Resource, Role, Session, User } from '@/common/entities';
import { TokenManager, TokenManagerToken } from '@/common/jwt';
import { MessageBroker, MessageBrokerToken } from '@/common/message-broker';
import envConf from '@/config/env.conf';
import { GoogleServicesManager, GoogleServicesManagerToken } from '@/config/google';
import { AuthService } from '@/modules/auth/application/services/auth.service';
import { PermissionService } from '@/modules/auth/application/services/permission.service';
import { RoleService } from '@/modules/auth/application/services/role.service';
import { PasswordManager, PasswordManagerToken } from '@/modules/auth/infrastructure/providers/password-manager';
import { TOTP, TOTPToken } from '@/modules/auth/infrastructure/providers/totp';
import { OTPRepository } from '@/modules/auth/infrastructure/repositories/otp.repository';
import { PermissionRepository } from '@/modules/auth/infrastructure/repositories/permission.repository';
import { ResourceRepository } from '@/modules/auth/infrastructure/repositories/resource.repository';
import { RoleRepository } from '@/modules/auth/infrastructure/repositories/role.repository';
import { SessionRepository } from '@/modules/auth/infrastructure/repositories/session.repository';
import { UserRepository } from '@/modules/auth/infrastructure/repositories/user.repository';
import { Container } from 'typedi';
import { DataSource } from 'typeorm';

export const initializeDI = (dataSource: DataSource) => {
    // Register TypeORM repositories
    Container.set(UserRepository, dataSource.getRepository(User));
    Container.set(RoleRepository, dataSource.getRepository(Role));
    Container.set(PermissionRepository, new PermissionRepository(Permission, dataSource.manager));
    Container.set(ResourceRepository, new ResourceRepository(Resource, dataSource.manager));
    Container.set(SessionRepository, dataSource.getRepository(Session))
    Container.set(OTPRepository, dataSource.getRepository(OTP))

    // Register providers
    Container.set(MessageBrokerToken, new MessageBroker())
    Container.set(PasswordManagerToken, new PasswordManager())
    Container.set(TokenManagerToken, new TokenManager())
    Container.set(TOTPToken, new TOTP())
    Container.set(GoogleServicesManagerToken, new GoogleServicesManager())

    // Register services
    Container.set(PermissionService, new PermissionService(
        Container.get(UserRepository),
        Container.get(PermissionRepository),
        Container.get(ResourceRepository)
    ));

    Container.set(AuthService, new AuthService(
        Container.get(UserRepository),
        Container.get(RoleRepository),
        Container.get(SessionRepository),
        Container.get(OTPRepository),
        Container.get(MessageBrokerToken),
        Container.get(PasswordManagerToken),
        Container.get(TokenManagerToken),
        Container.get(TOTPToken),
        Container.get(GoogleServicesManagerToken)
    ))

    Container.set(RoleService, new RoleService(
        Container.get(RoleRepository),
        Container.get(UserRepository),
        Container.get(PermissionRepository),
    ))
};