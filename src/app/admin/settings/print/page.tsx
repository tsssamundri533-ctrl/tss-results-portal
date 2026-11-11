
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Save, 
  Loader2, 
  Layout,
  Contact,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useSchoolStore } from '@/store/use-school-store';
import { useToast } from '@/hooks/use-toast';
import { PrintConfig } from '@/types';
import { cn } from '@/lib/utils';
import { updateSchoolSettings } from '@/lib/supabase-service';

export default function PrintSettingsPage() {
  const { toast } = useToast();
  const { settings, setSettings } = useSchoolStore();

  const [config, setConfig] = useState<Partial<PrintConfig>>({
    showLogoOnPrints: true,
    showStampOnResults: false,
    showSignatureOnResults: true,
    showAddressOnPrints: true,
    showPhoneOnPrints: true,
    showEmailOnPrints: true,
    resultCardOrientation: 'portrait',
    rollSlipPerPage: 2,
    rollNumberSlipInstructions: '',
  });

  const isInitialized = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (settings?.printConfig && !isInitialized.current) {
      setConfig(prev => ({ ...prev, ...settings.printConfig }));
      isInitialized.current = true;
    }
  }, [settings]);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const ok = await updateSchoolSettings({ printConfig: config });
      if (ok && settings) {
        setSettings({ ...settings, printConfig: config as any });
      }
      toast({ title: "PDF Configuration Saved", description: "Document layouts updated successfully." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 px-4 sm:px-0 mt-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">Document Protocol</h1>
          <p className="text-muted-foreground font-medium">Fine-tune PDF generation logic for official institutional output.</p>
        </div>
        <Button onClick={handleSave} disabled={submitting} className="rounded-full shadow-lg h-12 px-10 gap-2 bg-primary-600 hover:bg-primary-700 font-bold text-white transition-all">
           {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
           Save Layouts
        </Button>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-8">
          <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
            <CardHeader className="p-8 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
               <CardTitle className="text-xl dark:text-white">Branding Assets</CardTitle>
               <CardDescription className="dark:text-slate-400">Control visibility of identity markers on PDF outputs.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
               <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold dark:text-white">Institutional Logo</Label>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Show school logo on document headers</p>
                  </div>
                  <Switch 
                    checked={config.showLogoOnPrints ?? true} 
                    onCheckedChange={val => setConfig({...config, showLogoOnPrints: val})} 
                  />
               </div>
               <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold dark:text-white">Principal Signature</Label>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Include signatures on result cards</p>
                  </div>
                  <Switch 
                    checked={config.showSignatureOnResults ?? true} 
                    onCheckedChange={val => setConfig({...config, showSignatureOnResults: val})} 
                  />
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
            <CardHeader className="p-8 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
               <div className="flex items-center gap-3">
                 <Contact className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                 <CardTitle className="text-xl dark:text-white">Contact Visibility</CardTitle>
               </div>
               <CardDescription className="dark:text-slate-400">Choose which contact details appear on official prints.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
               <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <Label className="text-sm font-bold dark:text-white">Show Physical Address</Label>
                  <Switch 
                    checked={config.showAddressOnPrints ?? true} 
                    onCheckedChange={val => setConfig({...config, showAddressOnPrints: val})} 
                  />
               </div>
               <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <Label className="text-sm font-bold dark:text-white">Show Phone Number</Label>
                  <Switch 
                    checked={config.showPhoneOnPrints ?? true} 
                    onCheckedChange={val => setConfig({...config, showPhoneOnPrints: val})} 
                  />
               </div>
               <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <Label className="text-sm font-bold dark:text-white">Show Official Email</Label>
                  <Switch 
                    checked={config.showEmailOnPrints ?? true} 
                    onCheckedChange={val => setConfig({...config, showEmailOnPrints: val})} 
                  />
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
            <CardHeader className="p-8 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
               <CardTitle className="text-xl dark:text-white">Terms & Instructions</CardTitle>
               <CardDescription className="dark:text-slate-400">Custom boilerplate text for roll number slips.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Roll Slip Policy</Label>
                  <Textarea 
                    value={config.rollNumberSlipInstructions || ""}
                    onChange={e => setConfig({...config, rollNumberSlipInstructions: e.target.value})}
                    placeholder="Enter examination day instructions..."
                    className="rounded-3xl bg-slate-50 dark:bg-white/5 border-none min-h-[120px] px-6 py-4 text-sm dark:text-white"
                  />
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-8">
           <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
              <CardHeader className="p-8 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                <CardTitle className="text-xl dark:text-white">A4 Geometry</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Result Orientation</Label>
                    <Select value={config.resultCardOrientation} onValueChange={val => setConfig({...config, resultCardOrientation: val as any})}>
                       <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-navy-950 border-none px-4 font-bold dark:text-white">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-card">
                          <SelectItem value="portrait" className="font-bold">Portrait (Standard)</SelectItem>
                          <SelectItem value="landscape" className="font-bold">Landscape (Wide)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-xl rounded-[2.5rem] bg-navy-900 dark:bg-navy-950 text-white overflow-hidden border border-white/5">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                   <CardTitle className="text-lg font-outfit">Canvas Preview</CardTitle>
                   <Layout className="h-5 w-5 text-primary-400" />
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0 flex flex-col items-center">
                 <div className={cn(
                   "bg-white rounded-lg border-2 border-primary-400/20 shadow-2xl transition-all duration-500 flex flex-col gap-2 p-2",
                   config.resultCardOrientation === 'portrait' ? "w-32 h-44" : "w-44 h-32"
                 )}>
                    <div className="h-3 w-full bg-slate-100 rounded-sm" />
                    <div className="flex-1 w-full bg-slate-50/50 rounded-sm border border-dashed border-slate-100" />
                 </div>
                 <p className="mt-6 text-[10px] font-black uppercase text-white/40 tracking-widest">A4 Scale Simulation</p>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
