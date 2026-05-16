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
    images: ["https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&q=80&w=1000", "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=1000"],
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
    images: ["https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1000", "https://images.unsplash.com/photo-1626847037657-3b28b7faef14?auto=format&fit=crop&q=80&w=1000"],
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
    images: ["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1000"],
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
    images: ["https://images.unsplash.com/photo-1534645229-ea21be3e46c9?auto=format&fit=crop&q=80&w=1000", "https://images.unsplash.com/photo-1629864278434-62725e2e8e04?auto=format&fit=crop&q=80&w=1000"],
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
    images: ["https://images.unsplash.com/photo-1614165507455-89f9d2d0b5cd?auto=format&fit=crop&q=80&w=1000"],
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
    images: ["https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=1000"],
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
    images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1000"],
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
    images: ["https://images.unsplash.com/photo-1621538356950-8b1b2f70b4be?auto=format&fit=crop&q=80&w=1000", "https://images.unsplash.com/photo-1598466810237-7756faffec11?auto=format&fit=crop&q=80&w=1000"],
    pricingTiers: [
      { durationHrs: 12, price: 500, kmLimit: 100, extraKmCharge: 4 },
      { durationHrs: 24, price: 900, kmLimit: 200, extraKmCharge: 4 },
    ],
    createdAt: Date.now()
  }
];
