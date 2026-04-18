import { useState, useCallback, useEffect } from 'react';
import { api } from '../lib/axios';
import type { FireExtinguisher, Inspection, InspectionDetail } from '../types/fireExtinguisher';
import toast from 'react-hot-toast';
import { getLocalISODate } from '../utils/dateFormatter';

export const useFireExtinguishers = () => {
  const [items, setItems] = useState<FireExtinguisher[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Inspection State
  const [selectedApar, setSelectedApar] = useState<FireExtinguisher | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [templateItems, setTemplateItems] = useState<any[]>([]);
  const [checklistResults, setChecklistResults] = useState<Record<number, any>>({});
  const [inspectDate, setInspectDate] = useState('');
  const [detailData, setDetailData] = useState<InspectionDetail | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsRes, insRes] = await Promise.all([
        api.get('/fire-extinguishers'),
        api.get('/inspections')
      ]);
      setItems(itemsRes.data);
      setInspections(insRes.data.filter((i: Inspection) => i.fire_extinguisher_id !== null));
    } catch (err) {
      console.error('Failed to fetch data', err);
      toast.error('Failed to synchronize tactical assets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (form: any, captureLocation: () => Promise<any>) => {
    try {
      setSubmitting(true);
      let finalLat = form.latitude;
      let finalLng = form.longitude;
      
      try {
        const freshPos = await captureLocation();
        finalLat = freshPos.lat;
        finalLng = freshPos.lng;
      } catch (gpsErr) {
        console.warn('Final GPS refresh failed', gpsErr);
      }

      const res = await api.post('/fire-extinguishers', {
        ...form,
        capacity_kg: parseFloat(form.capacity_kg),
        latitude: finalLat,
        longitude: finalLng,
      });

      toast.success('Asset registration successful.');
      fetchData();
      return res.data;
    } catch (err: any) {
      console.error('Registration Error:', err);
      const serverMsg = err.response?.data || err.message || 'Operation failed';
      toast.error(`Registration Refused: ${serverMsg}`);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const openInspectModal = async (apar: FireExtinguisher) => {
    try {
      setLoading(true);
      setSelectedApar(apar);
      setInspectDate(getLocalISODate());
      
      const templatesRes = await api.get('/inspections/templates');
      const aparTemplate = templatesRes.data.find((t: any) => t.target_type === 'FIRE_EXTINGUISHER');
      
      if (!aparTemplate) {
        toast.error('No inspection template found for Fire Extinguishers.');
        return false;
      }
      setTemplate(aparTemplate);

      const itemsRes = await api.get(`/inspections/templates/${aparTemplate.id}/items`);
      setTemplateItems(itemsRes.data);
      
      const initial: Record<number, any> = {};
      itemsRes.data.forEach((item: any) => {
        initial[item.id] = { result: 'N_A', notes: '' };
      });
      setChecklistResults(initial);
      return true;
    } catch (err) {
      toast.error('Failed to load inspection protocol.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleInspectSubmit = async (captureLocation: () => Promise<any>) => {
    if (!selectedApar) return;

    try {
      setSubmitting(true);
      
      const currentLoc = await captureLocation().catch((e) => {
          console.warn('Audit GPS lock failed, proceeding without location binding', e);
          return null;
      }); 
      
      const results = templateItems.map(item => ({
        template_item_id: item.id,
        result: checklistResults[item.id]?.result || 'N_A',
        notes: checklistResults[item.id]?.notes || null,
        photo_url: null,
      }));

      await api.post('/inspections', {
        fire_extinguisher_id: selectedApar.id,
        tanggal: inspectDate,
        status: 'SUBMITTED',
        template_id: template?.id,
        latitude: currentLoc?.lat,
        longitude: currentLoc?.lng,
        results,
      });

      toast.success('Audit report finalized.');
      setChecklistResults({});
      fetchData();
      return true;
    } catch (err: any) {
      const msg = err.response?.data || 'Failed to finalize audit report';
      toast.error(msg);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReport = async (inspectionId: string) => {
    try {
        const res = await api.get(`/inspections/${inspectionId}`);
        setDetailData(res.data);
        return true;
    } catch (err) {
        toast.error('Failed to fetch inspection details');
        return false;
    }
  };

  return {
    items,
    inspections,
    loading,
    submitting,
    selectedApar,
    setSelectedApar,
    template,
    templateItems,
    checklistResults,
    setChecklistResults,
    inspectDate,
    setInspectDate,
    detailData,
    fetchData,
    handleCreate,
    openInspectModal,
    handleInspectSubmit,
    handleViewReport
  };
};
