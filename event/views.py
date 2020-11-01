"""Event views"""
from django.views import generic
from rest_framework import generics

from .models import (
    Event, EventField, IPv4Nature, UrlNature, IntegerNature, ListNature, DictNature, NestedNature
)
from .serializers import (
    EventFieldSerializer, EventSerializer, IPv4NatureSerializer,
    UrlNatureSerializer, IntegerNatureSerializer, ListNatureSerializer,
    DictNatureSerializer, NestedNatureSerializer
)

# pylint: disable=no-member,too-many-ancestors


class EventListCreate(generics.ListCreateAPIView):
    """List and create events"""

    queryset = Event.objects.all()
    serializer_class = EventSerializer


class EventDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete events"""

    queryset = Event.objects.all()
    serializer_class = EventSerializer


class EventFieldListCreate(generics.ListCreateAPIView):
    """List and create event fields"""

    queryset = EventField.objects.select_related().all()
    serializer_class = EventFieldSerializer


class EventFieldDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete event fields"""

    queryset = EventField.objects.all()
    serializer_class = EventFieldSerializer

class IPv4NatureListCreate(generics.ListCreateAPIView):
    """List and create IPv4Nature"""

    queryset = IPv4Nature.objects.select_related().all()
    serializer_class = IPv4NatureSerializer


class IPv4NatureDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete IPv4Nature"""

    queryset = IPv4Nature.objects.all()
    serializer_class = IPv4NatureSerializer


class UrlNatureListCreate(generics.ListCreateAPIView):
    """List and create UrlNature"""

    queryset = UrlNature.objects.select_related().all()
    serializer_class = UrlNatureSerializer


class UrlNatureDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete UrlNature"""

    queryset = UrlNature.objects.all()
    serializer_class = UrlNatureSerializer


class IntegerNatureListCreate(generics.ListCreateAPIView):
    """List and create IntegerNature"""

    queryset = IntegerNature.objects.select_related().all()
    serializer_class = IntegerNatureSerializer


class IntegerNatureDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete IntegerNature"""

    queryset = IntegerNature.objects.all()
    serializer_class = IntegerNatureSerializer


class ListNatureListCreate(generics.ListCreateAPIView):
    """List and create ListNature"""

    queryset = ListNature.objects.select_related().all()
    serializer_class = ListNatureSerializer


class ListNatureDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete ListNature"""

    queryset = ListNature.objects.all()
    serializer_class = ListNatureSerializer


class DictNatureListCreate(generics.ListCreateAPIView):
    """List and create DictNature"""

    queryset = DictNature.objects.select_related().all()
    serializer_class = DictNatureSerializer


class DictNatureDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete DictNature"""

    queryset = DictNature.objects.all()
    serializer_class = DictNatureSerializer


class NestedNatureListCreate(generics.ListCreateAPIView):
    """List and create NestedNature"""

    queryset = NestedNature.objects.select_related().all()
    serializer_class = NestedNatureSerializer


class NestedNatureDetail(generics.RetrieveUpdateDestroyAPIView):
    """Get Update and delete NestedNature"""

    queryset = NestedNature.objects.all()
    serializer_class = NestedNatureSerializer


class IndexView(generic.ListView):
    """Show all events"""

    template_name = "event/index.html"
    context_object_name = "events"

    def get_queryset(self):
        """Return all events"""
        return Event.objects.order_by("name")


class ShowView(generic.DetailView):
    """Show event"""

    model = Event
    template_name = "event/show.html"


class EditView(generic.DetailView):
    """Edit event"""

    model = Event
    template_name = "event/edit.html"
