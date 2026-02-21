import { useState, useEffect } from 'react';
import type { TaeglicheEintraege, GewohnheitenVerwaltung } from '@/types/app';
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
import { Checkbox } from '@/components/ui/checkbox';

interface TaeglicheEintraegeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: TaeglicheEintraege['fields']) => Promise<void>;
  defaultValues?: TaeglicheEintraege['fields'];
  gewohnheiten_verwaltungList: GewohnheitenVerwaltung[];
}

export function TaeglicheEintraegeDialog({ open, onClose, onSubmit, defaultValues, gewohnheiten_verwaltungList }: TaeglicheEintraegeDialogProps) {
  const [fields, setFields] = useState<Partial<TaeglicheEintraege['fields']>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as TaeglicheEintraege['fields']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Tägliche Einträge bearbeiten' : 'Tägliche Einträge hinzufügen'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="datum">Datum</Label>
            <Input
              id="datum"
              type="date"
              value={fields.datum ?? ''}
              onChange={e => setFields(f => ({ ...f, datum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gewohnheit">Gewohnheit</Label>
            <Select
              value={extractRecordId(fields.gewohnheit) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, gewohnheit: v === 'none' ? undefined : createRecordUrl(APP_IDS.GEWOHNHEITEN_VERWALTUNG, v) }))}
            >
              <SelectTrigger id="gewohnheit"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
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
            <Label htmlFor="ausgefuehrt">Gewohnheit heute ausgeführt?</Label>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="ausgefuehrt"
                checked={!!fields.ausgefuehrt}
                onCheckedChange={(v) => setFields(f => ({ ...f, ausgefuehrt: !!v }))}
              />
              <Label htmlFor="ausgefuehrt" className="font-normal">Gewohnheit heute ausgeführt?</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="investierte_zeit_minuten">Investierte Zeit (in Minuten)</Label>
            <Input
              id="investierte_zeit_minuten"
              type="number"
              value={fields.investierte_zeit_minuten ?? ''}
              onChange={e => setFields(f => ({ ...f, investierte_zeit_minuten: e.target.value ? Number(e.target.value) : undefined }))}
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