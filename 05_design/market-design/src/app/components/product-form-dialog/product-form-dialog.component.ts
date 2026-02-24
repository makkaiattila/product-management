import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form-dialog.component.html',
  styleUrl: './product-form-dialog.component.scss'
})
export class ProductFormDialogComponent implements OnInit {
  @Input() product: Product | null = null;
  @Output() save = new EventEmitter<Omit<Product, 'id'>>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;

  get isEdit(): boolean {
    return this.product !== null;
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.product?.name ?? '', Validators.required],
      description: [this.product?.description ?? '', Validators.required],
      price: [this.product?.price ?? null, [Validators.required, Validators.min(0)]],
      stock: [this.product?.stock ?? null, [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.close.emit();
    }
  }
}