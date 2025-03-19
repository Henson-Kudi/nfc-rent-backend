import { Inject, Service } from "typedi";
import { ContractRepository, ContractViolationRepository } from "../repository/contract.repository";
import { MessageBrokerToken } from "@/common/message-broker";
import { CreateContractDto } from "@/common/dtos/contract.dto";
import { Contract, User } from "@/common/entities";
import { validateCreateContract, validateCreateContractVoilation } from "../../utils/validation/contract.validation";
import { AppError, IReturnValue, IReturnValueWithPagination } from "@/common/utils";
import { ResponseCodes } from "@/common/enums";
import { BookingRepository } from "../repository/booking.repository";
import { BookingEvents } from "@/common/message-broker/events/booking.event";
import { Between, FindOptionsWhere, ILike, In, LessThanOrEqual, MoreThanOrEqual, } from "typeorm";
import { isValid } from "date-fns";
import { CreateContractVoilationDto } from "@/common/dtos/contract-violation.dto";

@Service()
export class ContractService {
    constructor(
        @Inject()
        private readonly contractRepository: ContractRepository,
        @Inject()
        private readonly bookingRepository: BookingRepository,
        @Inject()
        private readonly violationsRepository: ContractViolationRepository,
        @Inject(MessageBrokerToken)
        private readonly messageBroker: IMessageBroker
    ) { }

    async createContract(payload: CreateContractDto, actor: User) {
        const validPayload = await validateCreateContract(payload)

        // Ensure booking exists
        const booking = await this.bookingRepository.findOneBy({ id: validPayload.bookingId })

        if (!booking) {
            throw new AppError({
                message: 'Invalid booking identifier',
                statusCode: ResponseCodes.BadRequest
            })
        }

        // ensure contract with specified book does not already exist
        const contractWithBooking = await this.contractRepository.findOneBy({ booking: { id: validPayload.bookingId } })

        if (contractWithBooking) {
            throw new AppError({
                message: 'Contract with booking identifier already exists. Please update it instead',
                statusCode: ResponseCodes.BadRequest
            })
        }

        const contract = await this.contractRepository.manager.transaction(async (manager) => {
            const ContractRepo = manager.getRepository(this.contractRepository.target)
            const ViolationRepo = manager.getRepository(this.violationsRepository.target)

            const totalDeductions = validPayload?.violations?.filter(itm => itm.isDeducted)?.map(item => (item?.amount * item.totalUnits) + (item?.processingFee || 0)).reduce((a, b) => a + b, 0) || 0
            const totalCharges = validPayload?.violations?.map(item => (item?.amount * item.totalUnits) + (item?.processingFee || 0)).reduce((a, b) => a + b, 0) || 0

            const contract = await ContractRepo.save(ContractRepo.create({
                booking,
                damages: validPayload?.damages,
                clientSignature: validPayload?.clientSignature,
                additionalDriverSign: validPayload?.additionalDriverSign,
                fuelLevelPickup: validPayload.fuelLevelPickup,
                fuelLevelReturn: validPayload.fuelLevelReturn,
                isSigned: validPayload?.clientSignature ? true : false,
                mileageAtPickup: validPayload.mileageAtPickup,
                mileageAtReturn: validPayload.mileageAtReturn,
                signedAt: validPayload?.signedAt ? new Date(validPayload.signedAt) : undefined,
                templatePath: validPayload?.templatePath,
                totalViolationCharges: totalCharges,
                totalDeductions: totalDeductions,
                refundAmount: totalCharges - totalDeductions,
            }))

            const savedVoilations = validPayload?.violations?.length ? await ViolationRepo.save(validPayload?.violations?.map((violation) => ViolationRepo.create({
                description: violation?.description || '',
                violationType: violation?.violationType,
                amount: violation?.amount || 0,
                totalUnits: violation?.totalUnits || 1,
                processingFee: violation?.processingFee || 0,
                evidences: violation.evidences,
                isPaid: violation?.isPaid,
                isDeducted: violation?.isDeducted,
                violationDate: violation?.violationDate ? new Date(violation?.violationDate) : new Date(),
                totalCharge: violation?.amount * violation?.totalUnits + (violation?.processingFee || 0) || 0,
                contract: contract,
            }))) : []

            contract.violations = savedVoilations


            return contract
        })

        this.messageBroker.publishMessage(BookingEvents.contract.created, {
            data: {
                contract,
                actor
            }
        })

        return new IReturnValue({
            success: true,
            message: 'Contract created successfully',
            data: contract
        })
    }

    async updateContract(id: string, payload: Partial<CreateContractDto>, actor: User) {
        let contract = await this.contractRepository.findOne({ where: { id }, relations: { booking: true, violations: true } })

        if (!contract) {
            throw new AppError({
                message: 'Contract with identifier not found',
                statusCode: ResponseCodes.NotFound
            })
        }

        const validPayload = await validateCreateContract(payload as CreateContractDto, {
            abortEarly: false, presence: 'optional'
        })

        if (validPayload.bookingId) {
            if (contract?.booking && contract.booking.id !== validPayload.bookingId) {
                throw new AppError({
                    message: 'Cannot change booking for contract',
                    statusCode: ResponseCodes.BadRequest
                })

            }
            const booking = await this.bookingRepository.findOneBy({ id: validPayload.bookingId })
            if (!booking) {
                throw new AppError({
                    message: 'Invalid booking identifier',
                    statusCode: ResponseCodes.BadRequest
                })
            }
            contract.booking = booking
        }

        // update contract details in a transction if voilations are present

        if (validPayload.violations?.length) {
            const updated = await this.contractRepository.manager.transaction(async (manager) => {
                const ContractRepo = manager.getRepository(this.contractRepository.target)
                const ViolationRepo = manager.getRepository(this.violationsRepository.target)

                const totalDeductions = validPayload?.violations?.filter(itm => itm.isDeducted)?.map(item => (item?.amount * item.totalUnits) + (item?.processingFee || 0)).reduce((a, b) => a + b, 0) || 0
                const totalCharges = validPayload?.violations?.map(item => (item?.amount * item.totalUnits) + (item?.processingFee || 0)).reduce((a, b) => a + b, 0) || 0

                const { violations, ...rest } = validPayload

                // delete all exisiting violations
                if (contract?.violations?.length) {
                    await ViolationRepo.remove(contract.violations)
                }

                const updatedContract = await ContractRepo.save(ContractRepo.merge(contract!, {
                    ...rest,
                    totalDeductions: totalDeductions || contract?.totalDeductions || 0,
                    totalViolationCharges: totalCharges || 0,
                    refundAmount: (totalCharges || 0) - (totalDeductions || 0),
                }))

                // save new violations
                const savedVoilations = await ViolationRepo.save(
                    validPayload!.violations!.map((violation) => ViolationRepo.create({
                        description: violation?.description || '',
                        violationType: violation?.violationType,
                        amount: violation?.amount || 0,
                        totalUnits: violation?.totalUnits || 1,
                        processingFee: violation?.processingFee || 0,
                        evidences: violation.evidences,
                        isPaid: violation?.isPaid,
                        isDeducted: violation?.isDeducted,
                        violationDate: violation?.violationDate ? new Date(violation?.violationDate) : new Date(),
                        totalCharge: violation?.amount * violation?.totalUnits + (violation?.processingFee || 0) || 0,
                        contract: updatedContract,
                    }))
                )



                updatedContract.violations = savedVoilations

                return updatedContract

            })

            contract = updated
        } else {
            const { violations, ...rest } = validPayload
            contract = await this.contractRepository.save(this.contractRepository.merge(contract!, {
                ...rest,
            }))
        }

        this.messageBroker.publishMessage(BookingEvents.contract.updated, {
            data: {
                contract: contract,
                actor
            }
        })

        return new IReturnValue({
            success: true,
            message: 'Contract updated successfully',
            data: contract
        })
    }

    async getContract(id: string) {
        const contract = await this.contractRepository.findOne({ where: { id }, relations: { booking: true, violations: true } })

        if (!contract) {
            throw new AppError({
                message: 'Contract with identifier not found',
                statusCode: ResponseCodes.NotFound
            })
        }

        return new IReturnValue({
            success: true,
            message: 'Contract retrieved successfully',
            data: contract
        })
    }
    async getContractsByBookingId(bookingId: string) {
        const contract = await this.contractRepository.find({ where: { booking: { id: bookingId } }, relations: { booking: true, violations: true } })

        if (!contract) {
            throw new AppError({
                message: 'Contract with identifier not found',
                statusCode: ResponseCodes.NotFound
            })
        }

        return new IReturnValue({
            success: true,
            message: 'Contract retrieved successfully',
            data: contract
        })
    }
    async deleteContract(id: string, actor: User) {
        const contract = await this.contractRepository.findOne({ where: { id }, relations: { booking: true, violations: true } })

        if (!contract) {
            throw new AppError({
                message: 'Contract with identifier not found',
                statusCode: ResponseCodes.NotFound
            })
        }

        await this.contractRepository.remove(contract)

        this.messageBroker.publishMessage(BookingEvents.contract.deleted, {
            data: {
                contract,
                actor
            }
        })

        return new IReturnValue({
            success: true,
            message: 'Contract deleted successfully',
            data: contract
        })
    }
    async listContracts(query: GetContractsQuery) {
        const { page: Page = 1, limit: Limit = 10, locale = 'en', ...rest } = query

        const page = parseInt(Page.toString()) || 1
        const limit = parseInt(Limit.toString()) || 10
        const skip = (page - 1) * limit

        const filters = this.setupFilter(rest)


        const [contracts, count] = await this.contractRepository.findAndCount({
            where: filters,
            relations: {
                booking: {
                    user: true,
                    car: true
                },
                violations: true
            },
            skip,
            take: limit
        })

        return new IReturnValueWithPagination({
            success: true,
            message: 'Contracts retrieved successfully',
            data: contracts,
            limit,
            page,
            total: count,
        })
    }

    async addViolationToContract(contractId: string, payload: CreateContractVoilationDto, actor: User) {
        const validPayload = await validateCreateContractVoilation(payload)

        const contract = await this.contractRepository.findOne({ where: { id: contractId } })

        if (!contract) {
            throw new AppError({
                message: 'Contract with identifier not found',
                statusCode: ResponseCodes.NotFound
            })
        }

        const violation = await this.violationsRepository.manager.transaction(async (manager) => {
            const ViolationRepo = manager.getRepository(this.violationsRepository.target)
            const ContractRepo = manager.getRepository(this.contractRepository.target)

            const totalCharge = (validPayload?.amount * validPayload?.totalUnits) + (validPayload?.processingFee || 0)

            // Update contract with new violation details
            contract.totalViolationCharges = (contract.totalViolationCharges || 0) + totalCharge
            contract.totalDeductions = (contract.totalDeductions || 0) + (validPayload?.isDeducted ? totalCharge : 0)
            contract.refundAmount = (contract.totalViolationCharges || 0) - (contract.totalDeductions || 0)
            await ContractRepo.save(contract)

            // Save violation
            const violation = await ViolationRepo.save(ViolationRepo.create({
                description: validPayload?.description || '',
                violationType: validPayload?.violationType,
                amount: validPayload?.amount || 0,
                totalUnits: validPayload?.totalUnits || 1,
                processingFee: validPayload?.processingFee || 0,
                evidences: validPayload.evidences,
                isPaid: validPayload?.isPaid,
                isDeducted: validPayload?.isDeducted,
                violationDate: validPayload?.violationDate ? new Date(validPayload?.violationDate) : new Date(),
                totalCharge: totalCharge || 0,
                contract: contract
            }))

            return violation
        })

        // Publish event to message broker
        this.messageBroker.publishMessage(BookingEvents.contract.voilations.created, {
            data: {
                violation,
                actor
            }
        })

        return new IReturnValue({
            success: true,
            message: 'Contract violation created successfully',
            data: violation
        })
    }

    async updateContractVoilation(id: string, payload: Partial<CreateContractVoilationDto>, actor: User) {
        const validPayload = await validateCreateContractVoilation(payload, {
            presence: 'optional',
        })

        const violation = await this.violationsRepository.findOne({ where: { id }, relations: { contract: true } })

        if (!violation || !violation.contract) {
            throw new AppError({
                message: 'Contract violation with identifier not found',
                statusCode: ResponseCodes.NotFound
            })
        }

        const updated = await this.violationsRepository.manager.transaction(async (manager) => {
            const ViolationRepo = manager.getRepository(this.violationsRepository.target)
            const ContractRepo = manager.getRepository(this.contractRepository.target)

            // Update contract with new violation details
            let totalCharge = violation?.totalCharge || 0

            if (validPayload?.amount || validPayload?.totalUnits || validPayload?.processingFee) {
                totalCharge = ((validPayload?.amount || violation.amount) * (validPayload?.totalUnits || violation.totalUnits)) + (validPayload?.processingFee || violation.processingFee || 0)

                const exisitingCharge = (violation?.amount * violation?.totalUnits) + (violation?.processingFee || 0)

                violation.contract.totalViolationCharges = (violation.contract.totalViolationCharges || 0) + totalCharge - exisitingCharge
                violation.contract.totalDeductions = (violation.contract.totalDeductions || 0) + (validPayload?.isDeducted ? totalCharge - exisitingCharge : 0)

                violation.contract.refundAmount = (violation.contract.totalViolationCharges || 0) - (violation.contract.totalDeductions || 0)

                await ContractRepo.save(violation.contract)
            }

            // Save violation
            return await ViolationRepo.save(ViolationRepo.merge(violation!, {
                description: validPayload?.description || violation?.description || '',
                violationType: validPayload?.violationType || violation?.violationType,
                amount: validPayload?.amount || violation?.amount || 0,
                totalUnits: validPayload?.totalUnits || violation?.totalUnits || 1,
                processingFee: validPayload?.processingFee || violation?.processingFee || 0,
                evidences: validPayload.evidences,
                isPaid: validPayload?.isPaid,
                isDeducted: validPayload?.isDeducted,
                violationDate: validPayload?.violationDate ? new Date(validPayload?.violationDate) : new Date(),
                totalCharge: totalCharge || 0,
            }))
        })

        // Publish event to message broker
        this.messageBroker.publishMessage(BookingEvents.contract.voilations.updated, {
            data: {
                violation: updated,
                actor
            }
        })

        return new IReturnValue({
            success: true,
            message: 'Contract violation updated successfully',
            data: updated
        })
    }

    async deleteContractVoilation(id: string, actor: User) {
        const violation = await this.violationsRepository.findOne({ where: { id }, relations: { contract: true } })

        if (!violation || !violation.contract) {
            throw new AppError({
                message: 'Contract violation with identifier not found',
                statusCode: ResponseCodes.NotFound
            })
        }

        await this.violationsRepository.remove(violation)

        // Update contract with new violation details
        violation.contract.totalViolationCharges = (violation.contract.totalViolationCharges || 0) - (violation?.totalCharge || 0)
        violation.contract.totalDeductions = (violation.contract.totalDeductions || 0) - (violation?.isDeducted ? (violation?.totalCharge || 0) : 0)
        violation.contract.refundAmount = (violation.contract.totalViolationCharges || 0) - (violation.contract.totalDeductions || 0)

        await this.contractRepository.save(violation.contract)

        // Publish event to message broker
        this.messageBroker.publishMessage(BookingEvents.contract.voilations.deleted, {
            data: {
                violation,
                actor
            }
        })

        return new IReturnValue({
            success: true,
            message: 'Contract violation deleted successfully',
            data: violation
        })
    }

    async bulkDeleteContractVoilations(ids: string[], actor: User) {
        const violations = await this.violationsRepository.find({ where: { id: In(ids) }, relations: { contract: true } })

        if (!violations?.length) {
            throw new AppError({
                message: 'Contract violations with identifiers not found',
                statusCode: ResponseCodes.NotFound
            })
        }

        const contract = violations[0].contract

        await this.violationsRepository.remove(violations)
        // Update contract with new violation details
        contract.totalViolationCharges = (contract.totalViolationCharges || 0) - (violations?.map(itm => itm?.totalCharge || 0).reduce((a, b) => a + b, 0) || 0)
        contract.totalDeductions = (contract.totalDeductions || 0) - (violations?.filter(itm => itm.isDeducted)?.map(itm => itm?.totalCharge || 0).reduce((a, b) => a + b, 0) || 0)
        contract.refundAmount = (contract.totalViolationCharges || 0) - (contract.totalDeductions || 0)
        await this.contractRepository.save(contract)

        // Publish event to message broker
        this.messageBroker.publishMessage(BookingEvents.contract.voilations.deleted, {
            data: {
                violations,
                actor
            }
        })

        return new IReturnValue({
            success: true,
            message: 'Contract violations deleted successfully',
            data: violations
        })
    }

    private setupFilter(query: GetContractsFilter) {
        const filters: FindOptionsWhere<Contract>[] = []

        if (Array.isArray(query?.booking) && query?.booking?.length) {
            filters.push({ booking: { id: In(query.booking) } })
        }

        if (Array.isArray(query?.user) && query?.user?.length) {
            filters.push({ booking: { user: { id: In(query.user) } } })
        }

        if (Array.isArray(query?.car) && query?.car.length) {
            filters.push({ booking: { car: { id: In(query.car) } } })
        }

        if (Array.isArray(query?.status) && query?.status.length) {
            filters.push({ booking: { status: In(query.status) } })
        }

        if (query?.pickupDate) {
            const { end, start } = query.pickupDate
            if (end && isValid(new Date(end)) && start && isValid(new Date(start))) {
                filters.push({ booking: { pickupDate: Between(new Date(start), new Date(end)) } })

            } else if (start && isValid(new Date(start))) {
                filters.push({ booking: { pickupDate: MoreThanOrEqual(new Date(start)) } })
            } else if (end && isValid(new Date(end))) {
                filters.push({ booking: { pickupDate: LessThanOrEqual(new Date(end)) } })
            }
        }
        if (query?.returnDate) {
            const { end, start } = query.returnDate
            if (end && isValid(new Date(end)) && start && isValid(new Date(start))) {
                filters.push({ booking: { returnDate: Between(new Date(start), new Date(end)) } })

            } else if (start && isValid(new Date(start))) {
                filters.push({ booking: { returnDate: MoreThanOrEqual(new Date(start)) } })
            } else if (end && isValid(new Date(end))) {
                filters.push({ booking: { returnDate: LessThanOrEqual(new Date(end)) } })
            }
        }

        if (query?.createdAt) {
            const { end, start } = query.createdAt
            if (end && isValid(new Date(end)) && start && isValid(new Date(start))) {
                filters.push({ createdAt: Between(new Date(start), new Date(end)) })
            } else if (start && isValid(new Date(start))) {
                filters.push({ createdAt: MoreThanOrEqual(new Date(start)) })
            } else if (end && isValid(new Date(end))) {
                filters.push({ createdAt: LessThanOrEqual(new Date(end)) })
            }
        }
        if (query?.signedAt) {
            const { end, start } = query.signedAt
            if (end && isValid(new Date(end)) && start && isValid(new Date(start))) {
                filters.push({ signedAt: Between(new Date(start), new Date(end)) })
            } else if (start && isValid(new Date(start))) {
                filters.push({ signedAt: MoreThanOrEqual(new Date(start)) })
            } else if (end && isValid(new Date(end))) {
                filters.push({ signedAt: LessThanOrEqual(new Date(end)) })
            }
        }

        if (Array.isArray(query?.driver) && query?.driver?.length) {
            filters.push({ booking: { driver: { id: In(query.driver) } } })
        }

        if (query?.totalAmount) {
            const { min, max } = query.totalAmount
            if (min && max) {
                filters.push({ booking: { totalAmount: Between(min, max) } })
            } else if (min) {
                filters.push({ booking: { totalAmount: MoreThanOrEqual(min) } })
            } else if (max) {
                filters.push({ booking: { totalAmount: LessThanOrEqual(max) } })
            }
        }

        if (Array.isArray(query.id) && query.id.length) {
            filters.push({ id: In(query.id) })
        }

        if (Array.isArray(query.number) && query.number.length) {
            filters.push({ number: In(query.number) })
        }

        if (query?.search) {
            // Can search contracts  by contract number or booking number
            filters.push({ number: ILike(`%${query.search}%`) }, { booking: { number: ILike(`%${query.search}%`) } })
        }

        return filters
    }
}