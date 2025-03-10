import {
    CarBrandTranslation,
    CarFeatureTranslation,
    CarModelTranslation,
    CarTranslation,
    OTP,
    Permission,
    Resource,
    Role,
    Session,
    User,
} from '@/common/entities';
import { TokenManager, TokenManagerToken } from '@/common/jwt';
import { MessageBroker, MessageBrokerToken } from '@/common/message-broker';
import {
    GoogleServicesManager,
    GoogleServicesManagerToken,
} from '@/config/google';
import { AuthService } from '@/modules/auth/application/services/auth.service';
import { PermissionService } from '@/modules/auth/application/services/permission.service';
import { RoleService } from '@/modules/auth/application/services/role.service';
import {
    PasswordManager,
    PasswordManagerToken,
} from '@/modules/auth/infrastructure/providers/password-manager';
import { TOTP, TOTPToken } from '@/modules/auth/infrastructure/providers/totp';
import { OTPRepository } from '@/modules/auth/infrastructure/repositories/otp.repository';
import { PermissionRepository } from '@/modules/auth/infrastructure/repositories/permission.repository';
import { ResourceRepository } from '@/modules/auth/infrastructure/repositories/resource.repository';
import { RoleRepository } from '@/modules/auth/infrastructure/repositories/role.repository';
import { SessionRepository } from '@/modules/auth/infrastructure/repositories/session.repository';
import { UserRepository } from '@/modules/auth/infrastructure/repositories/user.repository';
import { CarBrandService } from '@/modules/cars/application/services/car-brand.service';
import { CarFeatureService } from '@/modules/cars/application/services/car-feature.service';
import { CarModelService } from '@/modules/cars/application/services/car-model.service';
import { CarService } from '@/modules/cars/application/services/car.service';
import { SerializerService } from '@/common/services/serializer.service';
import { BrandTranslationsRepository } from '@/modules/cars/infrastrucure/brand-translation.repository';
import {
    BrandsRepositoryToken,
    CarBrandRepositoryFacrory,
} from '@/modules/cars/infrastrucure/brand.repository';
import { CarTranslationsRepository } from '@/modules/cars/infrastrucure/car-translation.repository';
import { CarRepositoryFacrory, CarsRepositoryToken } from '@/modules/cars/infrastrucure/car.repository';
import { FeatureTranslationsRepository } from '@/modules/cars/infrastrucure/feature-translation.repository';
import { CarFeatureRepositoryFacrory, FeaturesRepositoryToken } from '@/modules/cars/infrastrucure/feature.repository';
import { ModelTranslationsRepository } from '@/modules/cars/infrastrucure/model-translation.repository';
import { CarModelRepositoryFacrory, ModelsRepositoryToken } from '@/modules/cars/infrastrucure/model.repository';
import { Container } from 'typedi';
import { DataSource } from 'typeorm';

export const initializeDI = (dataSource: DataSource) => {
    // Register TypeORM repositories
    Container.set(UserRepository, dataSource.getRepository(User));
    Container.set(RoleRepository, dataSource.getRepository(Role));
    Container.set(
        PermissionRepository,
        new PermissionRepository(Permission, dataSource.manager)
    );
    Container.set(
        ResourceRepository,
        new ResourceRepository(Resource, dataSource.manager)
    );

    Container.set(
        CarsRepositoryToken,
        CarRepositoryFacrory.create(dataSource)
    );

    Container.set(
        CarTranslationsRepository,
        dataSource.getRepository(CarTranslation)
    );

    Container.set(
        BrandsRepositoryToken,
        CarBrandRepositoryFacrory.create(dataSource)
    );

    Container.set(
        BrandTranslationsRepository,
        dataSource.getRepository(CarBrandTranslation)
    );

    Container.set(
        ModelsRepositoryToken,
        CarModelRepositoryFacrory.create(dataSource)
    );

    Container.set(
        ModelTranslationsRepository,
        dataSource.getRepository(CarModelTranslation)
    );

    Container.set(
        FeaturesRepositoryToken,
        CarFeatureRepositoryFacrory.create(dataSource)
    );

    Container.set(
        FeatureTranslationsRepository,
        dataSource.getRepository(CarFeatureTranslation)
    );


    Container.set(SessionRepository, dataSource.getRepository(Session));
    Container.set(OTPRepository, dataSource.getRepository(OTP));

    // Register providers
    Container.set(MessageBrokerToken, new MessageBroker());
    Container.set(PasswordManagerToken, new PasswordManager());
    Container.set(TokenManagerToken, new TokenManager());
    Container.set(TOTPToken, new TOTP());
    Container.set(GoogleServicesManagerToken, new GoogleServicesManager());

    // Register services
    Container.set(
        PermissionService,
        new PermissionService(
            Container.get(UserRepository),
            Container.get(PermissionRepository),
            Container.get(ResourceRepository)
        )
    );

    Container.set(
        AuthService,
        new AuthService(
            Container.get(UserRepository),
            Container.get(RoleRepository),
            Container.get(SessionRepository),
            Container.get(OTPRepository),
            Container.get(MessageBrokerToken),
            Container.get(PasswordManagerToken),
            Container.get(TokenManagerToken),
            Container.get(TOTPToken),
            Container.get(GoogleServicesManagerToken)
        )
    );

    Container.set(
        RoleService,
        new RoleService(
            Container.get(RoleRepository),
            Container.get(UserRepository),
            Container.get(PermissionRepository)
        )
    );

    Container.set(
        SerializerService,
        new SerializerService()
    );

    Container.set(
        CarService,
        new CarService(
            Container.get(CarsRepositoryToken),
            Container.get(CarTranslationsRepository),
            Container.get(SerializerService),
            Container.get(MessageBrokerToken),
        )
    );

    Container.set(
        CarBrandService,
        new CarBrandService(
            Container.get(BrandsRepositoryToken),
            Container.get(BrandTranslationsRepository),
            Container.get(SerializerService),
            Container.get(MessageBrokerToken),
        )
    );

    Container.set(
        CarModelService,
        new CarModelService(
            Container.get(ModelsRepositoryToken),
            Container.get(ModelTranslationsRepository),
            Container.get(BrandsRepositoryToken),
            Container.get(SerializerService),
            Container.get(MessageBrokerToken),
        )
    );

    Container.set(
        CarFeatureService,
        new CarFeatureService(
            Container.get(FeaturesRepositoryToken),
            Container.get(FeatureTranslationsRepository),
            Container.get(SerializerService),
            Container.get(MessageBrokerToken),
        )
    );
};
