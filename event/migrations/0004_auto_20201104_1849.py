# Generated by Django 3.1.3 on 2020-11-04 18:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0003_auto_20201103_0741'),
    ]

    operations = [
        migrations.AlterField(
            model_name='xapifield',
            name='event_fields',
            field=models.ManyToManyField(blank=True, to='event.EventField'),
        ),
    ]
