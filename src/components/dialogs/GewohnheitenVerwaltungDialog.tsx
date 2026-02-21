import { useState, useEffect } from 'react';
import type { GewohnheitenVerwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface GewohnheitenVerwaltungDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: GewohnheitenVerwaltung['fields']) => Promise<void>;
  defaultValues?: GewohnheitenVerwaltung['fields'];
}

export function GewohnheitenVerwaltungDialog({ open, onClose, onSubmit, defaultValues }: GewohnheitenVerwaltungDialogProps) {
  const [fields, setFields] = useState<Partial<GewohnheitenVerwaltung['fields']>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as GewohnheitenVerwaltung['fields']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Gewohnheiten-Verwaltung bearbeiten' : 'Gewohnheiten-Verwaltung hinzufügen'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gewohnheit_name">Name der Gewohnheit</Label>
            <Input
              id="gewohnheit_name"
              value={fields.gewohnheit_name ?? ''}
              onChange={e => setFields(f => ({ ...f, gewohnheit_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beschreibung">Beschreibung</Label>
            <Textarea
              id="beschreibung"
              value={fields.beschreibung ?? ''}
              onChange={e => setFields(f => ({ ...f, beschreibung: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zielzeit_minuten">Zielzeit pro Tag (in Minuten)</Label>
            <Input
              id="zielzeit_minuten"
              type="number"
              value={fields.zielzeit_minuten ?? ''}
              onChange={e => setFields(f => ({ ...f, zielzeit_minuten: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Speichern...' : defaultValues ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}