import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { 
  Banknote, 
  Save, 
  Stethoscope, 
  BedDouble, 
  Activity, 
  Microscope,
  RotateCcw
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function RevenueSettings() {
  const [pricing, setPricing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const data = await apiService.getPricing();
      setPricing(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handlePriceChange = (name: string, price: string) => {
    setPricing(prev => prev.map(p => 
      p.name === name ? { ...p, price: parseFloat(price) || 0 } : p
    ));
  };

  const savePricing = async (item: any) => {
    setSaving(true);
    try {
      await apiService.updatePricing({
        name: item.name,
        category: item.category,
        price: item.price
      });
      alert(`Updated ${item.name} successfully`);
    } catch (err) {
      alert('Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-400 font-bold">Loading pricing data...</div>;

  const clinicalPricing = pricing.filter(p => p.category === 'clinical');
  const wardPricing = pricing.filter(p => p.category === 'ward');
  const investigationPricing = pricing.filter(p => p.category === 'investigation');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Revenue & Pricing Configuration</h1>
          <p className="text-gray-400 font-bold text-sm tracking-tight">Set hospital fees, consultation rates and investigation costs</p>
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
          <Banknote size={24} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Core Services */}
        <section className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Stethoscope size={20} />
              </div>
              Core Hospital Fees
            </h2>
            <div className="space-y-4">
              {clinicalPricing.map(item => (
                <PriceItem key={item.name} item={item} onChange={handlePriceChange} onSave={savePricing} />
              ))}
              {wardPricing.map(item => (
                <PriceItem key={item.name} item={item} onChange={handlePriceChange} onSave={savePricing} />
              ))}
            </div>
          </div>
        </section>

        {/* Diagnostics & Investigations */}
        <section className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Microscope size={20} />
              </div>
              Diagnostic Tariffs
            </h2>
            <div className="space-y-4">
              {investigationPricing.map(item => (
                <PriceItem key={item.name} item={item} onChange={handlePriceChange} onSave={savePricing} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function PriceItem({ item, onChange, onSave }: any) {
  return (
    <div className="p-5 bg-gray-50 rounded-2xl flex items-center justify-between group">
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{item.name.replace(/_/g, ' ')}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-gray-900">₦</span>
          <input 
            type="number"
            className="bg-transparent border-none outline-none font-black text-xl text-gray-800 w-32 focus:ring-0"
            value={item.price}
            onChange={(e) => onChange(item.name, e.target.value)}
          />
        </div>
      </div>
      <button 
        onClick={() => onSave(item)}
        className="p-3 bg-white text-blue-600 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
      >
        <Save size={18} />
      </button>
    </div>
  );
}
