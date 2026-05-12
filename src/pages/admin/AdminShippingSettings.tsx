import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Loader2, Save, Plus, Trash2, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface GovernorateShipping {
  id: string;
  name: string;
  cost: number;
  isActive: boolean;
}

const defaultGovernorates = [
  "صنعاء", "عدن", "تعز", "الحديدة", "إب", "ذمار", "حضرموت", "شبوة",
  "البيضاء", "مأرب", "الجوف", "عمران", "حجة", "صعدة", "أبين",
  "لحج", "الضالع", "المحويت", "ريمة", "سقطرى", "المهرة"
];

export function AdminShippingSettings() {
  const [rates, setRates] = useState<GovernorateShipping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const docRef = doc(db, 'siteSettings', 'shipping');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().rates) {
        setRates(docSnap.data().rates);
      } else {
        // Initialize with default governorates
        const initialRates = defaultGovernorates.map((name, index) => ({
          id: `gov_${index}`,
          name,
          cost: 0,
          isActive: true
        }));
        setRates(initialRates);
      }
    } catch (error) {
      console.error("Error fetching shipping rates:", error);
      toast.error('حدث خطأ أثناء جلب إعدادات التوصيل');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'siteSettings', 'shipping'), { rates });
      toast.success('تم حفظ إعدادات التوصيل بنجاح');
    } catch (error) {
      console.error("Error saving shipping rates:", error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const updateRate = (id: string, field: keyof GovernorateShipping, value: any) => {
    setRates(rates.map(rate => 
      rate.id === id ? { ...rate, [field]: value } : rate
    ));
  };

  const addNewGovernorate = () => {
    const newName = window.prompt('أدخل اسم المحافظة / المنطقة الجديدة:');
    if (newName && newName.trim() !== '') {
      const exists = rates.some(r => r.name === newName.trim());
      if (exists) {
        toast.error('هذه المنطقة موجودة مسبقاً');
        return;
      }
      setRates([
        {
          id: `gov_${Date.now()}`,
          name: newName.trim(),
          cost: 0,
          isActive: true
        },
        ...rates
      ]);
    }
  };

  const removeGovernorate = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف منطقة "${name}"؟`)) {
      setRates(rates.filter(r => r.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-4" />
        <p className="text-slate-500">جاري تحميل إعدادات التوصيل...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">إعدادات الشحن والتوصيل</h1>
          <p className="text-sm md:text-base text-slate-500">حدد أسعار التوصيل لكل محافظة. المحافظات غير المفعلة لن تظهر للعميل.</p>
        </div>
        <button
          onClick={addNewGovernorate}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 md:py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة منطقة جديدة
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rates.map((rate) => (
              <div 
                key={rate.id} 
                className={`p-4 rounded-xl border-2 transition-all ${
                  rate.isActive ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-5 h-5 ${rate.isActive ? 'text-rose-500' : 'text-slate-400'}`} />
                    <span className="font-bold text-slate-900">{rate.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={rate.isActive}
                        onChange={(e) => updateRate(rate.id, 'isActive', e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] hover:after:bg-slate-100 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                    <button 
                      type="button" 
                      onClick={() => removeGovernorate(rate.id, rate.name)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">تكلفة التوصيل (ريال يمني)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={rate.cost || ''}
                      onChange={(e) => updateRate(rate.id, 'cost', parseInt(e.target.value) || 0)}
                      disabled={!rate.isActive}
                      className={`w-full p-2.5 rounded-lg border ${
                        rate.isActive ? 'border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 text-slate-400'
                      }`}
                      placeholder="0"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                      ر.ي
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            type="submit" 
            disabled={saving} 
            className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 min-w-[200px]"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            حفظ إعدادات التوصيل
          </button>
        </div>
      </form>
    </div>
  );
}
