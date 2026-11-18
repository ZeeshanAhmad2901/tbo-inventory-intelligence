import {
  demoOffers,
  demoProperties,
  demoStay,
  demoSuppliers,
} from './demo-data'
import type { Offer, StayDetails } from './types'

export interface OffersData {
  offers: Offer[]
  stay: StayDetails
  properties: string[]
  suppliers: string[]
}

export interface OffersDataSource {
  getOffers(): Promise<OffersData>
}

export const demoOffersInitialData: OffersData = {
  offers: demoOffers,
  stay: demoStay,
  properties: demoProperties,
  suppliers: demoSuppliers,
}

export const demoOffersDataSource: OffersDataSource = {
  async getOffers() {
    return demoOffersInitialData
  },
}
