import { useState, useEffect } from 'react';
import type { TaeglicherCheckIn, GewohnheitenVerwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface TaeglicherCheckInDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: TaeglicherCheckIn['fields']) => Promise<void>;
  defaultValues?: TaeglicherCheckIn['fields'];
  gewohnheiten_verwaltungList: GewohnheitenVerwaltung[];
}

export function TaeglicherCheckInDialog({ open, onClose, onSubmit, defaultValues, gewohnheiten_verwaltungList }: TaeglicherCheckInDialogProps) {
  const [fields, setFields] = useState<Partial<TaeglicherCheckIn['fields']>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as TaeglicherCheckIn['fields']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Täglicher Check-in bearbeiten' : 'Täglicher Check-in hinzufügen'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checkin_datum">Datum</Label>
            <Input
              id="checkin_datum"
              type="date"
              value={fields.checkin_datum ?? ''}
              onChange={e => setFields(f => ({ ...f, checkin_datum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gewohnheiten">Welche Gewohnheiten hast du heute ausgeführt?</Label>
            <Select
              value={extractRecordId(fields.gewohnheiten) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, gewohnheiten: v === 'none' ? undefined : createRecordUrl(APP_IDS.GEWOHNHEITEN_VERWALTUNG, v) }))}
            >
              <SelectTrigger id="gewohnheiten"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {gewohnheiten_verwaltungList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.gewohnheit_name ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zeit_investiert">Investierte Zeit (in Minuten)</Label>
            <Input
              id="zeit_investiert"
              type="number"
              value={fields.zeit_investiert ?? ''}
              onChange={e => setFields(f => ({ ...f, zeit_investiert: e.target.value ? Number(e.target.value) : undefined }))}
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