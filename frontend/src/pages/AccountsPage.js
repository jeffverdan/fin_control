import React, { useEffect, useState } from 'react';
import { getAccounts, createAccount, updateAccount, deleteAccount, createTransaction } from '@/lib/api';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Wallet, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Conta Corrente' },
  { value: 'wallet', label: 'Carteira' },
  { value: 'savings', label: 'Poupanca' },
  { value: 'credit_card', label: 'Conta Cartão' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'investment', label: 'Investimentos' },
  { value: 'other', label: 'Outros' }
];

const COLORS = ['#059669', '#0EA5E9', '#D97706', '#DC2626', '#0F172A', '#8B5CF6'];

const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [adjustingAccount, setAdjustingAccount] = useState(null);
  const [adjustData, setAdjustData] = useState({
    targetBalance: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [formData, setFormData] = useState({
    name: '',
    account_type: 'checking',
    initial_balance: '',
    color: '#059669'
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await getAccounts();
      setAccounts(response.data);
    } catch (error) {
      toast.error('Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, {
          name: formData.name,
          account_type: formData.account_type,
          color: formData.color
        });
        toast.success('Conta atualizada com sucesso!');
      } else {
        await createAccount({
          ...formData,
          initial_balance: parseCurrencyInput(formData.initial_balance)
        });
        toast.success('Conta criada com sucesso!');
      }
      await fetchAccounts();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar conta');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;
    try {
      await deleteAccount(id);
      toast.success('Conta excluida com sucesso!');
      await fetchAccounts();
    } catch (error) {
      toast.error('Erro ao excluir conta');
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      account_type: account.account_type,
      initial_balance: formatCurrency(account.initial_balance),
      color: account.color
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingAccount(null);
    setFormData({
      name: '',
      account_type: 'checking',
      initial_balance: '',
      color: '#059669'
    });
  };

  const openAdjustModal = (account) => {
    setAdjustingAccount(account);
    setAdjustData({
      targetBalance: formatCurrency(account.current_balance ?? 0),
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setAdjustOpen(true);
  };

  const closeAdjustModal = () => {
    setAdjustOpen(false);
    setAdjustingAccount(null);
    setAdjustData({
      targetBalance: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    if (!adjustingAccount) return;

    const current = Number(adjustingAccount.current_balance || 0);
    const target = parseCurrencyInput(adjustData.targetBalance);
    const diff = Number((target - current).toFixed(2));

    if (diff === 0) {
      toast.info('Nenhum reajuste necessario');
      closeAdjustModal();
      return;
    }

    try {
      await createTransaction({
        amount: Math.abs(diff),
        description: adjustData.description?.trim() || `Reajuste de saldo - ${adjustingAccount.name}`,
        transaction_type: diff > 0 ? 'income' : 'expense',
        date: new Date(adjustData.date).toISOString(),
        account_id: adjustingAccount.id,
        category_id: '50ed9586-02b5-4130-a472-9b499a0607bf',
        card_id: null,
        installment_total: 1
      });

      toast.success('Reajuste lancado com sucesso!');
      await fetchAccounts();
      closeAdjustModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao lancar reajuste');
    }
  };

  return (
    <div className="space-y-8" data-testid="accounts-page">
      <section className="rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card/95 to-primary/10 p-6 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Contas</h1>
            <p className="mt-2 text-muted-foreground" style={{ fontFamily: '"Public Sans", sans-serif' }}>Gerencie contas bancarias e dinheiro</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-account-button">
                <Plus className="mr-2 h-4 w-4" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="account-dialog-description">
              <DialogHeader>
                <DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Conta</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Banco Inter" data-testid="account-name-input" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_type">Tipo de Conta</Label>
                  <Select value={formData.account_type} onValueChange={(value) => setFormData({ ...formData, account_type: value })}>
                    <SelectTrigger data-testid="account-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!editingAccount && (
                  <div className="space-y-2">
                    <Label htmlFor="initial_balance">Saldo Inicial</Label>
                    <Input
                      id="initial_balance"
                      type="text"
                      inputMode="numeric"
                      value={formData.initial_balance}
                      onChange={(e) => setFormData({ ...formData, initial_balance: formatCurrencyInput(e.target.value) })}
                      placeholder="R$ 0,00"
                      data-testid="account-balance-input"
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2">
                    {COLORS.map((color) => (
                      <button key={color} type="button" className="h-8 w-8 rounded-full border-2 transition-all" style={{ backgroundColor: color, borderColor: formData.color === color ? '#0F172A' : 'transparent' }} onClick={() => setFormData({ ...formData, color })} />
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
                  <Button type="submit" data-testid="save-account-button">{editingAccount ? 'Atualizar' : 'Criar'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
            <DialogContent aria-describedby="account-adjust-dialog-description">
              <DialogHeader>
                <DialogTitle>Reajustar Saldo Atual</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdjustBalance} className="space-y-4">
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm">
                  <p className="font-medium">{adjustingAccount?.name || 'Conta'}</p>
                  <p className="text-muted-foreground">
                    Saldo atual: {formatCurrency(Number(adjustingAccount?.current_balance || 0))}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-balance">Novo saldo atual</Label>
                  <Input
                    id="target-balance"
                    type="text"
                    inputMode="numeric"
                    value={adjustData.targetBalance}
                    onChange={(e) => setAdjustData({ ...adjustData, targetBalance: formatCurrencyInput(e.target.value) })}
                    placeholder="R$ 0,00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adjust-date">Data do reajuste</Label>
                  <Input
                    id="adjust-date"
                    type="date"
                    value={adjustData.date}
                    onChange={(e) => setAdjustData({ ...adjustData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adjust-description">Descricao (opcional)</Label>
                  <Input
                    id="adjust-description"
                    value={adjustData.description}
                    onChange={(e) => setAdjustData({ ...adjustData, description: e.target.value })}
                    placeholder="Ex: Conferencia de saldo no extrato"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={closeAdjustModal}>Cancelar</Button>
                  <Button type="submit">Lancar reajuste</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <Card key={`acc-skeleton-${idx}`}>
              <CardHeader className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))
        ) : accounts.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">Nenhuma conta cadastrada</p>
              <Button onClick={() => setOpen(true)} data-testid="empty-state-add-button">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeira Conta
              </Button>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card key={account.id} data-testid={`account-card-${account.id}`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: account.color }} />
                  <div>
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">{ACCOUNT_TYPES.find((t) => t.value === account.account_type)?.label}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openAdjustModal(account)}
                    title="Reajustar saldo"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(account)} data-testid={`edit-account-${account.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(account.id)} data-testid={`delete-account-${account.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo Atual</p>
                    <p className="font-mono text-2xl font-bold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{formatCurrency(account.current_balance)}</p>
                  </div>
                  <div className="border-t border-border pt-2">
                    <p className="text-xs text-muted-foreground">Saldo Inicial</p>
                    <p className="font-mono text-sm" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{formatCurrency(account.initial_balance)}</p>
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

export default AccountsPage;
