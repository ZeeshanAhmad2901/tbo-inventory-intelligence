export type MatchStatus = 'Matched' | 'Needs review' | 'Unmatched'

export interface SupplierListing {
  supplier: string
  listingId: string
  category: string
  lastUpdated: string
}

export interface Hotel {
  id: string
  name: string
  city: string
  country: string
  category: string
  address: string
  status: MatchStatus
  listings: SupplierListing[]
  updated: string
}

export type SortKey = 'name' | 'city' | 'listings' | 'status'
export type SortDirection = 'asc' | 'desc'

export interface InventoryData {
  hotels: Hotel[]
  countries: string[]
  categories: string[]
}
