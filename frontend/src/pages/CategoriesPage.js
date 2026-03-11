import React, { useEffect, useState } from 'react';
import { createCategory, deleteCategory, getCategories, updateCategory } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Banknote,
  Briefcase,
  Car,
  Folder,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  House,
  Pencil,
  Plus,
  ReceiptText,
  ShoppingCart,
  Trash2,
  Utensils
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COLORS = ['#059669', '#0EA5E9', '#D97706', '#DC2626', '#0F172A', '#8B5CF6', '#64748B'];
const ICON_OPTIONS = [
  { value: 'utensils', label: 'Alimentacao', Icon: Utensils },
  { value: 'home', label: 'Casa', Icon: House },
  { value: 'car', label: 'Transporte', Icon: Car },
  { value: 'gamepad-2', label: 'Lazer', Icon: Gamepad2 },
  { value: 'heart-pulse', label: 'Saude', Icon: HeartPulse },
  { value: 'graduation-cap', label: 'Educacao', Icon: GraduationCap },
  { value: 'shopping-cart', label: 'Compras', Icon: ShoppingCart },
  { value: 'briefcase', label: 'Trabalho', Icon: Briefcase },
  { value: 'banknote', label: 'Financeiro', Icon: Banknote },
  { value: 'receipt-text', label: 'Contas', Icon: ReceiptText },
  { value: 'folder', label: 'Outros', Icon: Folder }
];

const iconMap = Object.fromEntries(ICON_OPTIONS.map((item) => [item.value, item.Icon]));
const iconLabelMap = Object.fromEntries(ICON_OPTIONS.map((item) => [item.value, item.label]));

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'folder',
    color: '#059669'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await getCategories();
      setCategories(response.data || []);
    } catch (error) {
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      icon: 'folder',
      color: '#059669'
    });
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      icon: category.icon || 'folder',
      color: category.color || '#059669'
    });
    setOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        name: formData.name,
        icon: formData.icon || 'folder',
        color: formData.color || '#059669'
      };
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await createCategory(payload);
        toast.success('Categoria criada com sucesso!');
      }
      await fetchCategories();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar categoria');
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) return;
    try {
      await deleteCategory(category.id);
      toast.success('Categoria excluida com sucesso!');
      await fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao excluir categoria');
    }
  };

  const getCategoryIcon = (iconKey) => iconMap[iconKey] || Folder;

  return (
    <div className="space-y-8" data-testid="categories-page">
      <section className="rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card/95 to-primary/10 p-6 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Categorias</h1>
            <p className="mt-2 text-muted-foreground" style={{ fontFamily: '"Public Sans", sans-serif' }}>Gerencie categorias para organizar suas transacoes</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-category-button">
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="category-dialog-description">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Alimentacao"
                    data-testid="category-name-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Icone</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {ICON_OPTIONS.map((item) => {
                      const IconComponent = item.Icon;
                      const isSelected = formData.icon === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          title={item.label}
                          onClick={() => setFormData({ ...formData, icon: item.value })}
                          data-testid={`category-icon-option-${item.value}`}
                          className={cn(
                            'flex h-11 w-full items-center justify-center rounded-md border transition-all',
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border/70 bg-card text-muted-foreground hover:bg-muted/40'
                          )}
                        >
                          <IconComponent className="h-5 w-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="h-8 w-8 rounded-full border-2 transition-all"
                        style={{ backgroundColor: color, borderColor: formData.color === color ? '#0F172A' : 'transparent' }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
                  <Button type="submit" data-testid="save-category-button">{editingCategory ? 'Atualizar' : 'Criar'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <Card key={`category-skeleton-${idx}`}>
              <CardHeader className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))
        ) : categories.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Folder className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">Nenhuma categoria cadastrada</p>
              <Button onClick={() => setOpen(true)} data-testid="empty-state-add-category-button">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeira Categoria
              </Button>
            </CardContent>
          </Card>
        ) : (
          categories.map((category) => (
            <Card key={category.id} data-testid={`category-card-${category.id}`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color || '#64748B' }} />
                  <div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const CategoryIcon = getCategoryIcon(category.icon);
                        return <CategoryIcon className="h-4 w-4 text-muted-foreground" />;
                      })()}
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Icone: {iconLabelMap[category.icon] || category.icon || 'Outros'}
                    </p>
                    {category.is_default && (
                      <p className="mt-1 text-xs font-medium text-primary">Categoria padrao</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(category)} data-testid={`edit-category-${category.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(category)} data-testid={`delete-category-${category.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
