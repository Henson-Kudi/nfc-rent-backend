export const BookingEvents = {
  bookingCreated: 'booking.created',
  bookingUpdated: 'booking.updated',
  bookingDeleted: 'booking.deleted',
  bookingStatusUpdated: 'booking.status.updated',
  bookingStatusChanged: 'booking.status.changed',
  bookingConfirmed: 'booking.confirmed',
  bookingCancelled: 'booking.cancelled',
  bookingCompleted: 'booking.completed',
  bookingStarted: 'booking.started',
  contract: {
    created: 'booking.contract.created',
    updated: 'booking.contract.updated',
    deleted: 'booking.contract.deleted',
    voilations: {
      created: 'booking.contract.voilation.created',
      updated: 'booking.contract.voilation.updated',
      deleted: 'booking.contract.voilation.deleted',
      paid: 'booking.contract.voilation.paid',
      deducted: 'booking.contract.voilation.deducted',

      chargeSettingCreated: 'booking.contract.voilation.charge_setting.created',
      chargeSettingUpdated: 'booking.contract.voilation.charge_setting.updated',
      chargeSettingDeleted: 'booking.contract.voilation.charge_setting.deleted',
    },
    securityDepositPaid: 'booking.contract.security_deposit.paid',
    securityDepositRefunded: 'booking.contract.security_deposit.refunded',
  },
};
