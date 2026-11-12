'use client';

import React, { useState } from 'react';
import ImageDropzone from './ImageDropzone';
import { Save, Trash2, CheckCircle2, Info, Eye } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/siteConfig';

export default function SiteSettingsEditor({ settings = {}, onSave }) {
  // Hero Slider Images (only field sourced from & persisted to Firestore)
  const [heroImages, setHeroImages] = useState(
    Array.isArray(settings?.heroImages) && settings.heroImages.length > 0
      ? settings.heroImages
      : SITE_CONFIG.defaultHeroImages
  );

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleRemoveHeroImage = (idx) => {
    setHeroImages(heroImages.filter((_, i) => i !== idx));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const payload = {
      heroImages: heroImages.filter(Boolean),
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        onSave(data);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch (err) {
      alert('Failed to save hero slider settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl select-none">
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Hero Slider photography saved to Firebase successfully!</span>
        </div>
      )}

      {/* Info notice about static code configuration */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 text-blue-400 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-bold text-white mb-0.5">Database Scope: Hero Slider Only</p>
          <p>
            In accordance with your architecture, all company details (email, phone, address, social links, taglines) are hardcoded directly in the codebase (<code className="px-1.5 py-0.5 bg-blue-950/70 rounded text-blue-200">lib/siteConfig.js</code>) and are not fetched from the database.
            Only the <strong>Hero Slider background slides</strong> below are stored in and sourced from Firebase.
          </p>
        </div>
      </div>

      {/* Hero Section Photography */}
      <div className="bg-[#131D2F] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Homepage Hero Slider Photography (16:10 Cinematic Slides)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            These images rotate in the background at the top of the homepage hero section.
          </p>
        </div>

        <ImageDropzone
          multiple={true}
          value={heroImages}
          onChange={setHeroImages}
          helperText="Drag & drop 16:10 high-resolution cinematic slides here, or click to browse files"
          className="w-full"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {heroImages.map((url, i) => (
            <div
              key={i}
              className="relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Hero slide ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveHeroImage(i)}
                className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 hover:bg-red-600 text-white transition-colors cursor-pointer"
                title="Remove Slide"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-amber-300">
                Slide #{i + 1}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-lg cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving to Firebase...' : 'Save Hero Slides'}</span>
          </button>
        </div>
      </div>

      {/* Read-only reference of the hardcoded Code Configuration */}
      <div className="bg-[#131D2F] border border-slate-800/60 rounded-2xl p-6 space-y-4 opacity-80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Code Configuration Reference (lib/siteConfig.js)
            </h3>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            Hardcoded in Code
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px] font-bold block">Company / Brand</span>
            <p className="font-semibold text-white">{SITE_CONFIG.companyName}</p>
            <p className="text-amber-400 font-mono text-[11px]">{SITE_CONFIG.brandName}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px] font-bold block">Contact Email & Phone</span>
            <p className="font-semibold text-white">{SITE_CONFIG.contactEmail}</p>
            <p className="text-slate-300">{SITE_CONFIG.contactPhone}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px] font-bold block">WhatsApp & Social Links</span>
            <p className="text-emerald-400 truncate">{SITE_CONFIG.socialLinks.whatsapp}</p>
            <p className="text-slate-400 truncate">{SITE_CONFIG.socialLinks.facebook}</p>
            <p className="text-slate-400 truncate">{SITE_CONFIG.socialLinks.instagram}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px] font-bold block">Office Address</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">{SITE_CONFIG.address}</p>
          </div>
        </div>
      </div>
    </form>
  );
}
