import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CartItem } from '../models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:8000/cart';

  constructor(private http: HttpClient) {}

  getCart(): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(`${this.apiUrl}/`);
  }

  addToCart(productId: number): Observable<CartItem> {
    return this.http.post<CartItem>(`${this.apiUrl}/${productId}`, {});
  }

  removeFromCart(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${productId}`);
  }
}
