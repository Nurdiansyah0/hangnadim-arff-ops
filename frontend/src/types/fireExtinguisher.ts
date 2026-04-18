export interface FireExtinguisher {
  id: string;
  serial_number: string;
  agent_type: string;
  capacity_kg: number;
  location_description: string | null;
  floor: string | null;
  building: string | null;
  expiry_date: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Inspection {
    id: string;
    vehicle_id: string | null;
    fire_extinguisher_id: string | null;
    tanggal: string;
    status: string;
    created_at: string;
    inspector_name?: string;
    fire_extinguisher_serial?: string;
}

export interface InspectionResult {
    id: string;
    item_name?: string;
    category?: string;
    result: string;
    notes: string | null;
    template_item_id: number;
}

export interface InspectionDetail {
    inspection: Inspection;
    results: InspectionResult[];
}
