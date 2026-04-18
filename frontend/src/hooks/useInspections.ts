import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/axios';
import type { 
    Inspection, 
    Vehicle, 
    InspectionTemplate, 
    TemplateItem, 
    OperationalContext, 
    ChecklistEntry
} from '../types/inspection';

export const useInspections = () => {
    const getLocalISODate = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offset).toISOString().split('T')[0];
    };

    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
    const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [opsContext, setOpsContext] = useState<OperationalContext | null>(null);

    // Form States
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [inspectDate, setInspectDate] = useState(getLocalISODate());
    const [checklistResults, setChecklistResults] = useState<Record<number, ChecklistEntry>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
        fetchTemplates();
        fetchOpsContext();
    }, []);

    useEffect(() => {
        if (!selectedTemplate) {
            setTemplateItems([]);
            setChecklistResults({});
            return;
        }

        fetchTemplateItems(Number(selectedTemplate));
    }, [selectedTemplate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [insRes, vehRes] = await Promise.all([
                api.get('/inspections'),
                api.get('/vehicles')
            ]);
            setInspections(insRes.data);
            setVehicles(vehRes.data);
        } catch (err) {
            setError('Failed to fetch data from operational server.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/inspections/templates');
            setTemplates(res.data);
        } catch (err) {
            console.error('Failed to load inspection templates', err);
        }
    };

    const fetchOpsContext = async () => {
        try {
            const res = await api.get('/auth/me/context');
            setOpsContext(res.data);
            
            // Auto-select assigned vehicle if it exists
            if (res.data.assigned_vehicle_id) {
                const vid = res.data.assigned_vehicle_id;
                setSelectedVehicle(vid);
                
                // Intelligent Template Selection
                const vehicle = vehicles.find(v => v.id === vid);
                if (vehicle) {
                    const type = vehicle.vehicle_type || '';
                    const isAmbulance = type === 'RESCUE' || vehicle.code.startsWith('AMB');
                    
                    const templateName = isAmbulance ? 'Daily Ambulance Check' : 'Daily Vehicle Check (ARFF)';
                    const targetTemplate = templates.find(t => t.name === templateName);
                    
                    if (targetTemplate) {
                        setSelectedTemplate(targetTemplate.id.toString());
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch operational context', err);
        }
    };

    const fetchTemplateItems = async (templateId: number) => {
        try {
            const res = await api.get(`/inspections/templates/${templateId}/items`);
            setTemplateItems(res.data);
            const initial: Record<number, ChecklistEntry> = {};
            res.data.forEach((item: TemplateItem) => {
                initial[item.id] = { result: 'N_A', notes: '' };
            });
            setChecklistResults(initial);
        } catch (err) {
            console.error('Failed to load template items', err);
            setTemplateItems([]);
        }
    };

    const resetModal = () => {
        if (!opsContext?.assigned_vehicle_id) {
            setSelectedVehicle('');
        }
        setSelectedTemplate('');
        setInspectDate(getLocalISODate());
        setTemplateItems([]);
        setChecklistResults({});
    };

    const handleCreate = async (onSuccess: () => void) => {
        if (!selectedVehicle || !selectedTemplate) return;

        try {
            setSubmitting(true);
            const results = templateItems.map(item => ({
                template_item_id: item.id,
                result: checklistResults[item.id]?.result || 'N_A',
                notes: checklistResults[item.id]?.notes || null,
                photo_url: null,
            }));

            await api.post('/inspections', {
                vehicle_id: selectedVehicle,
                tanggal: inspectDate,
                status: 'DRAFT',
                template_id: Number(selectedTemplate),
                results,
            });
            onSuccess();
            resetModal();
            fetchData();
        } catch (err: any) {
            const msg = err.response?.data || 'Failed to submit inspection';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const prepareNewInspection = async () => {
        // Re-fetch context to ensure latest assignment is picked up
        try {
            const res = await api.get('/auth/me/context');
            setOpsContext(res.data);
            
            if (!res.data.assigned_vehicle_id) {
                toast.error('SYSTEM ACCESS DENIED: No active vehicle assignment found. Please perform "Shift Check-in" from the Dashboard first to proceed with the audit.');
                return false;
            }

            setSelectedVehicle(res.data.assigned_vehicle_id);
            
            // Intelligent Template Selection logic (locked)
            const vehicle = vehicles.find(v => v.id === res.data.assigned_vehicle_id);
            if (vehicle) {
                const type = vehicle.vehicle_type || '';
                const isAmbulance = type === 'RESCUE' || vehicle.code.startsWith('AMB');
                const templateName = isAmbulance ? 'Daily Ambulance Check' : 'Daily Vehicle Check (ARFF)';
                const targetTemplate = templates.find(t => t.name === templateName);
                if (targetTemplate) {
                    setSelectedTemplate(targetTemplate.id.toString());
                } else {
                    setSelectedTemplate('');
                }
            }

            setInspectDate(getLocalISODate());
            setChecklistResults({});
            return true;
        } catch (err) {
            console.error('Failed to fetch operational context', err);
            return false;
        }
    };

    return {
        inspections,
        vehicles,
        templates,
        templateItems,
        loading,
        error,
        opsContext,
        selectedVehicle,
        setSelectedVehicle,
        selectedTemplate,
        setSelectedTemplate,
        inspectDate,
        setInspectDate,
        checklistResults,
        setChecklistResults,
        submitting,
        fetchData,
        fetchTemplates,
        fetchOpsContext,
        handleCreate,
        getLocalISODate,
        resetModal,
        prepareNewInspection
    };
};
