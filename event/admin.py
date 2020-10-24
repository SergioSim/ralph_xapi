"""Admin pages"""
from django.contrib import admin

from . import models

# Register your models here.

admin.site.register(models.Event)
admin.site.register(models.EventField)
admin.site.register(models.NestedNature)
admin.site.register(models.DictNature)
admin.site.register(models.ListNature)
admin.site.register(models.IntegerNature)
admin.site.register(models.UrlNature)
admin.site.register(models.IPv4Nature)
