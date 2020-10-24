"""Event Model"""

from django.core.exceptions import ValidationError
from django.db import models

# pylint: disable=signature-differs,arguments-differ,no-member,too-few-public-methods


class Event(models.Model):
    """Event model used to create Marshmallow converter"""

    name = models.CharField(max_length=200, unique=True, blank=False)
    description = models.TextField()
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True)
    validate_schema = models.TextField(null=True, blank=True)
    created = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        """Check name not empty before save"""
        if not self.name:
            raise ValidationError("Field may not be empty")
        super(Event, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.id}-{self.name}"


class EventField(models.Model):
    """Event Field class"""

    class Meta:
        """Indexes"""

        indexes = [
            models.Index(fields=["event", "name"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["event", "name"], name="unique_id_name"),
        ]

    class EventNature(models.TextChoices):
        """Event Nature class"""

        FIELD = "Field", "Field"
        NESTED = "Nested", "Nested"
        DICT = "Dict", "Dict"
        LIST = "List", "List"
        STRING = "String", "String"
        UUID = "UUID", "UUID"
        INTEGER = "Integer", "Integer"
        BOOLEAN = "Boolean", "Boolean"
        DATETIME = "DateTime", "DateTime"
        URL = "Url", "Url"
        EMAIL = "Email", "Email"
        IPV4 = "IPv4", "IPv4"

    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    nature = models.CharField(max_length=10, choices=EventNature.choices)
    # TODO: make database condition - if special field - nature_id may not be null!
    # We can't have List event fields not having the corresponding event_field type!
    nature_id = models.IntegerField(null=True, blank=True)
    description = models.TextField()
    required = models.BooleanField(default=True)
    allow_none = models.BooleanField(default=False)
    validate = models.TextField(null=True, blank=True)
    excluded = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.event}-{self.name}-{self.nature}-{self.nature_id}"


# Polymorphic relationship may introduce performance issues, can we do better?


class NestedNature(models.Model):
    """Represents marshmallow.fields.Nested class"""

    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    exclude = models.CharField(max_length=200)


class DictNature(models.Model):
    """Represents marshmallow.fields.Dict class"""

    keys = models.ForeignKey(
        EventField, on_delete=models.CASCADE, null=True, blank=True, related_name="key"
    )
    values = models.ForeignKey(
        EventField, on_delete=models.CASCADE, null=True, blank=True, related_name="val"
    )


class ListNature(models.Model):
    """Represents marshmallow.fields.List class"""

    event_field = models.ForeignKey(
        EventField, on_delete=models.CASCADE, null=True, blank=True
    )


class IntegerNature(models.Model):
    """Represents marshmallow.fields.Integer class"""

    strict = models.BooleanField(default=True)


class UrlNature(models.Model):
    """Represents marshmallow.fields.Url class"""

    relative = models.BooleanField(default=True)


class IPv4Nature(models.Model):
    """Represents marshmallow.fields.IPv4 class"""

    exploded = models.BooleanField(default=True)
