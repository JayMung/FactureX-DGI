"use client";

import React, { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '../hooks/use-page-setup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  Barcode,
  Percent,
  X,
  Check,
} from 'lucide-react';
import { useArticles } from '@/hooks/useArticles';
import type { Article } from '@/types';
import { showSuccess, showError } from '@/utils/toast';
import PaginationCustom from '@/components/ui/pagination-custom';

const TVA_GROUPS = [
  { value: 'A', label: 'Groupe A (0%)', description: 'Produits de première nécessité' },
  { value: 'B', label: 'Groupe B (10%)', description: 'Produits intermédiaires' },
  { value: 'C', label: 'Groupe C (16%)', description: 'Produits standard (TVA 16%)' },
];

const PAGE_SIZE = 20;

interface ArticleForm {
  denomination: string;
  code_barres: string;
  prix: number;
  groupe_tva: 'A' | 'B' | 'C';
  stock?: number;
}

const defaultForm: ArticleForm = {
  denomination: '',
  code_barres: '',
  prix: 0,
  groupe_tva: 'C',
  stock: undefined,
};

export default function Articles() {
  usePageSetup({
    title: 'Articles',
    subtitle: 'Gérez votre catalogue de produits et services',
  });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [form, setForm] = useState<ArticleForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { articles, totalCount, isLoading, createArticle, updateArticle, deleteArticle, isCreating, isUpdating, isDeleting } = useArticles(page, search);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleOpenNew = () => {
    setEditingArticle(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (article: Article) => {
    setEditingArticle(article);
    setForm({
      denomination: article.denomination,
      code_barres: article.code_barres || '',
      prix: article.prix,
      groupe_tva: article.groupe_tva,
      stock: (article as any).stock,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.denomination.trim()) {
      showError('La désignation est requise');
      return;
    }
    if (form.prix < 0) {
      showError('Le prix doit être positif');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        denomination: form.denomination.trim(),
        code_barres: form.code_barres.trim() || null,
        prix: form.prix,
        groupe_tva: form.groupe_tva,
        ...(form.stock !== undefined && { stock: form.stock }),
      };

      if (editingArticle) {
        await new Promise<void>((resolve, reject) => {
          updateArticle({ id: editingArticle.id, data: payload }, {
            onSuccess: () => resolve(),
            onError: (err: any) => reject(err),
          });
        });
      } else {
        await new Promise<void>((resolve, reject) => {
          createArticle(payload as any, {
            onSuccess: () => resolve(),
            onError: (err: any) => reject(err),
          });
        });
      }
      setDialogOpen(false);
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await new Promise<void>((resolve, reject) => {
        deleteArticle(deleteId, {
          onSuccess: () => resolve(),
          onError: (err: any) => reject(err),
        });
      });
      setDeleteId(null);
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getTvaBadge = (groupe: string) => {
    const map: Record<string, { label: string; className: string }> = {
      A: { label: '0%', className: 'bg-gray-100 text-gray-700 border-gray-200' },
      B: { label: '10%', className: 'bg-amber-50 text-amber-700 border-amber-100' },
      C: { label: '16%', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    };
    return map[groupe] || { label: groupe, className: 'bg-gray-100 text-gray-700' };
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {totalCount} article{totalCount !== 1 ? 's' : ''} dans le catalogue
            </p>
          </div>
          <Button
            onClick={handleOpenNew}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvel article
          </Button>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom ou code-barres..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            {search && (
              <span className="text-sm text-gray-500">
                {totalCount} résultat{totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* TVA Groups info */}
        <div className="grid grid-cols-3 gap-3">
          {TVA_GROUPS.map(g => (
            <div key={g.value} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-100">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                g.value === 'A' ? 'bg-gray-100 text-gray-600' :
                g.value === 'B' ? 'bg-amber-50 text-amber-600' :
                'bg-emerald-50 text-emerald-600'
              }`}>
                <Percent className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Groupe {g.value}</div>
                <div className="text-[10px] text-gray-500">{g.label.split('(')[1]?.replace(')', '') || g.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-bold text-gray-700">Désignation</TableHead>
                <TableHead className="font-bold text-gray-700">Code-barres</TableHead>
                <TableHead className="font-bold text-gray-700 text-right">Prix (USD)</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Groupe TVA</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : articles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Aucun article trouvé</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {search ? `Aucun résultat pour "${search}"` : 'Commencez par ajouter un article'}
                        </p>
                      </div>
                      {!search && (
                        <Button
                          onClick={handleOpenNew}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter un article
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                articles.map(article => {
                  const tvaBadge = getTvaBadge(article.groupe_tva);
                  return (
                    <TableRow key={article.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-emerald-500" />
                          </div>
                          <span className="font-medium text-gray-900">{article.denomination}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {article.code_barres ? (
                          <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100 text-gray-600">
                            {article.code_barres}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-sm italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900">
                        {article.prix.toFixed(2)} $
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${tvaBadge.className} border font-bold text-xs`}>
                          {tvaBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(article)}
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(article.id)}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <PaginationCustom
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? 'Modifier l\'article' : 'Nouvel article'}
            </DialogTitle>
            <DialogDescription>
              {editingArticle
                ? 'Modifiez les informations de l\'article.'
                : 'Ajoutez un nouveau produit ou service à votre catalogue.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Désignation */}
            <div className="space-y-2">
              <Label htmlFor="denomination">
                Désignation <span className="text-red-500">*</span>
              </Label>
              <Input
                id="denomination"
                value={form.denomination}
                onChange={e => setForm(f => ({ ...f, denomination: e.target.value }))}
                placeholder="Nom du produit ou service"
              />
            </div>

            {/* Code-barres */}
            <div className="space-y-2">
              <Label htmlFor="code_barres">Code-barres</Label>
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="code_barres"
                  value={form.code_barres}
                  onChange={e => setForm(f => ({ ...f, code_barres: e.target.value }))}
                  placeholder="Ex: 5901234123457"
                  className="pl-10 font-mono"
                />
              </div>
            </div>

            {/* Prix */}
            <div className="space-y-2">
              <Label htmlFor="prix">Prix unitaire (USD) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <Input
                  id="prix"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.prix || ''}
                  onChange={e => setForm(f => ({ ...f, prix: parseFloat(e.target.value) || 0 }))}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Groupe TVA */}
            <div className="space-y-2">
              <Label>Groupe TVA</Label>
              <div className="grid grid-cols-3 gap-2">
                {TVA_GROUPS.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, groupe_tva: g.value as 'A' | 'B' | 'C' }))}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      form.groupe_tva === g.value
                        ? g.value === 'A' ? 'border-gray-400 bg-gray-50' :
                          g.value === 'B' ? 'border-amber-400 bg-amber-50' :
                          'border-emerald-500 bg-emerald-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className={`text-sm font-bold ${
                      form.groupe_tva === g.value
                        ? g.value === 'A' ? 'text-gray-700' :
                          g.value === 'B' ? 'text-amber-700' :
                          'text-emerald-700'
                        : 'text-gray-500'
                    }`}>Groupe {g.value}</div>
                    <div className={`text-xs font-bold mt-0.5 ${
                      form.groupe_tva === g.value
                        ? g.value === 'A' ? 'text-gray-900' :
                          g.value === 'B' ? 'text-amber-900' :
                          'text-emerald-900'
                        : 'text-gray-400'
                    }`}>{g.label.split('(')[1]?.replace(')', '')}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock">Stock (optionnel)</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={form.stock ?? ''}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="Quantité en stock"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="gap-2">
              <X className="h-4 w-4" />
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {editingArticle ? 'Enregistrer' : 'Créer l\'article'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer l'article ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L'article sera définitivement supprimé du catalogue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
