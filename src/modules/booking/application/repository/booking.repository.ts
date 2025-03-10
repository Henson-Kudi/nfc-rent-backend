import { Booking } from "@/common/entities";
import { Service } from "typedi";
import { Repository } from "typeorm";

@Service()
export class BookingRepository extends Repository<Booking> { }