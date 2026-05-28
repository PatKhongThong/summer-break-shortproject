import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface LandListing {
  id: string;
  title: string;
  price: number;
  location: string;
  size: number; // in Acres
  zoning: string; // Agricultural, Residential, Commercial, Conservation
  waterStatus: "Available" | "Well Required" | "Public Tap" | "Seaside Access";
  powerStatus: "Grid Connected" | "Off-Grid Solar" | "Street-Adjacent" | "Full Utility Box";
  roadAccess: "Paved Frontage" | "Gravel Access" | "Dirt Road" | "Easement Only";
  soilType: string;
  yieldRating: "High Investment" | "Steady Development" | "Conservation Tax-Shelter";
  description: string;
  imageUrl: string;
  plotId: string; // Maps to SVG coordinates
  featured: boolean;
}

export const mockLandListings: LandListing[] = [
  {
    id: "land-1",
    title: "Whispering Pines Ridge Tract",
    price: 320000,
    location: "Steamboat Springs, CO",
    size: 15.4,
    zoning: "Agricultural (A-1)",
    waterStatus: "Well Required",
    powerStatus: "Street-Adjacent",
    roadAccess: "Paved Frontage",
    soilType: "Rich Loam & Granite",
    yieldRating: "Steady Development",
    description: "An elegant, high-elevation alpine parcel boasting mature timber stands, a year-round spring brook, and unmatched panoramas of the valley below. Ideal for a private sanctuary or high-yield timber cultivation.",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    plotId: "plot-4",
    featured: true
  },
  {
    id: "land-2",
    title: "Golden Silt Valley Farmstead",
    price: 680000,
    location: "Napa Valley, CA",
    size: 32.8,
    zoning: "Agricultural (A-1)",
    waterStatus: "Available",
    powerStatus: "Grid Connected",
    roadAccess: "Paved Frontage",
    soilType: "Rich Silt & Organic Clay",
    yieldRating: "High Investment",
    description: "World-class agricultural acreage with premium water rights, featuring a mineral-dense sandy loam topsoil specifically tested for viticulture or high-intensity organic produce cultivation. Ready for immediate development.",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    plotId: "plot-1",
    featured: true
  },
  {
    id: "land-3",
    title: "Emerald Glade Conservation Plot",
    price: 185000,
    location: "Berkshire Hills, MA",
    size: 8.5,
    zoning: "Conservation (C-2)",
    waterStatus: "Public Tap",
    powerStatus: "Off-Grid Solar",
    roadAccess: "Gravel Access",
    soilType: "Sandy Silty Loam",
    yieldRating: "Conservation Tax-Shelter",
    description: "Protected forest sanctuary featuring dense oak cover and an active native biosphere. Eligible for state-funded conservation grants and substantial tax incentives while supporting seasonal micro-cabins.",
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    plotId: "plot-5",
    featured: false
  },
  {
    id: "land-4",
    title: "Seaside Crest Cliffside Tract",
    price: 1450000,
    location: "Big Sur, CA",
    size: 12.2,
    zoning: "Residential Luxury",
    waterStatus: "Seaside Access",
    powerStatus: "Full Utility Box",
    roadAccess: "Paved Frontage",
    soilType: "Rocky Clay & Sandstone",
    yieldRating: "High Investment",
    description: "An extraordinary high-cliff coastal frontage offering sheer drop views over the crashing Pacific waves. The soil composite is highly stabilized, making it ready for architectural residential engineering.",
    imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    plotId: "plot-6",
    featured: true
  },
  {
    id: "land-5",
    title: "Redwood Canopy Haven",
    price: 490000,
    location: "Humboldt County, CA",
    size: 22.4,
    zoning: "Conservation (C-2)",
    waterStatus: "Well Required",
    powerStatus: "Off-Grid Solar",
    roadAccess: "Gravel Access",
    soilType: "Rich Forest Duff",
    yieldRating: "Conservation Tax-Shelter",
    description: "Towering redwood giants canopy this pristine conservation block. Private dirt pathway connects to local state road easement. High potential carbon offset credits eligibility.",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    plotId: "plot-2",
    featured: false
  },
  {
    id: "land-6",
    title: "Highland Pasture Meadow",
    price: 295000,
    location: "Bend, OR",
    size: 18.2,
    zoning: "Agricultural (A-1)",
    waterStatus: "Available",
    powerStatus: "Grid Connected",
    roadAccess: "Paved Frontage",
    soilType: "Sandy Loam & Volcanic Ash",
    yieldRating: "Steady Development",
    description: "Gorgeous, flat meadow with volcanic soil signatures rich in trace minerals. Ideal for grazing herds, active alfalfa crop cycles, or building an off-grid modern homestead with solar fields.",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    plotId: "plot-3",
    featured: false
  }
];

// Supabase fetching helper with graceful local fallback
export async function getLandListings() {
  if (!isSupabaseConfigured) {
    return { data: mockLandListings, source: "fallback_no_keys" };
  }

  try {
    const { data, error } = await supabase
      .from("land_listings")
      .select("*")
      .order("price", { ascending: true });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return { data: mockLandListings, source: "fallback_empty_table" };
    }

    // Map database snake_case keys to camelCase interface
    const mappedData = data.map((item: any) => ({
      id: item.id.toString(),
      title: item.title,
      price: Number(item.price),
      location: item.location,
      size: Number(item.size),
      zoning: item.zoning,
      waterStatus: item.water_status,
      powerStatus: item.power_status,
      roadAccess: item.road_access,
      soilType: item.soil_type || "Untested Loam",
      yieldRating: item.yield_rating,
      description: item.description,
      imageUrl: item.image_url,
      plotId: item.plot_id || "plot-4",
      featured: !!item.featured
    }));

    return { data: mappedData, source: "supabase" };
  } catch (err) {
    console.error("Supabase land listings query failed. Using local fallback data: ", err);
    return { data: mockLandListings, source: "fallback_error" };
  }
}
