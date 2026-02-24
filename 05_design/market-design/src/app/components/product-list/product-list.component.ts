import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ProductFormDialogComponent } from '../product-form-dialog/product-form-dialog.component';
import { ProductDetailDialogComponent } from '../product-detail-dialog/product-detail-dialog.component';
import { DeleteConfirmDialogComponent } from '../delete-confirm-dialog/delete-confirm-dialog.component';

type DialogMode = 'add' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductCardComponent,
    ProductFormDialogComponent,
    ProductDetailDialogComponent,
    DeleteConfirmDialogComponent
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  searchQuery = '';
  dialogMode: DialogMode = null;
  selectedProduct: Product | null = null;
  loading = false;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get filteredProducts(): Product[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.products;
    return this.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  openAdd(): void {
    this.selectedProduct = null;
    this.dialogMode = 'add';
  }

  openEdit(product: Product): void {
    this.selectedProduct = product;
    this.dialogMode = 'edit';
  }

  openView(product: Product): void {
    this.selectedProduct = product;
    this.dialogMode = 'view';
  }

  openDelete(product: Product): void {
    this.selectedProduct = product;
    this.dialogMode = 'delete';
  }

  closeDialog(): void {
    this.dialogMode = null;
    this.selectedProduct = null;
  }

  onSave(data: Omit<Product, 'id'>): void {
    if (this.dialogMode === 'add') {
      this.productService.createProduct(data).subscribe({
        next: () => {
          this.closeDialog();
          this.loadProducts();
        }
      });
    } else if (this.dialogMode === 'edit' && this.selectedProduct) {
      this.productService.updateProduct(this.selectedProduct.id, data).subscribe({
        next: () => {
          this.closeDialog();
          this.loadProducts();
        }
      });
    }
  }

  onDeleteConfirm(): void {
    if (!this.selectedProduct) return;
    this.productService.deleteProduct(this.selectedProduct.id).subscribe({
      next: () => {
        this.closeDialog();
        this.loadProducts();
      }
    });
  }
}