# Generated by Django 3.1.3 on 2020-11-03 07:41

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0002_auto_20201028_2243'),
    ]

    operations = [
        migrations.AlterField(
            model_name='nestednature',
            name='exclude',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AlterField(
            model_name='schemavalidate',
            name='event',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='event.event'),
        ),
        migrations.CreateModel(
            name='EventFieldTest',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('input_data', models.CharField(max_length=200)),
                ('input_nature', models.CharField(choices=[('Object', 'Object'), ('List', 'List'), ('String', 'String'), ('Number', 'Number'), ('Boolean', 'Boolean'), ('Null', 'Null')], max_length=10)),
                ('validation_exception', models.CharField(blank=True, max_length=200, null=True)),
                ('event_field', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='event.eventfield')),
            ],
        ),
    ]
