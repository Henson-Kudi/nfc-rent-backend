import { UpdateUserSchema } from "../../utils/validations/user"

export class UpdateUserDTO {
    constructor(data: UpdateUserData) {
        Object.assign(this, data)
    }

    fullName?: string
    photo?: string

    validate() {
        return UpdateUserSchema.validateAsync(this)
    }
}