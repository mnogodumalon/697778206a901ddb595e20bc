import { useState } from 'react';
import type { GewohnheitenVerwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { getTodayDate } from './utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export function AddEntryDialog({
  habits,
  open,
  onOpenChange,
  onSuccess,
}: {
  habits: GewohnheitenVerwaltung[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [selectedHabit, setSelectedHabit] = useState<string>('');
  const [completed, setCompleted] = useState(true);
  const [timeSpent, setTimeSpent] = useState<string>('30');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHabit) return;

    setSubmitting(true);
    try {
      await LivingAppsService.createTaeglicheEintraegeEntry({
        datum: getTodayDate(),
        gewohnheit: createRecordUrl(APP_IDS.GEWOHNHEITEN_VERWALTUNG, selectedHabit),
        ausgefuehrt: completed,
        investierte_zeit_minuten: parseInt(timeSpent) || 0,
      });

      setSelectedHabit('');
      setCompleted(true);
      setTimeSpent('30');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error('Failed to create entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eintrag hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="habit">Gewohnheit</Label>
            <Select value={selectedHabit} onValueChange={setSelectedHabit}>
              <SelectTrigger id="habit">
                <SelectValue placeholder="Wähle eine Gewohnheit..." />
              </SelectTrigger>
              <SelectContent>
                {habits.map(habit => (
                  <SelectItem key={habit.record_id} value={habit.record_id}>
                    {habit.fields.gewohnheit_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Investierte Zeit (Minuten)</Label>
            <div className="flex gap-2">
              {[15, 30, 45, 60].map(time => (
                <Button
                  key={time}
                  type="button"
                  variant={timeSpent === String(time) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeSpent(String(time))}
                >
                  {time}
                </Button>
              ))}
            </div>
            <Input
              id="time"
              type="number"
              min="0"
              value={timeSpent}
              onChange={e => setTimeSpent(e.target.value)}
              placeholder="Minuten"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="completed"
              checked={completed}
              onCheckedChange={(checked) => setCompleted(checked === true)}
            />
            <Label htmlFor="completed" className="cursor-pointer">
              Gewohnheit heute ausgeführt
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Abbrechen
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!selectedHabit || submitting}>
              {submitting ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
