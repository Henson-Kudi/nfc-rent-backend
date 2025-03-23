import logger from "@/common/utils/logger"

export const handleBookingCancelledEvent:MessageHandler = (msg, channel)=>{
    try {
        const data = JSON.parse(msg)?.data

        if (!data || !data?.booking || !data?.actor) {
            throw new Error('Invalid booking')
        }

        // Send email to user and super admin that booking has been cancelled
        
    } catch (err) {
        logger.error(`Unable to handle event: ${channel}`, err)
    }
}