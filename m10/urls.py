from django.urls import path
from .views import ProductDetailView, index,pay_now,payment_success

urlpatterns = [
    path('', index, name='index'),
    path('api/product/<str:barcode>/', ProductDetailView.as_view(), name='product-detail'),
    path('pay/', pay_now, name='pay_now'),
   path('pay/success/<int:card_id>/', payment_success, name='payment_success'),


]
