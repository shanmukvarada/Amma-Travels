import { Vehicle } from "./types";

export const seedVehicles: Vehicle[] = [
  {
    id: "seed-hundai-i20",
    name: "Hyundai i20",
    model: "Asta MT",
    year: "2023",
    type: "car",
    capacity: 5,
    fuelType: "petrol",
    status: "available",
    description: "A premium hatchback with great styling, spacious interior, and an excellent sound system. Perfect for city driving and weekend getaways.",
    images: ["https://picsum.photos/seed/i20-1/1000/600", "https://picsum.photos/seed/i20-2/1000/600"],
    pricingTiers: [
      { durationHrs: 12, price: 1200, kmLimit: 120, extraKmCharge: 10 },
      { durationHrs: 24, price: 2200, kmLimit: 250, extraKmCharge: 10 },
    ],
    createdAt: Date.now()
  },
  {
    id: "seed-re-classic",
    name: "Royal Enfield Classic 350",
    model: "Signals Edition",
    year: "2024",
    type: "bike",
    capacity: 2,
    fuelType: "petrol",
    status: "available",
    description: "Experience the timeless styling and pure motorcycling feel. Good torque and comfortable riding position for cruising.",
    images: ["https://picsum.photos/seed/classic-1/1000/600", "https://picsum.photos/seed/classic-2/1000/600"],
    pricingTiers: [
      { durationHrs: 12, price: 700, kmLimit: 100, extraKmCharge: 5 },
      { durationHrs: 24, price: 1200, kmLimit: 200, extraKmCharge: 5 },
    ],
    createdAt: Date.now()
  },
  {
    id: "seed-swift",
    name: "Maruti Suzuki Swift",
    model: "ZXI",
    year: "2022",
    type: "car",
    capacity: 5,
    fuelType: "petrol",
    status: "available",
    description: "The nation's favorite hatchback! Zippy, extremely reliable, and amazing fuel efficiency.",
    images: ["https://picsum.photos/seed/swift-1/1000/600"],
    pricingTiers: [
      { durationHrs: 12, price: 1000, kmLimit: 120, extraKmCharge: 8 },
      { durationHrs: 24, price: 1800, kmLimit: 250, extraKmCharge: 8 },
    ],
    createdAt: Date.now()
  },
  {
    id: "seed-thar",
    name: "Mahindra Thar",
    model: "LX 4x4 MT",
    year: "2023",
    type: "car",
    capacity: 4,
    fuelType: "diesel",
    status: "available",
    description: "The ultimate off-roader! Explore tough terrains with ease in this 4x4 convertible. Highly capable and incredibly fun.",
    images: ["https://picsum.photos/seed/thar-1/1000/600", "https://picsum.photos/seed/thar-2/1000/600"],
    pricingTiers: [
      { durationHrs: 12, price: 3000, kmLimit: 120, extraKmCharge: 15 },
      { durationHrs: 24, price: 5000, kmLimit: 250, extraKmCharge: 15 },
    ],
    createdAt: Date.now()
  },
  {
    id: "seed-ktm-duke",
    name: "KTM Duke 390",
    model: "Gen 3",
    year: "2023",
    type: "bike",
    capacity: 2,
    fuelType: "petrol",
    status: "available",
    description: "The corner rocket. Super lightweight, incredibly agile, and packs serious punch for thrill-seekers.",
    images: ["https://picsum.photos/seed/duke-1/1000/600"],
    pricingTiers: [
      { durationHrs: 12, price: 1200, kmLimit: 120, extraKmCharge: 7 },
      { durationHrs: 24, price: 2000, kmLimit: 220, extraKmCharge: 7 },
    ],
    createdAt: Date.now()
  },
  {
    id: "seed-city",
    name: "Honda City",
    model: "ZX CVT",
    year: "2024",
    type: "car",
    capacity: 5,
    fuelType: "petrol",
    status: "available",
    description: "Executive sedan with superb space, smooth automatic transmission, and Honda's signature reliability. Ideal for business trips or family rides.",
    images: ["https://picsum.photos/seed/city-1/1000/600"],
    pricingTiers: [
      { durationHrs: 12, price: 1800, kmLimit: 150, extraKmCharge: 12 },
      { durationHrs: 24, price: 3200, kmLimit: 300, extraKmCharge: 12 },
    ],
    createdAt: Date.now()
  },
  {
    id: "seed-innova",
    name: "Toyota Innova Crysta",
    model: "2.4 ZX",
    year: "2022",
    type: "car",
    capacity: 7,
    fuelType: "diesel",
    status: "available",
    description: "The absolute king of comfort. 7-seater MPV offering unmatched comfort on long journeys and bulletproof reliability.",
    images: ["https://picsum.photos/seed/innova-1/1000/600"],
    pricingTiers: [
      { durationHrs: 12, price: 2500, kmLimit: 150, extraKmCharge: 15 },
      { durationHrs: 24, price: 4500, kmLimit: 300, extraKmCharge: 15 },
    ],
    createdAt: Date.now()
  },
  {
    id: "seed-mt15",
    name: "Yamaha MT-15",
    model: "V2.0",
    year: "2023",
    type: "bike",
    capacity: 2,
    fuelType: "petrol",
    status: "available",
    description: "A dark warrior! Liquid-cooled, extremely refined engine designed for agility and hyper-naked street riding.",
    images: ["https://picsum.photos/seed/mt15-1/1000/600", "https://picsum.photos/seed/mt15-2/1000/600"],
    pricingTiers: [
      { durationHrs: 12, price: 500, kmLimit: 100, extraKmCharge: 4 },
      { durationHrs: 24, price: 900, kmLimit: 200, extraKmCharge: 4 },
    ],
    createdAt: Date.now()
  }
];
