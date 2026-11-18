export interface Offer {
  id: string
  property: string
  city: string
  supplier: string
  roomType: string
  board: string
  occupancy: string
  cancellation: string
  cancellationDeadline: string
  total: number
  taxes: number
  availability: string
  payment: string
  perks: string
}

export interface StayDetails {
  checkIn: string
  checkOut: string
  nights: number
}
