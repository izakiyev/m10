from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Product, Order, Balance , Card

admin.site.register(Product)
admin.site.register(Order)
admin.site.register(Balance)
admin.site.register(Card)
