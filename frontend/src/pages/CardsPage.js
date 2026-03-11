import React, { useEffect, useState } from 'react';
import { getCards, createCard, updateCard, deleteCard, getCategories, createTransaction } from '@/lib/api';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, CreditCard, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import { CARD_BRANDS } from '@/components/lists';

const COLORS = ['#0F172A', '#059669', '#0EA5E9', '#D97706', '#DC2626', '#8B5CF6'];

const CardsPage = () => {
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    credit_limit: '',
    closing_day: 1,
    due_day: 10,
    color: '#0F172A'
  });
  const [expenseData, setExpenseData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    card_id: '',
    category_id: 'none',
    installments: 1
  });

  const findBrand = (brand) => {
    const normalized = String(brand || '').toLowerCase().trim();
    if (!normalized) return null;
    return (
      CARD_BRANDS.find((item) => item.value === normalized) ||
      CARD_BRANDS.find((item) => item.label.toLowerCase() === normalized) ||
      null
    );
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const [cardsRes, categoriesRes] = await Promise.all([
        getCards(),
        getCategories()
      ]);
      setCards(cardsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar cartoes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.brand) {
      toast.error('Selecione uma bandeira');
      return;
    }
    try {
      const data = {
        ...formData,
        credit_limit: parseCurrencyInput(formData.credit_limit),
        closing_day: parseInt(formData.closing_day, 10),
        due_day: parseInt(formData.due_day, 10)
      };

      if (editingCard) {
        await updateCard(editingCard.id, data);
        toast.success('Cartao atualizado com sucesso!');
      } else {
        await createCard(data);
        toast.success('Cartao criado com sucesso!');
      }
      await fetchCards();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar cartao');
    }
  };

  const handleCreateCardExpense = async (e) => {
    e.preventDefault();
    try {
      await createTransaction({
        amount: parseCurrencyInput(expenseData.amount),
        description: expenseData.description,
        transaction_type: 'expense',
        date: new Date(expenseData.date).toISOString(),
        category_id: expenseData.category_id === 'none' ? null : expenseData.category_id,
        account_id: null,
        card_id: expenseData.card_id,
        installment_total: parseInt(expenseData.installments, 10)
      });

      toast.success('Despesa no cartao criada com sucesso!');
      await fetchCards();
      closeExpenseModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar despesa no cartao');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este cartao?')) return;
    try {
      await deleteCard(id);
      toast.success('Cartao excluido com sucesso!');
      await fetchCards();
    } catch (error) {
      toast.error('Erro ao excluir cartao');
    }
  };

  const handleEdit = (card) => {
    const cardBrand = findBrand(card.brand);
    setEditingCard(card);
    setFormData({
      name: card.name,
      brand: cardBrand?.value || '',
      credit_limit: formatCurrency(card.credit_limit),
      closing_day: card.closing_day,
      due_day: card.due_day,
      color: card.color
    });
    setOpen(true);
  };

  const openExpenseModal = (card = null) => {
    setExpenseData({
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      card_id: card?.id || '',
      category_id: 'none',
      installments: 1
    });
    setExpenseOpen(true);
  };

  const closeExpenseModal = () => {
    setExpenseOpen(false);
    setExpenseData({
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      card_id: '',
      category_id: 'none',
      installments: 1
    });
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCard(null);
    setFormData({
      name: '',
      brand: '',
      credit_limit: '',
      closing_day: 1,
      due_day: 10,
      color: '#0F172A'
    });
  };

  return (
    <div className="space-y-8" data-testid="cards-page">
      <section className="rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card/95 to-primary/10 p-6 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Cartoes de Credito</h1>
            <p className="mt-2 text-muted-foreground" style={{ fontFamily: '"Public Sans", sans-serif' }}>Gerencie cartoes e faturas</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => openExpenseModal()}>
              <ReceiptText className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-card-button">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cartao
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="card-dialog-description">
                <DialogHeader>
                  <DialogTitle>{editingCard ? 'Editar Cartao' : 'Novo Cartao'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Cartao</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Nubank" data-testid="card-name-input" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Bandeira</Label>
                    <Select value={formData.brand} onValueChange={(value) => setFormData({ ...formData, brand: value })}>
                      <SelectTrigger id="brand" data-testid="card-brand-input">
                        {(() => {
                          const selectedBrand = findBrand(formData.brand);
                          if (!selectedBrand) return <SelectValue placeholder="Selecione a bandeira" />;
                          return (
                            <div className="flex items-center gap-2">
                              {selectedBrand.icon ? (
                                <img src={selectedBrand.icon} alt={selectedBrand.label} className="h-5 w-8 object-contain" />
                              ) : (
                                <span className="text-xs text-muted-foreground">Sem logo</span>
                              )}
                              <span>{selectedBrand.label}</span>
                            </div>
                          );
                        })()}
                      </SelectTrigger>
                      <SelectContent>
                        {CARD_BRANDS.map((brand) => (
                          <SelectItem key={brand.value} value={brand.value}>
                            <div className="flex items-center gap-2">
                              {brand.icon ? (
                                <img src={brand.icon} alt={brand.label} className="h-5 w-8 object-contain" />
                              ) : (
                                <span className="text-xs text-muted-foreground">Sem logo</span>
                              )}
                              <span>{brand.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credit_limit">Limite de Credito</Label>
                    <Input
                      id="credit_limit"
                      type="text"
                      inputMode="numeric"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: formatCurrencyInput(e.target.value) })}
                      placeholder="R$ 0,00"
                      data-testid="card-limit-input"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="closing_day">Dia de Fechamento</Label>
                      <Input id="closing_day" type="number" min="1" max="31" value={formData.closing_day} onChange={(e) => setFormData({ ...formData, closing_day: e.target.value })} data-testid="card-closing-input" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="due_day">Dia de Vencimento</Label>
                      <Input id="due_day" type="number" min="1" max="31" value={formData.due_day} onChange={(e) => setFormData({ ...formData, due_day: e.target.value })} data-testid="card-due-input" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex gap-2">
                      {COLORS.map((color) => (
                        <button key={color} type="button" className="h-8 w-8 rounded-full border-2 transition-all" style={{ backgroundColor: color, borderColor: formData.color === color ? '#059669' : 'transparent' }} onClick={() => setFormData({ ...formData, color })} />
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
                    <Button type="submit" data-testid="save-card-button">{editingCard ? 'Atualizar' : 'Criar'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
              <DialogContent className="max-w-md" aria-describedby="card-expense-dialog-description">
                <DialogHeader>
                  <DialogTitle>Nova Despesa no Cartao</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCardExpense} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense-card">Cartao</Label>
                    <Select value={expenseData.card_id} onValueChange={(value) => setExpenseData({ ...expenseData, card_id: value })}>
                      <SelectTrigger id="expense-card">
                        <SelectValue placeholder="Selecione um cartao" />
                      </SelectTrigger>
                      <SelectContent>
                        {cards.map((card) => (
                          <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense-amount">Valor</Label>
                    <Input
                      id="expense-amount"
                      type="text"
                      inputMode="numeric"
                      value={expenseData.amount}
                      onChange={(e) => setExpenseData({ ...expenseData, amount: formatCurrencyInput(e.target.value) })}
                      placeholder="R$ 0,00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense-description">Descricao</Label>
                    <Input id="expense-description" value={expenseData.description} onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })} placeholder="Ex: Compra de supermercado" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense-date">Data</Label>
                    <Input id="expense-date" type="date" value={expenseData.date} onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense-installments">Parcelas</Label>
                    <Input id="expense-installments" type="number" min="1" value={expenseData.installments} onChange={(e) => setExpenseData({ ...expenseData, installments: e.target.value })} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense-category">Categoria (opcional)</Label>
                    <Select value={expenseData.category_id} onValueChange={(value) => setExpenseData({ ...expenseData, category_id: value })}>
                      <SelectTrigger id="expense-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem categoria</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={closeExpenseModal}>Cancelar</Button>
                    <Button type="submit" disabled={!expenseData.card_id}>Criar despesa</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <Card key={`card-skeleton-${idx}`}>
              <CardHeader className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))
        ) : cards.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">Nenhum cartao cadastrado</p>
              <Button onClick={() => setOpen(true)} data-testid="empty-state-add-button">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Cartao
              </Button>
            </CardContent>
          </Card>
        ) : (
          cards.map((card) => {
            const usagePercent = (card.used_limit / card.credit_limit) * 100;
            const brand = findBrand(card.brand);
            return (
              <Card key={card.id} className="relative overflow-hidden" data-testid={`card-item-${card.id}`}>
                {/* <div className="absolute right-0 top-0 h-32 w-32 opacity-10" style={{ backgroundColor: card.color }} /> */}
                <CardHeader className="relative z-10 flex flex-row items-start justify-between space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {brand ? (
                        <>
                          {brand.icon ? (
                            <img src={brand.icon} alt={brand.label} className="h-4 w-6 object-contain" />
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Sem logo</span>
                          )}
                          <span>{brand.label}</span>
                        </>
                      ) : (
                        <span>{card.brand}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openExpenseModal(card)} title="Nova despesa">
                      <ReceiptText className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(card)} data-testid={`edit-card-${card.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(card.id)} data-testid={`delete-card-${card.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Limite Utilizado</p>
                      <p className="font-mono text-2xl font-bold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{formatCurrency(card.used_limit)}</p>
                      <p className="font-mono text-sm text-muted-foreground" style={{ fontFamily: '"JetBrains Mono", monospace' }}>de {formatCurrency(card.credit_limit)}</p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(usagePercent, 100)}%`, backgroundColor: usagePercent > 80 ? '#DC2626' : card.color }} />
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                      <span>Fecha dia {card.closing_day}</span>
                      <span>Vence dia {card.due_day}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CardsPage;
