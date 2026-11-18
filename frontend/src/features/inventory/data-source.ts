import {
  demoCategories,
  demoCountries,
  demoHotels,
} from './demo-data'
import type { InventoryData } from './types'

export interface InventoryDataSource {
  getInventory(): Promise<InventoryData>
}

export const demoInventoryInitialData: InventoryData = {
  hotels: demoHotels,
  countries: demoCountries,
  categories: demoCategories,
}

export const demoInventoryDataSource: InventoryDataSource = {
  async getInventory() {
    return demoInventoryInitialData
  },
}