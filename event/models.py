"""Event Model"""

from django.core.exceptions import ValidationError
from django.db import models

class Event(models.Model):
    """Event model used to create Marshmallow converter"""
    name = models.CharField(max_length=200, unique=True, blank=False)
    description = models.TextField()
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True)
    created = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        """Check name not empty before save"""
        if not self.name:
            raise ValidationError("Field may not be empty")
        super().save(self, *args, **kwargs)

    def __str__(self):
        return f"{self.id}-{self.name}"


class EventField(models.Model):
    """Event Field class"""

    class EventNature(models.TextChoices):
        """Event Nature class"""

        FIELD    = "Field",    "Field"
        NESTED   = "Nested",   "Nested"
        DICT     = "Dict",     "Dict"
        LIST     = "List",     "List"
        STRING   = "String",   "String"
        UUID     = "UUID",     "UUID"
        INTEGER  = "Integer",  "Integer"
        BOOLEAN  = "Boolean",  "Boolean"
        DATETIME = "DateTime", "DateTime"
        URL      = "Url",      "Url"
        EMAIL    = "Email",    "Email"
        IPV4     = "IPv4",     "IPv4"

    event_id = models.ForeignKey(Event, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    nature = models.CharField(max_length=10, choices=EventNature.choices)
    nature_id = models.IntegerField()
    description = models.TextField()
    required = models.BooleanField(default=True)
    allow_none = models.BooleanField(default=False)
    # TODO: add validate field

    def __str__(self):
        return f"{self.event_id}-{self.name}"

class NestedNature(models.Model):
    event_id = models.ForeignKey(Event, on_delete=models.CASCADE)
    exclude = models.CharField(max_length=200)

class DictNature(models.Model):
    keys = models.ForeignKey(EventField, on_delete=models.CASCADE, null=True,  blank=True, related_name='key')
    values = models.ForeignKey(EventField, on_delete=models.CASCADE, null=True,  blank=True, related_name='val')

class ListNature(models.Model):
    eventField = models.ForeignKey(EventField, on_delete=models.CASCADE, null=True, blank=True)

class IntegerNature(models.Model):
    strict = models.BooleanField(default=True)

class UrlNature(models.Model):
    relative = models.BooleanField(default=True)

class IPv4Nature(models.Model):
    exploded = models.BooleanField(default=True)