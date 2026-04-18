export interface Vehicle {
    id: string;
    code: string;
    name: string;
    status: string;
    vehicle_type?: string;
}

export interface Inspection {
    id: string;
    vehicle_id: string | null;
    fire_extinguisher_id: string | null;
    tanggal: string;
    status: string;
    created_at: string;
    // Joined fields
    inspector_name?: string;
    vehicle_code?: string;
    fire_extinguisher_serial?: string;
}

export interface InspectionTemplate {
    id: number;
    name: string;
    target_type: string;
    frequency: string;
}

export interface TemplateItem {
    id: number;
    template_id: number;
    category: string;
    item_name: string;
    item_order: number;
}

export interface InspectionResult {
    id: string;
    inspection_id: string;
    inspection_date: string;
    template_item_id: number;
    result: string;
    notes: string | null;
    photo_url: string | null;
    created_at: string;
    // Joined fields
    item_name?: string;
    category?: string;
}

export interface InspectionDetail {
    inspection: Inspection;
    results: InspectionResult[];
}

export type ResultOption = 'PASS' | 'FAIL' | 'N_A';

export interface ChecklistEntry {
    result: ResultOption;
    notes: string;
}

export interface OperationalContext {
    shift_name: string | null;
    duty_position: string | null;
    assigned_vehicle: string | null;
    assigned_vehicle_id: string | null;
    duty_status: string;
}
