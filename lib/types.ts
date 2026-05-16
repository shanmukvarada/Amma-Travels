export type VehicleType = 'car' | 'bike';

export interface PricingTier {
  durationHrs: number;
  price: number;
  kmLimit: number;
  extraKmCharge: number;
  id?: string;
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  name: string;
  model: string;
  year: string;
  capacity?: number;
  description?: string;
  fuelType: 'petrol' | 'diesel' | 'cng' | 'ev' | '';
  images: string[];
  status: 'available' | 'maintenance' | 'on-road';
  pricingTiers: PricingTier[];
  createdAt: any;
  updatedAt: any;
}

export interface Booking {
  id: string;
  vehicleId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  aadhaarDoc?: string; // URL
  dlDoc?: string; // URL
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  userId: string;
  selectedTier: PricingTier;
  totalAmount: number;
  startTime?: any;
  expectedReturnTime?: any;
  actualReturnTime?: any;
  startKm: number;
  endKm: number;
  extraKm: number;
  extraCharges: number;
  finalAmount: number;
  createdAt: any;
  updatedAt: any;
}
