import React, { useEffect, useMemo, useState } from 'react';
import { getRecurring, createRecurring, updateRecurring, deleteRecurring, getAccounts, getCategories } from '@/lib/api';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Repeat } from 'lucide-react';
import { toast } from 'sonner';

const RecurringPage = () => {
  const [recurring, setRecurring] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    recurrence_type: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    category_id: '',
    account_id: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, accRes, catRes] = await Promise.all([
        getRecurring(),
        getAccounts(),
        getCategories()
      ]);
      setRecurring(recRes.data);
      setAccounts(accRes.data);
      setCategories(catRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecurring) {
        await updateRecurring(editingRecurring.id, { is_active: formData.is_active });
        toast.success('Despesa recorrente atualizada!');
      } else {
        const data = {
          ...formData,
          amount: parseCurrencyInput(formData.amount),
          start_date: new Date(formData.start_date).toISOString(),
          category_id: formData.category_id || null,
          account_id: formData.account_id || null
        };
        await createRecurring(data);
        toast.success('Despesa recorrente criada!');
      }
      await fetchData();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar despesa recorrente');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa recorrente?')) return;
    try {
      await deleteRecurring(id);
      toast.success('Despesa recorrente excluida!');
      await fetchData();
    } catch (error) {
      toast.error('Erro ao excluir despesa recorrente');
    }
  };

  const handleToggleActive = async (rec) => {
    try {
      await updateRecurring(rec.id, { is_active: !rec.is_active });
      toast.success(`Despesa ${!rec.is_active ? 'ativada' : 'pausada'}!`);
      await fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleEdit = (rec) => {
    setEditingRecurring(rec);
    setFormData({
      amount: formatCurrency(rec.amount),
      description: rec.description,
      recurrence_type: rec.recurrence_type,
      start_date: new Date(rec.start_date).toISOString().split('T')[0],
      category_id: rec.category_id || '',
      account_id: rec.account_id || '',
      is_active: rec.is_active
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingRecurring(null);
    setFormData({
      amount: '',
      description: '',
      recurrence_type: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      category_id: '',
      account_id: '',
      is_active: true
    });
  };

  const categoryMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);

  const getRecurrenceLabel = (type) => ({ weekly: 'Semanal', monthly: 'Mensal', yearly: 'Anual' }[type] || type);

  return (
    <div className="space-y-8" data-testid="recurring-page">
      <section className="rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card/95 to-primary/10 p-6 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Despesas Recorrentes</h1>
            <p className="mt-2 text-muted-foreground" style={{ fontFamily: '"Public Sans", sans-serif' }}>Gerencie despesas fixas sem travar a tela</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-recurring-button">
                <Plus className="mr-2 h-4 w-4" />
                Nova Despesa Recorrente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto" aria-describedby="recurring-dialog-description">
              <DialogHeader>
                <DialogTitle>{editingRecurring ? 'Editar Despesa' : 'Nova Despesa Recorrente'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input id="amount" type="text" inputMode="numeric" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: formatCurrencyInput(e.target.value) })} placeholder="R$ 0,00" data-testid="recurring-amount-input" disabled={!!editingRecurring} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descricao</Label>
                  <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: Aluguel" data-testid="recurring-description-input" disabled={!!editingRecurring} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrence_type">Frequencia</Label>
                  <Select value={formData.recurrence_type} onValueChange={(value) => setFormData({ ...formData, recurrence_type: value })} disabled={!!editingRecurring}>
                    <SelectTrigger data-testid="recurrence-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Inicio</Label>
                  <Input id="start_date" type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} data-testid="recurring-start-date-input" disabled={!!editingRecurring} required />
                </div>

                {!editingRecurring && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="category_id">Categoria</Label>
                      <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                        <SelectTrigger data-testid="recurring-category-select">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account_id">Conta (opcional)</Label>
                      <Select value={formData.account_id || 'none'} onValueChange={(value) => setFormData({ ...formData, account_id: value === 'none' ? '' : value })}>
                        <SelectTrigger data-testid="recurring-account-select">
                          <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {editingRecurring && (
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <Label htmlFor="is_active">Ativo</Label>
                    <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} data-testid="recurring-active-switch" />
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
                  <Button type="submit" data-testid="save-recurring-button">{editingRecurring ? 'Atualizar' : 'Criar'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <Card key={`rec-skeleton-${idx}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : recurring.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Repeat className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">Nenhuma despesa recorrente cadastrada</p>
              <Button onClick={() => setOpen(true)} data-testid="empty-state-add-button">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeira Despesa
              </Button>
            </CardContent>
          </Card>
        ) : (
          recurring.map((rec) => (
            <Card key={rec.id} data-testid={`recurring-${rec.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Repeat className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-lg font-semibold">{rec.description}</p>
                        <span className={`rounded-full px-2 py-1 text-xs ${rec.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {rec.is_active ? 'Ativo' : 'Pausado'}
                        </span>
                      </div>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span>{getRecurrenceLabel(rec.recurrence_type)}</span>
                        <span>•</span>
                        <span>{categoryMap[rec.category_id] || 'Sem categoria'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-mono text-2xl font-bold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{formatCurrency(rec.amount)}</p>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleToggleActive(rec)} data-testid={`toggle-recurring-${rec.id}`}>
                        <Switch checked={rec.is_active} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(rec)} data-testid={`edit-recurring-${rec.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(rec.id)} data-testid={`delete-recurring-${rec.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RecurringPage;

