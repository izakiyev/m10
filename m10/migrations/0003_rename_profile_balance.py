# Generated by Django 4.2.13 on 2024-06-27 22:10

from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('m10', '0002_profile'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Profile',
            new_name='Balance',
        ),
    ]
