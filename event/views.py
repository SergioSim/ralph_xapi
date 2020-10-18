"""Event views"""
from django.db import IntegrityError
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views import generic
from rest_framework import generics

from .models import Event
from .serializers import EventSerializer

# Create your views here.

class EventListCreate(generics.ListCreateAPIView):
    """List and create events"""
    queryset = Event.objects.all()
    serializer_class = EventSerializer

class IndexView(generic.ListView):
    """Show all events"""
    template_name = 'event/index.html'
    context_object_name = 'events'

    def get_queryset(self):
        """Return all events"""
        return Event.objects.order_by('name')

class ShowView(generic.DetailView):
    """Show event"""
    model = Event
    template_name = 'event/show.html'

class EditView(generic.DetailView):
    """Edit event"""
    model = Event
    template_name = 'event/edit.html'

def create(request):
    """Show event creation page"""
    events = Event.objects.order_by('name')
    context = {"events": events}
    return render(request, 'event/create.html', context)

# def update(request, event_id):
#     """Update existing event"""
#     return HttpResponse("You're updating an existing event %s." % event_id)

def store(request):
    """Store new event"""
    data = request.POST
    try:
        event = Event(name=data['name'], description=data['description'])
        event.save()
    except (KeyError, IntegrityError):
        return render(request, 'event/create.html', {"error_message": "Shit happens, try again..."})
    return HttpResponseRedirect(reverse('event:show', args=(event.id,)))
