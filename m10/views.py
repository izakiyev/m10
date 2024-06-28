from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Product, Order, Balance
from .serializers import ProductSerializer, OrderSerializer
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view
from django.shortcuts import render, redirect
from django.urls import reverse

def index(request):
    profile = Balance.objects.get(user=request.user)
    return render(request, 'index.html', {'profile': profile})

class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'barcode'

    def retrieve(self, request, barcode=None):
        queryset = self.get_queryset()
        product = get_object_or_404(queryset, barcode=barcode)
        serializer = self.get_serializer(product)
        return Response(serializer.data)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import Balance, Product, Order, Card
import json

@login_required
@require_POST
def pay_now(request):
    try:
        # Load JSON data from the request body
        data=request.body.decode('utf-8')
        data= json.loads(data)
        print(f"Received data: {data}")  # Debugging line

        total_amount_str = data.get('total_amount', '0')
        total_amount = float(total_amount_str)
        profile = get_object_or_404(Balance, user=request.user)

        if profile.balance >= total_amount:
            profile.balance -= total_amount
            profile.save()

            cart_items = data.get('cart_items', [])
            if not cart_items:
                return JsonResponse({"error": "No items in the cart."}, status=400)

            orders = []
            for item in cart_items:
                product = get_object_or_404(Product, barcode=item['barcode'])
                order = Order.objects.create(
                    user=request.user,
                    product=product,
                    quantity=item['quantity'],
                    total=item['total']
                )
                orders.append(order)

            print(f"Orders created: {orders}")  # Debugging line

            card = Card.objects.create(
                order=str(orders),
                total=total_amount
            )
            return JsonResponse({"success": True, "redirect_url": reverse('payment_success', args=[card.id])})
        else:
            return JsonResponse({"error": "Insufficient balance.", "success": False}, status=400)

    except json.JSONDecodeError as e:
        print(f"JSON decode error: {str(e)}")  # Debugging line
        return JsonResponse({"error": "Invalid JSON format."}, status=400)
    except Exception as e:
        print(f"Error: {str(e)}")  # Debugging line
        return JsonResponse({"error": str(e)}, status=500)

def payment_success(request, card_id):
    order = get_object_or_404(Card, id=card_id)
    return render(request, 'pay.html', {'card': order})

