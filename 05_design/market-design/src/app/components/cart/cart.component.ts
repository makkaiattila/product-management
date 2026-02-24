import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem } from '../../models/cart-item.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  @Input() cartItems: CartItem[] = [];
  @Output() remove = new EventEmitter<number>();

  get totalPrice(): number {
    return this.cartItems.reduce((sum, item) => sum + item.product_price * item.quantity, 0);
  }

  get totalCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }
}
