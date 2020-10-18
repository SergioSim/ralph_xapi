from django.contrib import admin

from .models import (
    Event, EventField, NestedNature, DictNature, ListNature, IntegerNature, UrlNature, IPv4Nature
)
# Register your models here.

admin.site.register(Event)
admin.site.register(EventField)
admin.site.register(NestedNature)
admin.site.register(DictNature)
admin.site.register(ListNature)
admin.site.register(IntegerNature)
admin.site.register(UrlNature)
admin.site.register(IPv4Nature)
