export type GenerationStatus =
  | "pending"
  | "generating"
  | "completed"
  | "failed";

export interface LatLng {
  lat: number;
  lng: number;
  height?: number;
}

export interface PolygonPoint {
  longitude: number;
  latitude: number;
  height?: number;
}

export interface ModelTransform {
  scale: number;
  heading: number;
  heightOffset: number;
  pitch?: number;
  roll?: number;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  generation_count: number;
  free_generations_remaining: number;
  credit_balance: number;
  has_completed_tour: boolean;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  prompt: string;
  share_id: string;
  polygon: PolygonPoint[];
  centroid: LatLng;
  area_acres: number;
  model_url: string | null;
  thumbnail_url: string | null;
  meshy_task_id: string | null;
  status: GenerationStatus;
  model_transform: ModelTransform;
  location_name: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeshyTask {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED";
  progress: number;
  model_urls?: {
    glb?: string;
    fbx?: string;
    obj?: string;
    usdz?: string;
  };
  thumbnail_url?: string;
  task_error?: { message?: string };
}

export type StudioMode =
  | "navigate"
  | "draw"
  | "measure"
  | "edit-model";

export type CameraPreset =
  | "birds-eye"
  | "ground"
  | "golden-hour"
  | "dramatic-sunset";

export interface LayerToggles {
  model: boolean;
  shadows: boolean;
  wireframe: boolean;
  terrainDetails: boolean;
  polygon: boolean;
}

export const PROMPT_EXAMPLES = [
  {
    label: "Theme Park",
    prompt:
      "A vibrant modern theme park with roller coasters, colorful rides, castle entrance, and tree-lined pathways, realistic architecture",
  },
  {
    label: "Modern Hospital",
    prompt:
      "A sleek contemporary hospital campus with glass facade, helipad, landscaped courtyards, and modern medical buildings",
  },
  {
    label: "Data Center",
    prompt:
      "A large hyperscale data center campus with server halls, cooling towers, solar arrays, security fencing, and loading docks",
  },
  {
    label: "Luxury Community",
    prompt:
      "A luxury residential community with modern villas, swimming pools, tree-lined streets, clubhouse, and landscaped parks",
  },
  {
    label: "Industrial Park",
    prompt:
      "A clean industrial park with modern warehouses, distribution centers, truck courts, and green buffer zones",
  },
  {
    label: "University Campus",
    prompt:
      "A beautiful university campus with academic buildings, library tower, quads, dormitories, and pedestrian plazas",
  },
  {
    label: "Sports Complex",
    prompt:
      "A multi-sport complex with stadium, soccer fields, basketball courts, parking, and spectator facilities",
  },
  {
    label: "Solar Farm",
    prompt:
      "A large solar energy farm with rows of photovoltaic panels, substations, access roads, and maintenance buildings",
  },
] as const;

export const SURPRISE_PROMPTS = [
  "A futuristic eco-village with geodesic domes, vertical gardens, and wind turbines integrated into the landscape",
  "An open-air art museum campus with sculpture gardens, glass pavilions, and reflecting pools",
  "A boutique winery estate with tasting hall, barrel caves, vineyards, and stone villa",
  "A high-tech research campus with glass labs, amphitheater, and innovation plaza",
  "A luxury desert resort with spa, infinity pools, villas, and palm courtyards",
  "A mega logistics hub with automated warehouses, drone ports, and solar rooftops",
  "A revitalized town square with mixed-use buildings, fountain plaza, and market hall",
  "An advanced battery manufacturing campus with clean rooms, rail spur, and visitor center",
] as const;

export const ACRE_PRESETS = [5, 10, 25, 50] as const;

/** Texas Hill Country near Fredericksburg — scenic open land, strong 3D tile coverage */
export const DEFAULT_CAMERA = {
  longitude: -98.8719,
  latitude: 30.2752,
  height: 2500,
  heading: 25,
  pitch: -35,
  roll: 0,
} as const;

export const FREE_GENERATION_LIMIT = 3;

export const CREDIT_PLANS = [
  {
    id: "starter",
    name: "Starter",
    credits: 5,
    price: 9,
    description: "5 AI generations — perfect for exploring ideas",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 20,
    price: 29,
    description: "20 generations — for serious land studies",
    popular: true,
  },
  {
    id: "studio",
    name: "Studio",
    credits: 60,
    price: 69,
    description: "60 generations — full studio power",
  },
] as const;
