"""Event views"""
from django.views import generic
from rest_framework import generics

from .models import Event, EventField, IPv4Nature
from .serializers import EventFieldSerializer, EventSerializer, IPv4NatureSerializer

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
